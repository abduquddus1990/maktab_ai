import anthropic
import os
from typing import Optional

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

SYSTEM_TEMPLATE = """Siz MAKTAB AI — O'zbekiston {grade}-sinf {subject} fani bo'yicha AI mentorsiz.

Qoidalar:
1. Faqat {grade}-sinf dasturi doirasida javob bering
2. {grade} sinf o'quvchisiga mos, sodda til ishlatng
3. Murakkab atamalardan qoching — bola tushunishi kerak
4. Har doim misollar bilan tushuntiring
5. Javob 3-5 qatordan oshmasin (bola charchaydi)
6. O'zbek tilida (lotin alifbosi) javob bering
7. Javob bergandan keyin "Tushundingizmi? Test qilamizmi? 😊" deb so'rang
8. Raqamli masalalarda hisoblash jarayonini ko'rsating
9. O'quvchini doim rag'batlantiring

{context}

O'quvchi: {name}, {grade}-sinf"""

TEST_SYSTEM = """Siz O'zbekiston {grade}-sinf {subject} fani bo'yicha test tuzuvchi AI siz.

5 ta test savoli tuzing. Har bir savol uchun 4 ta variant bering.
JSON formatda qaytaring:
{{
  "questions": [
    {{
      "q": "savol matni",
      "options": ["A variant", "B variant", "C variant", "D variant"],
      "correct": 0
    }}
  ]
}}

Qoidalar:
- Savollar {grade}-sinf dasturidan bo'lsin
- Tushunarli, oddiy til ishlatng
- correct — to'g'ri javob indeksi (0-3)
- Faqat JSON qaytaring, boshqa narsa yozmanmang"""


def get_ai_response(
    name: str,
    grade: int,
    subject: str,
    question: str,
    history: list[dict] = None,
    textbook_context: str = "",
) -> str:
    context = f"\nDarslik konteksti:\n{textbook_context}" if textbook_context else ""

    system = SYSTEM_TEMPLATE.format(
        grade=grade,
        subject=subject,
        name=name,
        context=context,
    )

    messages = []
    if history:
        for msg in history[-8:]:  # last 8 for context window efficiency
            messages.append({"role": msg["role"], "content": msg["content"]})

    messages.append({"role": "user", "content": question})

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=600,
        system=system,
        messages=messages,
    )
    return response.content[0].text


def generate_test(grade: int, subject: str) -> Optional[dict]:
    import json

    system = TEST_SYSTEM.format(grade=grade, subject=subject)

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1500,
        system=system,
        messages=[{"role": "user", "content": f"{grade}-sinf {subject} fanidan 5 ta test savoli tuzing."}],
    )

    text = response.content[0].text.strip()

    # Extract JSON if wrapped in code block
    if "```" in text:
        start = text.find("{")
        end = text.rfind("}") + 1
        text = text[start:end]

    return json.loads(text)
