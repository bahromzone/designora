import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";
import SearchShortcut from "./components/SearchShortcut";

const AboutPage = lazy(() => import("./pages/AboutPage"));
const AdminAnalyticsPage = lazy(() => import("./pages/AdminAnalyticsPage"));
const AdminCoursesPage = lazy(() => import("./pages/AdminCoursesPage"));
const AdminDashboardPage = lazy(() => import("./pages/AdminDashboardPage"));
const AdminModerationPage = lazy(() => import("./pages/AdminModerationPage"));
const AdminPaymentsPage = lazy(() => import("./pages/AdminPaymentsPage"));
const AdminUsersPage = lazy(() => import("./pages/AdminUsersPage"));
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
const HomePage = lazy(() => import("./pages/HomePage"));
const InstructorAnalyticsPage = lazy(() =>
  import("./pages/InstructorAnalyticsPage")
);
const InstructorApplyPage = lazy(() => import("./pages/InstructorApplyPage"));
const InstructorApplicationsPage = lazy(() =>
  import("./pages/InstructorApplicationsPage")
);
const InstructorCourseEditPage = lazy(() =>
  import("./pages/InstructorCourseEditPage")
);
const InstructorDashboardPage = lazy(() =>
  import("./pages/InstructorDashboardPage")
);
const InstructorManagePage = lazy(() =>
  import("./pages/InstructorManagePage")
);
const InstructorPage = lazy(() => import("./pages/InstructorPage"));
const InstructorReviewPage = lazy(() => import("./pages/InstructorReviewPage"));
const LearnPage = lazy(() => import("./pages/LearnPage"));
const LearningPathDetailPage = lazy(() =>
  import("./pages/LearningPathDetailPage")
);
const LearningPathsPage = lazy(() => import("./pages/LearningPathsPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const PortfolioBuilderPage = lazy(() => import("./pages/PortfolioBuilderPage"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const PublicPortfolioPage = lazy(() => import("./pages/PublicPortfolioPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const StudentDashboardPage = lazy(() => import("./pages/StudentDashboardPage"));
const SuperadminAuditPage = lazy(() => import("./pages/SuperadminAuditPage"));
const SuperadminDashboardPage = lazy(() =>
  import("./pages/SuperadminDashboardPage")
);
const TermsPage = lazy(() => import("./pages/TermsPage"));
const VerifyPage = lazy(() => import("./pages/VerifyPage"));

const p = (x) => <ProtectedRoute>{x}</ProtectedRoute>;
const ad = (x) => <RoleRoute roles={["admin", "superadmin"]}>{x}</RoleRoute>;
const sa = (x) => <RoleRoute roles={["superadmin"]}>{x}</RoleRoute>;
const ins = (x) => (
  <RoleRoute roles={["instructor", "admin", "superadmin"]}>{x}</RoleRoute>
);

function RouteFallback() {
  return (
    <div className="shell py-24" role="status" aria-live="polite">
      Sahifa yuklanmoqda...
    </div>
  );
}

export default function App() {
  return (
    <AppShell>
      <SearchShortcut />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/qidiruv" element={<GlobalSearchPage />} />
          <Route path="/kurslar" element={<CoursesPage />} />
          <Route path="/kurslar/:courseId" element={<CourseDetailPage />} />
          <Route
            path="/community/:courseId"
            element={p(<CourseCommunityPage />)}
          />
          <Route
            path="/community/:courseId/thread/:threadId"
            element={p(<CourseCommunityPage />)}
          />
          <Route path="/checkout/:courseId" element={p(<CheckoutPage />)} />
          <Route path="/learning-paths" element={<LearningPathsPage />} />
          <Route
            path="/learning-paths/:slug"
            element={<LearningPathDetailPage />}
          />
          <Route path="/calendar" element={p(<CalendarPage />)} />
          <Route path="/blog" element={<BlogListPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/forum" element={<ForumListPage />} />
          <Route path="/forum/:threadId" element={<ForumThreadPage />} />
          <Route
            path="/instruktor/:instructorId"
            element={<InstructorPage />}
          />
          <Route path="/biz-haqimizda" element={<AboutPage />} />
          <Route path="/maxfiylik" element={<PrivacyPage />} />
          <Route path="/shartlar" element={<TermsPage />} />
          <Route
            path="/kirish"
            element={<Navigate to="/?modal=login" replace />}
          />
          <Route
            path="/royxatdan-otish"
            element={<Navigate to="/?modal=signup" replace />}
          />
          <Route path="/verify/:code" element={<VerifyPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route
            path="/portfolio/u/:userId"
            element={<PublicPortfolioPage />}
          />
          <Route path="/kurslarim" element={p(<StudentDashboardPage />)} />
          <Route path="/organish/:courseId" element={p(<LearnPage />)} />
          <Route
            path="/tolov/natija/:orderId"
            element={p(<CheckoutResultPage />)}
          />
          <Route path="/profil" element={p(<ProfilePage />)} />
          <Route path="/portfolio" element={p(<PortfolioBuilderPage />)} />
          <Route
            path="/instruktor-boshlash"
            element={p(<InstructorApplyPage />)}
          />
          <Route
            path="/instruktor-panel"
            element={ins(<InstructorDashboardPage />)}
          />
          <Route
            path="/instruktor-analytics"
            element={ins(<InstructorAnalyticsPage />)}
          />
          <Route
            path="/instruktor-boshqaruv"
            element={ins(<InstructorManagePage />)}
          />
          <Route
            path="/instruktor/kurs/:courseId"
            element={ins(<InstructorCourseEditPage />)}
          />
          <Route
            path="/instruktor/review/:assignmentId"
            element={ins(<InstructorReviewPage />)}
          />
          <Route path="/admin" element={ad(<AdminDashboardPage />)} />
          <Route path="/admin/courses" element={ad(<AdminCoursesPage />)} />
          <Route path="/admin/users" element={ad(<AdminUsersPage />)} />
          <Route
            path="/admin/instructor-applications"
            element={ad(<InstructorApplicationsPage />)}
          />
          <Route path="/admin/payments" element={ad(<AdminPaymentsPage />)} />
          <Route
            path="/admin/moderation"
            element={ad(<AdminModerationPage />)}
          />
          <Route
            path="/admin/analytics"
            element={ad(<AdminAnalyticsPage />)}
          />
          <Route
            path="/superadmin"
            element={sa(<SuperadminDashboardPage />)}
          />
          <Route
            path="/superadmin/users"
            element={sa(<AdminUsersPage />)}
          />
          <Route
            path="/superadmin/audit"
            element={sa(<SuperadminAuditPage />)}
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </AppShell>
  );
}
