import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatMessage, ChatMessageDocument } from './schemas/chat-message.schema';
import axios from 'axios';
import { Buffer } from 'buffer';

export interface ChatMessageDto {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface LearningContext {
  currentTopic: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  progress: number;
  completedTopics: string[];
  nextTopics: string[];
}

@Injectable()
export class AiService implements OnModuleInit {
  private readonly logger = new Logger(AiService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';
  private isApiKeyValid: boolean = false;

  // C/C++ öğrenme yolu ve konuları
  private readonly cppLearningPath = {
    beginner: [
      'variables', 'data_types', 'operators', 'control_structures',
      'functions', 'arrays', 'strings', 'basic_io'
    ],
    intermediate: [
      'pointers', 'references', 'dynamic_memory', 'classes',
      'constructors', 'destructors', 'inheritance', 'polymorphism'
    ],
    advanced: [
      'templates', 'stl', 'smart_pointers', 'move_semantics',
      'lambda_expressions', 'multithreading', 'file_io'
    ]
  };

  constructor(
    private configService: ConfigService,
    @InjectModel(ChatMessage.name) private chatMessageModel: Model<ChatMessageDocument>
  ) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY');
  }

  async onModuleInit() {
    this.logger.log('Testing Gemini API key...');
    await this.testGeminiApiKey();
  }

  private async testGeminiApiKey(): Promise<void> {
    if (!this.apiKey) {
      this.logger.error('❌ GEMINI_API_KEY environment variable is not set');
      this.isApiKeyValid = false;
      return;
    }

    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: 'Merhaba! Sen C/C++ programlama öğretmeni misin?',
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 100,
          },
        }),
      });

      if (response.ok) {
        this.logger.log('✅ Gemini API key is valid and working');
        this.isApiKeyValid = true;
      } else if (response.status === 429) {
        // Quota/rate-limit: key is present; allow later chat retries
        this.logger.warn('⚠️ Gemini API rate-limited on startup; will retry on chat requests');
        this.isApiKeyValid = true;
      } else {
        this.logger.error(`❌ Gemini API test failed: ${response.status} - ${response.statusText}`);
        const errorText = await response.text();
        this.logger.error('Error details:', errorText);
        this.isApiKeyValid = false;
      }
    } catch (error) {
      this.logger.error('❌ Gemini API test failed:', error);
      this.isApiKeyValid = false;
    }
  }

  private analyzeUserMessage(message: string): { topic: string; intent: string; difficulty: string } {
    const lowerMessage = message.toLowerCase();
    
    // C/C++ konularını tespit et
    let topic = 'general';
    let difficulty = 'beginner';
    
    if (lowerMessage.includes('pointer') || lowerMessage.includes('işaretçi')) {
      topic = 'pointers';
      difficulty = 'intermediate';
    } else if (lowerMessage.includes('class') || lowerMessage.includes('sınıf') || lowerMessage.includes('object')) {
      topic = 'classes';
      difficulty = 'intermediate';
    } else if (lowerMessage.includes('memory') || lowerMessage.includes('bellek') || lowerMessage.includes('new') || lowerMessage.includes('delete')) {
      topic = 'memory';
      difficulty = 'intermediate';
    } else if (lowerMessage.includes('template') || lowerMessage.includes('stl')) {
      topic = 'templates';
      difficulty = 'advanced';
    } else if (lowerMessage.includes('inheritance') || lowerMessage.includes('kalıtım')) {
      topic = 'inheritance';
      difficulty = 'intermediate';
    } else if (lowerMessage.includes('function') || lowerMessage.includes('fonksiyon')) {
      topic = 'functions';
      difficulty = 'beginner';
    } else if (lowerMessage.includes('array') || lowerMessage.includes('dizi')) {
      topic = 'arrays';
      difficulty = 'beginner';
    } else if (lowerMessage.includes('string') || lowerMessage.includes('karakter')) {
      topic = 'strings';
      difficulty = 'beginner';
    }
    
    // Kullanıcı amacını tespit et
    let intent = 'learning';
    if (lowerMessage.includes('nasıl') || lowerMessage.includes('how')) {
      intent = 'how_to';
    } else if (lowerMessage.includes('örnek') || lowerMessage.includes('example')) {
      intent = 'example';
    } else if (lowerMessage.includes('hata') || lowerMessage.includes('error')) {
      intent = 'debugging';
    } else if (lowerMessage.includes('fark') || lowerMessage.includes('difference')) {
      intent = 'comparison';
    }
    
    return { topic, intent, difficulty };
  }

  private createCppFocusedPrompt(
    message: string,
    userPreferences?: Record<string, any>,
    conversationHistory: ChatMessageDto[] = [],
    userLanguage: string = 'tr'
  ): string {
    const history = conversationHistory
      .map(msg => `${msg.role === 'user' ? 'Kullanıcı' : 'Chead'}: ${msg.content}`)
      .join('\n');

    const isEnglish = userLanguage === 'en';
    
    return isEnglish ? `You are Chead, a helpful AI assistant. You communicate with the user in their preferred language naturally. You are specialized in C++ programming but can help with other topics as well.

Respond in JSON format:
{
  "message": "Your main message here",
  "code": "Code here if any, otherwise null",
  "language": "cpp or c or null"
}

${history ? `Previous conversation:\n${history}\n` : ''}

User: ${message}
Chead:` : `Sen Chead adında yardımcı bir AI asistanısın. Kullanıcıyla kullanıcının konuştuğu dilde doğal bir şekilde konuşuyorsun. C++ programlama konusunda uzmanlaşmışsın ama diğer konularda da yardımcı olabilirsin.

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

  // JSON response'u temizle ve formatla
  private cleanAndParseResponse(response: string): string {
    try {
      // JSON formatında gelen yanıtı parse et
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[1];
        const parsed = JSON.parse(jsonStr);
        
        // Temizlenmiş JSON'u döndür
        return JSON.stringify({
          message: parsed.message || response,
          code: parsed.code || null,
          language: parsed.language || null,
        });
    }

      // Eğer JSON formatında değilse, direkt string olarak döndür
      return JSON.stringify({
        message: response,
        code: null,
        language: null,
      });
    } catch (error) {
      this.logger.error('JSON parse error:', error);
      // Hata durumunda temizlenmiş mesajı döndür
      return JSON.stringify({
        message: response,
        code: null,
        language: null,
      });
    }
  }

  async generateResponse(
    message: string,
    userId: string,
    userPreferences?: Record<string, any>,
    sessionId?: string,
    userLanguage: string = 'tr'
  ): Promise<string> {
    try {
      await this.saveMessage(userId, 'user', message, sessionId);

      if (!this.apiKey || !this.isApiKeyValid) {
        throw new Error('Gemini API key is not available or invalid');
      }

      this.logger.log('Using Gemini API for C/C++ focused response generation');
      const conversationHistory = await this.getConversationHistory(userId, sessionId);
      const personalizedPrompt = this.createCppFocusedPrompt(message, userPreferences, conversationHistory, userLanguage);
      this.logger.log('[AI] Gemini Prompt:', personalizedPrompt);
      console.log('[AI] Gemini Prompt:', personalizedPrompt);

      this.logger.log('Sending request to Gemini API...');
      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: personalizedPrompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1500,
        },
      };

      let response: Response | null = null;
      let lastErrorText = '';
      for (let attempt = 1; attempt <= 4; attempt++) {
        response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (response.ok) {
          break;
        }

        lastErrorText = await response.text();
        this.logger.error(
          `Gemini API error (attempt ${attempt}/4):`,
          response.status,
          response.statusText,
        );
        this.logger.error('Gemini API error details:', lastErrorText);

        const retryable = response.status === 503 || response.status === 429;
        if (!retryable || attempt === 4) {
          throw new Error(`Gemini API error: ${response.status} - ${response.statusText}`);
        }
        const waitMs = response.status === 429 ? attempt * 20000 : attempt * 1500;
        this.logger.warn(`Retrying Gemini in ${waitMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }

      if (!response || !response.ok) {
        throw new Error(`Gemini API error after retries: ${lastErrorText}`);
      }

      const data = await response.json();
      this.logger.log('[AI] Gemini API raw response:', JSON.stringify(data, null, 2));
      console.log('[AI] Gemini API raw response:', JSON.stringify(data, null, 2));
      
      let aiResponse: string;
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        aiResponse = data.candidates[0].content.parts[0].text;
        this.logger.log('Successfully received C/C++ focused response from Gemini API');
      } else {
        this.logger.error('Invalid response format from Gemini API:', data);
        throw new Error('Invalid response format from Gemini API');
      }

      this.logger.log('[AI] Final AI response:', aiResponse);
      console.log('[AI] Final AI response:', aiResponse);
      await this.saveMessage(userId, 'assistant', aiResponse, sessionId);
      return aiResponse;
    } catch (error: any) {
      this.logger.error('AI Service Error:', error);
      console.error('AI Service Error:', error);
      throw new Error(`AI service is currently unavailable. Please try again later. Error: ${error.message}`);
    }
  }

  // API key durumunu kontrol etmek için public method
  getApiKeyStatus(): { hasKey: boolean; isValid: boolean } {
    return {
      hasKey: !!this.apiKey,
      isValid: this.isApiKeyValid,
    };
  }

  private async saveMessage(
    userId: string, 
    role: 'user' | 'assistant', 
    content: string, 
    sessionId?: string
  ): Promise<void> {
    try {
      const chatMessage = new this.chatMessageModel({
        userId: userId,
        role,
        content,
        timestamp: new Date(),
        sessionId: sessionId || 'default',
      });
      await chatMessage.save();
      this.logger.log(`Message saved for user: ${userId}`);
    } catch (error) {
      this.logger.error('Error saving chat message:', error);
    }
  }

  private async getConversationHistory(userId: string, sessionId?: string): Promise<ChatMessageDto[]> {
    try {
      const messages = await this.chatMessageModel
        .find({
          userId: userId,
          sessionId: sessionId || 'default',
        })
        .sort({ timestamp: 1 })
        .limit(10)
        .exec();

      return messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
      }));
    } catch (error) {
      this.logger.error('Error getting conversation history:', error);
      return [];
    }
  }

  async getChatHistory(userId: string, sessionId?: string): Promise<ChatMessageDto[]> {
    return this.getConversationHistory(userId, sessionId);
  }

  async clearChatHistory(userId: string, sessionId?: string): Promise<void> {
    try {
      await this.chatMessageModel.deleteMany({
        userId: userId,
        sessionId: sessionId || 'default',
      });
      this.logger.log(`Chat history cleared for user: ${userId}`);
    } catch (error) {
      this.logger.error('Error clearing chat history:', error);
    }
  }

  async getWelcomeMessage(userPreferences?: Record<string, any>, userLanguage: string = 'tr'): Promise<string> {
    const isEnglish = userLanguage === 'en';
    
    const welcomePrompt = isEnglish ? `**YOU ARE ONLY A C/C++ PROGRAMMING TEACHER!**

Hello! I'm Chead, your C/C++ programming teacher. I'm an AI assistant specialized only in C and C++ languages.

**Topics I can help with:**
• C/C++ fundamentals and syntax
• Pointers and memory management
• Object-Oriented Programming (OOP)
• STL (Standard Template Library)
• Modern C++ features (C++11/14/17/20)
• Performance optimization
• Debugging and error handling

**My rules:**
1. I only provide C/C++ code examples
2. I don't provide Python, Java, JavaScript code examples
3. Every response must contain C/C++ code
4. I use modern C++ features

Which C/C++ topic do you need help with? 🚀` : `**SEN SADECE C/C++ PROGRAMLAMA ÖĞRETMENİSİN!**

Merhaba! Ben Chead, senin C/C++ programlama öğretmenin. Sadece C ve C++ dillerinde uzmanlaşmış bir AI asistanım.

**Yardımcı olabileceğim konular:**
• C/C++ temelleri ve syntax
• Pointers ve memory management
• Object-Oriented Programming (OOP)
• STL (Standard Template Library)
• Modern C++ özellikleri (C++11/14/17/20)
• Performance optimization
• Debugging ve hata ayıklama

**Kurallarım:**
1. Sadece C/C++ kod örnekleri veririm
2. Python, Java, JavaScript kod örnekleri vermem
3. Her yanıtımda mutlaka C/C++ kodu bulunur
4. Modern C++ özelliklerini kullanırım

Hangi C/C++ konusunda yardıma ihtiyacın var? 🚀`;

    try {
      if (!this.apiKey || !this.isApiKeyValid) {
        return `Merhaba! Ben Chead, senin C/C++ programlama öğretmenin. 

Şu anda AI servisi geçici olarak kullanılamıyor, ama sana C/C++ konularında yardımcı olmaya hazırım!

Hangi konuda yardıma ihtiyacın var? 🚀`;
      }

      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: welcomePrompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text;
      } else {
        throw new Error('Invalid response format from Gemini API');
      }
    } catch (error) {
      this.logger.error('Error getting welcome message:', error);
      return `Merhaba! Ben Chead, senin C/C++ programlama öğretmenin. 

Şu anda AI servisi geçici olarak kullanılamıyor, ama sana C/C++ konularında yardımcı olmaya hazırım!

Hangi konuda yardıma ihtiyacın var? 🚀`;
    }
  }

  async askGemini(prompt: string): Promise<string> {
    this.logger.log('[AiService] askGemini called with prompt:', prompt);
    console.log('[AiService] askGemini called with prompt:', prompt);
    if (!this.apiKey || !this.isApiKeyValid) {
      this.logger.error('[AiService] API key not available or invalid');
      console.error('[AiService] API key not available or invalid');
      throw new Error('Gemini API key is not available or invalid');
    }
    this.logger.log('[AiService] Making request to Gemini API...');
    console.log('[AiService] Making request to Gemini API...');
    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000,
          },
        }),
      });
      this.logger.log('[AiService] Gemini API response status:', response.status);
      console.log('[AiService] Gemini API response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error('[AiService] Gemini API error:', errorText);
        console.error('[AiService] Gemini API error:', errorText);
        throw new Error(`Gemini API error: ${response.status} - ${response.statusText}`);
      }
      const data = await response.json();
      this.logger.log('[AiService] Gemini API response data:', JSON.stringify(data, null, 2));
      console.log('[AiService] Gemini API response data:', JSON.stringify(data, null, 2));
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const result = data.candidates[0].content.parts[0].text;
        this.logger.log('[AiService] Successfully extracted response:', result);
        console.log('[AiService] Successfully extracted response:', result);
        return result;
      } else {
        this.logger.error('[AiService] Invalid response format from Gemini API:', data);
        console.error('[AiService] Invalid response format from Gemini API:', data);
        throw new Error('Invalid response format from Gemini API');
      }
    } catch (error) {
      this.logger.error('[AiService] Error in askGemini:', error);
      console.error('[AiService] Error in askGemini:', error);
      throw error;
    }
  }

  async compileAndRunCode(code: string, language: 'c' | 'cpp') {
    const languageId = language === 'c' ? 50 : 54; // Judge0: 50 = C, 54 = C++
    this.logger.log('[AI] Compile request:', { code, language });
    console.log('[AI] Compile request:', { code, language });
    try {
      const base64Code = Buffer.from(code).toString('base64');
      const response = await axios.post(
        'http://localhost:2358/submissions?base64_encoded=true&wait=true',
        {
          source_code: base64Code,
          language_id: languageId,
          stdin: '',
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      const data = response.data;
      this.logger.log('[AI] Judge0 raw response:', JSON.stringify(data, null, 2));
      console.log('[AI] Judge0 raw response:', JSON.stringify(data, null, 2));
      // Çıktıyı decode et
      const decode = (val) => val ? Buffer.from(val, 'base64').toString('utf-8') : '';
      return {
        success: data.status && data.status.id === 3,
        output: decode(data.stdout),
        error: decode(data.stderr) || decode(data.compile_output),
        executionTime: data.time,
        memoryUsage: data.memory,
      };
    } catch (error) {
      this.logger.error('[AiService] Judge0 error:', error?.response?.data || error);
      console.error('[AiService] Judge0 error:', error?.response?.data || error);
      return {
        success: false,
        output: '',
        error: 'Online derleyiciye erişilemedi veya hata oluştu.',
        executionTime: 0,
        memoryUsage: 0,
      };
    }
  }

  async generateCodeWithContext(prompt: string, currentCode: string, language: 'c' | 'cpp'): Promise<{ code: string }> {
    if (!this.isApiKeyValid) {
      throw new Error('Gemini API key is not valid');
    }

    const contextPrompt = `
**MEVCUT KOD:**
\`\`\`${language}
${currentCode}
\`\`\`

**KULLANICI İSTEĞİ:**
${prompt}

**TALİMAT:**
Yukarıdaki mevcut kodu dikkate alarak, kullanıcının isteğine uygun C/C++ kodu üret. 
Kod bloğunu \`\`\`${language} ile başlat ve \`\`\` ile bitir.
`;

    try {
      const response = await this.askGemini(contextPrompt);
      return { code: response };
    } catch (error) {
      this.logger.error('Error generating code with context:', error);
      throw new Error('Kod üretilirken hata oluştu');
    }
  }

  async executeFileCommand(
    command: string,
    prompt: string,
    currentFiles: Array<{ name: string; content: string }>,
    targetFile?: string
  ): Promise<{ success: boolean; files: Array<{ name: string; content: string }>; error?: string }> {
    if (!this.isApiKeyValid) {
      throw new Error('Gemini API key is not valid');
    }

    const filesContext = currentFiles.map(f => 
      `**${f.name}:**\n// mevcut içerik\n${f.content}\n// mevcut içerik sonu`
    ).join('\n\n');

    // JSON zorunlu prompt
    const commandPrompt = `
**DOSYA KOMUTU:** ${command}
**HEDEF DOSYA:** ${targetFile || 'Belirtilmedi'}
**KULLANICI İSTEĞİ:** ${prompt}

**MEVCUT DOSYALAR:**
${filesContext || 'Henüz dosya yok'}

**TALİMAT:**
YANITIN SADECE SAF JSON OLSUN. Her dosya için anahtar dosya adı, değeri dosya içeriği olacak şekilde bir JSON dön. Açıklama, kod bloğu, File: etiketi, markdown ekleme.

Örnek:
{
  "main.cpp": "// main.cpp kodu",
  "utils.h": "// utils.h kodu"
}
`;

    try {
      const response = await this.askGemini(commandPrompt);
      const files = this.parseSimpleJsonFiles(response);
      this.logger.log('[parseFileResponse Çıktısı]', files);
      return {
        success: true,
        files: files
      };
    } catch (error) {
      this.logger.error('Error executing file command:', error);
      return {
        success: false,
        files: [],
        error: 'Dosya komutu çalıştırılırken hata oluştu'
      };
    }
  }

  // Yeni sade JSON dosya parse fonksiyonu
  private parseSimpleJsonFiles(response: string): Array<{ name: string; content: string }> {
    let jsonText = response.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    const obj = JSON.parse(jsonText);
    return Object.entries(obj).map(([name, content]) => ({ name, content: (content as string).trim() }));
  }

  async createProject(
    projectName: string,
    description: string,
    language: 'c' | 'cpp'
  ): Promise<{ success: boolean; files: Array<{ name: string; content: string }>; projectName?: string; error?: string }> {
    if (!this.isApiKeyValid) {
      throw new Error('Gemini API key is not valid');
    }

    try {
      if (language === 'cpp') {
        return await this.createCppProject(projectName, description);
      } else {
        return await this.createCProject(projectName, description);
      }
    } catch (error) {
      this.logger.error('Error creating project:', error);
      return {
        success: false,
        files: [],
        error: 'Proje oluşturulurken hata oluştu'
      };
    }
  }

  // C++ Projesi için özel fonksiyon
  private async createCppProject(
    projectName: string,
    description: string
  ): Promise<{ success: boolean; files: Array<{ name: string; content: string }>; projectName?: string; error?: string }> {
    const projectPrompt = 
'YOUR RESPONSE MUST BE PURE JSON ONLY. No markdown, explanations, code blocks, File: labels, or anything else.\n\n' +
'STEP 1: ANALYZE THE PROJECT\n' +
'First, think about what this project needs to do: "' + description + '"\n' +
'- What is the main functionality?\n' +
'- What classes, functions, or modules are needed?\n' +
'- What external libraries might be required?\n' +
'- How should the code be organized?\n\n' +
'STEP 2: DESIGN THE FILE STRUCTURE\n' +
'Based on the analysis, decide which files are necessary:\n' +
'- Simple projects: main.cpp + README.md\n' +
'- Medium projects: main.cpp + header files + implementation files + README.md\n' +
'- Complex projects: main.cpp + multiple .h/.cpp pairs + CMakeLists.txt + README.md\n\n' +
'STEP 3: WRITE WORKING CODE\n' +
'For each file, write COMPLETE, COMPILABLE C++ code that actually works:\n' +
'- Include all necessary headers\n' +
'- Write complete functions with proper syntax\n' +
'- Make sure the code compiles and runs\n' +
'- Add meaningful comments explaining the logic\n' +
'- Handle basic error cases\n\n' +
'CRITICAL REQUIREMENTS:\n' +
'- Write REAL, WORKING C++ code, not placeholder comments\n' +
'- Every file must contain complete, compilable code\n' +
'- main.cpp must have a working main() function\n' +
'- Use proper C++11/14/17 standards\n' +
'- Include error handling where appropriate\n' +
'- Make the code demonstrate the project\'s purpose\n\n' +
'RESPONSE FORMAT (PURE JSON ONLY):\n' +
'{\n' +
'  "projectName": "' + projectName + '",\n' +
'  "files": {\n' +
'    "main.cpp": "#include <iostream>\\n#include <string>\\nusing namespace std;\\n\\nint main() {\\n    cout << \\"Welcome to ' + projectName + '!\\" << endl;\\n    // Your main logic here\\n    return 0;\\n}",\n' +
'    "README.md": "# ' + projectName + '\\n\\n## Description\\n' + description + '\\n\\n## How to Compile\\n```bash\\ng++ -o ' + projectName + ' main.cpp\\n```\\n\\n## How to Run\\n```bash\\n./' + projectName + '\\n```"\n' +
'  }\n' +
'}\n\n' +
'EXAMPLES OF GOOD CODE:\n' +
'- main.cpp should have: #include statements, using namespace std, int main() function\n' +
'- Header files should have: #pragma once, class/function declarations\n' +
'- Implementation files should have: #include statements, function implementations\n' +
'- README.md should have: project description, compilation instructions, usage examples\n\n' +
'User description: ' + description + '\n' +
'Project language: C++\n' +
'Project name: ' + projectName + '\n\n' +
'Remember: Write COMPLETE, WORKING code that demonstrates the project\'s functionality.';

    const response = await this.askGemini(projectPrompt);
    this.logger.log('[createCppProject] Raw AI response:', response);
    
    const { projectName: aiProjectName, files } = this.parseProjectJsonResponse(response);
    const fileArr = Object.entries(files).map(([name, content]) => ({ name, content: (content as string).trim() }));
    
    // Debug log
    this.logger.log('[createCppProject] Generated files:', fileArr);
    
    return {
      success: true,
      files: fileArr,
      projectName: aiProjectName
    };
  }

  // C Projesi için özel fonksiyon
  private async createCProject(
    projectName: string,
    description: string
  ): Promise<{ success: boolean; files: Array<{ name: string; content: string }>; projectName?: string; error?: string }> {
    const projectPrompt = 
'YOUR RESPONSE MUST BE PURE JSON ONLY. No markdown, explanations, code blocks, File: labels, or anything else.\n\n' +
'STEP 1: ANALYZE THE PROJECT\n' +
'First, think about what this project needs to do: "' + description + '"\n' +
'- What is the main functionality?\n' +
'- What functions or modules are needed?\n' +
'- What external libraries might be required?\n' +
'- How should the code be organized?\n\n' +
'STEP 2: DESIGN THE FILE STRUCTURE\n' +
'Based on the analysis, decide which files are necessary:\n' +
'- Simple projects: main.c + README.md\n' +
'- Medium projects: main.c + header files + implementation files + README.md\n' +
'- Complex projects: main.c + multiple .h/.c pairs + Makefile + README.md\n\n' +
'STEP 3: WRITE WORKING CODE\n' +
'For each file, write COMPLETE, COMPILABLE C code that actually works:\n' +
'- Include all necessary headers\n' +
'- Write complete functions with proper syntax\n' +
'- Make sure the code compiles and runs\n' +
'- Add meaningful comments explaining the logic\n' +
'- Handle basic error cases\n\n' +
'CRITICAL REQUIREMENTS:\n' +
'- Write REAL, WORKING C code, not placeholder comments\n' +
'- Every file must contain complete, compilable code\n' +
'- main.c must have a working main() function\n' +
'- Use proper C99/C11 standards\n' +
'- Include error handling where appropriate\n' +
'- Make the code demonstrate the project\'s purpose\n\n' +
'RESPONSE FORMAT (PURE JSON ONLY):\n' +
'{\n' +
'  "projectName": "' + projectName + '",\n' +
'  "files": {\n' +
'    "main.c": "#include <stdio.h>\\n#include <stdlib.h>\\n\\nint main() {\\n    printf(\\"Welcome to ' + projectName + '!\\\\n\\");\\n    // Your main logic here\\n    return 0;\\n}",\n' +
'    "README.md": "# ' + projectName + '\\n\\n## Description\\n' + description + '\\n\\n## How to Compile\\n```bash\\ngcc -o ' + projectName + ' main.c\\n```\\n\\n## How to Run\\n```bash\\n./' + projectName + '\\n```"\n' +
'  }\n' +
'}\n\n' +
'EXAMPLES OF GOOD CODE:\n' +
'- main.c should have: #include statements, int main() function\n' +
'- Header files should have: #ifndef guards, function declarations\n' +
'- Implementation files should have: #include statements, function implementations\n' +
'- README.md should have: project description, compilation instructions, usage examples\n\n' +
'User description: ' + description + '\n' +
'Project language: C\n' +
'Project name: ' + projectName + '\n\n' +
'Remember: Write COMPLETE, WORKING code that demonstrates the project\'s functionality.';

    const response = await this.askGemini(projectPrompt);
    this.logger.log('[createCProject] Raw AI response:', response);
    
    const { projectName: aiProjectName, files } = this.parseProjectJsonResponse(response);
    const fileArr = Object.entries(files).map(([name, content]) => ({ name, content: (content as string).trim() }));
    
    // Debug log
    this.logger.log('[createCProject] Generated files:', fileArr);
    
    return {
      success: true,
      files: fileArr,
      projectName: aiProjectName
    };
  }

  // Yeni JSON parse fonksiyonu
  private parseProjectJsonResponse(response: string): { projectName?: string; files: Record<string, string> } {
    let jsonText = response.trim();
    
    // Markdown kod bloğunu temizle (daha güçlü regex)
    if (jsonText.includes('```json')) {
      jsonText = jsonText.replace(/```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonText.includes('```')) {
      jsonText = jsonText.replace(/```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Debug için log
    this.logger.log('[parseProjectJsonResponse] Cleaned JSON text:', jsonText);
    
    try {
      const obj = JSON.parse(jsonText);
      if (obj.files && typeof obj.files === 'object') {
        return { projectName: obj.projectName, files: obj.files };
      } else {
        // fallback: tek dosya objesi
        return { files: obj };
      }
    } catch (error) {
      this.logger.error('[parseProjectJsonResponse] JSON parse error:', error);
      this.logger.error('[parseProjectJsonResponse] Raw response:', response);
      this.logger.error('[parseProjectJsonResponse] Cleaned text:', jsonText);
      throw new Error('AI yanıtı JSON formatında parse edilemedi');
    }
  }

  private getCommandInstructions(command: string): string {
    switch (command.toLowerCase()) {
      case 'create_file':
        return 'Yeni bir dosya oluştur. Dosya adını ve içeriğini belirt.';
      case 'write_to_file':
        return 'Belirtilen dosyaya kod yaz. Mevcut içeriği koru veya güncelle.';
      case 'modify_file':
        return 'Belirtilen dosyayı değiştir. Mevcut kodu iyileştir veya düzelt.';
      case 'add_function':
        return 'Belirtilen dosyaya yeni fonksiyon ekle.';
      case 'refactor':
        return 'Kodu yeniden yapılandır. Daha temiz ve verimli hale getir.';
      case 'split_file':
        return 'Dosyayı mantıklı parçalara ayır. Header ve implementation dosyaları oluştur.';
      default:
        return 'Genel kod üretimi yap.';
    }
  }
} 