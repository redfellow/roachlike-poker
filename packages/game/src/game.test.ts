import { describe, expect, it } from "vitest";
import { achievements, applyAction, chooseComputerAction, chooseComputerPrediction, createMatch, CREATURES, eligibleTargets, GameError, inventory, lastClaim, projectMatch, removeSeat, replacePerson, scores, type Match, type Resolution } from "./index";

function game(count = 4): Match {
	return createMatch("fixture", Array.from({ length: count }, function (_, i) { return { id: `p${i}`, name: `Pelaaja ${i}` }; }), () => 0.5, 1);
}
function send(match: Match, target?: string): Match {
	const actor = match.seats.find(s => s.id === match.activeSeatId)!;
	return applyAction(match, actor.id, { type: "send", cardId: actor.hand[0]!.id, targetId: target ?? match.seats.find(s => s.id !== actor.id)!.id, creature: "torakka" }, 2);
}
describe("deck and setup", function () {
	it.each([[2, [27, 27]], [3, [21, 21, 22]], [4, [16, 16, 16, 16]], [5, [12, 13, 13, 13, 13]], [6, [10, 10, 11, 11, 11, 11]]])("deals every card for %i players", function (count, expected) {
		const match = game(count);
		expect(match.seats.map(s => s.hand.length).sort((a, b) => a - b)).toEqual(expected);
		expect(inventory(match)).toHaveLength(64);
		expect(new Set(inventory(match).map(c => c.id)).size).toBe(64);
		expect(match.unseen.length).toBe(count === 2 ? 10 : 0);
	});
});
describe("resolution", function () {
	it.each([true, false])("truth table for a %s claim", function (truthful) {
		for (const believes of [true, false]) {
			const base = game();
			const actor = base.seats.find(s => s.id === base.activeSeatId)!;
			const card = actor.hand[0]!;
			const receiver = base.seats.find(s => s.id !== actor.id)!;
			const claim = truthful ? card.creature : card.creature === "torakka" ? "lude" : "torakka";
			const sent = applyAction(base, actor.id, { type: "send", cardId: card.id, targetId: receiver.id, creature: claim }, 2);
			const result = applyAction(sent, receiver.id, { type: "answer", believes }, 3);
			const penalty = believes === truthful ? actor.id : receiver.id;
			expect(result.seats.find(s => s.id === penalty)!.display).toEqual([card]);
			expect(result.activeSeatId).toBe(penalty);
			expect(inventory(result)).toHaveLength(64);
			expect(base.seats.every(s => s.display.length === 0)).toBe(true);
		}
	});
	it("penalizes the latest sender and makes the last receiver answer", function () {
		let match = send(game(3));
		const b = lastClaim(match.challenge!).receiverId;
		match = applyAction(match, b, { type: "peek" }, 3);
		expect(() => applyAction(match, b, { type: "answer", believes: true }, 4)).toThrow(GameError);
		const c = eligibleTargets(match)[0]!;
		match = applyAction(match, b, { type: "pass", targetId: c, creature: match.challenge!.card.creature }, 5);
		expect(eligibleTargets(match)).toEqual([]);
		expect(() => applyAction(match, c, { type: "peek" }, 6)).toThrow(GameError);
		match = applyAction(match, c, { type: "answer", believes: true }, 6);
		expect(match.activeSeatId).toBe(b);
	});
	it("does not defeat someone merely for sending their last card", function () {
		const base = game();
		const actor = base.seats.find(s => s.id === base.activeSeatId)!;
		base.retired.push(...actor.hand.splice(1));
		const match = send(base);
		expect(match.phase).toBe("response");
		const claim = lastClaim(match.challenge!);
		const correct = claim.creature === match.challenge!.card.creature;
		const lost = applyAction(match, claim.receiverId, { type: "answer", believes: correct }, 3);
		expect(lost.endReason).toBe("empty");
		expect(lost.loserSeatId).toBe(actor.id);
		const safe = applyAction(match, claim.receiverId, { type: "answer", believes: !correct }, 3);
		expect(safe.phase).toBe("initiation");
	});
	it("uses five matching cards for a two-player match", function () {
		const base = game(2);
		const actor = base.seats.find(s => s.id === base.activeSeatId)!;
		const other = base.seats.find(s => s.id !== actor.id)!;
		const creature = actor.hand[0]!.creature;
		for (const seat of base.seats) {
			for (const card of [...seat.hand]) {
				if (card.creature === creature && card.id !== actor.hand[0]!.id && other.display.length < 3) {
					seat.hand.splice(seat.hand.indexOf(card), 1); other.display.push(card);
				}
			}
		}
		expect(other.display).toHaveLength(3);
		const sent = applyAction(base, actor.id, { type: "send", cardId: actor.hand[0]!.id, targetId: other.id, creature }, 2);
		const result = applyAction(sent, other.id, { type: "answer", believes: false }, 3);
		expect(result.phase).toBe("initiation");
	});
});
describe("privacy and predictions", function () {
	it("projects no hidden hands, card identity, or other predictions", function () {
		let match = send(game());
		const c = match.seats.find(s => s.id !== match.activeSeatId && s.id !== lastClaim(match.challenge!).receiverId)!;
		match = applyAction(match, c.id, { type: "predict", challengeId: match.challenge!.id, claimIndex: 0, believes: true }, 3);
		const spectator = projectMatch(match, null);
		expect(spectator.hand).toEqual([]);
		expect(spectator.challenge!.card).toBeNull();
		expect(spectator.challenge!.prediction).toBeNull();
		expect(JSON.stringify(spectator)).not.toContain(match.challenge!.card.id);
		for (const seat of match.seats) {
			for (const card of seat.hand) { expect(JSON.stringify(spectator)).not.toContain(card.id); }
		}
		const receiver = match.seats.find(s => s.id === lastClaim(match.challenge!).receiverId)!;
		expect(projectMatch(match, receiver.personId).challenge!.card).toBeNull();
		expect(projectMatch(match, c.personId).challenge!.prediction).toBe(true);
		const resolved = applyAction(match, receiver.id, { type: "answer", believes: true }, 4);
		expect(scores(resolved).find(s => s.personId === c.personId)!.submitted).toBe(1);
		const receiverScore = scores(resolved).find(score => score.personId === receiver.personId)!;
		expect(receiverScore.answersSubmitted).toBe(1);
		expect(receiverScore.answersCorrect).toBe(Number(match.challenge!.claims.at(-1)!.creature === match.challenge!.card.creature));
	});
	it("chooses a deterministic legal action from the authorized view", function () {
		let match = game(4);
		const actor = match.seats.find(s => s.id === match.activeSeatId)!;
		const target = match.seats.find(s => s.id !== actor.id)!;
		const creature = actor.hand[0]!.creature;
		match = applyAction(match, actor.id, { type: "send", cardId: actor.hand[0]!.id, targetId: target.id, creature }, 2);
		const receiver = match.seats.find(s => s.id === lastClaim(match.challenge!).receiverId)!;
		const answer = chooseComputerAction(match, receiver.personId);
		expect(["answer", "peek"]).toContain(answer.type);
		const altered = structuredClone(match);
		altered.challenge!.card.creature = altered.challenge!.card.creature === "torakka" ? "lude" : "torakka";
		expect(chooseComputerAction(altered, receiver.personId)).toEqual(answer);
		match = applyAction(match, receiver.id, { type: "peek" }, 3);
		const pass = chooseComputerAction(match, receiver.personId);
		expect(pass.type).toBe("pass");
		if (pass.type === "pass") {
			expect(eligibleTargets(match)).toContain(pass.targetId);
			expect(CREATURES).toContain(pass.creature);
		}
	});
	it("rotates opening targets instead of repeatedly preferring the first seat", function () {
		const match = game(3);
		const actor = match.seats.find(seat => seat.id === match.activeSeatId)!;
		const first = chooseComputerAction(match, actor.personId);
		const next = structuredClone(match);
		next.nextChallenge += 1;
		const second = chooseComputerAction(next, actor.personId);
		expect(first.type).toBe("send");
		expect(second.type).toBe("send");
		if (first.type === "send" && second.type === "send") {
			expect(first.targetId).not.toBe(actor.id);
			expect(second.targetId).not.toBe(actor.id);
			expect(second.targetId).not.toBe(first.targetId);
		}
	});
	it("makes private deterministic predictions without inspecting the card", function () {
		const match = send(game(4));
		const observer = match.seats.find(seat => seat.id !== match.activeSeatId && seat.id !== lastClaim(match.challenge!).receiverId)!;
		const prediction = chooseComputerPrediction(match, observer.personId);
		expect(prediction?.type).toBe("predict");
		const altered = structuredClone(match);
		altered.challenge!.card.creature = altered.challenge!.card.creature === "torakka" ? "lude" : "torakka";
		expect(chooseComputerPrediction(altered, observer.personId)).toEqual(prediction);
		expect(chooseComputerPrediction(match, match.seats.find(seat => seat.id === lastClaim(match.challenge!).receiverId)!.personId)).toBeNull();
	});
});
describe("departure", function () {
	it.each(["sender", "receiver"] as const)("retires an interrupted card when removing its %s", function (role) {
		const match = send(game(4));
		const seatId = role === "sender" ? lastClaim(match.challenge!).senderId : lastClaim(match.challenge!).receiverId;
		const result = removeSeat(match, seatId, () => 0.5, 4);
		expect(result.retired).toEqual([match.challenge!.card]);
		expect(inventory(result)).toHaveLength(64);
		expect(new Set(inventory(result).map(c => c.id)).size).toBe(64);
		expect(result.resolutions[0]!.cancelled).toBe(true);
		expect(result.seats.find(s => s.id === seatId)!.removed).toBe(true);
	});
	it("preserves an unaffected starter and selects a legal replacement for a removed starter", function () {
		const unaffected = game(4);
		const other = unaffected.seats.find(seat => seat.id !== unaffected.activeSeatId)!;
		const unchanged = removeSeat(unaffected, other.id, () => 0.5, 3);
		expect(unchanged.activeSeatId).toBe(unaffected.activeSeatId);
		const active = game(4);
		const recovered = removeSeat(active, active.activeSeatId, () => 0.5, 3);
		expect(recovered.phase).toBe("initiation");
		expect(recovered.activeSeatId).not.toBe(active.activeSeatId);
		expect(recovered.seats.find(seat => seat.id === recovered.activeSeatId)!.hand.length).toBeGreaterThan(0);
		expect(inventory(recovered)).toHaveLength(64);
	});
	it("refuses redistribution that would leave only two players", function () {
		expect(() => removeSeat(game(3), "s0", () => 0.5, 3)).toThrow("korvaava");
	});
	it("preserves a committed peek across replacement", function () {
		let match = send(game());
		const receiver = lastClaim(match.challenge!).receiverId;
		match = applyAction(match, receiver, { type: "peek" }, 3);
		match = replacePerson(match, receiver, { id: "new", name: "Uusi" });
		expect(projectMatch(match, "new").challenge!.card).toEqual(match.challenge!.card);
		expect(() => applyAction(match, receiver, { type: "answer", believes: false }, 4)).toThrow();
	});
});

describe("recap evidence", function () {
	function resolved(match: Match, options: { sender?: number; receiver?: number; actual?: "torakka" | "lude"; claim?: "torakka" | "lude"; believes?: boolean; predictions?: { personId: string; believes: boolean }[]; penalty?: number; ended?: boolean; chain?: boolean }): Resolution {
		const sender = options.sender ?? 0; const receiver = options.receiver ?? 1;
		const actual = options.actual ?? "torakka"; const claim = options.claim ?? "lude";
		const claims = [{ senderId: `s${sender}`, senderPersonId: `p${sender}`, receiverId: `s${receiver}`, creature: claim, predictions: options.predictions ?? [], locked: true }];
		if (options.chain) {
			claims.unshift(
				{ senderId: "s3", senderPersonId: "p3", receiverId: "s2", creature: "torakka", predictions: [], locked: true },
				{ senderId: "s2", senderPersonId: "p2", receiverId: `s${sender}`, creature: "torakka", predictions: [], locked: true }
			);
		}
		return { id: `${match.id}:synthetic-${match.resolutions.length}`, card: { id: `card-${match.resolutions.length}`, creature: actual }, claims, receiverPersonId: `p${receiver}`, receiverBelieves: options.believes ?? true, penaltySeatId: `s${options.penalty ?? receiver}`, penaltyPersonId: `p${options.penalty ?? receiver}`, cancelled: false, ended: options.ended ?? false };
	}
	it("derives every accepted achievement from public resolution evidence", function () {
		const match = game(5);
		match.resolutions.push(
			resolved(match, { believes: true, predictions: [{ personId: "p2", believes: true }, { personId: "p3", believes: true }, { personId: "p4", believes: true }], chain: true }),
			resolved(match, { believes: true }),
			resolved(match, { sender: 2, receiver: 3, actual: "torakka", claim: "torakka", believes: false, penalty: 3, predictions: [{ personId: "p0", believes: true }] }),
			resolved(match, { sender: 2, receiver: 3, actual: "torakka", claim: "torakka", believes: false, penalty: 3 }),
			resolved(match, { sender: 2, receiver: 3, actual: "torakka", claim: "torakka", believes: false, penalty: 3 }),
			resolved(match, { sender: 2, receiver: 3, actual: "torakka", claim: "torakka", believes: false, penalty: 3 }),
			resolved(match, { sender: 1, receiver: 0, believes: false, penalty: 1 }),
			resolved(match, { sender: 2, receiver: 0, actual: "lude", claim: "lude", believes: true, penalty: 2 }),
			resolved(match, { sender: 2, receiver: 0, actual: "lude", claim: "lude", believes: true, penalty: 2 }),
			resolved(match, { sender: 2, receiver: 0, actual: "lude", claim: "lude", believes: true, penalty: 2 }),
			resolved(match, { believes: true, ended: true })
		);
		match.phase = "ended"; match.endReason = "matching"; match.loserSeatId = "s1";
		const keys = new Set(achievements(match).map(award => award.key));
		for (const key of ["chain", "twice", "crowd", "paranoid", "truth", "grave", "undertaker"]) { expect(keys.has(key), key).toBe(true); }
	});
	it("awards the longest chain to the losing receiver rather than every participant", function () {
		const match = game(4);
		match.resolutions.push(
			{ ...resolved(match, { sender: 0, receiver: 1, believes: true, chain: true }), id: "chain-1" },
			{ ...resolved(match, { sender: 1, receiver: 2, believes: true }), id: "chain-2" }
		);
		const chain = achievements(match).find(award => award.key === "chain");
		expect(chain).toEqual({ key: "chain", personIds: ["p1"] });
	});
	it("does not award the longest chain when multiple chains share the record", function () {
		const match = game(4);
		match.resolutions.push(
			{ ...resolved(match, { sender: 0, receiver: 1, believes: true, chain: true }), id: "chain-1" },
			{ ...resolved(match, { sender: 1, receiver: 2, believes: true, chain: true }), id: "chain-2" }
		);
		expect(achievements(match).some(award => award.key === "chain")).toBe(false);
	});
	it("awards a unique longest chain to the player who actually took the card", function () {
		const match = game(4);
		match.resolutions.push(
			{ ...resolved(match, { sender: 0, receiver: 1, believes: false, penalty: 0, chain: true }), id: "chain-1" },
			{ ...resolved(match, { sender: 1, receiver: 2, believes: true }), id: "chain-2" }
		);
		expect(achievements(match).find(award => award.key === "chain")).toEqual({ key: "chain", personIds: ["p0"] });
	});
	it("derives the new bluff, prediction, and defeat achievements from resolutions", function () {
		const match = game(4);
		for (let index = 0; index < 10; index++) {
			match.resolutions.push({
				...resolved(match, { sender: 0, receiver: 1, believes: true, predictions: [{ personId: "p2", believes: false }, { personId: "p3", believes: true }] }),
				id: `new-award-${index}`
			});
		}
		match.phase = "ended"; match.endReason = "matching"; match.loserSeatId = "s1";
		const byKey = new Map(achievements(match).map(award => [award.key, award.personIds]));
		expect(byKey.get("poker-grave")).toContain("p0");
		expect(byKey.get("serial-liar")).toContain("p0");
		expect(byKey.get("trusting-dead")).toEqual(["p1"]);
		expect(byKey.get("sofa-psychologist")).toContain("p2");
		expect(byKey.get("wrong-professional")).toContain("p3");
		expect(byKey.get("silent-partner")).toContain("p2");
	});
	it("distinguishes an exposed liar and empty-hand loser and ignores cancellation", function () {
		const caught = game(4);
		caught.resolutions.push(resolved(caught, { believes: false, penalty: 0, ended: true }));
		caught.resolutions.push({ ...resolved(caught, { believes: true, predictions: [{ personId: "p2", believes: true }] }), id: "cancelled", cancelled: true });
		caught.phase = "ended"; caught.endReason = "matching"; caught.loserSeatId = "s0";
		const caughtKeys = new Set(achievements(caught).map(award => award.key));
		expect(caughtKeys.has("own-grave")).toBe(true);
		expect(scores(caught).find(score => score.personId === "p2")!.submitted).toBe(0);
		const empty = game(2);
		empty.phase = "ended"; empty.endReason = "empty"; empty.loserSeatId = "s0";
		expect(achievements(empty).some(award => award.key === "empty" && award.personIds.includes("p0"))).toBe(true);
	});
});

describe("complete-game invariants", function () {
	it("plays complete fair computer games at every MVP table size", function () {
		let sawPass = false;
		let sawPrediction = false;
		for (const count of [2, 3, 6]) {
			for (let seed = 1; seed <= 12; seed++) {
				let state = seed;
				function random(): number { state = (state * 1664525 + 1013904223) >>> 0; return state / 4294967296; }
				let match = createMatch(`bots-${count}-${seed}`, Array.from({ length: count }, (_, i) => ({ id: `bot-${i}`, name: `Botti ${i}` })), random, 1);
				for (let step = 0; step < 800 && match.phase !== "ended"; step++) {
					if (match.phase === "response") {
						for (const person of match.people) {
							const prediction = chooseComputerPrediction(match, person.id);
							if (prediction) {
								const seat = match.seats.find(candidate => candidate.personId === person.id)!;
								match = applyAction(match, seat.id, prediction, step + 2);
								sawPrediction = true;
							}
						}
					}
					const required = match.phase === "initiation" ? match.activeSeatId : lastClaim(match.challenge!).receiverId;
					const actor = match.seats.find(candidate => candidate.id === required)!;
					const action = chooseComputerAction(match, actor.personId);
					if (action.type === "peek" || action.type === "pass") { sawPass = true; }
					match = applyAction(match, actor.id, action, step + 2);
					expect(inventory(match)).toHaveLength(64);
				}
				expect(match.phase).toBe("ended");
				expect(match.loserSeatId).not.toBeNull();
			}
		}
		expect(sawPass).toBe(true);
		expect(sawPrediction).toBe(true);
	});
	it.each([2, 3, 6])("plays %i-player games to a valid defeat without losing cards", function (count) {
		for (let seed = 1; seed <= 20; seed++) {
			let state = seed;
			function random(): number { state = (state * 1664525 + 1013904223) >>> 0; return state / 4294967296; }
			let match = createMatch(`game-${seed}`, Array.from({ length: count }, (_, i) => ({ id: `p${i}`, name: `P${i}` })), random, 1);
			for (let step = 0; step < 500 && match.phase !== "ended"; step++) {
				if (match.phase === "initiation") {
					const actor = match.seats.find(s => s.id === match.activeSeatId)!;
					const targets = match.seats.filter(s => s.id !== actor.id);
					match = applyAction(match, actor.id, { type: "send", cardId: actor.hand[0]!.id, targetId: targets[Math.floor(random() * targets.length)]!.id, creature: "torakka" }, step + 2);
				}
				else if (match.phase === "response") {
					const receiver = lastClaim(match.challenge!).receiverId;
					match = applyAction(match, receiver, eligibleTargets(match).length && random() < 0.6 ? { type: "peek" } : { type: "answer", believes: random() > 0.5 }, step + 2);
				}
				else {
					const targets = eligibleTargets(match);
					match = applyAction(match, lastClaim(match.challenge!).receiverId, { type: "pass", targetId: targets[0]!, creature: "lude" }, step + 2);
				}
				expect(inventory(match)).toHaveLength(64);
				expect(new Set(inventory(match).map(c => c.id)).size).toBe(64);
				for (const seat of match.seats) {
					const view = projectMatch(match, seat.personId);
					expect(view.hand.length).toBe(seat.hand.length);
					for (const other of match.seats.filter(s => s.id !== seat.id)) {
						for (const card of other.hand) { expect(JSON.stringify(view)).not.toContain(`"${card.id}"`); }
					}
				}
			}
			expect(match.phase).toBe("ended");
			expect(match.loserSeatId).not.toBeNull();
		}
	}, 30000);
});
