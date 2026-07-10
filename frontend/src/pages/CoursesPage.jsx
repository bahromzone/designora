import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import SearchResultCard from "../components/SearchResultCard";
import { CourseCardSkeleton } from "../components/ui";
import { discoveryApi } from "../lib/api";

const LEVELS = [
  ["", "Barcha darajalar"],
  ["beginner", "Boshlang‘ich"],
  ["intermediate", "O‘rta"],
  ["advanced", "Yuqori"],
];
const LANGUAGES = [
  ["", "Barcha tillar"],
  ["uz", "O‘zbekcha"],
  ["ru", "Ruscha"],
  ["en", "Inglizcha"],
];
const SORTS = [
  ["newest", "Eng yangi"],
  ["popular", "Mashhur"],
  ["rating", "Reyting"],
  ["price_asc", "Narx: arzondan"],
  ["price_desc", "Narx: qimmatdan"],
  ["duration_asc", "Davomiylik: qisqadan"],
];
const PER_PAGE = 12;

function value(params, key) {
  return params.get(key) || "";
}

export default function CoursesPage() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(value(params, "q"));
  const [data, setData] = useState(null);
  const [options, setOptions] = useState({ categories: [], instructors: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const filters = useMemo(
    () => ({
      q: value(params, "q"),
      category: value(params, "category"),
      level: value(params, "level"),
      language: value(params, "language"),
      instructor_id: value(params, "instructor_id"),
      min_price: value(params, "min_price"),
      max_price: value(params, "max_price"),
      min_duration: value(params, "min_duration"),
      max_duration: value(params, "max_duration"),
      min_rating: value(params, "min_rating"),
      certificate: value(params, "certificate"),
      sort: value(params, "sort") || "newest",
      page: Number(value(params, "page")) || 1,
      per_page: PER_PAGE,
    }),
    [params],
  );

  const setFilter = useCallback(
    (key, nextValue) => {
      setParams((previous) => {
        const next = new URLSearchParams(previous);
        if (nextValue === "" || nextValue == null) next.delete(key);
        else next.set(key, nextValue);
        if (key !== "page") next.delete("page");
        return next;
      });
    },
    [setParams],
  );

  useEffect(() => {
    const timer = setTimeout(() => setFilter("q", query.trim()), 350);
    return () => clearTimeout(timer);
  }, [query, setFilter]);

  useEffect(() => {
    discoveryApi.filters().then(setOptions).catch(() => null);
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    discoveryApi
      .search(filters)
      .then((result) => active && setData(result))
      .catch((reason) => active && setError(reason.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [filters]);

  const reset = () => {
    setQuery("");
    setParams({});
  };
  const results = data?.results || [];
  const activeCount = [...params.keys()].filter((key) => key !== "page").length;

  return (
    <section className="shell py-16 sm:py-20">
      <header className="max-w-3xl">
        <p className="label">Katalog</p>
        <h1 className="font-serif text-3xl font-semibold text-ink sm:text-4xl">
          Kurslar katalogi
        </h1>
        <p className="mt-3 text-ink-60">
          Kategoriya, daraja, davomiylik, narx, til, reyting va instruktor bo‘yicha
          aniq kursni toping.
        </p>
      </header>

      <div className="mt-8 rounded-2xl border p-5" style={{ borderColor: "var(--border)" }}>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <input className="input lg:col-span-2" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Kurs nomi yoki kalit so‘z" aria-label="Kurs qidirish" />
          <select className="input" value={filters.category} onChange={(event) => setFilter("category", event.target.value)} aria-label="Kategoriya">
            <option value="">Barcha kategoriyalar</option>
            {options.categories.map((item) => <option key={item.category} value={item.category}>{item.category} ({item.count})</option>)}
          </select>
          <select className="input" value={filters.level} onChange={(event) => setFilter("level", event.target.value)} aria-label="Daraja">
            {LEVELS.map(([itemValue, label]) => <option key={itemValue} value={itemValue}>{label}</option>)}
          </select>
          <select className="input" value={filters.language} onChange={(event) => setFilter("language", event.target.value)} aria-label="Til">
            {LANGUAGES.map(([itemValue, label]) => <option key={itemValue} value={itemValue}>{label}</option>)}
          </select>
          <select className="input" value={filters.instructor_id} onChange={(event) => setFilter("instructor_id", event.target.value)} aria-label="Instruktor">
            <option value="">Barcha instruktorlar</option>
            {options.instructors.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <input className="input" type="number" min="0" value={filters.min_price} onChange={(event) => setFilter("min_price", event.target.value)} placeholder="Min narx" aria-label="Minimal narx" />
          <input className="input" type="number" min="0" value={filters.max_price} onChange={(event) => setFilter("max_price", event.target.value)} placeholder="Max narx" aria-label="Maksimal narx" />
          <input className="input" type="number" min="0" value={filters.min_duration} onChange={(event) => setFilter("min_duration", event.target.value)} placeholder="Min daqiqa" aria-label="Minimal davomiylik" />
          <input className="input" type="number" min="0" value={filters.max_duration} onChange={(event) => setFilter("max_duration", event.target.value)} placeholder="Max daqiqa" aria-label="Maksimal davomiylik" />
          <select className="input" value={filters.min_rating} onChange={(event) => setFilter("min_rating", event.target.value)} aria-label="Reyting">
            <option value="">Har qanday reyting</option>
            <option value="4">4★ va yuqori</option><option value="3">3★ va yuqori</option><option value="2">2★ va yuqori</option>
          </select>
          <label className="input flex items-center gap-2"><input type="checkbox" checked={filters.certificate === "true"} onChange={(event) => setFilter("certificate", event.target.checked ? "true" : "")} /> Sertifikat mavjud</label>
          <select className="input" value={filters.sort} onChange={(event) => setFilter("sort", event.target.value)} aria-label="Saralash">
            {SORTS.map(([itemValue, label]) => <option key={itemValue} value={itemValue}>{label}</option>)}
          </select>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-sm text-ink-60">{loading ? "Qidirilmoqda..." : `${data?.total || 0} ta kurs`} {activeCount ? `· ${activeCount} filtr` : ""}</span>
          {activeCount > 0 && <button className="btn-outline" onClick={reset}>Filtrlarni tozalash</button>}
        </div>
      </div>

      {loading ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <CourseCardSkeleton key={index} />)}</div>
      ) : error ? (
        <div className="mt-8 rounded-2xl border p-8" role="alert">{error}<button className="btn-outline ml-3" onClick={() => setFilter("page", String(filters.page))}>Qayta urinish</button></div>
      ) : results.length ? (
        <>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{results.map((course) => <SearchResultCard key={course.id} course={course} />)}</div>
          {data.pages > 1 && <nav className="mt-8 flex justify-center gap-2" aria-label="Sahifalar">{Array.from({ length: data.pages }, (_, index) => index + 1).map((item) => <button className={item === filters.page ? "btn-dark" : "btn-outline"} key={item} onClick={() => setFilter("page", String(item))}>{item}</button>)}</nav>}
        </>
      ) : (
        <div className="mt-8 rounded-2xl border p-10 text-center"><h2 className="font-serif text-2xl">Hech narsa topilmadi</h2><p className="mt-2 text-ink-60">Filtrlarni yumshating yoki tozalang.</p><button className="btn-dark mt-5" onClick={reset}>Filtrlarni tozalash</button></div>
      )}
    </section>
  );
}
