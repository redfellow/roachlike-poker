import { describe, expect, it } from "vitest";
import { achievements, createMatch, type Claim, type Creature, type Match, type Prediction, type Resolution } from "./index";

function game(count = 5): Match {
	return createMatch("awards", Array.from({ length: count }, function (_, index) {
		return { id: `p${index}`, name: `Pelaaja ${index}` };
	}), () => 0.5, 1);
}

interface ResolutionOptions {
	sender?: number;
	receiver?: number;
	actual?: Creature;
	claim?: Creature;
	believes?: boolean;
	predictions?: Prediction[];
	penalty?: number;
	ended?: boolean;
	claims?: Claim[];
}

function resolution(match: Match, options: ResolutionOptions = {}): Resolution {
	const sender = options.sender ?? 0;
	const receiver = options.receiver ?? 1;
	const actual = options.actual ?? "torakka";
	const claim = options.claim ?? "lude";
	const claims = options.claims ?? [{ senderId: `s${sender}`, senderPersonId: `p${sender}`, receiverId: `s${receiver}`, creature: claim, predictions: options.predictions ?? [], locked: true }];
	return {
		id: `${match.id}:boundary-${match.resolutions.length}`,
		card: { id: `card-${match.resolutions.length}`, creature: actual },
		claims,
		receiverPersonId: `p${receiver}`,
		receiverBelieves: options.believes ?? true,
		penaltySeatId: `s${options.penalty ?? receiver}`,
		penaltyPersonId: `p${options.penalty ?? receiver}`,
		cancelled: false,
		ended: options.ended ?? false
	};
}

function has(match: Match, key: string, personId?: string): boolean {
	const award = achievements(match).find(item => item.key === key);
	return Boolean(award && (!personId || award.personIds.includes(personId)));
}

function finish(match: Match, loser = 1, reason: "matching" | "empty" = "matching"): void {
	match.phase = "ended";
	match.endReason = reason;
	match.loserSeatId = `s${loser}`;
}

describe("achievement boundaries", function () {
	it.each([
		["bluffs", 3, { actual: "torakka", claim: "lude", believes: true }],
		["catches", 3, { actual: "torakka", claim: "lude", believes: false }]
	] as const)("requires the exact %s leaderboard minimum", function (key, minimum, options) {
		const match = game(4);
		for (let index = 0; index < minimum - 1; index++) { match.resolutions.push(resolution(match, options)); }
		expect(has(match, key)).toBe(false);
		match.resolutions.push(resolution(match, options));
		expect(has(match, key, key === "catches" ? "p1" : "p0")).toBe(true);
		match.resolutions.push(...Array.from({ length: minimum }, function () { return resolution(match, { ...options, sender: 2, receiver: 3 }); }));
		expect(has(match, key)).toBe(false);
	});

	it("requires five correct predictions and a unique leader", function () {
		const match = game(4);
		for (let index = 0; index < 4; index++) { match.resolutions.push(resolution(match, { predictions: [{ personId: "p2", believes: false }] })); }
		expect(has(match, "correct")).toBe(false);
		match.resolutions.push(resolution(match, { predictions: [{ personId: "p2", believes: false }] }));
		expect(has(match, "correct", "p2")).toBe(true);
	});

	it("enforces consecutive and aggregate bluff thresholds", function () {
		const match = game(4);
		for (let index = 0; index < 5; index++) { match.resolutions.push(resolution(match)); }
		expect(has(match, "poker-grave", "p0")).toBe(true);
		expect(has(match, "serial-liar", "p0")).toBe(false);
		match.resolutions.push(resolution(match));
		expect(has(match, "serial-liar", "p0")).toBe(true);
		const interrupted = game(4);
		for (let index = 0; index < 5; index++) { interrupted.resolutions.push(resolution(interrupted)); }
		interrupted.resolutions.push(resolution(interrupted, { actual: "torakka", claim: "torakka" }), resolution(interrupted));
		expect(has(interrupted, "serial-liar", "p0")).toBe(false);
	});

	it("enforces repeated-target, truth, suspicion, and answer thresholds", function () {
		const match = game(4);
		for (let index = 0; index < 3; index++) { match.resolutions.push(resolution(match)); }
		expect(has(match, "twice", "p0")).toBe(true);
		const truth = game(4);
		for (let index = 0; index < 4; index++) { truth.resolutions.push(resolution(truth, { actual: "torakka", claim: "torakka", believes: false })); }
		expect(has(truth, "paranoid", "p1")).toBe(true);
		expect(has(truth, "truth", "p0")).toBe(true);
		const answers = game(4);
		for (let index = 0; index < 7; index++) { answers.resolutions.push(resolution(answers)); }
		expect(has(answers, "optimist", "p1")).toBe(true);
		const distrust = game(4);
		for (let index = 0; index < 7; index++) { distrust.resolutions.push(resolution(distrust, { actual: "torakka", claim: "torakka", believes: false })); }
		expect(has(distrust, "trust-issues", "p1")).toBe(true);
	});

	it("enforces claim, pass, chain-participation, and prediction streak thresholds", function () {
		const honest = game(4);
		for (let index = 0; index < 7; index++) { honest.resolutions.push(resolution(honest, { actual: "torakka", claim: "torakka" })); }
		expect(has(honest, "honest-bastard", "p0")).toBe(true);
		const predictions = game(4);
		for (let index = 0; index < 8; index++) {
			predictions.resolutions.push(resolution(predictions, { predictions: [{ personId: "p2", believes: false }, { personId: "p3", believes: true }] }));
		}
		expect(has(predictions, "sofa-psychologist", "p2")).toBe(true);
		expect(has(predictions, "wrong-professional", "p3")).toBe(true);
		const passes = game(4);
		for (let index = 0; index < 5; index++) {
			passes.resolutions.push(resolution(passes, { claims: [
				{ senderId: "s2", senderPersonId: "p2", receiverId: "s0", creature: "torakka", predictions: [], locked: true },
				{ senderId: "s0", senderPersonId: "p0", receiverId: "s1", creature: "lude", predictions: [], locked: true }
			] }));
		}
		expect(has(passes, "recycle-problem", "p0")).toBe(true);
		expect(has(passes, "dirty-baton", "p0")).toBe(true);
	});

	it("checks table-size and audience boundaries", function () {
		const crowd = game(5);
		const allFooled = [{ personId: "p2", believes: true }, { personId: "p3", believes: true }, { personId: "p4", believes: true }];
		crowd.resolutions.push(resolution(crowd, { predictions: allFooled }));
		expect(has(crowd, "crowd", "p0")).toBe(true);
		const cheap = game(5);
		cheap.resolutions.push(resolution(cheap, { predictions: allFooled.map(item => ({ ...item, believes: false })) }));
		expect(has(cheap, "cheap-bluff", "p0")).toBe(true);
		const split = game(5);
		split.resolutions.push(resolution(split, { predictions: [{ personId: "p2", believes: false }, { personId: "p3", believes: true }, { personId: "p4", believes: true }] }));
		expect(has(split, "lone-genius", "p2")).toBe(true);
		const herd = game(5);
		herd.resolutions.push(resolution(herd, { predictions: allFooled }));
		expect(has(herd, "herd-grave", "p2")).toBe(true);
		const tooSmall = game(4);
		tooSmall.resolutions.push(resolution(tooSmall, { predictions: allFooled }));
		expect(has(tooSmall, "crowd")).toBe(false);
		expect(has(tooSmall, "lone-genius")).toBe(false);
		expect(has(tooSmall, "herd-grave")).toBe(false);
	});

	it("checks full-table, return-to-sender, longest-chain, and equal-target conditions", function () {
		const match = game(5);
		const claims: Claim[] = [
			{ senderId: "s0", senderPersonId: "p0", receiverId: "s1", creature: "torakka", predictions: [], locked: true },
			{ senderId: "s1", senderPersonId: "p1", receiverId: "s2", creature: "torakka", predictions: [], locked: true },
			{ senderId: "s2", senderPersonId: "p2", receiverId: "s3", creature: "torakka", predictions: [], locked: true },
			{ senderId: "s3", senderPersonId: "p3", receiverId: "s4", creature: "torakka", predictions: [], locked: true },
			{ senderId: "s4", senderPersonId: "p4", receiverId: "s0", creature: "lude", predictions: [], locked: true }
		];
		match.resolutions.push(resolution(match, { receiver: 0, claims }));
		expect(has(match, "full-circle", "p0")).toBe(true);
		expect(has(match, "return-sender", "p0")).toBe(true);
		expect(has(match, "chain", "p0")).toBe(true);
		const equal = game(4);
		for (const receiver of [1, 2, 3]) { equal.resolutions.push(resolution(equal, { receiver })); }
		expect(has(equal, "equal-bastard", "p0")).toBe(true);
	});

	it("checks danger, terminal, duration, and passive-player boundaries", function () {
		const danger = game(4);
		for (let index = 0; index < 3; index++) { danger.resolutions.push(resolution(danger, { sender: 1, receiver: 0, penalty: 0 })); }
		danger.resolutions.push(resolution(danger));
		expect(has(danger, "last-bluff", "p0")).toBe(true);
		danger.resolutions.push(resolution(danger, { actual: "torakka", claim: "torakka", believes: false }));
		expect(has(danger, "wrong-corpse", "p1")).toBe(true);
		for (let index = 0; index < 4; index++) { danger.resolutions.push(resolution(danger, { sender: 2, receiver: 3 })); }
		finish(danger, 1);
		expect(has(danger, "grave", "p0")).toBe(true);
		const terminal = game(4);
		for (let index = 0; index < 25; index++) { terminal.resolutions.push(resolution(terminal)); }
		finish(terminal, 1);
		expect(has(terminal, "slow-death", "p1")).toBe(true);
		expect(has(terminal, "trusting-dead", "p1")).toBe(true);
		expect(has(terminal, "silent-partner", "p2")).toBe(true);
		const clean = game(4);
		for (let index = 0; index < 4; index++) { clean.resolutions.push(resolution(clean, { sender: 1, receiver: 0, actual: "torakka", claim: "torakka" })); }
		finish(clean, 1);
		expect(has(clean, "clean-corpse", "p1")).toBe(true);
		const empty = game(2); finish(empty, 0, "empty");
		expect(has(empty, "empty", "p0")).toBe(true);
	});

	it("checks defeat-causing bluff outcomes and target concentration", function () {
		const believed = game(4);
		believed.resolutions.push(resolution(believed, { ended: true })); finish(believed, 1);
		expect(has(believed, "undertaker", "p0")).toBe(true);
		const caught = game(4);
		caught.resolutions.push(resolution(caught, { believes: false, penalty: 0, ended: true })); finish(caught, 0);
		expect(has(caught, "own-grave", "p0")).toBe(true);
		const targeted = game(4);
		for (let index = 0; index < 5; index++) { targeted.resolutions.push(resolution(targeted, { sender: 0, receiver: 2 })); }
		finish(targeted, 1);
		expect(has(targeted, "bullet-dodger", "p2")).toBe(true);
	});

	it("requires five catches for Valheenpaljastaja", function () {
		const match = game(4);
		for (let index = 0; index < 4; index++) { match.resolutions.push(resolution(match, { believes: false })); }
		expect(has(match, "lie-detector", "p1")).toBe(false);
		match.resolutions.push(resolution(match, { believes: false }));
		expect(has(match, "lie-detector", "p1")).toBe(true);
	});
});
