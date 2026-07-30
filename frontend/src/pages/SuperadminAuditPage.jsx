import { useEffect, useState } from "react";
import AdminWorkspaceShell from "../components/AdminWorkspaceShell";
import { useAuth } from "../context/AuthContext";
import { superadminApi } from "../lib/superadminApi";

export default function SuperadminAuditPage() {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    superadminApi
      .audit(token)
      .then(setLogs)
      .catch((err) => setError(err.message));
  }, [token]);
  return (
    <AdminWorkspaceShell superadmin>
      <header className="admin-page-head">
        <div>
          <div className="admin-kicker">Security trail</div>
          <h1>Audit log</h1>
          <p>
            Superadmin o'zgartirishlari: kim, nimani va qachon o'zgartirgan.
          </p>
        </div>
      </header>
      <section className="admin-section">
        {error && <div className="admin-inline-error">{error}</div>}
        {!error && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Vaqt</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Target</th>
                  <th>Old → new</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <small>
                        {log.created_at
                          ? new Date(log.created_at).toLocaleString("uz-UZ")
                          : "-"}
                      </small>
                    </td>
                    <td>{log.actor_email}</td>
                    <td>
                      <span className="admin-role-pill">{log.action}</span>
                    </td>
                    <td>
                      {log.target_type} #{log.target_id}
                    </td>
                    <td>
                      <small>
                        {log.old_value || "-"} → {log.new_value || "-"}
                      </small>
                    </td>
                    <td>
                      <small>{log.ip_address || "-"}</small>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!logs.length && (
              <p className="admin-empty">Hali audit yozuvlari yo'q.</p>
            )}
          </div>
        )}
      </section>
    </AdminWorkspaceShell>
  );
}
