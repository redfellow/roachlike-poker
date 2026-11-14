import { describe, expect, it } from "vitest";
import { normalizationGain, selectNextAudio, selectRandomAudio, soundVolume } from "./audio";

describe("selectNextAudio", function () {
	it("rotates through every card-flip variant without repeating until all are used", function () {
		const variants = [
			"/audio/elevenlabs-review-fast/card-flip-fast-01.mp3",
			"/audio/elevenlabs-review-fast/card-flip-fast-02.mp3",
			"/audio/elevenlabs-review-fast/card-flip-fast-03.mp3",
		];

		expect(selectNextAudio(variants, 0)).toBe(variants[0]);
		expect(selectNextAudio(variants, 1)).toBe(variants[1]);
		expect(selectNextAudio(variants, 2)).toBe(variants[2]);
		expect(selectNextAudio(variants, 3)).toBe(variants[0]);
	});

	it("keeps the challenge-resolution selection independent from card flips", function () {
		const cardVariants = [
			"/audio/elevenlabs-review-fast/card-flip-fast-01.mp3",
			"/audio/elevenlabs-review-fast/card-flip-fast-02.mp3",
			"/audio/elevenlabs-review-fast/card-flip-fast-03.mp3",
		];
		const challengeVariants = [
			"/audio/elevenlabs-review-fast/challenge-resolve-fast-01.mp3",
			"/audio/elevenlabs-review-fast/challenge-resolve-fast-02.mp3",
		];

		expect(selectNextAudio(cardVariants, 1)).toBe(cardVariants[1]);
		expect(selectNextAudio(challengeVariants, 1)).toBe(challengeVariants[1]);
	});
});

describe("selectRandomAudio", function () {
	it("maps the random value across the approved variants", function () {
		const variants = ["first.mp3", "second.mp3", "third.mp3"];
		expect(selectRandomAudio(variants, () => 0)).toBe("first.mp3");
		expect(selectRandomAudio(variants, () => 0.5)).toBe("second.mp3");
		expect(selectRandomAudio(variants, () => 0.999)).toBe("third.mp3");
	});
});

describe("normalizationGain", function () {
	it("raises quiet effects toward a shared peak with a safe gain ceiling", function () {
		expect(normalizationGain(0.92)).toBeCloseTo(1);
		expect(normalizationGain(0.46)).toBeCloseTo(2);
		expect(normalizationGain(0.01)).toBe(4);
		expect(normalizationGain(0.46, 0.5)).toBeCloseTo(1);
	});
});

describe("soundVolume", function () {
	it.each([
		{ name: "Volume during play: full level keeps the base volume", base: 0.5, level: 100, expected: 0.5 },
		{ name: "Volume during play: half level halves the base volume", base: 0.5, level: 50, expected: 0.25 },
		{ name: "Muted device: level 0 silences the sound", base: 0.7, level: 0, expected: 0 },
		{ name: "clamps a level above 100 to the base volume", base: 0.6, level: 150, expected: 0.6 },
		{ name: "clamps a negative level to silence", base: 0.6, level: -20, expected: 0 },
		{ name: "treats an invalid level as silence", base: 0.6, level: Number.NaN, expected: 0 },
	])("$name", function ({ base, level, expected }) {
		expect(soundVolume(base, level)).toBeCloseTo(expected);
	});
});
