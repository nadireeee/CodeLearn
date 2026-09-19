import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { CreateSubjectDto } from './dto/create-subject.dto';

@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  // Tüm bölümleri getir
  @Public()
  @Get()
  async getAllSubjects() {
    return this.subjectsService.getAllSubjects();
  }

  // Bölüm detayını getir
  @Public()
  @Get(':id')
  async getSubjectById(@Param('id') id: string) {
    return this.subjectsService.getSubjectById(id);
  }

  // Kullanıcının ilerlemesini getir
  @UseGuards(JwtAuthGuard)
  @Get('progress/user')
  async getUserProgress(@Request() req) {
    return this.subjectsService.getUserProgress(req.user.id);
  }

  // Kullanıcının genel istatistiklerini getir
  @UseGuards(JwtAuthGuard)
  @Get('stats/user')
  async getUserStats(@Request() req) {
    return this.subjectsService.getUserStats(req.user.id);
  }

  @Post()
  async create(@Body() createSubjectDto: CreateSubjectDto) {
    return this.subjectsService.create(createSubjectDto);
  }
} 