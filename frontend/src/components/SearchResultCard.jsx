import { Link } from "react-router-dom";

import { formatDuration, formatPrice } from "../lib/api";
import OptimizedImage from "./OptimizedImage";
import { Badge, Rating } from "./ui";

const LEVEL_LABEL = {
  beginner: "Boshlang'ich",
  intermediate: "O'rta",
  advanced: "Yuqori",
};

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
    <article className="course-card">
      <Link to={`/kurslar/${id}`} className="block">
        <div className="course-card__media">
          {thumbnailUrl ? (
            <OptimizedImage src={thumbnailUrl} alt={`${title} kursi muqovasi`} width={640} height={360} className="h-full w-full object-cover" />
          ) : (
            <div className="course-card__placeholder" aria-hidden="true">{title?.[0]?.toUpperCase() || "D"}</div>
          )}
          {level && <Badge>{LEVEL_LABEL[level] || level}</Badge>}
        </div>
        <div className="course-card__body">
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
          <div className="course-card__rating"><Rating value={ratingAvg} /><span>{Number(ratingAvg).toFixed(1)}{ratingCount ? ` (${ratingCount})` : ""}</span></div>
          <div className="course-card__meta"><span>{studentsCount} o‘quvchi</span>{durationMinutes ? <span>{formatDuration(durationMinutes)}</span> : null}</div>
          <strong>{formatPrice(price)}</strong>
        </div>
      </Link>
    </article>
  );
}
