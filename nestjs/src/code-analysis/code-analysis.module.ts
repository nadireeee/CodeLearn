import { Module } from '@nestjs/common';
import { CodeAnalysisController } from './code-analysis.controller';
import { CodeAnalysisService } from './code-analysis.service';
import { CodeFileController } from './code-file.controller';
import { CodeFileService } from './code-file.service';
import { MongooseModule } from '@nestjs/mongoose';
import { CodeAnalysis, CodeAnalysisSchema } from './schemas/code-analysis.schema';
import { CodeFile, CodeFileSchema } from './schemas/code-file.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CodeAnalysis.name, schema: CodeAnalysisSchema },
      { name: CodeFile.name, schema: CodeFileSchema }
    ])
  ],
  controllers: [CodeAnalysisController, CodeFileController],
  providers: [CodeAnalysisService, CodeFileService],
  exports: [CodeAnalysisService, CodeFileService],
})
export class CodeAnalysisModule {} 