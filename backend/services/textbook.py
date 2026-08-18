from sqlalchemy.orm import Session
from models import Textbook, Subject


def search_textbook(db: Session, grade: int, subject_id: int, query: str, limit: int = 3) -> str:
    """Search textbook content relevant to the query."""
    results = (
        db.query(Textbook)
        .filter(Textbook.grade == grade, Textbook.subject_id == subject_id)
        .all()
    )
    if not results:
        return ""

    # Simple keyword match — in production use pgvector or FTS
    query_words = query.lower().split()
    scored = []
    for tb in results:
        score = sum(1 for w in query_words if w in tb.content.lower())
        if score > 0:
            scored.append((score, tb))

    scored.sort(key=lambda x: x[0], reverse=True)
    top = scored[:limit]

    if not top:
        return ""

    parts = []
    for _, tb in top:
        chunk = f"[{tb.chapter or 'Bob'}, {tb.page_number or '?'}-bet]\n{tb.content[:400]}"
        parts.append(chunk)

    return "\n\n---\n\n".join(parts)
