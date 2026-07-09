import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="shell py-16 flex min-h-[60vh] items-center justify-center">
        <div
          className="card rounded-2xl px-8 py-6 text-sm"
          style={{ color: "var(--muted)" }}
        >
          Profil ma'lumotlari yuklanmoqda...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/?modal=login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return children;
}
