# 📈 Analitika va o'sish bloki

> Yo'l xaritasidagi 6-bo'lim (Analitika va o'sish) ning backend qismi.

## ✅ Bajarilgan ishlar

| Vazifa | Holat | Izoh |
|--------|-------|------|
| Instruktor dashboard | ✅ | Daromad, talabalar, tugatish darajasi, kurs bo'yicha |
| Admin dashboard | ✅ | KPI'lar, konversiya voronkasi, top kurslar, hodisalar |
| Product analytics (event tracking) | ✅ | `POST /track` + `AnalyticsEvent` modeli |

> Kelajak (tashqi servis / frontend): PostHog / Mixpanel'ga hodisalarni uzatish
> (backend `AnalyticsEvent` ni to'playdi, yuborish worker/integratsiya bilan),
> A/B testlar (frontend + bayroqlar), email marketing (drip / tark etilgan
> savatcha — fon vazifalari bilan).

## 🗄️ Yangi model

- `AnalyticsEvent` — `name`, `props` (JSON), `user_id`, `session_id`, `path`,
  `created_at`. Xom hodisalar shu yerda; keyin tashqi analytics'ga uzatilishi
  mumkin.

## 🔌 Yangi API'lar

### Analytics — `/api/analytics`
- `GET /instructor` — instruktor dashboard (o'z kurslari bo'yicha)
- `GET /admin` — admin dashboard (platforma KPI'lari + voronka)
- `POST /track` — hodisa yozish (ommaviy; login bo'lsa user biriktiriladi)
- `GET /events/summary` — hodisalar taqsimoti (admin)

## 🧩 Servis (sof, testlangan)

`analytics_service`: `revenue_summary`, `completion_rate`, `average_progress`,
`funnel`, `group_events_by_name`, `top_n`. Barchasi DB'siz — routerlar DB'dan
o'qib shu funksiyalarga uzatadi.

## 🗃️ Migratsiya

```bash
cd backend
alembic upgrade head   # i7d3e4f5a6b9
```

## 🧪 Testlar

```bash
cd backend
pytest tests/test_analytics_service.py tests/test_analytics_api.py -v
```
