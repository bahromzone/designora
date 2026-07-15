const THRESHOLDS = { LCP: 2500, INP: 200, CLS: 0.1 };

function rating(name, value) {
  return value <= THRESHOLDS[name] ? "good" : value <= THRESHOLDS[name] * 1.5 ? "needs-improvement" : "poor";
}

export function observeWebVitals(report) {
  if (typeof PerformanceObserver === "undefined") return () => {};
  const observers = [];
  const emit = (name, value, id = `${name}-${Date.now()}`) => report({ name, value, id, rating: rating(name, value), path: window.location.pathname });

  try {
    let lcp = 0;
    const observer = new PerformanceObserver((list) => { const entries = list.getEntries(); lcp = entries.at(-1)?.startTime || lcp; });
    observer.observe({ type: "largest-contentful-paint", buffered: true });
    const flush = () => lcp && emit("LCP", Math.round(lcp));
    window.addEventListener("pagehide", flush, { once: true });
    observers.push(observer);
  } catch { /* unsupported metric */ }

  try {
    let cls = 0;
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => { if (!entry.hadRecentInput) cls += entry.value; });
    });
    observer.observe({ type: "layout-shift", buffered: true });
    window.addEventListener("pagehide", () => emit("CLS", Number(cls.toFixed(4))), { once: true });
    observers.push(observer);
  } catch { /* unsupported metric */ }

  try {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => emit("INP", Math.round(entry.duration), entry.interactionId || undefined));
    });
    observer.observe({ type: "event", buffered: true, durationThreshold: 40 });
    observers.push(observer);
  } catch { /* unsupported metric */ }

  return () => observers.forEach((observer) => observer.disconnect());
}
