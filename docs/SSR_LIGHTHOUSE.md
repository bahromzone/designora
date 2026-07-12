# Public prerender and Lighthouse gate

Public acquisition routes are emitted as route-specific HTML during `npm run build`. Each route includes crawlable content, title, description, canonical URL, Open Graph metadata, and one H1 before JavaScript executes. React mounts independently after load.

Prerendered routes: `/`, `/kurslar`, `/learning-paths`, `/blog`, `/narxlar`.

CI blocks merges when prerender output is missing or Lighthouse falls below these budgets: performance 80, accessibility 90, best practices 85, SEO 90, LCP 2.5s, CLS 0.1, total blocking time 300ms.

Lighthouse is the authoritative runtime performance gate. Dynamic course and blog detail pages remain client-rendered until stable build-time content snapshots are available.
