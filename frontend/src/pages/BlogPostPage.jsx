import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { blogApi } from "../lib/api";
import { Spinner } from "../components/ui";

function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("uz-UZ", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export default function BlogPostPage() {
  const { slug } = useParams();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    blogApi
      .getBySlug(slug)
      .then((data) => active && setPost(data))
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <section className="flex min-h-[50vh] items-center justify-center">
        <Spinner />
      </section>
    );
  }

  if (error || !post) {
    return (
      <section className="shell py-24">
        <div
          className="rounded-2xl px-6 py-5 text-sm"
          style={{ background: "#fff0ef", color: "#c0392b" }}
        >
          {error || "Maqola topilmadi"}
        </div>
        <Link
          to="/blog"
          className="mt-4 inline-block text-sm font-semibold"
          style={{ color: "var(--amber)" }}
        >
          ← Blogga qaytish
        </Link>
      </section>
    );
  }

  const tags = post.tags
    ? post.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  return (
    <article className="shell max-w-3xl py-16 sm:py-20">
      <Link
        to="/blog"
        className="mb-6 inline-block text-sm font-semibold"
        style={{ color: "var(--muted)" }}
      >
        ← Blog
      </Link>

      <h1
        className="font-serif font-semibold text-ink leading-tight"
        style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)" }}
      >
        {post.title}
      </h1>

      <p className="mt-4 text-sm" style={{ color: "var(--muted)" }}>
        {formatDate(post.published_at)} · {post.views || 0} ko'rildi
      </p>

      {tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((t) => (
            <Link
              key={t}
              to={`/blog?tag=${encodeURIComponent(t)}`}
              className="rounded-full border px-3 py-1 text-xs font-semibold transition-colors hover:border-violet-300"
              style={{ borderColor: "var(--border)", color: "var(--ink-60)" }}
            >
              {t}
            </Link>
          ))}
        </div>
      )}

      {post.cover_image_url && (
        <img
          src={post.cover_image_url}
          alt={post.title}
          className="mt-8 w-full rounded-2xl object-cover"
        />
      )}

      {post.excerpt && (
        <p
          className="mt-8 text-lg font-medium leading-8"
          style={{ color: "var(--ink-60)" }}
        >
          {post.excerpt}
        </p>
      )}

      {post.body && (
        <div
          className="mt-6 whitespace-pre-wrap text-base leading-8"
          style={{ color: "var(--ink)" }}
        >
          {post.body}
        </div>
      )}
    </article>
  );
}
