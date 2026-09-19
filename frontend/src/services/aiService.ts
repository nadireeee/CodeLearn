import api from './api';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface AiResponse {
  response: string;
}

export interface WelcomeResponse {
  learningProgress: any | null;
  message?: string; // Optional welcome message
}

export type ChatHistoryResponse = ChatMessage[];

export interface CodeAnalysisResult {
  success: boolean;
  analysis?: string;
  error?: string;
}

export interface CompilationResult {
  success: boolean;
  output: string;
  error: string;
  executionTime: number;
  memoryUsage: number;
}

export interface CodeIntelligenceSession {
  sessionId: string;
  language: 'c' | 'cpp';
  question?: string;
  createdAt: Date;
}

export interface CodeSuggestion {
  id: string;
  type: 'completion' | 'error-fix' | 'optimization';
  suggestion: string;
  explanation: string;
  applied: boolean;
  createdAt: Date;
}

class AiService {
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async getWelcomeMessage(language?: string): Promise<WelcomeResponse> {
    try {
      const params = language ? `?language=${language}` : '';
      const response = await api.get(`/ai/welcome${params}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get welcome message:', error);
      // Fallback response
      return {
        learningProgress: null,
        message: language === 'en' 
          ? 'Hello! I am CodeLearn AI, here to help you on your programming learning journey. How can we start?'
          : 'Merhaba! Ben CodeLearn AI, programlama öğrenme yolculuğunda size yardımcı olmak için buradayım. Nasıl başlayabiliriz?',
      };
    }
  }

  async sendMessage(message: string, language?: string): Promise<AiResponse> {
    try {
      const response = await api.post('/ai/chat', {
        message,
        language,
      });
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.status === 401) {
        console.warn('[AI] 401 Unauthorized! Kullanıcı oturumu sona erdi.');
        throw new Error('Oturumunuz sona erdi. Lütfen tekrar giriş yapın.');
      }
      if (error.response && error.response.status === 500) {
        throw new Error('AI servisi şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.');
      }
      throw new Error(error.message || 'Bilinmeyen bir hata oluştu.');
    }
  }

  async getChatHistory(): Promise<ChatHistoryResponse> {
    try {
      const response = await api.get('/ai/chat/history');
      return response.data;
    } catch (error) {
      console.error('Failed to get chat history:', error);
      // Fallback response
      return [];
    }
  }

  async clearChatHistory(): Promise<{ message: string }> {
    try {
      const response = await api.delete('/ai/chat/history');
      return response.data;
    } catch (error) {
      console.error('Failed to clear chat history:', error);
      throw error;
    }
  }

  async evaluateAnswer(question: string, userAnswer: string): Promise<{
    isCorrect: boolean;
    feedback: string;
    explanation: string;
    suggestedCode?: string;
  }> {
    try {
      const response = await api.post('/ai/evaluate', {
        question,
        userAnswer,
      });
      return response.data;
    } catch (error) {
      console.error('Error evaluating answer:', error);
      throw error;
    }
  }

  // Code Analysis Methods
  async analyzeCode(code: string, language: 'c' | 'cpp', question?: string): Promise<CodeAnalysisResult> {
    try {
      const response = await api.post('/code-analysis/analyze', {
        code,
        language,
        question: question || 'Kodda hata var mı? Kodun kalitesi nasıl?'
      });
      return response.data;
    } catch (error) {
      console.error('Error analyzing code:', error);
      return {
        success: false,
        error: 'Kod analizi başarısız oldu.'
      };
    }
  }

  async compileCode(code: string, language: 'c' | 'cpp', stdin?: string): Promise<CompilationResult> {
    try {
      const response = await api.post('/code-analysis/compile', {
        code,
        language,
        stdin: stdin || ''
      });
      return response.data;
    } catch (error) {
      console.error('Error compiling code:', error);
      return {
        success: false,
        output: '',
        error: 'Kod derleme başarısız oldu.',
        executionTime: 0,
        memoryUsage: 0
      };
    }
  }

  // Code Intelligence Methods
  async startCodeSession(language: 'c' | 'cpp', question?: string): Promise<CodeIntelligenceSession> {
    try {
      const sessionId = this.generateSessionId();
      const response = await api.post('/code-intelligence/sessions', {
        sessionId,
        language,
        question
      });
      return response.data;
    } catch (error) {
      console.error('Error starting code session:', error);
      // ✅ Fallback session oluştur
      return {
        sessionId: this.generateSessionId(),
        language,
        question,
        createdAt: new Date()
      };
    }
  }

  async analyzeCodeChange(sessionId: string, code: string, language: 'c' | 'cpp', question?: string): Promise<any> {
    try {
      const response = await api.post('/code-intelligence/analyze', {
        sessionId,
        code,
        language,
        question
      });
      return response.data;
    } catch (error) {
      console.error('Error analyzing code change:', error);
      throw error;
    }
  }

  async getCompletionSuggestions(sessionId: string, code: string, language: 'c' | 'cpp', cursorPosition: number): Promise<string[]> {
    try {
      const response = await api.post('/code-intelligence/completion', {
        sessionId,
        code,
        language,
        cursorPosition
      });
      // ✅ Backend response formatına uygun
      return response.data.suggestions || [];
    } catch (error) {
      console.error('Error getting completion suggestions:', error);
      return [];
    }
  }

  async getErrorFixes(sessionId: string, code: string, language: 'c' | 'cpp', errors: any[]): Promise<any[]> {
    try {
      const response = await api.post('/code-intelligence/error-fixes', {
        sessionId,
        code,
        language,
        errors
      });
      return response.data.fixes || [];
    } catch (error) {
      console.error('Error getting error fixes:', error);
      return [];
    }
  }

  async chatWithAI(sessionId: string, code: string, language: 'c' | 'cpp', message: string): Promise<AiResponse> {
    try {
      const response = await api.post('/code-intelligence/chat', {
        sessionId,
        message,
        code,
        language
      });
      return response.data;
    } catch (error) {
      console.error('Error chatting with AI:', error);
      throw error;
    }
  }

  async optimizeCode(code: string, language: 'c' | 'cpp', focus?: 'performance' | 'readability' | 'security'): Promise<{
    optimizedCode: string;
    explanation: string;
    improvements: string[];
  }> {
    try {
      const response = await api.post('/code-intelligence/optimize', {
        code,
        language,
        focus
      });
      return response.data;
    } catch (error) {
      console.error('Error optimizing code:', error);
      throw error;
    }
  }

  async getUserSuggestions(sessionId?: string, type?: string): Promise<CodeSuggestion[]> {
    try {
      const params = new URLSearchParams();
      if (sessionId) params.append('sessionId', sessionId);
      if (type) params.append('type', type);
      
      const response = await api.get(`/code-intelligence/suggestions?${params.toString()}`);
      return response.data.suggestions || [];
    } catch (error) {
      console.error('Error getting user suggestions:', error);
      return [];
    }
  }

  // AI Code Generation with Context
  async generateCodeWithContext(prompt: string, currentCode: string, language: 'c' | 'cpp'): Promise<{
    code: string;
    explanation: string;
    suggestions: string[];
  }> {
    try {
      const response = await api.post('/ai/generate-code', {
        prompt,
        currentCode,
        language
      });
      return {
        code: response.data.code,
        explanation: 'Kod başarıyla üretildi.',
        suggestions: []
      };
    } catch (error) {
      console.error('Error generating code with context:', error);
      throw new Error('Kod üretilirken hata oluştu.');
    }
  }

  // ✅ Code Insights metodu
  async getCodeInsights(sessionId: string, code: string, language: 'c' | 'cpp'): Promise<{
    performanceSuggestions: Array<{
      title: string;
      description: string;
      impact: 'low' | 'medium' | 'high';
      effort: 'low' | 'medium' | 'high';
      code?: string;
    }>;
    refactoringSuggestions: Array<{
      title: string;
      description: string;
      impact: 'low' | 'medium' | 'high';
      effort: 'low' | 'medium' | 'high';
      code?: string;
    }>;
    errors: Array<{
      line: number;
      message: string;
      severity: 'error' | 'warning' | 'info';
    }>;
    codeSmells: Array<{
      line: number;
      message: string;
      type: string;
    }>;
  }> {
    try {
      const response = await api.post('/code-intelligence/insights', {
        sessionId,
        code,
        language
      });
      return response.data;
    } catch (error) {
      console.error('Error getting code insights:', error);
      // Fallback response
      return {
        performanceSuggestions: [],
        refactoringSuggestions: [],
        errors: [],
        codeSmells: []
      };
    }
  }

  async executeFileCommand(
    command: string, 
    prompt: string, 
    currentFiles: Array<{ name: string; content: string; language: string }>,
    targetFile?: string
  ): Promise<{
    success: boolean;
    files: Array<{ name: string; content: string; language: string }>;
    error?: string;
  }> {
    try {
      const response = await api.post('/ai/file-command', {
        command,
        prompt,
        currentFiles,
        targetFile
      });
      return response.data;
    } catch (error) {
      console.error('Error executing file command:', error);
      return {
        success: false,
        files: [],
        error: 'Dosya komutu çalıştırılırken hata oluştu.'
      };
    }
  }

  async createProject(
    projectName: string,
    description: string,
    language: 'c' | 'cpp'
  ): Promise<{
    success: boolean;
    files: Array<{ name: string; content: string; language: string }>;
    error?: string;
  }> {
    try {
      const response = await api.post('/ai/create-project', {
        projectName,
        description,
        language
      });
      return response.data;
    } catch (error) {
      console.error('Error creating project:', error);
      return {
        success: false,
        files: [],
        error: 'Proje oluşturulurken hata oluştu.'
      };
    }
  }
}

export default new AiService(); 