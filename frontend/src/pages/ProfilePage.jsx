import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import GamificationSection from "../components/GamificationSection";
import ReferralSection from "../components/ReferralSection";
import { useAuth } from "../context/AuthContext";
import { accountApi } from "../lib/accountApi";
import { authApi } from "../lib/api";

const ROLE_LABELS = { superadmin: "Superadmin", admin: "Administrator", instructor: "Instruktor", user: "Talaba" };
const EMPTY_FORM = { name: "", bio: "", phone: "", location: "", website: "", avatar_url: "" };

function formatDate(value) {
  return new Date(value).toLocaleDateString("uz-UZ", { year: "numeric", month: "long", day: "numeric" });
}

export default function ProfilePage() {
  const { token, user, refreshProfile } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    Promise.all([authApi.dashboard(token), accountApi.profile()])
      .then(([stats, profile]) => {
        setDashboard(stats);
        setForm({ ...EMPTY_FORM, ...profile });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const displayName = form.name || user?.name || user?.full_name || "Designora student";
  function setField(key, value) { setForm((current) => ({ ...current, [key]: value })); }
  async function saveProfile(event) {
    event.preventDefault();
    setSaving(true); setMessage(""); setError("");
    try {
      await accountApi.updateProfile(form);
      await refreshProfile();
      setMessage("Profil ma’lumotlari saqlandi.");
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  }

  return (
    <section className="shell py-16 sm:py-20">
      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-6 rounded-2xl border p-6" style={{ borderColor: "var(--border)" }}>
          <div className="flex flex-col items-center text-center">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full text-2xl font-bold text-white" style={{ background: "var(--amber)" }}>
              {form.avatar_url ? <img src={form.avatar_url} alt="Profil avatari" className="h-full w-full object-cover" /> : displayName.charAt(0).toUpperCase()}
            </div>
            <p className="label mt-4">Profil</p>
            <h1 className="font-serif text-xl font-semibold text-ink">{displayName}</h1>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>{user?.email}</p>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm"><span style={{ color: "var(--muted)" }}>Rol</span><span className="font-semibold text-ink">{ROLE_LABELS[user?.role] ?? "Talaba"}</span></div>
            <div className="flex justify-between text-sm"><span style={{ color: "var(--muted)" }}>Qo‘shilgan</span><span className="font-semibold text-ink">{user?.created_at ? formatDate(user.created_at) : "—"}</span></div>
          </div>
          <Link to="/portfolio" className="flex min-h-12 items-center justify-between rounded-xl px-4 text-sm font-bold text-white" style={{ background: "var(--ink)" }}>Portfolio Studio <span aria-hidden>→</span></Link>
          {user?.id && <Link to={`/portfolio/u/${user.id}`} target="_blank" rel="noreferrer" className="block text-center text-sm font-semibold" style={{ color: "var(--muted)" }}>Public portfolio ↗</Link>}
          {error && <p className="rounded-xl px-4 py-2.5 text-xs" style={{ background: "#fff0ef", color: "#c0392b" }}>{error}</p>}
        </aside>
        <div className="space-y-6">
          <form onSubmit={saveProfile} className="rounded-2xl border p-6" style={{ borderColor: "var(--border)" }}>
            <p className="label">Shaxsiy ma’lumotlar</p>
            <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>Ism, avatar, bio va aloqa ma’lumotlaringiz shu yerda saqlanadi.</p>
            {loading ? <p className="mt-6 text-sm" role="status">Ma’lumotlar yuklanmoqda...</p> : <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {[["name", "Ism"], ["avatar_url", "Avatar URL"], ["phone", "Telefon"], ["location", "Joylashuv"], ["website", "Veb-sayt"]].map(([key, label]) => <label className="block" key={key}><span className="mb-2 block text-sm font-semibold text-ink">{label}</span><input className="input-field" type={key === "avatar_url" || key === "website" ? "url" : "text"} value={form[key]} onChange={(event) => setField(key, event.target.value)} required={key === "name"} /></label>)}
              <label className="block sm:col-span-2"><span className="mb-2 block text-sm font-semibold text-ink">Bio</span><textarea className="input-field min-h-28 resize-y" value={form.bio} onChange={(event) => setField("bio", event.target.value)} maxLength={500} /></label>
            </div>}
            {!loading && <button className="btn-primary mt-6" disabled={saving}>{saving ? "Saqlanmoqda..." : "Saqlash"}</button>}
          </form>
          <div className="rounded-2xl border p-6" style={{ borderColor: "var(--border)" }}><p className="label mb-2">Keyingi qadam</p><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="font-serif text-lg font-semibold text-ink">Eng yaxshi ishlaringizni ko‘rsating</h2><p className="mt-2 max-w-2xl text-sm leading-7" style={{ color: "var(--ink-60)" }}>Baholangan topshiriqlarni professional case study’ga aylantiring va bitta public havola bilan ulashing.</p></div><Link to="/portfolio" className="btn-primary">Portfolio yaratish</Link></div></div>
          <GamificationSection />
          <div className="rounded-2xl border p-6" style={{ borderColor: "var(--border)" }}><p className="label mb-2">Boshqaruv ma’lumotlari</p><h2 className="font-serif text-lg font-semibold text-ink">Shaxsiy ko‘rinish</h2>{dashboard?.metrics?.length ? <div className="mt-4 grid gap-4 sm:grid-cols-2">{dashboard.metrics.map((metric) => <div key={metric.label} className="rounded-xl border p-4" style={{ borderColor: "var(--border)" }}><p className="text-xs" style={{ color: "var(--muted)" }}>{metric.label}</p><p className="mt-1 font-serif text-2xl font-semibold text-ink">{metric.value}</p></div>)}</div> : <p className="mt-4 text-sm" style={{ color: "var(--muted)" }}>Boshqaruv maydoni tayyorlanmoqda...</p>}</div>
          <ReferralSection />
        </div>
      </div>
    </section>
  );
}
