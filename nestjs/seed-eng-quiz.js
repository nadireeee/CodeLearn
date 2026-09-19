const mongoose=require("mongoose");
(async()=>{
  await mongoose.connect("mongodb://root:rootpassword@127.0.0.1:27017/codelearn_ai?authSource=admin");
  const db=mongoose.connection.db;
  const quizzes=await db.collection("quizzes").find({}).toArray();
  console.log("src", quizzes.length);
  if(quizzes.length){
    // strip _id for eng copy or keep new ids
    const eng=quizzes.map(q=>{
      const {_id, ...rest}=q;
      return {...rest, title: rest.title, id: rest.id + "_en"};
    });
    await db.collection("quizzes_eng").deleteMany({});
    await db.collection("quizzes_eng").insertMany(eng);
    console.log("eng", await db.collection("quizzes_eng").countDocuments());
  }
  await mongoose.disconnect();
})();
