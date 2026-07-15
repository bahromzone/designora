export function announce(message, priority = "polite") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("designora:announce", { detail: { message, priority } }));
}
