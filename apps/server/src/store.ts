import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

export class Store {
	private readonly db: Database.Database;
	constructor(path: string) {
		if (path !== ":memory:") { mkdirSync(dirname(path), { recursive: true }); }
		this.db = new Database(path);
		this.db.pragma("journal_mode = WAL");
		this.db.pragma("synchronous = FULL");
		this.db.exec("CREATE TABLE IF NOT EXISTS rooms (id TEXT PRIMARY KEY, state TEXT NOT NULL); CREATE TABLE IF NOT EXISTS receipts (room_id TEXT NOT NULL, actor TEXT NOT NULL, command_id TEXT NOT NULL, PRIMARY KEY(room_id, actor, command_id)); PRAGMA user_version = 1;");
	}
	public all(): string[] { return (this.db.prepare("SELECT state FROM rooms").all() as { state: string }[]).map(r => r.state); }
	public hasReceipt(roomId: string, actor: string, commandId: string): boolean {
		return Boolean(this.db.prepare("SELECT 1 FROM receipts WHERE room_id=? AND actor=? AND command_id=?").get(roomId, actor, commandId));
	}
	public save(id: string, state: string, receipt?: { actor: string; commandId: string }): void {
		const db = this.db;
		db.transaction(function () {
			db.prepare("INSERT INTO rooms(id,state) VALUES (?,?) ON CONFLICT(id) DO UPDATE SET state=excluded.state").run(id, state);
			if (receipt) { db.prepare("INSERT INTO receipts(room_id,actor,command_id) VALUES (?,?,?)").run(id, receipt.actor, receipt.commandId); }
		})();
	}
	public delete(id: string): void {
		this.db.prepare("DELETE FROM rooms WHERE id=?").run(id);
		this.db.prepare("DELETE FROM receipts WHERE room_id=?").run(id);
	}
	public async backup(path: string): Promise<void> { await this.db.backup(path); }
	public close(): void { this.db.close(); }
}
