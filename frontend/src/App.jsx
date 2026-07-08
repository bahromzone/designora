import { Route, Routes } from "react-router-dom";

import AppShell from "./components/AppShell";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import BlogListPage from "./pages/BlogListPage";
import BlogPostPage from "./pages/BlogPostPage";
import CheckoutResultPage from "./pages/CheckoutResultPage";
import CourseDetailPage from "./pages/CourseDetailPage";
import CoursesPage from "./pages/CoursesPage";
import ForumListPage from "./pages/ForumListPage";
import ForumThreadPage from "./pages/ForumThreadPage";
import HomePage from "./pages/HomePage";
import InstructorCourseEditPage from "./pages/InstructorCourseEditPage";
import InstructorDashboardPage from "./pages/InstructorDashboardPage";
import InstructorManagePage from "./pages/InstructorManagePage";
import InstructorPage from "./pages/InstructorPage";
import LearnPage from "./pages/LearnPage";
import LoginPage from "./pages/LoginPage";
import MyCoursesPage from "./pages/MyCoursesPage";
import NotFoundPage from "./pages/NotFoundPage";
import ProfilePage from "./pages/ProfilePage";
import RegisterPage from "./pages/RegisterPage";
import VerifyPage from "./pages/VerifyPage";

function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/kurslar" element={<CoursesPage />} />
        <Route path="/kurslar/:courseId" element={<CourseDetailPage />} />
        <Route path="/instruktor/:instructorId" element={<InstructorPage />} />
        <Route path="/blog" element={<BlogListPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="/forum" element={<ForumListPage />} />
        <Route path="/forum/:threadId" element={<ForumThreadPage />} />
        <Route path="/kirish" element={<LoginPage />} />
        <Route path="/royxatdan-otish" element={<RegisterPage />} />
        <Route path="/verify/:code" element={<VerifyPage />} />
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
    </AppShell>
  );
}

export default App;
