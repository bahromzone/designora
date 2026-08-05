from concurrent.futures import ThreadPoolExecutor
from threading import Barrier

import pytest
from sqlalchemy.exc import IntegrityError

from app.models.Course import Course
from app.models.assignment import Assignment
from app.models.assignment_submission import AssignmentSubmission
from app.models.order import Order
from app.models.user import User

from conftest import IS_SQLITE, TestingSessionLocal


pytestmark = pytest.mark.skipif(
    IS_SQLITE,
    reason="Concurrent transaction checks require PostgreSQL connections",
)


def _create_assignment(db_session):
    user = User(email="concurrency@example.com", name="Concurrency Learner")
    course = Course(title="Concurrency course", is_active=True, status="published")
    db_session.add_all([user, course])
    db_session.commit()
    assignment = Assignment(
        user_id=user.id,
        course_id=course.id,
        title="Submit once",
    )
    db_session.add(assignment)
    db_session.commit()
    return user.id, assignment.id


def test_concurrent_assignment_submissions_keep_one_row(db_session):
    user_id, assignment_id = _create_assignment(db_session)
    barrier = Barrier(2)

    def submit_once():
        session = TestingSessionLocal()
        try:
            barrier.wait(timeout=5)
            session.add(
                AssignmentSubmission(
                    assignment_id=assignment_id,
                    user_id=user_id,
                    content="same submission",
                )
            )
            session.commit()
            return "created"
        except IntegrityError:
            session.rollback()
            return "duplicate"
        finally:
            session.close()

    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(lambda _: submit_once(), range(2)))

    assert sorted(results) == ["created", "duplicate"]
    assert (
        db_session.query(AssignmentSubmission)
        .filter_by(assignment_id=assignment_id, user_id=user_id)
        .count()
        == 1
    )


def test_concurrent_provider_callbacks_keep_one_order(db_session):
    user = User(email="payment-concurrency@example.com", name="Payment Learner")
    db_session.add(user)
    db_session.commit()
    barrier = Barrier(2)

    def persist_callback():
        session = TestingSessionLocal()
        try:
            barrier.wait(timeout=5)
            session.add(
                Order(
                    user_id=user.id,
                    amount=100,
                    provider="payme",
                    provider_transaction_id="payme-txn-concurrent",
                )
            )
            session.commit()
            return "created"
        except IntegrityError:
            session.rollback()
            return "duplicate"
        finally:
            session.close()

    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(lambda _: persist_callback(), range(2)))

    assert sorted(results) == ["created", "duplicate"]
    assert (
        db_session.query(Order)
        .filter_by(provider_transaction_id="payme-txn-concurrent")
        .count()
        == 1
    )
