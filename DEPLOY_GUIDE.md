# MAKTAB AI & QALQON — PRODUCTION DEPLOY QO'LLANMASI 🚀

Ushbu qo'llanma loyihani internetga (Vercel / Render / Docker) joylashtirish va Telegram BotFather orqali Mini App menyusiga ulash bo'yicha to'liq yo'riqnomadir.

---

## 1. Vercel Orqali Deploy Qilish (Tavsiya etiladi — Bepul va Tez)

1. [Vercel.com](https://vercel.com) saytiga kiring va GitHub profilingiz orqali tizimga kiring.
2. **"Add New Project"** tugmasini bosing va `abduquddus1990/maktab_ai` repozitoriyasini tanlang.
3. **Environment Variables** bo'limida quyidagi o'zgaruvchilarni kiriting:
   * `GEMINI_API_KEY` = sizning Gemini API kalitingiz
   * `ANTHROPIC_API_KEY` = sizning Claude API kalitingiz (opsional)
   * `TELEGRAM_BOT_TOKEN` = Telegram bot tokeningiz
4. **"Deploy"** tugmasini bosing!
5. 1 daqiqadan so'ng sizga rasmiy domen taqdim etiladi (masalan: `https://maktab-ai-uz.vercel.app`).

---

## 2. Render.com Orqali Deploy Qilish

1. [Render.com](https://render.com) ga kiring va **"New Web Service"** tugmasini bosing.
2. GitHub repozitoriyangizni ulang (`maktab_ai`).
3. Quyidagi sozlamalarni tanlang:
   * **Runtime:** Node
   * **Build Command:** `npm install`
   * **Start Command:** `npm start`
4. **"Create Web Service"** tugmasini bosing.

---

## 3. Telegram Botga Mini App Menyusini Ulash (@BotFather)

1. Telegramda [@BotFather](https://t.me/BotFather) botiga kiring.
2. `/mybots` buyrug'ini yuboring va o'z botingizni tanlang (`@farzand_nazorat_bot` yoki `@maktab_ai_bot`).
3. **"Bot Settings"** -> **"Menu Button"** -> **"Configure menu button"** bo'limiga kiring.
4. WebApp URL manzilini yuboring:
   `https://sizning-domeningiz.vercel.app/app.html`
5. Tugma nomini kiriting: `🚀 MAKTAB AI`
6. Tayyor! Endi barcha foydalanuvchilar botga kirganda chap burchakda chiroyli "MAKTAB AI" Telegram Mini App tugmasi paydo bo'ladi.
