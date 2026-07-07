"""Analitika agregatsiyasi birlik testlari (ANALITIKA) — DB'siz."""

from app.services.analytics_service import (
    average_progress,
    completion_rate,
    funnel,
    group_events_by_name,
    revenue_summary,
    top_n,
)


def test_revenue_summary_only_paid():
    orders = [
        {"amount": 100000, "discount_amount": 0, "status": "paid"},
        {"amount": 50000, "discount_amount": 5000, "status": "paid"},
        {"amount": 999999, "discount_amount": 0, "status": "pending"},
    ]
    r = revenue_summary(orders)
    assert r["gross_revenue"] == 150000
    assert r["net_revenue"] == 145000
    assert r["discounts"] == 5000
    assert r["paid_orders"] == 2
    assert r["average_order_value"] == 75000.0


def test_revenue_summary_empty():
    r = revenue_summary([])
    assert r["gross_revenue"] == 0
    assert r["paid_orders"] == 0
    assert r["average_order_value"] == 0.0


def test_completion_rate():
    assert completion_rate([100, 100, 50, 0]) == 50.0
    assert completion_rate([]) == 0.0
    assert completion_rate([100, 100]) == 100.0


def test_average_progress():
    assert average_progress([100, 50, 0]) == 50.0
    assert average_progress([]) == 0.0


def test_funnel():
    steps = funnel({"view": 1000, "enroll": 200, "paid": 100})
    assert steps[0]["count"] == 1000
    assert steps[0]["pct_from_top"] == 100.0
    assert steps[1]["pct_from_prev"] == 20.0
    assert steps[1]["pct_from_top"] == 20.0
    assert steps[2]["pct_from_prev"] == 50.0
    assert steps[2]["pct_from_top"] == 10.0


def test_group_events_by_name():
    events = [{"name": "view"}, {"name": "view"}, {"name": "click"}]
    assert group_events_by_name(events) == {"view": 2, "click": 1}


def test_top_n():
    items = [
        {"id": 1, "rev": 100},
        {"id": 2, "rev": 500},
        {"id": 3, "rev": 300},
    ]
    top = top_n(items, "rev", 2)
    assert [x["id"] for x in top] == [2, 3]
