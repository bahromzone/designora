import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { learningApi } from "../lib/api";
import "./StudentDashboard.css";

export default function MyCoursesPage() {
  const { token, user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!token) return;
    learningApi.myCourses(token).then(setCourses).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, [token]);
  const firstName = (user?.name || user?.full_name || "Talaba").trim().split(" ")[0];
  if (loading) return <section className="student-dashboard"><p>Kurslar yuklanmoqda...</p></section>;
  if (error) return <section className="student-dashboard"><div role="alert"><h1>Dashboard ochilmadi</h1><p>{error}</p></div></section>;
  return <section className="student-dashboard"><header className="dashboard-heading"><div><p className="dashboard-eyebrow">Shaxsiy kabinet</p><h1>Salom, {firstName}.</h1></div><Link to="/kurslar" className="dashboard-secondary">Yangi kurs topish</Link></header>{courses.length ? <div className="course-list">{courses.map((course) => <Link key={course.course_id} to={`/organish/${course.course_id}`} className="course-row"><div className="course-row-copy"><strong>{course.title}</strong><span>{course.progress_percent || 0}% bajarildi</span></div></Link>)}</div> : <div className="dashboard-empty"><h1>Birinchi loyihangiz shu yerdan boshlanadi.</h1><Link to="/kurslar" className="dashboard-primary">Kurslarni ko‘rish</Link></div>}</section>;
}
