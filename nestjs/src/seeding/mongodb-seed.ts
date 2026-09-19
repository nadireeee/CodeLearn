import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { OnboardingSeeder } from './onboarding.seeder';

async function seedMongoDB() {
  console.log('🚀 Starting MongoDB seeding...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  
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