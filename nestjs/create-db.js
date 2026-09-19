const {Client}=require("pg");
(async()=>{
  const c=new Client({host:"127.0.0.1",port:5433,user:"nestjs_user",password:"nestjs_password",database:"postgres"});
  await c.connect();
  const r=await c.query("SELECT 1 FROM pg_database WHERE datname='nestjs_db'");
  if(!r.rowCount){ await c.query("CREATE DATABASE nestjs_db OWNER nestjs_user"); console.log("DB_CREATED"); }
  else console.log("DB_EXISTS");
  await c.end();
})().catch(e=>{console.error(e); process.exit(1);});
