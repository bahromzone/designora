# Public prerender and Lighthouse gate

Public acquisition routes are emitted as route-specific HTML during `npm run build`. Each route includes crawlable content, title, description, canonical URL, Open Graph metadata, and one H1 before JavaScript executes.

Prerendered routes: `/`, `/kurslar`, `/learning-paths`, `/blog`, `/narxlar`.

CI enforces ESLint, changed-source Prettier, 70% coverage, prerender output, and Lighthouse independently. Lighthouse budgets: performance 80, accessibility 90, best practices 85, SEO 90, LCP 2.5s, CLS 0.1, total blocking time 300ms.
