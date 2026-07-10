import json
import re
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.assignment import Assignment
from app.models.assignment_submission import AssignmentSubmission
from app.models.portfolio_project import PortfolioProject
from app.models.user import User

router = APIRouter(prefix="/api/portfolio", tags=["Portfolio"])


def _user(db: Session, email: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Avtorizatsiya talab etiladi")
    return user


def _slug(text: str) -> str:
    value = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return value or "project"


def _unique_slug(
    db: Session,
    title: str,
    user_id: int,
    exclude: int | None = None,
) -> str:
    base = f"{_slug(title)}-{user_id}"
    candidate, index = base, 1
    while True:
        query = db.query(PortfolioProject).filter(PortfolioProject.slug == candidate)
        if exclude:
            query = query.filter(PortfolioProject.id != exclude)
        if not query.first():
            return candidate
        index += 1
        candidate = f"{base}-{index}"


def _loads(value: str | None) -> list[str]:
    try:
        result = json.loads(value or "[]")
        return result if isinstance(result, list) else []
    except (TypeError, json.JSONDecodeError):
        return []


def _dict(project: PortfolioProject) -> dict:
    return {
        "id": project.id,
        "user_id": project.user_id,
        "submission_id": project.submission_id,
        "title": project.title,
        "slug": project.slug,
        "summary": project.summary,
        "story": project.story,
        "cover_url": project.cover_url,
        "project_url": project.project_url,
        "skills": _loads(project.skills),
        "tools": _loads(project.tools),
        "is_public": project.is_public,
        "position": project.position,
        "created_at": project.created_at.isoformat() if project.created_at else None,
        "updated_at": project.updated_at.isoformat() if project.updated_at else None,
    }


class ProjectIn(BaseModel):
    submission_id: int | None = None
    title: str = Field(min_length=2, max_length=180)
    summary: str | None = Field(default=None, max_length=500)
    story: str | None = Field(default=None, max_length=8000)
    cover_url: str | None = Field(default=None, max_length=500)
    project_url: str | None = Field(default=None, max_length=500)
    skills: list[str] = Field(default_factory=list, max_length=12)
    tools: list[str] = Field(default_factory=list, max_length=12)
    is_public: bool = False


class ProjectPatch(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=180)
    summary: str | None = Field(default=None, max_length=500)
    story: str | None = Field(default=None, max_length=8000)
    cover_url: str | None = Field(default=None, max_length=500)
    project_url: str | None = Field(default=None, max_length=500)
    skills: list[str] | None = Field(default=None, max_length=12)
    tools: list[str] | None = Field(default=None, max_length=12)
    is_public: bool | None = None
    position: int | None = None


def _graded_submission(db: Session, submission_id: int, user_id: int):
    return (
        db.query(AssignmentSubmission)
        .filter(
            AssignmentSubmission.id == submission_id,
            AssignmentSubmission.user_id == user_id,
            AssignmentSubmission.status == "graded",
        )
        .first()
    )


def _create_from_submission(
    db: Session,
    user: User,
    submission: AssignmentSubmission,
) -> PortfolioProject:
    existing = (
        db.query(PortfolioProject)
        .filter(PortfolioProject.submission_id == submission.id)
        .first()
    )
    if existing:
        return existing
    assignment = (
        db.query(Assignment)
        .filter(Assignment.id == submission.assignment_id)
        .first()
    )
    title = assignment.title if assignment and assignment.title else "Design loyihasi"
    project = PortfolioProject(
        user_id=user.id,
        submission_id=submission.id,
        title=title,
        slug=_unique_slug(db, title, user.id),
        summary=(submission.content or "")[:500] or None,
        story=submission.content,
        project_url=submission.file_url,
        skills="[]",
        tools="[]",
        is_public=False,
        position=(
            db.query(PortfolioProject)
            .filter(PortfolioProject.user_id == user.id)
            .count()
        ),
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.get("/eligible")
def eligible(
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _user(db, email)
    rows = (
        db.query(AssignmentSubmission, Assignment)
        .join(Assignment, AssignmentSubmission.assignment_id == Assignment.id)
        .filter(
            AssignmentSubmission.user_id == user.id,
            AssignmentSubmission.status == "graded",
        )
        .order_by(AssignmentSubmission.graded_at.desc())
        .all()
    )
    used = {
        value[0]
        for value in db.query(PortfolioProject.submission_id)
        .filter(
            PortfolioProject.user_id == user.id,
            PortfolioProject.submission_id.isnot(None),
        )
        .all()
    }
    return [
        {
            "submission_id": submission.id,
            "assignment_id": assignment.id,
            "title": assignment.title,
            "description": assignment.description,
            "file_url": submission.file_url,
            "content": submission.content,
            "grade": submission.grade,
            "max_score": assignment.max_score or 100,
            "feedback": submission.feedback,
            "available": submission.id not in used,
        }
        for submission, assignment in rows
    ]


@router.get("/mine")
def mine(
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _user(db, email)
    rows = (
        db.query(PortfolioProject)
        .filter(PortfolioProject.user_id == user.id)
        .order_by(PortfolioProject.position.asc(), PortfolioProject.created_at.desc())
        .all()
    )
    return [_dict(row) for row in rows]


@router.get("/me")
def me(
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _user(db, email)
    return {"user_id": user.id, "name": user.name, "projects": mine(email, db)}


@router.post("/from-submission/{submission_id}", status_code=201)
def from_submission(
    submission_id: int,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _user(db, email)
    submission = _graded_submission(db, submission_id, user.id)
    if not submission:
        raise HTTPException(
            status_code=409,
            detail="Faqat baholangan o'z ishingizni portfolio'ga qo'sha olasiz",
        )
    return _dict(_create_from_submission(db, user, submission))


@router.post("", status_code=201)
def create(
    data: ProjectIn,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _user(db, email)
    if data.submission_id:
        submission = _graded_submission(db, data.submission_id, user.id)
        if not submission:
            raise HTTPException(
                status_code=400,
                detail="Faqat baholangan o'z ishingizni portfolio'ga qo'sha olasiz",
            )
        if (
            db.query(PortfolioProject)
            .filter(PortfolioProject.submission_id == submission.id)
            .first()
        ):
            raise HTTPException(status_code=409, detail="Bu ish portfolio'ga qo'shilgan")
    project = PortfolioProject(
        user_id=user.id,
        submission_id=data.submission_id,
        title=data.title.strip(),
        slug=_unique_slug(db, data.title, user.id),
        summary=data.summary,
        story=data.story,
        cover_url=data.cover_url,
        project_url=data.project_url,
        skills=json.dumps(data.skills[:12], ensure_ascii=False),
        tools=json.dumps(data.tools[:12], ensure_ascii=False),
        is_public=data.is_public,
        position=(
            db.query(PortfolioProject)
            .filter(PortfolioProject.user_id == user.id)
            .count()
        ),
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return _dict(project)


@router.patch("/{project_id}")
def update(
    project_id: int,
    data: ProjectPatch,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _user(db, email)
    project = (
        db.query(PortfolioProject)
        .filter(
            PortfolioProject.id == project_id,
            PortfolioProject.user_id == user.id,
        )
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Loyiha topilmadi")
    fields = data.model_dump(exclude_unset=True)
    if fields.get("title"):
        fields["title"] = fields["title"].strip()
        project.slug = _unique_slug(db, fields["title"], user.id, project.id)
    for key in ("skills", "tools"):
        if key in fields:
            fields[key] = json.dumps(fields[key][:12], ensure_ascii=False)
    for key, value in fields.items():
        setattr(project, key, value)
    project.updated_at = datetime.now(UTC)
    db.commit()
    db.refresh(project)
    return _dict(project)


@router.delete("/{project_id}")
def remove(
    project_id: int,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _user(db, email)
    project = (
        db.query(PortfolioProject)
        .filter(
            PortfolioProject.id == project_id,
            PortfolioProject.user_id == user.id,
        )
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Loyiha topilmadi")
    db.delete(project)
    db.commit()
    return {"message": "Portfolio loyihasi o'chirildi"}


@router.get("/public/{user_id}")
def public_portfolio(user_id: int, db: Session = Depends(get_db)):
    user = (
        db.query(User)
        .filter(User.id == user_id, User.is_active == True)
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="Portfolio topilmadi")
    rows = (
        db.query(PortfolioProject)
        .filter(
            PortfolioProject.user_id == user.id,
            PortfolioProject.is_public == True,
        )
        .order_by(PortfolioProject.position.asc(), PortfolioProject.created_at.desc())
        .all()
    )
    owner = {
        "id": user.id,
        "name": user.name or "Designora student",
        "bio": getattr(user, "bio", None),
        "avatar_url": getattr(user, "avatar_url", None),
        "location": getattr(user, "location", None),
        "website": getattr(user, "website", None),
    }
    return {"owner": owner, "user": owner, "projects": [_dict(row) for row in rows]}
