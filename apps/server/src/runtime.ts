import Fastify, { type FastifyInstance } from "fastify";
import staticFiles from "@fastify/static";
import { Server, type Socket } from "socket.io";
import { randomInt, randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { applyAction, chooseComputerAction, chooseComputerPrediction, createMatch, DEFAULT_THEME, endMatch, GameError, lastClaim, projectMatch, recap, removeSeat, replacePerson, requireCondition, type Match, type Random, type Recap, type ThemeRef } from "@torakka/game";
import { commandSchema, joinSchema, type Command, type OpenRoomView, type Reply, type RoomView, type VoteView } from "@torakka/protocol";
import { Store } from "./store";

interface Member { id: string; name: string; token: string; computer: boolean }
interface Room {
	id: string; revision: number; members: Member[]; seated: string[]; ready: string[]; hostId: string;
	countdownAt: number | null; game: Match | null; history: Recap[]; vote: VoteView | null;
	waitingSeatId: string | null; promptAt: number | null; closed: boolean; open: boolean; theme: ThemeRef; notice: string; lastActivityAt: number;
}
export interface Runtime { app: FastifyInstance; io: Server; store: Store; close: () => Promise<void> }
const COMPUTER_NAMES = ["🤖 Ruttunen", "🤖 Virtanen", "🤖 Servola", "🤖 Laakeri", "🤖 Raksutin", "🤖 Vieterä", "🤖 Koneisto", "🤖 Roottori"] as const;
const ROOM_CODE_FIRST = ["ahnas", "hilpea", "karvainen", "kiero", "likainen", "nokkela", "paatynyt", "ruma", "salainen", "uninen", "viekas", "ylpea"] as const;
const ROOM_CODE_SECOND = ["baarin", "kellarin", "klubin", "kujan", "metsan", "mokin", "sataman", "saunan", "torin", "ullakon", "varaston", "viemarin"] as const;
const ROOM_CODE_THIRD = ["herrasmies", "huijari", "lurjus", "molkky", "orvokki", "pokka", "rotta", "sankari", "sukka", "torakka", "velho", "orkki"] as const;
const roomInactivityMs = 30 * 60 * 1000;
function random(): number { return randomInt(0, 2 ** 32) / 2 ** 32; }
function normalizeName(name: string): string {
	return name.trim().normalize("NFKC").toLocaleLowerCase("fi");
}
function createComputerName(room: Room, randomSource: Random): string {
	const available = COMPUTER_NAMES.filter(name => !room.members.some(member => member.name === name));
	if (available.length) { return available[Math.min(available.length - 1, Math.floor(randomSource() * available.length))]!; }
	return `🤖 Kusetusbotti ${room.members.filter(member => member.computer).length + 1}`;
}
function ensureComputerReadiness(room: Room): void {
	if (room.game) { return; }
	const ready = new Set(room.ready.filter(id => room.seated.includes(id)));
	for (const member of room.members) {
		if (member.computer && room.seated.includes(member.id)) { ready.add(member.id); }
	}
	room.ready = [...ready];
}
function promptKey(game: Match | null): string {
	if (!game || game.phase === "ended") { return ""; }
	return `${game.phase}:${game.challenge?.id ?? ""}:${game.challenge?.claims.length ?? 0}:${game.phase === "initiation" ? game.activeSeatId : lastClaim(game.challenge!).receiverId}`;
}
function requiredSeat(game: Match): string | null {
	if (game.phase === "ended") { return null; }
	return game.phase === "initiation" ? game.activeSeatId : lastClaim(game.challenge!).receiverId;
}
export async function createRuntime(path: string, options: { countdownMs?: number; computerDelayMs?: number; now?: () => number; random?: Random } = {}): Promise<Runtime> {
	const app = Fastify({ logger: false, bodyLimit: 32768 });
	const io = new Server(app.server, { maxHttpBufferSize: 32768 });
	const store = new Store(path);
	const rooms = new Map<string, Room>();
	const connections = new Map<string, Socket>();
	const now = options.now ?? Date.now;
	const randomSource = options.random ?? random;
	const countdownMs = options.countdownMs ?? 5000;
	const computerDelayMs = options.computerDelayMs ?? 4300;
	const computerTimers = new Map<string, ReturnType<typeof setTimeout>>();
	for (const state of store.all()) {
		const room = JSON.parse(state) as Room;
		if (room.members.length === 0 || (!room.game && room.history.length === 0 && room.members.every(member => !member.computer))) {
			store.delete(room.id); continue;
		}
		let computerIndex = 0;
		for (const member of room.members) {
			if (!member.computer) { continue; }
			if (/^Tietokone \d+$/.test(member.name)) { member.name = COMPUTER_NAMES[computerIndex] ?? `🤖 Kusetusbotti ${computerIndex + 1}`; }
			computerIndex++;
		}
		room.lastActivityAt ??= now();
		room.open ??= true;
		room.theme ??= structuredClone(DEFAULT_THEME);
		if (room.game) { room.game.theme ??= structuredClone(room.theme); }
		for (const item of room.history) { item.theme ??= structuredClone(DEFAULT_THEME); }
		room.countdownAt = null; room.ready = []; room.vote = null; room.promptAt = null; ensureComputerReadiness(room); room.revision++;
		rooms.set(room.id, room); store.save(room.id, JSON.stringify(room));
	}
	function online(id: string): boolean { return connections.has(id); }
	function memberOnline(room: Room, id: string): boolean { return online(id) || room.members.some(m => m.id === id && m.computer); }
	function save(room: Room, receipt?: { actor: string; commandId: string }): void {
		ensureComputerReadiness(room);
		room.revision++;
		store.save(room.id, JSON.stringify(room), receipt);
		rooms.set(room.id, room);
	}
	function touch(room: Room): void { room.lastActivityAt = now(); }
	function createRoomCode(): string {
		const total = ROOM_CODE_FIRST.length * ROOM_CODE_SECOND.length * ROOM_CODE_THIRD.length;
		const start = Math.min(total - 1, Math.floor(randomSource() * total));
		for (let offset = 0; offset < total; offset++) {
			const value = (start + offset) % total;
			const third = value % ROOM_CODE_THIRD.length;
			const second = Math.floor(value / ROOM_CODE_THIRD.length) % ROOM_CODE_SECOND.length;
			const first = Math.floor(value / (ROOM_CODE_THIRD.length * ROOM_CODE_SECOND.length));
			const code = `${ROOM_CODE_FIRST[first]}-${ROOM_CODE_SECOND[second]}-${ROOM_CODE_THIRD[third]}`;
			if (!rooms.has(code)) { return code; }
		}
		throw new GameError("Kaikki huonekoodit ovat käytössä.");
	}
	function deleteRoom(room: Room): void {
		const computerTimer = computerTimers.get(room.id);
		if (computerTimer) { clearTimeout(computerTimer); computerTimers.delete(room.id); }
		for (const [memberId, socket] of connections) {
			if (room.members.some(member => member.id === memberId)) { socket.emit("lobby-closed"); socket.disconnect(); connections.delete(memberId); }
		}
		rooms.delete(room.id); store.delete(room.id);
	}
	function publicView(room: Room, me: string): RoomView {
		return { id: room.id, revision: room.revision, me, hostId: room.hostId,
			members: room.members.map(m => ({ id: m.id, name: m.name, online: memberOnline(room, m.id), seated: room.seated.includes(m.id), ready: room.ready.includes(m.id), computer: m.computer })),
			countdownAt: room.countdownAt, game: room.game ? projectMatch(room.game, me) : null, vote: room.vote,
			waitingSeatId: room.waitingSeatId, promptAt: room.promptAt, closed: room.closed, open: room.open, theme: room.theme, notice: room.notice, history: room.history };
	}
	function broadcast(room: Room): void {
		for (const member of room.members) { connections.get(member.id)?.emit("state", publicView(room, member.id)); }
	}
	function rememberEnd(room: Room): void {
		if (room.game?.phase === "ended") {
			if (!room.history.some(h => h.id === room.game!.id)) { room.history.push(recap(room.game)); }
			room.vote = null;
			room.waitingSeatId = null;
		}
	}
	function updatePrompt(room: Room, previous: string): void {
		if (promptKey(room.game) !== previous) { room.promptAt = room.game?.phase === "ended" ? null : now(); }
	}
	function scheduleComputerTurn(room: Room): void {
		if (computerTimers.has(room.id) || !room.game || room.game.phase === "ended") { return; }
		const seatId = requiredSeat(room.game);
		const seat = room.game.seats.find(candidate => candidate.id === seatId && !candidate.removed);
		const member = room.members.find(candidate => candidate.id === seat?.personId);
		const predictionAvailable = room.members.some(candidate => candidate.computer && chooseComputerPrediction(room.game!, candidate.id));
		if ((!seat || !member?.computer) && !predictionAvailable) { return; }
		const timer = setTimeout(function () {
			computerTimers.delete(room.id);
			const original = rooms.get(room.id);
			if (!original?.game || original.game.phase === "ended") { return; }
			const next = structuredClone(original);
			const previous = promptKey(next.game);
			let changed = false;
			for (const candidate of next.members.filter(item => item.computer)) {
				const prediction = chooseComputerPrediction(next.game!, candidate.id);
				const predictionSeat = next.game!.seats.find(item => item.personId === candidate.id && !item.removed);
				if (prediction && predictionSeat) { next.game = applyAction(next.game!, predictionSeat.id, prediction, now()); changed = true; }
			}
			const nextSeatId = requiredSeat(next.game!);
			const nextSeat = next.game!.seats.find(candidate => candidate.id === nextSeatId && !candidate.removed);
			const nextMember = next.members.find(candidate => candidate.id === nextSeat?.personId);
			if (nextSeat && nextMember?.computer) {
				next.game = applyAction(next.game!, nextSeat.id, chooseComputerAction(next.game!, nextMember.id), now());
				changed = true;
			}
			if (!changed) { return; }
			updatePrompt(next, previous); rememberEnd(next); save(next); broadcast(next); scheduleComputerTurn(next);
		}, computerDelayMs);
		computerTimers.set(room.id, timer);
	}
	function mutate(room: Room, actor: string, command: Command): void {
		const action = command.action;
		const game = room.game;
		const member = room.members.find(m => m.id === actor)!;
		if (action.kind === "ready" || action.kind === "sit" || action.kind === "stand") {
			requireCondition(!game, "Odota pelin päättymistä ja uutta aulaa.");
			if (action.kind === "sit") {
				requireCondition(room.seated.length < 6 && !room.seated.includes(actor), "Paikkaa ei ole vapaana.");
				room.seated.push(actor); room.countdownAt = null;
			}
			else if (action.kind === "stand") { room.seated = room.seated.filter(id => id !== actor); room.ready = room.ready.filter(id => id !== actor); room.countdownAt = null; }
			else {
				requireCondition(room.seated.includes(actor), "Katsoja ei voi ilmoittautua valmiiksi.");
				room.ready = room.ready.filter(id => id !== actor);
				if (action.ready) { room.ready.push(actor); }
				else { room.countdownAt = null; }
			}
			if (room.seated.length >= 2 && room.seated.every(id => room.ready.includes(id) && memberOnline(room, id))) { room.countdownAt ??= now() + countdownMs; }
			return;
		}
		if (action.kind === "add-computer") {
			requireCondition(actor === room.hostId && !game, "Vain isäntä voi lisätä tietokonepelaajan ennen peliä.");
			requireCondition(room.seated.length < 6, "Kaikki paikat ovat jo täynnä.");
			const name = createComputerName(room, randomSource);
			const member: Member = { id: randomUUID(), name, token: randomUUID(), computer: true };
			room.members.push(member);
			room.seated.push(member.id); room.ready.push(member.id);
			room.countdownAt = null;
			room.notice = `${member.name} lisättiin pöytään.`;
			return;
		}
		if (action.kind === "set-open") {
			requireCondition(actor === room.hostId && !game, "Vain isäntä voi muuttaa aulan näkyvyyttä ennen peliä.");
			room.open = action.open;
			room.notice = action.open ? "Aula näkyy nyt avoimien pöytien listalla." : "Aula on nyt yksityinen.";
			return;
		}
		if (action.kind === "set-theme") {
			requireCondition(actor === room.hostId && (room.game !== null || room.countdownAt === null), "Vain isäntä voi vaihtaa teemaa lähtölaskennan ulkopuolella.");
			room.theme = { id: action.themeId, version: 1 };
			if (room.game) {
				room.game.theme = structuredClone(room.theme);
				const recap = room.history.find(item => item.id === room.game!.id);
				if (recap) { recap.theme = structuredClone(room.theme); }
			}
			room.notice = action.themeId === "herrasmiespokeri" ? "Herrasmiespokeri on katettu." : "Örkkipokka on katettu.";
			return;
		}
		if (action.kind === "leave-table") {
			requireCondition(!game, "Peliä käynnissä et voi jättää pöytää.");
			const leaving = room.members.find(m => m.id === actor)!;
			room.members = room.members.filter(m => m.id !== actor);
			room.seated = room.seated.filter(id => id !== actor);
			room.ready = room.ready.filter(id => id !== actor);
			if (room.vote && room.vote.requesterId === actor) { room.vote = null; }
			if (room.hostId === actor) { room.hostId = room.members.find(m => m.id !== actor)?.id ?? ""; }
			room.notice = `${leaving.name} poistui pöydästä.`;
			return;
		}
		if (action.kind === "close-lobby") {
			requireCondition(actor === room.hostId, "Vain isäntä voi sulkea aulan.");
			requireCondition(!room.game || room.game.phase === "ended", "Peli on käynnissä. Sulje peli ensin.");
			return;
		}
		if (action.kind === "game") {
			requireCondition(game, "Peli ei ole alkanut.");
			requireCondition(!room.waitingSeatId, "Odotetaan korvaavaa pelaajaa.");
			const seat = game.seats.find(s => !s.removed && s.personId === actor);
			requireCondition(seat, "Katsoja ei voi pelata.");
			room.game = applyAction(game, seat.id, action.action, now());
			if (room.vote?.seatId === seat.id && action.action.type !== "predict") { room.vote = null; }
		}
		else if (action.kind === "rematch") {
			requireCondition(game, "Peli ei ole alkanut.");
			requireCondition(actor === room.hostId && game.phase === "ended", "Vain isäntä voi avata uuden aulan pelin päätyttyä.");
			room.game = null; room.ready = room.seated.filter(id => room.members.some(member => member.id === id && member.computer)); room.countdownAt = null; room.vote = null; room.waitingSeatId = null;
			room.notice = "Uusi peli, samat huonot ystävät. Ilmoittaudu valmiiksi.";
		}
		else if (action.kind === "end") {
			requireCondition(game, "Peli ei ole alkanut.");
			requireCondition(actor === room.hostId && game.phase !== "ended", "Vain isäntä voi päättää käynnissä olevan pelin.");
			room.game = endMatch(game, now()); room.vote = null; room.waitingSeatId = null;
		}
		else if (action.kind === "remove") {
			requireCondition(actor === room.hostId, "Vain isäntä voi poistaa pelaajan.");
			requireCondition(!game || game.phase !== "ended", "Avaa uusi aula ennen pelaajien poistamista.");
			const target = game?.seats.find(s => s.id === action.seatId && !s.removed) ?? room.members.find(m => m.id === action.seatId);
			requireCondition(target, "Pelaajaa ei ole pöydässä.");
			if (!game) {
				requireCondition(target.id !== room.hostId, "Isäntä ei voi poistaa itseään.");
				room.members = room.members.filter(m => m.id !== target.id);
				room.seated = room.seated.filter(id => id !== target.id);
				room.ready = room.ready.filter(id => id !== target.id);
				room.countdownAt = null;
				if (room.vote && room.vote.requesterId === target.id) { room.vote = null; }
				room.notice = `${target.name} poistettiin pöydästä.`;
				const socket = connections.get(target.id);
				if (socket) { socket.disconnect(); }
				return;
			}
			const seated = game.seats.find(s => s.id === action.seatId && !s.removed);
			requireCondition(seated && !memberOnline(room, seated.personId), "Voit poistaa vain yhteydettömän pelaajan.");
			if (game.seats.filter(s => !s.removed).length <= 3) {
				room.waitingSeatId = seated.id; room.notice = "Jatkamiseen tarvitaan korvaava pelaaja. Voitte myös päättää pelin.";
			}
			else {
				room.game = removeSeat(game, seated.id, randomSource, now());
				room.seated = room.seated.filter(id => id !== seated.personId); room.vote = null;
				room.notice = `${seated.name} poistettiin. Käden kortit jaettiin uudelleen.`;
			}
		}
		else if (action.kind === "request-seat") {
			requireCondition(game, "Peli ei ole alkanut.");
			requireCondition(game.phase !== "ended" && !room.seated.includes(actor) && !room.vote, "Paikkapyyntö ei ole nyt mahdollinen.");
			const target = game.seats.find(s => s.id === action.seatId && !s.removed);
			requireCondition(target, "Paikkaa ei ole.");
			const afk = requiredSeat(game) === target.id && room.promptAt !== null && now() - room.promptAt > 60000;
			requireCondition(!online(target.personId) || afk, "Pelaaja ei ole poissa.");
			const voters = room.seated.filter(id => id !== target.personId && id !== actor && memberOnline(room, id));
			requireCondition(voters.length, "Paikan vaihto tarvitsee pelaajan hyväksynnän.");
			room.vote = { seatId: target.id, requesterId: actor, voters, approvals: [], rejected: [] };
			room.notice = `${member.name} pyytää pelaajan ${target.name} paikkaa.`;
		}
		else if (action.kind === "vote") {
			requireCondition(game, "Peli ei ole alkanut.");
			const vote = room.vote;
			requireCondition(vote && vote.voters.includes(actor), "Et voi äänestää tässä pyynnössä.");
			vote.approvals = vote.approvals.filter(id => id !== actor); vote.rejected = vote.rejected.filter(id => id !== actor);
			(action.approve ? vote.approvals : vote.rejected).push(actor);
			const required = Math.floor(vote.voters.length / 2) + 1;
			if (vote.approvals.length >= required) {
				const replacement = room.members.find(m => m.id === vote.requesterId)!;
				requireCondition(memberOnline(room, replacement.id), "Korvaava pelaaja ei ole enää paikalla.");
				const old = game.seats.find(s => s.id === vote.seatId)!;
				room.game = replacePerson(game, old.id, replacement);
				room.seated = room.seated.map(id => id === old.personId ? replacement.id : id);
				room.waitingSeatId = null; room.promptAt = now(); room.vote = null;
				room.notice = `${replacement.name} otti pelaajan ${old.name} paikan.`;
			}
			else if (vote.rejected.length > vote.voters.length - required) { room.vote = null; room.notice = "Paikkapyyntö hylättiin."; }
		}
	}
	app.get("/api/health", async function () { return { ok: true }; });
	app.get("/api/rooms/open", async function (): Promise<OpenRoomView[]> {
		return [...rooms.values()].filter(room => room.open && !room.closed && room.members.length > 0).sort((a, b) => b.lastActivityAt - a.lastActivityAt).map(function (room) {
			return { id: room.id, hostName: room.members.find(member => member.id === room.hostId)?.name ?? "Tuntematon", seatedCount: room.seated.length, spectatorCount: room.members.length - room.seated.length, playing: Boolean(room.game && room.game.phase !== "ended"), themeId: room.theme.id };
		});
	});
	app.get<{ Params: { id: string } }>("/api/rooms/:id/appearance", async function (request, reply) {
		const room = rooms.get(request.params.id);
		if (!room || room.closed) { return reply.code(404).send({ error: "Huonetta ei löytynyt." }); }
		return { theme: room.theme };
	});
	app.post("/api/rooms", async function (_request, _reply) {
		const room: Room = { id: createRoomCode(), revision: 0, members: [], seated: [], ready: [], hostId: "", countdownAt: null,
			game: null, history: [], vote: null, waitingSeatId: null, promptAt: null, closed: false, open: true, theme: structuredClone(DEFAULT_THEME), notice: "Tervetuloa pöytään.", lastActivityAt: now() };
		save(room); return { id: room.id };
	});
	io.on("connection", function (socket) {
		let identity: { roomId: string; personId: string } | null = null;
		let commands = 0;
		let rateWindow = now();
		function replyError(error: unknown, acknowledge: (reply: Reply) => void): void {
			acknowledge({ ok: false, error: error instanceof GameError ? error.message : "Pyyntö epäonnistui. Tarkista tiedot ja yritä uudelleen." });
		}
		socket.on("join", function (input: unknown, acknowledge: (reply: Reply) => void) {
			if (typeof acknowledge !== "function") { return; }
			try {
				requireCondition(!identity, "Olet jo liittynyt huoneeseen.");
				const parsed = joinSchema.safeParse(input);
				requireCondition(parsed.success, "Anna kelvollinen nimi ja kutsulinkki.");
				const data = parsed.data;
				const existing = rooms.get(data.roomId);
				requireCondition(existing, "Huonetta ei löytynyt. Tarkista kutsulinkki.");
				requireCondition(!existing.closed, "Pöytä on suljettu. Uusia pelaajia ei voi liittyä.");
				const room = structuredClone(existing);
				const normalizedName = normalizeName(data.name);
				let member = data.token ? room.members.find(m => m.token === data.token) : undefined;
				let replaced = false;
				if (!member) {
					const named = room.members.find(m => normalizeName(m.name) === normalizedName);
					if (named) {
						requireCondition(normalizeName(named.name) === normalizedName && !memberOnline(room, named.id), "Nimi on jo käytössä.");
						const removed = room.game?.seats.some(s => s.personId === named.id && s.removed);
						requireCondition(!removed, "Tämä paikka on poistettu pelistä.");
						member = named; member.token = randomUUID(); replaced = true;
					}
					else {
						member = { id: randomUUID(), name: data.name, token: randomUUID(), computer: false };
						room.members.push(member);
						if (!room.game && room.seated.length < 6) { room.seated.push(member.id); room.countdownAt = null; }
					}
				}
				const currentHost = room.members.find(candidate => candidate.id === room.hostId);
				if (!room.hostId || currentHost?.computer) { room.hostId = member.id; }
				const wasOnline = memberOnline(room, member.id);
				if (connections.has(member.id)) { connections.get(member.id)!.emit("replaced"); }
				identity = { roomId: room.id, personId: member.id };
				connections.set(member.id, socket);
				if (room.vote && ((!wasOnline && room.seated.includes(member.id)) || room.vote.voters.includes(member.id) || room.game?.seats.find(s => s.id === room.vote!.seatId)?.personId === member.id)) { room.vote = null; }
				if (room.waitingSeatId && room.game?.seats.find(s => s.id === room.waitingSeatId)?.personId === member.id) { room.waitingSeatId = null; }
				if (room.game && requiredSeat(room.game) === room.game.seats.find(s => s.personId === member.id)?.id) { room.promptAt = now(); }
				room.notice = replaced ? `${member.name} palasi paikalle toiselta laitteelta.` : `${member.name} liittyi pöytään.`;
				touch(room); save(room); acknowledge({ ok: true, token: member.token }); broadcast(room);
			}
			catch (error) { replyError(error, acknowledge); }
		});
		socket.on("command", function (input: unknown, acknowledge: (reply: Reply) => void) {
			if (typeof acknowledge !== "function") { return; }
			try {
				requireCondition(identity && connections.get(identity.personId) === socket, "Paikkasi on käytössä toisella laitteella.");
				if (now() - rateWindow > 1000) { rateWindow = now(); commands = 0; }
				requireCondition(++commands <= 30, "Liian monta toimintoa. Odota hetki.");
				const parsed = commandSchema.safeParse(input);
				requireCondition(parsed.success, "Virheellinen toiminto.");
				const command = parsed.data;
				const original = rooms.get(identity.roomId)!;
				if (store.hasReceipt(original.id, identity.personId, command.id)) { acknowledge({ ok: true }); socket.emit("state", publicView(original, identity.personId)); return; }
				if (original.revision !== command.revision) { socket.emit("state", publicView(original, identity.personId)); throw new GameError("Tilanne muuttui. Tarkista valinta ja yritä uudelleen."); }
				const room = structuredClone(original);
				mutate(room, identity.personId, command);
				updatePrompt(room, promptKey(original.game)); rememberEnd(room);
				touch(room);
				const destroyed = command.action.kind === "close-lobby" || (command.action.kind === "leave-table" && room.members.length === 0);
				save(room, { actor: identity.personId, commandId: command.id });
				if (destroyed) {
					acknowledge({ ok: true });
					deleteRoom(room);
					return;
				}
				acknowledge({ ok: true }); broadcast(room); scheduleComputerTurn(room);
			}
			catch (error) { replyError(error, acknowledge); }
		});
		socket.on("disconnect", function () {
			if (!identity || connections.get(identity.personId) !== socket) { return; }
			connections.delete(identity.personId);
			const original = rooms.get(identity.roomId);
			if (!original) { return; }
			const room = structuredClone(original);
			room.ready = room.ready.filter(id => id !== identity!.personId);
			if (room.seated.includes(identity.personId)) { room.countdownAt = null; }
			if (room.vote && (room.vote.voters.includes(identity.personId) || room.vote.requesterId === identity.personId)) { room.vote = null; }
			if (room.members.some(m => memberOnline(room, m.id))) { touch(room); save(room); broadcast(room); return; }
			if (room.game || room.history.length > 0) { save(room); return; }
			rooms.delete(room.id); store.delete(room.id);
		});
	});
	const timer = setInterval(function () {
		for (const original of rooms.values()) {
			if (original.countdownAt !== null && original.countdownAt <= now()) {
				const room = structuredClone(original);
				room.countdownAt = null;
				if (room.seated.length >= 2 && room.seated.every(id => room.ready.includes(id) && memberOnline(room, id))) {
					room.game = createMatch(randomUUID(), room.seated.map(id => room.members.find(m => m.id === id)!), randomSource, now(), room.theme);
					room.promptAt = now(); room.ready = []; room.notice = "Kortit jaettu. Älä luota kehenkään.";
				}
				touch(room); save(room); broadcast(room); scheduleComputerTurn(room);
			}
			if (now() - original.lastActivityAt >= roomInactivityMs) {
				const room = structuredClone(original);
				for (const member of room.members) {
					if (connections.has(member.id)) { continue; }
				}
				deleteRoom(room);
			}
		}
	}, 1000);
	const webRoot = resolve("apps/web/dist");
	if (existsSync(webRoot)) {
		await app.register(staticFiles, { root: webRoot });
		app.setNotFoundHandler(function (_request, reply) { return reply.sendFile("index.html"); });
	}
	for (const room of rooms.values()) { scheduleComputerTurn(room); }
	return { app, io, store, close: async function (): Promise<void> { clearInterval(timer); for (const computerTimer of computerTimers.values()) { clearTimeout(computerTimer); } await new Promise<void>(function (done) { io.close(function () { done(); }); }); await app.close(); store.close(); } };
}
