from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models import Student, Subject, ChatSession, Message
from services.ai_service import get_ai_response
from services.textbook import search_textbook
import random

router = APIRouter()


class ChatRequest(BaseModel):
    student_id: int | None = None
    grade: int
    subject: str
    subject_id: int | None = None
    question: str
    history: list[dict] = []


class TestStartRequest(BaseModel):
    student_id: int | None = None
    subject_id: int | None = None
    grade: int
    subject: str


class TestAnswerRequest(BaseModel):
    test_id: int
    question_index: int
    answer: int


# In-memory test cache (use Redis in production)
_test_cache: dict[int, dict] = {}


@router.post("/chat")
async def chat(body: ChatRequest, db: Session = Depends(get_db)):
    grade = body.grade
    subject = body.subject
    question = body.question

    # Get student name
    name = "O'quvchi"
    if body.student_id:
        student = db.query(Student).filter(Student.id == body.student_id).first()
        if student:
            name = student.name or name

    # Search relevant textbook content
    textbook_context = ""
    if body.subject_id:
        textbook_context = search_textbook(db, grade, body.subject_id, question)

    # Get AI response
    answer = get_ai_response(
        name=name,
        grade=grade,
        subject=subject,
        question=question,
        history=body.history,
        textbook_context=textbook_context,
    )

    # Save to DB if we have a session
    if body.student_id and body.subject_id:
        session = (
            db.query(ChatSession)
            .filter(
                ChatSession.student_id == body.student_id,
                ChatSession.subject_id == body.subject_id,
            )
            .order_by(ChatSession.started_at.desc())
            .first()
        )
        if not session:
            session = ChatSession(student_id=body.student_id, subject_id=body.subject_id)
            db.add(session)
            db.commit()
            db.refresh(session)

        db.add(Message(session_id=session.id, role="user", content=question))
        db.add(Message(session_id=session.id, role="assistant", content=answer))
        db.commit()

    return {"answer": answer}


@router.post("/test/start")
async def start_test(body: TestStartRequest, db: Session = Depends(get_db)):
    from services.ai_service import generate_test
    test_data = generate_test(grade=body.grade, subject=body.subject)
    test_id = random.randint(10000, 99999)
    _test_cache[test_id] = {
        "student_id": body.student_id,
        "subject_id": body.subject_id,
        "grade": body.grade,
        "subject": body.subject,
        "questions": test_data["questions"],
    }
    return {"test_id": test_id, "questions": test_data["questions"]}


@router.post("/test/answer")
async def submit_answer(body: TestAnswerRequest, db: Session = Depends(get_db)):
    test = _test_cache.get(body.test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Test topilmadi")

    q = test["questions"][body.question_index]
    is_correct = q["correct"] == body.answer
    is_last = body.question_index == len(test["questions"]) - 1

    result = {"correct": is_correct, "is_last": is_last}

    if is_last and test.get("student_id") and test.get("subject_id"):
        score = sum(
            1 for i, q in enumerate(test["questions"])
            if test.get(f"ans_{i}") == q["correct"]
        )
        from models import TestResult
        db.add(TestResult(
            student_id=test["student_id"],
            subject_id=test["subject_id"],
            score=score,
            total=len(test["questions"]),
        ))
        db.commit()
        result["final_score"] = score
        result["total"] = len(test["questions"])
        del _test_cache[body.test_id]
    else:
        test[f"ans_{body.question_index}"] = body.answer

    return result
