import os
import time
import logging
from pathlib import Path
from dotenv import load_dotenv
from telegram import Update, WebAppInfo, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ApplicationBuilder, CommandHandler, CallbackQueryHandler, ContextTypes

load_dotenv(Path(__file__).parent.parent / ".env")

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

WEBAPP_URL = os.getenv("WEBAPP_URL", "http://localhost:3000/app.html")
BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    name = user.first_name or "Foydalanuvchi"

    keyboard = [
        [InlineKeyboardButton("🚀 MAKTAB AI & QALQON (Mini App)", web_app=WebAppInfo(url=WEBAPP_URL))],
        [InlineKeyboardButton("🛡️ Ota-ona Nazorati (GPS & Reels)", web_app=WebAppInfo(url=f"{WEBAPP_URL}?role=parent")),
         InlineKeyboardButton("🎓 AI Darslik Repetitor", web_app=WebAppInfo(url=f"{WEBAPP_URL}?role=student"))],
        [InlineKeyboardButton("📖 Qo'llanma", callback_data="help"),
         InlineKeyboardButton("💬 Murojaat", url="https://t.me/maktabai_support")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    await update.message.reply_text(
        f"Assalomu alaykum, *{name}*\\! 👋\n\n"
        "🎓 *MAKTAB AI & QALQON* — Yagona Milliy Ta'lim va Xavfsizlik Ekotizimi\\!\n\n"
        "━━━━━━━━━━━━━━━━\n"
        "✅ *1\\-11 sinf DTS* darsliklar bazasi va AI Repetitor\n"
        "✅ *Vision AI* — masala va darslik rasmini tahlil qilish\n"
        "✅ *Jonli GPS* lokatsiya va xavfsiz geozonalar\n"
        "✅ *Reels / Shorts* kontentini AI orqali tahlil qilish\n"
        "✅ *Ixtiro Laboratoriyasi* — yosh ixtirochilar uchun\n"
        "✅ *Telegram Stars & TON* to'lov integratsiyasi\n"
        "━━━━━━━━━━━━━━━━\n\n"
        "👇 Quyidagi tugmani bosing va Mini App'ni oching\\!",
        reply_markup=reply_markup,
        parse_mode="MarkdownV2"
    )

async def help_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [[InlineKeyboardButton("🚀 Mini App'ni ochish", web_app=WebAppInfo(url=WEBAPP_URL))]]
    reply_markup = InlineKeyboardMarkup(keyboard)

    await update.message.reply_text(
        "📚 *MAKTAB AI & QALQON — Qo'llanma*\n\n"
        "━━━━━━━━━━━━━━━━\n"
        "🔹 /start — Botni ishga tushirish\n"
        "🔹 /help — Ushbu yordam xabari\n\n"
        "📱 *Qanday ishlatish:*\n"
        "1\\. \"MAKTAB AI & QALQON\" tugmasini bosing\n"
        "2\\. O'quvchi yoki Ota-ona rejimini tanlang\n"
        "3\\. Darslik savolini yozing yoki topshiriqni rasmga olib yuboring\\!",
        reply_markup=reply_markup,
        parse_mode="MarkdownV2"
    )

async def button_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    if query.data == "help":
        await help_cmd(update, context)

def main():
    if not BOT_TOKEN:
        logger.warning("TELEGRAM_BOT_TOKEN hozircha sozlanmagan. .env fayliga kiriting!")
        return

    while True:
        try:
            logger.info("Bot ishga tushmoqda...")
            app = ApplicationBuilder().token(BOT_TOKEN).build()
            app.add_handler(CommandHandler("start", start))
            app.add_handler(CommandHandler("help", help_cmd))
            app.add_handler(CallbackQueryHandler(button_handler))
            app.run_polling(drop_pending_updates=True)
        except Exception as e:
            logger.error(f"Bot xatosi: {e}")
            time.sleep(5)

if __name__ == "__main__":
    main()
