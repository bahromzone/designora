import { useEffect, useState } from "react";
import AdminWorkspaceShell from "../components/AdminWorkspaceShell";
import { useAuth } from "../context/AuthContext";
import { request } from "../lib/request";

export default function InstructorApplicationsPage() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  async function load() {
    try {
      setItems(await request("/api/admin/instructor-applications", { token }));
    } catch (err) {
      setError(err.message);
    }
  }
  useEffect(() => {
    load();
  }, [token]);
  async function review(id, status) {
    try {
      await request(`/api/admin/instructor-applications/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
        token,
      });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <AdminWorkspaceShell>
      <header className="admin-page-head">
        <div>
          <div className="admin-kicker">People operations</div>
          <h1>Instructor arizalari</h1>
          <p>Yangi instruktorlarni tekshiring va tasdiqlang.</p>
        </div>
      </header>
      <section className="admin-section">
        {error && <div className="admin-inline-error">{error}</div>}
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nomzod</th>
                <th>Bio</th>
                <th>Portfolio</th>
                <th>Yuborilgan</th>
                <th>Amal</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                    <br />
                    <small>User #{item.user_id}</small>
                  </td>
                  <td>{item.bio}</td>
                  <td>
                    {item.portfolio_url ? (
                      <a
                        href={item.portfolio_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Ochish
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    <small>
                      {item.created_at
                        ? new Date(item.created_at).toLocaleDateString("uz-UZ")
                        : "-"}
                    </small>
                  </td>
                  <td>
                    <button
                      className="admin-btn primary"
                      onClick={() => review(item.id, "approved")}
                    >
                      Tasdiqlash
                    </button>{" "}
                    <button
                      className="admin-btn"
                      onClick={() => review(item.id, "rejected")}
                    >
                      Rad etish
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!items.length && (
            <p className="admin-empty">Kutilayotgan arizalar yo'q.</p>
          )}
        </div>
      </section>
    </AdminWorkspaceShell>
  );
}
