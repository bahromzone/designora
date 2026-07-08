import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { paymentsApi } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Spinner } from "../components/ui";

const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 40; // ~2 daqiqa kutamiz, keyin qo'lda yangilashni taklif qilamiz

export default function CheckoutResultPage() {
  const { orderId } = useParams();
  const { token } = useAuth();

  const [status, setStatus] = useState(null);
  const [courseId, setCourseId] = useState(null);
  const [error, setError] = useState("");
  const [polling, setPolling] = useState(true);

  const check = useCallback(async () => {
    try {
      const res = await paymentsApi.orderStatus(orderId, token);
      setStatus(res.status);
      setCourseId(res.course_id);
      return res.status;
    } catch (e) {
      setError(e.message || "Buyurtma holatini tekshirib bo'lmadi.");
      return "error";
    }
  }, [orderId, token]);

  useEffect(() => {
    let active = true;
    let tries = 0;
    let timer;

    async function loop() {
      const s = await check();
      if (!active) return;
      tries += 1;
      const done =
        s === "paid" ||
        s === "cancelled" ||
        s === "error" ||
        tries >= MAX_POLLS;
      if (done) {
        setPolling(false);
        return;
      }
      timer = setTimeout(loop, POLL_INTERVAL_MS);
    }
    loop();

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [check]);

  const paid = status === "paid";
  const cancelled = status === "cancelled";

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      {polling && !error ? (
        <>
          <Spinner />
          <h1 className="mt-6 text-xl font-bold">To'lov tekshirilmoqda...</h1>
          <p className="mt-2 text-sm text-muted">
            To'lov tizimidan tasdiqni kutyapmiz. Bu bir necha soniya olishi
            mumkin, sahifani yopmang.
          </p>
        </>
      ) : paid ? (
        <>
          <div className="text-5xl">🎉</div>
          <h1 className="mt-4 text-2xl font-bold">To'lov muvaffaqiyatli!</h1>
          <p className="mt-2 text-sm text-muted">
            Kursga kirish ochildi. Darhol o'qishni boshlashingiz mumkin.
          </p>
          <div className="mt-6 flex gap-3">
            {courseId && (
              <Link
                to={`/organish/${courseId}`}
                className="btn-primary px-6 py-2.5 text-sm"
              >
                O'qishni boshlash
              </Link>
            )}
            <Link to="/kurslarim" className="btn-outline px-6 py-2.5 text-sm">
              Mening kurslarim
            </Link>
          </div>
        </>
      ) : cancelled ? (
        <>
          <div className="text-5xl">❌</div>
          <h1 className="mt-4 text-2xl font-bold">To'lov bekor qilindi</h1>
          <p className="mt-2 text-sm text-muted">
            To'lov amalga oshmadi. Xohlasangiz qaytadan urinib ko'ring.
          </p>
          {courseId && (
            <Link
              to={`/kurslar/${courseId}`}
              className="btn-primary mt-6 px-6 py-2.5 text-sm"
            >
              Kursga qaytish
            </Link>
          )}
        </>
      ) : (
        <>
          <div className="text-5xl">⏳</div>
          <h1 className="mt-4 text-2xl font-bold">To'lov hali kutilmoqda</h1>
          <p className="mt-2 text-sm text-muted">
            {error ||
              "Tasdiq hali kelmadi. To'lovni yakunlagan bo'lsangiz, biroz kuting yoki holatni qayta tekshiring."}
          </p>
          <button
            onClick={() => {
              setError("");
              setPolling(true);
              check().then(() => setPolling(false));
            }}
            className="btn-primary mt-6 px-6 py-2.5 text-sm"
          >
            Holatni qayta tekshirish
          </button>
        </>
      )}
    </div>
  );
}
