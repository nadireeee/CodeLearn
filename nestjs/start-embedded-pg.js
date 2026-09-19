process.env.LC_ALL = "C";
process.env.LANG = "C";
process.env.LC_CTYPE = "C";
const EmbeddedPostgres = require("embedded-postgres").default || require("embedded-postgres");
(async () => {
  const pg = new EmbeddedPostgres({
    databaseDir: "C:/data/embedded-pg",
    user: "nestjs_user",
    password: "nestjs_password",
    port: 5433,
    persistent: true,
    initdbFlags: ["--locale=C", "--encoding=UTF8"],
  });
  console.log("init...");
  await pg.initialise();
  console.log("start...");
  await pg.start();
  try { await pg.createDatabase("nestjs_db"); console.log("db created"); } catch (e) { console.log("createDb:", e.message); }
  console.log("EMBEDDED_PG_OK");
  require("fs").writeFileSync("C:/data/embedded-pg-running.txt", String(process.pid));
  setInterval(() => {}, 1 << 30);
})().catch(e => { console.error("FAIL", e); process.exit(1); });
