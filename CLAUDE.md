# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Shabd-Beta is the live web MVP of Shabd — a voice-first AI learning companion for children aged 4–8 in India. The AI character is **Kiki**, a cheerful cartoon girl who tells interactive Hinglish stories. Sessions are age-differentiated (5–10 turns / 3–5 minutes) and limited to 3 per child. Currently running a controlled beta.

## Commands

```bash
npm run dev      # Dev server on localhost:3000
npm run build    # Production build
npm run start    # Production server
npm run lint     # ESLint
```

## Environment

Copy `.env.local.example` to `.env.local`.

| Variable | Required | Purpose |
|---|---|---|
| `OPENROUTER_API_KEY` | Yes | Claude 3 Haiku via OpenRouter |
| `NEXT_PUBLIC_APP_URL` | Yes | Used in OpenRouter referer header + registration link generation |
| `FIREBASE_PROJECT_ID` | Yes (for logging) | Firebase Admin SDK |
| `FIREBASE_CLIENT_EMAIL` | Yes (for logging) | Firebase Admin SDK |
| `FIREBASE_PRIVATE_KEY` | Yes (for logging) | Firebase Admin SDK — wrap in quotes, `\n` preserved |
| `DEEPGRAM_API_KEY` | Yes (for iOS STT) | Deepgram Nova-3 speech-to-text — required for iOS users |
| `ELEVENLABS_API_KEY` | No | Built but not used — browser TTS is primary |
| `ELEVENLABS_VOICE_ID` | No | ElevenLabs voice ID |
| `FEEDBACK_WEBHOOK_URL` | No | Optional webhook relay for feedback |

Firebase credentials: Firebase Console → Project Settings → Service Accounts → Generate new private key.

## Architecture

**Stack**: Next.js 16 (App Router) + TypeScript (strict) + Tailwind CSS + React 18 + Firebase Admin SDK

### Pages (`app/`)
- `/` — Landing page: language selection (EN/HI), microphone permission
- `/play` — Main interaction loop. Accepts `?kid=UNIQUE_ID` for curated beta sessions.
- `/register` — Self-registration form for parents. Access-gated with code `KIKI2026`. Submits to `/api/register`, returns a play link.
- `/feedback` — Post-session feedback form (star rating, observations, child age, WhatsApp)
- `/done` — Shown when a kid has completed all 3 allowed sessions
- `/admin` — Admin panel for viewing sessions and kid data

### API Routes (`app/api/`) — all set to `runtime = 'nodejs'`
- `POST /api/chat` — Core AI route. Loads kid profile from Firestore if `kidId` provided, builds dynamic system prompt, calls Claude 3 Haiku via OpenRouter. **Post-processing pipeline**: strips `*action*` patterns → normalizes whitespace → enforces single `?` (truncates at first if multiple) → caps at 4 lines → fallback if empty.
- `POST /api/stt` — Deepgram Nova-3 STT. Accepts FormData with `audio` (Blob) + `language` (`hi`/`en`). Used as primary STT for iOS and fallback when Web Speech API is unavailable.
- `GET /api/kid?id=` — Loads kid profile from Firestore. Returns `404` if kid not found (triggers redirect to `/done`).
- `POST /api/register` — Creates a kid profile in Firestore, generates a unique `kidId` (`name_xxxxxx`), returns `{ kidId, link }`.
- `POST /api/session` — Saves full session transcript to Firestore. Increments `sessionCount` on kid document. Saves session memory for next session's prompt.
- `POST /api/feedback` — Updates Firestore session document with feedback AND relays to webhook (both best-effort, parallel).
- `POST /api/tts` — ElevenLabs TTS route (built but not called — browser TTS is primary).
- `GET /api/admin/data` — Admin data endpoint.

### Core Hooks (`hooks/`)
- `useSession` — Session lifecycle: age-differentiated turn/time limits via `getSessionConfig()`, message history, session summary. Saves to `sessionStorage`.
- `useSpeechRecognition` — **Dual-path STT**:
  - **Web Speech API path**: Android Chrome + desktop Chrome. Auto-stops after 2s silence.
  - **Deepgram path**: iOS (Safari/Chrome) + any browser without Web Speech API. Records via MediaRecorder → sends to `/api/stt`. Silence detection via AudioContext/AnalyserNode; falls back to 10s hard cap on iOS where AudioContext can't resume without user gesture.
  - Language codes: `hi-IN` or `en-IN` (Web Speech), `hi` or `en` (Deepgram).
- `useVoiceOutput` — Wraps browser SpeechSynthesis. Preloads voices on mount. Selects best available Google voice (prefers `Google UK English Female` for EN, `Google हिन्दी` for HI). Rate 0.85, pitch 1.1.

### Library (`lib/`)
- `firebaseAdmin.ts` — Firebase Admin SDK init. Exports `getDb()` and `isFirebaseConfigured()`. All routes degrade gracefully when env vars are absent.
- `kidProfile.ts` — `KidProfile` type, Firestore read/write helpers (`getKidProfile`, `incrementSessionCount`, `saveSessionSummary`, `getSessionSummary`).
- `promptBuilder.ts` — Builds dynamic per-kid system prompt. Key exports:
  - `buildSystemPrompt(kid, sessionNumber, prevSummary?)` — assembles full prompt with age-band rules, story world (interest-matched), session arc (3-session structure), language instruction, and KNOWN FACTS.
  - `getSessionConfig(ageYears, sessionNumber)` — returns `{ maxTurns, maxSeconds }` tuned per age and session.
  - `generateSessionMemory(kidName, messages)` — extracts last 3 Q&A pairs for cross-session memory.
- `utils.ts` — Shared utilities (e.g., `cn()` for className merging).

### Prompt Architecture

`constants/prompts.ts` exports `KIKI_SYSTEM_PROMPT` — used for anonymous sessions (no `?kid=` param).

For kid sessions, `lib/promptBuilder.ts` builds a standalone prompt per child that includes:
- **Story world**: matched to kid's interests (space, dinosaurs, food, trains, art, music, sports, superheroes, or default Indian jungle)
- **Age-band rules**: calibrated for 4–5 / 6–7 / 8–10 years (sentence length, vocabulary, math complexity, choice abstraction)
- **Session arc**: 3-session narrative structure (Session 1: warm-up, Session 2: cliffhanger, Session 3: grand finale)
- **Session memory**: previous session Q&A pairs injected for continuity
- **KNOWN FACTS**: name, age, class, interests — model must not invent details
- **CRITICAL OUTPUT RULES**: no `*actions*`, max 4 lines, one question max (last line), short sentences, no digits, no dashes, no ellipses

### Character — Kiki
- **Name**: Kiki (previously Mithu the parrot — fully renamed)
- **Character**: Cheerful cartoon girl, magical world origin, warm older-sibling energy
- **Component**: `components/KikiCharacter.tsx` — SVG avatar with states: `idle`, `listening` (wide eyes + star spin), `thinking` (eye shift + thought dots), `speaking` (open mouth)
- **Legacy**: `components/MithuCharacter.tsx` still present but unused
- **LocalStorage key**: `kiki:lang` (was `mithu:lang`)

### Firestore Schema
```
kids/{kidId}
  name, ageYears, class, language, interests[], sessionCount (max 3)
  whatsappNumber, createdAt
  session1Summary, session2Summary  (short memory for next session's prompt)

sessions/{sessionId}
  kidId, sessionNumber, startedAt, endedAt, durationSeconds, turnCount, language
  turns[]: { role, text, turnIndex }
  starRating, chips[], openText, whatsappNumber, childAge, feedbackAt
```

### Kid Session Flow (`/play?kid=UNIQUE_ID`)
1. On mount: fetch `/api/kid?id=` — if `404` or `sessionCount >= 3`, redirect to `/done`
2. Use kid's language preference; load age-differentiated `sessionLimits` via `getSessionConfig()`
3. On start: call `/api/chat` with trigger `[session started]` — Kiki opens using child's name
4. Each turn: STT (Web Speech or Deepgram) → transcript → `/api/chat` (with `kidId` + `sessionNumber`) → cleaned response → browser TTS → auto-listen
5. On session end: `saveSession()` → `/api/session`; also fires via `sendBeacon` on tab close → redirect to `/feedback`
6. Feedback submission: `/api/feedback` updates Firestore session document

### Anonymous Session Flow (`/play` with no kid param)
Uses hardcoded `OPENERS` (language-aware Kiki intros), static `KIKI_SYSTEM_PROMPT`, no Firestore logging.

### Registration Flow (`/register`)
- Access-gated with hardcoded code `KIKI2026` (stored in `sessionStorage kiki:access`)
- Parent fills: child name, age, class, language, 1–3 interests, optional WhatsApp
- Submits to `POST /api/register` → creates Firestore kid doc → returns play link
- Parent copies the link and shares it with the child

## Styling

Tailwind with custom `kiki-` color palette (orange, yellow, teal, indigo, offwhite, purple) in `tailwind.config.ts`. Global styles in `app/globals.css`: radial gradient background, floating particles, `.kiki-card` and `.kiki-gradient-bg` utility classes.

## Browser Compatibility

| Browser | STT path | Notes |
|---|---|---|
| Android Chrome | Web Speech API | Primary target — best experience |
| Desktop Chrome | Web Speech API | Works well |
| iOS Safari/Chrome | Deepgram (MediaRecorder → `/api/stt`) | `DEEPGRAM_API_KEY` required; AudioContext can't resume without user gesture so 10s hard cap applies |
| Firefox / other | Deepgram if no Web Speech API | Untested |
