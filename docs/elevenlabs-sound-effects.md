# ElevenLabs Sound Effects for Torakkapokeri

## Status

This document describes how to use ElevenLabs to create game-ready sound effects. It is based on the current public ElevenLabs overview and Sound Effects API documentation.

The local API key was successfully authenticated against the `GET /v1/voices` endpoint with HTTP 200 and 21 available voices. No paid sound-generation request was run during documentation verification.

## Recommended Approach

Use ElevenLabs for short, non-voice sound assets such as:

- Card reveal and card flip
- Claim placed on the table
- Challenge resolution
- Pass and peek
- Penalty card transfer
- Match victory and defeat
- Lobby countdown and ready confirmation
- Generic UI interaction feedback

Keep the game’s original sound design small and distinctive. Generate a few polished variants, then select the one that best matches the retro, playful, somewhat gross tone.

## API Capability

The Sound Effects endpoint is:

```http
POST https://api.elevenlabs.io/v1/sound-generation
```

The request requires an HTTP JSON body with a `text` description. The current Sound Effects model is `eleven_text_to_sound_v2`.

Supported optional fields include:

- `duration_seconds`: 0.5–30 seconds
- `loop`: true for seamless looping
- `prompt_influence`: 0–1, default 0.3
- `model_id`: currently `eleven_text_to_sound_v2`

The API returns a generated audio file. The documented output formats include MP3 and PCM/WAV-compatible options.

## Secure Local Configuration

The API key must remain outside the repository and never be committed. The project already excludes `.secrets/` from Git.

Suggested local layout:

```text
secrets/
└── elevenlabs
```

The key file should contain only the raw key, without extra whitespace or explanatory text. It may be loaded by trusted local scripts, not by browser code.

Never:

- Put the key in source files, environment files, screenshots, logs, or test fixtures.
- Send the key to client browsers.
- Expose the key through a public API endpoint.
- Commit generated audio or local secret files.
- Use the platform’s global API key in a third-party integration without reviewing its permissions.

## Local CLI Test

The following command verifies that the configured key is recognized by ElevenLabs without generating audio:

```sh
API_KEY=$(tr -d '\r\n' < secrets/elevenlabs)
curl -sS \
  -H "xi-api-key: $API_KEY" \
  https://api.elevenlabs.io/v1/voices
```

A successful response has HTTP 200. The response should be treated as authenticated access only; it does not prove that the account has credits for sound generation.

The key must also have the required sound-generation permission. If the key is restricted, the sound-generation request may return an authorization error even though voice-list access succeeds.

## Example Sound-Generation Request

### curl

```sh
API_KEY=$(tr -d '\r\n' < secrets/elevenlabs)
curl -sS \
  -H "xi-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -o data/audio/card-flip.mp3 \
  --data '{
    "text": "A small, crisp card flip with a light paper texture, a subtle snap, and a dry, satisfying finish.",
    "duration_seconds": 1.2,
    "prompt_influence": 0.55,
    "model_id": "eleven_text_to_sound_v2"
  }' \
  "https://api.elevenlabs.io/v1/sound-generation"
```

The MP3 response should be reviewed before publishing it. The documented Sound Effects endpoint permits files up to 30 seconds long, but these short game assets should normally be under 2 seconds.

### TypeScript example

```typescript
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const client = new ElevenLabsClient({
	apiKey: process.env.ELEVENLABS_API_KEY,
});

const response = await client.textToSoundEffects.convert({
	text: "A small, crisp card flip with a light paper texture, a subtle snap, and a dry, satisfying finish.",
	durationSeconds: 1.2,
	promptInfluence: 0.55,
	modelId: "eleven_text_to_sound_v2",
});

await Bun.write("data/audio/card-flip.mp3", response);
```

The exact SDK method names and response type may differ by installed SDK version. Confirm the installed package API before adding this code to the project.

## Suggested Prompts

Use short, concrete, sensory descriptions. Separate the material, action, and sonic result when useful.

### Card flip

```text
A small, crisp card flip with a light paper texture, subtle snap, and dry, satisfying finish. Clean mono effect, no voice, 1.2 seconds.
```

### Claim introduced

```text
A short, light tabletop tap as a card is placed face-down. Slight paper movement, low impact, warm and dry, no resonance. 0.6 seconds.
```

### Challenge resolution

```text
A quick, decisive reveal with a tiny paper crack and a short metallic click. Modern retro game sound, neutral and clear, 0.8 seconds.
```

### Penalty card transfer

```text
A small, heavy card sliding onto a stack with a soft thud and slight paper friction. Dry, low-frequency impact, 1 second.
```

### Pass or peek

```text
A faint, soft card movement followed by a tiny click. Brief, discreet, and slightly playful, 0.5 seconds.
```

### Defeat

```text
A deep, unpleasant drop with a short hollow echo and low-frequency wobble. Not cartoonish, not violent, 1.5 seconds.
```

### Victory

```text
A bright, clean success chord with a short triumphant rise and gentle decay. Subtle retro electronic texture, 1.8 seconds.
```

### Countdown

```text
A short, low click every second, then a deeper final confirmation tick. Clean and mechanical, no voice, 0.4 seconds each.
```

### UI interaction

```text
A polished digital click with a tiny metallic accent. Crisp, compact, and slightly retro, 0.15 seconds.
```

## Prompting Guidance

- Specify the *material* and *action* first.
- Keep the description short enough to avoid unrelated audio.
- Prefer concrete nouns such as paper, metal, wood, glass, plastic, or a dry tabletop.
- Add emotional tone only when it supports game feedback.
- Ask for a clean fade-out or short decay to avoid unnecessary tail noise.
- Use `duration_seconds` when the exact timing matters.
- Use `prompt_influence` near 0.5 for a balanced result.
- Generate several variations with only one changed phrase at a time.

For true one-shot effects, avoid a repeating loop. Use the `loop` option only for ambient or background textures.

## Naming and Asset Storage

Store generated audio under `apps/web/public/audio/` or another organized static-assets directory. Do not store secret keys or generated files under `secrets/`.

Suggested naming scheme:

```text
apps/web/public/audio/
├── card-flip-01.mp3
├── card-flip-02.mp3
├── challenge-resolve-01.mp3
├── penalty-transfer-01.mp3
├── game-win-01.mp3
└── game-loss-01.mp3
```

Keep the asset names descriptive and stable. Add a suffix such as `-01` or `-short` only when multiple variants exist. The source prompt and generation parameters should be recorded in a separate metadata file, not embedded in the audio filename.

## Recommended Asset Metadata

For each generated sound, record:

- File name
- Prompt
- Model ID
- Duration
- Output format
- Loop setting
- Prompt influence
- Generated date
- Credits consumed
- Creator and reviewer
- Approved for production use
- Source or inspiration

Example metadata:

```json
{
  "id": "card-flip-01",
  "prompt": "A small, crisp card flip with a light paper texture, subtle snap, and dry, satisfying finish.",
  "modelId": "eleven_text_to_sound_v2",
  "durationSeconds": 1.2,
  "outputFormat": "mp3_22050_32",
  "loop": false,
  "promptInfluence": 0.55,
  "generatedAt": "2026-10-06",
  "approved": false,
  "notes": "Use as the primary card-flip sound; test playback at low volume."
}
```

Keep the metadata file under `docs/` or `ops/` and never include the API key.

## Audio Quality Review

Each candidate should be checked for:

1. Meaningful start and end with no unexpected silence
2. Good playback at the intended browser volume
3. No clipping, harsh buildup, or hidden voice fragments
4. Consistent character across multiple plays
5. No audible repetition when the same sound is triggered rapidly
6. Appropriate content warnings for players using headphones
7. Acceptable performance on low-power devices and mobile browsers

A short sound should be reviewed at multiple browser and device volumes. If an effect is reused for frequent actions, prefer a shorter, lighter version.

When a sound is edited or mixed after generation, archive the original generated file and record the edit steps. Do not overwrite an accepted source asset without preserving the previous version.

## Credit and Budget Control

The ElevenLabs overview indicates that credits are a shared account resource. Sound-generation cost depends on the generated duration and the plan. Before adding a broad batch of requests:

- Confirm the account has available credits.
- Prefer a small number of test generations first.
- Reuse the best result rather than generating many near-identical variants.
- Avoid generation on every code change.
- Keep generated audio under the required duration to reduce cost.
- Archive approved assets so they can be reused without generating again.

The production application should not make direct API calls from the browser. A local authoring script or a server-only endpoint may call ElevenLabs, but the endpoint must validate the request and never expose the API key to clients.

## Recommended Implementation Order

1. Generate and approve three variants for card flip and challenge resolution.
2. Add one neutral success and one defeat effect.
3. Add a short UI-click sound and low-volume countdown ticks.
4. Integrate the asset URLs or local imports into the React UI.
5. Add mute, reduced-motion, and browser-volume handling.
6. Add an automated check that the production bundle contains the expected sound assets.
7. Add a server-side or local generation script only when automation is justified.

Do not implement an API-backed sound generator before the payment, account permissions, and asset-ownership policies are reviewed.

## Current Verification

The following checks are complete:

- ElevenLabs documentation reviewed for Sound Effects and API support.
- `GET /v1/voices` authenticated successfully with HTTP 200.
- The project’s `.secrets/` path is already ignored by Git.
- No sound effect was generated, because that would consume credits.

The next useful validation is a single low-cost, manually reviewed sound-generation request using the approved card-flip prompt.
