import { Injectable, Logger } from '@nestjs/common';
import { AiService } from '../ai.service';

export interface ChatMessageDto {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface CheadResponse {
  message: string;
  code?: string;
  language?: string;
}

@Injectable()
export class CheadAgent {
  private readonly logger = new Logger(CheadAgent.name);

  constructor(private readonly aiService: AiService) {}

  async generateResponse(
    message: string,
    conversationHistory: ChatMessageDto[] = []
  ): Promise<CheadResponse> {
    try {
      this.logger.log('[CheadAgent] Generating response for message:', message);
      
      const prompt = this.createPrompt(message, conversationHistory);
      const aiResponse = await this.aiService.askGemini(prompt);
      
      const parsedResponse = this.parseResponse(aiResponse);
      this.logger.log('[CheadAgent] Generated response:', parsedResponse);
      
      return parsedResponse;
    } catch (error) {
      this.logger.error('[CheadAgent] Error generating response:', error);
      return {
        message: 'Üzgünüm, şu anda yanıt veremiyorum. Lütfen daha sonra tekrar deneyin.',
        code: null,
        language: null,
      };
    }
  }

  async getWelcomeMessage(): Promise<string> {
    try {
      const prompt = `Sen Chead adında yardımcı bir AI asistanısın. Kullanıcıya hoş geldin mesajı ver.

Kullanıcı: Merhaba
Chead:`;

      const response = await this.aiService.askGemini(prompt);
      return response;
    } catch (error) {
      this.logger.error('[CheadAgent] Error getting welcome message:', error);
      return 'Merhaba! Ben Chead, size nasıl yardımcı olabilirim?';
    }
  }

  private createPrompt(
    message: string,
    conversationHistory: ChatMessageDto[] = []
  ): string {
    const history = conversationHistory
      .map(msg => `${msg.role === 'user' ? 'Kullanıcı' : 'Chead'}: ${msg.content}`)
      .join('\n');

    return `Sen Chead adında yardımcı bir AI asistanısın. Kullanıcıyla kullanıcının konuştuğu dilde doğal bir şekilde konuşuyorsun. C++ programlama konusunda uzmanlaşmışsın ama diğer konularda da yardımcı olabilirsin.

Yanıtını JSON formatında ver:
{
  "message": "Ana mesajın buraya",
  "code": "Eğer kod varsa buraya, yoksa null",
  "language": "cpp veya c veya null"
}

${history ? `Önceki konuşma:\n${history}\n` : ''}

Kullanıcı: ${message}
Chead:`;
  }

  private parseResponse(response: string): CheadResponse {
    try {
      // JSON formatında gelen yanıtı parse et
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[1];
        const parsed = JSON.parse(jsonStr);
        
        return {
          message: parsed.message || response,
          code: parsed.code || null,
          language: parsed.language || null,
        };
      }
      
      // Eğer JSON formatında değilse, direkt string olarak döndür
      return {
        message: response,
        code: null,
        language: null,
      };
    } catch (error) {
      this.logger.error('[CheadAgent] JSON parse error:', error);
      return {
        message: response,
        code: null,
        language: null,
      };
    }
  }
} 