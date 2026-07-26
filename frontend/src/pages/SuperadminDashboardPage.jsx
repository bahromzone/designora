import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { superadminApi } from "../lib/superadminApi";

const ROLES = ["user", "instructor", "admin", "superadmin"];

function Stat({ label, value }) {
  return (
    <article className="card rounded-2xl p-5">
      <span className="text-sm text-gray-500">{label}</span>
      <strong className="mt-2 block text-3xl">{value ?? 0}</strong>
    </article>
  );
}

export default function SuperadminDashboardPage() {
  const { token, user, loading: authLoading } = useAuth();
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setError("");
    try {
      const [nextOverview, nextUsers] = await Promise.all([
        superadminApi.overview(token),
        superadminApi.users(token),
      ]);
      setOverview(nextOverview);
      setUsers(nextUsers);
    } catch (err) {
      setError(err.message);
    }
  }, [token]);

  useEffect(() => {
    if (user?.role === "superadmin") load();
  }, [load, user?.role]);

  if (authLoading) return <main className="shell py-16">Yuklanmoqda...</main>;
  if (user?.role !== "superadmin") return <Navigate to="/" replace />;

  async function changeRole(id, role) {
    setBusyId(id);
    try {
      await superadminApi.updateRole(id, role, token);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function changeStatus(id, isActive) {
    setBusyId(id);
    try {
      await superadminApi.updateStatus(id, isActive, token);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="shell py-10">
      <header className="mb-8">
        <p className="label">Superadmin paneli</p>
        <h1 className="mt-2 text-4xl font-extrabold">Platforma boshqaruvi</h1>
        <p className="mt-2 text-gray-500">Rollar, hisob holati va tizim nazorati.</p>
      </header>

      {error && <div className="mb-5 rounded-xl bg-red-50 p-4 text-red-700">{error}</div>}

      <section className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Stat label="Jami user" value={overview?.users_total} />
        <Stat label="Faol" value={overview?.users_active} />
        <Stat label="Student" value={overview?.students} />
        <Stat label="Instructor" value={overview?.instructors} />
        <Stat label="Admin" value={overview?.admins} />
        <Stat label="Kurslar" value={overview?.courses} />
      </section>

      <section className="card mt-8 overflow-hidden rounded-2xl">
        <div className="border-b p-5"><h2 className="text-xl font-bold">Foydalanuvchilar</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500"><tr><th className="p-4">User</th><th className="p-4">Rol</th><th className="p-4">Holat</th></tr></thead>
            <tbody>
              {users.map((item) => (
                <tr className="border-t" key={item.id}>
                  <td className="p-4"><strong>{item.name || "-"}</strong><br /><span className="text-gray-500">{item.email}</span></td>
                  <td className="p-4"><select className="rounded-lg border px-3 py-2" value={item.role} disabled={busyId === item.id || item.id === user.id} onChange={(event) => changeRole(item.id, event.target.value)}>{ROLES.map((role) => <option key={role} value={role}>{role}</option>)}</select></td>
                  <td className="p-4"><label className="flex items-center gap-2"><input type="checkbox" checked={item.is_active} disabled={busyId === item.id || item.id === user.id} onChange={(event) => changeStatus(item.id, event.target.checked)} /> {item.is_active ? "Faol" : "Bloklangan"}</label></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
