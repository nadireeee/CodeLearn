# CodeLearn

C/C++ öğrenme mobil uygulaması.  
Expo (React Native) + NestJS + Google Gemini + Judge0.

Portföy: [nadireeee.github.io/portfolio](https://nadireeee.github.io/portfolio/#bitirme)

## Ekranlar

| Google giriş | Ana ekran | Dersler |
| :---: | :---: | :---: |
| ![Login](docs/screenshots/01-login.png) | ![Ana ekran](docs/screenshots/02-ana-ekran.png) | ![Dersler](docs/screenshots/02-dersler.png) |

| Ders içerik | Quiz seçim | Duolingo quiz |
| :---: | :---: | :---: |
| ![Ders](docs/screenshots/03-ders-icerik.png) | ![Quiz seçim](docs/screenshots/04-quiz-secim.png) | ![Quiz](docs/screenshots/05-quiz.png) |

| Quiz (seri) | Chead sohbet | İlerleme (istatistik) |
| :---: | :---: | :---: |
| ![Quiz 2](docs/screenshots/05b-quiz-2.png) | ![Chat](docs/screenshots/07-ai-chat.png) | ![İstatistik](docs/screenshots/10-istatistik.png) |

| AI Kod Oluşturucu | Yeni proje | Kod üretildi |
| :---: | :---: | :---: |
| ![Boş](docs/screenshots/08a-kod-bos.png) | ![Yeni proje](docs/screenshots/08b-yeni-proje-ai.png) | ![StringLibrary](docs/screenshots/08-ai-kod-olusturucu.png) |

| Kod üretildi | Rastgele sorular | AI değerlendirme (başarılı) |
| :---: | :---: | :---: |
| ![Kod](docs/screenshots/08c-kod-olusturuldu.png) | ![Rastgele](docs/screenshots/10-rastgele-sorular.png) | ![Değerlendirme](docs/screenshots/12-ai-oneri-degerlendirme.png) |

| Forum | Rozetler | Profil |
| :---: | :---: | :---: |
| ![Forum](docs/screenshots/16-forum-liste.png) | ![Rozet](docs/screenshots/15b-rozetler-tab.png) | ![Profil](docs/screenshots/06-profil.png) |

## Özellikler

- **Google ile giriş** — OAuth (`LoginScreen`)
- **Duolingo tarzı quiz** — seri sorular, tıkla / yaz-cevapla (`DuolingoQuizScreen`, `QuizSelectionScreen`)
- **Chead Chat** — Gemini çok turlu sohbet (`AiChatScreen`)
- **Topluluk forumu** — soru/cevap (`ForumListScreen`)
- **Kod + AI doğru/yanlış öneri** — Evaluate / kod analizi (`RandomQuestionScreen`, `CodeAnalysisScreen`)
- **İlerleme** — istatistik (`QuizStatsScreen`) ve rozetler (`BadgesScreen`)
- **AI Kod Oluşturucu** — Gemini ile proje üretimi
- **Judge0** — kod çalıştırma

## Yapı

```
CodeLearn/
├── frontend/     # Expo React Native (TypeScript)
├── nestjs/       # NestJS API (Gemini, auth, quiz, projects)
├── judge0/       # Kod çalıştırma servisi yapılandırması
└── docs/screenshots/
```

## Kurulum

### Gereksinimler

- Node.js 18+
- PostgreSQL, MongoDB
- (İsteğe bağlı) Judge0
- Google Gemini API anahtarı

### Backend

```bash
cd nestjs
cp .env.example .env
# .env içinde GEMINI_API_KEY ve veritabanı bilgilerini doldur
npm install
npm run start:dev
```

API varsayılan: `http://localhost:3000`

### Frontend

```bash
cd frontend
npm install
npx expo start
```

## Teknolojiler

Expo · React Native · TypeScript · NestJS · Gemini · MongoDB · PostgreSQL · Judge0

## Lisans

Eğitim amaçlı. Kaynak kod örnek olarak paylaşılmıştır.
