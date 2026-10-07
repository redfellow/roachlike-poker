import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { defineConfig } from "@playwright/test";

export default defineConfig({
	testDir: "tests/e2e",
	timeout: 60000,
	workers: 1,
	use: { baseURL: "http://127.0.0.1:5183", channel: "chrome", trace: "retain-on-failure" },
	webServer: { command: "npm run dev", url: "http://127.0.0.1:5183", reuseExistingServer: false, env: { PORT: "3011", TORAKKA_WEB_PORT: "5183", TORAKKA_DB: join(tmpdir(), `torakka-e2e-${randomUUID()}.sqlite`), TORAKKA_COUNTDOWN_MS: "50", TORAKKA_COMPUTER_DELAY_MS: "40" } }
});
