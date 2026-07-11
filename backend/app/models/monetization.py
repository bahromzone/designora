from datetime import UTC, datetime

from sqlalchemy import JSON, Boolean, Column, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint

from app.core.database import Base


def _now():
    return datetime.now(UTC)


class CourseBundle(Base):
    __tablename__ = "course_bundles"
    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    course_ids = Column(JSON, nullable=False, default=list)
    price = Column(Integer, nullable=False, default=0)
    is_active = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=_now)


class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    code = Column(String, unique=True, index=True, nullable=False)
    monthly_price = Column(Integer, nullable=False)
    course_ids = Column(JSON, nullable=True)
    is_active = Column(Boolean, default=False)
    readiness_note = Column(Text, nullable=True)


class Subscription(Base):
    __tablename__ = "subscriptions"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    plan_id = Column(Integer, ForeignKey("subscription_plans.id", ondelete="RESTRICT"), nullable=False)
    status = Column(String, default="active")
    current_period_end = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=_now)


class TeamLicense(Base):
    __tablename__ = "team_licenses"
    id = Column(Integer, primary_key=True)
    company_name = Column(String, nullable=False)
    owner_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    course_ids = Column(JSON, nullable=False, default=list)
    seats = Column(Integer, nullable=False, default=1)
    used_seats = Column(Integer, nullable=False, default=0)
    status = Column(String, default="pending")
    created_at = Column(DateTime(timezone=True), default=_now)


class TeamLicenseMember(Base):
    __tablename__ = "team_license_members"
    __table_args__ = (UniqueConstraint("license_id", "email", name="uq_team_license_member_email"),)
    id = Column(Integer, primary_key=True)
    license_id = Column(Integer, ForeignKey("team_licenses.id", ondelete="CASCADE"), nullable=False)
    email = Column(String, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status = Column(String, default="invited")


class FinancialAidApplication(Base):
    __tablename__ = "financial_aid_applications"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    aid_type = Column(String, nullable=False)
    reason = Column(Text, nullable=False)
    requested_installments = Column(Integer, nullable=True)
    status = Column(String, default="pending")
    decision_note = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=_now)
