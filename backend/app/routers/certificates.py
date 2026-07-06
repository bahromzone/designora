"""Certificates Router — sertifikat berish, tekshirish, yuklab olish (BOSQICH 3).

Prefix: /api/certificates

Sertifikat sharti: kurs progressi 100% VA kursning barcha faol quizlaridan
o'tilgan bo'lishi kerak. Sertifikat PDF + noyob tekshirish kodi bilan beriladi.
"""

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.Course import Course
from app.models.certificate import Certificate
from app.models.enrollment import Enrollment
from app.models.quiz import Quiz, QuizAttempt
from app.models.user import User
from app.services import certificate_service
from app.services.gamification_service import award_badge

router = APIRouter(prefix="/api/certificates", tags=["Certificates"])


def _now():
    return datetime.now(UTC)


def _get_user(db: Session, email: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Avtorizatsiya talab etiladi")
    return user


def _active_quiz_ids(db: Session, course_id: int) -> list[int]:
    return [
        qid
        for (qid,) in db.query(Quiz.id)
        .filter(Quiz.course_id == course_id, Quiz.is_active == True)  # noqa: E712
        .all()
    ]


def _all_quizzes_passed(db: Session, user: User, course_id: int) -> bool:
    for qid in _active_quiz_ids(db, course_id):
        passed = (
            db.query(QuizAttempt)
            .filter(
                QuizAttempt.quiz_id == qid,
                QuizAttempt.user_id == user.id,
                QuizAttempt.passed == True,  # noqa: E712
            )
            .first()
        )
        if not passed:
            return False
    return True


def _compute_grade(db: Session, user: User, course_id: int) -> str:
    quiz_ids = _active_quiz_ids(db, course_id)
    if not quiz_ids:
        return "Bitirildi"
    best_scores = []
    for qid in quiz_ids:
        top = (
            db.query(func.max(QuizAttempt.score))
            .filter(QuizAttempt.quiz_id == qid, QuizAttempt.user_id == user.id)
            .scalar()
        )
        best_scores.append(top or 0)
    avg = sum(best_scores) / len(best_scores)
    if avg >= 90:
        return "A'lo"
    if avg >= 75:
        return "Yaxshi"
    if avg >= 60:
        return "Qoniqarli"
    return "Bitirildi"


def _certificate_dict(c: Certificate, course_title: str | None = None) -> dict:
    return {
        "id": c.id,
        "course_id": c.course_id,
        "title": c.title or course_title,
        "serial": c.serial,
        "verification_code": c.verification_code,
        "pdf_url": c.pdf_url,
        "grade": c.grade,
        "issued_at": c.issued_at.isoformat() if c.issued_at else None,
    }


# ==========================================================
# TALABA — SERTIFIKAT OLISH
# ==========================================================
@router.post("/courses/{course_id}/issue", status_code=201)
def issue_certificate(
    course_id: int,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _get_user(db, email)
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Kurs topilmadi")

    enrollment = (
        db.query(Enrollment)
        .filter(Enrollment.user_id == user.id, Enrollment.course_id == course_id)
        .first()
    )
    if not enrollment:
        raise HTTPException(status_code=403, detail="Siz bu kursga yozilmagansiz")

    # ── Shart: 100% progress + barcha quizlardan o'tish ──
    if (enrollment.progress_percent or 0) < 100:
        raise HTTPException(
            status_code=400,
            detail="Sertifikat uchun kursni 100% tugatishingiz kerak",
        )
    if not _all_quizzes_passed(db, user, course_id):
        raise HTTPException(
            status_code=400,
            detail="Avval kursning barcha testlaridan o'ting",
        )

    existing = (
        db.query(Certificate)
        .filter(Certificate.user_id == user.id, Certificate.course_id == course_id)
        .first()
    )
    if existing:
        return _certificate_dict(existing, course.title)

    code = certificate_service.generate_verification_code()
    serial = certificate_service.generate_serial()
    grade = _compute_grade(db, user, course_id)
    issued = _now()
    verify_url = f"{settings.FRONTEND_URL.rstrip('/')}/verify/{code}"

    pdf_url = None
    try:
        pdf_url = certificate_service.generate_certificate_pdf(
            verification_code=code,
            serial=serial,
            student_name=user.name or user.email,
            course_title=course.title,
            issued_at=issued,
            grade=grade,
            verify_url=verify_url,
        )
    except RuntimeError:
        # reportlab yo'q — PDF'siz, lekin verifikatsiya qilinadigan sertifikat
        pdf_url = None

    cert = Certificate(
        user_id=user.id,
        course_id=course_id,
        title=f"{course.title} — sertifikat",
        serial=serial,
        verification_code=code,
        pdf_url=pdf_url,
        grade=grade,
        issued_at=issued,
    )
    db.add(cert)
    db.flush()

    # Gamifikatsiya
    award_badge(db, user, "course_completed")
    award_badge(db, user, "certified")

    db.commit()
    db.refresh(cert)
    return _certificate_dict(cert, course.title)


@router.get("/my")
def my_certificates(
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _get_user(db, email)
    rows = (
        db.query(Certificate, Course)
        .outerjoin(Course, Certificate.course_id == Course.id)
        .filter(Certificate.user_id == user.id)
        .order_by(Certificate.issued_at.desc())
        .all()
    )
    return [
        _certificate_dict(c, course.title if course else None) for c, course in rows
    ]


@router.get("/{certificate_id}/download")
def download_certificate(
    certificate_id: int,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _get_user(db, email)
    cert = (
        db.query(Certificate)
        .filter(Certificate.id == certificate_id, Certificate.user_id == user.id)
        .first()
    )
    if not cert:
        raise HTTPException(status_code=404, detail="Sertifikat topilmadi")
    if not cert.pdf_url:
        raise HTTPException(status_code=404, detail="PDF hali tayyor emas")
    return {"pdf_url": cert.pdf_url}


# ==========================================================
# OMMAVIY — TEKSHIRISH (autentifikatsiyasiz)
# ==========================================================
@router.get("/verify/{verification_code}")
def verify_certificate(
    verification_code: str,
    db: Session = Depends(get_db),
):
    cert = (
        db.query(Certificate)
        .filter(Certificate.verification_code == verification_code)
        .first()
    )
    if not cert:
        return {"valid": False, "detail": "Sertifikat topilmadi"}

    user = db.query(User).filter(User.id == cert.user_id).first()
    course = db.query(Course).filter(Course.id == cert.course_id).first()
    return {
        "valid": True,
        "serial": cert.serial,
        "student_name": (user.name or user.email) if user else None,
        "course_title": course.title if course else cert.title,
        "grade": cert.grade,
        "issued_at": cert.issued_at.isoformat() if cert.issued_at else None,
    }
