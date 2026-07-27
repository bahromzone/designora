import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Har bir rol uchun "o'z uyi" — ruxsat bo'lmaganda shu yerga qaytaramiz.
const ROLE_HOME = {
  superadmin: "/superadmin",
  admin: "/admin",
  instructor: "/instruktor-panel",
};

/**
 * Login + rol tekshiruvi. ProtectedRoute faqat autentifikatsiyani tekshiradi,
 * shu sabab /admin va /superadmin sahifalari har qanday login qilgan userga
 * ochiq edi (data kelmasa ham UI ko'rinardi). RoleRoute buni yopadi.
 */
export default function RoleRoute({ roles = [], children }) {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="shell py-16 flex min-h-[60vh] items-center justify-center">
        <div
          className="card rounded-2xl px-8 py-6 text-sm"
          style={{ color: "var(--muted)" }}
        >
          Ruxsatlar tekshirilmoqda...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate to="/?modal=login" replace state={{ from: location.pathname }} />
    );
  }

  if (roles.length && !roles.includes(user?.role)) {
    const fallback = ROLE_HOME[user?.role] ?? "/";
    return (
      <div className="shell py-16 flex min-h-[60vh] items-center justify-center">
        <div className="card rounded-2xl px-8 py-6 text-center">
          <h1 className="text-xl font-semibold">Ruxsat yo&apos;q</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
            Bu sahifa {roles.join(" yoki ")} roli uchun. Sizning rolingiz:{" "}
            {user?.role || "noma'lum"}.
          </p>
          <Link className="mt-4 inline-block underline" to={fallback}>
            Orqaga qaytish
          </Link>
        </div>
      </div>
    );
  }

  return children;
}
