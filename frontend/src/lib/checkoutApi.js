const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.detail || "Checkout xatosi");
  return data;
}

export const checkoutApi = {
  quote: (courseId, coupon = "") =>
    request(
      `/api/payments/quote/${courseId}${coupon ? `?coupon_code=${encodeURIComponent(coupon)}` : ""}`
    ),
  checkout: (body) =>
    request("/api/payments/checkout-safe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...body,
        idempotency_key:
          body.idempotency_key ||
          globalThis.crypto?.randomUUID?.() ||
          `${Date.now()}-${Math.random()}`,
      }),
    }),
  retry: (orderId) =>
    request(`/api/payments/orders/${orderId}/retry`, { method: "POST" }),
  receipt: (orderId) => request(`/api/payments/orders/${orderId}/receipt`),
  status: (orderId) => request(`/api/payments/orders/${orderId}`),
};
