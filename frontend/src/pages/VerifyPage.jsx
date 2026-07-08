import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { certificatesApi } from "../lib/api";
import { Spinner } from "../components/ui";

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

/**
 * Ommaviy sertifikat tekshirish sahifasi — /verify/:code
 * Autentifikatsiya talab qilmaydi.
 */
export default function VerifyPage() {
  const { code } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    certificatesApi
      .verify(code)
      .then((res) => active && setData(res))
      .catch(() => active && setData({ valid: false }))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [code]);

  return (
    <section className="shell flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-md">
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : data?.valid ? (
          <div className="card rounded-2xl p-8 text-center">
            <p className="text-5xl">✅</p>
            <p className="mt-3 text-sm font-semibold uppercase tracking-widest text-emerald-600">
              Sertifikat haqiqiy
            </p>
            <h1 className="mt-4 font-serif text-2xl font-semibold text-ink">
              {data.course_title}
            </h1>
            <p className="mt-4 text-muted">
              Egasi:{" "}
              <span className="font-semibold text-ink">
                {data.student_name}
              </span>
            </p>
            <div className="mt-4 space-y-1 text-sm text-muted">
              <p>
                Seriya: <span className="font-mono">{data.serial}</span>
              </p>
              {data.grade && <p>Baho: {data.grade}</p>}
              <p>Berilgan sana: {formatDate(data.issued_at)}</p>
            </div>
          </div>
        ) : (
          <div className="card rounded-2xl p-8 text-center">
            <p className="text-5xl">❌</p>
            <h1 className="mt-4 font-serif text-2xl font-semibold text-ink">
              Sertifikat topilmadi
            </h1>
            <p className="mt-2 text-muted">
              {data?.detail ||
                "Bu kod bo'yicha haqiqiy sertifikat mavjud emas."}
            </p>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-sm font-semibold text-violet-700 hover:underline"
          >
            ← Bosh sahifaga
          </Link>
        </div>
      </div>
    </section>
  );
}
