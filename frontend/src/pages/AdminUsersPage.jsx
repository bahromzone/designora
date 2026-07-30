import { useCallback, useEffect, useState } from "react";

import AdminWorkspaceShell from "../components/AdminWorkspaceShell";
import { useAuth } from "../context/AuthContext";
import { request } from "../lib/request";

const ROLES = ["user", "instructor", "admin", "superadmin"];
const SEARCH_DEBOUNCE_MS = 350;

export default function AdminUsersPage() {
  const { token, user } = useAuth();
  const isSuperadmin = user?.role === "superadmin";
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(query.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ page: String(page), per_page: "25" });
    if (searchTerm) params.set("q", searchTerm);
    if (role !== "all") params.set("role", role);
    if (status !== "all") params.set("status", status);

    try {
      const endpoint = isSuperadmin ? "/api/superadmin/users" : "/api/admin/users";
      const result = await request(`${endpoint}?${params.toString()}`, { token });
      setUsers(result.items || []);
      setMeta({ total: result.total || 0, pages: result.pages || 0 });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isSuperadmin, token, searchTerm, role, status, page]);

  useEffect(() => {
    load();
  }, [load]);

  function changeFilter(setter, value) {
    setter(value);
    setPage(1);
  }

  async function updateUser(id, patch) {
    setBusy(id);
    setError("");
    try {
      const path = "role" in patch
        ? `/api/superadmin/users/${id}/role`
        : `/api/superadmin/users/${id}/status`;
      await request(path, {
        method: "PATCH",
        body: JSON.stringify(patch),
        token,
      });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <AdminWorkspaceShell superadmin={isSuperadmin}>
      <header className="admin-page-head">
        <div>
          <div className="admin-kicker">Access control</div>
          <h1>Users & permissions</h1>
          <p>
            {isSuperadmin
              ? "Rollarni va account holatini boshqaring."
              : "Platforma foydalanuvchilarini ko'ring."}
          </p>
        </div>
        <div className="admin-actions">
          <span className="admin-btn">{meta.total} ta user</span>
        </div>
      </header>

      <section className="admin-section">
        <div className="admin-user-filters">
          <input
            aria-label="User qidirish"
            placeholder="Ism yoki email qidirish"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select
            aria-label="Rol bo'yicha filter"
            value={role}
            onChange={(event) => changeFilter(setRole, event.target.value)}
          >
            <option value="all">Barcha rollar</option>
            {ROLES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            aria-label="Holat bo'yicha filter"
            value={status}
            onChange={(event) => changeFilter(setStatus, event.target.value)}
          >
            <option value="all">Barcha holatlar</option>
            <option value="active">Faol</option>
            <option value="inactive">Bloklangan</option>
          </select>
        </div>

        {error && <div className="admin-inline-error">{error}</div>}
        {loading ? (
          <p>Foydalanuvchilar yuklanmoqda...</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Qo'shilgan</th>
                </tr>
              </thead>
              <tbody>
                {users.map((item) => {
                  const locked =
                    !isSuperadmin || item.id === user?.id || busy === item.id;
                  return (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.name || "Nomsiz user"}</strong>
                        <br />
                        <small>{item.email}</small>
                      </td>
                      <td>
                        {isSuperadmin ? (
                          <select
                            value={item.role}
                            disabled={locked}
                            onChange={(event) =>
                              updateUser(item.id, { role: event.target.value })
                            }
                          >
                            {ROLES.map((value) => (
                              <option key={value}>{value}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="admin-role-pill">{item.role}</span>
                        )}
                      </td>
                      <td>
                        {isSuperadmin ? (
                          <label className="admin-status-toggle">
                            <input
                              type="checkbox"
                              checked={Boolean(item.is_active)}
                              disabled={locked}
                              onChange={(event) =>
                                updateUser(item.id, {
                                  is_active: event.target.checked,
                                })
                              }
                            />
                            {item.is_active ? "Faol" : "Bloklangan"}
                          </label>
                        ) : (
                          <span>{item.is_active ? "Faol" : "Bloklangan"}</span>
                        )}
                      </td>
                      <td>
                        <small>
                          {item.created_at
                            ? new Date(item.created_at).toLocaleDateString(
                                "uz-UZ",
                              )
                            : "-"}
                        </small>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!users.length && (
              <p className="admin-empty">Filter bo'yicha user topilmadi.</p>
            )}
            <div className="admin-actions">
              <button
                className="admin-btn"
                disabled={page <= 1 || loading}
                onClick={() => setPage((value) => value - 1)}
              >
                Oldingi
              </button>
              <span className="admin-btn">
                {page} / {meta.pages || 1}
              </span>
              <button
                className="admin-btn"
                disabled={page >= (meta.pages || 1) || loading}
                onClick={() => setPage((value) => value + 1)}
              >
                Keyingi
              </button>
            </div>
          </div>
        )}
      </section>
    </AdminWorkspaceShell>
  );
}
