import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import SeoHead, { seoSiteUrl } from "../components/SeoHead";
import { Spinner } from "../components/ui";
import { blogApi } from "../lib/api";

function formatDate(iso) {
  if (!iso) return "";
  try { return new Date(iso).toLocaleDateString("uz-UZ", { year: "numeric", month: "long", day: "numeric" }); } catch { return ""; }
}

export default function BlogPostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    blogApi.getBySlug(slug).then((data) => {
      if (!active) return;
      setPost(data);
      const firstTag = data.tags?.split(",")[0]?.trim();
      return blogApi.list({ tag: firstTag, per_page: 4 }).then((response) => active && setRelated((response.results || []).filter((item) => item.slug !== slug).slice(0, 3)));
    }).catch((e) => active && setError(e.message)).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [slug]);

  const schemas = useMemo(() => {
    if (!post) return [];
    const url = `${seoSiteUrl}/blog/${post.slug}`;
    return [
      { "@context": "https://schema.org", "@type": "BlogPosting", headline: post.title, description: post.meta_description || post.excerpt, image: post.cover_image_url || `${seoSiteUrl}/og-default.svg`, datePublished: post.published_at, dateModified: post.updated_at || post.published_at, mainEntityOfPage: url, author: { "@type": "Organization", name: "Designora" }, publisher: { "@type": "Organization", name: "Designora", logo: { "@type": "ImageObject", url: `${seoSiteUrl}/brand-logo.png` } } },
      { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Bosh sahifa", item: seoSiteUrl },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${seoSiteUrl}/blog` },
        { "@type": "ListItem", position: 3, name: post.title, item: url },
      ] },
    ];
  }, [post]);

  if (loading) return <div className="container py-16"><Spinner /></div>;
  if (error || !post) return <div className="container py-16"><h1>{error || "Maqola topilmadi"}</h1><Link to="/blog">← Blogga qaytish</Link></div>;
  const tags = post.tags ? post.tags.split(",").map((tag) => tag.trim()).filter(Boolean) : [];

  return (
    <main className="container py-10">
      <SeoHead title={post.meta_title || post.title} description={post.meta_description || post.excerpt} path={`/blog/${post.slug}`} image={post.cover_image_url} type="article" structuredData={schemas} />
      <nav aria-label="Breadcrumb"><Link to="/blog">← Blog</Link> / <span>{post.title}</span></nav>
      <article>
        <header><h1>{post.title}</h1><p><time dateTime={post.published_at}>{formatDate(post.published_at)}</time> · {post.views || 0} ko‘rildi</p></header>
        {tags.length > 0 && <ul aria-label="Teglar">{tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>}
        {post.cover_image_url && <img src={post.cover_image_url} alt={`${post.title} maqolasi muqovasi`} />}
        {post.excerpt && <p><strong>{post.excerpt}</strong></p>}
        {post.body && <div style={{ whiteSpace: "pre-wrap" }}>{post.body}</div>}
      </article>
      <aside aria-labelledby="related-posts"><h2 id="related-posts">Mavzuga oid maqolalar</h2>{related.length ? <ul>{related.map((item) => <li key={item.slug}><Link to={`/blog/${item.slug}`}>{item.title}</Link></li>)}</ul> : <p><Link to="/blog">Barcha maqolalarni ko‘rish</Link> yoki <Link to="/kurslar">amaliy kurs tanlash</Link>.</p>}</aside>
    </main>
  );
}
