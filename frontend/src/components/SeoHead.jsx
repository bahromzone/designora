import { useEffect } from "react";

const SITE_NAME = "Designora";
const SITE_URL = (import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/$/, "");
const DEFAULT_IMAGE = `${SITE_URL}/og-default.svg`;

function setMeta(selector, attributes) {
  let node = document.head.querySelector(selector);
  if (!node) {
    node = document.createElement("meta");
    document.head.appendChild(node);
  }
  Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
  return node;
}

function absoluteUrl(value) {
  if (!value) return DEFAULT_IMAGE;
  try {
    return new URL(value, SITE_URL).toString();
  } catch {
    return DEFAULT_IMAGE;
  }
}

export function getCanonicalUrl(path = window.location.pathname) {
  const clean = `/${String(path).split(/[?#]/)[0].replace(/^\/+|\/+$/g, "")}`;
  return `${SITE_URL}${clean === "/" ? "" : clean}`;
}

export default function SeoHead({
  title,
  description,
  path,
  image,
  type = "website",
  robots = "index,follow,max-image-preview:large",
  structuredData = [],
}) {
  useEffect(() => {
    const fullTitle = title?.includes(SITE_NAME) ? title : `${title || "Onlayn dizayn ta'limi"} | ${SITE_NAME}`;
    const canonical = getCanonicalUrl(path);
    const imageUrl = absoluteUrl(image);
    document.title = fullTitle;

    setMeta('meta[name="description"]', { name: "description", content: description || "Designora bilan dizaynni amaliy kurslar orqali o'rganing." });
    setMeta('meta[name="robots"]', { name: "robots", content: robots });
    setMeta('meta[property="og:title"]', { property: "og:title", content: fullTitle });
    setMeta('meta[property="og:description"]', { property: "og:description", content: description || "Designora onlayn dizayn ta'lim platformasi" });
    setMeta('meta[property="og:type"]', { property: "og:type", content: type });
    setMeta('meta[property="og:url"]', { property: "og:url", content: canonical });
    setMeta('meta[property="og:image"]', { property: "og:image", content: imageUrl });
    setMeta('meta[property="og:image:alt"]', { property: "og:image:alt", content: `${title || SITE_NAME} muqovasi` });
    setMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
    setMeta('meta[name="twitter:title"]', { name: "twitter:title", content: fullTitle });
    setMeta('meta[name="twitter:description"]', { name: "twitter:description", content: description || "Designora onlayn dizayn ta'lim platformasi" });
    setMeta('meta[name="twitter:image"]', { name: "twitter:image", content: imageUrl });

    let canonicalNode = document.head.querySelector('link[rel="canonical"]');
    if (!canonicalNode) {
      canonicalNode = document.createElement("link");
      canonicalNode.rel = "canonical";
      document.head.appendChild(canonicalNode);
    }
    canonicalNode.href = canonical;

    document.head.querySelectorAll('script[data-designora-seo="true"]').forEach((node) => node.remove());
    const schemas = Array.isArray(structuredData) ? structuredData : [structuredData];
    schemas.filter(Boolean).forEach((schema) => {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.dataset.designoraSeo = "true";
      script.textContent = JSON.stringify(schema).replace(/</g, "\\u003c");
      document.head.appendChild(script);
    });
  }, [description, image, path, robots, structuredData, title, type]);

  return null;
}

export const seoSiteUrl = SITE_URL;
