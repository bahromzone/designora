"""Analitika agregatsiyasi — sof funksiyalar, DB'siz (ANALITIKA bloki).

Har bir funksiya oddiy dict/son ro'yxatlarini oladi va agregat qaytaradi.
Shu sabab DB'siz mustaqil unit-test qilinadi; routerlar DB'dan o'qib shu
yerga uzatadi.
"""

from __future__ import annotations


def revenue_summary(orders: list[dict]) -> dict:
    """To'langan buyurtmalardan umumiy daromad statistikasi.

    orders: [{"amount": int, "discount_amount": int, "status": str}]
    Faqat status == "paid" hisobga olinadi.
    """
    paid = [o for o in orders if o.get("status") == "paid"]
    gross = sum(int(o.get("amount") or 0) for o in paid)
    discounts = sum(int(o.get("discount_amount") or 0) for o in paid)
    count = len(paid)
    aov = round(gross / count, 2) if count else 0.0
    return {
        "gross_revenue": gross,
        "net_revenue": gross - discounts,
        "discounts": discounts,
        "paid_orders": count,
        "average_order_value": aov,
    }


def completion_rate(progress_percents: list[int]) -> float:
    """Kursni tugatganlar ulushi (100%) — foizda."""
    if not progress_percents:
        return 0.0
    completed = sum(1 for p in progress_percents if (p or 0) >= 100)
    return round(completed / len(progress_percents) * 100, 1)


def average_progress(progress_percents: list[int]) -> float:
    """O'rtacha tugatilganlik foizi."""
    if not progress_percents:
        return 0.0
    return round(sum((p or 0) for p in progress_percents) / len(progress_percents), 1)


def funnel(counts: dict) -> list[dict]:
    """Konversiya voronkasi — har bosqichdan keyingisiga o'tish foizi.

    counts: tartiblangan dict, masalan {"view": 1000, "enroll": 200, "paid": 120}
    """
    steps = list(counts.items())
    out = []
    first = steps[0][1] if steps else 0
    prev = None
    for name, value in steps:
        from_prev = round(value / prev * 100, 1) if prev else 100.0
        from_top = round(value / first * 100, 1) if first else 0.0
        out.append(
            {
                "step": name,
                "count": value,
                "pct_from_prev": from_prev,
                "pct_from_top": from_top,
            }
        )
        prev = value
    return out


def group_events_by_name(events: list[dict]) -> dict[str, int]:
    """Hodisalarni nom bo'yicha sanaydi."""
    out: dict[str, int] = {}
    for e in events:
        name = e.get("name")
        if not name:
            continue
        out[name] = out.get(name, 0) + 1
    return out


def top_n(items: list[dict], key: str, n: int = 5) -> list[dict]:
    """Berilgan kalit bo'yicha eng yuqori n ta element."""
    return sorted(items, key=lambda x: (x.get(key) or 0), reverse=True)[:n]
