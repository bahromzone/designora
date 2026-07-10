import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import AppShell from "./components/AppShell";
import ProtectedRoute from "./components/ProtectedRoute";
import { Spinner } from "./components/ui";

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
const PortfolioBuilderPage = lazy(() => import("./pages/PortfolioBuilderPage"));
const PublicPortfolioPage = lazy(() => import("./pages/PublicPortfolioPage"));
const InstructorDashboardPage = lazy(() => import("./pages/InstructorDashboardPage"));
const InstructorManagePage = lazy(() => import("./pages/InstructorManagePage"));
const InstructorCourseEditPage = lazy(() => import("./pages/InstructorCourseEditPage"));
const InstructorApplyPage = lazy(() => import("./pages/InstructorApplyPage"));
const AdminDashboardPage = lazy(() => import("./pages/AdminDashboardPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const AuthCallbackPage = lazy(() => import("./pages/AuthCallbackPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

function RouteFallback() {
  return <div className="flex min-h-[45vh] items-center justify-center"><Spinner /></div>;
}

const protectedPage = (page) => <ProtectedRoute>{page}</ProtectedRoute>;

function App() {
  return (
    <AppShell>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/kurslar" element={<CoursesPage />} />
          <Route path="/kurslar/:courseId" element={<CourseDetailPage />} />
          <Route path="/instruktor/:instructorId" element={<InstructorPage />} />
          <Route path="/blog" element={<BlogListPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/forum" element={<ForumListPage />} />
          <Route path="/forum/:threadId" element={<ForumThreadPage />} />
          <Route path="/verify/:code" element={<VerifyPage />} />
          <Route path="/biz-haqimizda" element={<AboutPage />} />
          <Route path="/maxfiylik" element={<PrivacyPage />} />
          <Route path="/shartlar" element={<TermsPage />} />
          <Route path="/instruktor-boshlash" element={<InstructorApplyPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/parolni-unutdim" element={<ForgotPasswordPage />} />
          <Route path="/parolni-tiklash" element={<ResetPasswordPage />} />
          <Route path="/kirish" element={<Navigate to="/" replace />} />
          <Route path="/royxatdan-otish" element={<Navigate to="/" replace />} />
          <Route path="/portfolio/:userId" element={<PublicPortfolioPage />} />
          <Route path="/kurslarim" element={protectedPage(<MyCoursesPage />)} />
          <Route path="/organish/:courseId" element={protectedPage(<LearnPage />)} />
          <Route path="/portfolio" element={protectedPage(<PortfolioBuilderPage />)} />
          <Route path="/tolov/natija/:orderId" element={protectedPage(<CheckoutResultPage />)} />
          <Route path="/profil" element={protectedPage(<ProfilePage />)} />
          <Route path="/instruktor-panel" element={protectedPage(<InstructorDashboardPage />)} />
          <Route path="/instruktor/boshqaruv" element={protectedPage(<InstructorManagePage />)} />
          <Route path="/instruktor/boshqaruv/:courseId" element={protectedPage(<InstructorCourseEditPage />)} />
          <Route path="/admin" element={protectedPage(<AdminDashboardPage />)} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </AppShell>
  );
}

export default App;
