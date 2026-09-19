const { MongoClient } = require('mongodb');

const uri = 'mongodb://root:rootpassword@localhost:27017';
const dbName = 'codelearn_ai';

async function insertTestData() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(dbName);
    
    // C++ Turkish collection'a test data ekle
    const cppTrCollection = db.collection('lessons_cpp_tr');
    
    // Test Chapter
    const chapter = {
      _id: 'chapter_1',
      entityType: 'chapter',
      title: 'C++ Temelleri',
      description: 'C++ programlama dilinin temel kavramları',
      order: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Test Topic
    const topic = {
      _id: 'topic_1',
      entityType: 'topic',
      chapterId: 'chapter_1',
      title: 'Değişkenler ve Veri Tipleri',
      description: 'C++ değişkenleri ve veri tipleri hakkında',
      order: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Test Lesson
    const lesson = {
      _id: 'lesson_1',
      entityType: 'lesson',
      chapterId: 'chapter_1',
      topicId: 'topic_1',
      title: 'İlk C++ Programı',
      description: 'Hello World programı yazma',
      content: 'Bu ders C++ ile ilk programınızı yazmayı öğretir.',
      order: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Verileri ekle
    await cppTrCollection.insertOne(chapter);
    console.log('Chapter eklendi');
    
    await cppTrCollection.insertOne(topic);
    console.log('Topic eklendi');
    
    await cppTrCollection.insertOne(lesson);
    console.log('Lesson eklendi');
    
    console.log('Test data başarıyla eklendi!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

insertTestData(); 