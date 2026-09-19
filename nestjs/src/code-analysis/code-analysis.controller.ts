import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  Body,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { CodeAnalysisService } from './code-analysis.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

interface CompileRequestDto {
  code: string;
  language: 'c' | 'cpp';
  stdin?: string;
}

@Controller('code-analysis')
@UseGuards(JwtAuthGuard)
export class CodeAnalysisController {
  constructor(private readonly codeAnalysisService: CodeAnalysisService) {}

  @Post('compile')
  @Public()
  async compileCode(
    @Body() compileRequest: CompileRequestDto,
    @CurrentUser() user: any,
  ) {
    const { code, language, stdin = '' } = compileRequest;
    
    if (!code || !code.trim()) {
      throw new BadRequestException('Code is required');
    }

    if (!['c', 'cpp'].includes(language)) {
      throw new BadRequestException('Language must be either "c" or "cpp"');
    }

    try {
      const result = await this.codeAnalysisService.compileAndRunCode(code, language, stdin);
      return {
        success: result.success,
        output: result.output,
        error: result.error,
        executionTime: result.executionTime,
        memoryUsage: result.memoryUsage,
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error.message || 'Compilation failed',
        executionTime: 0,
        memoryUsage: 0,
      };
    }
  }

  @Post('analyze')
  @Public()
  async analyzeCode(
    @Body() analyzeRequest: { code: string; language: 'c' | 'cpp'; question?: string },
  ) {
    const { code, language, question = 'Kodda hata var mı?' } = analyzeRequest;
    
    if (!code || !code.trim()) {
      throw new BadRequestException('Code is required');
    }

    if (!['c', 'cpp'].includes(language)) {
      throw new BadRequestException('Language must be either "c" or "cpp"');
    }

    try {
      const analysis = await this.codeAnalysisService.analyzeCodeWithAI(code, language, question);
      return {
        success: true,
        analysis,
      };
    } catch (error) {
      return {
        success: false,
        analysis: null,
        error: error.message || 'Analysis failed',
      };
    }
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAndAnalyze(
    @UploadedFile() file: Express.Multer.File,
    @Body('projectName') projectName: string,
    @CurrentUser() user: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!file.originalname.endsWith('.zip')) {
      throw new BadRequestException('Only ZIP files are supported');
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      throw new BadRequestException('File size too large (max 10MB)');
    }

    const analysis = await this.codeAnalysisService.analyzeZipFile(
      file.buffer,
      user.id,
      projectName || 'Unnamed Project',
      file.originalname,
    );

    return {
      success: true,
      analysis,
      message: 'Code analysis completed successfully',
    };
  }

  @Get('analyses')
  async getUserAnalyses(@CurrentUser() user: any) {
    const analyses = await this.codeAnalysisService.getUserAnalyses(user.id);
    return {
      success: true,
      analyses,
    };
  }

  @Get('analyses/:id')
  async getAnalysisById(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    const analysis = await this.codeAnalysisService.getAnalysisById(id, user.id);
    return {
      success: true,
      analysis,
    };
  }

  @Delete('analyses/:id')
  async deleteAnalysis(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    await this.codeAnalysisService.deleteAnalysis(id, user.id);
    return {
      success: true,
      message: 'Analysis deleted successfully',
    };
  }
} 