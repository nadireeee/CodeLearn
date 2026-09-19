import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class LessonsSeeder {
  constructor(
    @InjectModel('lessons_c_tr') private readonly lessonsCTrModel: Model<any>,
    @InjectModel('lessons_c_en') private readonly lessonsCEnModel: Model<any>,
    @InjectModel('lessons_cpp_tr') private readonly lessonsCppTrModel: Model<any>,
    @InjectModel('lessons_cpp_en') private readonly lessonsCppEnModel: Model<any>,
  ) {}

  async seed() {
    console.log('🌱 Starting lessons seeding...');

    // Seed all 4 collections
    await this.seedCTurkish();
    await this.seedCEnglish();
    await this.seedCppTurkish();
    await this.seedCppEnglish();

    console.log('✅ Lessons seeding completed!');
  }

  private async seedCTurkish() {
    const model = this.lessonsCTrModel;
    
    // Clear existing data
    await model.deleteMany({});
    
    console.log('📚 Seeding C Turkish lessons...');

    // Chapter 1: Giriş
    const chapter1 = await model.create({
      entityType: 'chapter',
      title: 'C Programlamaya Giriş',
      slug: 'introduction',
      description: 'C programlama diline giriş ve temel kavramlar',
      order: 1,
      estimatedDuration: 120, // minutes
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Topics for Chapter 1
    const topic1_1 = await model.create({
      entityType: 'topic',
      chapterId: chapter1._id.toString(),
      title: 'C Nedir?',
      slug: 'what-is-c',
      description: 'C programlama dilinin tarihçesi ve özellikleri',
      order: 1,
      estimatedDuration: 30,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const topic1_2 = await model.create({
      entityType: 'topic',
      chapterId: chapter1._id.toString(),
      title: 'İlk Program',
      slug: 'first-program',
      description: 'İlk C programınızı yazma',
      order: 2,
      estimatedDuration: 45,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Lessons for Topic 1.1
    await model.create({
      entityType: 'lesson',
      topicId: topic1_1._id.toString(),
      chapterId: chapter1._id.toString(),
      title: 'C Dilinin Tarihçesi',
      slug: 'c-history',
      order: 1,
      estimatedDuration: 15,
      content: [
        {
          type: 'text',
          data: {
            text: 'C programlama dili 1972 yılında Dennis Ritchie tarafından Bell Labs\'ta geliştirilmiştir.'
          }
        },
        {
          type: 'video',
          data: {
            title: 'C Dilinin Tarihçesi',
            url: 'https://www.youtube.com/watch?v=de2Hsvxaf8M',
            duration: 300
          }
        },
        {
          type: 'warning',
          data: {
            text: 'C dili düşük seviyeli bir dildir ve bellek yönetimi programcının sorumluluğundadır.'
          }
        }
      ],
      prerequisites: [],
      learningObjectives: [
        'C dilinin tarihçesini öğrenmek',
        'C dilinin özelliklerini anlamak'
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await model.create({
      entityType: 'lesson',
      topicId: topic1_1._id.toString(),
      chapterId: chapter1._id.toString(),
      title: 'C Dilinin Özellikleri',
      slug: 'c-features',
      order: 2,
      estimatedDuration: 15,
      content: [
        {
          type: 'text',
          data: {
            text: 'C dili taşınabilir, etkili ve güçlü bir programlama dilidir.'
          }
        },
        {
          type: 'code',
          data: {
            language: 'c',
            code: '#include <stdio.h>\n\nint main() {\n    printf("Merhaba Dünya!");\n    return 0;\n}',
            explanation: 'Bu basit bir C programıdır.'
          }
        }
      ],
      prerequisites: [],
      learningObjectives: [
        'C dilinin temel özelliklerini öğrenmek'
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Lessons for Topic 1.2
    await model.create({
      entityType: 'lesson',
      topicId: topic1_2._id.toString(),
      chapterId: chapter1._id.toString(),
      title: 'Hello World Programı',
      slug: 'hello-world',
      order: 1,
      estimatedDuration: 20,
      content: [
        {
          type: 'text',
          data: {
            text: 'İlk C programımızı yazalım: Hello World!'
          }
        },
        {
          type: 'code',
          data: {
            language: 'c',
            code: '#include <stdio.h>\n\nint main() {\n    printf("Hello World!");\n    return 0;\n}',
            explanation: 'Bu program ekrana "Hello World!" yazdırır.'
          }
        },
        {
          type: 'interactive',
          data: {
            type: 'code-editor',
            initialCode: '#include <stdio.h>\n\nint main() {\n    // Kodunuzu buraya yazın\n    return 0;\n}',
            expectedOutput: 'Hello World!',
            hints: ['printf() fonksiyonunu kullanın', 'Çift tırnak kullanmayı unutmayın']
          }
        }
      ],
      prerequisites: [],
      learningObjectives: [
        'İlk C programını yazmak',
        'printf() fonksiyonunu kullanmak'
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Chapter Test
    await model.create({
      entityType: 'chapterTest',
      chapterId: chapter1._id.toString(),
      title: 'C Programlamaya Giriş Testi',
      description: 'Bu bölümde öğrendiklerinizi test edin',
      passingScore: 70,
      timeLimit: 1200, // 20 minutes
      questions: [
        {
          id: '1',
          type: 'multiple-choice',
          question: 'C programlama dili hangi yılda geliştirilmiştir?',
          options: ['1970', '1972', '1975', '1980'],
          correctAnswer: 1,
          explanation: 'C dili 1972 yılında Dennis Ritchie tarafından geliştirilmiştir.'
        },
        {
          id: '2',
          type: 'multiple-choice',
          question: 'C dilinde ekrana yazı yazdırmak için hangi fonksiyon kullanılır?',
          options: ['print()', 'printf()', 'cout', 'echo'],
          correctAnswer: 1,
          explanation: 'printf() fonksiyonu C dilinde ekrana çıktı vermek için kullanılır.'
        },
        {
          id: '3',
          type: 'multiple-choice',
          question: 'C programında main() fonksiyonunun dönüş tipi nedir?',
          options: ['void', 'int', 'char', 'float'],
          correctAnswer: 1,
          explanation: 'main() fonksiyonu genellikle int tipinde değer döndürür.'
        },
        {
          id: '4',
          type: 'multiple-choice',
          question: 'C dilinde yorum satırı için hangi sembol kullanılır?',
          options: ['//', '/* */', 'Her ikisi de', '#'],
          correctAnswer: 2,
          explanation: 'C dilinde hem // hem de /* */ yorum sembolleri kullanılabilir.'
        },
        {
          id: '5',
          type: 'multiple-choice',
          question: 'stdio.h nedir?',
          options: ['Bir değişken', 'Bir fonksiyon', 'Bir header dosyası', 'Bir operatör'],
          correctAnswer: 2,
          explanation: 'stdio.h standart giriş/çıkış işlemleri için gerekli header dosyasıdır.'
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Chapter 2: Veri Tipleri ve Değişkenler
    const chapter2 = await model.create({
      entityType: 'chapter',
      title: 'Veri Tipleri ve Değişkenler',
      slug: 'data-types-variables',
      description: 'C dilinde veri tipleri ve değişken kullanımı',
      order: 2,
      estimatedDuration: 180,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Topic for Chapter 2
    const topic2_1 = await model.create({
      entityType: 'topic',
      chapterId: chapter2._id.toString(),
      title: 'Temel Veri Tipleri',
      slug: 'basic-data-types',
      description: 'int, float, char veri tipleri',
      order: 1,
      estimatedDuration: 60,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Lesson for Topic 2.1
    await model.create({
      entityType: 'lesson',
      topicId: topic2_1._id.toString(),
      chapterId: chapter2._id.toString(),
      title: 'Integer Veri Tipi',
      slug: 'integer-data-type',
      order: 1,
      estimatedDuration: 20,
      content: [
        {
          type: 'text',
          data: {
            text: 'Integer (int) veri tipi tam sayıları saklamak için kullanılır.'
          }
        },
        {
          type: 'code',
          data: {
            language: 'c',
            code: 'int sayi = 42;\nint negatif = -10;\nint sifir = 0;',
            explanation: 'Integer değişken tanımlama örnekleri'
          }
        },
        {
          type: 'exercise',
          data: {
            title: 'Integer Değişken Tanımlama',
            description: 'Yaşınızı tutan bir integer değişken tanımlayın',
            starterCode: 'int yas = ',
            solution: 'int yas = 25;',
            hints: ['int anahtar kelimesini kullanın', 'Değişken adından sonra = ile değer atayın']
          }
        }
      ],
      prerequisites: [],
      learningObjectives: [
        'Integer veri tipini anlamak',
        'Integer değişken tanımlamak'
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Chapter 2 Test
    await model.create({
      entityType: 'chapterTest',
      chapterId: chapter2._id.toString(),
      title: 'Veri Tipleri ve Değişkenler Testi',
      description: 'Veri tipleri konusunda bilginizi test edin',
      passingScore: 70,
      timeLimit: 900,
      questions: [
        {
          id: '1',
          type: 'multiple-choice',
          question: 'int veri tipi hangi değerleri saklar?',
          options: ['Tam sayılar', 'Ondalık sayılar', 'Karakterler', 'Metinler'],
          correctAnswer: 0,
          explanation: 'int veri tipi tam sayıları saklamak için kullanılır.'
        },
        {
          id: '2',
          type: 'multiple-choice',
          question: 'float veri tipi hangi değerleri saklar?',
          options: ['Tam sayılar', 'Ondalık sayılar', 'Karakterler', 'Boolean değerler'],
          correctAnswer: 1,
          explanation: 'float veri tipi ondalık sayıları saklamak için kullanılır.'
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('✅ C Turkish lessons seeded successfully');
  }

  private async seedCEnglish() {
    const model = this.lessonsCEnModel;
    
    // Clear existing data
    await model.deleteMany({});
    
    console.log('📚 Seeding C English lessons...');

    // Chapter 1: Introduction
    const chapter1 = await model.create({
      entityType: 'chapter',
      title: 'Introduction to C Programming',
      slug: 'introduction',
      description: 'Introduction to C programming language and basic concepts',
      order: 1,
      estimatedDuration: 120,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Topic for Chapter 1
    const topic1_1 = await model.create({
      entityType: 'topic',
      chapterId: chapter1._id.toString(),
      title: 'What is C?',
      slug: 'what-is-c',
      description: 'History and features of C programming language',
      order: 1,
      estimatedDuration: 30,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Lesson for Topic 1.1
    await model.create({
      entityType: 'lesson',
      topicId: topic1_1._id.toString(),
      chapterId: chapter1._id.toString(),
      title: 'History of C Language',
      slug: 'c-history',
      order: 1,
      estimatedDuration: 15,
      content: [
        {
          type: 'text',
          data: {
            text: 'The C programming language was developed by Dennis Ritchie at Bell Labs in 1972.'
          }
        },
        {
          type: 'video',
          data: {
            title: 'History of C Language',
            url: 'https://www.youtube.com/watch?v=de2Hsvxaf8M',
            duration: 300
          }
        }
      ],
      prerequisites: [],
      learningObjectives: [
        'Learn the history of C language',
        'Understand the features of C language'
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Chapter Test
    await model.create({
      entityType: 'chapterTest',
      chapterId: chapter1._id.toString(),
      title: 'Introduction to C Programming Test',
      description: 'Test your knowledge about C programming basics',
      passingScore: 70,
      timeLimit: 1200,
      questions: [
        {
          id: '1',
          type: 'multiple-choice',
          question: 'In which year was C programming language developed?',
          options: ['1970', '1972', '1975', '1980'],
          correctAnswer: 1,
          explanation: 'C language was developed by Dennis Ritchie in 1972.'
        },
        {
          id: '2',
          type: 'multiple-choice',
          question: 'Which function is used to print output in C?',
          options: ['print()', 'printf()', 'cout', 'echo'],
          correctAnswer: 1,
          explanation: 'printf() function is used for output in C programming.'
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('✅ C English lessons seeded successfully');
  }

  private async seedCppTurkish() {
    const model = this.lessonsCppTrModel;
    
    // Clear existing data
    await model.deleteMany({});
    
    console.log('📚 Seeding C++ Turkish lessons...');

    // Chapter 1: C++ Giriş
    const chapter1 = await model.create({
      entityType: 'chapter',
      id: 'chapter_0_cpp_tr',
      title: 'C++ Programlamaya Giriş',
      description: 'C++ programlama diline giriş ve nesne yönelimli programlama',
      order: 1,
      language: 'cpp',
      locale: 'tr',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Topic for Chapter 1
    const topic1_1 = await model.create({
      entityType: 'topic',
      id: 'topic_0_1_cpp_tr',
      chapterId: chapter1._id.toString(),
      title: 'C++ Nedir?',
      description: 'C++ dilinin özellikleri ve C\'den farkları',
      order: 1,
      language: 'cpp',
      locale: 'tr',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Lesson for Topic 1.1
    await model.create({
      entityType: 'lesson',
      id: 'lesson_0_1_1_cpp_tr',
      topicId: topic1_1._id.toString(),
      chapterId: chapter1._id.toString(),
      title: 'C++ ve Nesne Yönelimli Programlama',
      description: 'C++ dilinin temellerini ve nesne yönelimli programlamayı öğrenin',
      order: 1,
      language: 'cpp',
      locale: 'tr',
      content: [
        {
          type: 'text',
          data: {
            text: 'C++ Bjarne Stroustrup tarafından geliştirilen nesne yönelimli bir programlama dilidir.'
          }
        },
        {
          type: 'code',
          data: {
            language: 'cpp',
            code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Merhaba C++!" << endl;\n    return 0;\n}',
            explanation: 'Bu basit bir C++ programıdır.'
          }
        }
      ],
      prerequisites: [],
      objectives: [
        'C++ dilini tanımak',
        'Nesne yönelimli programlamayı anlamak'
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Chapter Test
    await model.create({
      entityType: 'chapterTest',
      id: 'test_chapter_0_cpp_tr',
      chapterId: chapter1._id.toString(),
      title: 'C++ Programlamaya Giriş Testi',
      description: 'C++ temellerini test edin',
      language: 'cpp',
      locale: 'tr',
      questions: [
        {
          id: '1',
          type: 'multiple-choice',
          question: 'C++ dilini kim geliştirmiştir?',
          options: ['Dennis Ritchie', 'Bjarne Stroustrup', 'James Gosling', 'Guido van Rossum'],
          correctAnswer: 1,
          explanation: 'C++ Bjarne Stroustrup tarafından geliştirilmiştir.'
        },
        {
          id: '2',
          type: 'multiple-choice',
          question: 'C++ dilinde çıktı vermek için hangi operatör kullanılır?',
          options: ['printf', 'cout <<', 'print', 'echo'],
          correctAnswer: 1,
          explanation: 'C++ dilinde cout << operatörü çıktı vermek için kullanılır.'
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('✅ C++ Turkish lessons seeded successfully');
  }

  private async seedCppEnglish() {
    const model = this.lessonsCppEnModel;
    
    // Clear existing data
    await model.deleteMany({});
    
    console.log('📚 Seeding C++ English lessons...');

    // Chapter 1: Introduction
    const chapter1 = await model.create({
      entityType: 'chapter',
      title: 'Introduction to C++ Programming',
      slug: 'introduction',
      description: 'Introduction to C++ programming and object-oriented programming',
      order: 1,
      estimatedDuration: 150,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Topic for Chapter 1
    const topic1_1 = await model.create({
      entityType: 'topic',
      chapterId: chapter1._id.toString(),
      title: 'What is C++?',
      slug: 'what-is-cpp',
      description: 'Features of C++ and differences from C',
      order: 1,
      estimatedDuration: 45,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Lesson for Topic 1.1
    await model.create({
      entityType: 'lesson',
      topicId: topic1_1._id.toString(),
      chapterId: chapter1._id.toString(),
      title: 'C++ and Object-Oriented Programming',
      slug: 'cpp-oop',
      order: 1,
      estimatedDuration: 25,
      content: [
        {
          type: 'text',
          data: {
            text: 'C++ is an object-oriented programming language developed by Bjarne Stroustrup.'
          }
        },
        {
          type: 'code',
          data: {
            language: 'cpp',
            code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello C++!" << endl;\n    return 0;\n}',
            explanation: 'This is a simple C++ program.'
          }
        }
      ],
      prerequisites: [],
      learningObjectives: [
        'Learn about C++ language',
        'Understand object-oriented programming'
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Chapter Test
    await model.create({
      entityType: 'chapterTest',
      chapterId: chapter1._id.toString(),
      title: 'Introduction to C++ Programming Test',
      description: 'Test your C++ fundamentals',
      passingScore: 70,
      timeLimit: 1200,
      questions: [
        {
          id: '1',
          type: 'multiple-choice',
          question: 'Who developed the C++ programming language?',
          options: ['Dennis Ritchie', 'Bjarne Stroustrup', 'James Gosling', 'Guido van Rossum'],
          correctAnswer: 1,
          explanation: 'C++ was developed by Bjarne Stroustrup.'
        },
        {
          id: '2',
          type: 'multiple-choice',
          question: 'Which operator is used for output in C++?',
          options: ['printf', 'cout <<', 'print', 'echo'],
          correctAnswer: 1,
          explanation: 'The cout << operator is used for output in C++.'
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('✅ C++ English lessons seeded successfully');
  }
} 