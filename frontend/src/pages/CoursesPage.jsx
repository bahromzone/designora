import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import CategoryChips from "../components/CategoryChips";
import RecommendationSection from "../components/RecommendationSection";
import SearchResultCard from "../components/SearchResultCard";
import { CourseCardSkeleton, Input, Pagination, Select } from "../components/ui";
import { discoveryApi } from "../lib/api";

const LEVEL_OPTIONS = [
  { value: "", label: "Barcha darajalar" },
  { value: "beginner", label: "Boshlang'ich" },
  { value: "intermediate", label: "O'rta" },
  { value: "advanced", label: "Yuqori" },
];

const LANGUAGE_OPTIONS = [
  { value: "", label: "Barcha tillar" },
  { value: "uz", label: "O'zbekcha" },
  { value: "ru", label: "Ruscha" },
  { value: "en", label: "Inglizcha" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Eng yangi" },
  { value: "rating", label: "Reyting bo'yicha" },
  { value: "popular", label: "Ommabop" },
  { value: "price_asc", label: "Narx: arzondan" },
  { value: "price_desc", label: "Narx: qimmatdan" },
];

const RATING_OPTIONS = [
  { value: "", label: "Har qanday reyting" },
  { value: "4", label: "4★ va yuqori" },
  { value: "3", label: "3★ va yuqori" },
  { value: "2", label: "2★ va yuqori" },
];

const PER_PAGE = 12;

// searchParams'dan bo'sh bo'lmagan qiymatlarni ajratib olish yordamchisi.
function paramValue(searchParams, key) {
  const v = searchParams.get(key);
  return v === null || v === "" ? "" : v;
}

export default function CoursesPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL — yagona haqiqat manbai (shareable + back tugmasi ishlaydi).
  const q = paramValue(searchParams, "q");
  const category = paramValue(searchParams, "category");
  const level = paramValue(searchParams, "level");
  const language = paramValue(searchParams, "language");
  const minRating = paramValue(searchParams, "min_rating");
  const sort = paramValue(searchParams, "sort") || "newest";
  const page = Number(paramValue(searchParams, "page")) || 1;

  // Qidiruv maydoni uchun lokal (debounce qilinadigan) holat.
  const [queryInput, setQueryInput] = useState(q);

  const [data, setData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Bitta filtrni yangilash — sahifani 1 ga qaytaradi (page dan tashqari).
  const setParam = useCallback(
    (key, value) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value === "" || value === null || value === undefined) {
            next.delete(key);
          } else {
            next.set(key, value);
          }
          if (key !== "page") next.delete("page");
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  // Qidiruv matnini debounce qilib URL'ga yozamiz.
  useEffect(() => {
    const id = setTimeout(() => {
      if (queryInput !== q) setParam("q", queryInput.trim());
    }, 400);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryInput]);

  // Kategoriyalarni bir marta yuklaymiz.
  useEffect(() => {
    discoveryApi
      .categories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  // Filtrlar o'zgarganda qidiruvni ishga tushiramiz.
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    discoveryApi
      .search({
        q: q || undefined,
        category: category || undefined,
        level: level || undefined,
        language: language || undefined,
        min_rating: minRating || undefined,
        sort,
        page,
        per_page: PER_PAGE,
      })
      .then((res) => active && setData(res))
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [q, category, level, language, minRating, sort, page]);

  const categoryOptions = [
    { value: "", label: "Barcha kategoriyalar" },
    ...categories.map((c) => ({
      value: c.category,
      label: `${c.category} (${c.count})`,
    })),
  ];

  const results = data?.results ?? [];
  const hasActiveFilters =
    q || category || level || language || minRating || sort !== "newest";

  function resetFilters() {
    setQueryInput("");
    setSearchParams({}, { replace: true });
  }

  return (
    <div className="shell py-12">
      {/* Header */}
      <div className="mb-8 max-w-2xl">
        <p className="label">Katalog</p>
        <h1 className="mt-2 text-4xl font-extrabold text-ink">
          Kurslar katalogi
        </h1>
        <p className="mt-3 text-muted">
          Kalit so'z, kategoriya, daraja va narx bo'yicha o'zingizga mos kursni
          toping.
        </p>
      </div>

      {/* Kategoriya chiplari */}
      <CategoryChips
        categories={categories}
        value={category}
        onChange={(c) => setParam("category", c)}
      />

      {/* Qidiruv + filtrlar */}
      <div className="card mb-8 rounded-2xl p-5">
        <Input
          name="q"
          value={queryInput}
          onChange={(e) => setQueryInput(e.target.value)}
          placeholder="Kurs nomi yoki kalit so'z bo'yicha qidirish..."
          aria-label="Qidirish"
        />

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Select
            name="category"
            options={categoryOptions}
            value={category}
            onChange={(e) => setParam("category", e.target.value)}
            aria-label="Kategoriya"
          />
          <Select
            name="level"
            options={LEVEL_OPTIONS}
            value={level}
            onChange={(e) => setParam("level", e.target.value)}
            aria-label="Daraja"
          />
          <Select
            name="language"
            options={LANGUAGE_OPTIONS}
            value={language}
            onChange={(e) => setParam("language", e.target.value)}
            aria-label="Til"
          />
          <Select
            name="min_rating"
            options={RATING_OPTIONS}
            value={minRating}
            onChange={(e) => setParam("min_rating", e.target.value)}
            aria-label="Minimal reyting"
          />
          <Select
            name="sort"
            options={SORT_OPTIONS}
            value={sort}
            onChange={(e) => setParam("sort", e.target.value)}
            aria-label="Saralash"
          />
        </div>

        {hasActiveFilters && (
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-muted">
              {loading
                ? "Qidirilmoqda..."
                : `${data?.total ?? 0} ta kurs topildi`}
            </span>
            <button
              type="button"
              onClick={resetFilters}
              className="btn-outline px-4 py-2 text-sm"
            >
              Filtrlarni tozalash
            </button>
          </div>
        )}
      </div>

      {/* Natijalar */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CourseCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="card rounded-2xl p-10 text-center">
          <p className="text-rose-600">{error}</p>
        </div>
      ) : results.length === 0 ? (
        <div className="card rounded-2xl p-12 text-center">
          <div className="text-5xl">🔍</div>
          <h3 className="mt-4 text-xl font-bold text-ink">
            Hech narsa topilmadi
          </h3>
          <p className="mt-2 text-muted">
            Boshqa kalit so'z yoki filtrlarni sinab ko'ring.
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="btn-primary mx-auto mt-6"
            >
              Filtrlarni tozalash
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((course) => (
              <SearchResultCard key={course.id} course={course} />
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

      {/* Tavsiya: ko'p sotilgan kurslar (faqat filtr yo'q bo'lganda) */}
      {!hasActiveFilters && (
        <RecommendationSection
          title="Ko'p sotilgan kurslar"
          subtitle="O'quvchilar eng ko'p tanlagan dasturlar"
          fetcher={() => discoveryApi.bestselling(6)}
          limit={3}
        />
      )}
    </div>
  );
}
