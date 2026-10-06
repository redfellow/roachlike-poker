import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { Store } from "./store";

describe("transactional persistence", function () {
	it("rolls back state if the command receipt cannot be committed", function () {
		const store = new Store(":memory:");
		try {
			store.save("room", "before", { actor: "person", commandId: "one" });
			expect(() => store.save("room", "after", { actor: "person", commandId: "one" })).toThrow();
			expect(store.all()).toEqual(["before"]);
			expect(store.hasReceipt("room", "person", "one")).toBe(true);
		}
		finally { store.close(); }
	});
	it("restores a consistent online backup including deduplication receipts", async function () {
		const directory = mkdtempSync(join(tmpdir(), "torakka-backup-"));
		const source = new Store(join(directory, "source.sqlite"));
		try {
			source.save("room", JSON.stringify({ phase: "passing", secretCard: "fixture" }), { actor: "person", commandId: "peek" });
			await source.backup(join(directory, "backup.sqlite"));
			const restored = new Store(join(directory, "backup.sqlite"));
			try {
				expect(restored.all()).toEqual(source.all());
				expect(restored.hasReceipt("room", "person", "peek")).toBe(true);
			}
			finally { restored.close(); }
		}
		finally { source.close(); rmSync(directory, { recursive: true, force: true }); }
	});
});
