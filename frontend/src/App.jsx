import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import AppShell from "./components/AppShell";
import ProtectedRoute from "./components/ProtectedRoute";
import { Spinner } from "./components/ui";

// Kod bo'linishi (code-splitting): har sahifa alohida chunk sifatida
// faqat kerak bo'lganda yuklanadi. Bu boshlang'ich bundle'ni kichraytiradi.
const HomePage = lazy(() => import("./pages/HomePage"));
const CoursesPage = lazy(() => import("./pages/CoursesPage"));
const CourseDetailPage = lazy(() => import("./pages/CourseDetailPage"));
const InstructorPage = lazy(() => import("./pages/InstructorPage"));
const BlogListPage = lazy(() => import("./pages/BlogListPage"));
const BlogPostPage = lazy(() => import("./pages/BlogPostPage"));
const ForumListPage = lazy(() => import("./pages/ForumListPage"));
const ForumThreadPage = lazy(() => import("./pages/ForumThreadPage"));
const VerifyPage = lazy(() => import("./pages/VerifyPage"));
const MyCoursesPage = lazy(() => import("./pages/MyCoursesPage"));
const LearnPage = lazy(() => import("./pages/LearnPage"));
const CheckoutResultPage = lazy(() => import("./pages/CheckoutResultPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const InstructorDashboardPage = lazy(
  () => import("./pages/InstructorDashboardPage")
);
const InstructorManagePage = lazy(() => import("./pages/InstructorManagePage"));
const InstructorCourseEditPage = lazy(
  () => import("./pages/InstructorCourseEditPage")
);
const InstructorApplyPage = lazy(() => import("./pages/InstructorApplyPage"));
const AdminDashboardPage = lazy(() => import("./pages/AdminDashboardPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

// ── Auth: Google OAuth qaytishi + parolni tiklash oqimi ─────────
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const AuthCallbackPage = lazy(() => import("./pages/AuthCallbackPage"));

// ── Statik sahifalar (footer havolalari) ──────────────────────
const AboutPage = lazy(() => import("./pages/AboutPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));

// Sahifa chunk'i yuklanayotganda ko'rsatiladigan fallback.
function RouteFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Spinner />
    </div>
  );
}

function App() {
  return (
    <AppShell>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/kurslar" element={<CoursesPage />} />
          <Route path="/kurslar/:courseId" element={<CourseDetailPage />} />
          <Route
            path="/instruktor/:instructorId"
            element={<InstructorPage />}
          />
          <Route path="/blog" element={<BlogListPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/forum" element={<ForumListPage />} />
          <Route path="/forum/:threadId" element={<ForumThreadPage />} />
          <Route path="/verify/:code" element={<VerifyPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          {/* Statik sahifalar (footer) */}
          <Route path="/biz-haqimizda" element={<AboutPage />} />
          <Route path="/maxfiylik" element={<PrivacyPage />} />
          <Route path="/shartlar" element={<TermsPage />} />
          {/* O'qituvchi bo'lish arizasi (sahifa o'zi auth holatini boshqaradi) */}
          <Route path="/instruktor-boshlash" element={<InstructorApplyPage />} />
          {/* Eski auth sahifalari olib tashlandi — endi modal ochadi.
              Har qanday eski havola/bookmark shu redirect orqali ishlaydi. */}
          <Route
            path="/kirish"
            element={<Navigate to="/?modal=login" replace />}
          />
          <Route
            path="/royxatdan-otish"
            element={<Navigate to="/?modal=signup" replace />}
          />
          <Route
            path="/kurslarim"
            element={
              <ProtectedRoute>
                <MyCoursesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organish/:courseId"
            element={
              <ProtectedRoute>
                <LearnPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tolov/natija/:orderId"
            element={
              <ProtectedRoute>
                <CheckoutResultPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profil"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/instruktor-panel"
            element={
              <ProtectedRoute>
                <InstructorDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/instruktor/boshqaruv"
            element={
              <ProtectedRoute>
                <InstructorManagePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/instruktor/boshqaruv/:courseId"
            element={
              <ProtectedRoute>
                <InstructorCourseEditPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-panel"
            element={
              <ProtectedRoute>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </AppShell>
  );
}

export default App;
