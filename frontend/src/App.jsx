import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import AppShell from "./components/AppShell";
import ProtectedRoute from "./components/ProtectedRoute";
import RouteFallback from "./components/RouteFallback";
import SearchShortcut from "./components/SearchShortcut";
import HomePage from "./pages/HomePage";

const AboutPage = lazy(() => import("./pages/AboutPage"));
const AchievementsPage = lazy(() => import("./pages/AchievementsPage"));
const AdminDashboardPage = lazy(() => import("./pages/AdminDashboardPage"));
const AuthCallbackPage = lazy(() => import("./pages/AuthCallbackPage"));
const BlogListPage = lazy(() => import("./pages/BlogListPage"));
const BlogPostPage = lazy(() => import("./pages/BlogPostPage"));
const CalendarPage = lazy(() => import("./pages/CalendarPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const CheckoutResultPage = lazy(() => import("./pages/CheckoutResultPage"));
const CourseCommunityPage = lazy(() => import("./pages/CourseCommunityPage"));
const CourseDetailPage = lazy(() => import("./pages/CourseDetailPage"));
const CoursesPage = lazy(() => import("./pages/CoursesPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ForumListPage = lazy(() => import("./pages/ForumListPage"));
const ForumThreadPage = lazy(() => import("./pages/ForumThreadPage"));
const GlobalSearchPage = lazy(() => import("./pages/GlobalSearchPage"));
const InstructorAnalyticsPage = lazy(() => import("./pages/InstructorAnalyticsPage"));
const InstructorApplyPage = lazy(() => import("./pages/InstructorApplyPage"));
const InstructorCourseEditPage = lazy(() => import("./pages/InstructorCourseEditPage"));
const InstructorDashboardPage = lazy(() => import("./pages/InstructorDashboardPage"));
const InstructorManagePage = lazy(() => import("./pages/InstructorManagePage"));
const InstructorPage = lazy(() => import("./pages/InstructorPage"));
const InstructorReviewPage = lazy(() => import("./pages/InstructorReviewPage"));
const LearnPage = lazy(() => import("./pages/LearnPage"));
const LearningPathDetailPage = lazy(() => import("./pages/LearningPathDetailPage"));
const LearningPathsPage = lazy(() => import("./pages/LearningPathsPage"));
const ModerationPage = lazy(() => import("./pages/ModerationPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const PortfolioBuilderPage = lazy(() => import("./pages/PortfolioBuilderPage"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const PublicPortfolioPage = lazy(() => import("./pages/PublicPortfolioPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const StudentDashboardPage = lazy(() => import("./pages/StudentDashboardPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const VerifyPage = lazy(() => import("./pages/VerifyPage"));

const protectedPage = (element) => <ProtectedRoute>{element}</ProtectedRoute>;

export default function App() {
  return (
    <AppShell>
      <SearchShortcut />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/achievements" element={protectedPage(<AchievementsPage />)} />
          <Route path="/qidiruv" element={<GlobalSearchPage />} />
          <Route path="/kurslar" element={<CoursesPage />} />
          <Route path="/kurslar/:courseId" element={<CourseDetailPage />} />
          <Route path="/community/:courseId" element={protectedPage(<CourseCommunityPage />)} />
          <Route path="/community/:courseId/thread/:threadId" element={protectedPage(<CourseCommunityPage />)} />
          <Route path="/checkout/:courseId" element={protectedPage(<CheckoutPage />)} />
          <Route path="/learning-paths" element={<LearningPathsPage />} />
          <Route path="/learning-paths/:slug" element={<LearningPathDetailPage />} />
          <Route path="/calendar" element={protectedPage(<CalendarPage />)} />
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
          <Route path="/instruktor-analytics" element={protectedPage(<InstructorAnalyticsPage />)} />
          <Route path="/instruktor-boshqaruv" element={protectedPage(<InstructorManagePage />)} />
          <Route path="/instruktor/kurs/:courseId" element={protectedPage(<InstructorCourseEditPage />)} />
          <Route path="/instruktor/review/:assignmentId" element={protectedPage(<InstructorReviewPage />)} />
          <Route path="/admin" element={protectedPage(<AdminDashboardPage />)} />
          <Route path="/admin/moderation" element={protectedPage(<ModerationPage />)} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </AppShell>
  );
}
