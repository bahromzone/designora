// prettier-ignore-start
import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";
import SearchShortcut from "./components/SearchShortcut";

const SavedCoursesPage = lazy(() => import("./pages/SavedCoursesPage"));
const CertificatesPage = lazy(() => import("./pages/CertificatesPage"));
const PaymentHistoryPage = lazy(() => import("./pages/PaymentHistoryPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const p = (x) => <ProtectedRoute>{x}</ProtectedRoute>;
const ad = (x) => <RoleRoute roles={["admin", "superadmin"]}>{x}</RoleRoute>;
const sa = (x) => <RoleRoute roles={["superadmin"]}>{x}</RoleRoute>;
const ins = (x) => <RoleRoute roles={["instructor", "admin", "superadmin"]}>{x}</RoleRoute>;

export default function App() {
  return <AppShell><SearchShortcut /><Routes>
    <Route path="/profil/sertifikatlarim" element={p(<CertificatesPage />)} />
    <Route path="/profil/saqlangan" element={p(<SavedCoursesPage />)} />
    <Route path="/profil/tolovlar" element={p(<PaymentHistoryPage />)} />
    <Route path="/profil/sozlamalar" element={p(<SettingsPage />)} />
  </Routes></AppShell>;
}
// prettier-ignore-end
