from sqlalchemy import Column, Integer, BigInteger, String, Text, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(BigInteger, unique=True, nullable=True, index=True)
    username = Column(String(50), unique=True, nullable=True, index=True)
    password_hash = Column(String(128), nullable=True)
    name = Column(String(100))
    role = Column(String(20), default="student")  # student | parent | teacher | admin
    phone = Column(String(20), nullable=True)
    email = Column(String(100), nullable=True, index=True)
    viloyat = Column(String(100), nullable=True)
    tuman = Column(String(100), nullable=True)
    jins = Column(String(20), nullable=True)
    otp_code = Column(String(6), nullable=True)
    otp_expires = Column(DateTime, nullable=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    students = relationship("Student", back_populates="user", foreign_keys="Student.user_id")
    teacher = relationship("Teacher", back_populates="user", uselist=False)


class Student(Base):
    __tablename__ = "students"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    parent_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    name = Column(String(100))
    grade = Column(Integer, nullable=False)

    user = relationship("User", back_populates="students", foreign_keys=[user_id])
    sessions = relationship("ChatSession", back_populates="student")
    test_results = relationship("TestResult", back_populates="student")


class Teacher(Base):
    __tablename__ = "teachers"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    fanlar = Column(Text, nullable=True)   # JSON: ["Matematika", "Fizika"]
    sinflar = Column(Text, nullable=True)  # JSON: [5, 6, 7]
    tajriba = Column(String(50), nullable=True)
    profile_complete = Column(Boolean, default=False)

    user = relationship("User", back_populates="teacher")


class Subject(Base):
    __tablename__ = "subjects"
    id = Column(Integer, primary_key=True, index=True)
    grade = Column(Integer, nullable=False)
    name = Column(String(100), nullable=False)
    name_uz = Column(String(100))
    icon = Column(String(50))

    textbooks = relationship("Textbook", back_populates="subject")
    sessions = relationship("ChatSession", back_populates="subject")


class Textbook(Base):
    __tablename__ = "textbooks"
    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    grade = Column(Integer, nullable=False)
    page_number = Column(Integer)
    content = Column(Text, nullable=False)
    chapter = Column(String(200))

    subject = relationship("Subject", back_populates="textbooks")


class ChatSession(Base):
    __tablename__ = "chat_sessions"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    duration_minutes = Column(Integer, default=0)

    student = relationship("Student", back_populates="sessions")
    subject = relationship("Subject", back_populates="sessions")
    messages = relationship("Message", back_populates="session")


class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"))
    role = Column(String(10))  # user | assistant
    content = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    session = relationship("ChatSession", back_populates="messages")


class TestResult(Base):
    __tablename__ = "test_results"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    score = Column(Integer)
    total = Column(Integer, default=5)
    taken_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("Student", back_populates="test_results")
