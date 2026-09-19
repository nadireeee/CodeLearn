import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project, ProjectDocument } from '../entities/project.entity';

@Injectable()
export class ProjectService {
  private readonly logger = new Logger(ProjectService.name);

  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
  ) {}

  async createProject(data: Partial<Project>): Promise<Project> {
    this.logger.log('[createProject] Creating project:', { name: data.name, userId: data.userId, fileCount: data.files?.length });
    
    const created = new this.projectModel(data);
    const savedProject = await created.save();
    
    this.logger.log('[createProject] Project created successfully:', { 
      id: savedProject._id, 
      name: savedProject.name,
      fileCount: savedProject.files?.length 
    });
    
    return savedProject;
  }

  async getUserProjects(userId: string): Promise<Project[]> {
    this.logger.log('[getUserProjects] Fetching projects for user:', userId);
    
    const projects = await this.projectModel.find({ userId }).sort({ updatedAt: -1 }).exec();
    
    this.logger.log('[getUserProjects] Found projects:', { 
      userId, 
      count: projects.length 
    });
    
    return projects;
  }

  async getProjectById(id: string): Promise<Project | null> {
    this.logger.log('[getProjectById] Fetching project:', id);
    
    const project = await this.projectModel.findById(id).exec();
    
    this.logger.log('[getProjectById] Project found:', { 
      id, 
      found: !!project,
      name: project?.name,
      fileCount: project?.files?.length 
    });
    
    return project;
  }

  async deleteProject(id: string, userId: string): Promise<void> {
    this.logger.log('[deleteProject] Deleting project:', { id, userId });
    
    const result = await this.projectModel.deleteOne({ _id: id, userId });
    
    this.logger.log('[deleteProject] Delete result:', { 
      id, 
      userId, 
      deletedCount: result.deletedCount 
    });
  }

  async updateProject(id: string, userId: string, update: Partial<Project>): Promise<Project | null> {
    this.logger.log('[updateProject] Updating project:', { id, userId, update });
    
    const project = await this.projectModel.findOneAndUpdate({ _id: id, userId }, update, { new: true }).exec();
    
    this.logger.log('[updateProject] Update result:', { 
      id, 
      userId, 
      updated: !!project,
      newName: project?.name 
    });
    
    return project;
  }

  async updateProjectFiles(id: string, userId: string, files: Array<{ name: string; content: string }>): Promise<Project | null> {
    this.logger.log('[updateProjectFiles] Updating files for project:', { id, userId, fileCount: files.length });
    
    const project = await this.projectModel.findOne({ _id: id, userId });
    if (!project) {
      this.logger.error('[updateProjectFiles] Project not found:', { id, userId });
      throw new NotFoundException('Project not found');
    }
    
    let updated = false;
    for (const fileUpdate of files) {
      const file = project.files.find(f => f.name === fileUpdate.name);
      if (file) {
        file.content = fileUpdate.content;
        updated = true;
        this.logger.log('[updateProjectFiles] Updated file:', { projectId: id, fileName: fileUpdate.name });
      }
    }
    
    if (updated) {
      await project.save();
      this.logger.log('[updateProjectFiles] Project files saved successfully:', { id, updatedFiles: files.length });
    } else {
      this.logger.warn('[updateProjectFiles] No files were updated:', { id, requestedFiles: files.map(f => f.name) });
    }
    
    return project;
  }
} 