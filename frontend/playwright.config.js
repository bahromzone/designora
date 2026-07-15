import { defineConfig } from "@playwright/test";
export default defineConfig({testDir:"./e2e",testMatch:"**/*.e2e.js",fullyParallel:true,retries:1,use:{baseURL:"http://127.0.0.1:4173",trace:"retain-on-failure"},webServer:{command:"npm run build && npm run preview",url:"http://127.0.0.1:4173",reuseExistingServer:false,timeout:120000}});
