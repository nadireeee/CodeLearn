const {Client}=require("pg");
(async()=>{
  const attempts=[
    {user:"nestjs_user", password:"nestjs_password", database:"postgres"},
    {user:"nestjs_user", password:"nestjs_password", database:"nestjs_user"},
    {user:"postgres", password:"nestjs_password", database:"postgres"},
    {user:"nadire", password:"nestjs_password", database:"postgres"},
  ];
  for (const a of attempts) {
    const c=new Client({host:"127.0.0.1", port:5433, ...a, connectionTimeoutMillis:3000});
    try { await c.connect(); const r=await c.query("select current_user, current_database()"); console.log("OK", JSON.stringify(a), r.rows[0]); await c.end(); }
    catch(e){ console.log("FAIL", a.user, a.database, e.message); try{await c.end()}catch{} }
  }
})();
