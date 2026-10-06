export function selectNextAudio(variants: readonly string[], index: number): string {
	if (variants.length === 0) { throw new Error("At least one audio variant is required."); }
	const safeIndex = ((index % variants.length) + variants.length) % variants.length;
	const selected = variants[safeIndex];
	if (!selected) { throw new Error("Audio variant selection returned no result."); }
	return selected;
}

const buffers = new Map<string, Promise<AudioBuffer>>();
const peaks = new Map<string, number>();
let context: AudioContext | null = null;

export function normalizationGain(peak: number, volume = 1): number {
	if (!Number.isFinite(peak) || peak <= 0) { return volume; }
	return Math.min(4, 0.92 / peak) * volume;
}

function getContext(): AudioContext {
	context ??= new AudioContext();
	return context;
}

function loadBuffer(source: string, audioContext: AudioContext): Promise<AudioBuffer> {
	const existing = buffers.get(source);
	if (existing) { return existing; }
	const pending = fetch(source).then(async function (response): Promise<AudioBuffer> {
		if (!response.ok) { throw new Error(`Audio file could not be loaded: ${source}`); }
		return audioContext.decodeAudioData(await response.arrayBuffer());
	});
	buffers.set(source, pending);
	return pending;
}

function peakLevel(source: string, buffer: AudioBuffer): number {
	const existing = peaks.get(source);
	if (existing !== undefined) { return existing; }
	let peak = 0;
	for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
		for (const sample of buffer.getChannelData(channel)) { peak = Math.max(peak, Math.abs(sample)); }
	}
	peaks.set(source, peak);
	return peak;
}

export async function playNormalizedAudio(source: string, volume = 1): Promise<void> {
	const audioContext = getContext();
	if (audioContext.state === "suspended") { await audioContext.resume(); }
	const buffer = await loadBuffer(source, audioContext);
	const player = audioContext.createBufferSource();
	const gain = audioContext.createGain();
	player.buffer = buffer;
	gain.gain.value = normalizationGain(peakLevel(source, buffer), volume);
	player.connect(gain).connect(audioContext.destination);
	player.start();
}
