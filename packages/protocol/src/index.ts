import { z } from "zod";
import { CREATURES, type GameView, type Recap } from "@torakka/game";

const creature = z.enum(CREATURES);
const id = z.string().min(1).max(200);
export const nameSchema = z.string().trim().min(1, "Anna nimi.").max(24, "Nimi saa olla enintään 24 merkkiä.").transform(s => s.normalize("NFC"));
export const gameActionSchema = z.discriminatedUnion("type", [
	z.object({ type: z.literal("send"), cardId: id, targetId: id, creature }),
	z.object({ type: z.literal("answer"), believes: z.boolean() }),
	z.object({ type: z.literal("peek") }),
	z.object({ type: z.literal("pass"), targetId: id, creature }),
	z.object({ type: z.literal("predict"), challengeId: id, claimIndex: z.number().int().min(0).max(5), believes: z.boolean() })
]);
export const commandSchema = z.object({
	id, revision: z.number().int().nonnegative(), action: z.discriminatedUnion("kind", [
		z.object({ kind: z.literal("game"), action: gameActionSchema }),
		z.object({ kind: z.literal("ready"), ready: z.boolean() }),
		z.object({ kind: z.literal("sit") }),
		z.object({ kind: z.literal("stand") }),
		z.object({ kind: z.literal("leave-table") }),
		z.object({ kind: z.literal("add-computer") }),
		z.object({ kind: z.literal("rematch") }),
		z.object({ kind: z.literal("end") }),
		z.object({ kind: z.literal("close-lobby") }),
		z.object({ kind: z.literal("remove"), seatId: id }),
		z.object({ kind: z.literal("request-seat"), seatId: id }),
		z.object({ kind: z.literal("vote"), approve: z.boolean() })
	])
});
export type Command = z.infer<typeof commandSchema>;
export type RoomAction = Command["action"];
export interface MemberView { id: string; name: string; online: boolean; seated: boolean; ready: boolean; computer: boolean }
export interface VoteView { seatId: string; requesterId: string; voters: string[]; approvals: string[]; rejected: string[] }
export interface RoomView {
	id: string; revision: number; me: string; hostId: string; members: MemberView[]; countdownAt: number | null;
	game: GameView | null; vote: VoteView | null; waitingSeatId: string | null; promptAt: number | null;
	closed: boolean; notice: string; history: Recap[];
}
export type Reply = { ok: true; token?: string } | { ok: false; error: string };
export const joinSchema = z.object({ roomId: id, name: nameSchema, token: z.string().max(200).optional() });
