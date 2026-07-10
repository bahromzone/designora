from app.core.security import create_access_token
from app.models.assignment import Assignment
from app.models.assignment_submission import AssignmentSubmission
from app.models.Course import Course
from app.models.user import User


def _headers(email):
    return {"Authorization": f"Bearer {create_access_token(email)}"}


def test_structured_review_round_trip(client, db_session):
    instructor = User(
        email="reviewer@example.com",
        name="Reviewer",
        role="instructor",
        is_active=True,
    )
    student = User(email="learner@example.com", name="Learner", is_active=True)
    db_session.add_all([instructor, student])
    db_session.commit()
    course = Course(
        title="UI review",
        instructor_id=instructor.id,
        is_active=True,
        status="published",
    )
    db_session.add(course)
    db_session.commit()
    assignment = Assignment(
        user_id=instructor.id,
        course_id=course.id,
        title="Landing page",
        max_score=100,
    )
    db_session.add(assignment)
    db_session.commit()
    submission = AssignmentSubmission(
        assignment_id=assignment.id,
        user_id=student.id,
        file_url="https://example.com/mockup.png",
        status="submitted",
    )
    db_session.add(submission)
    db_session.commit()

    response = client.post(
        f"/api/assignments/submissions/{submission.id}/grade",
        headers=_headers(instructor.email),
        json={
            "grade": 84,
            "feedback": "Hierarchy needs one more pass.",
            "decision": "rework",
            "annotations": [
                {"x": 24.5, "y": 41, "note": "Increase contrast", "color": "#ef4444"}
            ],
            "video_feedback": [
                {"seconds": 73, "note": "Navigation transition starts here"}
            ],
        },
    )
    assert response.status_code == 200
    assert response.json()["review"]["decision"] == "rework"

    queue = client.get(
        f"/api/assignments/{assignment.id}/submissions",
        headers=_headers(instructor.email),
    )
    assert queue.status_code == 200
    review = queue.json()[0]["review"]
    assert review["annotations"][0]["x"] == 24.5
    assert review["video_feedback"][0]["seconds"] == 73
    assert queue.json()[0]["feedback"] == "Hierarchy needs one more pass."


def test_structured_review_validates_coordinates(client, db_session):
    instructor = User(
        email="reviewer2@example.com",
        name="Reviewer",
        role="instructor",
        is_active=True,
    )
    db_session.add(instructor)
    db_session.commit()
    response = client.post(
        "/api/assignments/submissions/999/grade",
        headers=_headers(instructor.email),
        json={
            "grade": 10,
            "annotations": [{"x": 101, "y": 20, "note": "outside"}],
        },
    )
    assert response.status_code == 422
