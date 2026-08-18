#!/bin/bash
# MAKTAB AI — lokal ishga tushirish

set -e
cd "$(dirname "$0")"

echo "🚀 MAKTAB AI ishga tushmoqda..."

# 1. Frontend serverni ishga tushir
echo "📡 Frontend server: http://localhost:3000"
python3 -m http.server 3000 --directory frontend &
FRONTEND_PID=$!

# 2. ngrok tunnel ochar
echo "🌐 ngrok tunnel ochilmoqda..."
ngrok http 3000 --log=stdout --log-format=json > /tmp/ngrok.log 2>&1 &
NGROK_PID=$!
sleep 3

# 3. ngrok URL ni olish
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | python3 -c "
import sys, json
data = json.load(sys.stdin)
tunnels = data.get('tunnels', [])
for t in tunnels:
    if t.get('proto') == 'https':
        print(t['public_url'])
        break
" 2>/dev/null)

if [ -z "$NGROK_URL" ]; then
  echo "❌ ngrok URL olinmadi. ngrok o'rnatilganmi?"
  kill $FRONTEND_PID $NGROK_PID 2>/dev/null
  exit 1
fi

echo ""
echo "✅ Frontend URL: $NGROK_URL"
echo ""

# 4. .env ga WEBAPP_URL yaz
if [ -f .env ]; then
  if grep -q "^WEBAPP_URL=" .env; then
    sed -i '' "s|^WEBAPP_URL=.*|WEBAPP_URL=$NGROK_URL|" .env
  else
    echo "WEBAPP_URL=$NGROK_URL" >> .env
  fi
  echo "📝 .env yangilandi: WEBAPP_URL=$NGROK_URL"
fi

# 5. Bot ishga tushur
echo ""
echo "🤖 Telegram bot ishga tushmoqda..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Telegram-da /start yuboring"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Bot uchun env o'qish
export $(grep -v '^#' .env | xargs)
python3 bot/bot.py

# Toxtatish
kill $FRONTEND_PID $NGROK_PID 2>/dev/null
