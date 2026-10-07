Here is the agreed base-game rule set for **Torakkapokeri** (*Cockroach Poker* / *Kakerlakenpoker* by Jacques Zeimet) structured for digital state tracking, game-logic implementation, and UI modeling.

---

# Game Mechanics & Architecture Blueprint

## 1. Game Components & Deck Setup

* **Deck Composition:** 64 total cards.
* **Card Types (8 Suits / Critters):**
1. Orc (Örkki)
2. Bat (Lepakko)
3. Fly (Kärpänen)
4. Toad/Frog (Sammakko)
5. Rat (Rotta)
6. Scorpion (Skorpiooni)
7. Spider (Hämähäkki)
8. Stink Bug (Lude)


* **Quantity:** Exactly **8 cards per suit** (8 × 8 = 64).

### Player Scaling Setup

* **Player Count:** 2 to 6 players.
* **Dealing Rules:**
* **3–6 Players:** Shuffle and deal all 64 cards. Hand sizes may differ by one; no leftover cards are removed.
* *3 Players:* Hands of 22, 21, and 21 cards.
* *4 Players:* 16 cards each.
* *5 Players:* Four hands of 13 cards and one of 12.
* *6 Players:* Four hands of 11 cards and two of 10.


* **2 Players (Variant):**
1. Remove ten cards from the shuffled deck unseen.
2. Deal the remaining 54 cards: 27 per player.
3. There is no penalty deck or extra penalty draw. Passing is unavailable.
4. The matching-card defeat threshold is five, rather than four.

Choose the first player randomly for every new game.





---

## 2. Core Game Loop & Turn Flow

The game is played over a series of **Challenges**.

### Step 1: Initiating a Challenge

1. The **Active Player** selects one hand card, a target **Receiving Player**, and a claimed creature, in that order.
2. These selections remain private and editable until they press Send.
3. Send commits the card face-down and publishes the claim to everyone.
* **Rule:** The stated suit **must** be one of the 8 legal suits in the game.
* **Rule:** The claim can be true or false.



### Step 2: The Receiver’s Choice

The Receiving Player must choose one of two actions:

#### Option A: Call (Challenge the Claim)

The Receiver declares whether the claim is **True** or **False**.

* **Resolve Outcome:** Reveal the face-down card to all players.
* **Correct Call:** If the Receiver called correctly (e.g., said "False" and it wasn't a Spider, or "True" and it was), the **most recent sender/claimant** loses the challenge (not necessarily the original card owner).
* **Incorrect Call:** If the Receiver called incorrectly (e.g., said "True" but it was a Bat), the **Receiver** loses the challenge.


* **Consequence:**
1. The loser takes the revealed card and places it **face-up on the table in front of them** (their Display Area / Penalty Board).
2. The loser becomes the **Active Player** for the next turn.



#### Option B: Pass (Re-route the Challenge)

1. The Receiver commits to passing and secretly looks at the face-down card. After peeking, they cannot return to believing or challenging the claim.
2. They slide it face-down to *another* player who has **not yet received or looked at this card** during the current round.
3. They make a new claim or repeat the previous claim (e.g., *"No, it's actually a Rat"* or *"It really is a Spider"*).
4. The new target now faces the exact same decision (Call or Pass).

> **Pass Limits & Forced Call:** A card can only be passed to players who have **not yet seen it**. Once the card reaches the last available player (the only player left who hasn't looked at it), that player **cannot Pass**—they **must** choose Option A (Call True or False).

---

## 3. Game-Ending & Defeat Conditions

Cockroach Poker has **exactly ONE loser**; all other players share the victory. The game immediately terminates when any player triggers a loss condition.

### Loss Condition 1: Matching Exposed Cards

A player **immediately loses** when their display contains four cards of one creature in a 3–6-player game, or five in a two-player game.

### Loss Condition 2: Hand Depletion (Out of Cards)

A player **immediately loses** if it becomes their turn to start a challenge (they are the Active Player) and they have **0 cards left in their hand** to pass.

---

## 4. Special Rules & Edge Cases for Developers

1. **Simultaneous Display Tracking:** Hand cards are hidden state; table display cards are open state visible to all players.
2. **Passing Logic (Seen-Player Array):** Maintain an array/list of player IDs who have looked at the card in the current challenge chain. Reset this list once a card is placed face-up in front of someone.
3. **Private Knowledge:** The original card owner starts in the seen-player list. A receiver is added only when they peek; receiving alone never reveals the card.
4. **Passing Liability:** Keep the original owner and most recent sender as separate fields. A correct response penalizes the most recent sender.
5. **Public Information:** Everyone sees hand counts, exposed cards, and the current challenge’s path and claims.
6. **Two Players:** No passing or extra penalty draws; five matching exposed cards cause defeat.

---

## 5. UI & State Machine Blueprint

### Game State Data Structure (Partial Server-Side JSON Example)

This is an illustrative server-state fragment, not a complete game or a client payload. Never broadcast hidden card identities. States also need to cover peeking/passing and resolution.

```json
{
  "gameState": "PLAYER_DECISION",
  "activePlayerId": 2,
  "currentChallenge": {
    "originalOwnerId": 1,
    "senderId": 1,
    "receiverId": 2,
    "card": { "suit": "Bat", "id": "card_42" },
    "claimedSuit": "Spider",
    "seenByPlayerIds": [1],
    "path": [{ "senderId": 1, "receiverId": 2, "claimedSuit": "Spider" }]
  },
  "players": [
    {
      "id": 1,
      "handCount": 15,
      "display": { "Cockroach": 1, "Bat": 0, "Fly": 2, "Toad": 0, "Rat": 1, "Scorpion": 0, "Spider": 0, "StinkBug": 0 }
    },
    {
      "id": 2,
      "handCount": 16,
      "display": { "Cockroach": 0, "Bat": 3, "Fly": 0, "Toad": 0, "Rat": 0, "Scorpion": 1, "Spider": 0, "StinkBug": 0 }
    }
  ],
  "loserPlayerId": null
}

```

### Flow Diagram

```
[Start Turn]
     │
     ▼
Active Player has cards in hand?
  ├── NO  ──► [GAME OVER] (Active Player Loses - Out of Cards)
  └── YES ──► Select Card & Target Receiver & Claim Suit
                 │
                 ▼
          [Receiver's Turn]
           /             \
    (PASS)                (CALL TRUE/FALSE)
     /                     \
Look at Card &         Reveal Card
Select New Target            │
     │                 Was Call Correct?
     │                  /            \
     │               (YES)          (NO)
     │                /                \
     │       Last Sender Takes Card   Receiver Takes Card
     │                \                /
     │                 └───────┬──────┘
     │                         │
     │                         ▼
     │            Place Card Face-Up on Display
     │                         │
     │               Matching threshold met?
     │                 ├── YES ──► [GAME OVER] (Player Loses)
     │                 └── NO  ───► Loser becomes next Active Player
     │
     └──► Target in "seenByPlayerIds"? ──► Invalid Target

```

## 6. Agreed Digital Presentation

- Finnish interface and creature names; response buttons are **Uskon / En usko**. English is deferred.
- No turn timers or mandatory waiting period before responding.
- Resolve with a brief automatic reveal/transfer animation and outcome sound, then briefly show **Seuraavana: [player name]** before the next turn. At game over, show the result instead. Sounds reflect personal success/failure; uninvolved players hear a neutral sound.
- Reveal locked predictions after resolution, with automatic emojis based on overall prediction performance. No separate manual reaction buttons are currently planned.
- Spotlight the loser and present a recap with evidence-based highlights. Highlight definitions remain open; passing alone does not prove someone believed a claim.
- Rematch opens a fresh lobby with existing players, allowing new players to join. Save recap history across rematches and server restarts. Rooms are private by default, but a host may publish one in the landing page's open-room list; the server supports multiple independent rooms.
- A disconnected player’s chair is greyed out without globally pausing play. Exact-name joins can reclaim disconnected seats without approval; notify the table and revoke the old device’s control. Spectator-requested replacements use a vote, approved by a majority of remaining connected players. Seats are eligible when disconnected or when an action prompt has gone unanswered for over 60 seconds; this does not create automatic turn actions.
- Approved departure house rule: the host can confirm permanent removal and redistribute the shuffled hand evenly between resolved challenges, provided at least three players remain. Exposed cards remain visible but out of play; removed seats cannot be reclaimed that game. If the removed player is the current sender/receiver or has committed to passing, cancel the challenge and visibly retire its revealed card without penalty. When removal would leave fewer than three players, request a replacement and offer End game. While awaiting replacement, preserve the seat and its cards and obligations instead of completing removal. Replacement inherits this state; personal scores remain separate. Any newly selected initiator after removal is random but excludes the highest-risk players, ranked by largest exposed matching stack then smallest hand; ties and empty-hand filtering are detailed in the project plan.
- Optional private predictions are available to seated players who have not seen the card, excluding its receiver. Lock them on receiver action; a pass opens predictions on the next claim. Reveal after final resolution. Separate prediction scoring gives +1 for correct and 0 for wrong/skipped predictions; cancelled challenges score nothing. Show accuracy and participation. Adult-humor match achievement proposals are tracked separately.
- Private invite-link rooms support public-only spectators. All-ready automatically triggers an animated five-second countdown, cancelled by unready, disconnection, or a new player joining; spectators do not affect readiness. Rematches retain the invite link and reopen readiness in a fresh lobby.

Rules reference: [Publisher’s base-game rules](https://www.dreimagier.de/files/Onlinespiele/Produkte/40829%20-%20Kakerlakenpoker/40829_Kakerlakenpoker_DE_GB_FR_IT.pdf). Product decisions and work buckets: [project-plan.md](project-plan.md).

### Visual and Tutorial Decisions

Use a playful, darkish, slightly gross adult style, never childish or anime. Keep animation restrained with retro game sound/feel. Support portrait mobile and privately grouped creature stacks in the local hand; other players must never receive these group details. Provide mute, reduced motion, Finnish rules, and contextual help. A lobby checkbox enables a guided first turn, defaults on, and remembers the choice per device.

MVP layout verification uses desktop Chrome at desktop and mobile dimensions; separate iPhone testing is deferred. Future integrated media allows temporary microphone mute/camera-off but pauses gameplay when either occurs. Voice activation may be explored later. The external-call MVP does not enforce media-based pauses.
