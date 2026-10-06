import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { defineConfig } from "@playwright/test";

export default defineConfig({
	testDir: "tests/e2e",
	timeout: 60000,
	workers: 1,
	use: { baseURL: "http://127.0.0.1:5173", channel: "chrome", trace: "retain-on-failure" },
	webServer: { command: "npm run dev", url: "http://127.0.0.1:5173", reuseExistingServer: false, env: { TORAKKA_DB: join(tmpdir(), `torakka-e2e-${randomUUID()}.sqlite`) } }
});
