const mongoose=require("mongoose");
(async()=>{
  await mongoose.connect("mongodb://root:rootpassword@127.0.0.1:27017/codelearn_ai?authSource=admin");
  const col=mongoose.connection.db.collection("lessons_cpp_trs");
  await col.updateOne({_id:"cpp_tr_chapter_1"},{$set:{id:"cpp_tr_chapter_1"}});
  await col.updateOne({_id:"cpp_tr_topic_1_1"},{$set:{
    id:"cpp_tr_topic_1_1", entityType:"topic", chapterId:"cpp_tr_chapter_1",
    title:"C++ Temel Kavramlar", description:"C++ dili hakkında temel bilgiler",
    slug:"cpp-temel-kavramlar", order:1, isActive:true
  }},{upsert:true});
  await col.updateOne({_id:"cpp_tr_lesson_1_1_1"},{$set:{
    id:"cpp_tr_lesson_1_1_1", entityType:"lesson", chapterId:"cpp_tr_chapter_1", topicId:"cpp_tr_topic_1_1",
    title:"İlk C++ Programı", description:"Hello World", slug:"ilk-cpp-programi", order:1, isActive:true,
    content:[
      {type:"text", content:"C++ programlama dilinde ilk programımızı yazalım."},
      {type:"code", content:"#include <iostream>\nint main(){ std::cout << \"Merhaba\"; return 0; }", language:"cpp"},
      {type:"text", content:"Bu program ekrana Merhaba yazdırır."}
    ]
  }},{upsert:true});
  console.log("docs", await col.countDocuments());
  await mongoose.disconnect();
})();
