from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import hashlib, hmac, os, json, random, string
from datetime import datetime, timedelta
from urllib.parse import unquote
from dotenv import load_dotenv

load_dotenv()

from database import get_db
from models import User, Student, Teacher

router = APIRouter()


# ── Pydantic schemas ─────────────────────────────────────────────────────────

class TelegramAuthRequest(BaseModel):
    init_data: str
    name: str | None = None
    grade: int | None = None


class RegisterRequest(BaseModel):
    role: str                        # student | parent | teacher
    name: str
    username: str
    password: str
    phone: str | None = None
    email: str | None = None
    viloyat: str | None = None
    tuman: str | None = None
    jins: str | None = None
    grade: int | None = None         # student only
    parent_username: str | None = None  # student: ota-ona username
    child_username: str | None = None   # parent: farzand username
    fanlar: list[str] = []           # teacher only
    sinflar: list[int] = []          # teacher only
    tajriba: str | None = None       # teacher only


class VerifyOtpRequest(BaseModel):
    user_id: int
    otp_code: str


class LoginRequest(BaseModel):
    username: str
    password: str


# ── Helpers ───────────────────────────────────────────────────────────────────

def _hash_pw(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def _generate_otp() -> str:
    return ''.join(random.choices(string.digits, k=6))


def verify_telegram_init_data(init_data: str) -> dict | None:
    bot_token = os.getenv("TELEGRAM_BOT_TOKEN", "")
    if not bot_token or not init_data:
        return None
    try:
        params = dict(pair.split("=", 1) for pair in init_data.split("&") if "=" in pair)
        received_hash = params.pop("hash", "")
        data_check = "\n".join(f"{k}={unquote(v)}" for k, v in sorted(params.items()))
        secret = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
        expected = hmac.new(secret, data_check.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, received_hash):
            return None
        user_raw = params.get("user", "{}")
        return json.loads(unquote(user_raw))
    except Exception:
        return None


def _user_response(user: User) -> dict:
    return {
        "user_id": user.id,
        "name": user.name,
        "username": user.username,
        "role": user.role,
        "email": user.email,
        "viloyat": user.viloyat,
        "tuman": user.tuman,
        "jins": user.jins,
        "phone": user.phone,
        "is_verified": user.is_verified,
    }


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/auth/register")
async def register(body: RegisterRequest, db: Session = Depends(get_db)):
    if body.role not in ("student", "parent", "teacher"):
        raise HTTPException(status_code=400, detail="Noto'g'ri rol")

    uname = body.username.lower().strip()
    if not uname or len(uname) < 3:
        raise HTTPException(status_code=400, detail="Username kamida 3 ta belgi")

    if db.query(User).filter(User.username == uname).first():
        raise HTTPException(status_code=400, detail="Bu username band. Boshqa username tanlang.")

    if len(body.password) < 6:
        raise HTTPException(status_code=400, detail="Parol kamida 6 ta belgi bo'lishi kerak")

    user = User(
        username=uname,
        password_hash=_hash_pw(body.password),
        name=body.name.strip(),
        role=body.role,
        phone=body.phone,
        email=body.email,
        viloyat=body.viloyat,
        tuman=body.tuman,
        jins=body.jins,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Role-specific records
    if body.role == "student":
        grade = body.grade or 7
        parent_id = None
        if body.parent_username:
            pu = body.parent_username.lower().replace("@", "")
            parent_user = db.query(User).filter(User.username == pu).first()
            if parent_user:
                parent_id = parent_user.id
        student = Student(user_id=user.id, name=user.name, grade=grade, parent_id=parent_id)
        db.add(student)
        db.commit()
        db.refresh(student)

    elif body.role == "teacher":
        teacher = Teacher(
            user_id=user.id,
            fanlar=json.dumps(body.fanlar, ensure_ascii=False),
            sinflar=json.dumps(body.sinflar),
            tajriba=body.tajriba,
            profile_complete=False,
        )
        db.add(teacher)
        db.commit()

    elif body.role == "parent":
        # Try to link child if provided
        if body.child_username:
            cu = body.child_username.lower().replace("@", "")
            child_user = db.query(User).filter(User.username == cu).first()
            if child_user:
                child_student = db.query(Student).filter(Student.user_id == child_user.id).first()
                if child_student and not child_student.parent_id:
                    child_student.parent_id = user.id
                    db.commit()

        # Generate OTP for email verification
        if body.email:
            otp = _generate_otp()
            user.otp_code = otp
            user.otp_expires = datetime.utcnow() + timedelta(minutes=10)
            db.commit()

            is_dev = os.getenv("DEV_MODE", "false").lower() == "true"
            if is_dev:
                print(f"\n📧 OTP [{body.email}]: {otp}\n")
                # Return OTP in dev mode so frontend can test without real email
                resp = _user_response(user)
                resp["_dev_otp"] = otp
                return resp

    return _user_response(user)


@router.post("/auth/verify-otp")
async def verify_otp(body: VerifyOtpRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == body.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi")

    is_dev = os.getenv("DEV_MODE", "false").lower() == "true"

    # Dev: accept "000000" as universal code
    if is_dev and body.otp_code == "000000":
        user.is_verified = True
        user.otp_code = None
        user.otp_expires = None
        db.commit()
        return _user_response(user)

    if not user.otp_code:
        raise HTTPException(status_code=400, detail="Tasdiqlash kodi yuborilmagan")

    if user.otp_expires and datetime.utcnow() > user.otp_expires:
        raise HTTPException(status_code=400, detail="Tasdiqlash kodining muddati tugadi. Qayta yuboring.")

    if user.otp_code != body.otp_code.strip():
        raise HTTPException(status_code=400, detail="Kod noto'g'ri. Qayta tekshiring.")

    user.is_verified = True
    user.otp_code = None
    user.otp_expires = None
    db.commit()
    return _user_response(user)


@router.post("/auth/resend-otp")
async def resend_otp(body: dict, db: Session = Depends(get_db)):
    user_id = body.get("user_id")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.email:
        raise HTTPException(status_code=404, detail="Foydalanuvchi yoki email topilmadi")

    otp = _generate_otp()
    user.otp_code = otp
    user.otp_expires = datetime.utcnow() + timedelta(minutes=10)
    db.commit()

    is_dev = os.getenv("DEV_MODE", "false").lower() == "true"
    if is_dev:
        print(f"\n📧 RESEND OTP [{user.email}]: {otp}\n")
        return {"message": "Kod qayta yuborildi", "_dev_otp": otp}

    return {"message": "Kod qayta yuborildi"}


@router.post("/auth/login")
async def login(body: LoginRequest, db: Session = Depends(get_db)):
    uname = body.username.lower().strip()
    user = db.query(User).filter(User.username == uname).first()

    if not user or not user.password_hash:
        raise HTTPException(status_code=401, detail="Foydalanuvchi topilmadi yoki parol noto'g'ri")

    if user.password_hash != _hash_pw(body.password):
        raise HTTPException(status_code=401, detail="Foydalanuvchi topilmadi yoki parol noto'g'ri")

    return _user_response(user)


@router.get("/auth/me/{user_id}")
async def get_me(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi")
    return _user_response(user)


# ── Legacy: Telegram WebApp auth ─────────────────────────────────────────────

@router.post("/auth/telegram")
async def auth_telegram(body: TelegramAuthRequest, db: Session = Depends(get_db)):
    user_data = verify_telegram_init_data(body.init_data)
    is_dev = os.getenv("DEV_MODE", "false").lower() == "true"

    if not user_data and not is_dev:
        raise HTTPException(status_code=401, detail="Invalid Telegram auth")

    if not user_data:
        user_data = {"id": 0, "first_name": "Test", "last_name": "User"}

    telegram_id = user_data.get("id", 0)
    name = (user_data.get("first_name", "") + " " + user_data.get("last_name", "")).strip()

    user = db.query(User).filter(User.telegram_id == telegram_id).first()
    if not user:
        user = User(telegram_id=telegram_id, name=name, role="student")
        db.add(user)
        db.commit()
        db.refresh(user)

    student = None
    if body.grade:
        student = db.query(Student).filter(Student.user_id == user.id).first()
        if not student:
            student = Student(user_id=user.id, name=body.name or name, grade=body.grade)
            db.add(student)
        else:
            if body.grade:
                student.grade = body.grade
            if body.name:
                student.name = body.name
        db.commit()
        db.refresh(student)

    return {
        "user_id": user.id,
        "student_id": student.id if student else None,
        "name": user.name,
        "role": user.role,
    }
