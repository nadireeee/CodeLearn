import { Injectable, Logger } from '@nestjs/common';
import { AiService } from '../ai.service';

export interface CodeError {
  type: 'syntax' | 'semantic' | 'runtime' | 'logical' | 'style';
  line: number;
  column?: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
  suggestion?: string;
  fixedCode?: string;
}

export interface ErrorFix {
  error: CodeError;
  fix: string;
  explanation: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
}

@Injectable()
export class ErrorDetectionAgent {
  private readonly logger = new Logger(ErrorDetectionAgent.name);

  constructor(private readonly aiService: AiService) {}

  async detectErrors(
    code: string,
    language: 'c' | 'cpp',
    compilationOutput?: string,
    userId?: string
  ): Promise<CodeError[]> {
    try {
      const prompt = `Sen bir ${language.toUpperCase()} hata tespit uzmanısın.

Kod:
\`\`\`${language}
${code}
\`\`\`

${compilationOutput ? `Derleme çıktısı:\n${compilationOutput}\n` : ''}

Lütfen bu kodda olası hataları tespit et:

1. Syntax hataları (parantez, noktalı virgül, vs.)
2. Semantic hatalar (tip uyumsuzluğu, tanımlanmamış değişken)
3. Runtime hatalar (null pointer, array bounds)
4. Logical hatalar (yanlış algoritma, mantık hatası)
5. Style hatalar (kod standartları)

Her hata için:
- Hata tipi
- Satır numarası
- Açıklama
- Önem seviyesi (Error/Warning/Info)
- Düzeltme önerisi (opsiyonel)

Yanıt formatı:
**HATALAR:**
- [Tip] Satır X: Mesaj (Önem: Error/Warning/Info)
  Düzeltme: Önerilen düzeltme kodu`;

      const response = await this.aiService.generateResponse(prompt, userId || 'system');
      return this.parseErrors(response);
    } catch (error) {
      this.logger.error('Error detecting errors:', error);
      return [];
    }
  }

  async suggestErrorFixes(
    code: string,
    language: 'c' | 'cpp',
    errors: CodeError[],
    userId?: string
  ): Promise<ErrorFix[]> {
    try {
      const errorList = errors.map(err => 
        `- ${err.type} (Satır ${err.line}): ${err.message}`
      ).join('\n');

      const prompt = `Sen bir ${language.toUpperCase()} hata düzeltme uzmanısın.

Kod:
\`\`\`${language}
${code}
\`\`\`

Tespit edilen hatalar:
${errorList}

Lütfen her hata için düzeltme önerisi ver:

1. Düzeltilmiş kod parçası
2. Açıklama
3. Güven seviyesi (0-1)
4. Etki (Düşük/Orta/Yüksek)

Yanıt formatı:
**DÜZELTMELER:**
- Hata: [Hata açıklaması]
  Düzeltme: [Düzeltilmiş kod]
  Açıklama: [Açıklama]
  Güven: [0-1]
  Etki: [Düşük/Orta/Yüksek]`;

      const response = await this.aiService.generateResponse(prompt, userId || 'system');
      return this.parseErrorFixes(response, errors);
    } catch (error) {
      this.logger.error('Error suggesting fixes:', error);
      return [];
    }
  }

  async validateCode(
    code: string,
    language: 'c' | 'cpp',
    userId?: string
  ): Promise<{
    isValid: boolean;
    errors: CodeError[];
    warnings: CodeError[];
    suggestions: string[];
  }> {
    try {
      const prompt = `Sen bir ${language.toUpperCase()} kod doğrulama uzmanısın.

Kod:
\`\`\`${language}
${code}
\`\`\`

Lütfen bu kodu doğrula ve şunları kontrol et:

1. Syntax doğruluğu
2. Semantic doğruluk
3. Best practices
4. Potential issues
5. Performance concerns
6. Security vulnerabilities

Yanıt formatı:
**GEÇERLİ:** Evet/Hayır
**HATALAR:**
- [Tip] Satır X: Mesaj

**UYARILAR:**
- [Tip] Satır X: Mesaj

**ÖNERİLER:**
- Öneri 1
- Öneri 2`;

      const response = await this.aiService.generateResponse(prompt, userId || 'system');
      return this.parseValidationResult(response);
    } catch (error) {
      this.logger.error('Error validating code:', error);
      return {
        isValid: true,
        errors: [],
        warnings: [],
        suggestions: []
      };
    }
  }

  async autoFixErrors(
    code: string,
    language: 'c' | 'cpp',
    errors: CodeError[]
  ): Promise<{
    fixedCode: string;
    appliedFixes: ErrorFix[];
    remainingErrors: CodeError[];
  }> {
    try {
      const fixes = await this.suggestErrorFixes(code, language, errors);
      let fixedCode = code;
      const appliedFixes: ErrorFix[] = [];
      const remainingErrors: CodeError[] = [];

      for (const error of errors) {
        const fix = fixes.find(f => f.error.line === error.line && f.confidence > 0.7);
        
        if (fix) {
          // Basit string replacement - gerçek uygulamada daha sofistike olmalı
          const lines = fixedCode.split('\n');
          if (lines[error.line - 1] && fix.fix) {
            lines[error.line - 1] = fix.fix;
            fixedCode = lines.join('\n');
            appliedFixes.push(fix);
          }
        } else {
          remainingErrors.push(error);
        }
      }

      return {
        fixedCode,
        appliedFixes,
        remainingErrors
      };
    } catch (error) {
      this.logger.error('Error auto-fixing errors:', error);
      return {
        fixedCode: code,
        appliedFixes: [],
        remainingErrors: errors
      };
    }
  }

  private parseErrors(response: string): CodeError[] {
    const errors: CodeError[] = [];
    const lines = response.split('\n');
    let currentError: Partial<CodeError> | null = null;

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('-') && trimmedLine.includes('Satır')) {
        // Yeni hata başlangıcı
        if (currentError) {
          errors.push(currentError as CodeError);
        }
        
        const error = this.parseErrorLine(trimmedLine);
        if (error) {
          currentError = error;
        }
      } else if (trimmedLine.startsWith('Düzeltme:') && currentError) {
        currentError.suggestion = trimmedLine.replace('Düzeltme:', '').trim();
      }
    }

    if (currentError) {
      errors.push(currentError as CodeError);
    }

    return errors;
  }

  private parseErrorLine(line: string): CodeError | null {
    // Format: - [Tip] Satır X: Mesaj (Önem: Error/Warning/Info)
    const match = line.match(/\[(\w+)\]\s+Satır\s+(\d+):\s+(.+?)\s+\(Önem:\s+(\w+)\)/);
    if (match) {
      return {
        type: match[1].toLowerCase() as any,
        line: parseInt(match[2]),
        message: match[3].trim(),
        severity: match[4].toLowerCase() as any
      };
    }
    return null;
  }

  private parseErrorFixes(response: string, originalErrors: CodeError[]): ErrorFix[] {
    const fixes: ErrorFix[] = [];
    const lines = response.split('\n');
    let currentFix: Partial<ErrorFix> | null = null;

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('-') && trimmedLine.includes('Hata:')) {
        // Yeni düzeltme başlangıcı
        if (currentFix) {
          fixes.push(currentFix as ErrorFix);
        }
        
        const errorDesc = trimmedLine.replace('- Hata:', '').trim();
        const originalError = originalErrors.find(err => 
          err.message.includes(errorDesc) || errorDesc.includes(err.message)
        );
        
        if (originalError) {
          currentFix = { error: originalError };
        }
      } else if (trimmedLine.startsWith('Düzeltme:') && currentFix) {
        currentFix.fix = trimmedLine.replace('Düzeltme:', '').trim();
      } else if (trimmedLine.startsWith('Açıklama:') && currentFix) {
        currentFix.explanation = trimmedLine.replace('Açıklama:', '').trim();
      } else if (trimmedLine.startsWith('Güven:') && currentFix) {
        const confidence = parseFloat(trimmedLine.replace('Güven:', '').trim());
        currentFix.confidence = isNaN(confidence) ? 0.5 : confidence;
      } else if (trimmedLine.startsWith('Etki:') && currentFix) {
        const impact = trimmedLine.replace('Etki:', '').trim().toLowerCase();
        currentFix.impact = this.mapImpact(impact);
      }
    }

    if (currentFix) {
      fixes.push(currentFix as ErrorFix);
    }

    return fixes;
  }

  private parseValidationResult(response: string): {
    isValid: boolean;
    errors: CodeError[];
    warnings: CodeError[];
    suggestions: string[];
  } {
    const result = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    const lines = response.split('\n');
    let currentSection = '';

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('**GEÇERLİ:**')) {
        result.isValid = trimmedLine.includes('Evet');
      } else if (trimmedLine.startsWith('**HATALAR:**')) {
        currentSection = 'errors';
      } else if (trimmedLine.startsWith('**UYARILAR:**')) {
        currentSection = 'warnings';
      } else if (trimmedLine.startsWith('**ÖNERİLER:**')) {
        currentSection = 'suggestions';
      } else if (trimmedLine.startsWith('-') && currentSection === 'errors') {
        const error = this.parseErrorLine(trimmedLine);
        if (error) result.errors.push(error);
      } else if (trimmedLine.startsWith('-') && currentSection === 'warnings') {
        const warning = this.parseErrorLine(trimmedLine);
        if (warning) result.warnings.push(warning);
      } else if (trimmedLine.startsWith('-') && currentSection === 'suggestions') {
        result.suggestions.push(trimmedLine.replace('-', '').trim());
      }
    }

    return result;
  }

  private mapImpact(impact: string): 'low' | 'medium' | 'high' {
    switch (impact) {
      case 'yüksek': return 'high';
      case 'orta': return 'medium';
      case 'düşük': return 'low';
      default: return 'medium';
    }
  }
} 