import { useCallback, useEffect, useState } from "react";
import { useToast } from "../context/ToastContext";
import { quizBuilderApi } from "../lib/quizBuilderApi";
import "./QuizBuilder.css";

const createDefaultQuestionPayload = () => ({
  text: "Yangi savol",
  type: "single",
  options: [
    { id: "a", text: "1-variant" },
    { id: "b", text: "2-variant" },
  ],
  correct_answers: ["a"],
  points: 1,
  explanation: "",
});

function QuizForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(
    initial || {
      title: "",
      description: "",
      passing_score: 70,
      max_attempts: "",
      time_limit_minutes: "",
    }
  );
  const set = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));
  return (
    <form
      className="mt-5 grid gap-4 rounded-2xl border border-border bg-surface p-5"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({
          ...form,
          title: form.title.trim(),
          description: form.description.trim() || null,
          passing_score: Number(form.passing_score),
          max_attempts:
            form.max_attempts === "" ? null : Number(form.max_attempts),
          time_limit_minutes:
            form.time_limit_minutes === ""
              ? null
              : Number(form.time_limit_minutes),
        });
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1 text-sm font-semibold text-ink md:col-span-2">
          Test nomi
          <input
            required
            minLength={2}
            maxLength={200}
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            className="input"
            placeholder="Masalan: Ranglar nazariyasi"
          />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-ink md:col-span-2">
          Qisqa tavsif
          <textarea
            value={form.description || ""}
            onChange={(e) => set("description", e.target.value)}
            className="input min-h-20"
            placeholder="Talaba bu testda nimani tekshiradi?"
          />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-ink">
          O‘tish bali, foiz
          <input
            required
            type="number"
            min="0"
            max="100"
            value={form.passing_score}
            onChange={(e) => set("passing_score", e.target.value)}
            className="input"
          />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-ink">
          Maksimal urinish
          <input
            type="number"
            min="1"
            value={form.max_attempts ?? ""}
            onChange={(e) => set("max_attempts", e.target.value)}
            className="input"
            placeholder="Cheksiz"
          />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-ink">
          Vaqt limiti, daqiqa
          <input
            type="number"
            min="1"
            value={form.time_limit_minutes ?? ""}
            onChange={(e) => set("time_limit_minutes", e.target.value)}
            className="input"
            placeholder="Ixtiyoriy"
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          disabled={saving}
          className="btn-primary px-4 py-2 text-sm"
          type="submit"
        >
          {saving ? "Saqlanmoqda..." : "Testni saqlash"}
        </button>
        {onCancel && (
          <button
            className="btn-outline px-4 py-2 text-sm"
            type="button"
            onClick={onCancel}
          >
            Bekor qilish
          </button>
        )}
      </div>
    </form>
  );
}

function QuestionEditor({ question, index, onSave, onDelete }) {
  const [form, setForm] = useState({
    ...question,
    correct_answers: question.correct_answers || [],
    options: question.options?.length
      ? question.options
      : [
          { id: "a", text: "" },
          { id: "b", text: "" },
        ],
  });
  const set = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));
  const isBoolean = form.type === "boolean";
  const isMultiple = form.type === "multiple";
  const options = isBoolean
    ? [
        { id: "true", text: "To‘g‘ri" },
        { id: "false", text: "Noto‘g‘ri" },
      ]
    : form.options;
  const toggleCorrect = (id) =>
    set(
      "correct_answers",
      form.correct_answers.includes(id)
        ? form.correct_answers.filter((item) => item !== id)
        : isMultiple
          ? [...form.correct_answers, id]
          : [id]
    );
  return (
    <article className="rounded-2xl border border-border bg-canvas p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-muted">
            Savol {index + 1}
          </span>
          <h3 className="mt-1 font-semibold text-ink">Savol va javoblar</h3>
        </div>
        <button
          className="text-sm font-semibold text-rose-600"
          type="button"
          onClick={onDelete}
        >
          O‘chirish
        </button>
      </div>
      <div className="mt-4 grid gap-3">
        <textarea
          required
          value={form.text}
          onChange={(e) => set("text", e.target.value)}
          className="input min-h-20"
          placeholder="Savol matni"
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="grid gap-1 text-sm font-semibold text-ink">
            Turi
            <select
              value={form.type}
              onChange={(e) => {
                const nextType = e.target.value;
                set("type", nextType);
                if (nextType === "boolean") {
                  set("correct_answers", ["true"]);
                } else if (
                  !form.correct_answers.length &&
                  form.options?.length
                ) {
                  set("correct_answers", [form.options[0].id]);
                }
              }}
              className="input"
            >
              <option value="single">Bitta javob</option>
              <option value="multiple">Bir nechta javob</option>
              <option value="boolean">To‘g‘ri / noto‘g‘ri</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold text-ink">
            Ball
            <input
              type="number"
              min="1"
              value={form.points}
              onChange={(e) => set("points", e.target.value)}
              className="input"
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-ink">
            Izoh
            <input
              value={form.explanation || ""}
              onChange={(e) => set("explanation", e.target.value)}
              className="input"
              placeholder="Natijada ko‘rsatiladi"
            />
          </label>
        </div>
        {!isBoolean && (
          <div className="grid gap-2">
            {options.map((option, optionIndex) => (
              <div className="flex gap-2" key={option.id || optionIndex}>
                <input
                  required
                  aria-label={`Variant ${optionIndex + 1}`}
                  value={option.text}
                  onChange={(e) =>
                    set(
                      "options",
                      form.options.map((item, i) =>
                        i === optionIndex
                          ? { ...item, text: e.target.value }
                          : item
                      )
                    )
                  }
                  className="input flex-1"
                  placeholder={`Variant ${optionIndex + 1}`}
                />
                <button
                  type="button"
                  className={`min-w-10 rounded-xl border px-3 text-sm font-semibold ${form.correct_answers.includes(option.id) ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-border text-muted"}`}
                  onClick={() => toggleCorrect(option.id)}
                  aria-label={`${option.id} to‘g‘ri javob`}
                >
                  ✓
                </button>
              </div>
            ))}
            <button
              type="button"
              className="justify-self-start text-sm font-semibold text-violet-700"
              onClick={() =>
                set("options", [
                  ...form.options,
                  {
                    id: String.fromCharCode(97 + form.options.length),
                    text: "",
                  },
                ])
              }
            >
              + Variant qo‘shish
            </button>
          </div>
        )}
        {isBoolean && (
          <div className="flex gap-2">
            {options.map((option) => (
              <button
                type="button"
                key={option.id}
                onClick={() => set("correct_answers", [option.id])}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold ${form.correct_answers.includes(option.id) ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-border text-muted"}`}
              >
                {option.text}
              </button>
            ))}
          </div>
        )}
        <button
          type="button"
          className="btn-outline justify-self-start px-4 py-2 text-sm"
          onClick={() =>
            onSave({
              ...form,
              text: form.text.trim(),
              points: Number(form.points),
              correct_answers: form.correct_answers,
              options,
            })
          }
        >
          Savolni saqlash
        </button>
      </div>
    </article>
  );
}

export default function QuizBuilder({ courseId }) {
  const toast = useToast();
  const [quizzes, setQuizzes] = useState([]);
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const rows = await quizBuilderApi.list(courseId);
      setQuizzes(Array.isArray(rows) ? rows : []);
    } catch (err) {
      setError(err.message || "Testlar yuklanmadi.");
    } finally {
      setLoading(false);
    }
  }, [courseId]);
  useEffect(() => {
    load();
  }, [load]);
  async function createQuiz(body) {
    setSaving(true);
    try {
      const result = await quizBuilderApi.create(courseId, body);
      toast.success("Test yaratildi");
      setShowCreate(false);
      await openQuiz(result.id);
      await load();
    } catch (err) {
      toast.error(err.message || "Test yaratilmadi.");
    } finally {
      setSaving(false);
    }
  }
  async function openQuiz(id) {
    try {
      setActive(await quizBuilderApi.manage(id));
    } catch (err) {
      toast.error(err.message || "Test ochilmadi.");
    }
  }
  async function saveQuiz(body) {
    setSaving(true);
    try {
      await quizBuilderApi.update(active.id, body);
      setActive({ ...active, ...body });
      toast.success("Test sozlamalari saqlandi");
    } catch (err) {
      toast.error(err.message || "Test saqlanmadi.");
    } finally {
      setSaving(false);
    }
  }
  async function addQuestion() {
    try {
      await quizBuilderApi.addQuestion(
        active.id,
        createDefaultQuestionPayload()
      );
      await openQuiz(active.id);
      toast.success("Savol qo‘shildi");
    } catch (err) {
      toast.error(err.message || "Savol qo‘shilmadi.");
    }
  }
  async function saveQuestion(question) {
    try {
      await quizBuilderApi.updateQuestion(question.id, question);
      await openQuiz(active.id);
      toast.success("Savol saqlandi");
    } catch (err) {
      toast.error(err.message || "Savol saqlanmadi.");
    }
  }
  async function deleteQuestion(id) {
    if (!window.confirm("Bu savol o‘chirilsinmi?")) return;
    try {
      await quizBuilderApi.removeQuestion(id);
      await openQuiz(active.id);
      toast.success("Savol o‘chirildi");
    } catch (err) {
      toast.error(err.message || "Savol o‘chirilmadi.");
    }
  }
  async function deleteQuiz() {
    if (!active || !window.confirm("Bu test va savollari o‘chirilsinmi?"))
      return;
    try {
      await quizBuilderApi.remove(active.id);
      setActive(null);
      await load();
      toast.success("Test o‘chirildi");
    } catch (err) {
      toast.error(err.message || "Test o‘chirilmadi.");
    }
  }
  return (
    <section
      className="builder-card quiz-builder"
      aria-labelledby="quiz-builder-title"
    >
      <div className="builder-card__head">
        <div>
          <span>Assessment</span>
          <h2 id="quiz-builder-title">Testlar</h2>
          <p className="mt-1 max-w-2xl text-sm font-normal text-muted">
            Talaba darsni o‘zlashtirganini tekshirish uchun savollar, o‘tish
            bali va urinishlarni shu yerda sozlang.
          </p>
        </div>
        <button
          className="btn-primary px-4 py-2 text-sm"
          type="button"
          onClick={() => {
            setActive(null);
            setShowCreate(true);
          }}
        >
          + Test yaratish
        </button>
      </div>
      {error && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <p>{error}</p>
          <button
            className="mt-2 font-semibold underline"
            type="button"
            onClick={load}
          >
            Qayta urinish
          </button>
        </div>
      )}
      {showCreate && (
        <QuizForm
          onSave={createQuiz}
          onCancel={() => setShowCreate(false)}
          saving={saving}
        />
      )}
      {loading ? (
        <p className="py-6 text-sm text-muted">Testlar yuklanmoqda...</p>
      ) : !quizzes.length && !showCreate ? (
        <div className="mt-5 rounded-2xl border border-dashed border-border p-6 text-sm text-muted">
          <strong className="text-ink">Hali test yo‘q.</strong>
          <p className="mt-1">
            Birinchi testni yarating, keyin savollarni qo‘shing.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid gap-3">
          {quizzes.map((quiz) => (
            <button
              key={quiz.id}
              type="button"
              onClick={() => openQuiz(quiz.id)}
              className={`flex items-center justify-between gap-4 rounded-2xl border p-4 text-left transition ${active?.id === quiz.id ? "border-violet-500 bg-violet-50" : "border-border hover:border-violet-300"}`}
            >
              <span>
                <strong className="block text-ink">{quiz.title}</strong>
                <span className="text-sm text-muted">
                  {quiz.questions_count ?? 0} ta savol · o‘tish bali{" "}
                  {quiz.passing_score}%
                </span>
              </span>
              <span className="text-sm font-semibold text-violet-700">
                Boshqarish →
              </span>
            </button>
          ))}
        </div>
      )}
      {active && (
        <div className="mt-6 border-t border-border pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-ink">{active.title}</h3>
              <p className="text-sm text-muted">
                {active.questions?.length || 0} ta savol
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-outline px-3 py-2 text-sm"
                onClick={addQuestion}
              >
                + Savol
              </button>
              <button
                type="button"
                className="text-sm font-semibold text-rose-600"
                onClick={deleteQuiz}
              >
                Testni o‘chirish
              </button>
            </div>
          </div>
          <QuizForm initial={active} onSave={saveQuiz} saving={saving} />
          {active.questions?.length ? (
            <div className="mt-4 grid gap-4">
              {active.questions.map((question, index) => (
                <QuestionEditor
                  key={question.id}
                  question={question}
                  index={index}
                  onSave={saveQuestion}
                  onDelete={() => deleteQuestion(question.id)}
                />
              ))}
            </div>
          ) : (
            <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
              Test tayyor. Endi kamida bitta savol qo‘shing.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
