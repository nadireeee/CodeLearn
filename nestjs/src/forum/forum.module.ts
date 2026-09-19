import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ForumController } from './forum.controller';
import { ForumService } from './forum.service';
import { Question, Answer, Comment, Vote, Tag } from '../entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([Question, Answer, Comment, Vote, Tag]),
  ],
  controllers: [ForumController],
  providers: [ForumService],
  exports: [ForumService],
})
export class ForumModule {} 