import { afterEach, describe, expect, it } from "vitest";
import { io, type Socket } from "socket.io-client";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { createRuntime, type Runtime } from "./runtime";
import type { Reply, RoomAction, RoomView } from "@torakka/protocol";

interface Client { socket: Socket; state: RoomView | null; token: string; receipts: Set<string> }
const runtimes: Runtime[] = [];
const clients: Client[] = [];
const paths: string[] = [];
async function waitFor(predicate: () => boolean): Promise<void> {
	const deadline = Date.now() + 4000;
	while (!predicate()) {
		if (Date.now() > deadline) { throw new Error("Timed out waiting for server state"); }
		await new Promise(function (done) { setTimeout(done, 10); });
	}
}
async function start(path = ":memory:", options: { countdownMs?: number; computerDelayMs?: number; now?: () => number; random?: () => number } = {}): Promise<{ runtime: Runtime; url: string }> {
	const runtime = await createRuntime(path, { countdownMs: 50, computerDelayMs: 0, ...options }); runtimes.push(runtime);
	const url = await runtime.app.listen({ port: 0, host: "127.0.0.1" });
	return { runtime, url };
}
async function connect(url: string, roomId: string, name: string, token?: string): Promise<Client> {
	const socket = io(url, { transports: ["websocket"], reconnection: false });
	const client: Client = { socket, state: null, token: "", receipts: new Set() }; clients.push(client);
	socket.on("state", function (state: RoomView) { client.state = state; });
	await new Promise<void>(function (resolve) { socket.on("connect", resolve); });
	const reply = await socket.emitWithAck("join", { roomId, name, token }) as Reply;
	expect(reply.ok).toBe(true);
	if (reply.ok) { client.token = reply.token!; }
	await waitFor(() => client.state !== null);
	return client;
}
async function act(client: Client, action: RoomAction, id = randomUUID()): Promise<Reply> {
	const revision = client.state!.revision;
	const reply = await client.socket.emitWithAck("command", { id, revision, action }) as Reply;
	if (reply.ok && !client.receipts.has(id)) { await waitFor(() => client.state!.revision > revision); client.receipts.add(id); }
	return reply;
}
async function synced(group: Client[]): Promise<void> {
	await waitFor(() => group.every(c => c.state!.revision === group[0]!.state!.revision));
}
afterEach(async function () {
	for (const client of clients.splice(0)) { client.socket.disconnect(); }
	for (const runtime of runtimes.splice(0)) { await runtime.close(); }
	for (const path of paths.splice(0)) { rmSync(path, { recursive: true, force: true }); }
});
describe("authoritative room transport", function () {
	it("creates readable three-word room codes and resolves deterministic collisions", async function () {
		const { runtime } = await start(":memory:", { random: () => 0 });
		const first = (await runtime.app.inject({ method: "POST", url: "/api/rooms" })).json<{ id: string }>().id;
		const second = (await runtime.app.inject({ method: "POST", url: "/api/rooms" })).json<{ id: string }>().id;
		expect(first).toMatch(/^[a-z]+-[a-z]+-[a-z]+$/);
		expect(second).toMatch(/^[a-z]+-[a-z]+-[a-z]+$/);
		expect(second).not.toBe(first);
	});
	it("lists new rooms as open until their host makes them private", async function () {
		const { runtime, url } = await start();
		const response = await runtime.app.inject({ method: "POST", url: "/api/rooms" });
		const roomId = response.json<{ id: string }>().id;
		const host = await connect(url, roomId, "Reiska");
		const guest = await connect(url, roomId, "Kaveri");
		await synced([host, guest]);
		expect(host.state!.open).toBe(true);
		expect((await runtime.app.inject({ method: "GET", url: "/api/rooms/open" })).json()).toEqual([{
			id: roomId, hostName: "Reiska", seatedCount: 2, spectatorCount: 0, playing: false, themeId: "orkkipokka"
		}]);
		expect((await act(guest, { kind: "set-open", open: true })).ok).toBe(false);
		expect((await act(guest, { kind: "set-theme", themeId: "herrasmiespokeri" })).ok).toBe(false);
		expect((await act(host, { kind: "set-theme", themeId: "herrasmiespokeri" })).ok).toBe(true);
		await synced([host, guest]);
		expect(host.state!.theme).toEqual({ id: "herrasmiespokeri", version: 1 });
		expect((await act(host, { kind: "set-open", open: true })).ok).toBe(true);
		await synced([host, guest]);
		expect(host.state!.open).toBe(true);
		expect((await runtime.app.inject({ method: "GET", url: "/api/rooms/open" })).json()).toEqual([{
			id: roomId, hostName: "Reiska", seatedCount: 2, spectatorCount: 0, playing: false, themeId: "herrasmiespokeri"
		}]);
		expect((await act(host, { kind: "set-open", open: false })).ok).toBe(true);
		expect((await runtime.app.inject({ method: "GET", url: "/api/rooms/open" })).json()).toEqual([]);
	});
	it("locks theme selection when the ready countdown begins", async function () {
		const { runtime, url } = await start(":memory:", { countdownMs: 5000 });
		const roomId = (await runtime.app.inject({ method: "POST", url: "/api/rooms" })).json<{ id: string }>().id;
		const host = await connect(url, roomId, "A");
		const guest = await connect(url, roomId, "B");
		await synced([host, guest]); await act(host, { kind: "ready", ready: true });
		await synced([host, guest]); await act(guest, { kind: "ready", ready: true });
		await waitFor(() => host.state!.countdownAt !== null);
		expect((await act(host, { kind: "set-theme", themeId: "herrasmiespokeri" })).ok).toBe(false);
		expect(host.state!.theme).toEqual({ id: "orkkipokka", version: 1 });
	});
	it("starts a game, isolates spectators, rejects stale actions and deduplicates retries", async function () {
		const { runtime, url } = await start();
		const response = await runtime.app.inject({ method: "POST", url: "/api/rooms" });
		const roomId = response.json<{ id: string }>().id;
		const a = await connect(url, roomId, "A");
		const b = await connect(url, roomId, "B");
		await synced([a, b]); expect((await act(a, { kind: "ready", ready: true })).ok).toBe(true);
		await synced([a, b]); expect((await act(b, { kind: "ready", ready: true })).ok).toBe(true);
		await waitFor(() => Boolean(a.state!.game && b.state!.game));
		const spectator = await connect(url, roomId, "Katsoja");
		await synced([a, b, spectator]);
		expect(spectator.state!.game!.hand).toEqual([]);
		const actor = [a, b].find(c => c.state!.game!.seats.find(s => s.personId === c.state!.me)!.id === c.state!.game!.activeSeatId)!;
		const other = actor === a ? b : a;
		const game = actor.state!.game!;
		const id = randomUUID();
		const action: RoomAction = { kind: "game", action: { type: "send", cardId: game.hand[0]!.id, targetId: game.seats.find(s => s.personId === other.state!.me)!.id, creature: "torakka" } };
		expect((await act(actor, action, id)).ok).toBe(true);
		await waitFor(() => other.state!.game!.phase === "response");
		expect(other.state!.game!.challenge!.card).toBeNull();
		expect((await act(actor, action, id)).ok).toBe(true);
		expect(actor.state!.game!.hand).toHaveLength(26);
		const denied = await act(spectator, { kind: "game", action: { type: "answer", believes: true } });
		expect(denied.ok).toBe(false);
	});
	it("restores a dealt game and private hand after process restart", async function () {
		const dir = mkdtempSync(join(tmpdir(), "torakka-")); paths.push(dir);
		const path = join(dir, "test.sqlite");
		const first = await start(path);
		const roomId = (await first.runtime.app.inject({ method: "POST", url: "/api/rooms" })).json<{ id: string }>().id;
		const a = await connect(first.url, roomId, "A"); const b = await connect(first.url, roomId, "B");
		await synced([a, b]); expect((await act(a, { kind: "set-theme", themeId: "herrasmiespokeri" })).ok).toBe(true);
		await synced([a, b]); await act(a, { kind: "ready", ready: true });
		await synced([a, b]); await act(b, { kind: "ready", ready: true });
		await waitFor(() => Boolean(a.state!.game));
		const before = structuredClone(a.state!.game!); const token = a.token;
		a.socket.disconnect(); b.socket.disconnect();
		await first.runtime.close(); runtimes.splice(runtimes.indexOf(first.runtime), 1);
		const second = await start(path);
		const restored = await connect(second.url, roomId, "A", token);
		expect(restored.state!.game!.id).toBe(before.id);
		expect(restored.state!.theme).toEqual({ id: "herrasmiespokeri", version: 1 });
		expect(restored.state!.game!.theme).toEqual({ id: "herrasmiespokeri", version: 1 });
		expect(restored.state!.game!.hand).toEqual(before.hand);
		expect(restored.state!.game!.activeSeatId).toBe(before.activeSeatId);
	});
	it("revokes an old connection when the session moves to another device", async function () {
		const { runtime, url } = await start();
		const roomId = (await runtime.app.inject({ method: "POST", url: "/api/rooms" })).json<{ id: string }>().id;
		const old = await connect(url, roomId, "A");
		const fresh = await connect(url, roomId, "A", old.token);
		expect(fresh.state!.me).toBe(old.state!.me);
		expect((await act(old, { kind: "ready", ready: true })).ok).toBe(false);
		expect((await act(fresh, { kind: "ready", ready: true })).ok).toBe(true);
	});
	it("keeps host ownership across a refresh with computer players", async function () {
		const { runtime, url } = await start();
		const roomId = (await runtime.app.inject({ method: "POST", url: "/api/rooms" })).json<{ id: string }>().id;
		const host = await connect(url, roomId, "A");
		expect((await act(host, { kind: "add-computer" })).ok).toBe(true);
		const hostId = host.state!.me;
		const token = host.token;
		host.socket.disconnect();
		const refreshed = await connect(url, roomId, "A", token);
		expect(refreshed.state!.hostId).toBe(hostId);
		expect(refreshed.state!.members.find(member => member.id === refreshed.state!.hostId)!.computer).toBe(false);
	});
	it("adds a host-controlled computer seat that is immediately ready and labeled", async function () {
		const { runtime, url } = await start(":memory:", { countdownMs: 5000, random: function () { return 0; } });
		const roomId = (await runtime.app.inject({ method: "POST", url: "/api/rooms" })).json<{ id: string }>().id;
		const host = await connect(url, roomId, "A");
		const botName = "🤖 Pelti-Pena";
		expect((await act(host, { kind: "add-computer" })).ok).toBe(true);
		await waitFor(() => host.state!.members.some(m => m.name === botName));
		const bot = host.state!.members.find(m => m.name === botName)!;
		expect(bot.seated).toBe(true);
		expect(bot.ready).toBe(true);
		expect(bot.computer).toBe(true);
		expect(host.state!.members.filter(m => m.seated)).toHaveLength(2);
		expect((await act(host, { kind: "ready", ready: true })).ok).toBe(true);
		expect(host.state!.countdownAt).not.toBeNull();
		expect((await act(host, { kind: "remove", seatId: bot.id })).ok).toBe(true);
		expect(host.state!.members.some(member => member.id === bot.id)).toBe(false);
		expect(host.state!.countdownAt).toBeNull();
	});
	it("selects computer identities randomly from the unused names", async function () {
		const { runtime, url } = await start(":memory:", { random: function () { return .5; } });
		const roomId = (await runtime.app.inject({ method: "POST", url: "/api/rooms" })).json<{ id: string }>().id;
		const host = await connect(url, roomId, "A");
		expect((await act(host, { kind: "add-computer" })).ok).toBe(true);
		await waitFor(() => host.state!.members.some(member => member.name === "🤖 Bluffi-Börje"));
	});
	it("starts the game when two computer players are ready", async function () {
		const { runtime, url } = await start();
		const roomId = (await runtime.app.inject({ method: "POST", url: "/api/rooms" })).json<{ id: string }>().id;
		const host = await connect(url, roomId, "A");
		expect((await act(host, { kind: "add-computer" })).ok).toBe(true);
		expect((await act(host, { kind: "add-computer" })).ok).toBe(true);
		await waitFor(() => host.state!.members.filter(m => m.seated).length === 3);
		expect((await act(host, { kind: "ready", ready: true })).ok).toBe(true);
		await waitFor(() => Boolean(host.state!.game));
		expect(host.state!.game).not.toBeNull();
	});
	it("keeps the game moving when the current seat is a computer player", async function () {
		const { runtime, url } = await start(":memory:", { countdownMs: 0, random: function () { return 0.999; } });
		const roomId = (await runtime.app.inject({ method: "POST", url: "/api/rooms" })).json<{ id: string }>().id;
		const host = await connect(url, roomId, "A");
		for (let index = 0; index < 5; index++) {
			expect((await act(host, { kind: "add-computer" })).ok).toBe(true);
		}
		expect((await act(host, { kind: "ready", ready: true })).ok).toBe(true);
		await waitFor(function () {
			const game = host.state!.game;
			if (!game) { return false; }
			if (game.phase === "ended") { return true; }
			const requiredSeatId = game.phase === "initiation" ? game.activeSeatId : game.challenge!.claims.at(-1)!.receiverId;
			const requiredSeat = game.seats.find(seat => seat.id === requiredSeatId)!;
			return !host.state!.members.find(member => member.id === requiredSeat.personId)!.computer;
		});
		const game = host.state!.game!;
		if (game.phase === "ended") {
			expect(host.state!.history).toHaveLength(1);
			return;
		}
		const requiredSeatId = game.phase === "initiation" ? game.activeSeatId : game.challenge!.claims.at(-1)!.receiverId;
		const requiredSeat = game.seats.find(s => s.id === requiredSeatId)!;
		const requiredMember = host.state!.members.find(m => m.id === requiredSeat.personId)!;
		expect(requiredMember.computer).toBe(false);
		expect(requiredMember.id).toBe(host.state!.me);
	});
	it("broadcasts a human claim before a computer answers after its delay", async function () {
		const { runtime, url } = await start(":memory:", { countdownMs: 0, computerDelayMs: 150, random: function () { return 0; } });
		const roomId = (await runtime.app.inject({ method: "POST", url: "/api/rooms" })).json<{ id: string }>().id;
		const host = await connect(url, roomId, "A");
		expect((await act(host, { kind: "add-computer" })).ok).toBe(true);
		expect((await act(host, { kind: "ready", ready: true })).ok).toBe(true);
		await waitFor(() => Boolean(host.state!.game));
		const game = host.state!.game!;
		expect(game.activeSeatId).toBe(game.seats.find(seat => seat.personId === host.state!.me)!.id);
		const computerSeat = game.seats.find(seat => host.state!.members.find(member => member.id === seat.personId)!.computer)!;
		const card = game.hand[0]!;
		expect((await act(host, { kind: "game", action: { type: "send", cardId: card.id, targetId: computerSeat.id, creature: card.creature } })).ok).toBe(true);
		expect(host.state!.game!.phase).toBe("response");
		expect(host.state!.game!.lastResolution).toBeNull();
		await waitFor(() => host.state!.game!.lastResolution !== null);
	});
	it("resumes one pending computer response after a server restart", async function () {
		const dir = mkdtempSync(join(tmpdir(), "torakka-bot-restart-")); paths.push(dir);
		const path = join(dir, "game.sqlite");
		const first = await start(path, { countdownMs: 0, computerDelayMs: 5000, random: function () { return 0; } });
		const roomId = (await first.runtime.app.inject({ method: "POST", url: "/api/rooms" })).json<{ id: string }>().id;
		const host = await connect(first.url, roomId, "A");
		expect((await act(host, { kind: "add-computer" })).ok).toBe(true);
		expect((await act(host, { kind: "ready", ready: true })).ok).toBe(true);
		await waitFor(() => Boolean(host.state!.game));
		const game = host.state!.game!;
		const computer = game.seats.find(seat => seat.personId !== host.state!.me)!;
		const card = game.hand[0]!;
		expect((await act(host, { kind: "game", action: { type: "send", cardId: card.id, targetId: computer.id, creature: card.creature } })).ok).toBe(true);
		const token = host.token;
		host.socket.disconnect();
		await first.runtime.close(); runtimes.splice(runtimes.indexOf(first.runtime), 1);
		const second = await start(path, { countdownMs: 0, computerDelayMs: 0 });
		const restored = await connect(second.url, roomId, "A", token);
		await waitFor(() => restored.state!.game!.lastResolution !== null);
		expect(restored.state!.game!.lastResolution!.id).toBe(`${game.id}:r1`);
		expect(restored.state!.history).toHaveLength(restored.state!.game!.phase === "ended" ? 1 : 0);
	});
	it("marks seated computer players ready after a rematch", async function () {
		const { runtime, url } = await start(":memory:", { countdownMs: 0, computerDelayMs: 5000 });
		const roomId = (await runtime.app.inject({ method: "POST", url: "/api/rooms" })).json<{ id: string }>().id;
		const host = await connect(url, roomId, "A");
		expect((await act(host, { kind: "add-computer" })).ok).toBe(true);
		expect((await act(host, { kind: "add-computer" })).ok).toBe(true);
		expect((await act(host, { kind: "ready", ready: true })).ok).toBe(true);
		await waitFor(() => Boolean(host.state!.game));
		if (host.state!.game!.phase !== "ended") { expect((await act(host, { kind: "end" })).ok).toBe(true); }
		expect((await act(host, { kind: "rematch" })).ok).toBe(true);
		const computers = host.state!.members.filter(member => member.computer);
		expect(computers).toHaveLength(2);
		expect(computers.every(member => member.ready)).toBe(true);
		expect(host.state!.members.find(member => member.id === host.state!.me)!.ready).toBe(false);
	});
	it.each([2, 3, 6])("completes a solo %i-seat game with fair computer turns", async function (seatCount) {
		const { runtime, url } = await start(":memory:", { countdownMs: 0, computerDelayMs: 0 });
		const roomId = (await runtime.app.inject({ method: "POST", url: "/api/rooms" })).json<{ id: string }>().id;
		const host = await connect(url, roomId, "Yksinpelaaja");
		for (let index = 1; index < seatCount; index++) { expect((await act(host, { kind: "add-computer" })).ok).toBe(true); }
		expect((await act(host, { kind: "ready", ready: true })).ok).toBe(true);
		await waitFor(() => Boolean(host.state!.game));
		for (let step = 0; step < 1000 && host.state!.game!.phase !== "ended"; step++) {
			await waitFor(function () {
				const current = host.state!.game!;
				if (current.phase === "ended") { return true; }
				const seatId = current.phase === "initiation" ? current.activeSeatId : current.challenge!.claims.at(-1)!.receiverId;
				return current.seats.find(seat => seat.id === seatId)!.personId === host.state!.me;
			});
			const current = host.state!.game!;
			if (current.phase === "ended") { break; }
			if (current.phase === "initiation") {
				const ownSeat = current.seats.find(seat => seat.personId === host.state!.me)!;
				const target = current.seats.find(seat => seat.id !== ownSeat.id && !seat.removed)!;
				const card = current.hand[0]!;
				await act(host, { kind: "game", action: { type: "send", cardId: card.id, targetId: target.id, creature: card.creature } });
			}
			else if (current.phase === "response") {
				await act(host, { kind: "game", action: { type: "answer", believes: step % 2 === 0 } });
			}
			else {
				const target = current.challenge!.eligibleTargets[0]!;
				await act(host, { kind: "game", action: { type: "pass", targetId: target, creature: current.challenge!.card!.creature } });
			}
			await new Promise(function (done) { setTimeout(done, 2); });
		}
		expect(host.state!.game!.phase).toBe("ended");
		expect(host.state!.history).toHaveLength(1);
		expect(host.state!.history[0]!.scores).toHaveLength(seatCount);
		if (seatCount > 2) {
			expect(host.state!.history[0]!.scores.some(score => score.submitted > 0)).toBe(true);
			expect(host.state!.history[0]!.resolutions.some(resolution => resolution.claims.length > 1)).toBe(true);
		}
	});
	it("allows the host to remove another player from the lobby", async function () {
		const { runtime, url } = await start();
		const roomId = (await runtime.app.inject({ method: "POST", url: "/api/rooms" })).json<{ id: string }>().id;
		const host = await connect(url, roomId, "A");
		const guest = await connect(url, roomId, "B");
		await synced([host, guest]);
		expect((await act(host, { kind: "remove", seatId: guest.state!.members.find(m => m.id === guest.state!.me)!.id })).ok).toBe(true);
		await waitFor(() => !host.state!.members.some(m => m.id === guest.state!.me));
		expect(host.state!.members.some(m => m.name === "B")).toBe(false);
		expect(host.state!.members.some(m => m.id === guest.state!.me && m.seated)).toBe(false);
	});
	it("allows a player to leave the lobby", async function () {
		const { runtime, url } = await start();
		const roomId = (await runtime.app.inject({ method: "POST", url: "/api/rooms" })).json<{ id: string }>().id;
		const host = await connect(url, roomId, "A");
		const guest = await connect(url, roomId, "B");
		await synced([host, guest]);
		const reply = await guest.socket.timeout(2000).emitWithAck("command", { id: randomUUID(), revision: guest.state!.revision, action: { kind: "leave-table" } }) as Reply;
		expect(reply.ok).toBe(true);
		await waitFor(() => !host.state!.members.some(m => m.id === guest.state!.me));
		expect(host.state!.members).toHaveLength(1);
		expect(host.state!.members[0]!.name).toBe("A");
		expect(runtime.store.all()).toHaveLength(1);
	});
	it("removes the room when the last player leaves the lobby", async function () {
		const { runtime, url } = await start();
		const roomId = (await runtime.app.inject({ method: "POST", url: "/api/rooms" })).json<{ id: string }>().id;
		const host = await connect(url, roomId, "A");
		const reply = await host.socket.timeout(2000).emitWithAck("command", { id: randomUUID(), revision: host.state!.revision, action: { kind: "leave-table" } }) as Reply;
		expect(reply.ok).toBe(true);
		await waitFor(() => runtime.store.all().length === 0);
	});
	it("allows the host to close the lobby and rejects new joins", async function () {
		const { runtime, url } = await start();
		const roomId = (await runtime.app.inject({ method: "POST", url: "/api/rooms" })).json<{ id: string }>().id;
		const host = await connect(url, roomId, "A");
		expect((await host.socket.timeout(2000).emitWithAck("command", { id: randomUUID(), revision: host.state!.revision, action: { kind: "close-lobby" } }) as Reply).ok).toBe(true);
		await waitFor(() => runtime.store.all().length === 0);
		const guestSocket = io(url, { transports: ["websocket"], reconnection: false, timeout: 2000 });
		await new Promise<void>(function (resolve) { guestSocket.on("connect", resolve); });
		const guestReply = await guestSocket.emitWithAck("join", { roomId, name: "B" }) as Reply;
		expect(guestReply.ok).toBe(false);
		guestSocket.disconnect();
	});
	it("removes a room when all online players disconnect", async function () {
		const { runtime, url } = await start();
		const roomId = (await runtime.app.inject({ method: "POST", url: "/api/rooms" })).json<{ id: string }>().id;
		const host = await connect(url, roomId, "A");
		host.socket.disconnect();
		await waitFor(() => runtime.store.all().length === 0);
		expect(runtime.store.all()).toHaveLength(0);
	});
	it("removes a room after 30 minutes of inactivity", async function () {
		let currentTime = 0;
		const { runtime, url } = await start(":memory:", { now: () => currentTime });
		const roomId = (await runtime.app.inject({ method: "POST", url: "/api/rooms" })).json<{ id: string }>().id;
		await connect(url, roomId, "A");
		currentTime = 30 * 60 * 1000 + 1;
		await waitFor(() => runtime.store.all().length === 0);
	});
	it("restores a persisted room without a last activity timestamp", async function () {
		const dir = mkdtempSync(join(tmpdir(), "torakka-activity-restore-")); paths.push(dir);
		const path = join(dir, "restore.sqlite");
		const room = {
			id: "restored-room",
			revision: 1,
			members: [{ id: "a", name: "A", token: "token-a", computer: true }],
			seated: ["a"],
			ready: [],
			hostId: "a",
			countdownAt: null,
			game: null,
			history: [],
			vote: null,
			waitingSeatId: null,
			promptAt: null,
			closed: false,
			notice: "Room restored"
		};
		const store = new (await import("./store")).Store(path);
		store.save(room.id, JSON.stringify(room));
		store.close();
		const { runtime } = await start(path, { now: () => 1_000_000 });
		expect(runtime.store.all()).toHaveLength(1);
		expect((JSON.parse(runtime.store.all()[0]!) as { lastActivityAt: number }).lastActivityAt).toBe(1_000_000);
	});
	it("ignores stale persisted rooms whose members are all offline", async function () {
		const dir = mkdtempSync(join(tmpdir(), "torakka-room-cleanup-"));
		paths.push(dir);
		const path = join(dir, "stale.sqlite");
		const staleRoom = {
			id: "stale-room",
			revision: 1,
			members: [
				{ id: "a", name: "A", token: "token-a", computer: false },
				{ id: "b", name: "B", token: "token-b", computer: false }
			],
			seated: ["a", "b"],
			ready: [],
			hostId: "a",
			countdownAt: null,
			game: null,
			history: [],
			vote: null,
			waitingSeatId: null,
			promptAt: null,
			closed: false,
			notice: "Stale room"
		};
		const store = new (await import("./store")).Store(path);
		store.save(staleRoom.id, JSON.stringify(staleRoom));
		store.close();
		const { runtime } = await start(path);
		expect(runtime.store.all()).toHaveLength(0);
	});
});

describe("departure and history integration", function () {
	it("votes a spectator into a disconnected seat without exposing or losing the hand", async function () {
		const { runtime, url } = await start();
		const roomId = (await runtime.app.inject({ method: "POST", url: "/api/rooms" })).json<{ id: string }>().id;
		const group: Client[] = [];
		for (const name of ["A", "B", "C"]) { group.push(await connect(url, roomId, name)); }
		await synced(group);
		for (const client of group) { await synced(group); expect((await act(client, { kind: "ready", ready: true })).ok).toBe(true); }
		await waitFor(() => group.every(c => Boolean(c.state!.game)));
		const spectator = await connect(url, roomId, "Uusi");
		await synced([...group, spectator]);
		const old = group[2]!;
		const oldHand = structuredClone(old.state!.game!.hand);
		const seatId = old.state!.game!.seats.find(s => s.personId === old.state!.me)!.id;
		old.socket.disconnect();
		await waitFor(() => spectator.state!.members.find(m => m.id === old.state!.me)!.online === false);
		expect((await act(spectator, { kind: "request-seat", seatId })).ok).toBe(true);
		await synced([group[0]!, group[1]!, spectator]);
		expect((await act(group[0]!, { kind: "vote", approve: true })).ok).toBe(true);
		await synced([group[0]!, group[1]!, spectator]);
		expect((await act(group[1]!, { kind: "vote", approve: true })).ok).toBe(true);
		await waitFor(() => spectator.state!.game!.hand.length > 0);
		expect(spectator.state!.game!.hand).toEqual(oldHand);
		expect(spectator.state!.vote).toBeNull();
		expect(spectator.state!.game!.scores.find(s => s.personId === spectator.state!.me)!.correct).toBe(0);
	});
	it("cancels a replacement vote when the original player reconnects", async function () {
		const { runtime, url } = await start();
		const roomId = (await runtime.app.inject({ method: "POST", url: "/api/rooms" })).json<{ id: string }>().id;
		const group = [await connect(url, roomId, "A"), await connect(url, roomId, "B"), await connect(url, roomId, "C")];
		for (const client of group) { await synced(group); await act(client, { kind: "ready", ready: true }); }
		await waitFor(() => group.every(client => Boolean(client.state!.game)));
		const spectator = await connect(url, roomId, "Katsoja");
		await synced([...group, spectator]);
		const absent = group[2]!; const token = absent.token;
		const seatId = absent.state!.game!.seats.find(seat => seat.personId === absent.state!.me)!.id;
		absent.socket.disconnect();
		await waitFor(() => spectator.state!.members.find(member => member.id === absent.state!.me)!.online === false);
		expect((await act(spectator, { kind: "request-seat", seatId })).ok).toBe(true);
		await waitFor(() => spectator.state!.vote !== null);
		const restored = await connect(url, roomId, "C", token);
		await waitFor(() => spectator.state!.vote === null);
		expect(restored.state!.game!.seats.find(seat => seat.id === seatId)!.personId).toBe(restored.state!.me);
		expect(spectator.state!.game!.hand).toEqual([]);
	});
	it("cancels a replacement vote when a frozen voter reconnects", async function () {
		const { runtime, url } = await start();
		const roomId = (await runtime.app.inject({ method: "POST", url: "/api/rooms" })).json<{ id: string }>().id;
		const group = [await connect(url, roomId, "A"), await connect(url, roomId, "B"), await connect(url, roomId, "C")];
		for (const client of group) { await synced(group); await act(client, { kind: "ready", ready: true }); }
		await waitFor(() => group.every(client => Boolean(client.state!.game)));
		const spectator = await connect(url, roomId, "Katsoja");
		await synced([...group, spectator]);
		const voter = group[0]!; const absent = group[2]!; const seatId = absent.state!.game!.seats.find(seat => seat.personId === absent.state!.me)!.id;
		const voterToken = voter.token;
		absent.socket.disconnect();
		await waitFor(() => !spectator.state!.members.find(member => member.id === absent.state!.me)!.online);
		expect((await act(spectator, { kind: "request-seat", seatId })).ok).toBe(true);
		await waitFor(() => spectator.state!.vote !== null);
		voter.socket.disconnect();
		await waitFor(() => spectator.state!.vote === null);
		const reconnecting = await connect(url, roomId, "A", voterToken);
		await synced([reconnecting, spectator]);
		expect((await act(spectator, { kind: "request-seat", seatId })).ok).toBe(true);
		expect(spectator.state!.vote).not.toBeNull();
	});
	it("rejects duplicate display names that differ only by case", async function () {
		const { runtime, url } = await start();
		const roomId = (await runtime.app.inject({ method: "POST", url: "/api/rooms" })).json<{ id: string }>().id;
		const original = await connect(url, roomId, "A");
		await synced([original]);
		const guest = io(url, { transports: ["websocket"], reconnection: false });
		clients.push({ socket: guest, state: null, token: "", receipts: new Set() });
		await new Promise<void>(function (resolve) { guest.on("connect", resolve); });
		const reply = await guest.emitWithAck("join", { roomId, name: "a", token: undefined }) as Reply;
		expect(reply.ok).toBe(false);
		if (!reply.ok) { expect(reply.error).toBe("Nimi on jo käytössä."); }
		guest.disconnect();
	});
	it("normalizes whitespace and case for exact-name seat recovery", async function () {
		const { runtime, url } = await start();
		const roomId = (await runtime.app.inject({ method: "POST", url: "/api/rooms" })).json<{ id: string }>().id;
		const original = await connect(url, roomId, "A");
		const spectator = await connect(url, roomId, "Katsoja");
		await synced([original, spectator]);
		original.socket.disconnect();
		await waitFor(() => !spectator.state!.members.find(member => member.id === original.state!.me)!.online);
		const restored = await connect(url, roomId, "  a  ");
		await waitFor(() => restored.state!.members.find(member => member.id === original.state!.me)!.online === true);
		expect(restored.state!.members.find(member => member.id === original.state!.me)!.name).toBe("A");
		expect(restored.state!.members.find(member => member.id === original.state!.me)!.id).toBe(original.state!.me);
	});
	it("preserves an under-capacity seat, ends without a loser, and retains history after rematch", async function () {
		const { runtime, url } = await start();
		const roomId = (await runtime.app.inject({ method: "POST", url: "/api/rooms" })).json<{ id: string }>().id;
		const a = await connect(url, roomId, "A"); const b = await connect(url, roomId, "B");
		await synced([a, b]); await act(a, { kind: "ready", ready: true });
		await synced([a, b]); await act(b, { kind: "ready", ready: true });
		await waitFor(() => Boolean(a.state!.game));
		const seatId = a.state!.game!.seats.find(s => s.personId === b.state!.me)!.id;
		b.socket.disconnect();
		await waitFor(() => !a.state!.members.find(m => m.id === b.state!.me)!.online);
		expect((await act(a, { kind: "remove", seatId })).ok).toBe(true);
		expect(a.state!.waitingSeatId).toBe(seatId);
		expect(a.state!.game!.seats.find(s => s.id === seatId)!.handCount).toBe(27);
		expect((await act(a, { kind: "end" })).ok).toBe(true);
		expect(a.state!.history[0]!.reason).toBe("abandoned");
		expect(a.state!.history[0]!.loserName).toBeNull();
		expect((await act(a, { kind: "remove", seatId })).ok).toBe(false);
		expect(a.state!.waitingSeatId).toBeNull();
		expect((await act(a, { kind: "rematch" })).ok).toBe(true);
		expect(a.state!.game).toBeNull();
		expect(a.state!.history).toHaveLength(1);
	});
});


describe("countdown and absence boundaries", function () {
	it("keeps the countdown when a spectator disconnects", async function () {
		let time = 1000;
		const { runtime, url } = await start(":memory:", { countdownMs: 5000, now: () => time });
		const roomId = (await runtime.app.inject({ method: "POST", url: "/api/rooms" })).json<{ id: string }>().id;
		const a = await connect(url, roomId, "A"); const b = await connect(url, roomId, "B");
		const spectator = await connect(url, roomId, "Katsoja");
		await synced([a, b, spectator]);
		expect((await act(spectator, { kind: "stand" })).ok).toBe(true);
		await synced([a, b, spectator]); await act(a, { kind: "ready", ready: true });
		await synced([a, b, spectator]); await act(b, { kind: "ready", ready: true });
		await synced([a, b, spectator]);
		expect(a.state!.countdownAt).toBe(6000);
		spectator.socket.disconnect();
		await waitFor(() => !a.state!.members.find(m => m.id === spectator.state!.me)!.online);
		expect(a.state!.countdownAt).toBe(6000);
		time = 6000;
		await waitFor(() => Boolean(a.state!.game));
		expect(a.state!.game!.seats).toHaveLength(2);
	});
	it.each(["unready", "disconnect", "join"] as const)("cancels countdown on seated %s", async function (change) {
		let time = 1000;
		const { runtime, url } = await start(":memory:", { countdownMs: 5000, now: () => time });
		const roomId = (await runtime.app.inject({ method: "POST", url: "/api/rooms" })).json<{ id: string }>().id;
		const a = await connect(url, roomId, "A"); const b = await connect(url, roomId, "B");
		await synced([a, b]); await act(a, { kind: "ready", ready: true });
		await synced([a, b]); await act(b, { kind: "ready", ready: true });
		await synced([a, b]);
		expect(a.state!.countdownAt).toBe(6000);
		if (change === "unready") { await act(a, { kind: "ready", ready: false }); }
		else if (change === "disconnect") { b.socket.disconnect(); }
		else { await connect(url, roomId, "C"); }
		await waitFor(() => a.state!.countdownAt === null);
		time = 10000;
		expect((await act(a, { kind: "ready", ready: false })).ok).toBe(true);
		expect(a.state!.game).toBeNull();
	});
	it("only permits AFK replacement after 60 seconds of a required action, and cancels on response", async function () {
		let time = 1000;
		const { runtime, url } = await start(":memory:", { countdownMs: 0, now: () => time });
		const roomId = (await runtime.app.inject({ method: "POST", url: "/api/rooms" })).json<{ id: string }>().id;
		const a = await connect(url, roomId, "A"); const b = await connect(url, roomId, "B");
		await synced([a, b]); await act(a, { kind: "ready", ready: true });
		await synced([a, b]); await act(b, { kind: "ready", ready: true });
		await waitFor(() => Boolean(a.state!.game && b.state!.game));
		const spectator = await connect(url, roomId, "Katsoja");
		await synced([a, b, spectator]);
		const actor = [a, b].find(c => c.state!.game!.seats.find(s => s.personId === c.state!.me)!.id === c.state!.game!.activeSeatId)!;
		const target = actor === a ? b : a;
		const activeSeat = actor.state!.game!.activeSeatId;
		const targetSeat = actor.state!.game!.seats.find(s => s.personId === target.state!.me)!.id;
		time = actor.state!.promptAt! + 60000;
		expect((await act(spectator, { kind: "request-seat", seatId: activeSeat })).ok).toBe(false);
		time++;
		expect((await act(spectator, { kind: "request-seat", seatId: targetSeat })).ok).toBe(false);
		expect((await act(spectator, { kind: "request-seat", seatId: activeSeat })).ok).toBe(true);
		await synced([a, b, spectator]);
		expect((await act(actor, { kind: "game", action: { type: "send", cardId: actor.state!.game!.hand[0]!.id, targetId: targetSeat, creature: "torakka" } })).ok).toBe(true);
		await synced([a, b, spectator]);
		expect(spectator.state!.vote).toBeNull();
		expect((await act(target, { kind: "vote", approve: true })).ok).toBe(false);
		expect(target.state!.game!.challenge!.card).toBeNull();
	});
});


describe("terminal game controls", function () {
	it("cancels an unrelated replacement vote when a normal game resolution ends the match", async function () {
		const { runtime, url } = await start();
		const roomId = (await runtime.app.inject({ method: "POST", url: "/api/rooms" })).json<{ id: string }>().id;
		const group: Client[] = [];
		for (const name of ["A", "B", "C"]) { group.push(await connect(url, roomId, name)); }
		for (const client of group) { await synced(group); expect((await act(client, { kind: "ready", ready: true })).ok).toBe(true); }
		await waitFor(() => group.every(c => Boolean(c.state!.game)));
		const leader = group.find(c => c.state!.game!.seats.find(s => s.personId === c.state!.me)!.id === c.state!.game!.activeSeatId)!;
		const others = group.filter(c => c !== leader);
		const receiver = others[0]!; const absent = others[1]!;
		const spectator = await connect(url, roomId, "Uusi");
		await synced([...group, spectator]);
		const absentSeat = absent.state!.game!.seats.find(s => s.personId === absent.state!.me)!.id;
		const receiverSeat = receiver.state!.game!.seats.find(s => s.personId === receiver.state!.me)!.id;
		absent.socket.disconnect();
		await waitFor(() => !spectator.state!.members.find(m => m.id === absent.state!.me)!.online);
		expect((await act(spectator, { kind: "request-seat", seatId: absentSeat })).ok).toBe(true);
		for (let turn = 0; turn < 25 && leader.state!.game!.phase !== "ended"; turn++) {
			await synced([leader, receiver, spectator]);
			const hand = leader.state!.game!.hand;
			const card = [...hand].sort((a, b) => hand.filter(c => c.creature === b.creature).length - hand.filter(c => c.creature === a.creature).length)[0]!;
			expect((await act(leader, { kind: "game", action: { type: "send", cardId: card.id, targetId: receiverSeat, creature: card.creature } })).ok).toBe(true);
			await synced([leader, receiver, spectator]);
			expect((await act(receiver, { kind: "game", action: { type: "answer", believes: true } })).ok).toBe(true);
			await synced([leader, receiver, spectator]);
		}
		expect(leader.state!.game!.phase).toBe("ended");
		expect(leader.state!.history).toHaveLength(1);
		expect(leader.state!.vote).toBeNull();
		expect((await act(receiver, { kind: "vote", approve: true })).ok).toBe(false);
	});
});
