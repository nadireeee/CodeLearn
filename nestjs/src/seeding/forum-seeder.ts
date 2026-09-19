import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question, Answer, Comment, Tag, User } from '../entities';
import { CreateQuestionDto, QuestionCategory } from '../forum/dto/create-question.dto';

@Injectable()
export class ForumSeeder {
  constructor(
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    @InjectRepository(Answer)
    private answerRepository: Repository<Answer>,
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    @InjectRepository(Tag)
    private tagRepository: Repository<Tag>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async seed() {
      // Create tags
      const tags = await this.createTags();
    
    // Get a user for seeding
    const user = await this.userRepository.findOne({ where: {} });
    if (!user) {
      console.log('No user found for seeding forum data');
      return;
    }

    // Create sample questions
    await this.createSampleQuestions(user, tags);
  }

  private async createTags(): Promise<Tag[]> {
    const tagNames = [
      'c-programming',
      'c++',
      'pointers',
      'memory-management',
      'algorithms',
      'data-structures',
      'debugging',
      'optimization',
      'stl',
      'templates'
    ];

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

  private async createSampleQuestions(user: User, tags: Tag[]) {
    const sampleQuestions = [
      {
        title: 'C\'de pointer kullanımı nasıl olur?',
        content: 'Merhaba, C programlama dilinde pointer kullanımı hakkında bilgi almak istiyorum. Pointer\'ların ne olduğu ve nasıl kullanıldığı konusunda yardımcı olabilir misiniz?',
        category: QuestionCategory.C,
        tags: ['c-programming', 'pointers']
      },
      {
        title: 'C++ STL vector kullanımı',
        content: 'C++ STL\'deki vector container\'ının kullanımı hakkında detaylı bilgi verebilir misiniz? Hangi durumlarda kullanılır ve performansı nasıldır?',
        category: QuestionCategory.CPP,
        tags: ['c++', 'stl', 'data-structures']
      },
      {
        title: 'Memory leak nasıl önlenir?',
        content: 'C ve C++ programlarında memory leak\'leri nasıl önleyebilirim? Hangi araçları kullanabilirim?',
        category: QuestionCategory.C,
        tags: ['c-programming', 'memory-management', 'debugging']
      }
    ];

    for (const questionData of sampleQuestions) {
      const question = this.questionRepository.create({
        ...questionData,
        author: user,
        authorId: user.id,
        tags: tags.filter(tag => questionData.tags.includes(tag.name))
      });

      const savedQuestion = await this.questionRepository.save(question);

      // Create sample answers
      await this.createSampleAnswers(savedQuestion, user);
    }
  }

  private async createSampleAnswers(question: Question, user: User) {
    const sampleAnswers = [
      {
        content: 'Pointer\'lar C\'de çok önemli bir konudur. Bir pointer, başka bir değişkenin adresini tutan değişkendir. Örnek: int *ptr = &variable;',
        isAccepted: true
      },
      {
        content: 'Pointer\'lar dinamik bellek yönetimi için de kullanılır. malloc() ve free() fonksiyonları ile bellek ayırıp serbest bırakabilirsiniz.'
      }
    ];

    for (const answerData of sampleAnswers) {
      const answer = this.answerRepository.create({
        ...answerData,
        question,
        questionId: question.id,
        author: user,
        authorId: user.id
      })
    }
  }
} 