"""Yengil, bog'liqliksiz Prometheus-uslubidagi metrikalar reestri (BOSQICH 5).

Tashqi kutubxonasiz — hisoblagichlar va oddiy histogramma (sum/count).
Prodakshnda `prometheus_client` bilan almashtirilishi mumkin, lekin bu variant
CI'da hech qanday qo'shimcha paketsiz ishlaydi va to'liq unit-test qilinadi.
"""

from __future__ import annotations

import threading

_lock = threading.Lock()
_counters: dict[tuple[str, tuple[tuple[str, str], ...]], float] = {}
_hist_sum: dict[str, float] = {}
_hist_count: dict[str, int] = {}


def inc_counter(name: str, value: float = 1.0, **labels: str) -> None:
    """Nomlangan hisoblagichni (ixtiyoriy label'lar bilan) oshiradi."""
    key = (name, tuple(sorted(labels.items())))
    with _lock:
        _counters[key] = _counters.get(key, 0.0) + value


def observe(name: str, value: float) -> None:
    """Histogramma kuzatuvi — yig'indi va sonni saqlaydi."""
    with _lock:
        _hist_sum[name] = _hist_sum.get(name, 0.0) + value
        _hist_count[name] = _hist_count.get(name, 0) + 1


def reset() -> None:
    """Barcha metrikalarni tozalaydi (asosan testlar uchun)."""
    with _lock:
        _counters.clear()
        _hist_sum.clear()
        _hist_count.clear()


def render() -> str:
    """Prometheus text-exposition formatida qaytaradi."""
    lines: list[str] = []
    with _lock:
        for (name, labels), val in sorted(_counters.items(), key=lambda x: x[0][0]):
            if labels:
                lab = ",".join(f'{k}="{v}"' for k, v in labels)
                lines.append(f"{name}{{{lab}}} {val}")
            else:
                lines.append(f"{name} {val}")
        for name in sorted(_hist_sum):
            lines.append(f"{name}_sum {_hist_sum[name]}")
            lines.append(f"{name}_count {_hist_count[name]}")
    return "\n".join(lines) + "\n"
