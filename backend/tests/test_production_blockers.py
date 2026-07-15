from app.core.security import create_access_token
from app.models.Course import Course
from app.models.enrollment import Enrollment
from app.models.progress import Progress
from app.models.quiz import Quiz
from app.models.review import Review
from app.models.user import User


def headers(email): return {"Authorization": f"Bearer {create_access_token(email)}"}


def test_legacy_progress_never_issues_certificate_without_quizzes(client, db_session):
    user=User(email="cert-guard@example.com",name="Guard",role="user");course=Course(title="Guard course",is_active=True);db_session.add_all([user,course]);db_session.commit();db_session.add(Quiz(course_id=course.id,title="Required",is_active=True));db_session.commit()
    response=client.patch(f"/api/profile/progress/{course.id}",headers=headers(user.email),json={"percent":100,"minutes_spent":5})
    assert response.status_code==200 and response.json()["certificate_issued"] is False
    assert user.certificates.count()==0


def test_onboarding_persists_and_drives_recommendations(client, db_session):
    user=User(email="profile@example.com",name="Profile",role="user");course=Course(title="UI UX starter",category="UI/UX dizayn",level="beginner",language="uz",is_active=True);db_session.add_all([user,course]);db_session.commit()
    saved=client.put("/api/onboarding",headers=headers(user.email),json={"goal":"career","interests":["UI/UX dizayn"],"level":"beginner","weekly_hours":4,"preferred_language":"uz","reminder_time":"19:00","completed":True})
    assert saved.status_code==200 and saved.json()["completed"] is True
    recs=client.get("/api/onboarding/recommendations",headers=headers(user.email));assert recs.status_code==200 and recs.json()[0]["id"]==course.id


def test_review_report_enters_unified_queue(client, db_session):
    admin=User(email="queue-admin@example.com",name="Admin",role="admin");reporter=User(email="queue-reporter@example.com",name="Reporter",role="user");author=User(email="queue-author@example.com",name="Author",role="user");course=Course(title="Queue",is_active=True);db_session.add_all([admin,reporter,author,course]);db_session.commit();review=Review(user_id=author.id,course_id=course.id,rating=1,comment="spam");db_session.add(review);db_session.commit()
    assert client.post(f"/api/reviews/{review.id}/report",headers=headers(reporter.email),json={"reason":"Repeated spam"}).status_code==201
    queue=client.get("/api/moderation/queue",headers=headers(admin.email)).json();assert queue["total"]==1 and queue["results"][0]["content_type"]=="review"
