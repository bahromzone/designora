import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const dist = path.resolve("dist");
const shell = await readFile(path.join(dist, "index.html"), "utf8");
const site = (process.env.VITE_SITE_URL || "https://designora.uz").replace(/\/$/, "");

const routes = [
  {
    path: "/",
    title: "Designora, amaliy dizayn ta’limi",
    description: "UI/UX, grafik va fashion dizaynni mentor feedback’i, real topshiriqlar va portfolio loyihalari orqali o‘rganing.",
    heading: "Dizaynni amaliyot bilan o‘rganing",
    body: "Kurs tanlang, darsni boshlang, mentor feedback’i bilan portfolio yarating.",
  },
  {
    path: "/kurslar",
    title: "Dizayn kurslari | Designora",
    description: "Daraja, yo‘nalish, til va davomiylik bo‘yicha Designora kurslarini toping.",
    heading: "Dizayn kurslari",
    body: "UI/UX, grafik dizayn va fashion yo‘nalishidagi amaliy kurslarni solishtiring.",
  },
  {
    path: "/learning-paths",
    title: "Learning pathlar | Designora",
    description: "Boshlang‘ich bilimdan portfolio loyihasigacha tartiblangan dizayn learning pathlari.",
    heading: "Aniq o‘quv yo‘li",
    body: "Prerequisite, progress va yakuniy loyiha bilan bosqichma-bosqich rivojlaning.",
  },
  {
    path: "/blog",
    title: "Dizayn blogi | Designora",
    description: "Dizayn jarayoni, portfolio, freelance va kasbiy rivojlanish bo‘yicha amaliy maqolalar.",
    heading: "Dizayn bo‘yicha amaliy bilimlar",
    body: "Portfolio va professional ish jarayonini yaxshilaydigan qo‘llanmalar.",
  },
  {
    path: "/narxlar",
    title: "Kurs narxlari | Designora",
    description: "Designora kurslari narxlari, to‘lov usullari va mavjud imkoniyatlarni ko‘ring.",
    heading: "Shaffof kurs narxlari",
    body: "Kurs tarkibi va to‘lov variantlarini oldindan ko‘ring.",
  },
];

function escape(value) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function render(route) {
  const canonical = `${site}${route.path === "/" ? "" : route.path}`;
  const head = `
    <title>${escape(route.title)}</title>
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
    .replace("</head>", `${head}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${content}</div>`);
}

for (const route of routes) {
  const directory = route.path === "/" ? dist : path.join(dist, route.path.slice(1));
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, "index.html"), render(route));
}

console.log(`Prerendered ${routes.length} public routes`);
