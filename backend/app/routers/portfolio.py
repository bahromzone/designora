"""Portfolio builder and public portfolio API."""

from __future__ import annotations

import json
import re
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.assignment import Assignment
from app.models.assignment_submission import AssignmentSubmission
from app.models.portfolio_project import PortfolioProject
from app.models.user import User

router = APIRouter(prefix="/api/portfolio", tags=["Portfolio"])


def _now():
    return datetime.now(UTC)


def _user(db: Session, email: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Avtorizatsiya talab etiladi")
    return user


def _slugify(value: str) -> str:
    value = value.lower().strip()
    value = re.sub(r"[^a-z0-9\s-]", "", value)
    value = re.sub(r"[\s_-]+", "-", value).strip("-") or "loyiha"
    return value


def _unique_slug(db: Session, title: str, exclude_id: int | None = None) -> str:
    base = _slugify(title)
    slug = base
    suffix = 1
    while True:
        query = db.query(PortfolioProject).filter(PortfolioProject.slug == slug)
        if exclude_id:
            query = query.filter(PortfolioProject.id != exclude_id)
        if not query.first():
            return slug
        suffix += 1
        slug = f"{base}-{suffix}"


def _list(value: str | None) -> list[str]:
    try:
        parsed = json.loads(value or "[]")
        return parsed if isinstance(parsed, list) else []
    except (TypeError, json.JSONDecodeError):
        return []


def _project(project: PortfolioProject) -> dict:
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
        "skills": _list(project.skills),
        "tools": _list(project.tools),
        "is_public": project.is_public,
        "position": project.position,
        "created_at": project.created_at.isoformat() if project.created_at else None,
        "updated_at": project.updated_at.isoformat() if project.updated_at else None,
    }


class ProjectCreate(BaseModel):
    submission_id: int
    title: str | None = Field(default=None, max_length=180)


class ProjectUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=180)
    summary: str | None = Field(default=None, max_length=600)
    story: str | None = Field(default=None, max_length=10000)
    cover_url: str | None = Field(default=None, max_length=500)
    project_url: str | None = Field(default=None, max_length=500)
    skills: list[str] | None = None
    tools: list[str] | None = None
    is_public: bool | None = None


class ReorderRequest(BaseModel):
    project_ids: list[int]


@router.get("/eligible")
def eligible_submissions(
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _user(db, email)
    rows = (
        db.query(AssignmentSubmission, Assignment)
        .join(Assignment, AssignmentSubmission.assignment_id == Assignment.id)
        .outerjoin(
            PortfolioProject,
            PortfolioProject.submission_id == AssignmentSubmission.id,
        )
        .filter(
            AssignmentSubmission.user_id == user.id,
            AssignmentSubmission.status == "graded",
            PortfolioProject.id.is_(None),
        )
        .order_by(AssignmentSubmission.graded_at.desc())
        .all()
    )
    return [
        {
            "submission_id": submission.id,
            "assignment_id": assignment.id,
            "course_id": assignment.course_id,
            "title": assignment.title or "Kurs loyihasi",
            "description": assignment.description,
            "file_url": submission.file_url,
            "content": submission.content,
            "grade": submission.grade,
            "feedback": submission.feedback,
            "graded_at": (
                submission.graded_at.isoformat() if submission.graded_at else None
            ),
        }
        for submission, assignment in rows
    ]


@router.get("/me")
def my_portfolio(
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _user(db, email)
    projects = (
        db.query(PortfolioProject)
        .filter(PortfolioProject.user_id == user.id)
        .order_by(PortfolioProject.position.asc(), PortfolioProject.id.desc())
        .all()
    )
    return {
        "owner": {"id": user.id, "name": user.name, "bio": user.bio, "avatar_url": user.avatar_url},
        "public_url": f"/portfolio/u/{user.id}",
        "projects": [_project(item) for item in projects],
    }


@router.post("", status_code=201)
def create_project(
    data: ProjectCreate,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _user(db, email)
    submission = (
        db.query(AssignmentSubmission)
        .filter(
            AssignmentSubmission.id == data.submission_id,
            AssignmentSubmission.user_id == user.id,
        )
        .first()
    )
    if not submission or submission.status != "graded":
        raise HTTPException(status_code=400, detail="Faqat baholangan ish portfolio'ga qo'shiladi")
    if db.query(PortfolioProject).filter(PortfolioProject.submission_id == submission.id).first():
        raise HTTPException(status_code=409, detail="Bu ish portfolio'da mavjud")
    assignment = db.query(Assignment).filter(Assignment.id == submission.assignment_id).first()
    title = (data.title or (assignment.title if assignment else None) or "Kurs loyihasi").strip()
    position = db.query(func.max(PortfolioProject.position)).filter(PortfolioProject.user_id == user.id).scalar()
    project = PortfolioProject(
        user_id=user.id,
        submission_id=submission.id,
        title=title,
        slug=_unique_slug(db, title),
        summary=(submission.content or "")[:600] or None,
        project_url=submission.file_url,
        skills="[]",
        tools="[]",
        position=(position or 0) + 1,
        is_public=False,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return _project(project)


@router.patch("/{project_id}")
def update_project(
    project_id: int,
    data: ProjectUpdate,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _user(db, email)
    project = db.query(PortfolioProject).filter(PortfolioProject.id == project_id, PortfolioProject.user_id == user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Loyiha topilmadi")
    fields = data.model_dump(exclude_unset=True)
    if "title" in fields:
        project.title = fields.pop("title").strip()
        project.slug = _unique_slug(db, project.title, project.id)
    for key in ("skills", "tools"):
        if key in fields:
            fields[key] = json.dumps([str(item).strip() for item in fields[key] if str(item).strip()][:12], ensure_ascii=False)
    for key, value in fields.items():
        setattr(project, key, value)
    project.updated_at = _now()
    db.commit()
    db.refresh(project)
    return _project(project)


@router.post("/reorder")
def reorder_projects(
    data: ReorderRequest,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _user(db, email)
    projects = db.query(PortfolioProject).filter(PortfolioProject.user_id == user.id).all()
    owned = {item.id: item for item in projects}
    if set(data.project_ids) != set(owned):
        raise HTTPException(status_code=400, detail="Loyiha tartibi noto'g'ri")
    for position, project_id in enumerate(data.project_ids):
        owned[project_id].position = position
    db.commit()
    return {"message": "Tartib saqlandi"}


@router.delete("/{project_id}")
def delete_project(
    project_id: int,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _user(db, email)
    project = db.query(PortfolioProject).filter(PortfolioProject.id == project_id, PortfolioProject.user_id == user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Loyiha topilmadi")
    db.delete(project)
    db.commit()
    return {"message": "Loyiha o'chirildi"}


@router.get("/public/{user_id}")
def public_portfolio(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()  # noqa: E712
    if not user:
        raise HTTPException(status_code=404, detail="Portfolio topilmadi")
    projects = (
        db.query(PortfolioProject)
        .filter(PortfolioProject.user_id == user.id, PortfolioProject.is_public == True)  # noqa: E712
        .order_by(PortfolioProject.position.asc(), PortfolioProject.id.desc())
        .all()
    )
    return {
        "owner": {"id": user.id, "name": user.name, "bio": user.bio, "avatar_url": user.avatar_url, "location": user.location, "website": user.website},
        "projects": [_project(item) for item in projects],
    }


@router.get("/project/{slug}")
def public_project(slug: str, db: Session = Depends(get_db)):
    project = db.query(PortfolioProject).filter(PortfolioProject.slug == slug, PortfolioProject.is_public == True).first()  # noqa: E712
    if not project:
        raise HTTPException(status_code=404, detail="Loyiha topilmadi")
    owner = db.query(User).filter(User.id == project.user_id).first()
    return {"owner": {"id": owner.id, "name": owner.name, "bio": owner.bio, "avatar_url": owner.avatar_url}, "project": _project(project)}
