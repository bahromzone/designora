import path from "node:path";
import { fileURLToPath } from "node:url";

// Yo'l config va setup o'rtasida bo'lishishi kerak, shuning uchun alohida
// modulda: config'ni setup import qilsa aylanma bog'liqlik chiqadi.
const here = path.dirname(fileURLToPath(import.meta.url));

export const AUTH_FILE = path.join(here, ".auth", "user.json");
