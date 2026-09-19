import { Injectable } from '@nestjs/common';
import { AiService } from '../../ai/ai.service';

@Injectable()
export class CodeAnalyzerAgent {
  constructor(private readonly aiService: AiService) {}

  async analyzeCodeStructure(code: string, language: 'c' | 'cpp'): Promise<any> {
    const prompt = `
      Bu C/C++ kodunun yapısını analiz et:
      
      \`\`\`${language}
      ${code}
      \`\`\`
      
      Analizi şu formatta döndür:
      {
        "functions": ["main", "calculate"],
        "variables": ["int a", "char* str"],
        "includes": ["#include <stdio.h>"],
        "complexity": "low|medium|high",
        "style": "good|needs_improvement",
        "potentialIssues": ["memory leak", "buffer overflow"]
      }
    `;

    try {
      const response = await this.aiService.askGemini(prompt);
      return JSON.parse(response);
    } catch (error) {
      console.error('Code analysis error:', error);
      return {
        functions: [],
        variables: [],
        includes: [],
        complexity: 'low',
        style: 'good',
        potentialIssues: [],
      };
    }
  }

  async predictNextLine(
    code: string, 
    language: 'c' | 'cpp', 
    context: string
  ): Promise<string[]> {
    const prompt = `
      Bu kodun devamında ne yazılabilir?
      
      \`\`\`${language}
      ${code}
      \`\`\`
      
      Bağlam: ${context}
      
      Olası devamları listele (maksimum 3 tane).
    `;

    try {
      const response = await this.aiService.askGemini(prompt);
      return response.split('\n').filter(line => line.trim());
    } catch (error) {
      console.error('Next line prediction error:', error);
      return [];
    }
  }

  async analyzeCodeLogic(code: string, language: 'c' | 'cpp', question?: string): Promise<string> {
    const prompt = `
      Bu C/C++ kodunun mantığını analiz et:
      
      \`\`\`${language}
      ${code}
      \`\`\`
      
      ${question ? `Soru: ${question}` : ''}
      
      Kodun ne yaptığını, hangi algoritmaları kullandığını ve potansiyel sorunları açıkla.
    `;

    try {
      return await this.aiService.askGemini(prompt);
    } catch (error) {
      console.error('Code logic analysis error:', error);
      return 'Kod analizi yapılamadı.';
    }
  }
} 