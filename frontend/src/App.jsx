import { Route, Routes } from "react-router-dom";

import AppShell from "./components/AppShell";
import ProtectedRoute from "./components/ProtectedRoute";
import CourseDetailPage from "./pages/CourseDetailPage";
import CoursesPage from "./pages/CoursesPage";
import HomePage from "./pages/HomePage";
import LearnPage from "./pages/LearnPage";
import LoginPage from "./pages/LoginPage";
import MyCoursesPage from "./pages/MyCoursesPage";
import NotFoundPage from "./pages/NotFoundPage";
import PortfolioPage from "./pages/PortfolioPage";
import ProfilePage from "./pages/ProfilePage";
import PublicPortfolioPage from "./pages/PublicPortfolioPage";
import RegisterPage from "./pages/RegisterPage";

function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/kurslar" element={<CoursesPage />} />
        <Route path="/kurslar/:courseId" element={<CourseDetailPage />} />
        <Route path="/kirish" element={<LoginPage />} />
        <Route path="/royxatdan-otish" element={<RegisterPage />} />
        <Route path="/portfolio/u/:userId" element={<PublicPortfolioPage />} />
        <Route path="/kurslarim" element={<ProtectedRoute><MyCoursesPage /></ProtectedRoute>} />
        <Route path="/organish/:courseId" element={<ProtectedRoute><LearnPage /></ProtectedRoute>} />
        <Route path="/portfolio" element={<ProtectedRoute><PortfolioPage /></ProtectedRoute>} />
        <Route path="/profil" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppShell>
  );
}

export default App;
