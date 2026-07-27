import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ProtectedRoute from "./ProtectedRoute";

/**
 * Foydalanuvchi berilgan rollardan biriga egami?
 *
 * Alohida sof funksiya sifatida eksport qilinadi — shunda ruxsat mantig'i
 * React render'siz test qilinadi.
 */
export function canAccess(user, roles = []) {
  if (!user) return false;
  if (!roles.length) return true;
  return roles.includes(user.role);
}

/**
 * Rolga asoslangan route qo'riqchisi.
 *
 * ProtectedRoute faqat "login qilinganmi?" degan savolga javob beradi.
 * Admin/superadmin sahifalari uchun bu yetarli emas edi: URL'ni qo'lda
 * yozgan oddiy foydalanuvchi ham panel karkasini ochib olardi (API 403
 * qaytarsa ham, UI ko'rinardi). RoleRoute shuni yopadi.
 */
function RoleGate({ roles, children }) {
  const { user, loading } = useAuth();
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

  if (!canAccess(user, roles)) {
    return (
      <Navigate
        to="/"
        replace
        state={{ from: location.pathname, forbidden: true }}
      />
    );
  }

  return children;
}

export default function RoleRoute({ roles = [], children }) {
  return (
    <ProtectedRoute>
      <RoleGate roles={roles}>{children}</RoleGate>
    </ProtectedRoute>
  );
}
