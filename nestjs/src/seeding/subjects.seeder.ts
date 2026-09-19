import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Subject, SubjectDocument } from '../entities/subject.entity';

@Injectable()
export class SubjectsSeeder {
  constructor(
    @InjectModel(Subject.name) private subjectModel: Model<SubjectDocument>,
  ) {}

  async seed() {
    console.log('🌱 Seeding subjects...');

    // Önce mevcut verileri temizle
    await this.subjectModel.deleteMany({});

    // Bölümleri oluştur
    const subjects = [
      {
        id: '0',
        title: 'Bölüm 0 – Introduction / Getting Started',
        description: 'C++ programlama diline giriş ve temel kavramlar',
        order: 0,
        tags: ['introduction', 'basics', 'setup'],
        objectives: [
          'C++ programlama dilini tanıma',
          'Geliştirme ortamını kurma',
          'İlk C++ programını yazma'
        ],
        totalLessons: 3,
        totalTime: 45,
      },
      {
        id: '1',
        title: 'Bölüm 1 – Variables and Data Types',
        description: 'Değişkenler ve veri tipleri hakkında detaylı bilgi',
        order: 1,
        tags: ['variables', 'data-types', 'fundamentals'],
        objectives: [
          'Farklı veri tiplerini öğrenme',
          'Değişken tanımlama ve kullanma',
          'Tip dönüşümlerini anlama'
        ],
        totalLessons: 4,
        totalTime: 60,
      },
      {
        id: '2',
        title: 'Bölüm 2 – Control Flow',
        description: 'Kontrol yapıları ve döngüler',
        order: 2,
        tags: ['control-flow', 'loops', 'conditionals'],
        objectives: [
          'If-else yapılarını kullanma',
          'Switch-case yapısını öğrenme',
          'For, while ve do-while döngülerini anlama'
        ],
        totalLessons: 5,
        totalTime: 75,
      },
    ];

    // Bölümleri kaydet
    for (const subject of subjects) {
      await this.subjectModel.create(subject);
    }

    console.log(`✅ Seeded ${subjects.length} subjects`);
  }
} 