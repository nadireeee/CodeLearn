import { Injectable } from '@nestjs/common';
import { AiService } from '../../ai/ai.service';

@Injectable()
export class SuggestionGeneratorAgent {
  constructor(private readonly aiService: AiService) {}

  async generateSuggestions(
    code: string, 
    language: 'c' | 'cpp', 
    context?: any
  ): Promise<any[]> {
    const prompt = `
      Bu C/C++ kodunu iyileştirmek için öneriler ver:
      
      \`\`\`${language}
      ${code}
      \`\`\`
      
      ${context?.question ? `Hedef: ${context.question}` : ''}
      
      Önerileri şu formatta döndür:
      {
        "suggestions": [
          {
            "type": "performance|readability|security|best_practice",
            "title": "Öneri başlığı",
            "description": "Açıklama",
            "priority": "high|medium|low",
            "codeExample": "Örnek kod",
            "line": 5
          }
        ]
      }
    `;

    try {
      const response = await this.aiService.askGemini(prompt);
      const result = JSON.parse(response);
      return result.suggestions || [];
    } catch (error) {
      console.error('Suggestion generation error:', error);
      return [];
    }
  }

  async generateCompletionSuggestions(
    code: string,
    language: 'c' | 'cpp',
    cursorPosition: number,
    context?: string
  ): Promise<{
    suggestions: string[];
    explanations: string[];
  }> {
    const prompt = `
      Bu kodun ${cursorPosition}. pozisyonunda ne yazılabilir?
      
      \`\`\`${language}
      ${code}
      \`\`\`
      
      ${context ? `Bağlam: ${context}` : ''}
      
      Olası tamamlamaları ve açıklamalarını ver (maksimum 3 tane).
    `;

    try {
      const response = await this.aiService.askGemini(prompt);
      const lines = response.split('\n').filter(line => line.trim());
      
      return {
        suggestions: lines.slice(0, 3),
        explanations: lines.slice(3, 6),
      };
    } catch (error) {
      console.error('Completion suggestion error:', error);
      return {
        suggestions: [],
        explanations: [],
      };
    }
  }

  async generateErrorFixes(
    code: string,
    language: 'c' | 'cpp',
    errors: any[]
  ): Promise<{
    fixedCode: string;
    explanations: string[];
  }> {
    const prompt = `
      Bu kodda hatalar var, düzelt:
      
      \`\`\`${language}
      ${code}
      \`\`\`
      
      Hatalar: ${JSON.stringify(errors)}
      
      Düzeltilmiş kodu ve açıklamaları ver.
    `;

    try {
      const response = await this.aiService.askGemini(prompt);
      // Response'u parse et ve fixedCode döndür
      return this.parseFixedCode(response);
    } catch (error) {
      console.error('Error fix generation error:', error);
      return {
        fixedCode: code,
        explanations: ['Hata düzeltme yapılamadı.'],
      };
    }
  }

  async generateHints(
    code: string, 
    language: 'c' | 'cpp', 
    context?: any
  ): Promise<string[]> {
    const prompt = `
      Bu C/C++ kodunu yazan kişiye ipuçları ver:
      
      \`\`\`${language}
      ${code}
      \`\`\`
      
      ${context?.question ? `Soru: ${context.question}` : ''}
      
      Kısa ve net ipuçları ver (maksimum 3 tane).
    `;

    try {
      const response = await this.aiService.askGemini(prompt);
      return response.split('\n').filter(line => line.trim());
    } catch (error) {
      console.error('Hint generation error:', error);
      return [];
    }
  }

  private parseFixedCode(response: string): {
    fixedCode: string;
    explanations: string[];
  } {
    // Basit parsing - gerçek implementasyonda daha gelişmiş olabilir
    const codeBlockMatch = response.match(/```(?:cpp|c)?\n([\s\S]*?)\n```/);
    const fixedCode = codeBlockMatch ? codeBlockMatch[1] : response;
    
    const explanations = response
      .split('\n')
      .filter(line => !line.includes('```') && line.trim())
      .slice(-3); // Son 3 satırı açıklama olarak al

    return {
      fixedCode,
      explanations,
    };
  }
} 