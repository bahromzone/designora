import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import AppShell from "./components/AppShell";
import ProtectedRoute from "./components/ProtectedRoute";
import RouteFallback from "./components/RouteFallback";
import SearchShortcut from "./components/SearchShortcut";

const HomePage = lazy(() => import("./pages/HomePage"));
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
const SupportConsolePage = lazy(() => import("./pages/SupportConsolePage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const VerifyPage = lazy(() => import("./pages/VerifyPage"));

const protectedPage = (element) => <ProtectedRoute>{element}</ProtectedRoute>;

export default function App() {
  return (
    <>
      <SearchShortcut />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/register" element={protectedPage(<StudentDashboardPage />)} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/blog" element={<BlogListPage />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />
            <Route path="/kurslar" element={<CoursesPage />} />
            <Route path="/kurslar/:slug" element={protectedPage(<CourseDetailPage />)} />
            <Route path="/checkout/:courseId" element={protectedPage(<CheckoutPage />)} />
            <Route path="/checkout/result" element={protectedPage(<CheckoutResultPage />)} />
            <Route path="/learn/:courseId" element={protectedPage(<LearnPage />)} />
            <Route path="/my-courses" element={protectedPage(<StudentDashboardPage />)} />
            <Route path="/profile" element={protectedPage(<ProfilePage />)} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify" element={<VerifyPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/search" element={<GlobalSearchPage />} />
            <Route path="/achievements" element={protectedPage(<AchievementsPage />)} />
            <Route path="/calendar" element={protectedPage(<CalendarPage />)} />
            <Route path="/community/:courseId" element={protectedPage(<CourseCommunityPage />)} />
            <Route path="/forum" element={protectedPage(<ForumListPage />)} />
            <Route path="/forum/:threadId" element={protectedPage(<ForumThreadPage />)} />
            <Route path="/learning-paths" element={<LearningPathsPage />} />
            <Route path="/learning-paths/:id" element={<LearningPathDetailPage />} />
            <Route path="/portfolio" element={protectedPage(<PortfolioBuilderPage />)} />
            <Route path="/portfolio/:userId" element={<PublicPortfolioPage />} />
            <Route path="/instructor/apply" element={protectedPage(<InstructorApplyPage />)} />
            <Route path="/instructor/:id" element={<InstructorPage />} />
            <Route path="/instructor/dashboard" element={protectedPage(<InstructorDashboardPage />)} />
            <Route path="/instructor/analytics" element={protectedPage(<InstructorAnalyticsPage />)} />
            <Route path="/instructor/courses/:id/edit" element={protectedPage(<InstructorCourseEditPage />)} />
            <Route path="/instructor/manage" element={protectedPage(<InstructorManagePage />)} />
            <Route path="/instructor/review" element={protectedPage(<InstructorReviewPage />)} />
            <Route path="/admin" element={protectedPage(<AdminDashboardPage />)} />
            <Route path="/admin/moderation" element={protectedPage(<ModerationPage />)} />
            <Route path="/admin/support" element={protectedPage(<SupportConsolePage />)} />
            <Route path="/dashboard" element={<Navigate to="/my-courses" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}
