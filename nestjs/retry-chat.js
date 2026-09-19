const axios = require("axios");
const fs = require("fs");
(async () => {
  const auth = JSON.parse(fs.readFileSync("C:/data/thesis-auth.json","utf8"));
  // refresh login
  const login = await axios.post("http://127.0.0.1:3000/auth/login", { email: auth.email, password: auth.password }).catch(async () => {
    const email = "thesis_live2_" + Date.now() + "@codelearn.local";
    const password = "TestPass123!";
    await axios.post("http://127.0.0.1:3000/user", { email, password, firstName:"Nadire", lastName:"Yondem" });
    return axios.post("http://127.0.0.1:3000/auth/login", { email, password });
  });
  const token = login.data.accessToken;
  const email = login.data.user?.email || auth.email;
  const password = auth.password || "TestPass123!";
  console.log("user", email, login.data.user?.id);
  const chat = await axios.post("http://127.0.0.1:3000/ai/chat", {
    message: "C++ pointer nedir kisaca acikla",
    sessionId: "shot-" + Date.now()
  }, { headers: { Authorization: "Bearer " + token }, timeout: 120000 });
  const text = String(chat.data.response || "");
  const real = !text.includes("şu anda size yardımcı olamıyorum") && text.length > 80;
  console.log("REAL", real, "LEN", text.length);
  console.log("PREVIEW", text.slice(0, 500));
  fs.writeFileSync("C:/data/thesis-auth.json", JSON.stringify({
    email, password, token, user: login.data.user, chatPreview: text.slice(0, 1000), geminiReal: real
  }, null, 2));
  process.exit(real ? 0 : 2);
})().catch(e => { console.error(e.response && e.response.data || e.message); process.exit(1); });
