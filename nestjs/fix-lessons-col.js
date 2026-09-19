const mongoose=require("mongoose");
(async()=>{
  await mongoose.connect("mongodb://root:rootpassword@127.0.0.1:27017/codelearn_ai?authSource=admin");
  const db=mongoose.connection.db;
  const src=await db.collection("lessons_cpp_tr").find({}).toArray();
  if (src.length) {
    await db.collection("lessons_cpp_trs").deleteMany({});
    // convert _id strings carefully
    await db.collection("lessons_cpp_trs").insertMany(src);
    console.log("copied to lessons_cpp_trs", src.length);
  }
  // Also ensure quizzes collection matches schema - check quiz entity
  await mongoose.disconnect();
})();
