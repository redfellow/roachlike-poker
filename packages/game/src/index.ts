export const CREATURES = ["torakka", "lepakko", "karpanen", "sammakko", "rotta", "skorpioni", "hamahakki", "lude"] as const;
export type Creature = typeof CREATURES[number];
export const LABELS: Readonly<Record<Creature, string>> = {
	torakka: "Örkki", lepakko: "Lepakko", karpanen: "Kärpänen", sammakko: "Sammakko",
	rotta: "Rotta", skorpioni: "Skorpiooni", hamahakki: "Hämähäkki", lude: "Lude"
};
export interface Card { id: string; creature: Creature }
export interface Seat { id: string; personId: string; name: string; hand: Card[]; display: Card[]; removed: boolean }
export interface Person { id: string; name: string }
export interface Prediction { personId: string; believes: boolean }
export interface Claim { senderId: string; senderPersonId: string; receiverId: string; creature: Creature; predictions: Prediction[]; locked: boolean }
export interface Challenge { id: string; card: Card; originalOwnerId: string; seenSeats: string[]; seenPeople: string[]; claims: Claim[] }
export interface Resolution {
	id: string; card: Card; claims: Claim[]; receiverPersonId: string; receiverBelieves: boolean;
	penaltySeatId: string; penaltyPersonId: string; cancelled: boolean; ended: boolean;
}
export interface Match {
	id: string; startedAt: number; endedAt: number | null; phase: "initiation" | "response" | "passing" | "ended";
	seats: Seat[]; people: Person[]; threshold: number; activeSeatId: string; challenge: Challenge | null;
	unseen: Card[]; retired: Card[]; resolutions: Resolution[]; loserSeatId: string | null;
	endReason: "matching" | "empty" | "abandoned" | null; nextChallenge: number;
}
export type GameAction =
	| { type: "send"; cardId: string; targetId: string; creature: Creature }
	| { type: "answer"; believes: boolean }
	| { type: "peek" }
	| { type: "pass"; targetId: string; creature: Creature }
	| { type: "predict"; challengeId: string; claimIndex: number; believes: boolean };
export interface PublicSeat { id: string; personId: string; name: string; handCount: number; display: Card[]; removed: boolean }
export interface PublicClaim { senderId: string; senderPersonId: string; receiverId: string; creature: Creature }
export interface GameView {
	id: string; phase: Match["phase"]; threshold: number; activeSeatId: string; seats: PublicSeat[];
	hand: Card[]; challenge: { id: string; claims: PublicClaim[]; card: Card | null; eligibleTargets: string[]; canPredict: boolean; prediction: boolean | null } | null;
	lastResolution: Resolution | null; loserSeatId: string | null; endReason: Match["endReason"];
	retired: Card[]; scores: Score[];
}
export interface Score { personId: string; name: string; correct: number; submitted: number; answersCorrect: number; answersSubmitted: number; bluffCallsCorrect: number; bluffCallsWrong: number; bluffs: number; bluffsCaught: number; catches: number }
export interface Award { key: string; personIds: string[] }
export interface Recap { id: string; startedAt: number; endedAt: number | null; loserName: string | null; reason: Match["endReason"]; scores: Score[]; awards: Award[]; resolutions: Resolution[] }
export class GameError extends Error {
	constructor(message: string) { super(message); this.name = "GameError"; }
}
export type Random = () => number;
export function requireCondition(condition: unknown, message: string): asserts condition {
	if (!condition) { throw new GameError(message); }
}
export function shuffle<T>(items: readonly T[], random: Random): T[] {
	const result = [...items];
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		requireCondition(j >= 0 && j <= i, "Virheellinen satunnaisluku.");
		[result[i], result[j]] = [result[j]!, result[i]!];
	}
	return result;
}
export function createMatch(id: string, players: readonly Person[], random: Random, now: number): Match {
	requireCondition(players.length >= 2 && players.length <= 6, "Peliin tarvitaan 2–6 pelaajaa.");
	requireCondition(new Set(players.map(p => p.id)).size === players.length, "Pelaajat eivät saa toistua.");
	const creatures = shuffle(CREATURES.flatMap(creature => Array.from({ length: 8 }, () => creature)), random);
	const deck: Card[] = creatures.map((creature, index) => ({ id: `${id}:c${index}`, creature }));
	const unseen = players.length === 2 ? deck.splice(0, 10) : [];
	const seats: Seat[] = players.map((p, i) => ({ id: `s${i}`, personId: p.id, name: p.name, hand: [], display: [], removed: false }));
	const dealingOrder = shuffle(seats, random);
	deck.forEach(function (card, index) { dealingOrder[index % seats.length]!.hand.push(card); });
	return {
		id, startedAt: now, endedAt: null, phase: "initiation", seats, people: [...players], threshold: players.length === 2 ? 5 : 4,
		activeSeatId: seats[Math.floor(random() * seats.length)]!.id, challenge: null, unseen, retired: [], resolutions: [],
		loserSeatId: null, endReason: null, nextChallenge: 1
	};
}
export function getSeat(match: Match, id: string): Seat {
	const seat = match.seats.find(s => s.id === id);
	requireCondition(seat && !seat.removed, "Pelaajapaikka ei ole käytössä.");
	return seat;
}
export function lastClaim(challenge: Challenge): Claim {
	return challenge.claims[challenge.claims.length - 1]!;
}
export function eligibleTargets(match: Match): string[] {
	const challenge = match.challenge;
	if (!challenge) { return []; }
	return match.seats.filter(s => !s.removed && !challenge.seenSeats.includes(s.id) && s.id !== lastClaim(challenge).receiverId && !challenge.seenPeople.includes(s.personId)).map(s => s.id);
}
function selectCard(seat: Seat): Card {
	const counts = new Map<Creature, number>();
	for (const card of seat.hand) { counts.set(card.creature, (counts.get(card.creature) ?? 0) + 1); }
	return [...seat.hand].sort(function (a, b) {
		return (counts.get(b.creature)! - counts.get(a.creature)!) || CREATURES.indexOf(b.creature) - CREATURES.indexOf(a.creature) || b.id.localeCompare(a.id);
	})[0]!;
}
function selectRotatingTarget(match: Match, seat: Seat, targetIds: readonly string[], turn: number): string {
	const targets = match.seats.filter(candidate => targetIds.includes(candidate.id));
	requireCondition(targets.length > 0, "Tietokoneella ei ole sallittua kohdetta.");
	const seatIndex = match.seats.findIndex(candidate => candidate.id === seat.id);
	return targets[(turn - 1 + seatIndex) % targets.length]!.id;
}
function selectTarget(match: Match, seat: Seat): string {
	const targets = match.seats.filter(candidate => !candidate.removed && candidate.id !== seat.id).map(candidate => candidate.id);
	return selectRotatingTarget(match, seat, targets, match.nextChallenge);
}
function publicCoinFlip(value: string): boolean {
	let hash = 2166136261;
	for (const character of value) {
		hash ^= character.charCodeAt(0);
		hash = Math.imul(hash, 16777619);
	}
	return (hash & 1) === 0;
}
function alternateCreature(creature: Creature, value: string): Creature {
	const offset = publicCoinFlip(value) ? 1 : 3;
	return CREATURES[(CREATURES.indexOf(creature) + offset) % CREATURES.length]!;
}
export function chooseComputerPrediction(match: Match, personId: string): Extract<GameAction, { type: "predict" }> | null {
	const view = projectMatch(match, personId);
	if (!match.challenge || !view.challenge?.canPredict || view.challenge.prediction !== null) { return null; }
	const claimIndex = match.challenge.claims.length - 1;
	const claim = lastClaim(match.challenge);
	return {
		type: "predict",
		challengeId: match.challenge.id,
		claimIndex,
		believes: publicCoinFlip(`prediction:${match.challenge.id}:${claimIndex}:${personId}:${claim.creature}`)
	};
}
export function chooseComputerAction(match: Match, personId: string): GameAction {
	const seat = match.seats.find(s => s.personId === personId && !s.removed);
	requireCondition(seat, "Tietokonepelaajaa ei löytynyt.");
	if (match.phase === "initiation") {
		const card = selectCard(seat);
		const truthful = publicCoinFlip(`claim:${match.id}:${match.nextChallenge}:${seat.id}:${card.id}`);
		return { type: "send", cardId: card.id, targetId: selectTarget(match, seat), creature: truthful ? card.creature : alternateCreature(card.creature, card.id) };
	}
	requireCondition(match.challenge, "Tietokone ei voi valita toimintoa ilman väitettä.");
	const claim = lastClaim(match.challenge);
	if (match.phase === "response") {
		requireCondition(seat.id === claim.receiverId, "Tietokone ei ole kortin vastaanottaja.");
		if (eligibleTargets(match).length > 0 && publicCoinFlip(`peek:${match.challenge.id}:${match.challenge.claims.length}:${seat.id}`)) { return { type: "peek" }; }
		return { type: "answer", believes: publicCoinFlip(`${match.challenge.id}:${match.challenge.claims.length}:${seat.id}:${claim.creature}`) };
	}
	const target = selectRotatingTarget(match, seat, eligibleTargets(match), match.challenge.claims.length);
	const truthful = publicCoinFlip(`pass:${match.challenge.id}:${match.challenge.claims.length}:${seat.id}`);
	return { type: "pass", targetId: target, creature: truthful ? match.challenge.card.creature : alternateCreature(match.challenge.card.creature, `${seat.id}:${target}`) };
}
function finish(match: Match, loser: Seat | null, reason: Match["endReason"], now: number): void {
	match.phase = "ended";
	match.loserSeatId = loser?.id ?? null;
	match.endReason = reason;
	match.endedAt = now;
}
function startNext(match: Match, seat: Seat, now: number): void {
	match.activeSeatId = seat.id;
	if (CREATURES.some(creature => seat.display.filter(c => c.creature === creature).length >= match.threshold)) {
		finish(match, seat, "matching", now);
	}
	else if (seat.hand.length === 0) { finish(match, seat, "empty", now); }
	else { match.phase = "initiation"; }
}
export function applyAction(original: Match, seatId: string, action: GameAction, now: number): Match {
	const match = structuredClone(original);
	requireCondition(match.phase !== "ended", "Peli on jo päättynyt.");
	const actor = getSeat(match, seatId);
	if (action.type === "predict") {
		const challenge = match.challenge;
		requireCondition(match.phase === "response" && challenge, "Arvaus ei ole nyt mahdollinen.");
		const claim = lastClaim(challenge);
		requireCondition(challenge.id === action.challengeId && action.claimIndex === challenge.claims.length - 1, "Väite on jo vaihtunut.");
		requireCondition(actor.id !== claim.receiverId && !challenge.seenPeople.includes(actor.personId) && !claim.locked, "Et voi arvata tätä väitettä.");
		claim.predictions = claim.predictions.filter(p => p.personId !== actor.personId);
		claim.predictions.push({ personId: actor.personId, believes: action.believes });
		return match;
	}
	if (action.type === "send") {
		requireCondition(match.phase === "initiation" && match.activeSeatId === seatId, "Ei ole sinun vuorosi.");
		requireCondition(CREATURES.includes(action.creature), "Tuntematon eläin.");
		const target = getSeat(match, action.targetId);
		requireCondition(target.id !== seatId, "Et voi lähettää korttia itsellesi.");
		const index = actor.hand.findIndex(c => c.id === action.cardId);
		requireCondition(index >= 0, "Kortti ei ole kädessäsi.");
		const card = actor.hand.splice(index, 1)[0]!;
		match.challenge = {
			id: `${match.id}:r${match.nextChallenge++}`, card, originalOwnerId: seatId, seenSeats: [seatId], seenPeople: [actor.personId],
			claims: [{ senderId: seatId, senderPersonId: actor.personId, receiverId: target.id, creature: action.creature, predictions: [], locked: false }]
		};
		match.phase = "response";
		return match;
	}
	const challenge = match.challenge;
	requireCondition(challenge, "Korttia ei ole pelissä.");
	const claim = lastClaim(challenge);
	requireCondition(claim.receiverId === seatId, "Et ole kortin vastaanottaja.");
	if (action.type === "peek") {
		requireCondition(match.phase === "response" && eligibleTargets(match).length > 0, "Korttia ei voi enää siirtää.");
		claim.locked = true;
		challenge.seenSeats.push(seatId);
		challenge.seenPeople.push(actor.personId);
		match.phase = "passing";
	}
	else if (action.type === "pass") {
		requireCondition(match.phase === "passing", "Sitoudut ensin katsomaan ja siirtämään kortin.");
		requireCondition(CREATURES.includes(action.creature) && eligibleTargets(match).includes(action.targetId), "Virheellinen siirto.");
		challenge.claims.push({ senderId: seatId, senderPersonId: actor.personId, receiverId: action.targetId, creature: action.creature, predictions: [], locked: false });
		match.phase = "response";
	}
	else {
		requireCondition(match.phase === "response", "Olet jo sitoutunut siirtämään kortin.");
		claim.locked = true;
		const correct = action.believes === (challenge.card.creature === claim.creature);
		const penalty = getSeat(match, correct ? claim.senderId : seatId);
		penalty.display.push(challenge.card);
		startNext(match, penalty, now);
		match.resolutions.push({ id: challenge.id, card: challenge.card, claims: challenge.claims, receiverPersonId: actor.personId,
			receiverBelieves: action.believes, penaltySeatId: penalty.id, penaltyPersonId: penalty.personId, cancelled: false, ended: match.endedAt !== null });
		match.challenge = null;
	}
	return match;
}
export function scores(match: Match): Score[] {
	return match.people.map(function (person) {
		let correct = 0; let submitted = 0; let answersCorrect = 0; let answersSubmitted = 0; let bluffCallsCorrect = 0; let bluffCallsWrong = 0; let bluffs = 0; let bluffsCaught = 0; let catches = 0;
		for (const resolution of match.resolutions) {
			if (resolution.cancelled) { continue; }
			for (const claim of resolution.claims) {
				const prediction = claim.predictions.find(p => p.personId === person.id);
				if (prediction) { submitted++; if (prediction.believes === (claim.creature === resolution.card.creature)) { correct++; } }
			}
			const final = resolution.claims[resolution.claims.length - 1]!;
			if (resolution.receiverPersonId === person.id) {
				answersSubmitted++;
				if (resolution.receiverBelieves === (final.creature === resolution.card.creature)) { answersCorrect++; }
				if (!resolution.receiverBelieves) {
					if (final.creature !== resolution.card.creature) { bluffCallsCorrect++; }
					else { bluffCallsWrong++; }
				}
			}
			if (final.creature !== resolution.card.creature) {
				if (resolution.receiverBelieves && final.senderPersonId === person.id) { bluffs++; }
				if (!resolution.receiverBelieves && final.senderPersonId === person.id) { bluffsCaught++; }
				if (!resolution.receiverBelieves && resolution.receiverPersonId === person.id) { catches++; }
			}
		}
		return { personId: person.id, name: person.name, correct, submitted, answersCorrect, answersSubmitted, bluffCallsCorrect, bluffCallsWrong, bluffs, bluffsCaught, catches };
	});
}
export function projectMatch(match: Match, personId: string | null): GameView {
	const seat = match.seats.find(s => !s.removed && s.personId === personId);
	const challenge = match.challenge;
	return {
		id: match.id, phase: match.phase, threshold: match.threshold, activeSeatId: match.activeSeatId,
		seats: match.seats.map(s => ({ id: s.id, personId: s.personId, name: s.name, handCount: s.hand.length, display: structuredClone(s.display), removed: s.removed })),
		hand: seat ? structuredClone(seat.hand) : [],
		challenge: challenge ? {
			id: challenge.id,
			claims: challenge.claims.map(c => ({ senderId: c.senderId, senderPersonId: c.senderPersonId, receiverId: c.receiverId, creature: c.creature })),
			card: seat && challenge.seenPeople.includes(seat.personId) ? structuredClone(challenge.card) : null,
			eligibleTargets: seat && lastClaim(challenge).receiverId === seat.id ? eligibleTargets(match) : [],
			canPredict: Boolean(seat && match.phase === "response" && seat.id !== lastClaim(challenge).receiverId && !challenge.seenPeople.includes(seat.personId)),
			prediction: lastClaim(challenge).predictions.find(p => p.personId === personId)?.believes ?? null
		} : null,
		lastResolution: match.resolutions.length ? structuredClone(match.resolutions[match.resolutions.length - 1]!) : null,
		loserSeatId: match.loserSeatId, endReason: match.endReason, retired: structuredClone(match.retired), scores: scores(match)
	};
}
export function replacePerson(original: Match, seatId: string, person: Person): Match {
	const match = structuredClone(original);
	const seat = getSeat(match, seatId);
	requireCondition(!match.seats.some(s => !s.removed && s.personId === person.id), "Pelaajalla on jo paikka.");
	if (match.challenge) {
		const knew = match.challenge.seenPeople.includes(person.id);
		requireCondition(!knew || match.challenge.seenSeats.includes(seatId), "Olet jo nähnyt tämän kortin. Odota kierroksen päättymistä.");
		if (match.challenge.seenSeats.includes(seatId) && !knew) { match.challenge.seenPeople.push(person.id); }
	}
	seat.personId = person.id;
	seat.name = person.name;
	if (!match.people.some(p => p.id === person.id)) { match.people.push(person); }
	return match;
}
export function endMatch(original: Match, now: number): Match {
	const match = structuredClone(original);
	if (match.challenge) { cancelChallenge(match); }
	finish(match, null, "abandoned", now);
	return match;
}
function cancelChallenge(match: Match): void {
	const challenge = match.challenge;
	if (!challenge) { return; }
	match.retired.push(challenge.card);
	match.resolutions.push({ id: challenge.id, card: challenge.card, claims: challenge.claims.map(c => ({ ...c, predictions: [], locked: true })), receiverPersonId: "", receiverBelieves: false, penaltySeatId: "", penaltyPersonId: "", cancelled: true, ended: false });
	match.challenge = null;
}
export function removeSeat(original: Match, seatId: string, random: Random, now: number): Match {
	const match = structuredClone(original);
	requireCondition(match.phase !== "ended", "Peli on päättynyt.");
	const removed = getSeat(match, seatId);
	const remaining = match.seats.filter(s => !s.removed && s.id !== seatId);
	requireCondition(remaining.length >= 3, "Tarvitaan korvaava pelaaja tai pelin päättäminen.");
	if (match.challenge) {
		const claim = lastClaim(match.challenge);
		requireCondition(claim.senderId === seatId || claim.receiverId === seatId, "Odota nykyisen kortin ratkaisua ennen poistamista.");
		cancelChallenge(match);
	}
	const hand = shuffle(removed.hand, random);
	const recipients = shuffle(remaining, random);
	hand.forEach(function (card, index) { recipients[index % recipients.length]!.hand.push(card); });
	removed.hand = [];
	removed.removed = true;
	let candidates = remaining.filter(s => s.hand.length > 0);
	if (!candidates.length) { finish(match, null, "abandoned", now); return match; }
	if (original.phase === "initiation" && original.activeSeatId !== seatId) { return match; }
	const risk = function (s: Seat): number { return Math.max(...CREATURES.map(c => s.display.filter(card => card.creature === c).length)); };
	const worst = [...candidates].sort((a, b) => risk(b) - risk(a) || a.hand.length - b.hand.length)[0]!;
	const safer = candidates.filter(s => risk(s) !== risk(worst) || s.hand.length !== worst.hand.length);
	if (safer.length) { candidates = safer; }
	match.activeSeatId = candidates[Math.floor(random() * candidates.length)]!.id;
	match.phase = "initiation";
	return match;
}
export function inventory(match: Match): Card[] {
	return [...match.seats.flatMap(s => [...s.hand, ...s.display]), ...match.unseen, ...match.retired, ...(match.challenge ? [match.challenge.card] : [])];
}
export function recap(match: Match): Recap {
	return { id: match.id, startedAt: match.startedAt, endedAt: match.endedAt, loserName: match.seats.find(s => s.id === match.loserSeatId)?.name ?? null,
		reason: match.endReason, scores: scores(match), awards: achievements(match), resolutions: structuredClone(match.resolutions) };
}
export function achievements(match: Match): Award[] {
	const result: Award[] = [];
	const stats = scores(match);
	const leaderboard = function (key: "bluffs" | "catches" | "correct"): void {
		const max = Math.max(0, ...stats.map(s => s[key]));
		if (max > 0) { result.push({ key, personIds: stats.filter(s => s[key] === max).map(s => s.personId) }); }
	};
	leaderboard("bluffs");
	leaderboard("catches");
	leaderboard("correct");
	const completed = match.resolutions.filter(r => !r.cancelled);
	const add = function (key: string, ids: string[]): void {
		if (!ids.length) { return; }
		const existing = result.find(a => a.key === key);
		if (existing) { existing.personIds = [...new Set([...existing.personIds, ...ids])]; }
		else { result.push({ key, personIds: [...new Set(ids)] }); }
	};
	const longest = Math.max(0, ...completed.map(r => r.claims.length));
	if (longest > 1) {
		const winners = completed.filter(r => r.claims.length === longest).map(r => r.receiverPersonId);
		add("chain", winners);
	}
	const pairStreak = new Map<string, number>();
	const paranoid = new Map<string, number>();
	const truth = new Map<string, number>();
	const displayCounts = new Map<string, Record<string, number>>();
	const dangerAt = new Map<string, { personId: string; index: number }>();
	completed.forEach(function (r, index) {
		const c = r.claims[r.claims.length - 1]!;
		const lie = c.creature !== r.card.creature;
		const pair = `${c.senderPersonId}:${r.receiverPersonId}`;
		pairStreak.set(pair, lie && r.receiverBelieves ? (pairStreak.get(pair) ?? 0) + 1 : 0);
		if ((pairStreak.get(pair) ?? 0) >= 2) { add("twice", [c.senderPersonId]); }
		if (lie && r.receiverBelieves && c.predictions.length >= 2 && c.predictions.every(p => p.believes)) {
			add("crowd", [c.senderPersonId]);
		}
		if (!lie && !r.receiverBelieves) {
			paranoid.set(r.receiverPersonId, (paranoid.get(r.receiverPersonId) ?? 0) + 1);
			truth.set(c.senderPersonId, (truth.get(c.senderPersonId) ?? 0) + 1);
		}
		if (r.ended && lie && match.endReason === "matching") {
			add(r.receiverBelieves ? "undertaker" : "own-grave", [c.senderPersonId]);
		}
		const counts = displayCounts.get(r.penaltySeatId) ?? {};
		counts[r.card.creature] = (counts[r.card.creature] ?? 0) + 1;
		displayCounts.set(r.penaltySeatId, counts);
		if (counts[r.card.creature] === match.threshold - 1 && !dangerAt.has(r.penaltySeatId)) { dangerAt.set(r.penaltySeatId, { personId: r.penaltyPersonId, index }); }
	});
	add("paranoid", [...paranoid].filter(([, n]) => n >= 3).map(([id]) => id));
	add("truth", [...truth].filter(([, n]) => n >= 3).map(([id]) => id));
	if (match.phase === "ended" && match.loserSeatId) {
		add("grave", [...dangerAt].filter(([seatId, entry]) => seatId !== match.loserSeatId && completed.length - 1 - entry.index >= 3 && match.seats.some(s => s.id === seatId && !s.removed && s.personId === entry.personId)).map(([, entry]) => entry.personId));
		if (match.endReason === "empty") { add("empty", [match.seats.find(s => s.id === match.loserSeatId)!.personId]); }
	}
	return result;
}
