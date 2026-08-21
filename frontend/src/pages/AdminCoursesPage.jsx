import { useCallback, useEffect, useState } from "react";
import AdminWorkspaceShell from "../components/AdminWorkspaceShell";
import { request } from "../lib/request";
import { useAuth } from "../context/AuthContext";

const EMPTY = {
  title: "",
  description: "",
  category: "",
  price: 0,
  thumbnail_url: "",
  is_active: true,
};

export default function AdminCoursesPage() {
  const { token } = useAuth();
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [codeForm, setCodeForm] = useState({
    course_id: "",
    user_email: "",
    expires_in_days: 7,
  });
  const [generatedCode, setGeneratedCode] = useState(null);
  const [codeBusy, setCodeBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const rows = await request("/api/admin/courses", { token });
      setCourses(rows);
      setCodeForm((current) => ({
        ...current,
        course_id:
          current.course_id ||
          String(rows.find((row) => row.is_active)?.id || ""),
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function editCourse(course) {
    setEditingId(course.id);
    setForm({
      title: course.title || "",
      description: course.description || "",
      category: course.category || "",
      price: course.price || 0,
      thumbnail_url: course.thumbnail_url || "",
      is_active: Boolean(course.is_active),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY);
  }

  async function saveCourse(event) {
    event.preventDefault();
    setError("");
    try {
      const path = editingId
        ? `/api/admin/courses/${editingId}`
        : "/api/admin/courses";
      await request(path, {
        method: editingId ? "PATCH" : "POST",
        body: JSON.stringify({ ...form, price: Number(form.price) || 0 }),
        token,
      });
      resetForm();
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function createAccessCode(event) {
    event.preventDefault();
    if (codeBusy) return;
    setCodeBusy(true);
    setGeneratedCode(null);
    setError("");
    try {
      const result = await request("/api/admin/course-access-codes", {
        method: "POST",
        body: JSON.stringify({
          course_id: Number(codeForm.course_id),
          user_email: codeForm.user_email.trim(),
          expires_in_days: Number(codeForm.expires_in_days),
        }),
        token,
      });
      setGeneratedCode(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setCodeBusy(false);
    }
  }

  async function copyGeneratedCode() {
    if (!generatedCode?.code) return;
    await navigator.clipboard.writeText(generatedCode.code);
  }

  async function toggleCourse(course) {
    setBusyId(course.id);
    setError("");
    try {
      await request(`/api/admin/courses/${course.id}/toggle`, {
        method: "PATCH",
        token,
      });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function deleteCourse(course) {
    if (
      !window.confirm(`“${course.title}” kursini o'chirishni tasdiqlaysizmi?`)
    )
      return;
    setBusyId(course.id);
    setError("");
    try {
      await request(`/api/admin/courses/${course.id}`, {
        method: "DELETE",
        token,
      });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminWorkspaceShell>
      <header className="admin-page-head">
        <div>
          <div className="admin-kicker">Content operations</div>
          <h1>Kurslar</h1>
          <p>Kurs yarating, tahrirlang, vaqtincha yoping yoki o'chiring.</p>
        </div>
      </header>
      {error && <div className="admin-inline-error">{error}</div>}
      <section className="admin-section">
        <h2>{editingId ? "Kursni tahrirlash" : "Yangi kurs"}</h2>
        <form onSubmit={saveCourse} className="admin-user-filters">
          <input
            name="title"
            required
            minLength="3"
            maxLength="200"
            placeholder="Kurs nomi"
            value={form.title}
            onChange={updateField}
          />
          <input
            name="category"
            placeholder="Kategoriya"
            value={form.category}
            onChange={updateField}
          />
          <input
            name="price"
            type="number"
            min="0"
            placeholder="Narx"
            value={form.price}
            onChange={updateField}
          />
          <input
            name="thumbnail_url"
            placeholder="Thumbnail URL"
            value={form.thumbnail_url}
            onChange={updateField}
          />
          <input
            name="description"
            placeholder="Qisqa tavsif"
            value={form.description}
            onChange={updateField}
          />
          <label>
            <input
              name="is_active"
              type="checkbox"
              checked={form.is_active}
              onChange={updateField}
            />{" "}
            Faol
          </label>
          <button className="admin-btn primary" type="submit">
            {editingId ? "Saqlash" : "Qo'shish"}
          </button>
          {editingId && (
            <button className="admin-btn" type="button" onClick={resetForm}>
              Bekor qilish
            </button>
          )}
        </form>
      </section>
      <section className="admin-section">
        <div className="admin-kicker">Tashqi to'lov</div>
        <h2>Bir martalik kirish kodi</h2>
        <p className="admin-empty">
          To'lovni tekshirgandan keyin kod yarating. Kod faqat tanlangan
          foydalanuvchi va kurs uchun ishlaydi.
        </p>
        <form className="admin-user-filters" onSubmit={createAccessCode}>
          <select
            required
            aria-label="Kurs"
            value={codeForm.course_id}
            onChange={(event) =>
              setCodeForm((current) => ({
                ...current,
                course_id: event.target.value,
              }))
            }
          >
            <option value="">Kursni tanlang</option>
            {courses
              .filter((course) => course.is_active)
              .map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
          </select>
          <input
            required
            type="email"
            placeholder="Foydalanuvchi emaili"
            value={codeForm.user_email}
            onChange={(event) =>
              setCodeForm((current) => ({
                ...current,
                user_email: event.target.value,
              }))
            }
          />
          <select
            aria-label="Kod muddati"
            value={codeForm.expires_in_days}
            onChange={(event) =>
              setCodeForm((current) => ({
                ...current,
                expires_in_days: event.target.value,
              }))
            }
          >
            <option value="1">1 kun</option>
            <option value="3">3 kun</option>
            <option value="7">7 kun</option>
            <option value="14">14 kun</option>
            <option value="30">30 kun</option>
          </select>
          <button
            className="admin-btn primary"
            type="submit"
            disabled={codeBusy}
          >
            {codeBusy ? "Yaratilmoqda..." : "Kod yaratish"}
          </button>
        </form>
        {generatedCode && (
          <div className="admin-list-row" role="status">
            <div>
              <small>
                {generatedCode.user_email} · {generatedCode.course_title}
              </small>
              <strong
                style={{
                  display: "block",
                  marginTop: 6,
                  fontFamily: "monospace",
                  fontSize: "1.4rem",
                  letterSpacing: "0.08em",
                }}
              >
                {generatedCode.code}
              </strong>
              <small>Bu kod qayta ko'rsatilmaydi. Hozir nusxalang.</small>
            </div>
            <button
              className="admin-btn"
              type="button"
              onClick={copyGeneratedCode}
            >
              Nusxalash
            </button>
          </div>
        )}
      </section>
      <section className="admin-section">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Kurs</th>
                <th>Kategoriya</th>
                <th>Narx</th>
                <th>Holat</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id}>
                  <td>
                    <strong>{course.title}</strong>
                    <br />
                    <small>{course.description || "Tavsif kiritilmagan"}</small>
                  </td>
                  <td>{course.category || "-"}</td>
                  <td>{course.price || 0} so'm</td>
                  <td>{course.is_active ? "Faol" : "Yopiq"}</td>
                  <td>
                    <button
                      className="admin-btn"
                      disabled={busyId === course.id}
                      onClick={() => editCourse(course)}
                    >
                      Tahrirlash
                    </button>{" "}
                    <button
                      className="admin-btn"
                      disabled={busyId === course.id}
                      onClick={() => toggleCourse(course)}
                    >
                      {course.is_active ? "Yopish" : "Ochish"}
                    </button>{" "}
                    <button
                      className="admin-btn"
                      disabled={busyId === course.id}
                      onClick={() => deleteCourse(course)}
                    >
                      O'chirish
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && <p>Yuklanmoqda...</p>}
          {!loading && !courses.length && (
            <p className="admin-empty">Hozircha kurslar yo'q.</p>
          )}
        </div>
      </section>
    </AdminWorkspaceShell>
  );
}
