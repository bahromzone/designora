import { Link } from "react-router-dom";

import { formatDuration, formatPrice } from "../lib/api";
import { Badge, Rating } from "./ui";

const LEVEL_LABEL = {
  beginner: "Boshlang'ich",
  intermediate: "O'rta",
  advanced: "Yuqori",
};

/**
 * Katalog/qidiruv natijasi uchun kurs kartasi.
 * Discovery `_card` maydonlariga mos: rating_avg, rating_count,
 * students_count, price, level, duration_minutes, thumbnail_url.
 */
export default function SearchResultCard({ course }) {
  const {
    id,
    title,
    subtitle,
    price,
    level,
    thumbnail_url: thumbnailUrl,
    rating_avg: ratingAvg = 0,
    rating_count: ratingCount = 0,
    students_count: studentsCount = 0,
    duration_minutes: durationMinutes = 0,
  } = course;

  return (
    <Link
      to={`/kurslar/${id}`}
      className="card group flex flex-col overflow-hidden rounded-2xl transition-transform duration-300 hover:-translate-y-1"
    >
      <div className="relative aspect-video overflow-hidden bg-surface">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-4xl font-extrabold text-white"
            style={{
              backgroundImage:
                "linear-gradient(135deg,#ec4899 0%,#a855f7 50%,#4f46e5 100%)",
            }}
          >
            {title?.[0]?.toUpperCase() ?? "D"}
          </div>
        )}
        {level && (
          <span className="absolute left-3 top-3">
            <Badge tone="brand">{LEVEL_LABEL[level] ?? level}</Badge>
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 text-lg font-bold text-ink transition-colors group-hover:text-violet-700">
          {title}
        </h3>
        {subtitle && (
          <p className="mt-1 line-clamp-2 text-sm text-muted">{subtitle}</p>
        )}

        <div className="mt-3 flex items-center gap-2 text-sm">
          <Rating value={ratingAvg} size="sm" />
          <span className="text-muted">
            {Number(ratingAvg).toFixed(1)}
            {ratingCount ? ` (${ratingCount})` : ""}
          </span>
        </div>

        <div className="mt-auto flex items-center justify-between pt-4 text-sm text-muted">
          <span>{studentsCount} o'quvchi</span>
          {durationMinutes ? (
            <span>{formatDuration(durationMinutes)}</span>
          ) : null}
        </div>

        <div className="text-gradient mt-3 text-xl font-extrabold">
          {formatPrice(price)}
        </div>
      </div>
    </Link>
  );
}
