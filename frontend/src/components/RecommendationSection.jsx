import { useEffect, useState } from "react";

import { CourseCardSkeleton } from "./ui";
import SearchResultCard from "./SearchResultCard";

/**
 * Qayta ishlatiladigan tavsiya bloki.
 *
 * Props:
 *   title    — blok sarlavhasi (masalan "Ko'p sotilgan kurslar")
 *   subtitle — ixtiyoriy tavsif
 *   fetcher  — () => Promise<course[]>  (discoveryApi.bestselling / .similar)
 *   limit    — nechta skeleton ko'rsatish (default 3)
 *
 * Xato yoki bo'sh natijada butun blok yashiriladi — sahifa layouti buzilmaydi.
 */
export default function RecommendationSection({
  title,
  subtitle,
  fetcher,
  limit = 3,
}) {
  const [items, setItems] = useState(null); // null = hali yuklanmoqda
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setItems(null);
    setFailed(false);
    Promise.resolve()
      .then(fetcher)
      .then((res) => {
        if (!active) return;
        setItems(Array.isArray(res) ? res : (res?.results ?? []));
      })
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Xato yoki bo'sh — blokni umuman ko'rsatmaymiz.
  if (failed) return null;
  if (items && items.length === 0) return null;

  const loading = items === null;

  return (
    <section className="mt-16">
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold text-ink">{title}</h2>
        {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: limit }).map((_, i) => (
              <CourseCardSkeleton key={i} />
            ))
          : items.map((course) => (
              <SearchResultCard key={course.id} course={course} />
            ))}
      </div>
    </section>
  );
}
