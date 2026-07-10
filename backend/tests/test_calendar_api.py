# ruff: noqa: I001,E702
# fmt: off
from datetime import UTC, datetime
from app.core.security import create_access_token
from app.models.assignment import Assignment
from app.models.Course import Course
from app.models.enrollment import Enrollment
from app.models.user import User
def _headers(email): return {"Authorization":f"Bearer {create_access_token(email)}"}
def test_calendar_combines_deadlines_custom_events_and_timezone(client,db_session):
 user=User(email="calendar@example.com",name="Calendar",is_active=True);course=Course(title="Calendar course",is_active=True);db_session.add_all([user,course]);db_session.commit();db_session.add(Enrollment(user_id=user.id,course_id=course.id));db_session.add(Assignment(user_id=user.id,course_id=course.id,title="Final brief",due_date=datetime(2026,7,13,9,tzinfo=UTC)));db_session.commit()
 created=client.post("/api/calendar/events",headers=_headers(user.email),json={"title":"Live critique","event_type":"live_session","starts_at":"2026-07-13T11:00:00Z","ends_at":"2026-07-13T12:00:00Z"});assert created.status_code==201
 response=client.get("/api/calendar/events",headers=_headers(user.email),params={"start":"2026-07-13T00:00:00Z","end":"2026-07-14T00:00:00Z","timezone":"Asia/Tashkent"});assert response.status_code==200;assert {row["event_type"] for row in response.json()}=={"assignment","live_session"};assert response.json()[0]["starts_at"].endswith("+05:00")
def test_calendar_validates_timezone_and_ownership(client,db_session):
 user=User(email="owner@example.com",name="Owner",is_active=True);other=User(email="other@example.com",name="Other",is_active=True);db_session.add_all([user,other]);db_session.commit();bad=client.get("/api/calendar/events",headers=_headers(user.email),params={"start":"2026-07-01T00:00:00Z","end":"2026-08-01T00:00:00Z","timezone":"Mars/Olympus"});assert bad.status_code==400
 created=client.post("/api/calendar/events",headers=_headers(user.email),json={"title":"Review","event_type":"instructor_review","starts_at":"2026-07-15T08:00:00Z"});forbidden=client.delete(f"/api/calendar/events/{created.json()['id']}",headers=_headers(other.email));assert forbidden.status_code==404
# fmt: on
