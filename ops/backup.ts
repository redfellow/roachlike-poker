import { resolve } from "node:path";
import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { Store } from "../apps/server/src/store";

const source = resolve(process.env.TORAKKA_DB ?? "data/torakkapokeri.sqlite");
const destination = process.argv[2];
if (!destination) { throw new Error("Usage: npm run backup -- <destination.sqlite>"); }
if (!existsSync(source)) { throw new Error("Source database does not exist."); }
if (existsSync(resolve(destination))) { throw new Error("Choose a new backup filename; existing files are not overwritten."); }
mkdirSync(dirname(resolve(destination)), { recursive: true });
const store = new Store(source);
try { await store.backup(resolve(destination)); console.log(`Backup saved: ${resolve(destination)}`); }
finally { store.close(); }
