import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // CORS ayarları
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Request logging middleware
  app.use((req, res, next) => {
    console.log(`[REQUEST] ${new Date().toISOString()} - ${req.method} ${req.url}`);
    console.log(`[REQUEST] Headers:`, req.headers);
    console.log(`[REQUEST] Query:`, req.query);
    console.log(`[REQUEST] Body:`, req.body);
    next();
  });

  // app.useGlobalPipes(
  //   new ValidationPipe({
  //     whitelist: true,
  //     forbidNonWhitelisted: true,
  //   }),
  // );
  
  await app.listen(3000);
  console.log('🚀 Backend started on port 3000');
}
bootstrap();
