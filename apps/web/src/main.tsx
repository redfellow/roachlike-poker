import { StrictMode, useEffect, useRef, useState, type ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { io, type Socket } from "socket.io-client";
import { CREATURES, type Creature, type GameView, type Recap, type Resolution, type Score, type ThemeRef } from "@torakka/game";
import type { OpenRoomView, Reply, RoomAction, RoomView } from "@torakka/protocol";
import { CreatureArt } from "./CreatureArt";
import { playNormalizedAudio, selectNextAudio, selectRandomAudio } from "./audio";
import { FI } from "./strings.fi";
import { AVAILABLE_THEMES, themeFor, type ThemeDefinition } from "./themes";
import "./style.css";

document.title = FI.documentTitle;

const CARD_SEND_VARIANTS = ["/audio/card-send-01.mp3", "/audio/card-send-02.mp3"] as const;
const CARD_PASS_VARIANTS = ["/audio/card-pass-01.mp3"] as const;
const BELIEVE_VARIANTS = ["/audio/believe-01.mp3"] as const;
const DISBELIEVE_VARIANTS = ["/audio/disbelieve-01.mp3"] as const;
const CHALLENGE_REVEAL_VARIANTS = ["/audio/challenge-resolve-fast-01.mp3", "/audio/challenge-resolve-fast-02.mp3"] as const;
const PENALTY_TRANSFER_VARIANTS = ["/audio/penalty-transfer-01.mp3", "/audio/penalty-transfer-02.mp3"] as const;
const WIN_VARIANTS = [
	"/audio/game-win-01.mp3",
	"/audio/game-win-02.mp3",
] as const;
const LOSS_VARIANTS = [
	"/audio/game-loss-light-01.mp3",
] as const;
const UI_CLICK_VARIANT = "/audio/ui-click-01.mp3";
const COUNTDOWN_VARIANT = "/audio/countdown-01.mp3";
const RESPONSE_PROMPT_VARIANT = "/audio/claim-intro-01.mp3";
const BACKGROUND_MUSIC = "/audio/red_trax__bacon_fat.mp3";
const MAX_BACKGROUND_MUSIC_VOLUME = 0.5;
const DEFAULT_MUSIC_LEVEL = 40;

let backgroundMusic: HTMLAudioElement | null = null;
function musicPlayer(): HTMLAudioElement {
	if (!backgroundMusic) {
		backgroundMusic = new Audio(BACKGROUND_MUSIC);
		backgroundMusic.loop = true;
		backgroundMusic.preload = "auto";
		backgroundMusic.volume = DEFAULT_MUSIC_LEVEL / 100 * MAX_BACKGROUND_MUSIC_VOLUME;
	}
	return backgroundMusic;
}
function useBackgroundMusic(active: boolean, level: number, fadeOut = false): void {
	useEffect(function () {
		const player = musicPlayer();
		const targetVolume = Math.max(0, Math.min(100, level)) / 100 * MAX_BACKGROUND_MUSIC_VOLUME;
		let frame = 0;
		let finished = false;
		function removeUnlockListeners(): void {
			window.removeEventListener("pointerdown", tryPlay);
			window.removeEventListener("keydown", tryPlay);
		}
		function tryPlay(): void {
			if (!active || targetVolume === 0 || finished) { return; }
			void player.play().then(removeUnlockListeners).catch(function () { return; });
		}
		removeUnlockListeners();
		if (!active || targetVolume === 0) {
			player.pause();
			player.volume = targetVolume;
			return;
		}
		player.volume = targetVolume;
		tryPlay();
		window.addEventListener("pointerdown", tryPlay);
		window.addEventListener("keydown", tryPlay);
		if (fadeOut) {
			const startedAt = performance.now();
			function fade(now: number): void {
				const progress = Math.min(1, (now - startedAt) / 2000);
				player.volume = targetVolume * (1 - progress);
				if (progress < 1) { frame = requestAnimationFrame(fade); return; }
				finished = true;
				player.pause();
				player.volume = targetVolume;
				removeUnlockListeners();
			}
			frame = requestAnimationFrame(fade);
		}
		return function () { finished = true; cancelAnimationFrame(frame); removeUnlockListeners(); };
	}, [active, fadeOut, level]);
}

function stored(key: string, fallback = ""): string { return localStorage.getItem(key) ?? fallback; }
function navigate(path: string, replace = false): void {
	if (path === `${location.pathname}${location.search}${location.hash}`) { return; }
	history[replace ? "replaceState" : "pushState"](null, "", path);
	window.dispatchEvent(new PopStateEvent("popstate"));
}
function usePathname(): string {
	const [pathname, setPathname] = useState(location.pathname);
	useEffect(function () {
		function routeChanged(): void { setPathname(location.pathname); }
		window.addEventListener("popstate", routeChanged);
		return function () { window.removeEventListener("popstate", routeChanged); };
	}, []);
	return pathname;
}
function InternalLink({ href, onClick, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }): ReactElement {
	return <a {...props} href={href} onClick={function (event) {
		onClick?.(event);
		if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || props.target === "_blank") { return; }
		event.preventDefault();
		navigate(href);
	}} />;
}
function usePreference(key: string, fallback: boolean): [boolean, (value: boolean) => void] {
	const [value, setValue] = useState(stored(key, String(fallback)) === "true");
	function update(next: boolean): void { setValue(next); localStorage.setItem(key, String(next)); }
	return [value, update];
}
function useMusicLevel(): [number, (value: number) => void] {
	const [value, setValue] = useState(function () {
		const saved = localStorage.getItem("torakka:music-volume");
		if (saved !== null) {
			const parsed = Number(saved);
			if (Number.isFinite(parsed)) { return Math.max(0, Math.min(100, parsed)); }
		}
		return stored("torakka:music-muted", "false") === "true" ? 0 : DEFAULT_MUSIC_LEVEL;
	});
	function update(next: number): void {
		const safe = Math.max(0, Math.min(100, next));
		setValue(safe);
		localStorage.setItem("torakka:music-volume", String(safe));
		localStorage.removeItem("torakka:music-muted");
	}
	return [value, update];
}
function avatarColor(name: string): string {
	let hash = 0;
	for (const char of name) { hash = (hash * 31 + char.charCodeAt(0)) | 0; }
	return `hsl(${Math.abs(hash) % 360} 27% 58%)`;
}
function avatarVariant(name: string): "round" | "square" | "oval" | "diamond" | "hex" | "triangle" {
	let hash = 0;
	for (const char of name) { hash = (hash * 31 + char.charCodeAt(0)) | 0; }
	switch (Math.abs(hash) % 6) {
		case 0: return "round";
		case 1: return "square";
		case 2: return "oval";
		case 3: return "diamond";
		case 4: return "hex";
		default: return "triangle";
	}
}
function Avatar({ name, gentleman = false }: { name: string; gentleman?: boolean }): ReactElement {
	const variant = avatarVariant(name);
	const smiles = {
		round: "M5 6Q15 16 25 6",
		square: "M4 7Q15 18 26 7",
		oval: "M6 5Q15 15 24 5",
		diamond: "M4 8Q15 19 26 8",
		hex: "M5 6Q15 13 25 6",
		triangle: "M6 9Q15 19 24 9",
	} as const;
	return <span className={`avatar avatar--${variant}${gentleman ? " avatar--gentleman" : ""}`} style={{ backgroundColor: avatarColor(name) }} aria-hidden="true">
		{gentleman && <span className="avatar__hat" />}
		<span className="avatar__eyes"><span className="avatar__eye avatar__eye--left" /><span className="avatar__eye avatar__eye--right" /></span>
		<span className="avatar__mouth"><svg viewBox="0 0 30 20" aria-hidden="true"><path d={smiles[variant]} /></svg></span>
	</span>;
}
function ResponseIcon({ kind }: { kind: "believe" | "disbelieve" | "forward" }): ReactElement {
	return <svg className="response-icon" viewBox="0 0 24 24" aria-hidden="true">
		{kind === "believe" && <path d="m4 12 5 5L20 6" />}
		{kind === "disbelieve" && <path d="M5 5l14 14M19 5 5 19" />}
		{kind === "forward" && <><path d="M2.5 10s3.2-5 8-5 8 5 8 5-3.2 5-8 5-8-5-8-5Z" /><circle cx="10.5" cy="10" r="2.2" /><path d="M14 19h8m-3-3 3 3-3 3" /></>}
	</svg>;
}
function Logo({ theme = themeFor(undefined), showVersion = false }: { theme?: ThemeDefinition; showVersion?: boolean }): ReactElement { return <InternalLink className="logo" href="/" aria-label={theme.brand.label}><span className="logo__bug">✳</span> {theme.brand.first}<span className="logo__light">{theme.brand.second}</span>{showVersion && <small className="logo__version">v{__APP_VERSION__}</small>}</InternalLink>; }
function MusicVolume({ level, setLevel }: { level: number; setLevel: (value: number) => void }): ReactElement {
	return <label className="music-volume"><span>{FI.session.musicLabel}</span><input type="range" min="0" max="100" step="5" value={level} onChange={event => setLevel(Number(event.target.value))} aria-label={FI.session.musicLabel} /><output>{level}%</output></label>;
}
function Rules({ theme = themeFor(undefined) }: { theme?: ThemeDefinition }): ReactElement {
	const steps = [theme.rulesFirst, FI.rules.steps[1], FI.rules.steps[2], theme.rulesLoss, FI.rules.steps[4]];
	return <div className="rules"><h2>{FI.rules.title}</h2><ol>{steps.map(function (step, index) { return <li key={index}>{step}</li>; })}</ol><p>{theme.rulesVisibility}</p><p>{FI.rules.videoCall}</p></div>;
}
function ThemeSelector({ selected, host, locked, busy, select }: { selected: ThemeDefinition; host: boolean; locked: boolean; busy: boolean; select: (id: ThemeDefinition["id"]) => void }): ReactElement {
	return <section className="theme-picker" aria-label={FI.lobby.theme}><h3>{FI.lobby.theme}</h3><div className="theme-picker__choices">{AVAILABLE_THEMES.map(function (theme) {
		const active = theme.id === selected.id;
		return <button type="button" className={`theme-option ${theme.className}${active ? " theme-option--selected" : ""}`} key={theme.id} disabled={!host || locked || busy} aria-pressed={active} onClick={() => select(theme.id)}><span className="theme-option__fan"><CreatureArt creature="torakka" themeId={theme.id} small /><CreatureArt creature="hamahakki" themeId={theme.id} small /></span><strong>{theme.name}</strong><small>{theme.id === "herrasmiespokeri" ? "Herrasmiehiä, promilleja ja klubin häpeää." : "Örkkejä, ötököitä ja huonoja ystäviä."}</small>{active && <b>{FI.lobby.themeSelected}</b>}</button>;
	})}</div>{!host && <p className="fineprint">{FI.lobby.hostChoosesTheme}</p>}{locked && <p className="fineprint">{FI.lobby.themeLocked}</p>}</section>;
}
function randomCardFan(cards: readonly Creature[]): Creature[] {
	const shuffled = [...cards];
	for (let index = shuffled.length - 1; index > 0; index--) {
		const target = Math.floor(Math.random() * (index + 1));
		[shuffled[index], shuffled[target]] = [shuffled[target]!, shuffled[index]!];
	}
	return shuffled.slice(0, 4);
}
function LobbyCardPreview({ theme }: { theme: ThemeDefinition }): ReactElement | null {
	const imageBased = Object.keys(theme.images).length > 0;
	const cards = CREATURES.filter(creature => !imageBased || Boolean(theme.images[creature]));
	const [fan, setFan] = useState(function () { return { cards: randomCardFan(cards), revision: 0 }; });
	useEffect(function () {
		setFan(current => ({ cards: randomCardFan(cards), revision: current.revision + 1 }));
		if (cards.length <= 4) { return; }
		let timer: number | undefined;
		function stop(): void { if (timer !== undefined) { window.clearInterval(timer); timer = undefined; } }
		function start(): void {
			stop();
			if (!document.hidden) { timer = window.setInterval(() => setFan(current => ({ cards: randomCardFan(cards), revision: current.revision + 1 })), 6000); }
		}
		function visibilityChanged(): void { start(); }
		start();
		document.addEventListener("visibilitychange", visibilityChanged);
		return function () { stop(); document.removeEventListener("visibilitychange", visibilityChanged); };
	}, [theme.id, cards.length]);
	if (!fan.cards.length) { return null; }
	return <div className="mini-card-fan" key={`${theme.id}:${fan.revision}`} aria-hidden="true">{fan.cards.map(function (creature) {
		return <div className="mini-card" data-creature={creature} key={creature}><span className="mini-card__art"><CreatureArt creature={creature} themeId={theme.id} /></span><p>{theme.labels[creature]}</p></div>;
	})}</div>;
}
function App(): ReactElement {
	const pathname = usePathname();
	const match = pathname.match(/^\/r\/([^/]+)/);
	const roomId = match?.[1] ?? "";
	const [name, setName] = useState(stored("torakka:name"));
	const [joinedRoomId, setJoinedRoomId] = useState(roomId && stored("torakka:name") && stored(`torakka:token:${roomId}`) ? roomId : "");
	const joined = Boolean(roomId && joinedRoomId === roomId);
	const [error, setError] = useState("");
	const [rules, setRules] = useState(false);
	const [creating, setCreating] = useState(false);
	const [openRooms, setOpenRooms] = useState<OpenRoomView[]>([]);
	const [resumeRoomId, setResumeRoomId] = useState("");
	const [joinTheme, setJoinTheme] = useState<ThemeRef | undefined>();
	const [musicLevel, setMusicLevel] = useMusicLevel();
	const landingTheme = themeFor(joinTheme);
	useEffect(function () {
		setJoinedRoomId(roomId && stored("torakka:name") && stored(`torakka:token:${roomId}`) ? roomId : "");
		setJoinTheme(undefined);
		setError("");
	}, [roomId]);
	useEffect(function () { document.title = landingTheme.brand.documentTitle; }, [landingTheme, pathname]);
	useEffect(function () {
		if (!roomId || joined) { return; }
		void fetch(`/api/rooms/${roomId}/appearance`).then(response => response.ok ? response.json() : null).then(function (value: { theme?: ThemeRef } | null) { if (value?.theme) { setJoinTheme(value.theme); } }).catch(function () { return; });
	}, [roomId, joined]);
	useEffect(function () {
		if (roomId) { return; }
		let active = true;
		async function refresh(): Promise<void> {
			try {
				const response = await fetch("/api/rooms/open");
				if (response.ok && active) { setOpenRooms(await response.json() as OpenRoomView[]); }
			}
			catch { return; }
		}
		void refresh(); const timer = setInterval(() => void refresh(), 5000);
		return function () { active = false; clearInterval(timer); };
	}, [roomId]);
	useEffect(function () {
		setResumeRoomId("");
		if (roomId) { return; }
		const previousRoomId = stored("torakka:room");
		if (!previousRoomId) { return; }
		const controller = new AbortController();
		void fetch(`/api/rooms/${previousRoomId}/appearance`, { signal: controller.signal }).then(function (response) {
			if (response.ok) { setResumeRoomId(previousRoomId); return; }
			if (response.status === 404) {
				localStorage.removeItem("torakka:room");
				localStorage.removeItem(`torakka:token:${previousRoomId}`);
			}
		}).catch(function () { return; });
		return function () { controller.abort(); };
	}, [roomId]);
	async function createRoom(): Promise<void> {
		setCreating(true); setError("");
		try {
			const response = await fetch("/api/rooms", { method: "POST" });
			const result = await response.json() as { id?: string; error?: string };
			if (!response.ok || !result.id) { throw new Error(result.error ?? FI.error.createRoom); }
			localStorage.setItem("torakka:room", result.id); navigate(`/r/${result.id}`);
		}
		catch (err) { setError(err instanceof Error ? err.message : FI.error.connection); }
		finally { setCreating(false); }
	}
	if (joined && roomId) { return <Session roomId={roomId} name={name.trim()} musicLevel={musicLevel} setMusicLevel={setMusicLevel} returnToJoin={() => setJoinedRoomId("")} />; }
	return <div className={`landing ${landingTheme.className}`}><BackgroundMusic active level={musicLevel} /><header className="topbar"><Logo theme={landingTheme} showVersion /><nav className="topbar__tools"><MusicVolume level={musicLevel} setLevel={setMusicLevel} /><button className="button button--quiet" onClick={() => setRules(!rules)}>{FI.landing.rulesButton}</button></nav></header>
		<main className="landing__main"><div className="landing__copy"><p className="eyebrow">{FI.landing.eyebrow}</p><h1>{FI.landing.headingFirst}<br /><em>{FI.landing.headingEmphasis}</em><br />{FI.landing.headingLast}</h1><p className="lede">{landingTheme.landingLede}</p>
			{roomId ? <form className="join-form" onSubmit={function (event) { event.preventDefault(); localStorage.setItem("torakka:name", name.trim()); setJoinedRoomId(roomId); }}><label htmlFor="name">{FI.landing.joinLabel}</label><div className="join-form__row"><input id="name" autoComplete="nickname" autoFocus maxLength={24} required value={name} onChange={e => setName(e.target.value)} placeholder={FI.landing.namePlaceholder} /><button className="button button--primary" disabled={!name.trim()}>{FI.landing.join}</button></div><p className="fineprint">{FI.landing.accountNote}</p></form> : <><div className="landing__actions"><button className="button button--primary button--large" onClick={createRoom} disabled={creating}>{creating ? FI.landing.creatingRoom : FI.landing.createRoom}</button>{resumeRoomId && <InternalLink className="button button--quiet" href={`/r/${resumeRoomId}`}>{FI.landing.resumeRoom}</InternalLink>}<p className="fineprint">{FI.landing.privacyNote}</p></div>{openRooms.length > 0 && <section className="open-rooms"><h2>{FI.landing.openRooms}</h2><div>{openRooms.map(room => <InternalLink href={`/r/${room.id}`} className={`open-room ${themeFor(room.themeId).className}`} key={room.id}><strong>{FI.landing.hostRoom(room.hostName)}</strong><span><b>{themeFor(room.themeId).name}</b> · {FI.landing.roomPlayers(room.seatedCount)} · {room.playing ? FI.landing.roomPlaying : FI.landing.roomLobby}</span></InternalLink>)}</div></section>}</>}
			{error && <p role="alert" className="error">{error}</p>}
		</div><div className="landing__art" aria-hidden="true"><div className="hero-card hero-card--back"><span>{landingTheme.cardBack}</span><CreatureArt creature="hamahakki" themeId={landingTheme.id} /></div><div className="hero-card"><span className="eyebrow">{FI.landing.frontCard}</span><CreatureArt creature="torakka" themeId={landingTheme.id} /><strong>{landingTheme.labels.torakka}</strong><span className="hero-card__serial">{landingTheme.cardSerial}</span></div><span className="stamp">{FI.landing.stampFirst}<br />{FI.landing.stampSecond}</span></div></main>
		<footer className="landing__footer"><span>{FI.landing.footerLeft}</span><span>{FI.landing.footerRight}</span><span>Based on <a href="https://en.wikipedia.org/wiki/Cockroach_Poker" target="_blank" rel="noopener noreferrer">Cockroach Poker</a>, designed by Jacques Zeimet.</span></footer>{rules && <Modal close={() => setRules(false)}><Rules theme={landingTheme} /></Modal>}</div>;
}
function BackgroundMusic({ active, level, fadeOut = false }: { active: boolean; level: number; fadeOut?: boolean }): null {
	useBackgroundMusic(active, level, fadeOut);
	return null;
}
function Modal({ close, children }: { close: () => void; children: React.ReactNode }): ReactElement {
	const dialog = useRef<HTMLElement | null>(null);
	const closeRef = useRef(close);
	closeRef.current = close;
	useEffect(function () {
		const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		dialog.current?.querySelector<HTMLElement>("button, a, input, select, [tabindex]:not([tabindex='-1'])")?.focus();
		function onKey(event: KeyboardEvent): void {
			if (event.key === "Escape") { closeRef.current(); return; }
			if (event.key !== "Tab" || !dialog.current) { return; }
			const controls = [...dialog.current.querySelectorAll<HTMLElement>("button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex='-1'])")];
			if (!controls.length) { event.preventDefault(); return; }
			const first = controls[0]!; const last = controls.at(-1)!;
			if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
			else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
		}
		window.addEventListener("keydown", onKey);
		return function () { window.removeEventListener("keydown", onKey); previousFocus?.focus(); };
	}, []);
	return <div className="modal-backdrop" onClick={close}><section ref={dialog} className="modal" role="dialog" aria-modal="true" aria-label={FI.common.dialogLabel} onClick={e => e.stopPropagation()}><button className="button button--quiet modal__close" onClick={close} aria-label={FI.common.close}>✕</button>{children}</section></div>;
}
function Session({ roomId, name, musicLevel, setMusicLevel, returnToJoin }: { roomId: string; name: string; musicLevel: number; setMusicLevel: (value: number) => void; returnToJoin: () => void }): ReactElement {
	const socketRef = useRef<Socket | null>(null);
	const [state, setState] = useState<RoomView | null>(null);
	const [error, setError] = useState("");
	const [connected, setConnected] = useState(false);
	const [replaced, setReplaced] = useState(false);
	const [destroyed, setDestroyed] = useState(false);
	const [busy, setBusy] = useState(false);
	const [rules, setRules] = useState(false);
	const [history, setHistory] = useState(false);
	const [muted, setMuted] = usePreference("torakka:muted", false);
	const [reduced, setReduced] = usePreference("torakka:reduced", matchMedia("(prefers-reduced-motion: reduce)").matches);
	const [guided, setGuided] = usePreference("torakka:guided", true);
	const [time, setTime] = useState(Date.now());
	const [copied, setCopied] = useState(false);
	const [focusMode, setFocusMode] = usePreference("torakka:focus-mode", false);
	const countdownSoundSecond = useRef<number | null>(null);
	const musicActive = !state || !state.game || state.game.phase === "ended";
	const musicFading = Boolean(state && !state.game && state.countdownAt !== null);
	useBackgroundMusic(musicActive, musicLevel, musicFading);
	useEffect(function () { if (state) { document.title = themeFor(state.theme).brand.documentTitle; } }, [state?.theme.id, state?.theme.version]);
	useEffect(function () {
		const timer = setInterval(() => setTime(Date.now()), 250); return function () { clearInterval(timer); };
	}, []);
	useEffect(function () {
		if (muted || !state?.countdownAt || reduced) { countdownSoundSecond.current = null; return; }
		const nextSecond = Math.max(1, Math.ceil((state.countdownAt - time) / 1000));
		if (countdownSoundSecond.current !== nextSecond) {
			countdownSoundSecond.current = nextSecond;
			void playNormalizedAudio(COUNTDOWN_VARIANT, 0.5).catch(function () { return; });
		}
	}, [muted, reduced, state?.countdownAt, time]);
	useEffect(function () {
		const socket = io(); socketRef.current = socket;
		socket.on("connect", function () {
			socket.emit("join", { roomId, name, token: stored(`torakka:token:${roomId}`) || undefined }, function (reply: Reply) {
				if (reply.ok) { if (reply.token) { localStorage.setItem(`torakka:token:${roomId}`, reply.token); } localStorage.setItem("torakka:room", roomId); setConnected(true); setError(""); }
				else { setError(reply.error); }
			});
		});
		socket.on("state", function (next: RoomView) { setState(next); });
		socket.on("replaced", function () { setReplaced(true); socket.disconnect(); });
		socket.on("lobby-closed", function () { setDestroyed(true); socket.disconnect(); navigate("/", true); });
		socket.on("disconnect", function () { setConnected(false); });
		socket.on("connect_error", function () { setError(FI.error.serverUnavailable); });
		return function () { socket.disconnect(); };
	}, [roomId, name]);
	useEffect(function () {
		function onClick(event: MouseEvent): void {
			if (muted) { return; }
			const target = event.target;
			if (!(target instanceof Element)) { return; }
			const button = target.closest("button");
			if (!button || button.hasAttribute("disabled")) { return; }
			void playNormalizedAudio(UI_CLICK_VARIANT, 0.45).catch(function () { return; });
		}
		window.addEventListener("click", onClick);
		return function () { window.removeEventListener("click", onClick); };
	}, [muted]);
	async function command(action: RoomAction): Promise<void> {
		if (!state || !connected || busy) { return; }
		setBusy(true); setError("");
		try {
			const reply = await socketRef.current!.timeout(5000).emitWithAck("command", { id: crypto.randomUUID(), revision: state.revision, action }) as Reply;
			if (!reply.ok) { setError(reply.error); }
		}
		catch { setError(FI.error.commandTimeout); }
		finally { setBusy(false); }
	}
	async function copyLink(): Promise<void> {
		try { await navigator.clipboard.writeText(location.href); setCopied(true); setTimeout(() => setCopied(false), 2000); }
		catch { setError(FI.error.copyLink(location.href)); }
	}
	if (replaced) { return <main className="status-page"><Logo /><h1>{FI.session.replacedTitle}</h1><p>{FI.session.replacedBody}</p><button className="button" onClick={returnToJoin}>{FI.session.returnToJoin}</button></main>; }
	if (destroyed) { return <main className="status-page"><Logo /><h1>{FI.session.searchingRoom}</h1><InternalLink className="button" href="/">{FI.common.back}</InternalLink></main>; }
	if (!state) { return <main className="status-page"><Logo /><h1>{error || FI.session.searchingRoom}</h1><InternalLink className="button" href="/">{FI.common.back}</InternalLink></main>; }
	const me = state.members.find(m => m.id === state.me)!;
	const host = state.hostId === state.me;
	const game = state.game;
	const theme = themeFor(state.theme);
	const gentleman = theme.id === "herrasmiespokeri";
	return <div className={`app ${theme.className}${reduced ? " app--reduced" : ""}${focusMode && game && game.phase !== "ended" ? " app--focus" : ""}`}><header className="topbar"><Logo theme={theme} /><nav className="topbar__tools">{(!game || game.phase === "ended") && <MusicVolume level={musicLevel} setLevel={setMusicLevel} />}<label className="sound-toggle"><span className="sound-toggle__label">{FI.session.soundLabel}</span><input type="checkbox" role="switch" checked={!muted} onChange={event => setMuted(!event.target.checked)} /><span className="sound-toggle__track" aria-hidden="true"><span /></span></label>{game && <><span className="game-status"><i className={`dot${connected ? "" : " dot--offline"}`} />{connected ? state.open ? FI.session.openTable : FI.session.privateTable : FI.session.reconnecting}</span><button onClick={copyLink} className="button button--quiet button--compact">{copied ? FI.session.linkCopied : FI.session.copyInvite}</button></>}<details className="topbar__more"><summary className="button button--quiet button--compact">{FI.session.more}</summary><div><button className="button button--quiet" onClick={() => setRules(true)}>{FI.session.rules}</button><button className="button button--quiet" onClick={() => setHistory(true)}>{FI.session.history} <span className="badge">{state.history.length}</span></button></div></details>{game && game.phase !== "ended" && <button className="button button--compact focus-enter" onClick={() => setFocusMode(true)}>{FI.session.focusMode}</button>}{host && game && game.phase !== "ended" && <button className="button button--danger button--compact" disabled={busy || !connected} onClick={function () { if (confirm(FI.session.confirmEnd)) { void command({ kind: "end" }); } }}>{FI.session.stopGame}</button>}</nav></header>
		{focusMode && game && game.phase !== "ended" && <button className="button button--compact focus-restore" onClick={() => setFocusMode(false)}>{FI.session.exitFocusMode}</button>}
		{!game && <div className="room-strip"><span><i className={`dot${connected ? "" : " dot--offline"}`} /> {connected ? state.open ? FI.session.openTable : FI.session.privateTable : FI.session.reconnecting}</span><button onClick={copyLink} className="text-button">{copied ? FI.session.linkCopied : FI.session.copyInvite}</button></div>}
		{error && <div role="alert" className="error error--banner">{error}<button aria-label={FI.common.close} onClick={() => setError("")}>✕</button></div>}
		{!connected && <div className="error error--banner">{FI.session.connectionLost}</div>}
		{state.vote && <div className="vote"><strong>{FI.session.requestSeat(state.members.find(m => m.id === state.vote!.requesterId)?.name ?? "")}</strong><span>{FI.session.approvals(state.vote.approvals.length, Math.floor(state.vote.voters.length / 2) + 1)}</span>{state.vote.voters.includes(state.me) && <><button className="button" disabled={busy} onClick={() => command({ kind: "vote", approve: true })}>{FI.session.approve}</button><button className="button button--quiet" disabled={busy} onClick={() => command({ kind: "vote", approve: false })}>{FI.session.reject}</button></>}</div>}
		{state.waitingSeatId && <div className="vote"><strong>{FI.session.replacementNeeded}</strong><span>{FI.session.waitingReplacement}</span>{host && <button className="button" onClick={function () { if (confirm(FI.session.confirmEnd)) { void command({ kind: "end" }); } }}>{FI.session.endGame}</button>}</div>}
		{!game ? <main className="lobby"><section><p className="eyebrow">{FI.lobby.eyebrow}</p><div className="lobby__heading"><h1>{FI.lobby.heading}</h1>{host && !state.closed && <button className="button button--danger lobby__close" disabled={busy || !connected} onClick={function () { if (confirm(FI.lobby.closeConfirm)) { void command({ kind: "close-lobby" }); } }}>{FI.lobby.closeLobby}</button>}</div><p className="lede">{FI.lobby.lede}</p><div className="lobby__players">{state.members.filter(m => m.seated).map(m => <div className={`lobby-player${m.ready ? " lobby-player--ready" : ""}`} key={m.id}><Avatar name={m.name} gentleman={gentleman} /><span><strong>{m.name}{m.id === state.me ? FI.lobby.self : ""}{m.computer ? ` (${FI.lobby.computer})` : ""}</strong><small>{m.computer ? (m.ready ? FI.lobby.readyState : FI.lobby.notReadyState) : (!m.online ? FI.lobby.offline : m.ready ? FI.lobby.readyState : FI.lobby.notReadyState)}</small></span><span>{m.ready ? "✓" : "…"}</span>{host && m.computer && <button type="button" className="lobby-player__remove" aria-label={FI.lobby.removeComputer(m.name)} disabled={busy || !connected} onClick={function () { if (confirm(FI.lobby.removeComputerConfirm(m.name))) { void command({ kind: "remove", seatId: m.id }); } }}>✕</button>}</div>)}</div>
			<div className="lobby__actions">
				{me.seated ? <button className="button button--primary button--large" disabled={busy || !connected} onClick={() => command({ kind: "ready", ready: !me.ready })}>{me.ready ? FI.lobby.readyButton : FI.lobby.notReadyButton}</button> : <button className="button button--primary" disabled={state.members.filter(m => m.seated).length >= 6 || busy} onClick={() => command({ kind: "sit" })}>{FI.lobby.sit}</button>}
				{me.seated && <button className="button button--quiet button--compact" onClick={() => command({ kind: "stand" })}>{FI.lobby.stand}</button>}
				{host && <button className="button button--quiet button--compact" disabled={state.members.filter(m => m.seated).length >= 6 || busy || !connected} onClick={() => void command({ kind: "add-computer" })}>{FI.lobby.addComputer}</button>}
			</div>
			{!game && <button className="text-button text-button--danger" disabled={busy || !connected} onClick={function () { if (confirm(FI.lobby.leaveConfirm)) { void command({ kind: "leave-table" }); } }}>{FI.lobby.leaveTable}</button>}
			{state.countdownAt !== null && <div className="countdown" role="status"><strong>{Math.max(1, Math.ceil((state.countdownAt - time) / 1000))}</strong><span>{FI.lobby.countdown}</span></div>}
			<div className="lobby__spectators"><h2>{FI.lobby.spectatorsHeading}</h2>{state.members.filter(m => !m.seated).length ? <div className="lobby__players">{state.members.filter(m => !m.seated).map(m => <div className="lobby-player" key={m.id}><Avatar name={m.name} gentleman={gentleman} /><span><strong>{m.name}{m.id === state.me ? FI.lobby.self : ""}</strong><small>{!m.online ? FI.lobby.offline : FI.lobby.readyState}</small></span></div>)}</div> : <p>{FI.lobby.spectatorsEmpty}</p>}</div>
		</section><aside className="lobby__aside"><ThemeSelector selected={theme} host={host} locked={state.countdownAt !== null} busy={busy || !connected} select={id => void command({ kind: "set-theme", themeId: id })} /><LobbyCardPreview theme={theme} /><h3>{FI.common.settings}</h3>{host && <label className="check"><input type="checkbox" checked={state.open} disabled={busy || !connected} onChange={event => void command({ kind: "set-open", open: event.target.checked })} /> {FI.lobby.openRoom}</label>}<label className="check"><input type="checkbox" checked={guided} onChange={e => setGuided(e.target.checked)} /> {FI.lobby.guide}</label><label className="check"><input type="checkbox" checked={reduced} onChange={e => setReduced(e.target.checked)} /> {FI.common.reducedMotion}</label><p className="fineprint">{host ? FI.lobby.openRoomNote : FI.lobby.preferencesNote}</p><p className="fineprint">{FI.lobby.spectators(state.members.filter(m => !m.seated).length)}</p></aside></main> : <Table key={game.id} state={state} command={command} busy={busy || !connected || Boolean(state.waitingSeatId)} muted={muted} reduced={reduced} guided={guided} time={time} />}
		<footer className="app__footer"><span aria-live="polite">{state.notice}</span><span>{theme.name.toLocaleUpperCase("fi")}</span></footer>
		{rules && <Modal close={() => setRules(false)}><Rules theme={theme} /><label className="check"><input type="checkbox" checked={reduced} onChange={e => setReduced(e.target.checked)} /> {FI.common.reducedMotion}</label></Modal>}
		{history && <Modal close={() => setHistory(false)}><History items={state.history} /></Modal>}
	</div>;
}
function Table({ state, command, busy, muted, reduced, guided, time }: { state: RoomView; command: (action: RoomAction) => Promise<void>; busy: boolean; muted: boolean; reduced: boolean; guided: boolean; time: number }): ReactElement {
	const game = state.game!;
	const theme = themeFor(game.theme);
	const me = game.seats.find(s => s.personId === state.me && !s.removed);
	const claim = game.challenge?.claims.at(-1);
	const claimSender = game.seats.find(seat => seat.id === claim?.senderId)?.name ?? "";
	const claimReceiver = game.seats.find(seat => seat.id === claim?.receiverId)?.name ?? "";
	const required = game.phase === "initiation" ? game.activeSeatId : claim?.receiverId;
	const [dismissedTutorials, setDismissedTutorials] = useState<Set<string>>(function () { return new Set(stored("torakka:tutorials:v1").split(",").filter(Boolean)); });
	const [result, setResult] = useState(false);
	const [answerFlash, setAnswerFlash] = useState(false);
	const [selectedCard, setSelectedCard] = useState<Creature | null>(null);
	const [selectedTarget, setSelectedTarget] = useState("");
	const [handoff, setHandoff] = useState<{ from: string; to: string } | null>(null);
	const [peeking, setPeeking] = useState(false);
	const [nextTurnSeat, setNextTurnSeat] = useState<string | null>(game.phase === "initiation" ? game.activeSeatId : null);
	const [routePaths, setRoutePaths] = useState<{ d: string; labelX: number; labelY: number }[]>([]);
	const tableRef = useRef<HTMLElement | null>(null);
	const seen = useRef(game.lastResolution?.id);
	const challengeSoundIndex = useRef(0);
	const responsePromptSeen = useRef<string | null>(null);
	const previous = useRef({
		activeSeatId: game.activeSeatId,
		challengeId: game.challenge?.id,
		claimCount: game.challenge?.claims.length ?? 0,
		phase: game.phase,
	});
	useEffect(function () {
		setSelectedCard(null);
		setSelectedTarget("");
	}, [game.phase, game.challenge?.id, game.challenge?.claims.length, game.activeSeatId]);
	useEffect(function () {
		const old = previous.current;
		const latestClaim = game.challenge?.claims.at(-1);
		const isNewHandoff = Boolean(latestClaim && (old.challengeId !== game.challenge?.id || old.claimCount < (game.challenge?.claims.length ?? 0)));
		if (isNewHandoff && latestClaim) {
			setNextTurnSeat(null);
			setHandoff({ from: latestClaim.senderId, to: latestClaim.receiverId });
			if (!muted) {
				const variants = (game.challenge?.claims.length ?? 0) === 1 ? CARD_SEND_VARIANTS : CARD_PASS_VARIANTS;
				void playNormalizedAudio(selectRandomAudio(variants), 0.48).catch(function () { return; });
			}
			const handoffTimer = setTimeout(() => setHandoff(null), reduced ? 40 : 1250);
			previous.current = { activeSeatId: game.activeSeatId, challengeId: game.challenge?.id, claimCount: game.challenge?.claims.length ?? 0, phase: game.phase };
			return function () { clearTimeout(handoffTimer); };
		}
		if (old.phase === "response" && game.phase === "passing" && game.challenge?.card) {
			setPeeking(true);
			const peekTimer = setTimeout(() => setPeeking(false), reduced ? 40 : 1450);
			previous.current = { activeSeatId: game.activeSeatId, challengeId: game.challenge?.id, claimCount: game.challenge?.claims.length ?? 0, phase: game.phase };
			return function () { clearTimeout(peekTimer); };
		}
		if (old.activeSeatId !== game.activeSeatId && game.phase === "initiation") {
			setNextTurnSeat(game.activeSeatId);
			previous.current = { activeSeatId: game.activeSeatId, challengeId: game.challenge?.id, claimCount: game.challenge?.claims.length ?? 0, phase: game.phase };
			return;
		}
		previous.current = { activeSeatId: game.activeSeatId, challengeId: game.challenge?.id, claimCount: game.challenge?.claims.length ?? 0, phase: game.phase };
	}, [game.activeSeatId, game.challenge?.card, game.challenge?.claims.length, game.challenge?.id, game.phase, me?.id, muted, reduced]);
	useEffect(function () {
		if (!nextTurnSeat || result) { return; }
		const timer = setTimeout(() => setNextTurnSeat(null), reduced ? 40 : 2800);
		return function () { clearTimeout(timer); };
	}, [nextTurnSeat, reduced, result]);
	useEffect(function () {
		const table = tableRef.current;
		if (!table || !game.challenge) { setRoutePaths([]); return; }
		let frame = 0;
		function measure(): void {
			const bounds = table!.getBoundingClientRect();
			const felt = table!.querySelector<HTMLElement>(".play-area")?.getBoundingClientRect();
			if (!felt) { setRoutePaths([]); return; }
			const seats = new Map([...table!.querySelectorAll<HTMLElement>("[data-seat-id]")].map(element => [element.dataset.seatId!, element.getBoundingClientRect()]));
			const feltBounds = { left: felt.left - bounds.left, right: felt.right - bounds.left, top: felt.top - bounds.top, bottom: felt.bottom - bounds.top };
			const feltCenter = { x: (feltBounds.left + feltBounds.right) / 2, y: (feltBounds.top + feltBounds.bottom) / 2 };
			function center(rect: DOMRect): { x: number; y: number } { return { x: rect.left + rect.width / 2 - bounds.left, y: rect.top + rect.height / 2 - bounds.top }; }
			function edge(rect: DOMRect, target: { x: number; y: number }): { x: number; y: number } {
				const origin = center(rect); const dx = target.x - origin.x; const dy = target.y - origin.y;
				const scaleX = dx === 0 ? Number.POSITIVE_INFINITY : rect.width / 2 / Math.abs(dx);
				const scaleY = dy === 0 ? Number.POSITIVE_INFINITY : rect.height / 2 / Math.abs(dy);
				const scale = Math.min(scaleX, scaleY);
				return { x: origin.x + dx * scale, y: origin.y + dy * scale };
			}
			setRoutePaths(game.challenge!.claims.flatMap(function (item, index) {
				const from = seats.get(item.senderId); const to = seats.get(item.receiverId);
				if (!from || !to) { return []; }
				const fromCenter = center(from); const toCenter = center(to);
				const midpoint = { x: (fromCenter.x + toCenter.x) / 2, y: (fromCenter.y + toCenter.y) / 2 };
				const radial = { x: midpoint.x - feltCenter.x, y: midpoint.y - feltCenter.y };
				const lane = 13 + index % 4 * 8;
				let control: { x: number; y: number };
				if (Math.max(Math.abs(radial.x), Math.abs(radial.y)) > 30) {
					if (Math.abs(radial.x) > Math.abs(radial.y)) { control = { x: radial.x < 0 ? feltBounds.left + lane : feltBounds.right - lane, y: midpoint.y }; }
					else { control = { x: midpoint.x, y: radial.y < 0 ? feltBounds.top + lane : feltBounds.bottom - lane }; }
				}
				else if (Math.abs(fromCenter.x - toCenter.x) > Math.abs(fromCenter.y - toCenter.y)) {
					control = { x: midpoint.x, y: index % 2 === 0 ? feltBounds.top + lane : feltBounds.bottom - lane };
				}
				else { control = { x: index % 2 === 0 ? feltBounds.right - lane : feltBounds.left + lane, y: midpoint.y }; }
				control.x = Math.max(feltBounds.left + lane, Math.min(feltBounds.right - lane, control.x));
				control.y = Math.max(feltBounds.top + lane, Math.min(feltBounds.bottom - lane, control.y));
				const start = edge(from, control); const end = edge(to, control);
				return [{ d: `M ${start.x} ${start.y} Q ${control.x} ${control.y} ${end.x} ${end.y}`, labelX: (start.x + 2 * control.x + end.x) / 4, labelY: (start.y + 2 * control.y + end.y) / 4 }];
			}));
		}
		function schedule(): void { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); }
		const observer = new ResizeObserver(schedule); observer.observe(table); schedule(); window.addEventListener("resize", schedule);
		return function () { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener("resize", schedule); };
	}, [game.challenge?.id, game.challenge?.claims.length]);
	function playVariant(variant: string): void {
		if (muted) { return; }
		void playNormalizedAudio(variant, 0.7).catch(function () { return; });
	}
	useEffect(function () {
		const resolution = game.lastResolution;
		if (!resolution || seen.current === resolution.id) { return; }
		seen.current = resolution.id; setResult(true); setAnswerFlash(false);
		const audioTimers: number[] = [];
		if (!muted && !resolution.cancelled) {
			playVariant(selectRandomAudio(resolution.receiverBelieves ? BELIEVE_VARIANTS : DISBELIEVE_VARIANTS));
			audioTimers.push(window.setTimeout(() => playVariant(selectRandomAudio(CHALLENGE_REVEAL_VARIANTS)), 300));
			audioTimers.push(window.setTimeout(() => playVariant(selectRandomAudio(PENALTY_TRANSFER_VARIANTS)), 650));
			if (resolution.penaltyPersonId === state.me || resolution.claims.at(-1)?.senderPersonId === state.me || resolution.receiverPersonId === state.me) {
				const isLoss = resolution.penaltyPersonId === state.me;
				const variants = isLoss ? LOSS_VARIANTS : WIN_VARIANTS;
				const variant = selectNextAudio(variants, isLoss ? 0 : challengeSoundIndex.current);
				challengeSoundIndex.current += 1;
				audioTimers.push(window.setTimeout(() => playVariant(variant), 1000));
			}
		}
		const resultTimer = setTimeout(() => setResult(false), reduced ? 120 : 2200);
		const flashStartTimer = setTimeout(() => setAnswerFlash(!reduced), reduced ? 100 : 2100);
		const flashEndTimer = setTimeout(() => setAnswerFlash(false), reduced ? 120 : 7800);
		return function () { clearTimeout(resultTimer); clearTimeout(flashStartTimer); clearTimeout(flashEndTimer); audioTimers.forEach(timer => clearTimeout(timer)); };
	}, [game.lastResolution?.id, muted, reduced, state.me]);
	const resolution = game.lastResolution;
	const personalOutcomePositive = resolution && (resolution.receiverPersonId === state.me || resolution.claims.at(-1)?.senderPersonId === state.me) ? resolution.penaltyPersonId !== state.me : null;
	const outcome = resolution?.claims.flatMap(c => c.predictions.map(p => p.believes === (c.creature === resolution.card.creature))) ?? [];
	const emoji = !outcome.length ? "" : outcome.every(Boolean) ? "👏" : outcome.every(v => !v) ? "😱" : "😂";
	const preparing = me?.id === required && (game.phase === "initiation" || game.phase === "passing");
	const passing = game.phase === "passing";
	const targetIds = new Set(game.seats.filter(function (seat) {
		if (!preparing || seat.removed || seat.id === me?.id) { return false; }
		if (passing) { return game.challenge?.eligibleTargets.includes(seat.id) ?? false; }
		return selectedCard !== null;
	}).map(seat => seat.id));
	const choosingTarget = targetIds.size > 0 && !selectedTarget;
	const choosingResponse = game.phase === "response" && me?.id === required;
	useEffect(function () {
		if (!choosingResponse || !game.challenge || !me) { return; }
		const promptKey = `${game.challenge.id}:${game.challenge.claims.length}:${me.id}`;
		if (responsePromptSeen.current === promptKey) { return; }
		responsePromptSeen.current = promptKey;
		if (!muted) { void playNormalizedAudio(RESPONSE_PROMPT_VARIANT, 0.6).catch(function () { return; }); }
	}, [choosingResponse, game.challenge?.id, game.challenge?.claims.length, me?.id, muted]);
	const tutorial = guided && me?.id === required ? game.phase === "initiation" ? "start" : game.phase === "response" || game.phase === "passing" ? "response" : null : null;
	const showTutorial = tutorial !== null && !dismissedTutorials.has(tutorial);
	function dismissTutorial(): void {
		if (!tutorial) { return; }
		const next = new Set(dismissedTutorials).add(tutorial);
		setDismissedTutorials(next);
		localStorage.setItem("torakka:tutorials:v1", [...next].join(","));
	}
	const routeSeatIds = new Set(game.challenge?.claims.flatMap(item => [item.senderId, item.receiverId]) ?? []);
	const ownSeatIndex = me ? game.seats.findIndex(seat => seat.id === me.id) : -1;
	const orderedSeats = ownSeatIndex >= 0 ? [...game.seats.slice(ownSeatIndex + 1), ...game.seats.slice(0, ownSeatIndex), game.seats[ownSeatIndex]!] : game.seats;
	return <main ref={tableRef} className={`table${choosingTarget ? " table--choosing-target" : ""}${choosingResponse ? " table--choosing-response" : ""}`}><div className="table__heading"><div><p className="eyebrow">{FI.table.eyebrow}</p><h1>{game.phase === "ended" ? FI.table.endedHeading : FI.table.activeHeading}</h1></div><span className="table__limit">{theme.threshold(game.threshold)}</span></div>
		{routePaths.length > 0 && <svg className="table-routes" aria-hidden="true"><defs><marker id="route-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="context-stroke" /></marker></defs>{routePaths.map(function (route, index) { const current = index === routePaths.length - 1; return <g key={index} className={`table-routes__segment table-routes__segment--${index % 4}${current ? " table-routes__segment--current" : ""}`}><path className="table-routes__path" d={route.d} markerEnd="url(#route-arrow)" /><circle cx={route.labelX} cy={route.labelY} r="10" /><text x={route.labelX} y={route.labelY + 3}>{index + 1}</text></g>; })}</svg>}
		<div className={`seats${game.phase !== "ended" ? ` seats--around seats--${orderedSeats.length}` : ""}`}>{orderedSeats.map(function (seat) {
			const member = state.members.find(m => m.id === seat.personId);
			const afk = required === seat.id && state.promptAt !== null && time - state.promptAt > 60000;
			const targetable = targetIds.has(seat.id);
			return <article key={seat.id} data-seat-id={seat.id} className={`seat${required === seat.id && game.phase !== "ended" ? " seat--active" : ""}${!member?.online || seat.removed ? " seat--offline" : ""}${selectedTarget === seat.id ? " seat--selected" : ""}${targetable ? " seat--targetable" : ""}${routeSeatIds.has(seat.id) ? " seat--on-route" : ""}${claim?.senderId === seat.id ? " seat--claim-sender" : ""}${claim?.receiverId === seat.id ? " seat--claim-receiver" : ""}${handoff?.from === seat.id ? " seat--sending" : ""}${handoff?.to === seat.id ? " seat--receiving" : ""}${nextTurnSeat === seat.id ? " seat--next-turn" : ""}${result && resolution?.penaltySeatId === seat.id ? " seat--penalty" : ""}`}>
				<button type="button" className="seat__target" disabled={!targetable || busy} aria-label={targetable ? FI.actions.choosePlayer(seat.name) : undefined} aria-pressed={selectedTarget === seat.id} onClick={() => setSelectedTarget(seat.id)}>
					<div className="seat__identity"><Avatar name={seat.name} gentleman={theme.id === "herrasmiespokeri"} /><span><strong>{seat.name}{seat.personId === state.me ? FI.table.self : ""}</strong>{(seat.removed || !member?.online || required === seat.id && game.phase !== "ended") && <small>{seat.removed ? FI.table.removed : !member?.online ? FI.session.connectionLost : FI.table.thinking}</small>}</span><span className="seat__count" aria-label={FI.table.handCount(seat.handCount)}>{seat.handCount}</span></div>
					<div className="seat__display">{CREATURES.map(function (creature) { const count = seat.display.filter(c => c.creature === creature).length; return count ? <span title={theme.labels[creature]} data-creature={creature} className={`penalty${count >= game.threshold - 1 ? " penalty--danger" : ""}`} key={creature}><CreatureArt creature={creature} themeId={theme.id} small counter /><b>{count}</b></span> : null; })}{!seat.display.length && <span className="seat__clean">{theme.cleanTable}</span>}</div>
				</button>
				{!seat.removed && game.phase !== "ended" && <div className="seat__controls">{state.hostId === state.me && !member?.online && <button className="text-button" onClick={function () { if (confirm(FI.table.confirmRemove)) { void command({ kind: "remove", seatId: seat.id }); } }}>{FI.table.removeAndDeal}</button>}{!me && (!member?.online || afk) && <button className="text-button" onClick={() => command({ kind: "request-seat", seatId: seat.id })}>{FI.table.requestSeat}</button>}</div>}
			</article>;
		})}</div>
		{game.phase === "ended" ? <section className="end-panel"><p className="eyebrow">{game.loserSeatId ? FI.table.loser : FI.table.cancelled}</p><h2>{game.seats.find(s => s.id === game.loserSeatId)?.name ?? FI.table.noLoser}</h2><p>{game.endReason === "matching" ? theme.matchingLoss(game.threshold) : game.endReason === "empty" ? FI.table.emptyHandLoss : FI.session.gameEnded}</p>{state.hostId === state.me && <div className="end-panel__actions"><button className="button button--primary" onClick={() => command({ kind: "rematch" })}>{FI.table.rematch}</button><button className="button button--danger" onClick={function () { if (confirm(FI.table.endPlayingConfirm)) { void command({ kind: "close-lobby" }); } }}>{FI.table.endPlaying}</button></div>}<History items={state.history.filter(h => h.id === game.id)} /></section> : <>
			<section className={`play-area${answerFlash && personalOutcomePositive !== null ? personalOutcomePositive ? " play-area--answer-correct" : " play-area--answer-wrong" : ""}${handoff ? " play-area--handoff" : ""}${peeking ? " play-area--peeking" : ""}`}><div className="play-area__grain" />{handoff && <div className="handoff-card" aria-hidden="true"><span>✳</span></div>}{nextTurnSeat && <div className="turn-banner" role="status"><span>{FI.table.nextPlayer(game.seats.find(s => s.id === nextTurnSeat)?.name ?? "")}</span></div>}
				{game.challenge ? <><div className="claim-presentation"><div data-creature={game.challenge.card?.creature} className={`playing-card${game.challenge.card ? " playing-card--known" : ""}`}>{game.challenge.card ? <><CreatureArt creature={game.challenge.card.creature} themeId={theme.id} /><strong>{theme.labels[game.challenge.card.creature]}</strong></> : <><span>✳</span><small>{theme.cardBack}</small></>}</div><span className="claim-presentation__arrow" aria-hidden="true">→</span><div data-creature={claim!.creature} className="claimed-card" aria-label={FI.table.claim(claimSender, theme.labels[claim!.creature].toLocaleLowerCase("fi"))}><small>{FI.table.claimCard}</small><CreatureArt creature={claim!.creature} themeId={theme.id} small /><strong>{theme.labels[claim!.creature]}</strong></div></div><h2>{FI.table.claim(claimSender, theme.labels[claim!.creature].toLocaleLowerCase("fi"))}</h2><p><strong>{claimReceiver}n</strong> {FI.table.claimRecipient}</p></> : <><div className="table-mark">✳</div><h2>{FI.table.startTurn(game.seats.find(s => s.id === game.activeSeatId)?.name ?? "")}</h2><p>{FI.table.startPrompt}</p></>}
				{result && resolution && <div className="resolution" role="status"><div className={`decision-token${resolution.receiverBelieves ? " decision-token--believe" : " decision-token--disbelieve"}`}><span>{resolution.receiverBelieves ? "✓" : "✕"}</span>{resolution.receiverBelieves ? FI.table.believe : FI.table.disbelieve}</div><div className="showdown"><div data-creature={resolution.claims.at(-1)!.creature} className="showdown__card showdown__card--claim"><small>VÄITE</small><CreatureArt creature={resolution.claims.at(-1)!.creature} themeId={theme.id} /><strong>{theme.labels[resolution.claims.at(-1)!.creature]}</strong></div><div data-creature={resolution.card.creature} className="showdown__card showdown__card--truth"><small>KORTTI</small><CreatureArt creature={resolution.card.creature} themeId={theme.id} /><strong>{theme.labels[resolution.card.creature]}</strong></div><span className={`showdown__stamp${resolution.claims.at(-1)!.creature === resolution.card.creature ? " showdown__stamp--true" : " showdown__stamp--false"}`}>{resolution.claims.at(-1)!.creature === resolution.card.creature ? "TOTTA" : "VALHE"}</span></div><p>{resolution.cancelled ? FI.table.cancelledRound : FI.table.takesCard(game.seats.find(s => s.id === resolution.penaltySeatId)?.name ?? "")}</p><span>{emoji} {outcome.length ? FI.round.correctAudienceGuesses(outcome.filter(Boolean).length, outcome.length) : ""}</span>{game.phase === "initiation" && <strong className="resolution__next">{FI.table.nextPlayer(game.seats.find(s => s.id === game.activeSeatId)?.name ?? "")}</strong>}</div>}
			</section>
			<Actions theme={theme} key={`${game.phase}:${game.challenge?.id ?? ""}:${game.challenge?.claims.length ?? 0}:${game.activeSeatId}`} game={game} meId={me?.id ?? null} command={command} busy={busy || result} card={selectedCard} target={selectedTarget} setCard={function (creature) { setSelectedCard(creature); setSelectedTarget(""); }} setTarget={setSelectedTarget} />
			{game.challenge?.canPredict && <div className="predictions"><span>{FI.table.secretPrediction} <small>{FI.table.predictionReveal}</small></span><button className={`button${game.challenge.prediction === true ? " button--selected" : ""}`} disabled={busy} onClick={() => command({ kind: "game", action: { type: "predict", challengeId: game.challenge!.id, claimIndex: game.challenge!.claims.length - 1, believes: true } })}>{FI.table.believe}</button><button className={`button${game.challenge.prediction === false ? " button--selected" : ""}`} disabled={busy} onClick={() => command({ kind: "game", action: { type: "predict", challengeId: game.challenge!.id, claimIndex: game.challenge!.claims.length - 1, believes: false } })}>{FI.table.disbelieve}</button></div>}
		</>}
		{game.lastResolution && game.phase !== "ended" && <details className="last-round"><summary>{FI.table.previousRound}</summary><RoundDetails theme={theme} resolution={game.lastResolution} names={Object.fromEntries(game.scores.map(s => [s.personId, s.name]))} /></details>}
		{game.retired.length > 0 && <details className="retired"><summary>{FI.table.retiredCards(game.retired.length)}</summary><div className="retired__cards">{game.retired.map(c => <span key={c.id}><CreatureArt creature={c.creature} themeId={theme.id} small />{theme.labels[c.creature]}</span>)}</div></details>}
		{showTutorial && <Modal close={dismissTutorial}><div className="tutorial"><h2>{FI.table.tutorialTitle}</h2><p>{tutorial === "start" ? theme.startHint : FI.table.responseHint}</p><button className="button button--primary" onClick={dismissTutorial}>{FI.table.dismissHint}</button></div></Modal>}
	</main>;
}
function Actions({ theme, game, meId, command, busy, card, target, setCard, setTarget }: { theme: ThemeDefinition; game: GameView; meId: string | null; command: (action: RoomAction) => Promise<void>; busy: boolean; card: Creature | null; target: string; setCard: (creature: Creature) => void; setTarget: (target: string) => void }): ReactElement {
	const [claim, setClaim] = useState<Creature | "">("");
	useEffect(function () {
		setClaim("");
	}, [target]);
	const mine = game.phase === "initiation" ? game.activeSeatId === meId : game.challenge?.claims.at(-1)?.receiverId === meId;
	const preparing = mine && (game.phase === "initiation" || game.phase === "passing");
	const passing = game.phase === "passing";
	const awaitingCard = preparing && !passing && !card;
	const truthfulCreature = passing ? game.challenge?.card?.creature : card;
	const claimAction = !claim ? FI.actions.chooseClaim : claim === truthfulCreature ? FI.actions.chooseTruth : FI.actions.chooseBluff;
	function submitClaim(selectedClaim: Creature): void {
		void command({ kind: "game", action: passing ? { type: "pass", targetId: target, creature: selectedClaim } : { type: "send", cardId: game.hand.find(item => item.creature === card)!.id, targetId: target, creature: selectedClaim } });
		setTarget("");
	}
	function selectClaim(creature: Creature): void {
		if (claim === creature) { submitClaim(creature); }
		else { setClaim(creature); }
	}
	return <section className={`hand-area${awaitingCard ? " hand-area--choosing-card" : ""}`}>
		{mine && game.phase === "response" && <div className="responses"><button className="button button--primary" disabled={busy} onClick={() => command({ kind: "game", action: { type: "answer", believes: true } })}><ResponseIcon kind="believe" />{FI.table.believe}</button><button className="button button--danger" disabled={busy} onClick={() => command({ kind: "game", action: { type: "answer", believes: false } })}><ResponseIcon kind="disbelieve" />{FI.table.disbelieve}</button><button className="button" disabled={busy || !game.challenge?.eligibleTargets.length} onClick={() => command({ kind: "game", action: { type: "peek" } })}><ResponseIcon kind="forward" />{FI.actions.watchAndPass}</button>{!game.challenge?.eligibleTargets.length && <small>{FI.actions.lastPlayer}</small>}</div>}
		<div className="hand-area__heading"><span className="eyebrow">{meId ? FI.actions.ownHand : FI.actions.spectatorHand}</span></div>
		{meId && <div className="hand">{CREATURES.map(function (creature) {
			const count = game.hand.filter(c => c.creature === creature).length;
			return count ? <button key={creature} data-creature={creature} className={`hand-card hand-card--${creature}${theme.images[creature] ? " hand-card--image" : ""}${card === creature ? " hand-card--selected" : ""}`} disabled={!preparing || passing || busy} onClick={() => setCard(creature)} aria-pressed={card === creature}><span className="hand-card__count">×{count}</span><CreatureArt creature={creature} themeId={theme.id} /><strong>{theme.labels[creature]}</strong></button> : null;
		})}{!game.hand.length && <p>{FI.actions.emptyHand}</p>}</div>}
		{target && <fieldset className="claim-picker claim-picker--overlay"><legend>{FI.actions.claimLabel}</legend><p>{FI.actions.claimTo(game.seats.find(s => s.id === target)?.name ?? "")}</p><div className="claim-picker__choices">{CREATURES.map(function (creature) { const truthful = creature === truthfulCreature; const selected = claim === creature; return <button type="button" key={creature} data-creature={creature} className={`claim-card${selected ? " claim-card--selected" : ""}${truthful ? " claim-card--truth" : ""}`} aria-pressed={selected} onClick={() => selectClaim(creature)} disabled={busy}><CreatureArt creature={creature} themeId={theme.id} small /><span>{theme.labels[creature]}</span>{truthful && <small>{FI.actions.trueChoice}</small>}{selected && <small className="claim-card__confirm">{FI.actions.clickAgain}</small>}</button>; })}</div><div className="claim-picker__actions"><button type="button" className="button button--quiet" onClick={() => setTarget("")}>{FI.actions.changeTarget}</button><button className="button button--primary" disabled={busy || !claim || (!passing && !card)} onClick={function () { if (claim) { submitClaim(claim); } }}>{claimAction}</button></div></fieldset>}
	</section>;
}
function RoundDetails({ resolution, names, theme }: { resolution: Resolution; names: Record<string, string>; theme: ThemeDefinition }): ReactElement {
	return <div className="round-details"><p>Kortti oli <strong>{theme.labels[resolution.card.creature]}</strong>. {resolution.cancelled ? FI.round.cancelled : FI.table.takesCard(names[resolution.penaltyPersonId] ?? FI.history.defaultPlayer)}</p>{resolution.claims.map((claim, index) => <div key={index}><strong>{names[claim.senderPersonId]}: {theme.labels[claim.creature]}</strong><span> {claim.creature === resolution.card.creature ? FI.round.trueClaim : FI.round.falseClaim}</span>{!resolution.cancelled && <div className="round-details__predictions">{claim.predictions.map(p => <span key={p.personId}>{p.believes === (claim.creature === resolution.card.creature) ? "✓" : "✕"} {names[p.personId]}: {p.believes ? FI.table.believe : FI.table.disbelieve}</span>)}{!claim.predictions.length && <small>{FI.round.noPredictions}</small>}</div>}</div>)}</div>;
}
type AchievementText = { title: string; copy: string; reason: string | ((count: number) => string) };
function achievementReason(key: string, item: Recap, personIds: readonly string[]): string {
	const selected = item.scores.filter(score => personIds.includes(score.personId));
	const award = FI.history.awards[key as keyof typeof FI.history.awards] as AchievementText | undefined;
	if (key === "bluffs") { return typeof award?.reason === "function" ? award.reason(Math.max(0, ...selected.map(score => score.bluffs))) : award?.reason ?? ""; }
	if (key === "catches") { return typeof award?.reason === "function" ? award.reason(Math.max(0, ...selected.map(score => score.catches))) : award?.reason ?? ""; }
	if (key === "correct") { return typeof award?.reason === "function" ? award.reason(Math.max(0, ...selected.map(score => score.correct))) : award?.reason ?? ""; }
	if (key === "chain") { return typeof award?.reason === "function" ? award.reason(Math.max(...item.resolutions.map(resolution => resolution.claims.length))) : award?.reason ?? ""; }
	return typeof award?.reason === "function" ? award.reason(Math.max(...item.resolutions.map(resolution => resolution.claims.length))) : award?.reason ?? "Saavutus myönnettiin tämän ottelun tapahtumien perusteella.";
}
function recapPlayerStats(item: Recap, score: Score): { answersCorrect: number; answersSubmitted: number; bluffCallsCorrect: number; bluffCallsWrong: number; bluffsPassed: number; bluffsCaught: number } {
	const answers = item.resolutions.filter(resolution => !resolution.cancelled && resolution.receiverPersonId === score.personId);
	const sent = item.resolutions.filter(resolution => !resolution.cancelled && resolution.claims.at(-1)?.senderPersonId === score.personId);
	return {
		answersCorrect: score.answersCorrect ?? answers.filter(function (resolution) { const final = resolution.claims.at(-1)!; return resolution.receiverBelieves === (final.creature === resolution.card.creature); }).length,
		answersSubmitted: score.answersSubmitted ?? answers.length,
		bluffCallsCorrect: score.bluffCallsCorrect ?? answers.filter(function (resolution) { const final = resolution.claims.at(-1)!; return !resolution.receiverBelieves && final.creature !== resolution.card.creature; }).length,
		bluffCallsWrong: score.bluffCallsWrong ?? answers.filter(function (resolution) { const final = resolution.claims.at(-1)!; return !resolution.receiverBelieves && final.creature === resolution.card.creature; }).length,
		bluffsPassed: score.bluffs,
		bluffsCaught: score.bluffsCaught ?? sent.filter(function (resolution) { const final = resolution.claims.at(-1)!; return !resolution.receiverBelieves && final.creature !== resolution.card.creature; }).length
	};
}
function History({ items }: { items: Recap[] }): ReactElement {
	const [selected, setSelected] = useState(items.at(-1)?.id ?? "");
	const [shownRounds, setShownRounds] = useState(10);
	const item = items.find(i => i.id === selected) ?? items.at(-1);
	const theme = themeFor(item?.theme);
	useEffect(function () { setShownRounds(10); }, [item?.id]);
	const rounds = item ? item.resolutions.map((resolution, index) => ({ resolution, number: index + 1 })).reverse() : [];
	return <section className={`history ${theme.className}`}><h2>{theme.historyTitle}</h2>{!item ? <p>{FI.history.empty}</p> : <><label className="history__select">{FI.history.select}<select value={item.id} onChange={e => setSelected(e.target.value)}>{[...items].reverse().map((r, i) => <option key={r.id} value={r.id}>{FI.history.game(items.length - i, new Date(r.startedAt).toLocaleString("fi-FI"), r.loserName ?? FI.history.cancelled)}</option>)}</select></label><p><strong>{item.loserName ? FI.history.loser(item.loserName) : FI.history.endedNoLoser}</strong> {FI.history.resolvedCards(item.resolutions.filter(r => !r.cancelled).length)}</p><div className="scores"><table><thead><tr><th>{FI.history.player}</th><th>{FI.history.guesses}</th><th>{FI.history.bluffCalls}</th><th>{FI.history.ownBluffs}</th></tr></thead><tbody>{[...item.scores].map(function (score) { const stats = recapPlayerStats(item, score); return <tr key={score.personId}><td>{score.name}</td><td><strong>{stats.answersCorrect}/{stats.answersSubmitted}</strong><small>{stats.answersSubmitted ? `${Math.round(stats.answersCorrect / stats.answersSubmitted * 100)} %` : "—"}</small></td><td><strong>{stats.bluffCallsCorrect} / {stats.bluffCallsWrong}</strong><small>{FI.history.rightWrong}</small></td><td><strong>{stats.bluffsPassed} / {stats.bluffsCaught}</strong><small>{FI.history.passedCaught}</small></td></tr>; })}</tbody></table></div><div className="awards">{item.awards.map(function (a) { const baseAward = FI.history.awards[a.key as keyof typeof FI.history.awards] as AchievementText; const award = { ...baseAward, ...theme.achievementCopy[a.key] }; return <article key={a.key}><span className="eyebrow">{a.personIds.map(id => item.scores.find(s => s.personId === id)?.name ?? FI.history.defaultPlayer).join(" & ")}</span><h3>{award.title}</h3><p>{award.copy}</p><footer>{achievementReason(a.key, item, a.personIds)}</footer></article>; })}</div><section className="history__rounds"><h3>{theme.roundHistoryTitle}</h3>{rounds.slice(0, shownRounds).map(function ({ resolution: round, number }) { return <details key={round.id}><summary>{number}. {theme.labels[round.card.creature]} · {round.cancelled ? FI.history.cancelled : FI.history.gotCard(item.scores.find(s => s.personId === round.penaltyPersonId)?.name ?? FI.history.defaultPlayer)}</summary><RoundDetails resolution={round} names={Object.fromEntries(item.scores.map(s => [s.personId, s.name]))} theme={theme} /></details>; })}{shownRounds < rounds.length && <button className="button button--quiet history__more" onClick={() => setShownRounds(count => Math.min(count + 10, rounds.length))}>{FI.history.showMore(rounds.length - shownRounds)}</button>}</section></>}</section>;
}

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
