import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRuntime } from "./runtime";

const root = fileURLToPath(new URL("../../../", import.meta.url));
process.chdir(root);
const runtime = await createRuntime(process.env.TORAKKA_DB ?? resolve(root, "data/torakkapokeri.sqlite"), {
	countdownMs: Number(process.env.TORAKKA_COUNTDOWN_MS ?? "5000"),
	computerDelayMs: Number(process.env.TORAKKA_COMPUTER_DELAY_MS ?? "2200"),
});
await runtime.app.listen({ port: Number(process.env.PORT ?? 3001), host: "127.0.0.1" });
console.log(`roachlike: ${runtime.app.server.address() instanceof Object ? "http://127.0.0.1:" + (process.env.PORT ?? 3001) : "started"}`);
for (const signal of ["SIGINT", "SIGTERM"] as const) {
	process.once(signal, async function () { await runtime.close(); process.exit(0); });
}
