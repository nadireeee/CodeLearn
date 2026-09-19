import { Controller, Get, Post, Body, Param, Delete, Put, Patch, Req, Res, UseGuards } from '@nestjs/common';
import { ProjectService } from './project.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { Request, Response } from 'express';
import * as AdmZip from 'adm-zip';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  async create(@Req() req: Request, @Body() body: { name: string; files: any[] }) {
    const userId = req.user['id'];
    const project = await this.projectService.createProject({
      name: body.name,
      userId,
      files: body.files,
    });
    return project;
  }

  @Get()
  async findAll(@Req() req: Request) {
    const userId = req.user['id'];
    console.log('[ProjectController] GET /projects called for user:', userId);
    const projects = await this.projectService.getUserProjects(userId);
    console.log('[ProjectController] Returning projects:', { count: projects.length, projects: projects.map(p => ({ id: (p as any)._id, name: p.name })) });
    return projects;
  }

  @Get(':id')
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const userId = req.user['id'];
    const project = await this.projectService.getProjectById(id);
    if (!project || project.userId !== userId) return null;
    return project;
  }

  @Delete(':id')
  async remove(@Req() req: Request, @Param('id') id: string) {
    const userId = req.user['id'];
    await this.projectService.deleteProject(id, userId);
    return { success: true };
  }

  @Put(':id')
  async update(@Req() req: Request, @Param('id') id: string, @Body() update: any) {
    const userId = req.user['id'];
    return this.projectService.updateProject(id, userId, update);
  }

  @Patch(':id/files')
  async updateFiles(
    @Req() req: Request,
    @Param('id') id: string,
    @Body('files') files: Array<{ name: string; content: string }>
  ) {
    const userId = req.user['id'];
    return this.projectService.updateProjectFiles(id, userId, files);
  }

  @Get(':id/download')
  async download(@Req() req: Request, @Res() res: Response, @Param('id') id: string) {
    const userId = req.user['id'];
    const project = await this.projectService.getProjectById(id);
    if (!project || project.userId !== userId) {
      return res.status(404).send('Not found');
    }
    const zip = new AdmZip();
    for (const file of project.files) {
      zip.addFile(file.name, Buffer.from(file.content, 'utf-8'));
    }
    const zipBuffer = zip.toBuffer();
    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${project.name}.zip"`,
    });
    res.send(zipBuffer);
  }
} 