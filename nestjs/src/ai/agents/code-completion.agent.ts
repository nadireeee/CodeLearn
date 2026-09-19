import { Injectable, Logger } from '@nestjs/common';
import { AiService } from '../ai.service';

export interface CompletionSuggestion {
  text: string;
  explanation: string;
  confidence: number;
  type: 'function' | 'variable' | 'statement' | 'import';
}

export interface CompletionContext {
  code: string;
  language: 'c' | 'cpp';
  cursorPosition: number;
  currentLine: string;
  previousLines: string[];
  nextLines: string[];
  functionContext?: string;
  classContext?: string;
}

@Injectable()
export class CodeCompletionAgent {
  private readonly logger = new Logger(CodeCompletionAgent.name);

  constructor(private readonly aiService: AiService) {}

  async generateCompletion(
    code: string,
    language: 'c' | 'cpp',
    cursorPosition: number,
    context?: string,
    userId?: string
  ): Promise<string[]> {
    try {
      const prompt = `Sen bir ${language.toUpperCase()} kod tamamlama asistanısın.

Mevcut kod:
\`\`\`${language}
${code}
\`\`\`

Cursor pozisyonu: ${cursorPosition}
${context ? `Bağlam: ${context}` : ''}

Lütfen cursor pozisyonunda kod tamamlama önerileri ver. Sadece tamamlanacak kısmı yaz, tüm kodu değil.

Örnek öneriler:
- Fonksiyon çağrısı
- Değişken adı
- Sınıf metodu
- Include statement
- Template parametresi

Sadece kod parçalarını döndür, açıklama yapma.`;

      const response = await this.aiService.generateResponse(prompt, userId || 'system');
      
      // Yanıtı parse et ve önerileri çıkar
      const suggestions = this.parseCompletionSuggestions(response);
      
      return suggestions.slice(0, 5); // En fazla 5 öneri
    } catch (error) {
      this.logger.error('Error generating completion suggestions:', error);
      return [];
    }
  }

  async generateContextualCompletion(context: CompletionContext, userId?: string): Promise<CompletionSuggestion[]> {
    try {
      const prompt = `Sen bir ${context.language.toUpperCase()} kod tamamlama asistanısın.

Kod bağlamı:
\`\`\`${context.language}
${context.code}
\`\`\`

Mevcut satır: "${context.currentLine}"
Cursor pozisyonu: ${context.cursorPosition}
${context.functionContext ? `Fonksiyon bağlamı: ${context.functionContext}` : ''}
${context.classContext ? `Sınıf bağlamı: ${context.classContext}` : ''}

Lütfen bu bağlamda uygun kod tamamlama önerileri ver. Her öneri için:
1. Tamamlanacak kod parçası
2. Açıklama
3. Güven seviyesi (0-1)
4. Tip (function, variable, statement, import)

Yanıt formatı:
- Öneri1 | Açıklama1 | 0.9 | function
- Öneri2 | Açıklama2 | 0.8 | variable`;

      const response = await this.aiService.generateResponse(prompt, userId || 'system');
      return this.parseContextualSuggestions(response);
    } catch (error) {
      this.logger.error('Error generating contextual completion:', error);
      return [];
    }
  }

  private parseCompletionSuggestions(response: string): string[] {
    // AI yanıtından kod önerilerini çıkar
    const lines = response.split('\n');
    return lines
      .filter(line => line.trim() && !line.startsWith('#'))
      .map(line => line.trim())
      .filter(line => line.length > 0);
  }

  private parseContextualSuggestions(response: string): CompletionSuggestion[] {
    const suggestions: CompletionSuggestion[] = [];
    const lines = response.split('\n');
    
    for (const line of lines) {
      const parts = line.split('|').map(part => part.trim());
      if (parts.length >= 4) {
        suggestions.push({
          text: parts[0],
          explanation: parts[1],
          confidence: parseFloat(parts[2]) || 0.5,
          type: parts[3] as any || 'statement'
        });
      }
    }
    
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  async getCommonPatterns(language: 'c' | 'cpp'): Promise<string[]> {
    const patterns = {
      c: [
        '#include <stdio.h>',
        '#include <stdlib.h>',
        '#include <string.h>',
        'int main() {',
        'printf(',
        'scanf(',
        'malloc(',
        'free(',
        'for (int i = 0; i < n; i++) {',
        'while (condition) {',
        'if (condition) {',
        'else {',
        'return 0;',
        'struct Node {',
        'typedef struct {'
      ],
      cpp: [
        '#include <iostream>',
        '#include <vector>',
        '#include <string>',
        '#include <algorithm>',
        'using namespace std;',
        'int main() {',
        'cout << ',
        'cin >> ',
        'vector<int> v;',
        'string s;',
        'for (auto& item : container) {',
        'for (int i = 0; i < n; i++) {',
        'while (condition) {',
        'if (condition) {',
        'else {',
        'class MyClass {',
        'public:',
        'private:',
        'return 0;',
        'template<typename T>',
        'auto result = ',
        'const auto& ',
        'std::cout << ',
        'std::cin >> '
      ]
    };
    
    return patterns[language] || [];
  }
} 