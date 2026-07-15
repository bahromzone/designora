import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import SeoHead from "../components/SeoHead";
import { Spinner } from "../components/ui";
import { certificatesApi } from "../lib/api";

function formatDate(iso) {
  if (!iso) return "";
  try { return new Date(iso).toLocaleDateString("uz-UZ", { year: "numeric", month: "long", day: "numeric" }); } catch { return ""; }
}

export default function VerifyPage() {
  const { code } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    certificatesApi.verify(code).then((response) => active && setData(response)).catch(() => active && setData({ valid: false })).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [code]);

  return (
    <main className="container py-16">
      <SeoHead title="Sertifikatni tekshirish" description="Designora sertifikatining haqiqiyligini tekshirish natijasi" path={`/verify/${encodeURIComponent(code || "")}`} robots="noindex,nofollow,noarchive" />
      <section className="card p-8" aria-live="polite">
        {loading ? <Spinner /> : data?.valid ? (
          <><div aria-hidden="true">✅</div><h1>Sertifikat haqiqiy</h1><h2>{data.course_title}</h2><p>Egasi: <strong>{data.student_name}</strong></p><dl><div><dt>Seriya</dt><dd>{data.serial}</dd></div>{data.grade && <div><dt>Baho</dt><dd>{data.grade}</dd></div>}<div><dt>Berilgan sana</dt><dd>{formatDate(data.issued_at)}</dd></div></dl></>
        ) : (
          <><div aria-hidden="true">❌</div><h1>Sertifikat topilmadi</h1><p>{data?.detail || "Bu kod bo‘yicha haqiqiy sertifikat mavjud emas."}</p></>
        )}
        <Link to="/">← Bosh sahifaga</Link>
      </section>
    </main>
  );
}
