import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import SeoHead, { seoSiteUrl } from "../components/SeoHead";
import { useAuth } from "../context/AuthContext";
import { coursesApi, formatPrice, learningApi } from "../lib/api";

export default function CourseDetailPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enrolled, setEnrolled] = useState(false);

  const loadEnrollment = useCallback(async () => {
    if (!token) return;
    try {
      const response = await learningApi.learn(courseId, token);
      setEnrolled(Boolean(response.is_enrolled));
    } catch {
      setEnrolled(false);
    }
  }, [courseId, token]);

  useEffect(() => {
    coursesApi.detail(courseId).then(setCourse).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [courseId]);
  useEffect(() => { loadEnrollment(); }, [loadEnrollment]);

  const schemas = useMemo(() => {
    if (!course) return [];
    const url = `${seoSiteUrl}/kurslar/${course.id}`;
    const courseSchema = {
      "@context": "https://schema.org",
      "@type": "Course",
      name: course.title,
      description: course.description || course.subtitle,
      url,
      image: course.thumbnail_url || `${seoSiteUrl}/og-default.svg`,
      inLanguage: course.language || "uz",
      educationalLevel: course.level,
      provider: { "@type": "Organization", name: "Designora", url: seoSiteUrl },
      offers: { "@type": "Offer", category: "Paid", price: Number(course.price || 0), priceCurrency: "UZS", availability: "https://schema.org/InStock", url },
    };
    if (course.instructor_name) courseSchema.author = { "@type": "Person", name: course.instructor_name, url: `${seoSiteUrl}/instruktor/${course.instructor_id}` };
    if (Number(course.rating_count) > 0) courseSchema.aggregateRating = { "@type": "AggregateRating", ratingValue: Number(course.rating_avg), ratingCount: Number(course.rating_count) };
    return [
      courseSchema,
      { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Bosh sahifa", item: seoSiteUrl },
        { "@type": "ListItem", position: 2, name: "Kurslar", item: `${seoSiteUrl}/kurslar` },
        { "@type": "ListItem", position: 3, name: course.title, item: url },
      ] },
    ];
  }, [course]);

  if (loading) return <div className="container py-16">Kurs yuklanmoqda...</div>;
  if (error || !course) return <div className="container py-16">{error || "Kurs topilmadi"}</div>;

  const buy = () => {
    if (!isAuthenticated) return navigate("/kirish");
    if ((course.price || 0) > 0) return navigate(`/checkout/${courseId}`);
    learningApi.enroll(courseId, token).then(() => navigate(`/organish/${courseId}`)).catch((e) => setError(e.message));
  };

  return (
    <main className="container py-10">
      <SeoHead title={course.title} description={course.description || course.subtitle} path={`/kurslar/${course.id}`} image={course.thumbnail_url} type="product" structuredData={schemas} />
      <nav aria-label="Breadcrumb" className="mb-6"><Link to="/kurslar">← Kurslar</Link> / <span>{course.category || "Kurs"}</span></nav>
      <section className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <h1>{course.title}</h1>
          {course.subtitle && <p className="text-lg">{course.subtitle}</p>}
          <p>{course.description}</p>
          {course.instructor_id && <p>Instruktor: <Link to={`/instruktor/${course.instructor_id}`}>{course.instructor_name || "Profilni ko‘rish"}</Link></p>}
          <h2>Kurs dasturi</h2>
          {(course.modules || []).map((module) => <article key={module.id || module.title}><h3>{module.title}</h3><p>{(module.lessons || []).length} dars</p></article>)}
        </div>
        <aside className="card p-6">
          {course.thumbnail_url && <img src={course.thumbnail_url} alt={`${course.title} kursi muqovasi`} />}
          <strong>{formatPrice(course.price)}</strong>
          <button type="button" className="btn btn-primary w-full" onClick={buy}>{enrolled ? "O‘qishni davom ettirish" : "Kursga yozilish"}</button>
          <p>Aniq narx, promo code, xavfsiz to‘lov va chek.</p>
        </aside>
      </section>
    </main>
  );
}
