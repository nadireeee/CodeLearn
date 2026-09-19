import { NestFactory } from '@nestjs/core';
import { MongoSeedModule } from './mongo-seed.module';
import { SubjectsSeeder } from './subjects.seeder';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(MongoSeedModule);
  
  try {
    const seeder = app.get(SubjectsSeeder);
    await seeder.seed();
    console.log('✅ Subjects seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
  } finally {
    await app.close();
  }
}

bootstrap(); 