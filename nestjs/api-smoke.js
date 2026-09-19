const axios = require("axios");
(async () => {
  const email = "thesis_shot_" + Date.now() + "@codelearn.local";
  const password = "TestPass123!";
  try {
    const signup = await axios.post("http://127.0.0.1:3000/user", {
      email, password, firstName: "Nadire", lastName: "Yondem"
    });
    console.log("SIGNUP_OK", signup.data.id || signup.status);
  } catch (e) {
    console.log("SIGNUP", e.response && e.response.status, e.response && e.response.data);
  }
  const login = await axios.post("http://127.0.0.1:3000/auth/login", { email, password });
  const token = login.data.accessToken || login.data.access_token;
  console.log("LOGIN_OK", !!token, Object.keys(login.data));
  const chat = await axios.post("http://127.0.0.1:3000/ai/chat", {
    message: "C++ pointer nedir kisaca acikla",
    sessionId: "shot-session-1",
    language: "tr"
  }, { headers: { Authorization: "Bearer " + token }, timeout: 90000 });
  const preview = JSON.stringify(chat.data).slice(0, 500);
  console.log("CHAT_OK", preview);
  require("fs").writeFileSync("C:/data/thesis-auth.json", JSON.stringify({ email, password, token, chatPreview: preview }, null, 2));
})().catch(e => {
  console.error("FAIL", e.response && e.response.data || e.message);
  process.exit(1);
});
