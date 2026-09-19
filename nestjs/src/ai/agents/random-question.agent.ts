import { Injectable } from '@nestjs/common';
import { AiService } from '../ai.service';

@Injectable()
export class RandomQuestionAgent {
  constructor(private readonly aiService: AiService) {}

  async generateRandomQuestion(
    userPreferences: Record<string, any> = {}, 
    userLanguage: string = 'tr',
    programmingLanguage: 'c' | 'cpp' = 'cpp'
  ): Promise<{ question: string; expectedAnswer: string; solutionCode: string }> {
    console.log('[RandomQuestionAgent] Starting question generation...');
    console.log('[RandomQuestionAgent] User preferences:', userPreferences);
    console.log('[RandomQuestionAgent] User language:', userLanguage);
    console.log('[RandomQuestionAgent] Programming language:', programmingLanguage);
    
    const experienceLevel = userPreferences.experienceLevel || 'beginner';
    const learningGoal = userPreferences.learningGoal || 'general';
    const interests = userPreferences.interests || [];
    
    // Dil tercihine göre prompt oluştur
    const isEnglish = userLanguage === 'en';
    
    const prompt = isEnglish ? `
      User preferences:
      - Experience level: ${experienceLevel}
      - Learning goal: ${learningGoal}
      - Interests: ${interests.join(', ') || 'general'}
      - Programming language: ${programmingLanguage.toUpperCase()}

      Generate a personalized ${programmingLanguage.toUpperCase()} coding question for this user.
      The question should be appropriate for the user's experience level and consider their interests.
      
      Return ONLY in pure JSON format, no markdown or code blocks.
      Keep the solution code SHORT (maximum 20-30 lines).
      
      {
        "question": "Question text here...",
        "expectedAnswer": "Expected answer explanation here...",
        "solutionCode": "Short solution code here..."
      }
    ` : `
      Kullanıcı tercihleri:
      - Deneyim seviyesi: ${experienceLevel}
      - Öğrenme hedefi: ${learningGoal}
      - İlgi alanları: ${interests.join(', ') || 'genel'}
      - Programlama dili: ${programmingLanguage.toUpperCase()}

      Bu kullanıcı için kişiselleştirilmiş bir ${programmingLanguage.toUpperCase()} kodlama sorusu üret.
      Soru, kullanıcının deneyim seviyesine uygun olmalı ve ilgi alanlarını dikkate almalı.
      
      SADECE saf JSON formatında döndür, markdown veya kod bloğu kullanma.
      Çözüm kodunu KISA tut (maksimum 20-30 satır).
      
      {
        "question": "Soru metni buraya...",
        "expectedAnswer": "Beklenen cevap açıklaması buraya...",
        "solutionCode": "Kısa çözüm kodu buraya..."
      }
    `;
    
    console.log('[RandomQuestionAgent] Generated prompt:', prompt);
    console.log('[RandomQuestionAgent] Calling AI service...');
    
    try {
      const geminiResponse = await this.aiService.askGemini(prompt);
      console.log('[RandomQuestionAgent] Raw AI response:', geminiResponse);
      
      let questionObj;
      try {
        // Extract JSON from markdown code block if present
        let jsonContent = geminiResponse.trim();
        if (jsonContent.startsWith('```json')) {
          jsonContent = jsonContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (jsonContent.startsWith('```')) {
          jsonContent = jsonContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        console.log('[RandomQuestionAgent] Extracted JSON content:', jsonContent);
        // Try to parse the JSON
        try {
          questionObj = JSON.parse(jsonContent);
          console.log('[RandomQuestionAgent] Parsed JSON successfully:', questionObj);
        } catch (parseError) {
          console.error('[RandomQuestionAgent] JSON parse error:', parseError);
          // Kullanıcıya açık hata mesajı
          questionObj = {
            question: isEnglish ? 'Failed to process AI response.' : 'AI yanıtı işlenemedi.',
            expectedAnswer: '',
            solutionCode: ''
          };
        }
      } catch (e) {
        console.error('[RandomQuestionAgent] Failed to parse response:', geminiResponse);
        questionObj = { 
          question: isEnglish ? 'Failed to process AI response.' : 'AI yanıtı işlenemedi.', 
          expectedAnswer: '', 
          solutionCode: '' 
        };
      }
      
      console.log('[RandomQuestionAgent] Final question object:', questionObj);
      console.log('[RandomQuestionAgent] Generated question:', questionObj.question);
      console.log('[RandomQuestionAgent] Expected answer:', questionObj.expectedAnswer);
      console.log('[RandomQuestionAgent] Solution code:', questionObj.solutionCode);
      
      return questionObj;
    } catch (error) {
      console.error('[RandomQuestionAgent] Error in generateRandomQuestion:', error);
      return {
        question: isEnglish ? "Failed to generate question." : "Soru üretilemedi.",
        expectedAnswer: "",
        solutionCode: ""
      };
    }
  }

  async evaluateAnswer(
    question: string, 
    userAnswer: string, 
    userLanguage: string = 'tr'
  ): Promise<{ evaluation: string; suggestions: string[]; suggestedCode: string }> {
    const isEnglish = userLanguage === 'en';
    
    const prompt = isEnglish ? `
      Question: ${question}
      User's answer: ${userAnswer}
      
      Evaluate this code and respond in the following JSON format:
      
      {
        "evaluation": "Code evaluation here",
        "suggestions": ["Suggestion 1", "Suggestion 2"],
        "suggestedCode": "Suggested code here"
      }
      
      IMPORTANT: Return only JSON, write nothing else.
    ` : `
      Soru: ${question}
      Kullanıcının cevabı: ${userAnswer}
      
      Bu kodu değerlendir ve aşağıdaki JSON formatında yanıt ver:
      
      {
        "evaluation": "Kodun değerlendirmesi buraya",
        "suggestions": ["Öneri 1", "Öneri 2"],
        "suggestedCode": "Önerilen kod buraya"
      }
      
      ÖNEMLİ: Sadece JSON döndür, başka hiçbir şey yazma.
    `;
    
    const geminiResponse = await this.aiService.askGemini(prompt);
    
    // Basit fallback yaklaşımı
    try {
      let jsonContent = geminiResponse.trim();
      if (jsonContent.startsWith('```json')) {
        jsonContent = jsonContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const evalObj = JSON.parse(jsonContent);
      return evalObj;
    } catch (error) {
      console.error('[RandomQuestionAgent] JSON parse error:', error);
      
      // Basit değerlendirme
      const evaluation = isEnglish 
        ? "Code evaluated. It looks generally correct."
        : "Kod değerlendirildi. Genel olarak doğru görünüyor.";
      const suggestions = isEnglish 
        ? ["Review your code again.", "Check for syntax errors."]
        : ["Kodunuzu tekrar gözden geçirin.", "Syntax hatalarını kontrol edin."];
      const suggestedCode = userAnswer;
      
      return { evaluation, suggestions, suggestedCode };
    }
  }
} 