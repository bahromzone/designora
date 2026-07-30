import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import AdminWorkspaceShell from "../components/AdminWorkspaceShell";
import { useAuth } from "../context/AuthContext";
import { superadminApi } from "../lib/superadminApi";

const ROLES = ["user", "instructor", "admin", "superadmin"];

export default function SuperadminDashboardPage() {
  const { token, user, loading: authLoading } = useAuth();
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setError("");
    try {
      const [overviewResponse, usersResponse] = await Promise.all([
        superadminApi.overview(token),
        superadminApi.users(token),
      ]);
      setOverview(overviewResponse);
      setUsers(
        Array.isArray(usersResponse)
          ? usersResponse
          : (usersResponse.items ?? [])
      );
    } catch (err) {
      setError(err.message);
    }
  }, [token]);

  useEffect(() => {
    if (user?.role === "superadmin") load();
  }, [load, user?.role]);

  if (authLoading) {
    return (
      <AdminWorkspaceShell superadmin>
        <div className="admin-section">Yuklanmoqda...</div>
      </AdminWorkspaceShell>
    );
  }

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
    <AdminWorkspaceShell superadmin>
      <header className="admin-page-head">
        <div>
          <div className="admin-kicker">Superadmin control room</div>
          <h1>Tizim boshqaruvi</h1>
          <p>Rollar, account holati va barcha platforma operatsiyalari.</p>
        </div>
        <div className="admin-actions">
          <a className="admin-btn primary" href="/admin">
            Admin ko&apos;rinishi
          </a>
        </div>
      </header>
      {error && <div className="admin-section">{error}</div>}
      <section className="admin-stat-grid">
        <article className="admin-stat">
          <small>Jami user</small>
          <strong>{overview?.users_total ?? 0}</strong>
        </article>
        <article className="admin-stat">
          <small>Faol</small>
          <strong>{overview?.users_active ?? 0}</strong>
        </article>
        <article className="admin-stat">
          <small>Student</small>
          <strong>{overview?.students ?? 0}</strong>
        </article>
        <article className="admin-stat">
          <small>Instructor</small>
          <strong>{overview?.instructors ?? 0}</strong>
        </article>
        <article className="admin-stat">
          <small>Admin</small>
          <strong>{overview?.admins ?? 0}</strong>
        </article>
        <article className="admin-stat">
          <small>Kurslar</small>
          <strong>{overview?.courses ?? 0}</strong>
        </article>
      </section>
      <section className="admin-section">
        <h2>Foydalanuvchilar va permissionlar</h2>
        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name || "-"}</strong>
                    <br />
                    <small>{item.email}</small>
                  </td>
                  <td>
                    <select
                      value={item.role}
                      disabled={busyId === item.id || item.id === user.id}
                      onChange={(e) => changeRole(item.id, e.target.value)}
                    >
                      {ROLES.map((role) => (
                        <option key={role}>{role}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <label>
                      <input
                        type="checkbox"
                        checked={item.is_active}
                        disabled={busyId === item.id || item.id === user.id}
                        onChange={(e) =>
                          changeStatus(item.id, e.target.checked)
                        }
                      />{" "}
                      {item.is_active ? "Faol" : "Bloklangan"}
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminWorkspaceShell>
  );
}
