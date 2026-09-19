# CodeLearn

C/C++ öğrenme mobil uygulaması — bitirme projesi.  
Expo (React Native) + NestJS + Google Gemini + Judge0.

Portföy: [nadireeee.github.io/portfolio](https://nadireeee.github.io/portfolio/#bitirme)

## Ekranlar

Canlı uygulamadan (dark tema) alınan görüntüler:

| Giriş | Ana ekran | Dersler |
| :---: | :---: | :---: |
| ![Login](docs/screenshots/01-login.png) | ![Ana ekran](docs/screenshots/02-ana-ekran.png) | ![Dersler](docs/screenshots/02-dersler.png) |

| Ders içerik | Quiz seçim | Quiz |
| :---: | :---: | :---: |
| ![Ders](docs/screenshots/03-ders-icerik.png) | ![Quiz seçim](docs/screenshots/04-quiz-secim.png) | ![Quiz](docs/screenshots/05-quiz.png) |

| AI Kod Oluşturucu | Yeni proje | Kod üretildi |
| :---: | :---: | :---: |
| ![Boş](docs/screenshots/08a-kod-bos.png) | ![Yeni proje](docs/screenshots/08b-yeni-proje-ai.png) | ![StringLibrary](docs/screenshots/08-ai-kod-olusturucu.png) |

| Generate sonucu | Rastgele sorular | Derleme hatası + AI |
| :---: | :---: | :---: |
| ![Kod](docs/screenshots/08c-kod-olusturuldu.png) | ![Rastgele](docs/screenshots/10-rastgele-sorular.png) | ![Hata/AI](docs/screenshots/12-ai-oneri-degerlendirme.png) |

| Chead Chat | Chat (scroll) | Profil |
| :---: | :---: | :---: |
| ![Chat](docs/screenshots/07-ai-chat.png) | ![Scroll](docs/screenshots/07b-ai-chat-scroll.png) | ![Profil](docs/screenshots/06-profil.png) |

## Özellikler

- **Dersler & quiz** — C/C++ konuları, Duolingo tarzı sorular
- **AI Kod Oluşturucu** — Gemini ile proje/dosya üretimi (ör. StringLibrary)
- **Rastgele Sorular** — Run / Evaluate, derleme hatası ve AI öneri
- **Chead Chat** — Gemini ile çok turlu sohbet
- **Kod çalıştırma** — Judge0 üzerinden derleme/çalıştırma

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

Expo Go veya web ile aç. API adresinin cihaz/emülatörden erişilebilir olduğundan emin ol.

## Teknolojiler

Expo · React Native · TypeScript · NestJS · Gemini · MongoDB · PostgreSQL · Judge0

## Lisans

Bitirme / eğitim amaçlı. Kaynak kod örnek olarak paylaşılmıştır.
