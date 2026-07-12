import { readFile } from "node:fs/promises";
import path from "node:path";

const routes = ["", "kurslar", "learning-paths", "blog", "narxlar"];
const failures = [];
for (const route of routes) {
  const file = path.join("dist", route, "index.html");
  const html = await readFile(file, "utf8");
  const label = route || "/";
  if (!/<h1>[^<]+<\/h1>/.test(html)) failures.push(`${label}: missing rendered h1`);
  if (!/<meta name="description" content="[^"]+">/.test(html)) failures.push(`${label}: missing description`);
  if (!/<link rel="canonical" href="[^"]+">/.test(html)) failures.push(`${label}: missing canonical`);
  if (!/<main id="prerendered-content">/.test(html)) failures.push(`${label}: missing prerendered content`);
}
if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("Prerender SEO gate passed");
