import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { checkoutApi } from "../lib/checkoutApi";
const TERMINAL = ["paid", "failed", "cancelled"];
export default function CheckoutResultPage() {
  const { orderId } = useParams(); const { token } = useAuth(); const [data, setData] = useState(null); const [error, setError] = useState(""); const [receipt, setReceipt] = useState(null); const [busy, setBusy] = useState(false); const timerRef = useRef(null);
  const check = useCallback(async () => { try { const next = await checkoutApi.status(orderId, token); setData(next); setError(""); return next?.status; } catch (err) { setError(err.message); return null; } }, [orderId, token]);
  useEffect(() => { let active = true; async function tick() { const status = await check(); if (!active || TERMINAL.includes(status)) return; timerRef.current = setTimeout(tick, 3000); } tick(); return () => { active = false; if (timerRef.current) clearTimeout(timerRef.current); }; }, [check]);
  async function retry() { setBusy(true); setError(""); try { const result = await checkoutApi.retry(orderId, token); if (result?.pay_url) window.location.assign(result.pay_url); else setError("To‘lov havolasi olinmadi."); } catch (err) { setError(err.message); } finally { setBusy(false); } }
  async function loadReceipt() { setBusy(true); setError(""); try { setReceipt(await checkoutApi.receipt(orderId, token)); } catch (err) { setError(err.message); } finally { setBusy(false); } }
  const status = data?.status;
  return <main className="checkout-shell"><section className="checkout-card"><p>Payment status</p><h1>{status === "paid" ? "To‘lov muvaffaqiyatli" : status === "failed" ? "To‘lov amalga oshmadi" : status === "cancelled" ? "To‘lov bekor qilindi" : "To‘lov kutilmoqda"}</h1><p>{error || data?.failure_reason || "Provayder tasdig‘ini kutyapmiz."}</p>{status === "paid" && <><Link className="pay-button" to={`/organish/${data.course_id}`}>O‘qishni boshlash</Link><button type="button" disabled={busy} onClick={loadReceipt}>Chekni ko‘rish</button></>}{["failed", "cancelled"].includes(status) && <button className="pay-button" type="button" disabled={busy} onClick={retry}>{busy ? "Yuborilmoqda..." : "Qayta to‘lash"}</button>}{receipt && <div><hr /><strong>{receipt.receipt_number}</strong><p>To‘langan: {Number(receipt.paid_amount || 0).toLocaleString("uz-UZ")} {receipt.currency || "UZS"}</p><p>Refund: {receipt.refund_status || "none"}</p></div>}</section></main>;
}
