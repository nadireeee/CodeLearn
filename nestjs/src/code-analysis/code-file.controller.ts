import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  UseGuards, 
  Request,
  Logger 
} from '@nestjs/common';
import { CodeFileService } from './code-file.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';

@Controller('code-files')
@UseGuards(JwtAuthGuard)
export class CodeFileController {
  private readonly logger = new Logger(CodeFileController.name);

  constructor(private readonly codeFileService: CodeFileService) {}

  @Post()
  async createFile(@Request() req, @Body() createFileDto: {
    name: string;
    content: string;
    language?: string;
    isActive?: boolean;
    projectId?: string;
  }) {
    this.logger.log(`Creating file for user: ${req.user.userId}`);
    return this.codeFileService.createFile(req.user.userId, createFileDto);
  }

  @Get()
  async getUserFiles(@Request() req) {
    this.logger.log(`Getting files for user: ${req.user.userId}`);
    return this.codeFileService.getUserFiles(req.user.userId);
  }

  @Get(':id')
  async getFileById(@Request() req, @Param('id') fileId: string) {
    this.logger.log(`Getting file ${fileId} for user: ${req.user.userId}`);
    return this.codeFileService.getFileById(fileId, req.user.userId);
  }

  @Put(':id')
  async updateFile(@Request() req, @Param('id') fileId: string, @Body() updateFileDto: {
    name?: string;
    content?: string;
    language?: string;
    isActive?: boolean;
  }) {
    this.logger.log(`Updating file ${fileId} for user: ${req.user.userId}`);
    return this.codeFileService.updateFile(fileId, req.user.userId, updateFileDto);
  }

  @Delete(':id')
  async deleteFile(@Request() req, @Param('id') fileId: string) {
    this.logger.log(`Deleting file ${fileId} for user: ${req.user.userId}`);
    return this.codeFileService.deleteFile(fileId, req.user.userId);
  }

  @Put(':id/active')
  async setActiveFile(@Request() req, @Param('id') fileId: string) {
    this.logger.log(`Setting active file ${fileId} for user: ${req.user.userId}`);
    return this.codeFileService.setActiveFile(fileId, req.user.userId);
  }

  @Post('save-all')
  async saveAllFiles(@Request() req, @Body() files: Array<{
    id?: string;
    name: string;
    content: string;
    language: string;
    isActive: boolean;
  }>) {
    this.logger.log(`Saving all files for user: ${req.user.userId}`);
    return this.codeFileService.saveAllFiles(req.user.userId, files);
  }
} 