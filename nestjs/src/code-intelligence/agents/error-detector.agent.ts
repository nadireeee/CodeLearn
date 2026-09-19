import { Injectable } from '@nestjs/common';
import { AiService } from '../../ai/ai.service';

@Injectable()
export class ErrorDetectorAgent {
  constructor(private readonly aiService: AiService) {}

  async detectErrors(code: string, language: 'c' | 'cpp'): Promise<any[]> {
    const prompt = `
      Bu C/C++ kodundaki hataları tespit et:
      
      \`\`\`${language}
      ${code}
      \`\`\`
      
      Hataları şu formatta döndür:
      {
        "errors": [
          {
            "type": "syntax|logic|runtime",
            "line": 5,
            "message": "Hata açıklaması",
            "severity": "error|warning|info",
            "suggestion": "Düzeltme önerisi"
          }
        ]
      }
    `;

    try {
      const response = await this.aiService.askGemini(prompt);
      const result = JSON.parse(response);
      return result.errors || [];
    } catch (error) {
      console.error('Error detection error:', error);
      return [];
    }
  }

  async detectPotentialIssues(code: string, language: 'c' | 'cpp'): Promise<string[]> {
    const prompt = `
      Bu C/C++ kodundaki potansiyel sorunları tespit et:
      
      \`\`\`${language}
      ${code}
      \`\`\`
      
      Potansiyel sorunları listele (memory leak, buffer overflow, undefined behavior, vb.)
    `;

    try {
      const response = await this.aiService.askGemini(prompt);
      return response.split('\n').filter(line => line.trim());
    } catch (error) {
      console.error('Potential issues detection error:', error);
      return [];
    }
  }

  async validateCodeAgainstQuestion(
    code: string, 
    language: 'c' | 'cpp', 
    question: string
  ): Promise<{
    isCorrect: boolean;
    feedback: string;
    missingParts: string[];
  }> {
    const prompt = `
      Bu kod, soruya doğru cevap veriyor mu?
      
      Soru: ${question}
      
      Kod:
      \`\`\`${language}
      ${code}
      \`\`\`
      
      Değerlendirmeyi şu formatta döndür:
      {
        "isCorrect": true/false,
        "feedback": "Detaylı geri bildirim",
        "missingParts": ["eksik kısım 1", "eksik kısım 2"]
      }
    `;

    try {
      let response = await this.aiService.askGemini(prompt);
      // Kod bloğu ve gereksiz karakterleri temizle
      let clean = response.trim();
      if (clean.startsWith('```')) {
        clean = clean.replace(/```[a-zA-Z]*\n?/, '').replace(/```/, '').trim();
      }
      const firstBrace = clean.indexOf('{');
      const lastBrace = clean.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        clean = clean.substring(firstBrace, lastBrace + 1);
      }
      return JSON.parse(clean);
    } catch (error) {
      console.error('Code validation error:', error);
      return {
        isCorrect: false,
        feedback: 'Kod değerlendirilemedi.',
        missingParts: [],
      };
    }
  }
} 