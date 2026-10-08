import type { ReactElement } from "react";
import { LABELS, type Creature, type ThemeId } from "@torakka/game";
import { themeFor } from "./themes";

const COLORS: Readonly<Record<Creature, string>> = { torakka: "#789448", lepakko: "#b299d1", karpanen: "#a5bd87", sammakko: "#b6ce74", rotta: "#d2a7a2", skorpioni: "#ecab68", hamahakki: "#aeafa4", lude: "#b5bd66" };
export function CreatureArt({ creature, small = false, themeId = "orkkipokka" }: { creature: Creature; small?: boolean; themeId?: ThemeId }): ReactElement {
	const theme = themeFor(themeId);
	if (themeId === "herrasmiespokeri") {
		const source = theme.images[creature];
		return <span className={`creature creature--portrait${small ? " creature--small" : ""}`} role="img" aria-label={theme.labels[creature]}>{source ? <img src={source} alt="" /> : <span className="creature__placeholder"><b>HMP</b><small>HAHMO TULOSSA</small></span>}</span>;
	}
	const color = COLORS[creature];
	return <svg className={`creature${small ? " creature--small" : ""}`} viewBox="0 0 120 120" role="img" aria-label={LABELS[creature]}>
		<g stroke="#24251d" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
			{creature === "torakka" && <><path d="M31 48 18 31 41 38M89 48 102 31 79 38" fill={color} /><path d="M31 49Q36 18 60 20T89 49L83 88Q60 108 37 88Z" fill={color} /><path d="M36 62Q28 69 34 84M84 62Q92 69 86 84" fill="none" /><path d="M49 77 60 84 71 77 68 94 60 88 52 94Z" fill="#d9d2b8" /><path d="M39 54Q48 46 54 55M81 54Q72 46 66 55" fill="none" /><path d="m45 89-12 17m42-17 12 17" fill="none" strokeWidth="7" /></>}
			{creature === "lepakko" && <><path d="M49 52 12 27 18 77 34 64 48 86M71 52 108 27 102 77 86 64 72 86" fill={color} /><path d="M43 52 40 20 59 33 80 20 77 52" fill={color} /><ellipse cx="60" cy="69" rx="22" ry="30" fill={color} /><path d="m48 77 5 9 5-9m5 0 5 9 5-9" fill="#eee8cf" /></>}
			{creature === "karpanen" && <><ellipse cx="34" cy="49" rx="18" ry="30" transform="rotate(-35 34 49)" fill="#dad9c0" /><ellipse cx="86" cy="49" rx="18" ry="30" transform="rotate(35 86 49)" fill="#dad9c0" /><ellipse cx="60" cy="74" rx="23" ry="31" fill={color} /><path d="M41 72h38M42 84h36M45 96h30" /><circle cx="46" cy="42" r="16" fill="#bd6a51" /><circle cx="74" cy="42" r="16" fill="#bd6a51" /></>}
			{creature === "sammakko" && <><path d="M39 77 18 92 12 105 45 101M81 77 102 92 108 105 75 101" fill={color} /><ellipse cx="60" cy="72" rx="37" ry="29" fill={color} /><circle cx="39" cy="40" r="18" fill={color} /><circle cx="81" cy="40" r="18" fill={color} /><path d="M34 70q26 24 52 0" fill="none" /><circle cx="35" cy="80" r="2" fill="#526442" /><circle cx="83" cy="85" r="3" fill="#526442" /></>}
			{creature === "rotta" && <><path d="M75 84q40 36 34-9" fill="none" stroke={color} strokeWidth="8" /><circle cx="35" cy="30" r="19" fill={color} /><circle cx="83" cy="30" r="19" fill={color} /><path d="M29 40q31-20 62 0L76 80 60 98 44 80Z" fill={color} /><path d="M43 70 11 65M44 78 14 85M77 70 107 65M76 78 106 85" fill="none" /><path d="m52 84 8 10 8-10" fill="#68464d" /></>}
			{creature === "skorpioni" && <><path d="M72 78q38 6 24-36L81 30l9-15 16 18-10 9" fill="none" stroke={color} strokeWidth="12" /><ellipse cx="56" cy="70" rx="22" ry="29" fill={color} /><path d="m38 64-16-15m51 12 12-14M38 81 20 91M73 84 89 99" fill="none" /><path d="M23 48 12 28 25 35 29 19 36 39Z" fill={color} /><path d="m78 45-3-25 10 12 12-10-5 24Z" fill={color} /></>}
			{creature === "hamahakki" && <><path d="M40 48 21 26 12 45M36 60 12 55 9 76M39 73 20 83 17 105M46 82 35 102 38 114M80 48 99 26 108 45M84 60 108 55 111 76M81 73 100 83 103 105M74 82 85 102 82 114" fill="none" /><ellipse cx="60" cy="69" rx="28" ry="31" fill={color} /><circle cx="60" cy="40" r="20" fill={color} /></>}
			{creature === "lude" && <><path d="m44 40-20-12m52 12 20-12M35 64H15m70 0h20M42 85l-18 18m54-18 18 18" fill="none" /><path d="M60 20 88 44 84 79 60 104 36 79 32 44Z" fill={color} /><path d="m36 51 24 20 24-20M60 71v28" fill="none" /><path d="M100 20q-9-8 0-15M111 35q-9-8 0-15" fill="none" stroke="#a0aa69" /></>}
		</g>
		<g fill={creature === "torakka" ? "#d9b759" : "#f5eed9"}><ellipse cx={creature === "sammakko" ? 39 : 49} cy={creature === "sammakko" ? 40 : creature === "torakka" ? 55 : 44} rx="8" ry="9" /><ellipse cx={creature === "sammakko" ? 81 : 71} cy={creature === "sammakko" ? 40 : creature === "torakka" ? 55 : 44} rx="8" ry="9" /></g>
		<g fill="#24251d"><circle cx={creature === "sammakko" ? 42 : 52} cy={creature === "torakka" ? 56 : 45} r="3" /><circle cx={creature === "sammakko" ? 78 : 68} cy={creature === "torakka" ? 56 : 45} r="3" /></g>
	</svg>;
}
