from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
from models import Subject

router = APIRouter()

# Seed data — default subjects per grade
DEFAULT_SUBJECTS = {
    range(1, 5): [
        {"name": "O'zbek tili", "icon": "📝"},
        {"name": "Matematika", "icon": "📐"},
        {"name": "Atrofimizdagi olam", "icon": "🌍"},
        {"name": "Ingliz tili", "icon": "🇬🇧"},
        {"name": "Tasviriy san'at", "icon": "🎨"},
        {"name": "Musiqa", "icon": "🎵"},
        {"name": "Texnologiya", "icon": "🔧"},
    ],
    range(5, 10): [
        {"name": "O'zbek tili", "icon": "📝"},
        {"name": "Matematika", "icon": "📐"},
        {"name": "Ingliz tili", "icon": "🇬🇧"},
        {"name": "Biologiya", "icon": "🧬"},
        {"name": "Geografiya", "icon": "🗺️"},
        {"name": "Tarix", "icon": "🏛️"},
        {"name": "Fizika", "icon": "⚡"},
        {"name": "Kimyo", "icon": "🧪"},
        {"name": "Informatika", "icon": "💻"},
    ],
    range(10, 12): [
        {"name": "O'zbek tili", "icon": "📝"},
        {"name": "Algebra va Analiz", "icon": "📐"},
        {"name": "Geometriya", "icon": "📏"},
        {"name": "Ingliz tili", "icon": "🇬🇧"},
        {"name": "Fizika", "icon": "⚡"},
        {"name": "Kimyo", "icon": "🧪"},
        {"name": "Biologiya", "icon": "🧬"},
        {"name": "Informatika", "icon": "💻"},
        {"name": "Iqtisodiyot", "icon": "💰"},
    ],
}


def get_default_subjects(grade: int) -> list[dict]:
    for grade_range, subjects in DEFAULT_SUBJECTS.items():
        if grade in grade_range:
            return subjects
    return []


@router.get("/subjects")
async def get_subjects(grade: int = Query(..., ge=1, le=11), db: Session = Depends(get_db)):
    subjects = db.query(Subject).filter(Subject.grade == grade).all()

    if not subjects:
        # Auto-seed from defaults
        defaults = get_default_subjects(grade)
        seeded = []
        for s in defaults:
            obj = Subject(grade=grade, name=s["name"], icon=s["icon"])
            db.add(obj)
            seeded.append(obj)
        db.commit()
        for obj in seeded:
            db.refresh(obj)
        subjects = seeded

    return [
        {"id": s.id, "name": s.name, "icon": s.icon or "📚", "grade": s.grade}
        for s in subjects
    ]
