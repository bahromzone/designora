import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import SearchResultCard from "../components/SearchResultCard";
import SeoHead, { seoSiteUrl } from "../components/SeoHead";
import { EmptyState, Spinner } from "../components/ui";
import { instructorsApi } from "../lib/api";

export default function InstructorPage() {
  const { instructorId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    setError("");
    instructorsApi.get(instructorId).then((res) => active && setData(res)).catch((e) => active && setError(e.message)).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [instructorId]);
  useEffect(() => load(), [load]);

  const schemas = useMemo(() => {
    if (!data) return [];
    const url = `${seoSiteUrl}/instruktor/${data.id}`;
    return [
      { "@context": "https://schema.org", "@type": "Person", name: data.name, description: data.bio, image: data.avatar_url, url, sameAs: data.website ? [data.website] : [], jobTitle: "Design instructor", worksFor: { "@type": "Organization", name: "Designora" }, knowsAbout: (data.courses || []).map((course) => course.title) },
      { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Bosh sahifa", item: seoSiteUrl },
        { "@type": "ListItem", position: 2, name: "Instruktorlar", item: `${seoSiteUrl}/kurslar` },
        { "@type": "ListItem", position: 3, name: data.name, item: url },
      ] },
    ];
  }, [data]);

  if (loading) return <div className="container py-16"><Spinner /></div>;
  if (error || !data) return <div className="container py-16"><EmptyState title={error || "Instruktor topilmadi"} /><Link to="/kurslar">← Katalogga qaytish</Link></div>;

  const courses = data.courses || [];
  return (
    <main className="container py-10">
      <SeoHead title={`${data.name}, instruktor`} description={data.bio || `${data.name}ning Designora kurslari va tajribasi`} path={`/instruktor/${data.id}`} image={data.avatar_url} type="profile" structuredData={schemas} />
      <nav aria-label="Breadcrumb"><Link to="/kurslar">Kurslar</Link> / <span>{data.name}</span></nav>
      <section className="card p-8 text-center">
        {data.avatar_url ? <img src={data.avatar_url} alt={`${data.name} profil rasmi`} className="mx-auto rounded-full" /> : <div aria-hidden="true">{data.name?.charAt(0)?.toUpperCase() || "D"}</div>}
        <p>Instruktor</p><h1>{data.name}</h1>
        {data.location && <p>📍 {data.location}</p>}
        {data.website && <a href={data.website} rel="me noopener noreferrer">Shaxsiy sayt</a>}
        {data.bio && <p>{data.bio}</p>}
        <dl><div><dt>Kurslar</dt><dd>{data.courses_count || courses.length}</dd></div><div><dt>O‘quvchilar</dt><dd>{data.total_students || 0}</dd></div><div><dt>O‘rtacha reyting</dt><dd>{Number(data.avg_rating || 0).toFixed(1)}</dd></div></dl>
      </section>
      <section><h2>{data.name} kurslari</h2>{courses.length ? courses.map((course) => <SearchResultCard key={course.id} item={course} />) : <EmptyState title="Hozircha kurslar yo‘q" />}</section>
    </main>
  );
}
