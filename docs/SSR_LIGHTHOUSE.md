# Public prerender and Lighthouse gate

Public acquisition routes are emitted as route-specific HTML during `npm run build`. Each page contains meaningful server-readable content, title, description, canonical URL, Open Graph metadata, and one H1 before JavaScript executes. React then takes over on the client.

Prerendered routes: `/`, `/kurslar`, `/learning-paths`, `/blog`, `/narxlar`.

CI blocks merges when prerender output is missing or Lighthouse falls below these budgets: performance 80, accessibility 90, best practices 85, SEO 90, LCP 2.5s, CLS 0.1, total blocking time 300ms.

Dynamic course and blog detail pages continue to use client metadata until build-time data snapshots are available. They must not be added to the sitemap as prerendered pages without a stable content feed.
