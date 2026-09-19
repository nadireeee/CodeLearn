import { NestFactory } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { OnboardingSeeder } from './onboarding.seeder';
import {
  LoginQuestion,
  LoginQuestionSchema,
} from '../onboarding/schemas/login-question.schema';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://root:rootpassword@localhost:27017', {
      dbName: 'codelearn_ai',
    }),
    MongooseModule.forFeature([
      { name: LoginQuestion.name, schema: LoginQuestionSchema },
    ]),
  ],
  providers: [OnboardingSeeder],
})
class SeedingModule {}

async function seedMongoDB() {
  console.log('🚀 Starting MongoDB seeding...');
  
  const app = await NestFactory.createApplicationContext(SeedingModule);
  
  try {
    const onboardingSeeder = app.get(OnboardingSeeder);
    await onboardingSeeder.seed();
    
    console.log('✅ MongoDB seeding completed successfully!');
  } catch (error) {
    console.error('❌ MongoDB seeding failed:', error);
  } finally {
    await app.close();
    process.exit(0);
  }
}

seedMongoDB(); 