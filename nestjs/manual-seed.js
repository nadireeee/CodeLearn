const mongoose = require("mongoose");
const uri = "mongodb://root:rootpassword@127.0.0.1:27017/codelearn_ai?authSource=admin";

(async () => {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  // Lessons collection used by app - check schema collection name
  const lessonCol = db.collection("lessons_cpp_tr");
  await lessonCol.deleteMany({});
  await lessonCol.insertMany([
    {
      _id: "cpp_tr_chapter_1",
      entityType: "chapter",
      title: "C++ Programlama Diline Giriş",
      description: "C++ programlama dilinin temellerini öğrenin",
      slug: "cpp-giris",
      order: 1,
      isActive: true,
      language: "cpp",
      locale: "tr",
      createdAt: new Date(),
      updatedAt: new Date(),
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
      updatedAt: new Date(),
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
        { type: "text", content: "C++ programlama dilinde ilk programımızı yazalım." },
        {
          type: "code",
          content: "#include <iostream>\n\nint main() {\n    std::cout << \"Merhaba Dünya!\" << std::endl;\n    return 0;\n}",
          language: "cpp",
        },
        { type: "text", content: "Bu program ekrana 'Merhaba Dünya!' yazdırır." },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);
  console.log("LESSONS_SEEDED", await lessonCol.countDocuments());

  // Quiz collection - check model name
  const quizCols = await db.listCollections().toArray();
  console.log("COLLECTIONS", quizCols.map(c => c.name).join(","));

  const Quiz = db.collection("quizzes");
  const quizDoc = {
    id: "variables_basic_1",
    title: "Temel Değişkenler - Giriş",
    description: "C++ değişken türlerinin temellerini öğren",
    skillId: "variables",
    subjectId: "basics",
    difficulty: "easy",
    estimatedTime: 4,
    xpReward: 20,
    isActive: true,
    questions: [
      {
        id: "q1",
        type: "multiple-choice",
        question: "C++'da bir tam sayı değişkeni tanımlamak için hangi anahtar kelime kullanılır?",
        options: ["var", "let", "int", "integer"],
        correctAnswer: 2,
        explanation: "C++'da tam sayı değişkenleri tanımlamak için int kullanılır.",
        points: 5,
      },
      {
        id: "q2",
        type: "multiple-choice",
        question: "Hangi veri türü tek bir karakter saklar?",
        options: ["int", "char", "string", "float"],
        correctAnswer: 1,
        explanation: "char veri türü tek bir karakter saklar.",
        points: 5,
      },
      {
        id: "q3",
        type: "multiple-choice",
        question: "Pointer tanımında hangi operatör kullanılır?",
        options: ["&", "*", "#", "@"],
        correctAnswer: 1,
        explanation: "* operatörü pointer tanımlamak için kullanılır.",
        points: 5,
      },
    ],
  };
  await Quiz.deleteMany({ id: "variables_basic_1" });
  await Quiz.insertOne(quizDoc);
  // Also try common alternate collection names
  for (const name of ["quiz", "Quiz", "quizzes_tr"]) {
    try {
      await db.collection(name).updateOne({ id: quizDoc.id }, { $set: quizDoc }, { upsert: true });
      console.log("upserted", name);
    } catch {}
  }
  console.log("QUIZ_SEEDED quizzes=", await Quiz.countDocuments());
  await mongoose.disconnect();
})().catch(e => { console.error(e); process.exit(1); });
