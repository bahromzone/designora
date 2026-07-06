"""Quiz avtomatik baholash mantiqi (BOSQICH 3).

Sof funksiyalar — DB'siz, mustaqil unit-test qilinadi.
"""

from __future__ import annotations

from typing import Any


def normalize(value: Any) -> set[str]:
    """Javobni taqqoslash uchun string'lar to'plamiga keltiradi."""
    if value is None:
        return set()
    if isinstance(value, list | tuple | set):
        return {str(v).strip() for v in value if str(v).strip() != ""}
    text = str(value).strip()
    return {text} if text else set()


def grade_question(correct_answers: Any, submitted: Any) -> bool:
    """To'g'ri javoblar to'plami yuborilgan javoblar bilan aynan mos kelsa True.

    single / boolean / multiple — barchasi uchun ishlaydi, chunki to'plam
    tengligini tekshiramiz (tartib ahamiyatsiz).
    """
    return normalize(correct_answers) == normalize(submitted)


def grade_submission(questions: list[dict], answers: dict) -> dict:
    """Quizni avtomatik baholaydi.

    questions: [{"id", "correct_answers", "points"}]
    answers:   {"<question_id>": ["a", "c"], ...}

    Returns: earned_points, total_points, score (0–100), per_question map.
    """
    earned = 0
    total = 0
    per_question: dict[str, bool] = {}
    answers = answers or {}
    for q in questions:
        qid = str(q["id"])
        pts = int(q.get("points") or 1)
        total += pts
        is_correct = grade_question(q.get("correct_answers"), answers.get(qid))
        if is_correct:
            earned += pts
        per_question[qid] = is_correct
    score = round((earned / total) * 100, 2) if total else 0.0
    return {
        "earned_points": earned,
        "total_points": total,
        "score": score,
        "per_question": per_question,
    }
