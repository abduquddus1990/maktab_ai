from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from database import get_db
from models import Student, ChatSession, Message, TestResult, Subject

router = APIRouter()


@router.get("/stats/{student_id}")
async def get_stats(student_id: int, db: Session = Depends(get_db)):
    today = datetime.now().date()
    week_ago = today - timedelta(days=7)

    # Today's sessions
    today_sessions = (
        db.query(ChatSession)
        .filter(
            ChatSession.student_id == student_id,
            func.date(ChatSession.started_at) == today,
        )
        .all()
    )

    # Total messages today
    today_messages = (
        db.query(func.count(Message.id))
        .join(ChatSession)
        .filter(
            ChatSession.student_id == student_id,
            func.date(ChatSession.started_at) == today,
        )
        .scalar()
    ) or 0

    # Tests today
    today_tests = (
        db.query(func.count(TestResult.id))
        .filter(
            TestResult.student_id == student_id,
            func.date(TestResult.taken_at) == today,
        )
        .scalar()
    ) or 0

    # Average test score
    avg_score = (
        db.query(func.avg(TestResult.score * 10.0 / TestResult.total))
        .filter(TestResult.student_id == student_id)
        .scalar()
    )

    # Weekly activity (minutes per day for last 7 days)
    weekly = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        count = (
            db.query(func.count(Message.id))
            .join(ChatSession)
            .filter(
                ChatSession.student_id == student_id,
                func.date(ChatSession.started_at) == day,
            )
            .scalar()
        ) or 0
        weekly.append({"date": str(day), "messages": count, "minutes": count * 2})

    # Recent activity
    recent_sessions = (
        db.query(ChatSession, Subject)
        .join(Subject, ChatSession.subject_id == Subject.id)
        .filter(ChatSession.student_id == student_id)
        .order_by(ChatSession.started_at.desc())
        .limit(5)
        .all()
    )

    recent = []
    for session, subject in recent_sessions:
        msg_count = db.query(func.count(Message.id)).filter(Message.session_id == session.id).scalar() or 0
        recent.append({
            "subject": subject.name,
            "icon": subject.icon or "📚",
            "messages": msg_count,
            "time": session.started_at.strftime("%H:%M"),
            "date": str(session.started_at.date()),
        })

    return {
        "today": {
            "time_minutes": len(today_sessions) * 15,
            "messages": today_messages,
            "tests": today_tests,
            "avg_score": round(avg_score or 0, 1),
        },
        "weekly": weekly,
        "recent": recent,
    }


@router.get("/news")
async def get_news():
    return [
        {"id": 1, "title": "Yangi o'quv yili tayyorgarligi", "date": "2026-05-14", "icon": "🏫"},
        {"id": 2, "title": "Matematika olimpiadasi e'lon qilindi", "date": "2026-05-12", "icon": "📐"},
        {"id": 3, "title": "O'quvchilar uchun yangi imtihon qoidalari", "date": "2026-05-10", "icon": "📝"},
        {"id": 4, "title": "Raqamli ta'lim haftaligi boshlanadi", "date": "2026-05-08", "icon": "💻"},
    ]
