import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { coursesApi, instructorApi, formatSeconds } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  Button,
  EmptyState,
  Input,
  Modal,
  Select,
  Spinner,
  Textarea,
} from "../components/ui";

const LESSON_TYPES = [
  { value: "video", label: "Video" },
  { value: "text", label: "Matn" },
  { value: "quiz", label: "Test" },
];

const EMPTY_LESSON = {
  title: "",
  module_id: "",
  type: "video",
  video_url: "",
  duration_seconds: 0,
  description: "",
  is_free_preview: false,
};

function lessonIcon(lesson) {
  if (lesson.type === "quiz") return "❓";
  if (lesson.is_free_preview) return "▶";
  return "🔒";
}

export default function InstructorCourseEditPage() {
  const { courseId } = useParams();
  const { token } = useAuth();
  const toast = useToast();

  const [course, setCourse] = useState(null);
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Kurs sozlamalari formasi
  const [settings, setSettings] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);

  // Modul modali
  const [moduleModal, setModuleModal] = useState(false);
  const [moduleForm, setModuleForm] = useState({ title: "", order: 0 });
  const [savingModule, setSavingModule] = useState(false);

  // Dars modali
  const [lessonModal, setLessonModal] = useState(false);
  const [lessonForm, setLessonForm] = useState(EMPTY_LESSON);
  const [savingLesson, setSavingLesson] = useState(false);

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    setError("");
    instructorApi
      .getCourse(courseId, token)
      .then((res) => {
        if (!active) return;
        setCourse(res);
        setSettings({
          title: res.title || "",
          subtitle: res.subtitle || "",
          description: res.description || "",
          category: res.category || "",
          price: res.price || 0,
        });
      })
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    // Mundarija daraxti — detail ommaviy (chop etilgan kurslar uchun).
    // Qoralama bo'lsa 404 bo'ladi; jimgina bo'sh daraxt ko'rsatamiz.
    coursesApi
      .detail(courseId)
      .then((d) => active && setTree(d.modules || []))
      .catch(() => active && setTree([]));
    return () => {
      active = false;
    };
  }, [courseId, token]);

  useEffect(() => {
    const cleanup = load();
    return cleanup;
  }, [load]);

  async function saveSettings(e) {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await instructorApi.updateCourse(
        courseId,
        {
          title: settings.title.trim(),
          subtitle: settings.subtitle.trim() || undefined,
          description: settings.description.trim() || undefined,
          category: settings.category.trim() || undefined,
          price: Number(settings.price) || 0,
        },
        token
      );
      toast.success("Sozlamalar saqlandi");
      load();
    } catch (err) {
      toast.error(err.message || "Saqlab bo'lmadi");
    } finally {
      setSavingSettings(false);
    }
  }

  async function togglePublish() {
    try {
      if (course.status === "published") {
        await instructorApi.unpublishCourse(courseId, token);
        toast.success("Qoralamaga o'tkazildi");
      } else {
        await instructorApi.publishCourse(courseId, token);
        toast.success("Kurs chop etildi");
      }
      load();
    } catch (err) {
      toast.error(err.message || "Amalni bajarib bo'lmadi");
    }
  }

  async function submitModule(e) {
    e.preventDefault();
    if (!moduleForm.title.trim()) return;
    setSavingModule(true);
    try {
      await instructorApi.createModule(
        courseId,
        { title: moduleForm.title.trim(), order: Number(moduleForm.order) || 0 },
        token
      );
      toast.success("Modul qo'shildi");
      setModuleModal(false);
      setModuleForm({ title: "", order: 0 });
      load();
    } catch (err) {
      toast.error(err.message || "Qo'shib bo'lmadi");
    } finally {
      setSavingModule(false);
    }
  }

  async function removeModule(moduleId) {
    try {
      await instructorApi.deleteModule(moduleId, token);
      toast.success("Modul o'chirildi");
      load();
    } catch (err) {
      toast.error(err.message || "O'chirib bo'lmadi");
    }
  }

  function openLessonModal(moduleId) {
    setLessonForm({ ...EMPTY_LESSON, module_id: moduleId ?? "" });
    setLessonModal(true);
  }

  async function submitLesson(e) {
    e.preventDefault();
    if (!lessonForm.title.trim()) return;
    setSavingLesson(true);
    try {
      await instructorApi.createLesson(
        courseId,
        {
          title: lessonForm.title.trim(),
          module_id: lessonForm.module_id
            ? Number(lessonForm.module_id)
            : undefined,
          type: lessonForm.type,
          video_url: lessonForm.video_url.trim() || undefined,
          duration_seconds: Number(lessonForm.duration_seconds) || 0,
          description: lessonForm.description.trim() || undefined,
          is_free_preview: Boolean(lessonForm.is_free_preview),
        },
        token
      );
      toast.success("Dars qo'shildi");
      setLessonModal(false);
      setLessonForm(EMPTY_LESSON);
      load();
    } catch (err) {
      toast.error(err.message || "Qo'shib bo'lmadi");
    } finally {
      setSavingLesson(false);
    }
  }

  async function removeLesson(lessonId) {
    try {
      await instructorApi.deleteLesson(lessonId, token);
      toast.success("Dars o'chirildi");
      load();
    } catch (err) {
      toast.error(err.message || "O'chirib bo'lmadi");
    }
  }

  if (loading) {
    return (
      <section className="shell flex justify-center py-24">
        <Spinner />
      </section>
    );
  }

  if (error || !course || !settings) {
    return (
      <section className="shell py-24">
        <EmptyState
          title="Kurs ochilmadi"
          description={error || "Bu kurs sizga tegishli emas yoki mavjud emas."}
        />
        <div className="mt-6 text-center">
          <Link to="/instruktor/boshqaruv" className="btn-outline">
            ← Kurslarga qaytish
          </Link>
        </div>
      </section>
    );
  }

  const moduleOptions = tree
    .filter((m) => m.id != null)
    .map((m) => ({ value: String(m.id), label: m.title }));

  return (
    <section className="shell py-16 sm:py-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            to="/instruktor/boshqaruv"
            className="text-sm font-semibold"
            style={{ color: "var(--muted)" }}
          >
            ← Kurslar
          </Link>
          <h1 className="mt-2 font-serif text-2xl font-semibold text-ink">
            {course.title}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            Holat: {course.status === "published" ? "Chop etilgan" : "Qoralama"}
          </p>
        </div>
        <Button variant="outline" onClick={togglePublish}>
          {course.status === "published" ? "Qoralamaga" : "Chop etish"}
        </Button>
      </div>

      {/* Kurs sozlamalari */}
      <form
        onSubmit={saveSettings}
        className="mt-8 space-y-4 rounded-2xl border p-6"
        style={{ borderColor: "var(--border)" }}
      >
        <h2 className="font-serif text-lg font-semibold text-ink">
          Kurs sozlamalari
        </h2>
        <Input
          label="Sarlavha"
          value={settings.title}
          onChange={(e) =>
            setSettings((p) => ({ ...p, title: e.target.value }))
          }
          required
        />
        <Input
          label="Qism sarlavha"
          value={settings.subtitle}
          onChange={(e) =>
            setSettings((p) => ({ ...p, subtitle: e.target.value }))
          }
        />
        <Textarea
          label="Tavsif"
          rows={4}
          value={settings.description}
          onChange={(e) =>
            setSettings((p) => ({ ...p, description: e.target.value }))
          }
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Kategoriya"
            value={settings.category}
            onChange={(e) =>
              setSettings((p) => ({ ...p, category: e.target.value }))
            }
          />
          <Input
            label="Narx (so'm)"
            type="number"
            min={0}
            value={settings.price}
            onChange={(e) =>
              setSettings((p) => ({ ...p, price: e.target.value }))
            }
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit" loading={savingSettings}>
            Saqlash
          </Button>
        </div>
      </form>

      {/* Mundarija: modullar + darslar */}
      <div
        className="mt-8 rounded-2xl border p-6"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg font-semibold text-ink">
            Mundarija
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setModuleModal(true)}>
              + Modul
            </Button>
            <Button onClick={() => openLessonModal(null)}>+ Dars</Button>
          </div>
        </div>

        {tree.length === 0 ? (
          <p className="mt-4 text-sm" style={{ color: "var(--muted)" }}>
            Mundarija bo'sh yoki kurs qoralama. Modul va dars qo'shing;
            qoralama kursda mundarija chop etilgandan keyin to'liq ko'rinadi.
          </p>
        ) : (
          <div className="mt-5 space-y-4">
            {tree.map((m) => (
              <div
                key={m.id ?? "orphan"}
                className="rounded-xl border"
                style={{ borderColor: "var(--border)" }}
              >
                <div
                  className="flex items-center justify-between px-4 py-3"
                  style={{ background: "var(--surface)" }}
                >
                  <span className="font-semibold text-ink">{m.title}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openLessonModal(m.id)}
                      className="text-xs font-semibold"
                      style={{ color: "var(--brand)" }}
                    >
                      + Dars
                    </button>
                    {m.id != null && (
                      <button
                        type="button"
                        onClick={() => removeModule(m.id)}
                        className="text-xs font-semibold"
                        style={{ color: "#c0392b" }}
                      >
                        O'chirish
                      </button>
                    )}
                  </div>
                </div>
                <ul
                  className="divide-y"
                  style={{ borderColor: "var(--border)" }}
                >
                  {(m.lessons || []).length === 0 ? (
                    <li
                      className="px-4 py-3 text-sm"
                      style={{ color: "var(--muted)" }}
                    >
                      Dars yo'q
                    </li>
                  ) : (
                    (m.lessons || []).map((l) => (
                      <li
                        key={l.id}
                        className="flex items-center justify-between px-4 py-3 text-sm"
                      >
                        <span className="flex items-center gap-2 text-ink">
                          <span aria-hidden>{lessonIcon(l)}</span>
                          {l.title}
                        </span>
                        <span className="flex items-center gap-3">
                          <span style={{ color: "var(--muted)" }}>
                            {l.duration_seconds
                              ? formatSeconds(l.duration_seconds)
                              : ""}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeLesson(l.id)}
                            className="text-xs font-semibold"
                            style={{ color: "#c0392b" }}
                          >
                            O'chirish
                          </button>
                        </span>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modul modali */}
      <Modal
        open={moduleModal}
        onClose={() => setModuleModal(false)}
        title="Yangi modul"
      >
        <form className="space-y-4" onSubmit={submitModule}>
          <Input
            label="Modul sarlavhasi"
            value={moduleForm.title}
            onChange={(e) =>
              setModuleForm((p) => ({ ...p, title: e.target.value }))
            }
            required
          />
          <Input
            label="Tartib"
            type="number"
            min={0}
            value={moduleForm.order}
            onChange={(e) =>
              setModuleForm((p) => ({ ...p, order: e.target.value }))
            }
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => setModuleModal(false)}
            >
              Bekor
            </Button>
            <Button type="submit" loading={savingModule}>
              Qo'shish
            </Button>
          </div>
        </form>
      </Modal>

      {/* Dars modali */}
      <Modal
        open={lessonModal}
        onClose={() => setLessonModal(false)}
        title="Yangi dars"
      >
        <form className="space-y-4" onSubmit={submitLesson}>
          <Input
            label="Dars sarlavhasi"
            value={lessonForm.title}
            onChange={(e) =>
              setLessonForm((p) => ({ ...p, title: e.target.value }))
            }
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Modul"
              value={lessonForm.module_id}
              onChange={(e) =>
                setLessonForm((p) => ({ ...p, module_id: e.target.value }))
              }
            >
              <option value="">Modulsiz (umumiy)</option>
              {moduleOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
            <Select
              label="Turi"
              options={LESSON_TYPES}
              value={lessonForm.type}
              onChange={(e) =>
                setLessonForm((p) => ({ ...p, type: e.target.value }))
              }
            />
          </div>
          <Input
            label="Video URL"
            value={lessonForm.video_url}
            onChange={(e) =>
              setLessonForm((p) => ({ ...p, video_url: e.target.value }))
            }
            placeholder="https://..."
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Davomiylik (soniya)"
              type="number"
              min={0}
              value={lessonForm.duration_seconds}
              onChange={(e) =>
                setLessonForm((p) => ({
                  ...p,
                  duration_seconds: e.target.value,
                }))
              }
            />
            <label className="mt-7 flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={lessonForm.is_free_preview}
                onChange={(e) =>
                  setLessonForm((p) => ({
                    ...p,
                    is_free_preview: e.target.checked,
                  }))
                }
              />
              Bepul preview
            </label>
          </div>
          <Textarea
            label="Tavsif"
            rows={3}
            value={lessonForm.description}
            onChange={(e) =>
              setLessonForm((p) => ({ ...p, description: e.target.value }))
            }
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => setLessonModal(false)}
            >
              Bekor
            </Button>
            <Button type="submit" loading={savingLesson}>
              Qo'shish
            </Button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
