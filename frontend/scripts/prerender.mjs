import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const dist = path.resolve("dist");
const shell = await readFile(path.join(dist, "index.html"), "utf8");
const site = (process.env.VITE_SITE_URL || "https://designora.uz").replace(/\/$/, "");
const routes = [
  ["/", "Designora, amaliy dizayn ta’limi", "UI/UX, grafik va fashion dizaynni mentor feedback’i va real topshiriqlar orqali o‘rganing.", "Dizaynni amaliyot bilan o‘rganing", "Kurs tanlang, darsni boshlang va mentor feedback’i bilan portfolio yarating."],
  ["/kurslar", "Dizayn kurslari | Designora", "Daraja, yo‘nalish, til va davomiylik bo‘yicha Designora kurslarini toping.", "Dizayn kurslari", "UI/UX, grafik va fashion dizayn kurslarini solishtiring."],
  ["/learning-paths", "Learning pathlar | Designora", "Boshlang‘ich bilimdan portfolio loyihasigacha tartiblangan dizayn learning pathlari.", "Aniq o‘quv yo‘li", "Prerequisite, progress va yakuniy loyiha bilan rivojlaning."],
  ["/blog", "Dizayn blogi | Designora", "Dizayn jarayoni, portfolio va freelance bo‘yicha amaliy maqolalar.", "Dizayn bo‘yicha amaliy bilimlar", "Portfolio va professional ish jarayonini yaxshilaydigan qo‘llanmalar."],
  ["/narxlar", "Kurs narxlari | Designora", "Designora kurslari narxlari va to‘lov usullarini ko‘ring.", "Shaffof kurs narxlari", "Kurs tarkibi va to‘lov variantlarini oldindan ko‘ring."],
].map(([routePath, title, description, heading, body]) => ({ path: routePath, title, description, heading, body }));

const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const escape = (value) => value.replace(/[&<>"']/g, (char) => entities[char]);

function render(route) {
  const canonical = `${site}${route.path === "/" ? "" : route.path}`;
  const metadata = `<title>${escape(route.title)}</title>
<meta name="description" content="${escape(route.description)}">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="${escape(route.title)}">
<meta property="og:description" content="${escape(route.description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:type" content="website">
<meta property="og:image" content="${site}/og-default.svg">
<meta name="twitter:card" content="summary_large_image">`;
  const content = `<main id="prerendered-content"><h1>${escape(route.heading)}</h1><p>${escape(route.body)}</p><a href="/kurslar">Kurslarni ko‘rish</a></main>`;
  return shell
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(/<\/head>/i, `${metadata}\n</head>`)
    .replace(/<body([^>]*)>/i, `<body$1>${content}`);
}

for (const route of routes) {
  const directory = route.path === "/" ? dist : path.join(dist, route.path.slice(1));
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, "index.html"), render(route));
}

console.log(`Prerendered ${routes.length} public routes`);
