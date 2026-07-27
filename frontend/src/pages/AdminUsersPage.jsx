import { useCallback, useEffect, useMemo, useState } from "react";
import AdminWorkspaceShell from "../components/AdminWorkspaceShell";
import { useAuth } from "../context/AuthContext";
import { request } from "../lib/request";

const ROLES = ["user", "instructor", "admin", "superadmin"];

export default function AdminUsersPage() {
  const { token, user } = useAuth();
  const isSuperadmin = user?.role === "superadmin";
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await request(isSuperadmin ? "/api/superadmin/users" : "/api/admin/users", { token });
      setUsers(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isSuperadmin, token]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => users.filter((item) => {
    const haystack = `${item.name || ""} ${item.email || ""}`.toLowerCase();
    return (!query || haystack.includes(query.toLowerCase())) &&
      (role === "all" || item.role === role) &&
      (status === "all" || (status === "active" ? item.is_active : !item.is_active));
  }), [users, query, role, status]);

  async function updateUser(id, patch) {
    setBusy(id);
    setError("");
    try {
      const path = patch.role ? `/api/superadmin/users/${id}/role` : `/api/superadmin/users/${id}/status`;
      await request(path, { method: "PATCH", body: JSON.stringify(patch), token });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  }

  return <AdminWorkspaceShell superadmin={isSuperadmin}>
    <header className="admin-page-head">
      <div><div className="admin-kicker">Access control</div><h1>Users & permissions</h1><p>{isSuperadmin ? "Rollarni va account holatini boshqaring." : "Platforma foydalanuvchilarini ko'ring."}</p></div>
      <div className="admin-actions"><span className="admin-btn">{filtered.length} ta natija</span></div>
    </header>
    <section className="admin-section">
      <div className="admin-user-filters"><input aria-label="User qidirish" placeholder="Ism yoki email qidirish" value={query} onChange={(e) => setQuery(e.target.value)} /><select aria-label="Rol bo'yicha filter" value={role} onChange={(e) => setRole(e.target.value)}><option value="all">Barcha rollar</option>{ROLES.map((item) => <option key={item} value={item}>{item}</option>)}</select><select aria-label="Holat bo'yicha filter" value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">Barcha holatlar</option><option value="active">Faol</option><option value="inactive">Bloklangan</option></select></div>
      {error && <div className="admin-inline-error">{error}</div>}
      {loading ? <p>Foydalanuvchilar yuklanmoqda...</p> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>User</th><th>Role</th><th>Status</th><th>Qo'shilgan</th></tr></thead><tbody>{filtered.map((item) => { const locked = !isSuperadmin || item.id === user?.id || busy === item.id; return <tr key={item.id}><td><strong>{item.name || "Nomsiz user"}</strong><br/><small>{item.email}</small></td><td>{isSuperadmin ? <select value={item.role} disabled={locked} onChange={(e) => updateUser(item.id, { role: e.target.value })}>{ROLES.map((value) => <option key={value}>{value}</option>)}</select> : <span className="admin-role-pill">{item.role}</span>}</td><td>{isSuperadmin ? <label className="admin-status-toggle"><input type="checkbox" checked={Boolean(item.is_active)} disabled={locked} onChange={(e) => updateUser(item.id, { is_active: e.target.checked })}/>{item.is_active ? "Faol" : "Bloklangan"}</label> : <span>{item.is_active ? "Faol" : "Bloklangan"}</span>}</td><td><small>{item.created_at ? new Date(item.created_at).toLocaleDateString("uz-UZ") : "-"}</small></td></tr>; })}</tbody></table>{!filtered.length && <p className="admin-empty">Filter bo'yicha user topilmadi.</p>}</div>}
    </section>
  </AdminWorkspaceShell>;
}
