"""Portfolio builder and public portfolio endpoints."""

import json
import re
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, StringConstraints
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


def _list(value: str | None) -> list[str]:
    try:
        parsed = json.loads(value or "[]")
        return parsed if isinstance(parsed, list) else []
    except (TypeError, json.JSONDecodeError):
        return []


def _slug(text: str) -> str:
    value = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return value or "loyiha"


def _unique_slug(db: Session, title: str, project_id: int | None = None) -> str:
    base = _slug(title)
    candidate = base
    number = 1
    while True:
        query = db.query(PortfolioProject).filter(PortfolioProject.slug == candidate)
        if project_id:
            query = query.filter(PortfolioProject.id != project_id)
        if not query.first():
            return candidate
        number += 1
        candidate = f"{base}-{number}"


def _payload(project: PortfolioProject) -> dict:
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


class ProjectPatch(BaseModel):
    title: Annotated[str, StringConstraints(min_length=2, max_length=180)] | None = None
    summary: Annotated[str, StringConstraints(max_length=500)] | None = None
    story: Annotated[str, StringConstraints(max_length=8000)] | None = None
    cover_url: Annotated[str, StringConstraints(max_length=500)] | None = None
    project_url: Annotated[str, StringConstraints(max_length=500)] | None = None
    skills: list[Annotated[str, StringConstraints(max_length=40)]] | None = None
    tools: list[Annotated[str, StringConstraints(max_length=40)]] | None = None
    is_public: bool | None = None
    position: int | None = None


@router.get("/me")
def my_projects(
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _user(db, email)
    rows = (
        db.query(PortfolioProject)
        .filter(PortfolioProject.user_id == user.id)
        .order_by(PortfolioProject.position.asc(), PortfolioProject.updated_at.desc())
        .all()
    )
    return {"user_id": user.id, "name": user.name, "projects": [_payload(row) for row in rows]}


@router.post("/from-submission/{submission_id}", status_code=201)
def from_submission(
    submission_id: int,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _user(db, email)
    submission = (
        db.query(AssignmentSubmission)
        .filter(
            AssignmentSubmission.id == submission_id,
            AssignmentSubmission.user_id == user.id,
        )
        .first()
    )
    if not submission:
        raise HTTPException(status_code=404, detail="Topshiriq javobi topilmadi")
    if submission.status != "graded":
        raise HTTPException(status_code=409, detail="Faqat baholangan ish portfolio'ga qo'shiladi")

    existing = (
        db.query(PortfolioProject)
        .filter(PortfolioProject.submission_id == submission.id)
        .first()
    )
    if existing:
        return _payload(existing)

    assignment = db.query(Assignment).filter(Assignment.id == submission.assignment_id).first()
    title = assignment.title if assignment else "Design loyihasi"
    count = db.query(PortfolioProject).filter(PortfolioProject.user_id == user.id).count()
    project = PortfolioProject(
        user_id=user.id,
        submission_id=submission.id,
        title=title,
        slug=_unique_slug(db, f"{user.id}-{title}"),
        summary=(submission.content or "")[:500] or None,
        story=submission.content,
        project_url=submission.file_url,
        skills="[]",
        tools="[]",
        is_public=False,
        position=count,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return _payload(project)


@router.patch("/{project_id}")
def update_project(
    project_id: int,
    data: ProjectPatch,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _user(db, email)
    project = (
        db.query(PortfolioProject)
        .filter(PortfolioProject.id == project_id, PortfolioProject.user_id == user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Loyiha topilmadi")

    fields = data.model_dump(exclude_unset=True)
    if "title" in fields:
        project.slug = _unique_slug(db, f"{user.id}-{fields['title']}", project.id)
    for field, value in fields.items():
        if field in {"skills", "tools"}:
            value = json.dumps(list(dict.fromkeys(value))[:12], ensure_ascii=False)
        setattr(project, field, value)
    db.commit()
    db.refresh(project)
    return _payload(project)


@router.delete("/{project_id}")
def delete_project(
    project_id: int,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _user(db, email)
    project = (
        db.query(PortfolioProject)
        .filter(PortfolioProject.id == project_id, PortfolioProject.user_id == user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Loyiha topilmadi")
    db.delete(project)
    db.commit()
    return {"message": "Loyiha o'chirildi", "id": project_id}


@router.get("/public/{user_id}")
def public_portfolio(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=404, detail="Portfolio topilmadi")
    rows = (
        db.query(PortfolioProject)
        .filter(
            PortfolioProject.user_id == user.id,
            PortfolioProject.is_public == True,
        )
        .order_by(PortfolioProject.position.asc(), PortfolioProject.updated_at.desc())
        .all()
    )
    return {
        "user": {
            "id": user.id,
            "name": user.name,
            "bio": getattr(user, "bio", None),
            "location": getattr(user, "location", None),
            "website": getattr(user, "website", None),
            "avatar_url": getattr(user, "avatar_url", None),
        },
        "projects": [_payload(row) for row in rows],
    }
