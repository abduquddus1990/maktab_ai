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

WEBAPP_URL = os.getenv("WEBAPP_URL", "https://maktab-ai-one.vercel.app")
BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    name = user.first_name or "O'quvchi"

    keyboard = [
        [InlineKeyboardButton("🚀 MAKTAB AI ni ochish", web_app=WebAppInfo(url=WEBAPP_URL))],
        [InlineKeyboardButton("📖 Qo'llanma", callback_data="help"),
         InlineKeyboardButton("💬 Murojaat", url="https://t.me/maktabai_support")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    await update.message.reply_text(
        f"Assalomu alaykum, *{name}*\\! 👋\n\n"
        "🎓 *MAKTAB AI* — O'zbekistonning eng aqlli o'quv yordamchisi\\!\n\n"
        "━━━━━━━━━━━━━━━━\n"
        "✅ *1\\-11 sinf* barcha fanlar\n"
        "✅ *Gemini AI* bilan real vaqt javoblari\n"
        "✅ *O'zbek tilida* — sizning yoshingizga mos\n"
        "✅ *Test va olimpiada* tayyorgarligи\n"
        "✅ *Fayllar* — PDF va rasm yuklash\n"
        "✅ *Ovozli* savol berish\n"
        "━━━━━━━━━━━━━━━━\n\n"
        "👇 Quyidagi tugmani bosing va boshlang\\!",
        reply_markup=reply_markup,
        parse_mode="MarkdownV2"
    )


async def help_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [[InlineKeyboardButton("🚀 MAKTAB AI ni ochish", web_app=WebAppInfo(url=WEBAPP_URL))]]
    reply_markup = InlineKeyboardMarkup(keyboard)

    await update.message.reply_text(
        "📚 *MAKTAB AI — Qo'llanma*\n\n"
        "━━━━━━━━━━━━━━━━\n"
        "🔹 /start — Botni ishga tushirish\n"
        "🔹 /help — Ushbu yordam xabari\n\n"
        "📱 *Qanday ishlatish:*\n"
        "1\\. \"MAKTAB AI ni ochish\" tugmasini bosing\n"
        "2\\. Sinfingizni tanlang \\(1\\-11\\)\n"
        "3\\. Fanlingizni tanlang\n"
        "4\\. AI bilan suhbat boshlang\\!\n\n"
        "💡 *Maslahat:* PDF darslik yoki rasm yuklasangiz, AI uni tahlil qiladi\\.",
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
        logger.error("TELEGRAM_BOT_TOKEN topilmadi!")
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
            logger.info("5 soniyadan keyin qayta uriniladi...")
            time.sleep(5)


if __name__ == "__main__":
    main()
