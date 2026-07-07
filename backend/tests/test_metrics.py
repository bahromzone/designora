"""Metrikalar reestri birlik testlari (BOSQICH 5) — DB'siz."""

from app.core import metrics


def test_counter_increments():
    metrics.reset()
    metrics.inc_counter("jobs_total")
    metrics.inc_counter("jobs_total")
    out = metrics.render()
    assert "jobs_total 2.0" in out


def test_counter_with_labels():
    metrics.reset()
    metrics.inc_counter("http_requests_total", method="GET", status="200")
    out = metrics.render()
    assert 'http_requests_total{method="GET",status="200"} 1.0' in out


def test_observe_sum_and_count():
    metrics.reset()
    metrics.observe("latency", 0.5)
    metrics.observe("latency", 1.5)
    out = metrics.render()
    assert "latency_sum 2.0" in out
    assert "latency_count 2" in out


def test_reset_clears():
    metrics.inc_counter("x")
    metrics.reset()
    assert metrics.render() == "\n"
