import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CodeFile, CodeFileDocument } from './schemas/code-file.schema';

@Injectable()
export class CodeFileService {
  private readonly logger = new Logger(CodeFileService.name);

  constructor(
    @InjectModel(CodeFile.name) private codeFileModel: Model<CodeFileDocument>,
  ) {}

  async createFile(userId: string, createFileDto: {
    name: string;
    content: string;
    language?: string;
    isActive?: boolean;
    projectId?: string;
  }): Promise<CodeFile> {
    try {
      // If this is the first file or isActive is true, deactivate other files
      if (createFileDto.isActive) {
        await this.codeFileModel.updateMany(
          { userId },
          { isActive: false }
        );
      }

      const codeFile = new this.codeFileModel({
        userId,
        ...createFileDto,
      });

      await codeFile.save();
      this.logger.log(`Created file: ${createFileDto.name} for user: ${userId}`);

      return codeFile;
    } catch (error) {
      this.logger.error('Error creating file:', error);
      throw new BadRequestException('Failed to create file');
    }
  }

  async getUserFiles(userId: string): Promise<CodeFile[]> {
    try {
      const files = await this.codeFileModel
        .find({ userId })
        .sort({ updatedAt: -1 })
        .exec();

      this.logger.log(`Retrieved ${files.length} files for user: ${userId}`);
      return files;
    } catch (error) {
      this.logger.error('Error getting user files:', error);
      throw new BadRequestException('Failed to get user files');
    }
  }

  async getFileById(fileId: string, userId: string): Promise<CodeFile> {
    try {
      const file = await this.codeFileModel.findOne({ _id: fileId, userId }).exec();
      
      if (!file) {
        throw new NotFoundException('File not found');
      }

      return file;
    } catch (error) {
      this.logger.error('Error getting file by ID:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to get file');
    }
  }

  async updateFile(fileId: string, userId: string, updateFileDto: {
    name?: string;
    content?: string;
    language?: string;
    isActive?: boolean;
  }): Promise<CodeFile> {
    try {
      // If setting this file as active, deactivate others
      if (updateFileDto.isActive) {
        await this.codeFileModel.updateMany(
          { userId, _id: { $ne: fileId } },
          { isActive: false }
        );
      }

      const file = await this.codeFileModel.findOneAndUpdate(
        { _id: fileId, userId },
        { 
          ...updateFileDto,
          updatedAt: new Date()
        },
        { new: true }
      ).exec();

      if (!file) {
        throw new NotFoundException('File not found');
      }

      this.logger.log(`Updated file: ${file.name} for user: ${userId}`);
      return file;
    } catch (error) {
      this.logger.error('Error updating file:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to update file');
    }
  }

  async deleteFile(fileId: string, userId: string): Promise<void> {
    try {
      const file = await this.codeFileModel.findOneAndDelete({ _id: fileId, userId }).exec();
      
      if (!file) {
        throw new NotFoundException('File not found');
      }

      // If this was the active file, make another file active
      if (file.isActive) {
        const remainingFiles = await this.codeFileModel.find({ userId }).exec();
        if (remainingFiles.length > 0) {
          await this.codeFileModel.findByIdAndUpdate(
            remainingFiles[0]._id,
            { isActive: true }
          );
        }
      }

      this.logger.log(`Deleted file: ${file.name} for user: ${userId}`);
    } catch (error) {
      this.logger.error('Error deleting file:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete file');
    }
  }

  async setActiveFile(fileId: string, userId: string): Promise<CodeFile> {
    try {
      // Deactivate all files
      await this.codeFileModel.updateMany(
        { userId },
        { isActive: false }
      );

      // Activate the specified file
      const file = await this.codeFileModel.findOneAndUpdate(
        { _id: fileId, userId },
        { isActive: true },
        { new: true }
      ).exec();

      if (!file) {
        throw new NotFoundException('File not found');
      }

      this.logger.log(`Set active file: ${file.name} for user: ${userId}`);
      return file;
    } catch (error) {
      this.logger.error('Error setting active file:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to set active file');
    }
  }

  async saveAllFiles(userId: string, files: Array<{
    id?: string;
    name: string;
    content: string;
    language: string;
    isActive: boolean;
  }>): Promise<CodeFile[]> {
    try {
      const savedFiles: CodeFile[] = [];

      for (const fileData of files) {
        if (fileData.id) {
          // Update existing file
          const updatedFile = await this.updateFile(fileData.id, userId, {
            name: fileData.name,
            content: fileData.content,
            language: fileData.language,
            isActive: fileData.isActive,
          });
          savedFiles.push(updatedFile);
        } else {
          // Create new file
          const newFile = await this.createFile(userId, {
            name: fileData.name,
            content: fileData.content,
            language: fileData.language,
            isActive: fileData.isActive,
          });
          savedFiles.push(newFile);
        }
      }

      this.logger.log(`Saved ${savedFiles.length} files for user: ${userId}`);
      return savedFiles;
    } catch (error) {
      this.logger.error('Error saving all files:', error);
      throw new BadRequestException('Failed to save files');
    }
  }
} 