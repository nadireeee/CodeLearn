import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LoginQuestion, LoginQuestionDocument } from '../onboarding/schemas/login-question.schema';

@Injectable()
export class OnboardingSeeder {
  constructor(
    @InjectModel(LoginQuestion.name)
    private readonly loginQuestionModel: Model<LoginQuestionDocument>,
  ) {}

  async seed() {
    console.log('🌱 Seeding onboarding questions...');

    const questions = [
      {
        key: 'experienceLevel',
        text: 'What is your programming experience level?',
        options: [
          { value: 'beginner', label: 'Beginner - I\'m new to programming' },
          { value: 'intermediate', label: 'Intermediate - I know some basics' },
          { value: 'advanced', label: 'Advanced - I\'m comfortable with programming' },
          { value: 'expert', label: 'Expert - I\'m a professional developer' },
        ],
      },
      {
        key: 'learningGoal',
        text: 'What is your primary learning goal?',
        options: [
          { value: 'web_dev', label: 'Web Development' },
          { value: 'mobile_dev', label: 'Mobile Development' },
          { value: 'game_dev', label: 'Game Development' },
          { value: 'data_science', label: 'Data Science & AI' },
          { value: 'cybersecurity', label: 'Cybersecurity' },
          { value: 'general', label: 'General Programming Skills' },
        ],
      },
      {
        key: 'preferredLanguage',
        text: 'Which programming language interests you most?',
        options: [
          { value: 'javascript', label: 'JavaScript' },
          { value: 'python', label: 'Python' },
          { value: 'java', label: 'Java' },
          { value: 'cpp', label: 'C++' },
          { value: 'csharp', label: 'C#' },
          { value: 'swift', label: 'Swift' },
          { value: 'kotlin', label: 'Kotlin' },
          { value: 'rust', label: 'Rust' },
        ],
      },
      {
        key: 'learningStyle',
        text: 'How do you prefer to learn?',
        options: [
          { value: 'hands_on', label: 'Hands-on projects and coding' },
          { value: 'theory_first', label: 'Theory and concepts first' },
          { value: 'video_tutorials', label: 'Video tutorials and demonstrations' },
          { value: 'reading', label: 'Reading documentation and books' },
          { value: 'interactive', label: 'Interactive exercises and challenges' },
        ],
      },
      {
        key: 'timeCommitment',
        text: 'How much time can you dedicate to learning?',
        options: [
          { value: '15_min', label: '15 minutes per day' },
          { value: '30_min', label: '30 minutes per day' },
          { value: '1_hour', label: '1 hour per day' },
          { value: '2_hours', label: '2+ hours per day' },
          { value: 'weekend_only', label: 'Weekends only' },
        ],
      },
    ];

    try {
      // Clear existing questions
      await this.loginQuestionModel.deleteMany({});
      
      // Insert new questions
      const insertedQuestions = await this.loginQuestionModel.insertMany(questions);
      
      console.log(`✅ Seeded ${insertedQuestions.length} onboarding questions`);
      return insertedQuestions;
    } catch (error) {
      console.error('❌ Error seeding onboarding questions:', error);
      throw error;
    }
  }
} 