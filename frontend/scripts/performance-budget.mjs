import { gzipSync } from "node:zlib";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const dist = path.resolve("dist");
const limits = { initialGzip: 300_000, chunkGzip: 360_000, totalJsGzip: 1_200_000, publicAsset: 500_000 };
const files = [];

async function walk(directory) {
  for (const name of await readdir(directory)) {
    const file = path.join(directory, name);
    const info = await stat(file);
    if (info.isDirectory()) await walk(file);
    else files.push({ file: path.relative(dist, file), bytes: info.size, content: await readFile(file) });
  }
}

await walk(dist);
const js = files.filter((item) => item.file.endsWith(".js")).map((item) => ({ ...item, gzip: gzipSync(item.content).length }));
const entry = js.find((item) => item.file.includes("index-"));
const failures = [];
if (entry?.gzip > limits.initialGzip) failures.push(`Initial JS ${entry.gzip} > ${limits.initialGzip}`);
js.filter((item) => item !== entry && item.gzip > limits.chunkGzip).forEach((item) => failures.push(`${item.file} ${item.gzip} > ${limits.chunkGzip}`));
const totalJsGzip = js.reduce((sum, item) => sum + item.gzip, 0);
if (totalJsGzip > limits.totalJsGzip) failures.push(`Total JS ${totalJsGzip} > ${limits.totalJsGzip}`);
files.filter((item) => !item.file.startsWith("assets/") && item.bytes > limits.publicAsset).forEach((item) => failures.push(`${item.file} ${item.bytes} > ${limits.publicAsset}`));
const report = { generatedAt: new Date().toISOString(), limits, initialJsGzip: entry?.gzip || 0, totalJsGzip, chunks: js.map(({ file, bytes, gzip }) => ({ file, bytes, gzip })), failures };
await writeFile(path.join(dist, "performance-report.json"), JSON.stringify(report, null, 2));
console.table(report.chunks);
if (failures.length) { console.error(failures.join("\n")); process.exit(1); }
console.log("Performance budgets passed");
