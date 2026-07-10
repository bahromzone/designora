import { Navigate, Route, Routes } from "react-router-dom";

import AppShell from "./components/AppShell";
import ProtectedRoute from "./components/ProtectedRoute";
import SearchShortcut from "./components/SearchShortcut";
import AboutPage from "./pages/AboutPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import BlogListPage from "./pages/BlogListPage";
import BlogPostPage from "./pages/BlogPostPage";
import CheckoutResultPage from "./pages/CheckoutResultPage";
import CourseDetailPage from "./pages/CourseDetailPage";
import CoursesPage from "./pages/CoursesPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ForumListPage from "./pages/ForumListPage";
import ForumThreadPage from "./pages/ForumThreadPage";
import GlobalSearchPage from "./pages/GlobalSearchPage";
import HomePage from "./pages/HomePage";
import InstructorApplyPage from "./pages/InstructorApplyPage";
import InstructorCourseEditPage from "./pages/InstructorCourseEditPage";
import InstructorDashboardPage from "./pages/InstructorDashboardPage";
import InstructorManagePage from "./pages/InstructorManagePage";
import InstructorPage from "./pages/InstructorPage";
import InstructorReviewPage from "./pages/InstructorReviewPage";
import LearnPage from "./pages/LearnPage";
import NotFoundPage from "./pages/NotFoundPage";
import PortfolioBuilderPage from "./pages/PortfolioBuilderPage";
import PrivacyPage from "./pages/PrivacyPage";
import ProfilePage from "./pages/ProfilePage";
import PublicPortfolioPage from "./pages/PublicPortfolioPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import StudentDashboardPage from "./pages/StudentDashboardPage";
import TermsPage from "./pages/TermsPage";
import VerifyPage from "./pages/VerifyPage";

const protectedPage = (page) => <ProtectedRoute>{page}</ProtectedRoute>;

function App() {
  return (
    <AppShell>
      <SearchShortcut />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/qidiruv" element={<GlobalSearchPage />} />
        <Route path="/kurslar" element={<CoursesPage />} />
        <Route path="/kurslar/:courseId" element={<CourseDetailPage />} />
        <Route path="/blog" element={<BlogListPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="/forum" element={<ForumListPage />} />
        <Route path="/forum/:threadId" element={<ForumThreadPage />} />
        <Route path="/instruktor/:instructorId" element={<InstructorPage />} />
        <Route path="/biz-haqimizda" element={<AboutPage />} />
        <Route path="/maxfiylik" element={<PrivacyPage />} />
        <Route path="/shartlar" element={<TermsPage />} />
        <Route path="/kirish" element={<Navigate to="/?modal=login" replace />} />
        <Route path="/royxatdan-otish" element={<Navigate to="/?modal=signup" replace />} />
        <Route path="/verify/:code" element={<VerifyPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/portfolio/u/:userId" element={<PublicPortfolioPage />} />
        <Route path="/kurslarim" element={protectedPage(<StudentDashboardPage />)} />
        <Route path="/organish/:courseId" element={protectedPage(<LearnPage />)} />
        <Route path="/tolov/natija/:orderId" element={protectedPage(<CheckoutResultPage />)} />
        <Route path="/profil" element={protectedPage(<ProfilePage />)} />
        <Route path="/portfolio" element={protectedPage(<PortfolioBuilderPage />)} />
        <Route path="/instruktor-boshlash" element={protectedPage(<InstructorApplyPage />)} />
        <Route path="/instruktor-panel" element={protectedPage(<InstructorDashboardPage />)} />
        <Route path="/instruktor-boshqaruv" element={protectedPage(<InstructorManagePage />)} />
        <Route path="/instruktor/kurs/:courseId" element={protectedPage(<InstructorCourseEditPage />)} />
        <Route path="/instruktor/review/:assignmentId" element={protectedPage(<InstructorReviewPage />)} />
        <Route path="/admin" element={protectedPage(<AdminDashboardPage />)} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppShell>
  );
}

export default App;
