import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { Question, Answer, Comment, Vote, Tag, QuestionStatus, VoteType } from '../entities';
import { CreateQuestionDto, CreateAnswerDto, CreateCommentDto, VoteDto, GetQuestionsQueryDto } from './dto';
import { User } from '../entities/user.entity';
import { Role } from '../auth/enums/role.enum';

@Injectable()
export class ForumService {
  constructor(
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    @InjectRepository(Answer)
    private answerRepository: Repository<Answer>,
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    @InjectRepository(Vote)
    private voteRepository: Repository<Vote>,
    @InjectRepository(Tag)
    private tagRepository: Repository<Tag>,
  ) {}

  // Question methods
  async createQuestion(createQuestionDto: CreateQuestionDto, user: User): Promise<Question> {
    const { tags, ...questionData } = createQuestionDto;
    
    // Handle tags
    let tagEntities: Tag[] = [];
    if (tags && tags.length > 0) {
      tagEntities = await this.getOrCreateTags(tags);
    }

    const question = this.questionRepository.create({
      ...questionData,
      author: user,
      authorId: user.id,
      tags: tagEntities,
    });

    const savedQuestion = await this.questionRepository.save(question);
    
    // Return the question with author relation loaded
    return this.questionRepository.findOne({
      where: { id: savedQuestion.id },
      relations: ['author', 'tags']
    });
  }

  async getQuestions(query: GetQuestionsQueryDto): Promise<{ questions: Question[]; total: number }> {
    const { search, category, tags, sortBy, limit, page } = query;
    
    const queryBuilder = this.questionRepository
      .createQueryBuilder('question')
      .leftJoinAndSelect('question.author', 'author')
      .leftJoinAndSelect('question.tags', 'tags')
      .leftJoinAndSelect('question.answers', 'answers');

    // Apply filters
    if (search) {
      queryBuilder.andWhere(
        '(question.title LIKE :search OR question.content LIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (category) {
      queryBuilder.andWhere('question.category = :category', { category });
    }

    if (tags) {
      const tagArray = tags.split(',');
      queryBuilder.andWhere('tags.name IN (:...tags)', { tags: tagArray });
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        queryBuilder.orderBy('question.createdAt', 'DESC');
        break;
      case 'oldest':
        queryBuilder.orderBy('question.createdAt', 'ASC');
        break;
      case 'most_voted':
        queryBuilder.orderBy('question.voteCount', 'DESC');
        break;
      case 'most_viewed':
        queryBuilder.orderBy('question.viewCount', 'DESC');
        break;
      case 'most_answered':
        queryBuilder.orderBy('question.answerCount', 'DESC');
        break;
    }

    // Apply pagination
    const total = await queryBuilder.getCount();
    const questions = await queryBuilder
      .skip(page * limit)
      .take(limit)
      .getMany();

    return { questions, total };
  }

  async getQuestionById(id: string): Promise<Question> {
    const question = await this.questionRepository.findOne({
      where: { id },
      relations: ['author', 'tags', 'answers', 'answers.author', 'comments', 'comments.author'],
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    // Increment view count
    await this.questionRepository.update(id, {
      viewCount: question.viewCount + 1
    });

    return question;
  }

  async updateQuestion(id: string, updateQuestionDto: any, user: User): Promise<Question> {
    const question = await this.questionRepository.findOne({
      where: { id },
      relations: ['author', 'tags']
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    if (question.authorId !== user.id && user.role !== Role.ADMIN) {
      throw new ForbiddenException('You can only edit your own questions');
    }

    const { tags, ...updateData } = updateQuestionDto;
    
    if (tags) {
      const tagEntities = await this.getOrCreateTags(tags);
      question.tags = tagEntities;
    }

    Object.assign(question, updateData);
    return this.questionRepository.save(question);
  }

  async deleteQuestion(id: string, user: User): Promise<void> {
    const question = await this.questionRepository.findOne({
      where: { id },
      relations: ['author']
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    if (question.authorId !== user.id && user.role !== Role.ADMIN) {
      throw new ForbiddenException('You can only delete your own questions');
    }

    await this.questionRepository.remove(question);
  }

  // Answer methods
  async createAnswer(questionId: string, createAnswerDto: CreateAnswerDto, user: User): Promise<Answer> {
    const question = await this.questionRepository.findOne({
      where: { id: questionId }
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    const answer = this.answerRepository.create({
      ...createAnswerDto,
      question,
      questionId,
      author: user,
      authorId: user.id,
    });

    const savedAnswer = await this.answerRepository.save(answer);

    // Update question answer count
    await this.questionRepository.update(questionId, {
      answerCount: question.answerCount + 1
    });

    // Return the answer with author relation loaded
    const answerWithAuthor = await this.answerRepository.findOne({
      where: { id: savedAnswer.id },
      relations: ['author']
    });

    if (!answerWithAuthor) {
      // Fallback: return the saved answer with user data manually attached
      return {
        ...savedAnswer,
        author: user
      } as Answer;
    }

    return answerWithAuthor;
  }

  async updateAnswer(id: string, updateAnswerDto: any, user: User): Promise<Answer> {
    const answer = await this.answerRepository.findOne({
      where: { id },
      relations: ['author']
    });

    if (!answer) {
      throw new NotFoundException('Answer not found');
    }

    if (answer.authorId !== user.id && user.role !== Role.ADMIN) {
      throw new ForbiddenException('You can only edit your own answers');
    }

    Object.assign(answer, updateAnswerDto);
    return this.answerRepository.save(answer);
  }

  async deleteAnswer(id: string, user: User): Promise<void> {
    const answer = await this.answerRepository.findOne({
      where: { id },
      relations: ['author', 'question']
    });

    if (!answer) {
      throw new NotFoundException('Answer not found');
    }

    if (answer.authorId !== user.id && user.role !== Role.ADMIN) {
      throw new ForbiddenException('You can only delete your own answers');
    }

    await this.answerRepository.remove(answer);

    // Update question answer count
    await this.questionRepository.update(answer.questionId, {
      answerCount: answer.question.answerCount - 1
    });
  }

  // Comment methods
  async createComment(questionId: string, createCommentDto: CreateCommentDto, user: User): Promise<Comment> {
    const question = await this.questionRepository.findOne({
      where: { id: questionId }
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    const comment = this.commentRepository.create({
      content: createCommentDto.content,
      question,
      questionId,
      author: user,
      authorId: user.id,
    });

    const savedComment = await this.commentRepository.save(comment);

    // Return the comment with author relation loaded
    const commentWithAuthor = await this.commentRepository.findOne({
      where: { id: savedComment.id },
      relations: ['author']
    });

    if (!commentWithAuthor) {
      // Fallback: return the saved comment with user data manually attached
      return {
        ...savedComment,
        author: user
      } as Comment;
    }

    return commentWithAuthor;
  }

  async createAnswerComment(answerId: string, createCommentDto: CreateCommentDto, user: User): Promise<Comment> {
    const answer = await this.answerRepository.findOne({
      where: { id: answerId }
    });

    if (!answer) {
      throw new NotFoundException('Answer not found');
    }

    const comment = this.commentRepository.create({
      content: createCommentDto.content,
      answer,
      answerId,
      author: user,
      authorId: user.id,
    });

    const savedComment = await this.commentRepository.save(comment);

    // Return the comment with author relation loaded
    const commentWithAuthor = await this.commentRepository.findOne({
      where: { id: savedComment.id },
      relations: ['author']
    });

    if (!commentWithAuthor) {
      // Fallback: return the saved comment with user data manually attached
      return {
        ...savedComment,
        author: user
      } as Comment;
    }

    return commentWithAuthor;
  }

  // Vote methods
  async getUserVoteStatus(questionId: string, user: User): Promise<{ hasVoted: boolean; voteType?: VoteType }> {
    const vote = await this.voteRepository.findOne({
      where: { userId: user.id, questionId }
    });

    return {
      hasVoted: !!vote,
      voteType: vote?.type
    };
  }

  async getUserAnswerVoteStatus(answerId: string, user: User): Promise<{ hasVoted: boolean; voteType?: VoteType }> {
    const vote = await this.voteRepository.findOne({
      where: { userId: user.id, answerId }
    });

    return {
      hasVoted: !!vote,
      voteType: vote?.type
    };
  }

  async getQuestionVoteCounts(questionId: string): Promise<{ upvotes: number; downvotes: number; total: number }> {
    const upvotes = await this.voteRepository.count({
      where: { questionId, type: VoteType.UP }
    });
    
    const downvotes = await this.voteRepository.count({
      where: { questionId, type: VoteType.DOWN }
    });

    return {
      upvotes,
      downvotes,
      total: upvotes - downvotes
    };
  }

  async getAnswerVoteCounts(answerId: string): Promise<{ upvotes: number; downvotes: number; total: number }> {
    const upvotes = await this.voteRepository.count({
      where: { answerId, type: VoteType.UP }
    });
    
    const downvotes = await this.voteRepository.count({
      where: { answerId, type: VoteType.DOWN }
    });

    return {
      upvotes,
      downvotes,
      total: upvotes - downvotes
    };
  }

  async voteQuestion(questionId: string, voteDto: VoteDto, user: User): Promise<void> {
    const question = await this.questionRepository.findOne({
      where: { id: questionId }
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    await this.vote('question', questionId, voteDto.type, user);
    
    // Update question vote count
    const voteCount = await this.voteRepository.count({
      where: { questionId, type: VoteType.UP }
    }) - await this.voteRepository.count({
      where: { questionId, type: VoteType.DOWN }
    });

    await this.questionRepository.update(questionId, { voteCount });
  }

  async voteAnswer(answerId: string, voteDto: VoteDto, user: User): Promise<void> {
    const answer = await this.answerRepository.findOne({
      where: { id: answerId }
    });

    if (!answer) {
      throw new NotFoundException('Answer not found');
    }

    await this.vote('answer', answerId, voteDto.type, user);
    
    // Update answer vote count
    const voteCount = await this.voteRepository.count({
      where: { answerId, type: VoteType.UP }
    }) - await this.voteRepository.count({
      where: { answerId, type: VoteType.DOWN }
    });

    await this.answerRepository.update(answerId, { voteCount });
  }

  private async vote(type: 'question' | 'answer', targetId: string, voteType: VoteType, user: User): Promise<void> {
    const existingVote = await this.voteRepository.findOne({
      where: type === 'question' 
        ? { userId: user.id, questionId: targetId }
        : { userId: user.id, answerId: targetId }
    });

    if (existingVote) {
      if (existingVote.type === voteType) {
        // Remove vote if same type
        await this.voteRepository.remove(existingVote);
      } else {
        // Change vote type
        existingVote.type = voteType;
        await this.voteRepository.save(existingVote);
      }
    } else {
      // Create new vote
      const vote = this.voteRepository.create({
        type: voteType,
        user,
        userId: user.id,
        [type === 'question' ? 'questionId' : 'answerId']: targetId,
      });
      await this.voteRepository.save(vote);
    }
  }

  // Tag methods
  private async getOrCreateTags(tagNames: string[]): Promise<Tag[]> {
    const tags: Tag[] = [];
    
    for (const name of tagNames) {
      let tag = await this.tagRepository.findOne({ where: { name } });
      
      if (!tag) {
        tag = this.tagRepository.create({ name });
        tag = await this.tagRepository.save(tag);
      }
      
      tags.push(tag);
    }
    
    return tags;
  }

  async getTags(): Promise<Tag[]> {
    return this.tagRepository.find({
      order: { usageCount: 'DESC' }
    });
  }
} 