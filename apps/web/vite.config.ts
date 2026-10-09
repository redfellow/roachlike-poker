import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const packageInfo = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")) as { version: string };

export default defineConfig({
	plugins: [react()],
	define: { __APP_VERSION__: JSON.stringify(packageInfo.version) },
	server: {
		port: Number(process.env.TORAKKA_WEB_PORT ?? "5173"),
		proxy: {
			"/socket.io": { target: `http://127.0.0.1:${process.env.PORT ?? "3001"}`, ws: true },
			"/api": `http://127.0.0.1:${process.env.PORT ?? "3001"}`
		}
	}
});
