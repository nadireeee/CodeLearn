// MongoDB Seed Script - Lessons System
// Bu script'i çalıştırmak için: node mongodb-seed.js

const { MongoClient } = require('mongodb');

// MongoDB bağlantı bilgileri - bunları kendi MongoDB ayarlarına göre güncelle
const MONGODB_URI = 'mongodb://localhost:27017';
const DATABASE_NAME = 'codelearn_ai'; // Veritabanı adını buraya yaz

// Eğer MongoDB authentication kullanıyorsan, URI'yi şu şekilde güncelle:
// const MONGODB_URI = 'mongodb://username:password@localhost:27017';

const lessonsData = {
  // C - Turkish
  'lessons_c_tr': [
    // Chapter 1: Giriş
    {
      _id: "c_tr_chapter_1",
      entityType: "chapter",
      title: "C Programlama Diline Giriş",
      description: "C programlama dilinin temellerini öğrenin",
      slug: "c-giris",
      order: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    // Topic 1.1: Temel Kavramlar
    {
      _id: "c_tr_topic_1_1",
      entityType: "topic",
      chapterId: "c_tr_chapter_1",
      title: "Temel Kavramlar",
      description: "Programlama ve C dili hakkında temel bilgiler",
      slug: "temel-kavramlar",
      order: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    // Lesson 1.1.1: İlk Program
    {
      _id: "c_tr_lesson_1_1_1",
      entityType: "lesson",
      chapterId: "c_tr_chapter_1",
      topicId: "c_tr_topic_1_1",
      title: "İlk C Programı",
      description: "Hello World programı ile başlayın",
      slug: "ilk-c-programi",
      order: 1,
      isActive: true,
      content: [
        {
          type: "text",
          content: "C programlama dilinde ilk programımızı yazalım."
        },
        {
          type: "code",
          content: `#include <stdio.h>

int main() {
    printf("Merhaba Dünya!\\n");
    return 0;
}`,
          language: "c"
        },
        {
          type: "text",
          content: "Bu program ekrana 'Merhaba Dünya!' yazdırır."
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],

  // C - English
  'lessons_c_en': [
    {
      _id: "c_en_chapter_1",
      entityType: "chapter",
      title: "Introduction to C Programming",
      description: "Learn the fundamentals of C programming language",
      slug: "c-introduction",
      order: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: "c_en_topic_1_1",
      entityType: "topic",
      chapterId: "c_en_chapter_1",
      title: "Basic Concepts",
      description: "Basic information about programming and C language",
      slug: "basic-concepts",
      order: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: "c_en_lesson_1_1_1",
      entityType: "lesson",
      chapterId: "c_en_chapter_1",
      topicId: "c_en_topic_1_1",
      title: "First C Program",
      description: "Start with Hello World program",
      slug: "first-c-program",
      order: 1,
      isActive: true,
      content: [
        {
          type: "text",
          content: "Let's write our first program in C programming language."
        },
        {
          type: "code",
          content: `#include <stdio.h>

int main() {
    printf("Hello World!\\n");
    return 0;
}`,
          language: "c"
        },
        {
          type: "text",
          content: "This program prints 'Hello World!' to the screen."
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],

  // C++ - Turkish
  'lessons_cpp_tr': [
    {
      _id: "cpp_tr_chapter_1",
      entityType: "chapter",
      title: "C++ Programlama Diline Giriş",
      description: "C++ programlama dilinin temellerini öğrenin",
      slug: "cpp-giris",
      order: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: "cpp_tr_topic_1_1",
      entityType: "topic",
      chapterId: "cpp_tr_chapter_1",
      title: "C++ Temel Kavramlar",
      description: "C++ dili hakkında temel bilgiler",
      slug: "cpp-temel-kavramlar",
      order: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: "cpp_tr_lesson_1_1_1",
      entityType: "lesson",
      chapterId: "cpp_tr_chapter_1",
      topicId: "cpp_tr_topic_1_1",
      title: "İlk C++ Programı",
      description: "Hello World programı ile başlayın",
      slug: "ilk-cpp-programi",
      order: 1,
      isActive: true,
      content: [
        {
          type: "text",
          content: "C++ programlama dilinde ilk programımızı yazalım."
        },
        {
          type: "code",
          content: `#include <iostream>

int main() {
    std::cout << "Merhaba Dünya!" << std::endl;
    return 0;
}`,
          language: "cpp"
        },
        {
          type: "text",
          content: "Bu program ekrana 'Merhaba Dünya!' yazdırır."
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],

  // C++ - English
  'lessons_cpp_en': [
    {
      _id: "cpp_en_chapter_1",
      entityType: "chapter",
      title: "Introduction to C++ Programming",
      description: "Learn the fundamentals of C++ programming language",
      slug: "cpp-introduction",
      order: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: "cpp_en_topic_1_1",
      entityType: "topic",
      chapterId: "cpp_en_chapter_1",
      title: "C++ Basic Concepts",
      description: "Basic information about C++ language",
      slug: "cpp-basic-concepts",
      order: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: "cpp_en_lesson_1_1_1",
      entityType: "lesson",
      chapterId: "cpp_en_chapter_1",
      topicId: "cpp_en_topic_1_1",
      title: "First C++ Program",
      description: "Start with Hello World program",
      slug: "first-cpp-program",
      order: 1,
      isActive: true,
      content: [
        {
          type: "text",
          content: "Let's write our first program in C++ programming language."
        },
        {
          type: "code",
          content: `#include <iostream>

int main() {
    std::cout << "Hello World!" << std::endl;
    return 0;
}`,
          language: "cpp"
        },
        {
          type: "text",
          content: "This program prints 'Hello World!' to the screen."
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]
};

async function seedDatabase() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔄 MongoDB\'ye bağlanılıyor...');
    await client.connect();
    
    const db = client.db(DATABASE_NAME);
    console.log(`✅ ${DATABASE_NAME} veritabanına bağlandı`);
    
    let totalInserted = 0;
    
    for (const [collectionName, documents] of Object.entries(lessonsData)) {
      console.log(`\n📝 ${collectionName} koleksiyonuna veri ekleniyor...`);
      
      try {
        // Koleksiyonu temizle (authentication hatası olabilir, bu durumda atla)
        await db.collection(collectionName).deleteMany({});
        console.log(`🗑️  ${collectionName} koleksiyonu temizlendi`);
      } catch (error) {
        console.log(`⚠️  ${collectionName} koleksiyonu temizlenemedi (authentication gerekebilir):`, error.message);
      }
      
      // Yeni verileri ekle
      if (documents.length > 0) {
        try {
          const result = await db.collection(collectionName).insertMany(documents);
          console.log(`✅ ${result.insertedCount} doküman eklendi`);
          totalInserted += result.insertedCount;
        } catch (error) {
          console.log(`❌ ${collectionName} koleksiyonuna veri eklenemedi:`, error.message);
        }
      }
    }
    
    console.log(`\n🎉 Toplam ${totalInserted} doküman başarıyla eklendi!`);
    console.log('\n📊 Eklenen veriler:');
    console.log('- C (Türkçe): 1 chapter, 1 topic, 1 lesson');
    console.log('- C (İngilizce): 1 chapter, 1 topic, 1 lesson');
    console.log('- C++ (Türkçe): 1 chapter, 1 topic, 1 lesson');
    console.log('- C++ (İngilizce): 1 chapter, 1 topic, 1 lesson');
    
  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await client.close();
    console.log('\n🔌 MongoDB bağlantısı kapatıldı');
  }
}

// Script'i çalıştır
seedDatabase(); 