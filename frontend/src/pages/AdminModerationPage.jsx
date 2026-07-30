import { useEffect, useState } from "react";
import AdminWorkspaceShell from "../components/AdminWorkspaceShell";
import { useAuth } from "../context/AuthContext";
import { request } from "../lib/request";

export default function AdminModerationPage() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  async function load() {
    try {
      setItems(await request("/api/admin/moderation", { token }));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, [token]);

  async function review(id, status) {
    try {
      await request(`/api/admin/moderation/${id}`, {
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
          <div className="admin-kicker">Trust & safety</div>
          <h1>Moderatsiya navbati</h1>
          <p>Forum, review va QA kontentidagi reportlarni ko'rib chiqing.</p>
        </div>
      </header>
      <section className="admin-section">
        {error && <div className="admin-inline-error">{error}</div>}
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Kontent</th>
                <th>Sabab</th>
                <th>Reporter</th>
                <th>Yuborilgan</th>
                <th>Amal</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.content_type} #{item.content_id}
                  </td>
                  <td>{item.reason}</td>
                  <td>User #{item.reporter_id}</td>
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
                      onClick={() => review(item.id, "resolved")}
                    >
                      Yopish
                    </button>{" "}
                    <button
                      className="admin-btn"
                      onClick={() => review(item.id, "dismissed")}
                    >
                      Rad etish
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!items.length && (
            <p className="admin-empty">Ochiq reportlar yo'q.</p>
          )}
        </div>
      </section>
    </AdminWorkspaceShell>
  );
}
