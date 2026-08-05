import { request } from "./request";

export const checkoutApi = {
  quote: (courseId, coupon = "") =>
    request(
      `/api/payments/quote/${courseId}${coupon ? `?coupon_code=${encodeURIComponent(coupon)}` : ""}`
    ),
  checkout: (body) =>
    request("/api/payments/checkout-safe", {
      method: "POST",
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
