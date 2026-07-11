# ruff: noqa: E501
from app.core.security import create_access_token
from app.models.Course import Course
from app.models.enrollment import Enrollment
from app.models.monetization import CourseBundle, SubscriptionPlan
from app.models.user import User


def h(email): return {"Authorization":f"Bearer {create_access_token(email)}"}
def user(db,email,role="user"):
 row=User(email=email,name=email.split("@")[0],role=role);db.add(row);db.commit();db.refresh(row);return row

def test_bundle_subscription_team_and_aid(client,db_session):
 admin=user(db_session,"admin323@example.com","admin");buyer=user(db_session,"buyer323@example.com");member=user(db_session,"member323@example.com")
 c1=Course(title="One",price=100,is_active=True);c2=Course(title="Two",price=200,is_active=True);db_session.add_all([c1,c2]);db_session.commit()
 created=client.post("/api/monetization/bundles",headers=h(admin.email),json={"title":"Design pack","slug":"design-pack","course_ids":[c1.id,c2.id],"price":250,"is_active":True})
 assert created.status_code==201
 activated=client.post(f"/api/monetization/bundles/{created.json()['id']}/activate",headers=h(buyer.email));assert activated.status_code==200;assert db_session.query(Enrollment).filter_by(user_id=buyer.id).count()==2
 plan=client.post("/api/monetization/plans",headers=h(admin.email),json={"name":"Monthly","code":"MONTHLY","monthly_price":99000,"course_ids":[c1.id],"is_active":False});assert plan.status_code==201
 assert client.post(f"/api/monetization/plans/{plan.json()['id']}/subscribe",headers=h(buyer.email)).status_code==409
 team=client.post("/api/monetization/teams",headers=h(buyer.email),json={"company_name":"Acme","course_ids":[c1.id],"seats":1});invite=client.post(f"/api/monetization/teams/{team.json()['id']}/members",headers=h(buyer.email),json={"email":member.email});assert invite.json()["status"]=="active";assert db_session.query(Enrollment).filter_by(user_id=member.id,course_id=c1.id).count()==1
 aid=client.post("/api/monetization/aid",headers=h(buyer.email),json={"course_id":c1.id,"aid_type":"scholarship","reason":"I need financial support to continue learning design."});assert aid.status_code==201
 decision=client.patch(f"/api/monetization/aid/{aid.json()['id']}",headers=h(admin.email),json={"status":"approved","note":"Approved"});assert decision.json()["status"]=="approved"
