// prettier-ignore-start
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { accountApi } from "../lib/accountApi";
import { formatPrice } from "../lib/api";
export default function SavedCoursesPage() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const [removing, setRemoving] = useState(null);
  useEffect(() => {
    accountApi
      .savedCourses()
      .then(setItems)
      .catch((e) => setError(e.message));
  }, []);
  async function remove(courseId) {
    setRemoving(courseId);
    try {
      await accountApi.removeSavedCourse(courseId);
      setItems((current) =>
        current.filter((item) => item.course_id !== courseId)
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setRemoving(null);
    }
  }
  return (
    <section className="shell py-16 sm:py-20">
      <p className="label">Keyinroq qaytish uchun</p>
      <h1 className="mt-3 font-serif text-4xl font-semibold text-ink">
        Saqlangan kurslar
      </h1>
      <p
        className="mt-3 max-w-2xl text-base leading-7"
        style={{ color: "var(--muted)" }}
      >
        Sizga qiziq tuyulgan kurslar shu yerda yo‘qolib ketmaydi.
      </p>
      {error && (
        <p className="mt-8 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {items === null && !error && (
        <p className="mt-10 text-sm" style={{ color: "var(--muted)" }}>
          Saqlanganlar yuklanmoqda...
        </p>
      )}
      {items?.length === 0 && (
        <div
          className="mt-10 rounded-2xl border border-dashed p-10 text-center"
          style={{ borderColor: "var(--border)" }}
        >
          <p className="font-semibold text-ink">Ro‘yxat hali bo‘sh</p>
          <Link className="btn-primary mt-5" to="/kurslar">
            Kurslarni ko‘rish
          </Link>
        </div>
      )}
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {items?.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl border bg-white p-6 shadow-sm"
            style={{ borderColor: "var(--border)" }}
          >
            <p className="label">{item.category || "Designora kursi"}</p>
            <h2 className="mt-3 font-serif text-2xl font-semibold text-ink">
              {item.title}
            </h2>
            <p className="mt-3 text-sm" style={{ color: "var(--muted)" }}>
              {item.description ||
                "Amaliy dizayn ko‘nikmalarini rivojlantiring."}
            </p>
            <div className="mt-6 flex items-center justify-between gap-3">
              <span className="font-semibold text-ink">
                {formatPrice(item.price)}
              </span>
              <span className="flex gap-2">
                <Link className="btn-outline" to={`/kurslar/${item.course_id}`}>
                  Ko‘rish
                </Link>
                <button
                  className="rounded-full px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                  onClick={() => remove(item.course_id)}
                  disabled={removing === item.course_id}
                >
                  {removing === item.course_id ? "..." : "Olib tashlash"}
                </button>
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
// prettier-ignore-end
