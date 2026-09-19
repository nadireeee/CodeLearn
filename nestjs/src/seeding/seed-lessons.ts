import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { LessonsSeeder } from './lessons-seeder';

async function bootstrap() {
  console.log('🌱 Starting lessons seeding process...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    const lessonsSeeder = app.get(LessonsSeeder);
    await lessonsSeeder.seed();
    
    console.log('✅ Lessons seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during lessons seeding:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap(); 