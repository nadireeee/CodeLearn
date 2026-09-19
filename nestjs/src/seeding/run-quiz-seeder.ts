import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { QuizSeeder } from './quiz.seeder';

async function runQuizSeeder() {
  console.log('🚀 Starting Quiz seeder...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    const quizSeeder = app.get(QuizSeeder);
    await quizSeeder.seed();
    
    console.log('✅ Quiz seeder completed successfully!');
  } catch (error) {
    console.error('❌ Quiz seeder failed:', error);
  } finally {
    await app.close();
    process.exit(0);
  }
}

runQuizSeeder(); 