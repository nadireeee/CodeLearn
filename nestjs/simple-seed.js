// Basit MongoDB Seed Script - Authentication olmadan
// Bu script'i çalıştırmak için: node simple-seed.js

const { MongoClient } = require('mongodb');

// MongoDB bağlantı bilgileri
const MONGODB_URI = 'mongodb://localhost:27017';
const DATABASE_NAME = 'codelearn_ai';

// Sadece C++ Türkçe için test verisi
const testData = [
  // Chapter
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
  // Topic
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
  // Lesson
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
];

async function simpleSeed() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔄 MongoDB\'ye bağlanılıyor...');
    await client.connect();
    
    const db = client.db(DATABASE_NAME);
    console.log(`✅ ${DATABASE_NAME} veritabanına bağlandı`);
    
    const collection = db.collection('lessons_cpp_tr');
    
    console.log('📝 lessons_cpp_tr koleksiyonuna test verisi ekleniyor...');
    
    // Mevcut veriyi kontrol et
    const existingCount = await collection.countDocuments();
    console.log(`📊 Mevcut doküman sayısı: ${existingCount}`);
    
    if (existingCount === 0) {
      // Veri yoksa ekle
      const result = await collection.insertMany(testData);
      console.log(`✅ ${result.insertedCount} doküman eklendi`);
      console.log('📋 Eklenen veriler:');
      console.log('- 1 Chapter: C++ Programlama Diline Giriş');
      console.log('- 1 Topic: C++ Temel Kavramlar');
      console.log('- 1 Lesson: İlk C++ Programı');
    } else {
      console.log('ℹ️  Koleksiyonda zaten veri var, ekleme yapılmadı');
      
      // Mevcut verileri göster
      const existingData = await collection.find({}).toArray();
      console.log('📋 Mevcut veriler:');
      existingData.forEach(doc => {
        console.log(`- ${doc.entityType}: ${doc.title} (ID: ${doc._id})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
    
    // Eğer authentication hatası varsa, manuel talimatlar ver
    if (error.message.includes('authentication')) {
      console.log('\n🔧 Çözüm Önerileri:');
      console.log('1. MongoDB Compass ile manuel olarak veri ekle');
      console.log('2. mongosh ile bağlan ve veri ekle');
      console.log('3. MongoDB authentication ayarlarını kontrol et');
    }
  } finally {
    await client.close();
    console.log('\n🔌 MongoDB bağlantısı kapatıldı');
  }
}

// Script'i çalıştır
simpleSeed(); 