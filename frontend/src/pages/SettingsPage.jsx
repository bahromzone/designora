// prettier-ignore-start
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { accountApi } from "../lib/accountApi";
export default function SettingsPage() {
  const { user } = useAuth();
  const [passwords, setPasswords] = useState({ current_password: "", new_password: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [changing, setChanging] = useState(false);
  async function changePassword(event) {
    event.preventDefault();
    setChanging(true); setMessage(""); setError("");
    try {
      await accountApi.changePassword(passwords);
      setPasswords({ current_password: "", new_password: "" });
      setMessage("Parol muvaffaqiyatli o‘zgartirildi.");
    } catch (e) { setError(e.message); } finally { setChanging(false); }
  }
  return (
    <section className="shell py-16 sm:py-20">
      <p className="label">Hisobingizni boshqaring</p>
      <h1 className="mt-3 font-serif text-4xl font-semibold text-ink">Sozlamalar</h1>
      <p className="mt-3 max-w-2xl text-base leading-7" style={{ color: "var(--muted)" }}>
        Kirish xavfsizligini shu yerdan boshqaring. Ism, avatar va shaxsiy ma’lumotlar <Link className="font-semibold text-violet-600 hover:underline" to="/profil">Profil</Link> bo‘limida tahrirlanadi.
      </p>
      {message && <p className="mt-8 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>}
      {error && <p className="mt-8 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <form onSubmit={changePassword} className="mt-10 max-w-2xl rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
        <p className="label">Kirish xavfsizligi</p>
        <p className="mt-3 text-sm" style={{ color: "var(--muted)" }}>
          {user?.provider && user.provider !== "local" ? `${user.provider} orqali kirgansiz, parol bu yerda boshqarilmaydi.` : "Yangi parol kamida 8 belgi, katta harf va raqamdan iborat bo‘lsin."}
        </p>
        <div className="mt-6 space-y-5">
          {[["current_password", "Joriy parol"], ["new_password", "Yangi parol"]].map(([key, label]) => (
            <label className="block" key={key}>
              <span className="mb-2 block text-sm font-semibold text-ink">{label}</span>
              <input className="input-field" type="password" value={passwords[key]} onChange={(event) => setPasswords((current) => ({ ...current, [key]: event.target.value }))} required minLength={8} />
            </label>
          ))}
        </div>
        <button className="btn-primary mt-6" disabled={changing || (user?.provider && user.provider !== "local")}>
          {changing ? "O‘zgartirilmoqda..." : "Parolni yangilash"}
        </button>
      </form>
    </section>
  );
}
// prettier-ignore-end
