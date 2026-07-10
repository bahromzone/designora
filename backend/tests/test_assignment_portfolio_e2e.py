"""Critical journey: assignment submission -> mentor grade -> public portfolio."""

from app.core.security import create_access_token
from app.models.Course import Course
from app.models.assignment import Assignment
from app.models.assignment_submission import AssignmentSubmission
from app.models.enrollment import Enrollment
from app.models.portfolio_project import PortfolioProject
from app.models.user import User


def _headers(email: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {create_access_token(email)}"}


def _user(db, email: str, role: str = "user") -> User:
    user = User(email=email, name=email.split("@")[0], role=role, is_active=True)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _assignment_fixture(db_session):
    instructor = _user(db_session, "mentor@example.com", "instructor")
    student = _user(db_session, "student@example.com")
    course = Course(
        title="Brand identity",
        instructor_id=instructor.id,
        is_active=True,
        status="published",
    )
    db_session.add(course)
    db_session.commit()
    db_session.refresh(course)
    db_session.add(Enrollment(user_id=student.id, course_id=course.id))
    assignment = Assignment(
        user_id=instructor.id,
        course_id=course.id,
        title="Coffee brand identity",
        description="Logo va visual system yarating",
        max_score=100,
    )
    db_session.add(assignment)
    db_session.commit()
    db_session.refresh(assignment)
    return instructor, student, assignment


def test_assignment_feedback_to_public_portfolio(client, db_session):
    instructor, student, assignment = _assignment_fixture(db_session)
    student_headers = _headers(student.email)
    mentor_headers = _headers(instructor.email)

    submitted = client.post(
        f"/api/assignments/{assignment.id}/submit",
        headers=student_headers,
        json={
            "content": "Research, sketches and final identity system.",
            "file_url": "https://example.com/case-study",
        },
    )
    assert submitted.status_code == 200
    submission_id = submitted.json()["id"]

    queue = client.get(
        f"/api/assignments/{assignment.id}/submissions",
        headers=mentor_headers,
    )
    assert queue.status_code == 200
    assert queue.json()[0]["id"] == submission_id

    graded = client.post(
        f"/api/assignments/submissions/{submission_id}/grade",
        headers=mentor_headers,
        json={"grade": 92, "feedback": "Strong concept and consistent system."},
    )
    assert graded.status_code == 200
    assert graded.json()["grade"] == 92

    eligible = client.get("/api/portfolio/eligible", headers=student_headers)
    assert eligible.status_code == 200
    assert eligible.json()[0]["submission_id"] == submission_id
    assert eligible.json()[0]["available"] is True

    imported = client.post(
        f"/api/portfolio/from-submission/{submission_id}",
        headers=student_headers,
    )
    assert imported.status_code == 201
    project_id = imported.json()["id"]
    assert imported.json()["title"] == assignment.title
    assert imported.json()["is_public"] is False

    duplicate = client.post(
        f"/api/portfolio/from-submission/{submission_id}",
        headers=student_headers,
    )
    assert duplicate.status_code == 201
    assert duplicate.json()["id"] == project_id
    assert db_session.query(PortfolioProject).count() == 1

    published = client.patch(
        f"/api/portfolio/{project_id}",
        headers=student_headers,
        json={
            "is_public": True,
            "summary": "A complete identity system for a local coffee brand.",
            "skills": ["Branding", "Art direction"],
            "tools": ["Figma"],
        },
    )
    assert published.status_code == 200
    assert published.json()["is_public"] is True

    public = client.get(f"/api/portfolio/public/{student.id}")
    assert public.status_code == 200
    assert public.json()["projects"][0]["id"] == project_id
    assert public.json()["projects"][0]["skills"] == [
        "Branding",
        "Art direction",
    ]


def test_ungraded_submission_cannot_be_imported(client, db_session):
    _, student, assignment = _assignment_fixture(db_session)
    submission = AssignmentSubmission(
        assignment_id=assignment.id,
        user_id=student.id,
        content="Draft case study",
        status="submitted",
    )
    db_session.add(submission)
    db_session.commit()
    db_session.refresh(submission)

    response = client.post(
        f"/api/portfolio/from-submission/{submission.id}",
        headers=_headers(student.email),
    )
    assert response.status_code == 409
    assert db_session.query(PortfolioProject).count() == 0


def test_student_cannot_import_another_students_work(client, db_session):
    _, owner, assignment = _assignment_fixture(db_session)
    stranger = _user(db_session, "stranger@example.com")
    submission = AssignmentSubmission(
        assignment_id=assignment.id,
        user_id=owner.id,
        content="Completed identity",
        status="graded",
        grade=95,
    )
    db_session.add(submission)
    db_session.commit()
    db_session.refresh(submission)

    response = client.post(
        f"/api/portfolio/from-submission/{submission.id}",
        headers=_headers(stranger.email),
    )
    assert response.status_code == 409
    assert db_session.query(PortfolioProject).count() == 0
