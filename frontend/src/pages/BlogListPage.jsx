import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { blogApi } from "../lib/api";
import { CourseCardSkeleton, EmptyState, Pagination } from "../components/ui";

const PER_PAGE = 9;

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

function PostCard({ post }) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border transition-transform hover:-translate-y-1"
      style={{ borderColor: "var(--border)" }}
    >
      <div className="aspect-[16/9] bg-surface">
        {post.cover_image_url ? (
          <img
            src={post.cover_image_url}
            alt={post.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-sm"
            style={{ color: "var(--muted)" }}
          >
            Designora Blog
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        {post.tags && (
          <span className="label mb-2">{post.tags.split(",")[0].trim()}</span>
        )}
        <h3 className="font-serif text-lg font-semibold text-ink group-hover:underline">
          {post.title}
        </h3>
        {post.excerpt && (
          <p
            className="mt-2 line-clamp-3 flex-1 text-sm leading-6"
            style={{ color: "var(--ink-60)" }}
          >
            {post.excerpt}
          </p>
        )}
        <p className="mt-4 text-xs" style={{ color: "var(--muted)" }}>
          {formatDate(post.published_at)} · {post.views || 0} ko'rildi
        </p>
      </div>
    </Link>
  );
}

export default function BlogListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tag = searchParams.get("tag") || "";
  const page = Number(searchParams.get("page")) || 1;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const setParam = useCallback(
    (key, value) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (!value) next.delete(key);
          else next.set(key, value);
          if (key !== "page") next.delete("page");
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    blogApi
      .list({ tag: tag || undefined, page, per_page: PER_PAGE })
      .then((res) => active && setData(res))
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [tag, page]);

  const results = data?.results ?? [];

  return (
    <section className="shell py-16 sm:py-20">
      <div className="mb-10">
        <p className="label mb-3">Blog</p>
        <h1
          className="font-serif font-semibold text-ink leading-tight"
          style={{ fontSize: "clamp(2rem,4.5vw,3rem)" }}
        >
          Maqolalar va yangiliklar
        </h1>
        <p className="mt-3 text-lg leading-8" style={{ color: "var(--ink-60)" }}>
          Dizayn, karyera va Designora hamjamiyati haqida.
        </p>
        {tag && (
          <button
            onClick={() => setParam("tag", "")}
            className="mt-4 inline-block text-sm font-semibold"
            style={{ color: "var(--amber)" }}
          >
            “{tag}” tegi tozalansin ✕
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CourseCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div
          className="rounded-2xl px-6 py-5 text-sm"
          style={{ background: "#fff0ef", color: "#c0392b" }}
        >
          {error}
        </div>
      ) : results.length === 0 ? (
        <EmptyState
          icon="📝"
          title="Hozircha maqola yo'q"
          description="Tez orada yangi maqolalar chiqadi."
        />
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
          <div className="mt-10">
            <Pagination
              page={page}
              pages={data?.pages ?? 1}
              onChange={(p) => setParam("page", String(p))}
            />
          </div>
        </>
      )}
    </section>
  );
}
