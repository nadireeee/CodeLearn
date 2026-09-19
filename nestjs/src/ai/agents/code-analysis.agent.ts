import { Injectable, Logger } from '@nestjs/common';
import { AiService } from '../ai.service';

export interface CodeAnalysisResult {
  quality: number; // 0-100
  analysis?: string;
  issues: CodeIssue[];
  suggestions: CodeSuggestion[];
  complexity: number;
  maintainability: number;
  performance: number;
  security: number;
}

export interface CodeIssue {
  type: 'error' | 'warning' | 'info';
  line: number;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestion?: string;
}

export interface CodeSuggestion {
  type: 'optimization' | 'refactoring' | 'best_practice' | 'style';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  code?: string;
}

@Injectable()
export class CodeAnalysisAgent {
  private readonly logger = new Logger(CodeAnalysisAgent.name);

  constructor(private readonly aiService: AiService) {}

  async analyzeCode(
    code: string,
    language: 'c' | 'cpp',
    question?: string,
    userId?: string
  ): Promise<CodeAnalysisResult> {
    try {
      const prompt = `Sen bir ${language.toUpperCase()} kod analiz uzmanısın.

Kod:
\`\`\`${language}
${code}
\`\`\`

${question ? `Özel soru: ${question}` : 'Lütfen bu kodu analiz et ve kalitesini değerlendir.'}

Analiz kriterleri:
1. Kod kalitesi (0-100)
2. Hatalar ve uyarılar
3. İyileştirme önerileri
4. Karmaşıklık seviyesi
5. Bakım kolaylığı
6. Performans
7. Güvenlik

Yanıt formatı:
**KALITE:** [0-100]
**KARMAŞIKLIK:** [1-10]
**BAKIM:** [0-100]
**PERFORMANS:** [0-100]
**GÜVENLİK:** [0-100]

**HATALAR:**
- [Tip] Satır X: Mesaj (Önem: Yüksek/Orta/Düşük)

**ÖNERİLER:**
- [Tip] Başlık: Açıklama (Etki: Yüksek/Orta/Düşük, Çaba: Yüksek/Orta/Düşük)`;

      const response = await this.aiService.generateResponse(prompt, userId || 'system');
      return this.parseAnalysisResult(response, code);
    } catch (error) {
      this.logger.error('Error analyzing code:', error);
      return this.getDefaultAnalysisResult();
    }
  }

  async detectCodeSmells(code: string, language: 'c' | 'cpp', userId?: string): Promise<CodeIssue[]> {
    try {
      const prompt = `Sen bir ${language.toUpperCase()} kod kalitesi uzmanısın.

Kod:
\`\`\`${language}
${code}
\`\`\`

Lütfen bu kodda "code smell" (kod kokusu) olan yerleri tespit et:

1. Uzun fonksiyonlar (>20 satır)
2. Büyük sınıflar
3. Tekrarlanan kod
4. Karmaşık koşullar
5. Magic numbers
6. Uygun olmayan isimlendirme
7. Gereksiz karmaşıklık
8. Yetersiz yorum
9. Aşırı parametre
10. Data clumps

Her tespit için:
- Satır numarası
- Sorun tipi
- Açıklama
- Önem seviyesi (Düşük/Orta/Yüksek/Kritik)`;

      const response = await this.aiService.generateResponse(prompt, userId || 'system');
      return this.parseCodeSmells(response);
    } catch (error) {
      this.logger.error('Error detecting code smells:', error);
      return [];
    }
  }

  async suggestRefactoring(code: string, language: 'c' | 'cpp', userId?: string): Promise<CodeSuggestion[]> {
    try {
      const prompt = `Sen bir ${language.toUpperCase()} refactoring uzmanısın.

Kod:
\`\`\`${language}
${code}
\`\`\`

Lütfen bu kod için refactoring önerileri ver:

1. Fonksiyon çıkarma (Extract Method)
2. Değişken çıkarma (Extract Variable)
3. Sınıf çıkarma (Extract Class)
4. Parametre objesi (Parameter Object)
5. Replace conditional with polymorphism
6. Replace magic number with named constant
7. Introduce null object
8. Replace error code with exception
9. Replace type code with class
10. Replace type code with state/strategy

Her öneri için:
- Refactoring tipi
- Başlık
- Açıklama
- Etki (Düşük/Orta/Yüksek)
- Çaba (Düşük/Orta/Yüksek)
- Örnek kod (opsiyonel)`;

      const response = await this.aiService.generateResponse(prompt, userId || 'system');
      return this.parseRefactoringSuggestions(response);
    } catch (error) {
      this.logger.error('Error suggesting refactoring:', error);
      return [];
    }
  }

  async analyzePerformance(code: string, language: 'c' | 'cpp', userId?: string): Promise<CodeSuggestion[]> {
    try {
      const prompt = `Sen bir ${language.toUpperCase()} performans optimizasyon uzmanısın.

Kod:
\`\`\`${language}
${code}
\`\`\`

Lütfen bu kodun performansını analiz et ve optimizasyon önerileri ver:

1. Algoritma karmaşıklığı
2. Bellek kullanımı
3. Gereksiz hesaplamalar
4. İnefficient data structures
5. Cache locality
6. Loop optimizations
7. Function call overhead
8. Memory allocation patterns
9. I/O operations
10. Compiler optimizations

Her öneri için:
- Performans sorunu
- Açıklama
- Potansiyel iyileştirme
- Etki (Düşük/Orta/Yüksek)`;

      const response = await this.aiService.generateResponse(prompt, userId || 'system');
      return this.parsePerformanceSuggestions(response);
    } catch (error) {
      this.logger.error('Error analyzing performance:', error);
      return [];
    }
  }

  private parseAnalysisResult(response: string, code: string): CodeAnalysisResult {
    const lines = response.split('\n');
    const result: CodeAnalysisResult = {
      quality: 70,
      issues: [],
      suggestions: [],
      complexity: 5,
      maintainability: 70,
      performance: 70,
      security: 70
    };

    let currentSection = '';
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('**KALITE:**')) {
        result.quality = parseInt(trimmedLine.split(':')[1]) || 70;
      } else if (trimmedLine.startsWith('**KARMAŞIKLIK:**')) {
        result.complexity = parseInt(trimmedLine.split(':')[1]) || 5;
      } else if (trimmedLine.startsWith('**BAKIM:**')) {
        result.maintainability = parseInt(trimmedLine.split(':')[1]) || 70;
      } else if (trimmedLine.startsWith('**PERFORMANS:**')) {
        result.performance = parseInt(trimmedLine.split(':')[1]) || 70;
      } else if (trimmedLine.startsWith('**GÜVENLİK:**')) {
        result.security = parseInt(trimmedLine.split(':')[1]) || 70;
      } else if (trimmedLine.startsWith('**HATALAR:**')) {
        currentSection = 'errors';
      } else if (trimmedLine.startsWith('**ÖNERİLER:**')) {
        currentSection = 'suggestions';
      } else if (trimmedLine.startsWith('-') && currentSection === 'errors') {
        const issue = this.parseIssue(trimmedLine);
        if (issue) result.issues.push(issue);
      } else if (trimmedLine.startsWith('-') && currentSection === 'suggestions') {
        const suggestion = this.parseSuggestion(trimmedLine);
        if (suggestion) result.suggestions.push(suggestion);
      }
    }

    return result;
  }

  private parseIssue(line: string): CodeIssue | null {
    // Format: - [Tip] Satır X: Mesaj (Önem: Yüksek/Orta/Düşük)
    const match = line.match(/\[(\w+)\]\s+Satır\s+(\d+):\s+(.+?)\s+\(Önem:\s+(\w+)\)/);
    if (match) {
      return {
        type: match[1].toLowerCase() as any,
        line: parseInt(match[2]),
        message: match[3].trim(),
        severity: this.mapSeverity(match[4])
      };
    }
    return null;
  }

  private parseSuggestion(line: string): CodeSuggestion | null {
    // Format: - [Tip] Başlık: Açıklama (Etki: Yüksek/Orta/Düşük, Çaba: Yüksek/Orta/Düşük)
    const match = line.match(/\[(\w+)\]\s+(.+?):\s+(.+?)\s+\(Etki:\s+(\w+),\s+Çaba:\s+(\w+)\)/);
    if (match) {
      return {
        type: match[1].toLowerCase() as any,
        title: match[2].trim(),
        description: match[3].trim(),
        impact: this.mapImpact(match[4]),
        effort: this.mapEffort(match[5])
      };
    }
    return null;
  }

  private parseCodeSmells(response: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = response.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('-')) {
        const issue = this.parseIssue(line);
        if (issue) issues.push(issue);
      }
    }
    
    return issues;
  }

  private parseRefactoringSuggestions(response: string): CodeSuggestion[] {
    const suggestions: CodeSuggestion[] = [];
    const lines = response.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('-')) {
        const suggestion = this.parseSuggestion(line);
        if (suggestion) suggestions.push(suggestion);
      }
    }
    
    return suggestions;
  }

  private parsePerformanceSuggestions(response: string): CodeSuggestion[] {
    const suggestions: CodeSuggestion[] = [];
    const lines = response.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('-')) {
        const suggestion = this.parseSuggestion(line);
        if (suggestion) suggestions.push(suggestion);
      }
    }
    
    return suggestions;
  }

  private mapSeverity(severity: string): 'low' | 'medium' | 'high' | 'critical' {
    switch (severity.toLowerCase()) {
      case 'kritik': return 'critical';
      case 'yüksek': return 'high';
      case 'orta': return 'medium';
      case 'düşük': return 'low';
      default: return 'medium';
    }
  }

  private mapImpact(impact: string): 'low' | 'medium' | 'high' {
    switch (impact.toLowerCase()) {
      case 'yüksek': return 'high';
      case 'orta': return 'medium';
      case 'düşük': return 'low';
      default: return 'medium';
    }
  }

  private mapEffort(effort: string): 'low' | 'medium' | 'high' {
    switch (effort.toLowerCase()) {
      case 'yüksek': return 'high';
      case 'orta': return 'medium';
      case 'düşük': return 'low';
      default: return 'medium';
    }
  }

  private getDefaultAnalysisResult(): CodeAnalysisResult {
    return {
      quality: 70,
      issues: [],
      suggestions: [],
      complexity: 5,
      maintainability: 70,
      performance: 70,
      security: 70
    };
  }
} 