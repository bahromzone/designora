import RecentNoteCard from "../components/RecentNoteCard";
import DashboardInsights from "./DashboardInsights";
import MyCoursesPage from "./MyCoursesPage";

export default function StudentDashboardPage() {
  return (
    <>
      <MyCoursesPage />
      <RecentNoteCard />
      <DashboardInsights />
    </>
  );
}
