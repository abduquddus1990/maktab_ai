# YAGONA TEXNIK TOPSHIRIQ (TZ)
## "MAKTAB AI" — Milliy Ta'lim, AI Repetitor va Ota-ona Nazorati (Qalqon) Ekotizimi

**Versiya:** 2.0 (Birlashtirilgan)  
**Sana:** 2026-08-19  
**Loyiha qamrovi:** Web Platforma + Telegram Mini App + Backend API + Android Telemetriya Ilovasi  

---

## 1. LOYIHA MAQSADI VA KONSEPSIYASI

### 1.1 Maqsad
Maktab o'quvchilari uchun sun'iy intellektga asoslangan zamonaviy ta'lim yordamchisi (AI Repetitor, Fanlar, Ixtirolar) hamda ota-onalar uchun farzandning ta'limiy rivojlanishi va raqamli xavfsizligini ta'minlovchi (Qalqon moduli: lokatsiya, ekran vaqti, YouTube/Instagram tahlili) yagona milliy ekotizimni yaratish.

### 1.2 Integratsiya vazifalari
1. **Maktab AI** (Ta'lim, AI chat, darsliklar, ixtiro) va **Qalqon AI** (Ota-ona nazorati, lokatsiya, ilovalar monitoringi) loyihalarini bitta yaxlit arxitekturaga birlashtirish.
2. Takrorlanuvchi funksiyalar va dizaynlarni qisqartirib, yagona **Telegram Mini App (TMA)** va Web platformasiga aylantirish.
3. Ro'yxatdan o'tish va autentifikatsiyani **Qalqon AI** uslubida (SMS-OTP / Telegram Auth / Supabase) sodda va xavfsiz qilish.
4. AI suhbatlarida **Maktab AI** tizimidagi professional `system prompts` (`repetitor.txt`, `ixtiro.txt`) va xavfsizlik filtrlaridan foydalanish.
5. Qalqon AI loyihasidagi to'liq ishlamagan funksiyalarni (farzand GPS lokatsiyasi, YouTube/Insta reels mazmuni tahlili, ilovalar ro'yxati va vaqti) to'liq ishga tushirish va xatolarini to'g'rilash.

---

## 2. FOYDALANUVCHI ROLLARI VA IMKONIYATLARI

```
                              ┌────────────────────────┐
                              │  MAKTAB AI EKOTIZIMI   │
                              └───────────┬────────────┘
                                          │
        ┌─────────────────────────────────┼────────────────────────────────┐
        ▼                                 ▼                                ▼
┌───────────────┐                 ┌───────────────┐                ┌───────────────┐
│   O'QUVCHI    │                 │   OTA-ONA     │                │     USTOZ     │
├───────────────┤                 ├───────────────┤                ├───────────────┤
│• 1-11 sinf    │                 │• Farzand GPS  │                │• Guruhlar     │
│  fanlari (AI) │                 │  lokatsiyasi  │                │  tashkil etish│
│• Rasm tahlili │                 │• Reels/video  │                │• O'quvchilar  │
│  (masala yech)│                 │  kontent AI   │                │  monitoringi  │
│• Ixtiro lab   │                 │• App vaqti    │                │• Repetitorlik │
│• Test/Viktor  │                 │• O'zlashtirish│                │  profili      │
└───────────────┘                 └───────────────┘                └───────────────┘
```

---

## 3. ASOSIY MODULLAR VA FUNKSIONAL TALABLAR

### 3.1 Autentifikatsiya va Profil (Qalqon AI negizida)
- **Telefon raqam + SMS-OTP / Telegram orqali tezkor kirish.**
- **Rol tanlash:** O'quvchi, Ota-ona, Ustoz.
- **Farzandni ulash mexanizmi:**
  - Ota-ona o'z kabinetida 6 xonali maxsus ulanish kodini generatsiya qiladi.
  - Farzand qurilmasidagi Android ilovada ushbu kod kiritilib, ota-ona profiliga bog'lanadi.

### 3.2 AI Ta'lim va Repetitor Moduli (Maktab AI negizida)
- **Maktab dasturi bo'yicha AI Repetitor:** 1–11 sinf barcha fanlari bo'yicha savollarga yoshga mos tushuntirish.
- **Vision (Rasm tahlili):** Masala, misol, darslik sahifasi rasmini yuklab, Claude/Gemini orqali yechim algoritmini olish.
- **Ixtiro Laboratoriyasi:** O'quvchilarning innovatsion loyiha va g'oyalarini AI murabbiy yordamida loyihalash (`ixtiro.txt` prompti asosida).
- **Qat'iy xavfsizlik filtri (`Safety Guard`):** Bolalarga zararli, noo'rin yoki ta'limga aloqador bo'lmagan so'rovlarni avtomatik aniqlab, xavfsiz o'quv o'zaniga yo'naltirish.

### 3.3 Qalqon — Ota-ona Nazorati va Telemetriya Moduli
- **1. Farzand Jonli Lokatsiyasi (GPS Monitoring):**
  - Android xizmati (Foreground Service) har 10-15 daqiqada koordinatalarni backendga yuboradi.
  - Ota-ona panelida Leaflet.js xaritasida farzandning joriy manzili, harakat tarixi va Geozonalar (Uy, Maktab) ko'rsatiladi.
- **2. YouTube va Instagram Reels/Shorts Tahlili:**
  - Android `AccessibilityService` orqali bola ko'rgan video mavzulari / sarlavhalari yig'iladi.
  - Backenddagi AI vositasi ushbu xom ma'lumotlarni tahlil qilib, ota-onaga tushunarli semantik hisobot beradi (Masalan: *"Farzandingiz 70% vaqtini ilmiy-ommabop va fizika tajribalari videolariga, 30% vaqtini esa komediya reelslariga sarfladi"*).
- **3. Foydalanilayotgan Ilovalar va Ekran Vaqti:**
  - Qaysi ilovada qancha vaqt o'tkazilgani (YouTube, Telegram, O'yinlar, Darslik ilovalari) real vaqt grafiklarida (Chart.js) aks etadi.
- **4. Shaffoflik va Axloqiy Qoidalar:**
  - Bola qurilmasida doimiy bildirishnoma ko'rinib turadi, tizim josuslik emas, o'zaro ishonch va himoya vositasi sifatida ishlaydi.

---

## 4. TEXNOLOGIYALAR STEKI

| Qatlam | Texnologiyalar |
| :--- | :--- |
| **Telegram Mini App & Web** | HTML5, TailwindCSS / CSS3, Vanilla JS, Leaflet.js, Chart.js |
| **Backend API** | Python (FastAPI) + Node.js (AI Engine) |
| **AI Modellari** | Claude 3.5 Sonnet / Gemini 2.0 Flash (`repetitor.txt`, `ixtiro.txt`) |
| **Ma'lumotlar bazasi** | PostgreSQL (Supabase / SQLAlchemy) |
| **Telegram Bot** | Python `aiogram` / `python-telegram-bot` |
| **Mijoz Ilovasi (Bola)** | Android (Kotlin, Jetpack WorkManager, AccessibilityService) |

---

## 5. BIRLASHTIRISH VA ISHGA TUSHIRISH BOSQICHLARI

1. **1-bosqich:** Yagona arxitektura va loyiha papkalari strukturasini birlashtirish (ortiqcha takroriy fayllarni tozalash).
2. **2-bosqich:** Qalqon AI ro'yxatdan o'tish tizimini Maktab AI ga integratsiya qilish.
3. **3-bosqich:** Maktab AI system promptlari va xavfsizlik filtrlarini yagona AI routeriga ulash.
4. **4-bosqich:** Qalqon telemetriya xatolarini tuzatish (GPS xaritasi, Ilovalar sarfi, Reels mazmun tahlili AI algoritmi).
5. **5-bosqich:** Yagona Telegram Mini App interfeysini sozlash va sinovdan o'tkazish.
