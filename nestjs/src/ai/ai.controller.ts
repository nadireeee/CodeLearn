import {
  Body,
  Controller,
  Get,
  Post,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { User } from 'src/entities/user.entity';
import { AiService } from './ai.service';
import { RandomQuestionAgent } from './agents/random-question.agent';
import { OnboardingService } from '../onboarding/onboarding.service';
import { ProjectService } from '../project/project.service';
import { BadgeService } from '../badge/badge.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

class ConversationMessageDto {
  @IsString()
  role: 'user' | 'assistant';

  @IsString()
  content: string;

  @IsOptional()
  timestamp?: Date;
}

export class ChatMessageDto {
  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConversationMessageDto)
  conversationHistory?: ConversationMessageDto[];
}

@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly randomQuestionAgent: RandomQuestionAgent,
    private readonly onboardingService: OnboardingService,
    private readonly projectService: ProjectService,
    private readonly badgeService: BadgeService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('welcome')
  async getWelcomeMessage(@CurrentUser() user: User, @Query('language') language?: string) {
    if (!user || !user.id) {
      console.error('[AI] User is null or missing ID in welcome endpoint');
      throw new UnauthorizedException('User not authenticated');
    }

    try {
      console.log('[AI] Welcome request from user:', user.id);
      // Get language from query or user
      const userLanguage = language || user.language || 'tr'; // Default to Turkish
      console.log('[AI] User language preference for welcome:', userLanguage);
      
      const welcomeMessage = await this.aiService.getWelcomeMessage({}, userLanguage);

      return {
        message: welcomeMessage,
        character: {
          name: 'Chead',
          avatar: '🤖',
          description: 'AI Programming Assistant',
        },
      };
    } catch (error) {
      console.error('Error getting welcome message:', error);
      return {
        message: "Merhaba! Ben Chead, programlama öğrenme yolculuğunda size yardımcı olacak AI asistanınız. Nasıl yardımcı olabilirim?",
        character: {
          name: 'Chead',
          avatar: '🤖',
          description: 'AI Programming Assistant',
        },
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('chat')
  @HttpCode(HttpStatus.OK)
  async chat(@CurrentUser() user: User, @Body() chatMessageDto: ChatMessageDto & { language?: string }) {
    if (!user || !user.id) {
      console.error('[AI] User is null or missing ID in chat endpoint');
      throw new UnauthorizedException('User not authenticated');
    }

    console.log('[AI] Chat request from user:', user.id);
    console.log('[AI] Message:', chatMessageDto.message);
    console.log('[AI] SessionId:', chatMessageDto.sessionId);
    
    try {
      // Get language from body or user
      const userLanguage = chatMessageDto.language || user.language || 'tr'; // Default to Turkish
      console.log('[AI] User language preference:', userLanguage);
      
      const response = await this.aiService.generateResponse(
        chatMessageDto.message,
        user.id,
        {}, // Boş preferences
        chatMessageDto.sessionId,
        userLanguage
      );

      console.log('[AI] Response generated successfully');
      return {
        response: response,
        character: {
          name: 'Chead',
          avatar: '🤖',
          description: 'AI Programming Assistant',
        },
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('[AI] Error in chat:', error);
      return {
        response: "Üzgünüm, şu anda size yardımcı olamıyorum. Lütfen daha sonra tekrar deneyin.",
        character: {
          name: 'Chead',
          avatar: '🤖',
          description: 'AI Programming Assistant',
        },
        timestamp: new Date(),
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('chat/history')
  async getChatHistory(
    @CurrentUser() user: User,
    @Query('sessionId') sessionId?: string
  ) {
    if (!user || !user.id) {
      console.error('[AI] User is null or missing ID in chat history endpoint');
      throw new UnauthorizedException('User not authenticated');
    }

    try {
      console.log('[AI] Chat history request from user:', user.id);
      const history = await this.aiService.getChatHistory(user.id, sessionId);
      return {
        messages: history,
        sessionId: sessionId || 'default',
      };
    } catch (error) {
      console.error('Error getting chat history:', error);
      return {
        messages: [],
        sessionId: sessionId || 'default',
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete('chat/history')
  async clearChatHistory(
    @CurrentUser() user: User,
    @Query('sessionId') sessionId?: string
  ) {
    if (!user || !user.id) {
      console.error('[AI] User is null or missing ID in clear chat history endpoint');
      throw new UnauthorizedException('User not authenticated');
    }

    try {
      console.log('[AI] Clear chat history request from user:', user.id);
      await this.aiService.clearChatHistory(user.id, sessionId);
      return {
        message: 'Chat history cleared successfully',
        sessionId: sessionId || 'default',
      };
    } catch (error) {
      console.error('Error clearing chat history:', error);
      return {
        message: 'Failed to clear chat history',
        sessionId: sessionId || 'default',
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('random-question')
  @HttpCode(HttpStatus.OK)
  async randomQuestion(@CurrentUser() user: User, @Body() body: any) {
    try {
      // Get user preferences from onboarding
      let userPreferences = await this.onboardingService.getUserPreferences(user.id);
      
      // If frontend sends user preferences, use them (they might be more up-to-date)
      if (body && body.userPreferences && Object.keys(body.userPreferences).length > 0) {
        userPreferences = { ...userPreferences, ...body.userPreferences };
        console.log('[AI] Using frontend user preferences:', body.userPreferences);
      }
      
      console.log('[AI] Final user preferences for random question:', userPreferences);
      
      // Get language and programming language from body
      const userLanguage = (body && body.language) || user.language || 'tr'; // Default to Turkish
      const programmingLanguage = (body && body.programmingLanguage) || 'cpp'; // Default to C++
      
      console.log('[AI] User language preference:', userLanguage);
      console.log('[AI] Programming language:', programmingLanguage);
      
      return this.randomQuestionAgent.generateRandomQuestion(userPreferences, userLanguage, programmingLanguage);
    } catch (error) {
      console.error('[AI] Error generating random question:', error);
      return {
        question: "Soru üretilemedi. Lütfen tekrar deneyin.",
        expectedAnswer: "",
        solutionCode: ""
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('random-question/evaluate')
  @HttpCode(HttpStatus.OK)
  async evaluateRandomQuestion(@CurrentUser() user: User, @Body() body: { question: string; userAnswer: string }) {
    try {
      // Get user language preference
      const userLanguage = user.language || 'tr'; // Default to Turkish
      console.log('[AI] User language preference for evaluation:', userLanguage);
      
      return this.randomQuestionAgent.evaluateAnswer(body.question, body.userAnswer, userLanguage);
    } catch (error) {
      console.error('[AI] Error evaluating random question:', error);
      return {
        evaluation: "Değerlendirme yapılamadı. Lütfen tekrar deneyin.",
        suggestions: [],
        suggestedCode: ""
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('compile')
  @HttpCode(HttpStatus.OK)
  async compileCode(@CurrentUser() user: User, @Body() body: { code: string; language: 'c' | 'cpp' }) {
    try {
      console.log('[AI] Compile request from user:', user.id);
      console.log('[AI] Language:', body.language);
      
      const result = await this.aiService.compileAndRunCode(body.code, body.language);
      
      return {
        success: result.success,
        output: result.output,
        error: result.error,
        executionTime: result.executionTime,
        memoryUsage: result.memoryUsage
      };
    } catch (error) {
      console.error('[AI] Error compiling code:', error);
      return {
        success: false,
        output: '',
        error: 'Kod derlenirken bir hata oluştu.',
        executionTime: 0,
        memoryUsage: 0
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('generate-code')
  async generateCode(@CurrentUser() user: User, @Body() body: { prompt: string; currentCode: string; language: 'c' | 'cpp' }) {
    if (!user || !user.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    const res = await this.aiService.generateCodeWithContext(
      body.prompt,
      body.currentCode,
      body.language
    );
    console.log('AI yanıtı:', res);
    let codeString = typeof res.code === 'string' ? res.code : JSON.stringify(res.code);
    const code = extractCodeFromAIResponse(codeString);
    if (!code) {
      console.error('AI kod üretemedi!');
      return;
    }
    return { code };
  }

  @UseGuards(JwtAuthGuard)
  @Post('file-command')
  async executeFileCommand(@CurrentUser() user: User, @Body() body: { 
    command: string; 
    prompt: string; 
    currentFiles?: Array<{ name: string; content: string; language: string }>;
    targetFile?: string;
  }) {
    if (!user || !user.id) {
      throw new UnauthorizedException('User not authenticated');
    }

    console.log('[AI] File command request:', body.command, 'from user:', user.id);
    
    try {
      const result = await this.aiService.executeFileCommand(
        body.command,
        body.prompt,
        body.currentFiles || [],
        body.targetFile
      );
      
      return result;
    } catch (error) {
      console.error('[AI] Error executing file command:', error);
      return {
        success: false,
        error: 'Dosya komutu çalıştırılırken hata oluştu.',
        files: []
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('create-project')
  async createProject(@CurrentUser() user: User, @Body() body: { 
    projectName: string;
    description: string;
    language: 'c' | 'cpp';
  }) {
    if (!user || !user.id) {
      throw new UnauthorizedException('User not authenticated');
    }

    console.log('[AI] Create project request:', body.projectName, 'from user:', user.id);
    
    try {
      // 1. AI'dan proje oluştur
      const aiResult = await this.aiService.createProject(
        body.projectName,
        body.description,
        body.language
      );
      
      if (!aiResult.success) {
        console.error('[AI] AI failed to create project:', aiResult.error);
        return {
          success: false,
          error: 'AI proje oluşturamadı: ' + aiResult.error,
          files: []
        };
      }

      // 2. Files array'ine language field'ını ekle
      const filesWithLanguage = aiResult.files.map(file => ({
        ...file,
        language: body.language
      }));

      // 3. MongoDB'ye kaydet
      console.log('[AI] Saving project to MongoDB...');
      const savedProject = await this.projectService.createProject({
        name: aiResult.projectName || body.projectName,
        userId: user.id,
        files: filesWithLanguage, // language field'ı ile birlikte
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Type casting ile _id'ye erişim
      const projectId = (savedProject as any)._id?.toString();
      console.log('[AI] Project saved to MongoDB with ID:', projectId);
      
      // Proje başarıyla oluşturulduysa, proje sayısını artır ve rozet kontrolü yap
      if (aiResult.success) {
        await this.userRepository.increment({ id: user.id }, 'totalCreatedProjects', 1);
        
        // Kullanıcı istatistiklerini güncelle
        const updatedUser = await this.userRepository.findOne({ where: { id: user.id } });
        const userStats = {
          totalSolvedQuestions: updatedUser.totalSolvedQuestions,
          totalCreatedProjects: updatedUser.totalCreatedProjects,
        };
        
        // Rozet kontrolü yap
        const newlyAwarded = await this.badgeService.checkAndAwardBadges(user.id, userStats);
        
        return {
          success: true,
          files: aiResult.files,
          projectName: aiResult.projectName,
          projectId: projectId,
          message: 'Proje başarıyla oluşturuldu ve kaydedildi.',
          newlyAwardedBadges: newlyAwarded,
        };
      }
      
      return {
        success: true,
        files: aiResult.files,
        projectName: aiResult.projectName,
        projectId: projectId,
        message: 'Proje başarıyla oluşturuldu ve kaydedildi.'
      };
      
    } catch (error) {
      console.error('[AI] Error creating project:', error);
      return {
        success: false,
        error: 'Proje oluşturulurken hata oluştu: ' + error.message,
        files: []
      };
    }
  }
}

function extractCodeFromAIResponse(response: string): string {
  const match = response.match(/```(?:cpp|c)?\\n([\\s\\S]*?)```/);
  if (match) return match[1].trim();
  return response;
} 