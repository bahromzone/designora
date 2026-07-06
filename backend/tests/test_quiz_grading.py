"""Quiz avtomatik baholash birlik testlari (BOSQICH 3) — DB'siz sof funksiyalar."""

from app.services.quiz_service import grade_question, grade_submission, normalize


def test_normalize_handles_scalar_and_list():
    assert normalize("a") == {"a"}
    assert normalize(["a", "b"]) == {"a", "b"}
    assert normalize(None) == set()
    assert normalize(["a", "", " "]) == {"a"}


def test_grade_question_single_and_multiple():
    assert grade_question(["a"], ["a"]) is True
    assert grade_question(["a"], ["b"]) is False
    # ko'p tanlov — tartib ahamiyatsiz
    assert grade_question(["a", "c"], ["c", "a"]) is True
    # to'liq bo'lmagan tanlov — noto'g'ri
    assert grade_question(["a", "c"], ["a"]) is False


def test_grade_question_boolean():
    assert grade_question(["true"], "true") is True
    assert grade_question(["false"], ["true"]) is False


def test_grade_submission_scoring():
    questions = [
        {"id": 1, "correct_answers": ["a"], "points": 1},
        {"id": 2, "correct_answers": ["b", "c"], "points": 2},
        {"id": 3, "correct_answers": ["true"], "points": 1},
    ]
    answers = {"1": ["a"], "2": ["b", "c"], "3": ["false"]}
    result = grade_submission(questions, answers)
    assert result["earned_points"] == 3
    assert result["total_points"] == 4
    assert result["score"] == 75.0
    assert result["per_question"] == {"1": True, "2": True, "3": False}


def test_grade_submission_empty_answers():
    questions = [{"id": 1, "correct_answers": ["a"], "points": 1}]
    result = grade_submission(questions, {})
    assert result["score"] == 0.0
    assert result["earned_points"] == 0


def test_grade_submission_perfect():
    questions = [
        {"id": 1, "correct_answers": ["a"], "points": 1},
        {"id": 2, "correct_answers": ["b"], "points": 1},
    ]
    result = grade_submission(questions, {"1": ["a"], "2": ["b"]})
    assert result["score"] == 100.0
