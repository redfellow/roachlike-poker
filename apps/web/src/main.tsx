import { StrictMode, useEffect, useRef, useState, type ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { io, type Socket } from "socket.io-client";
import { CREATURES, LABELS, type Creature, type GameView, type Recap, type Resolution, type Score } from "@torakka/game";
import type { OpenRoomView, Reply, RoomAction, RoomView } from "@torakka/protocol";
import { CreatureArt } from "./CreatureArt";
import { playNormalizedAudio, selectNextAudio } from "./audio";
import { FI } from "./strings.fi";
import "./style.css";

document.title = FI.documentTitle;

const CARD_FLIP_VARIANTS = [
	"/audio/card-flip-fast-01.mp3",
	"/audio/card-flip-fast-02.mp3",
	"/audio/card-flip-fast-03.mp3",
] as const;
const WIN_VARIANTS = [
	"/audio/game-win-01.mp3",
	"/audio/game-win-02.mp3",
] as const;
const LOSS_VARIANTS = [
	"/audio/game-loss-light-01.mp3",
] as const;
const UI_CLICK_VARIANT = "/audio/ui-click-01.mp3";
const COUNTDOWN_VARIANT = "/audio/countdown-01.mp3";

function stored(key: string, fallback = ""): string { return localStorage.getItem(key) ?? fallback; }
function usePreference(key: string, fallback: boolean): [boolean, (value: boolean) => void] {
	const [value, setValue] = useState(stored(key, String(fallback)) === "true");
	function update(next: boolean): void { setValue(next); localStorage.setItem(key, String(next)); }
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
function Avatar({ name }: { name: string }): ReactElement {
	const variant = avatarVariant(name);
	const smiles = {
		round: "M5 6Q15 16 25 6",
		square: "M4 7Q15 18 26 7",
		oval: "M6 5Q15 15 24 5",
		diamond: "M4 8Q15 19 26 8",
		hex: "M5 6Q15 13 25 6",
		triangle: "M6 9Q15 19 24 9",
	} as const;
	return <span className={`avatar avatar--${variant}`} style={{ backgroundColor: avatarColor(name) }} aria-hidden="true">
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
function Logo(): ReactElement { return <a className="logo" href="/" aria-label={FI.brand.logoLabel}><span className="logo__bug">✳</span> {FI.brand.first}<span className="logo__light">{FI.brand.second}</span></a>; }
function Rules(): ReactElement {
	return <div className="rules"><h2>{FI.rules.title}</h2><ol>{FI.rules.steps.map(function (step, index) { return <li key={index}>{step}</li>; })}</ol><p>{FI.rules.visibility}</p><p>{FI.rules.videoCall}</p></div>;
}
function App(): ReactElement {
	const match = location.pathname.match(/^\/r\/([^/]+)/);
	const roomId = match?.[1] ?? "";
	const [name, setName] = useState(stored("torakka:name"));
	const [joined, setJoined] = useState(Boolean(roomId && stored("torakka:name") && stored(`torakka:token:${roomId}`)));
	const [error, setError] = useState("");
	const [rules, setRules] = useState(false);
	const [creating, setCreating] = useState(false);
	const [openRooms, setOpenRooms] = useState<OpenRoomView[]>([]);
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
	async function createRoom(): Promise<void> {
		setCreating(true); setError("");
		try {
			const response = await fetch("/api/rooms", { method: "POST" });
			const result = await response.json() as { id?: string; error?: string };
			if (!response.ok || !result.id) { throw new Error(result.error ?? FI.error.createRoom); }
			localStorage.setItem("torakka:room", result.id); location.href = `/r/${result.id}`;
		}
		catch (err) { setError(err instanceof Error ? err.message : FI.error.connection); }
		finally { setCreating(false); }
	}
	if (joined && roomId) { return <Session roomId={roomId} name={name.trim()} />; }
	return <div className="landing"><header className="topbar"><Logo /><button className="button button--quiet" onClick={() => setRules(!rules)}>{FI.landing.rulesButton}</button></header>
		<main className="landing__main"><div className="landing__copy"><p className="eyebrow">{FI.landing.eyebrow}</p><h1>{FI.landing.headingFirst}<br /><em>{FI.landing.headingEmphasis}</em><br />{FI.landing.headingLast}</h1><p className="lede">{FI.landing.lede}</p>
			{roomId ? <form className="join-form" onSubmit={function (event) { event.preventDefault(); localStorage.setItem("torakka:name", name.trim()); setJoined(true); }}><label htmlFor="name">{FI.landing.joinLabel}</label><div className="join-form__row"><input id="name" autoComplete="nickname" autoFocus maxLength={24} required value={name} onChange={e => setName(e.target.value)} placeholder={FI.landing.namePlaceholder} /><button className="button button--primary" disabled={!name.trim()}>{FI.landing.join}</button></div><p className="fineprint">{FI.landing.accountNote}</p></form> : <><div className="landing__actions"><button className="button button--primary button--large" onClick={createRoom} disabled={creating}>{creating ? FI.landing.creatingRoom : FI.landing.createRoom}</button>{stored("torakka:room") && <a className="button button--quiet" href={`/r/${stored("torakka:room")}`}>{FI.landing.resumeRoom}</a>}<p className="fineprint">{FI.landing.privacyNote}</p></div>{openRooms.length > 0 && <section className="open-rooms"><h2>{FI.landing.openRooms}</h2><div>{openRooms.map(room => <a href={`/r/${room.id}`} className="open-room" key={room.id}><strong>{FI.landing.hostRoom(room.hostName)}</strong><span>{FI.landing.roomPlayers(room.seatedCount)} · {room.playing ? FI.landing.roomPlaying : FI.landing.roomLobby}</span></a>)}</div></section>}</>}
			{error && <p role="alert" className="error">{error}</p>}
		</div><div className="landing__art" aria-hidden="true"><div className="hero-card hero-card--back"><span>{FI.landing.backCard}</span><CreatureArt creature="hamahakki" /></div><div className="hero-card"><span className="eyebrow">{FI.landing.frontCard}</span><CreatureArt creature="torakka" /><strong>{FI.brand.first}</strong><span className="hero-card__serial">{FI.landing.cardSerial}</span></div><span className="stamp">{FI.landing.stampFirst}<br />{FI.landing.stampSecond}</span></div></main>
		<footer className="landing__footer"><span>{FI.landing.footerLeft}</span><span>{FI.landing.footerRight}</span><span>Based on <a href="https://en.wikipedia.org/wiki/Cockroach_Poker" target="_blank" rel="noopener noreferrer">Cockroach Poker</a>, designed by Jacques Zeimet.</span></footer>{rules && <Modal close={() => setRules(false)}><Rules /></Modal>}</div>;
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
function Session({ roomId, name }: { roomId: string; name: string }): ReactElement {
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
	const [focusMode, setFocusMode] = useState(false);
	const countdownSoundSecond = useRef<number | null>(null);
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
		socket.on("lobby-closed", function () { setDestroyed(true); socket.disconnect(); window.location.replace("/"); });
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
	if (replaced) { return <main className="status-page"><Logo /><h1>{FI.session.replacedTitle}</h1><p>{FI.session.replacedBody}</p><a className="button" href={location.pathname}>{FI.session.returnToJoin}</a></main>; }
	if (destroyed) { return <main className="status-page"><Logo /><h1>{FI.session.searchingRoom}</h1><a className="button" href="/">{FI.common.back}</a></main>; }
	if (!state) { return <main className="status-page"><Logo /><h1>{error || FI.session.searchingRoom}</h1><a className="button" href={location.pathname}>{FI.common.back}</a></main>; }
	const me = state.members.find(m => m.id === state.me)!;
	const host = state.hostId === state.me;
	const game = state.game;
	return <div className={`app${reduced ? " app--reduced" : ""}${focusMode && game && game.phase !== "ended" ? " app--focus" : ""}`}><header className="topbar"><Logo /><nav className="topbar__tools"><label className="sound-toggle"><span className="sound-toggle__label">{FI.session.soundLabel}</span><input type="checkbox" role="switch" checked={!muted} onChange={event => setMuted(!event.target.checked)} /><span className="sound-toggle__track" aria-hidden="true"><span /></span></label><button className="button button--quiet" onClick={() => setRules(true)}>{FI.session.rules}</button><button className="button button--quiet" onClick={() => setHistory(true)}>{FI.session.history} <span className="badge">{state.history.length}</span></button>{game && game.phase !== "ended" && <button className="button button--compact focus-enter" onClick={() => setFocusMode(true)}>{FI.session.focusMode}</button>}{host && game && game.phase !== "ended" && <button className="button button--danger button--compact" disabled={busy || !connected} onClick={function () { if (confirm(FI.session.confirmEnd)) { void command({ kind: "end" }); } }}>{FI.session.stopGame}</button>}</nav></header>
		{focusMode && game && game.phase !== "ended" && <button className="button button--compact focus-restore" onClick={() => setFocusMode(false)}>{FI.session.exitFocusMode}</button>}
		<div className="room-strip"><span><i className={`dot${connected ? "" : " dot--offline"}`} /> {connected ? state.open ? FI.session.openTable : FI.session.privateTable : FI.session.reconnecting}</span><button onClick={copyLink} className="text-button">{copied ? FI.session.linkCopied : FI.session.copyInvite}</button></div>
		{error && <div role="alert" className="error error--banner">{error}<button aria-label={FI.common.close} onClick={() => setError("")}>✕</button></div>}
		{!connected && <div className="error error--banner">{FI.session.connectionLost}</div>}
		{state.vote && <div className="vote"><strong>{FI.session.requestSeat(state.members.find(m => m.id === state.vote!.requesterId)?.name ?? "")}</strong><span>{FI.session.approvals(state.vote.approvals.length, Math.floor(state.vote.voters.length / 2) + 1)}</span>{state.vote.voters.includes(state.me) && <><button className="button" disabled={busy} onClick={() => command({ kind: "vote", approve: true })}>{FI.session.approve}</button><button className="button button--quiet" disabled={busy} onClick={() => command({ kind: "vote", approve: false })}>{FI.session.reject}</button></>}</div>}
		{state.waitingSeatId && <div className="vote"><strong>{FI.session.replacementNeeded}</strong><span>{FI.session.waitingReplacement}</span>{host && <button className="button" onClick={function () { if (confirm(FI.session.confirmEnd)) { void command({ kind: "end" }); } }}>{FI.session.endGame}</button>}</div>}
		{!game ? <main className="lobby"><section><p className="eyebrow">{FI.lobby.eyebrow}</p><h1>{FI.lobby.heading}</h1><p className="lede">{FI.lobby.lede}</p><div className="lobby__players">{state.members.filter(m => m.seated).map(m => <div className={`lobby-player${m.ready ? " lobby-player--ready" : ""}`} key={m.id}><Avatar name={m.name} /><span><strong>{m.name}{m.id === state.me ? FI.lobby.self : ""}{m.computer ? ` (${FI.lobby.computer})` : ""}</strong><small>{m.computer ? (m.ready ? FI.lobby.readyState : FI.lobby.notReadyState) : (!m.online ? FI.lobby.offline : m.ready ? FI.lobby.readyState : FI.lobby.notReadyState)}</small></span><span>{m.ready ? "✓" : "…"}</span>{host && m.computer && <button type="button" className="lobby-player__remove" aria-label={FI.lobby.removeComputer(m.name)} disabled={busy || !connected} onClick={function () { if (confirm(FI.lobby.removeComputerConfirm(m.name))) { void command({ kind: "remove", seatId: m.id }); } }}>✕</button>}</div>)}</div>
			<div className="lobby__actions">
				{me.seated ? <button className="button button--primary button--large" disabled={busy || !connected} onClick={() => command({ kind: "ready", ready: !me.ready })}>{me.ready ? FI.lobby.readyButton : FI.lobby.notReadyButton}</button> : <button className="button button--primary" disabled={state.members.filter(m => m.seated).length >= 6 || busy} onClick={() => command({ kind: "sit" })}>{FI.lobby.sit}</button>}
				{me.seated && <button className="button button--quiet button--compact" onClick={() => command({ kind: "stand" })}>{FI.lobby.stand}</button>}
				{host && <button className="button button--quiet button--compact" disabled={state.members.filter(m => m.seated).length >= 6 || busy || !connected} onClick={() => void command({ kind: "add-computer" })}>{FI.lobby.addComputer}</button>}
			</div>
			{!game && <button className="text-button text-button--danger" disabled={busy || !connected} onClick={function () { if (confirm(FI.lobby.leaveConfirm)) { void command({ kind: "leave-table" }); } }}>{FI.lobby.leaveTable}</button>}
			{state.countdownAt !== null && <div className="countdown" role="status"><strong>{Math.max(1, Math.ceil((state.countdownAt - time) / 1000))}</strong><span>{FI.lobby.countdown}</span></div>}
			<div className="lobby__spectators"><h2>{FI.lobby.spectatorsHeading}</h2>{state.members.filter(m => !m.seated).length ? <div className="lobby__players">{state.members.filter(m => !m.seated).map(m => <div className="lobby-player" key={m.id}><Avatar name={m.name} /><span><strong>{m.name}{m.id === state.me ? FI.lobby.self : ""}</strong><small>{!m.online ? FI.lobby.offline : FI.lobby.readyState}</small></span></div>)}</div> : <p>{FI.lobby.spectatorsEmpty}</p>}</div>
		</section><aside className="lobby__aside"><div className="mini-card"><CreatureArt creature="lude" /><p>{FI.lobby.quote}</p></div><h3>{FI.common.settings}</h3>{host && <label className="check"><input type="checkbox" checked={state.open} disabled={busy || !connected} onChange={event => void command({ kind: "set-open", open: event.target.checked })} /> {FI.lobby.openRoom}</label>}<label className="check"><input type="checkbox" checked={guided} onChange={e => setGuided(e.target.checked)} /> {FI.lobby.guide}</label><label className="check"><input type="checkbox" checked={reduced} onChange={e => setReduced(e.target.checked)} /> {FI.common.reducedMotion}</label><p className="fineprint">{host ? FI.lobby.openRoomNote : FI.lobby.preferencesNote}</p><p className="fineprint">{FI.lobby.spectators(state.members.filter(m => !m.seated).length)}</p></aside></main> : <Table key={game.id} state={state} command={command} busy={busy || !connected || Boolean(state.waitingSeatId)} muted={muted} reduced={reduced} guided={guided} time={time} />}
		<footer className="app__footer"><span aria-live="polite">{state.notice}</span>{host && !state.game && !state.closed && <button className="button button--danger" disabled={busy || !connected} onClick={function () { if (confirm(FI.lobby.closeConfirm)) { void command({ kind: "close-lobby" }); } }}>{FI.lobby.closeLobby}</button>}<span>{FI.footer}</span></footer>
		{rules && <Modal close={() => setRules(false)}><Rules /><label className="check"><input type="checkbox" checked={reduced} onChange={e => setReduced(e.target.checked)} /> {FI.common.reducedMotion}</label></Modal>}
		{history && <Modal close={() => setHistory(false)}><History items={state.history} /></Modal>}
	</div>;
}
function Table({ state, command, busy, muted, reduced, guided, time }: { state: RoomView; command: (action: RoomAction) => Promise<void>; busy: boolean; muted: boolean; reduced: boolean; guided: boolean; time: number }): ReactElement {
	const game = state.game!;
	const me = game.seats.find(s => s.personId === state.me && !s.removed);
	const claim = game.challenge?.claims.at(-1);
	const claimSender = game.seats.find(seat => seat.id === claim?.senderId)?.name ?? "";
	const claimReceiver = game.seats.find(seat => seat.id === claim?.receiverId)?.name ?? "";
	const required = game.phase === "initiation" ? game.activeSeatId : claim?.receiverId;
	const [hint, setHint] = useState(guided);
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
	}, [game.activeSeatId, game.challenge?.card, game.challenge?.claims.length, game.challenge?.id, game.phase, me?.id, reduced]);
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
		if (!muted && (resolution.penaltyPersonId === state.me || resolution.claims.at(-1)?.senderPersonId === state.me || resolution.receiverPersonId === state.me)) {
			const isLoss = resolution.penaltyPersonId === state.me;
			const variants = isLoss ? LOSS_VARIANTS : WIN_VARIANTS;
			const variant = selectNextAudio(variants, isLoss ? 0 : challengeSoundIndex.current);
			challengeSoundIndex.current += 1;
			playVariant(variant);
		}
		const resultTimer = setTimeout(() => setResult(false), reduced ? 120 : 2200);
		const flashStartTimer = setTimeout(() => setAnswerFlash(!reduced), reduced ? 100 : 2100);
		const flashEndTimer = setTimeout(() => setAnswerFlash(false), reduced ? 120 : 7800);
		return function () { clearTimeout(resultTimer); clearTimeout(flashStartTimer); clearTimeout(flashEndTimer); };
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
	const routeSeatIds = new Set(game.challenge?.claims.flatMap(item => [item.senderId, item.receiverId]) ?? []);
	const ownSeatIndex = me ? game.seats.findIndex(seat => seat.id === me.id) : -1;
	const orderedSeats = ownSeatIndex >= 0 ? [...game.seats.slice(ownSeatIndex + 1), ...game.seats.slice(0, ownSeatIndex), game.seats[ownSeatIndex]!] : game.seats;
	return <main ref={tableRef} className={`table${choosingTarget ? " table--choosing-target" : ""}${choosingResponse ? " table--choosing-response" : ""}`}><div className="table__heading"><div><p className="eyebrow">{FI.table.eyebrow}</p><h1>{game.phase === "ended" ? FI.table.endedHeading : FI.table.activeHeading}</h1></div><span className="table__limit">{FI.table.threshold(game.threshold)}</span></div>
		{routePaths.length > 0 && <svg className="table-routes" aria-hidden="true"><defs><marker id="route-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="context-stroke" /></marker></defs>{routePaths.map(function (route, index) { const current = index === routePaths.length - 1; return <g key={index} className={`table-routes__segment table-routes__segment--${index % 4}${current ? " table-routes__segment--current" : ""}`}><path className="table-routes__path" d={route.d} markerEnd="url(#route-arrow)" /><circle cx={route.labelX} cy={route.labelY} r="10" /><text x={route.labelX} y={route.labelY + 3}>{index + 1}</text></g>; })}</svg>}
		<div className={`seats${game.phase !== "ended" ? ` seats--around seats--${orderedSeats.length}` : ""}`}>{orderedSeats.map(function (seat) {
			const member = state.members.find(m => m.id === seat.personId);
			const afk = required === seat.id && state.promptAt !== null && time - state.promptAt > 60000;
			const targetable = targetIds.has(seat.id);
			return <article key={seat.id} data-seat-id={seat.id} className={`seat${required === seat.id && game.phase !== "ended" ? " seat--active" : ""}${!member?.online || seat.removed ? " seat--offline" : ""}${selectedTarget === seat.id ? " seat--selected" : ""}${targetable ? " seat--targetable" : ""}${routeSeatIds.has(seat.id) ? " seat--on-route" : ""}${claim?.senderId === seat.id ? " seat--claim-sender" : ""}${claim?.receiverId === seat.id ? " seat--claim-receiver" : ""}${handoff?.from === seat.id ? " seat--sending" : ""}${handoff?.to === seat.id ? " seat--receiving" : ""}${nextTurnSeat === seat.id ? " seat--next-turn" : ""}${result && resolution?.penaltySeatId === seat.id ? " seat--penalty" : ""}`}>
				<button type="button" className="seat__target" disabled={!targetable || busy} aria-label={targetable ? FI.actions.choosePlayer(seat.name) : undefined} aria-pressed={selectedTarget === seat.id} onClick={() => setSelectedTarget(seat.id)}>
					<div className="seat__identity"><Avatar name={seat.name} /><span><strong>{seat.name}{seat.personId === state.me ? FI.table.self : ""}</strong><small>{seat.removed ? FI.table.removed : !member?.online ? FI.session.connectionLost : required === seat.id && game.phase !== "ended" ? FI.table.thinking : FI.table.handCount(seat.handCount)}</small></span><span className="seat__count" aria-label={FI.table.handCount(seat.handCount)}>{seat.handCount}</span></div>
					<div className="seat__display">{CREATURES.map(function (creature) { const count = seat.display.filter(c => c.creature === creature).length; return count ? <span title={LABELS[creature]} className={`penalty${count >= game.threshold - 1 ? " penalty--danger" : ""}`} key={creature}><CreatureArt creature={creature} small /><b>{count}</b></span> : null; })}{!seat.display.length && <span className="seat__clean">{FI.table.cleanTable}</span>}</div>
				</button>
				{!seat.removed && game.phase !== "ended" && <div className="seat__controls">{state.hostId === state.me && !member?.online && <button className="text-button" onClick={function () { if (confirm(FI.table.confirmRemove)) { void command({ kind: "remove", seatId: seat.id }); } }}>{FI.table.removeAndDeal}</button>}{!me && (!member?.online || afk) && <button className="text-button" onClick={() => command({ kind: "request-seat", seatId: seat.id })}>{FI.table.requestSeat}</button>}</div>}
			</article>;
		})}</div>
		{game.phase === "ended" ? <section className="end-panel"><p className="eyebrow">{game.loserSeatId ? FI.table.loser : FI.table.cancelled}</p><h2>{game.seats.find(s => s.id === game.loserSeatId)?.name ?? FI.table.noLoser}</h2><p>{game.endReason === "matching" ? FI.table.matchingLoss(game.threshold) : game.endReason === "empty" ? FI.table.emptyHandLoss : FI.session.gameEnded}</p>{state.hostId === state.me && <div className="end-panel__actions"><button className="button button--primary" onClick={() => command({ kind: "rematch" })}>{FI.table.rematch}</button><button className="button button--danger" onClick={function () { if (confirm(FI.table.endPlayingConfirm)) { void command({ kind: "close-lobby" }); } }}>{FI.table.endPlaying}</button></div>}<History items={state.history.filter(h => h.id === game.id)} /></section> : <>
			<section className={`play-area${answerFlash && personalOutcomePositive !== null ? personalOutcomePositive ? " play-area--answer-correct" : " play-area--answer-wrong" : ""}${handoff ? " play-area--handoff" : ""}${peeking ? " play-area--peeking" : ""}`}><div className="play-area__grain" />{handoff && <div className="handoff-card" aria-hidden="true"><span>✳</span></div>}{nextTurnSeat && <div className="turn-banner" role="status"><span>{FI.table.nextPlayer(game.seats.find(s => s.id === nextTurnSeat)?.name ?? "")}</span></div>}
				<p className="eyebrow">{game.challenge ? FI.table.claimOnTable : FI.table.nextMove}</p>
				{game.challenge ? <><div className="claim-presentation"><div className={`playing-card${game.challenge.card ? " playing-card--known" : ""}`}>{game.challenge.card ? <CreatureArt creature={game.challenge.card.creature} /> : <><span>✳</span><small>{FI.table.cardBack}</small></>}</div><span className="claim-presentation__arrow" aria-hidden="true">→</span><div className="claimed-card" aria-label={FI.table.claim(claimSender, LABELS[claim!.creature].toLocaleLowerCase("fi"))}><small>{FI.table.claimCard}</small><CreatureArt creature={claim!.creature} small /><strong>{LABELS[claim!.creature]}</strong></div></div><h2>{FI.table.claim(claimSender, LABELS[claim!.creature].toLocaleLowerCase("fi"))}</h2><p><strong>{claimReceiver}n</strong> {FI.table.claimRecipient}</p></> : <><div className="table-mark">✳</div><h2>{FI.table.startTurn(game.seats.find(s => s.id === game.activeSeatId)?.name ?? "")}</h2><p>{FI.table.startPrompt}</p></>}
				{result && resolution && <div className="resolution" role="status"><div className={`decision-token${resolution.receiverBelieves ? " decision-token--believe" : " decision-token--disbelieve"}`}><span>{resolution.receiverBelieves ? "✓" : "✕"}</span>{resolution.receiverBelieves ? FI.table.believe : FI.table.disbelieve}</div><div className="showdown"><div className="showdown__card showdown__card--claim"><small>VÄITE</small><CreatureArt creature={resolution.claims.at(-1)!.creature} /><strong>{LABELS[resolution.claims.at(-1)!.creature]}</strong></div><div className="showdown__card showdown__card--truth"><small>KORTTI</small><CreatureArt creature={resolution.card.creature} /><strong>{LABELS[resolution.card.creature]}</strong></div><span className={`showdown__stamp${resolution.claims.at(-1)!.creature === resolution.card.creature ? " showdown__stamp--true" : " showdown__stamp--false"}`}>{resolution.claims.at(-1)!.creature === resolution.card.creature ? "TOTTA" : "VALHE"}</span></div><p>{resolution.cancelled ? FI.table.cancelledRound : FI.table.takesCard(game.seats.find(s => s.id === resolution.penaltySeatId)?.name ?? "")}</p><span>{emoji} {outcome.length ? FI.round.correctAudienceGuesses(outcome.filter(Boolean).length, outcome.length) : ""}</span>{game.phase === "initiation" && <strong className="resolution__next">{FI.table.nextPlayer(game.seats.find(s => s.id === game.activeSeatId)?.name ?? "")}</strong>}</div>}
			</section>
			{hint && me?.id === required && <div className="hint"><span>{game.phase === "initiation" ? FI.table.startHint : FI.table.responseHint}</span><button className="text-button" onClick={() => setHint(false)}>{FI.table.dismissHint}</button></div>}
			<Actions key={`${game.phase}:${game.challenge?.id ?? ""}:${game.challenge?.claims.length ?? 0}:${game.activeSeatId}`} game={game} meId={me?.id ?? null} command={command} busy={busy || result} muted={muted} card={selectedCard} target={selectedTarget} setCard={function (creature) { setSelectedCard(creature); setSelectedTarget(""); }} setTarget={setSelectedTarget} />
			{game.challenge?.canPredict && <div className="predictions"><span>{FI.table.secretPrediction} <small>{FI.table.predictionReveal}</small></span><button className={`button${game.challenge.prediction === true ? " button--selected" : ""}`} disabled={busy} onClick={() => command({ kind: "game", action: { type: "predict", challengeId: game.challenge!.id, claimIndex: game.challenge!.claims.length - 1, believes: true } })}>{FI.table.believe}</button><button className={`button${game.challenge.prediction === false ? " button--selected" : ""}`} disabled={busy} onClick={() => command({ kind: "game", action: { type: "predict", challengeId: game.challenge!.id, claimIndex: game.challenge!.claims.length - 1, believes: false } })}>{FI.table.disbelieve}</button></div>}
		</>}
		{game.lastResolution && game.phase !== "ended" && <details className="last-round"><summary>{FI.table.previousRound}</summary><RoundDetails resolution={game.lastResolution} names={Object.fromEntries(game.scores.map(s => [s.personId, s.name]))} /></details>}
		{game.retired.length > 0 && <details className="retired"><summary>{FI.table.retiredCards(game.retired.length)}</summary><div className="retired__cards">{game.retired.map(c => <span key={c.id}><CreatureArt creature={c.creature} small />{LABELS[c.creature]}</span>)}</div></details>}
	</main>;
}
function Actions({ game, meId, command, busy, muted, card, target, setCard, setTarget }: { game: GameView; meId: string | null; command: (action: RoomAction) => Promise<void>; busy: boolean; muted: boolean; card: Creature | null; target: string; setCard: (creature: Creature) => void; setTarget: (target: string) => void }): ReactElement {
	const [claim, setClaim] = useState<Creature | "">("");
	const cardSoundIndex = useRef(0);
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
		if (!muted) {
			const variant = selectNextAudio(CARD_FLIP_VARIANTS, cardSoundIndex.current);
			cardSoundIndex.current += 1;
			void playNormalizedAudio(variant, 0.7).catch(function () { return; });
		}
		void command({ kind: "game", action: passing ? { type: "pass", targetId: target, creature: selectedClaim } : { type: "send", cardId: game.hand.find(item => item.creature === card)!.id, targetId: target, creature: selectedClaim } });
		setTarget("");
	}
	function selectClaim(creature: Creature): void {
		if (claim === creature) { submitClaim(creature); }
		else { setClaim(creature); }
	}
	return <section className={`hand-area${awaitingCard ? " hand-area--choosing-card" : ""}`}>
		{mine && game.phase === "response" && <div className="responses"><button className="button button--primary" disabled={busy} onClick={() => command({ kind: "game", action: { type: "answer", believes: true } })}><ResponseIcon kind="believe" />{FI.table.believe}</button><button className="button button--danger" disabled={busy} onClick={() => command({ kind: "game", action: { type: "answer", believes: false } })}><ResponseIcon kind="disbelieve" />{FI.table.disbelieve}</button><button className="button" disabled={busy || !game.challenge?.eligibleTargets.length} onClick={() => command({ kind: "game", action: { type: "peek" } })}><ResponseIcon kind="forward" />{FI.actions.watchAndPass}</button>{!game.challenge?.eligibleTargets.length && <small>{FI.actions.lastPlayer}</small>}</div>}
		<div className="hand-area__heading"><span className="eyebrow">{meId ? FI.actions.ownHand : FI.actions.spectatorHand}</span>{meId && <span>{FI.actions.cardCount(game.hand.length)}</span>}</div>
		{meId && <div className="hand">{CREATURES.map(function (creature) {
			const count = game.hand.filter(c => c.creature === creature).length;
			return count ? <button key={creature} className={`hand-card${card === creature ? " hand-card--selected" : ""}`} disabled={!preparing || passing || busy} onClick={() => setCard(creature)} aria-pressed={card === creature}><span className="hand-card__count">×{count}</span><CreatureArt creature={creature} /><strong>{LABELS[creature]}</strong></button> : null;
		})}{!game.hand.length && <p>{FI.actions.emptyHand}</p>}</div>}
		{preparing && <div className="compose"><div className="compose__step"><span>{awaitingCard ? FI.actions.cardStep : passing ? FI.actions.targetLabelPassing : FI.actions.targetLabel}</span><strong>{awaitingCard ? FI.actions.cardPrompt : target ? game.seats.find(s => s.id === target)?.name : FI.actions.clickTarget}</strong></div>{target && <fieldset className="claim-picker claim-picker--overlay"><legend>{FI.actions.claimLabel}</legend><p>{FI.actions.claimTo(game.seats.find(s => s.id === target)?.name ?? "")}</p><div className="claim-picker__choices">{CREATURES.map(function (creature) { const truthful = creature === truthfulCreature; const selected = claim === creature; return <button type="button" key={creature} className={`claim-card${selected ? " claim-card--selected" : ""}${truthful ? " claim-card--truth" : ""}`} aria-pressed={selected} onClick={() => selectClaim(creature)} disabled={busy}><CreatureArt creature={creature} small /><span>{LABELS[creature]}</span>{truthful && <small>{FI.actions.trueChoice}</small>}{selected && <small className="claim-card__confirm">{FI.actions.clickAgain}</small>}</button>; })}</div><div className="claim-picker__actions"><button type="button" className="button button--quiet" onClick={() => setTarget("")}>{FI.actions.changeTarget}</button><button className="button button--primary" disabled={busy || !claim || (!passing && !card)} onClick={function () { if (claim) { submitClaim(claim); } }}>{claimAction}</button></div></fieldset>}</div>}
		{!mine && <p className="hand-area__waiting">{meId ? FI.actions.waitingPlayer : FI.actions.waitingSpectator}</p>}
	</section>;
}
function RoundDetails({ resolution, names }: { resolution: Resolution; names: Record<string, string> }): ReactElement {
	return <div className="round-details"><p>Kortti oli <strong>{LABELS[resolution.card.creature]}</strong>. {resolution.cancelled ? FI.round.cancelled : FI.table.takesCard(names[resolution.penaltyPersonId] ?? FI.history.defaultPlayer)}</p>{resolution.claims.map((claim, index) => <div key={index}><strong>{names[claim.senderPersonId]}: {LABELS[claim.creature]}</strong><span> {claim.creature === resolution.card.creature ? FI.round.trueClaim : FI.round.falseClaim}</span>{!resolution.cancelled && <div className="round-details__predictions">{claim.predictions.map(p => <span key={p.personId}>{p.believes === (claim.creature === resolution.card.creature) ? "✓" : "✕"} {names[p.personId]}: {p.believes ? FI.table.believe : FI.table.disbelieve}</span>)}{!claim.predictions.length && <small>{FI.round.noPredictions}</small>}</div>}</div>)}</div>;
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
	useEffect(function () { setShownRounds(10); }, [item?.id]);
	const rounds = item ? item.resolutions.map((resolution, index) => ({ resolution, number: index + 1 })).reverse() : [];
	return <section className="history"><h2>{FI.history.title}</h2>{!item ? <p>{FI.history.empty}</p> : <><label className="history__select">{FI.history.select}<select value={item.id} onChange={e => setSelected(e.target.value)}>{[...items].reverse().map((r, i) => <option key={r.id} value={r.id}>{FI.history.game(items.length - i, new Date(r.startedAt).toLocaleString("fi-FI"), r.loserName ?? FI.history.cancelled)}</option>)}</select></label><p><strong>{item.loserName ? FI.history.loser(item.loserName) : FI.history.endedNoLoser}</strong> {FI.history.resolvedCards(item.resolutions.filter(r => !r.cancelled).length)}</p><div className="scores"><table><thead><tr><th>{FI.history.player}</th><th>{FI.history.guesses}</th><th>{FI.history.bluffCalls}</th><th>{FI.history.ownBluffs}</th></tr></thead><tbody>{[...item.scores].map(function (score) { const stats = recapPlayerStats(item, score); return <tr key={score.personId}><td>{score.name}</td><td><strong>{stats.answersCorrect}/{stats.answersSubmitted}</strong><small>{stats.answersSubmitted ? `${Math.round(stats.answersCorrect / stats.answersSubmitted * 100)} %` : "—"}</small></td><td><strong>{stats.bluffCallsCorrect} / {stats.bluffCallsWrong}</strong><small>{FI.history.rightWrong}</small></td><td><strong>{stats.bluffsPassed} / {stats.bluffsCaught}</strong><small>{FI.history.passedCaught}</small></td></tr>; })}</tbody></table></div><div className="awards">{item.awards.map(function (a) { const award = FI.history.awards[a.key as keyof typeof FI.history.awards] as AchievementText; return <article key={a.key}><span className="eyebrow">{a.personIds.map(id => item.scores.find(s => s.personId === id)?.name ?? FI.history.defaultPlayer).join(" & ")}</span><h3>{award.title}</h3><p>{award.copy}</p><footer>{achievementReason(a.key, item, a.personIds)}</footer></article>; })}</div><section className="history__rounds"><h3>{FI.history.roundByRound}</h3>{rounds.slice(0, shownRounds).map(function ({ resolution: round, number }) { return <details key={round.id}><summary>{number}. {LABELS[round.card.creature]} · {round.cancelled ? FI.history.cancelled : FI.history.gotCard(item.scores.find(s => s.personId === round.penaltyPersonId)?.name ?? FI.history.defaultPlayer)}</summary><RoundDetails resolution={round} names={Object.fromEntries(item.scores.map(s => [s.personId, s.name]))} /></details>; })}{shownRounds < rounds.length && <button className="button button--quiet history__more" onClick={() => setShownRounds(count => Math.min(count + 10, rounds.length))}>{FI.history.showMore(rounds.length - shownRounds)}</button>}</section></>}</section>;
}

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
