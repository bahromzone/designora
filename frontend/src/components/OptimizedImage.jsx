function unsplashUrl(src, width, quality) {
  try {
    const url = new URL(src);
    if (!url.hostname.endsWith("unsplash.com")) return src;
    url.searchParams.set("auto", "format");
    url.searchParams.set("fit", "crop");
    url.searchParams.set("w", String(width));
    url.searchParams.set("q", String(quality));
    return url.toString();
  } catch {
    return src;
  }
}

export default function OptimizedImage({
  src,
  alt,
  width = 640,
  height = 360,
  quality = 78,
  eager = false,
  sizes = "(max-width: 640px) 100vw, 640px",
  className,
  ...props
}) {
  const imageSrc = unsplashUrl(src, width, quality);
  const srcSet = src?.includes("images.unsplash.com")
    ? [320, 480, 640, 960]
        .map((candidate) => `${unsplashUrl(src, candidate, quality)} ${candidate}w`)
        .join(", ")
    : undefined;

  return (
    <img
      src={imageSrc}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      alt={alt}
      width={width}
      height={height}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : "auto"}
      decoding="async"
      className={className}
      {...props}
    />
  );
}
