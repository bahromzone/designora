import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { instructorApi, formatPrice } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  Button,
  EmptyState,
  Input,
  Modal,
  Select,
  Spinner,
} from "../components/ui";

const LEVELS = [
  { value: "boshlang'ich", label: "Boshlang'ich" },
  { value: "o'rta", label: "O'rta" },
  { value: "yuqori", label: "Yuqori" },
];

const LANGS = [
  { value: "uz", label: "O'zbekcha" },
  { value: "ru", label: "Ruscha" },
  { value: "en", label: "Inglizcha" },
];

const EMPTY_FORM = {
  title: "",
  subtitle: "",
  category: "",
  price: 0,
  level: "boshlang'ich",
  language: "uz",
};

function StatusBadge({ status }) {
  const published = status === "published";
  return (
    <span
      className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{
        background: published ? "var(--amber-10)" : "var(--surface)",
        color: published ? "var(--brand)" : "var(--muted)",
      }}
    >
      {published ? "Chop etilgan" : "Qoralama"}
    </span>
  );
}

export default function InstructorManagePage() {
  const { token } = useAuth();
  const toast = useToast();

  const [courses, setCourses] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    setError("");
    instructorApi
      .listCourses(token)
      .then((res) => active && setCourses(Array.isArray(res) ? res : []))
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    const cleanup = load();
    return cleanup;
  }, [load]);

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submitCreate(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await instructorApi.createCourse(
        {
          title: form.title.trim(),
          subtitle: form.subtitle.trim() || undefined,
          category: form.category.trim() || undefined,
          price: Number(form.price) || 0,
          level: form.level,
          language: form.language,
        },
        token
      );
      toast.success("Kurs yaratildi (qoralama)");
      setModalOpen(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      toast.error(err.message || "Yaratib bo'lmadi");
    } finally {
      setSaving(false);
    }
  }

  async function togglePublish(course) {
    setBusyId(course.id);
    try {
      if (course.status === "published") {
        await instructorApi.unpublishCourse(course.id, token);
        toast.success("Qoralamaga o'tkazildi");
      } else {
        await instructorApi.publishCourse(course.id, token);
        toast.success("Kurs chop etildi");
      }
      load();
    } catch (err) {
      toast.error(err.message || "Amalni bajarib bo'lmadi");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="shell py-16 sm:py-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">Instruktor</p>
          <h1 className="font-serif text-2xl font-semibold text-ink sm:text-3xl">
            Kurslarni boshqarish
          </h1>
        </div>
        <div className="flex gap-3">
          <Link to="/instruktor-panel" className="btn-outline">
            Dashboard
          </Link>
          <Button onClick={() => setModalOpen(true)}>+ Yangi kurs</Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Spinner />
        </div>
      ) : error ? (
        <div className="mt-10">
          <EmptyState title="Yuklab bo'lmadi" description={error} />
        </div>
      ) : courses.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            title="Hozircha kurs yo'q"
            description="Birinchi kursingizni yarating va mundarija qo'shing."
            action={
              <Button onClick={() => setModalOpen(true)}>+ Yangi kurs</Button>
            }
          />
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {courses.map((c) => (
            <div
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-5"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <h3 className="truncate font-semibold text-ink">
                    {c.title}
                  </h3>
                  <StatusBadge status={c.status} />
                </div>
                <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
                  {`${c.modules_count} modul · ${c.lessons_count} dars · ${c.students_count} o'quvchi · ${formatPrice(c.price)}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  loading={busyId === c.id}
                  onClick={() => togglePublish(c)}
                >
                  {c.status === "published" ? "Qoralamaga" : "Chop etish"}
                </Button>
                <Link
                  to={`/instruktor/boshqaruv/${c.id}`}
                  className="btn-primary"
                >
                  Tahrirlash
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Yangi kurs modali */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Yangi kurs"
      >
        <form className="space-y-4" onSubmit={submitCreate}>
          <Input
            label="Sarlavha"
            name="title"
            value={form.title}
            onChange={(e) => setField("title", e.target.value)}
            placeholder="Masalan: UI/UX asoslari"
            required
          />
          <Input
            label="Qism sarlavha"
            name="subtitle"
            value={form.subtitle}
            onChange={(e) => setField("subtitle", e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Kategoriya"
              name="category"
              value={form.category}
              onChange={(e) => setField("category", e.target.value)}
            />
            <Input
              label="Narx (so'm)"
              name="price"
              type="number"
              min={0}
              value={form.price}
              onChange={(e) => setField("price", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Daraja"
              name="level"
              options={LEVELS}
              value={form.level}
              onChange={(e) => setField("level", e.target.value)}
            />
            <Select
              label="Til"
              name="language"
              options={LANGS}
              value={form.language}
              onChange={(e) => setField("language", e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              type="button"
            >
              Bekor
            </Button>
            <Button type="submit" loading={saving}>
              Yaratish
            </Button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
