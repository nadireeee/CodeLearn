import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Subject, SubjectDocument } from '../entities/subject.entity';
import { UserProgress, UserProgressDocument } from '../entities/user-progress.entity';
import { CreateSubjectDto } from './dto/create-subject.dto';

@Injectable()
export class SubjectsService {
  constructor(
    @InjectModel(Subject.name) private subjectModel: Model<SubjectDocument>,
    @InjectModel(UserProgress.name) private userProgressModel: Model<UserProgressDocument>,
  ) {}

  async getAllSubjects() {
    return this.subjectModel.find().sort({ order: 1 });
  }

  async create(createSubjectDto: CreateSubjectDto) {
    const subject = new this.subjectModel(createSubjectDto);
    return subject.save();
  }

  async getSubjectById(id: string) {
    return this.subjectModel.findOne({ id });
  }

  async getUserProgress(userId: string) {
    return this.userProgressModel.find({ userId }).sort({ updatedAt: -1 });
  }

  async getUserStats(userId: string) {
    const progress = await this.userProgressModel.find({ userId });
    const subjects = await this.getAllSubjects();

    const completedLessons = progress.filter(p => p.isCompleted).length;
    const totalSubjects = subjects.length;
    const completedSubjects = subjects.filter(subject => {
      const subjectProgress = progress.filter(p => p.subjectId === subject.id && p.isCompleted);
      return subjectProgress.length > 0;
    }).length;

    return {
      completedLessons,
      totalLessons: 0, // Will be updated when new lessons system is integrated
      completionRate: 0,
      completedSubjects,
      totalSubjects,
      totalTimeSpent: progress.reduce((sum, p) => sum + (p.timeSpent || 0), 0),
      averageScore: progress.length > 0 ? progress.reduce((sum, p) => sum + (p.score || 0), 0) / progress.length : 0,
    };
  }
}
