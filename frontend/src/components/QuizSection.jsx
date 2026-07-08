import { useCallback, useEffect, useState } from "react";

import { quizApi } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Badge, Spinner } from "./ui";

// Variant qiymati/yorlig'ini turli backend shakllariga moslab olish.
function optValue(opt, i) {
  if (opt == null) return String(i);
  if (typeof opt === "string") return opt;
  return String(opt.id ?? opt.value ?? opt.key ?? i);
}
function optLabel(opt, i) {
  if (opt == null) return `Variant ${i + 1}`;
  if (typeof opt === "string") return opt;
  return opt.text ?? opt.label ?? opt.value ?? `Variant ${i + 1}`;
}

function QuizList({ quizzes, onStart }) {
  if (quizzes.length === 0) {
    return (
      <p className="text-sm text-muted">Bu kursda hozircha testlar yo'q.</p>
    );
  }
  return (
    <div className="space-y-3">
      {quizzes.map((quiz) => {
        const attemptsLeft =
          quiz.max_attempts == null
            ? null
            : Math.max(0, quiz.max_attempts - (quiz.attempts_used ?? 0));
        const noAttempts = attemptsLeft === 0;
        return (
          <div
            key={quiz.id}
            className="card flex items-center justify-between gap-4 rounded-2xl p-5"
          >
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-ink">{quiz.title}</h3>
                {quiz.passed ? (
                  <Badge tone="success">O'tilgan</Badge>
                ) : quiz.best_score != null ? (
                  <Badge tone="warning">{quiz.best_score}%</Badge>
                ) : null}
              </div>
              {quiz.description && (
                <p className="mt-1 text-sm text-muted">{quiz.description}</p>
              )}
              <p className="mt-1 text-xs text-muted">
                {quiz.questions_count} savol · o'tish uchun {quiz.passing_score}%
                {attemptsLeft != null && ` · ${attemptsLeft} urinish qoldi`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onStart(quiz)}
              disabled={noAttempts}
              className="btn-primary shrink-0 px-5 py-2 text-sm disabled:opacity-50"
            >
              {quiz.passed ? "Qayta yechish" : "Boshlash"}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function QuizTake({ quiz, onSubmit, onCancel, submitting }) {
  const [answers, setAnswers] = useState({});

  function setSingle(qId, value) {
    setAnswers((p) => ({ ...p, [qId]: [value] }));
  }
  function toggleMulti(qId, value) {
    setAnswers((p) => {
      const cur = new Set(p[qId] ?? []);
      cur.has(value) ? cur.delete(value) : cur.add(value);
      return { ...p, [qId]: [...cur] };
    });
  }

  const questions = quiz.questions ?? [];
  const allAnswered = questions.every((q) => (answers[q.id] ?? []).length > 0);

  return (
    <div className="card rounded-2xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-serif text-xl font-semibold text-ink">
          {quiz.title}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm font-semibold text-muted hover:text-ink"
        >
          ← Orqaga
        </button>
      </div>

      <div className="space-y-6">
        {questions.map((q, qi) => {
          const multiple = q.type === "multiple";
          const opts =
            (q.options && q.options.length
              ? q.options
              : q.type === "boolean"
                ? [
                    { value: "true", text: "To'g'ri" },
                    { value: "false", text: "Noto'g'ri" },
                  ]
                : []) || [];
          return (
            <div key={q.id}>
              <p className="font-semibold text-ink">
                {qi + 1}. {q.text}
                {multiple && (
                  <span className="ml-2 text-xs font-normal text-muted">
                    (bir nechta javob)
                  </span>
                )}
              </p>
              <div className="mt-3 space-y-2">
                {opts.map((opt, oi) => {
                  const val = optValue(opt, oi);
                  const checked = (answers[q.id] ?? []).includes(val);
                  return (
                    <label
                      key={val}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
                        checked
                          ? "border-violet-500 bg-violet-50"
                          : "border-border hover:border-violet-300"
                      }`}
                    >
                      <input
                        type={multiple ? "checkbox" : "radio"}
                        name={`q-${q.id}`}
                        checked={checked}
                        onChange={() =>
                          multiple
                            ? toggleMulti(q.id, val)
                            : setSingle(q.id, val)
                        }
                      />
                      <span className="text-ink">{optLabel(opt, oi)}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => onSubmit(answers)}
        disabled={submitting || !allAnswered}
        className="btn-primary mt-6 px-6 py-2.5 text-sm disabled:opacity-50"
      >
        {submitting ? "Tekshirilmoqda..." : "Yakunlash va tekshirish"}
      </button>
      {!allAnswered && (
        <p className="mt-2 text-xs text-muted">
          Barcha savollarga javob bering.
        </p>
      )}
    </div>
  );
}

function QuizResult({ quiz, result, onRetry, onBack }) {
  const perQuestion = result.per_question ?? [];
  return (
    <div className="card rounded-2xl p-6">
      <div className="text-center">
        <p className="text-sm text-muted">{quiz.title} — natija</p>
        <p
          className={`mt-2 font-serif text-5xl font-bold ${
            result.passed ? "text-emerald-600" : "text-rose-600"
          }`}
        >
          {result.score}%
        </p>
        <p className="mt-2">
          {result.passed ? (
            <Badge tone="success">O'tdingiz 🎉</Badge>
          ) : (
            <Badge tone="danger">O'tmadingiz</Badge>
          )}
        </p>
        {result.total_points != null && (
          <p className="mt-2 text-sm text-muted">
            {result.earned_points}/{result.total_points} ball · o'tish uchun{" "}
            {result.passing_score}%
          </p>
        )}
      </div>

      {perQuestion.length > 0 && (
        <div className="mt-6 space-y-3">
          {perQuestion.map((pq, i) => {
            const correct = pq.is_correct ?? pq.correct;
            return (
              <div
                key={pq.question_id ?? pq.id ?? i}
                className="rounded-xl border border-border p-4 text-sm"
              >
                <p className="font-semibold text-ink">
                  {correct ? "✅" : "❌"} {i + 1}-savol
                </p>
                {pq.explanation && (
                  <p className="mt-1 text-muted">{pq.explanation}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 flex gap-2">
        <button type="button" onClick={onRetry} className="btn-outline px-5 py-2 text-sm">
          Qayta urinish
        </button>
        <button type="button" onClick={onBack} className="btn-primary px-5 py-2 text-sm">
          Testlar ro'yxati
        </button>
      </div>
    </div>
  );
}

/**
 * Kurs testlari bloki: ro'yxat → yechish → natija.
 *
 * Props: courseId, isEnrolled
 */
export default function QuizSection({ courseId, isEnrolled }) {
  const { token, isAuthenticated } = useAuth();
  const toast = useToast();

  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list"); // list | take | result
  const [active, setActive] = useState(null); // yechilayotgan quiz (savollar bilan)
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!isAuthenticated || !isEnrolled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await quizApi.courseQuizzes(courseId, token);
      setQuizzes(Array.isArray(list) ? list : []);
    } catch {
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  }, [courseId, token, isAuthenticated, isEnrolled]);

  useEffect(() => {
    load();
  }, [load]);

  async function startQuiz(quiz) {
    try {
      const full = await quizApi.take(quiz.id, token);
      setActive(full);
      setResult(null);
      setView("take");
    } catch (err) {
      toast.error(err.message || "Testni ochib bo'lmadi.");
    }
  }

  async function submitQuiz(answers) {
    setSubmitting(true);
    try {
      const res = await quizApi.submit(active.id, answers, token);
      setResult(res);
      setView("result");
      toast[res.passed ? "success" : "info"](
        res.passed ? "Tabriklaymiz, o'tdingiz!" : "Yana urinib ko'ring."
      );
      load();
    } catch (err) {
      toast.error(err.message || "Javoblarni yuborib bo'lmadi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-16">
      <h2 className="font-serif text-2xl font-semibold text-ink">Testlar</h2>

      <div className="mt-6">
        {!isAuthenticated || !isEnrolled ? (
          <p className="card rounded-2xl p-5 text-sm text-muted">
            Testlarni yechish uchun avval kursga yozilishingiz kerak.
          </p>
        ) : loading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : view === "take" && active ? (
          <QuizTake
            quiz={active}
            onSubmit={submitQuiz}
            onCancel={() => setView("list")}
            submitting={submitting}
          />
        ) : view === "result" && result ? (
          <QuizResult
            quiz={active}
            result={result}
            onRetry={() => startQuiz(active)}
            onBack={() => setView("list")}
          />
        ) : (
          <QuizList quizzes={quizzes} onStart={startQuiz} />
        )}
      </div>
    </div>
  );
}
