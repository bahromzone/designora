import { useCallback, useEffect, useState } from "react";

import { reviewsApi } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Rating, Spinner } from "./ui";

function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("uz-UZ", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

// Yulduzlar taqsimoti qatori (5★ dan 1★ gacha).
function DistributionRow({ star, count, total }) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-10 shrink-0 text-muted">{star}★</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface">
        <div
          className="h-full rounded-full bg-violet-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 shrink-0 text-right text-muted">{count}</span>
    </div>
  );
}

/**
 * Kurs sharhlari bloki.
 *
 * Props:
 *   courseId   — kurs ID
 *   isEnrolled — foydalanuvchi kursga yozilganmi (sharh yozish uchun shart)
 */
export default function ReviewsSection({ courseId, isEnrolled }) {
  const { isAuthenticated, token, user } = useAuth();
  const toast = useToast();

  const [summary, setSummary] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Forma holati
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const myReview = reviews.find((r) => user && r.user_id === user.id) || null;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sum, list] = await Promise.all([
        reviewsApi.summary(courseId),
        reviewsApi.list(courseId),
      ]);
      setSummary(sum);
      setReviews(Array.isArray(list) ? list : []);
    } catch {
      setSummary(null);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    load();
  }, [load]);

  // O'z sharhi bo'lsa formani old qiymatlar bilan to'ldiramiz.
  useEffect(() => {
    if (myReview) {
      setRating(myReview.rating);
      setComment(myReview.comment || "");
    }
  }, [myReview]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (rating < 1) {
      toast.error("Iltimos, yulduz bilan baho bering.");
      return;
    }
    setSubmitting(true);
    try {
      await reviewsApi.upsert(courseId, { rating, comment }, token);
      toast.success("Sharhingiz saqlandi.");
      setEditing(false);
      await load();
    } catch (err) {
      toast.error(err.message || "Sharhni saqlab bo'lmadi.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!myReview) return;
    setSubmitting(true);
    try {
      await reviewsApi.remove(myReview.id, token);
      toast.success("Sharh o'chirildi.");
      setRating(0);
      setComment("");
      setEditing(false);
      await load();
    } catch (err) {
      toast.error(err.message || "Sharhni o'chirib bo'lmadi.");
    } finally {
      setSubmitting(false);
    }
  }

  const avg = summary?.rating_avg ?? 0;
  const count = summary?.rating_count ?? 0;
  const dist = summary?.distribution ?? {};
  const showForm = isAuthenticated && isEnrolled && (!myReview || editing);

  return (
    <div className="mt-16">
      <h2 className="font-serif text-2xl font-semibold text-ink">
        Sharhlar va reyting
      </h2>

      {loading ? (
        <div className="mt-6 flex justify-center py-10">
          <Spinner />
        </div>
      ) : (
        <div className="mt-6 grid gap-10 lg:grid-cols-[280px_1fr]">
          {/* Chap: xulosa */}
          <div>
            <div className="flex items-end gap-3">
              <span className="font-serif text-5xl font-bold text-ink">
                {Number(avg).toFixed(1)}
              </span>
              <div className="pb-1">
                <Rating value={avg} />
                <p className="mt-1 text-sm text-muted">{count} ta sharh</p>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              {[5, 4, 3, 2, 1].map((star) => (
                <DistributionRow
                  key={star}
                  star={star}
                  count={dist[star] ?? dist[String(star)] ?? 0}
                  total={count}
                />
              ))}
            </div>
          </div>

          {/* O'ng: forma + ro'yxat */}
          <div>
            {/* Yozish/tahrirlash formasi */}
            {showForm ? (
              <form onSubmit={handleSubmit} className="card rounded-2xl p-5">
                <p className="mb-2 text-sm font-semibold text-ink">
                  {myReview ? "Sharhingizni tahrirlang" : "Sharh qoldiring"}
                </p>
                <Rating value={rating} onChange={setRating} size="lg" />
                <textarea
                  className="input-field mt-3"
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Kurs haqidagi fikringiz (ixtiyoriy)..."
                />
                <div className="mt-3 flex gap-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary px-5 py-2 text-sm"
                  >
                    {submitting ? "..." : myReview ? "Saqlash" : "Yuborish"}
                  </button>
                  {myReview && editing && (
                    <button
                      type="button"
                      onClick={() => setEditing(false)}
                      className="btn-outline px-5 py-2 text-sm"
                    >
                      Bekor qilish
                    </button>
                  )}
                </div>
              </form>
            ) : isAuthenticated && !isEnrolled && !myReview ? (
              <div className="card rounded-2xl p-5 text-sm text-muted">
                Sharh qoldirish uchun avval kursga yozilishingiz kerak.
              </div>
            ) : null}

            {/* O'z sharhim boshqaruvi (tahrirlash rejimida emas) */}
            {myReview && !editing && (
              <div className="mt-4 flex items-center gap-3 text-sm">
                <span className="text-muted">Sizning sharhingiz joylandi.</span>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="font-semibold text-violet-700 hover:underline"
                >
                  Tahrirlash
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={submitting}
                  className="font-semibold text-rose-600 hover:underline"
                >
                  O'chirish
                </button>
              </div>
            )}

            {/* Ro'yxat */}
            <div className="mt-6 space-y-5">
              {reviews.length === 0 ? (
                <p className="text-sm text-muted">
                  Hali sharhlar yo'q. Birinchi bo'lib fikr bildiring!
                </p>
              ) : (
                reviews.map((r) => (
                  <div
                    key={r.id}
                    className="border-b border-border pb-5 last:border-0"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-ink">
                        {r.author || "Foydalanuvchi"}
                      </span>
                      <span className="text-xs text-muted">
                        {formatDate(r.created_at)}
                      </span>
                    </div>
                    <div className="mt-1">
                      <Rating value={r.rating} size="sm" />
                    </div>
                    {r.comment && (
                      <p className="mt-2 text-sm leading-7 text-ink-60">
                        {r.comment}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
