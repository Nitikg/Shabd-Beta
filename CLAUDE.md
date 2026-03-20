# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Shabd-Beta is the working web MVP of Shabd — a voice-first AI learning companion for children aged 4–8 in India. The AI character is Mithu, a magical parrot who tells interactive Hinglish stories. Sessions are 10 turns / 5 minutes max. Currently running a controlled beta with 25 curated kids.

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
| `NEXT_PUBLIC_APP_URL` | Yes | Used in OpenRouter referer header |
| `FIREBASE_PROJECT_ID` | Yes (for logging) | Firebase Admin SDK |
| `FIREBASE_CLIENT_EMAIL` | Yes (for logging) | Firebase Admin SDK |
| `FIREBASE_PRIVATE_KEY` | Yes (for logging) | Firebase Admin SDK — wrap in quotes, `\n` preserved |
| `ELEVENLABS_API_KEY` | No | Currently blocked on free tier — app falls back to browser TTS |
| `ELEVENLABS_VOICE_ID` | No | ElevenLabs voice ID |
| `FEEDBACK_WEBHOOK_URL` | No | Optional webhook relay for feedback |

Firebase credentials: Firebase Console → Project Settings → Service Accounts → Generate new private key.

## Architecture

**Stack**: Next.js 16 (App Router) + TypeScript (strict) + Tailwind CSS + React 18 + Firebase Admin SDK

### Pages (`app/`)
- `/` — Landing page: language selection (EN/HI), microphone permission
- `/play` — Main interaction loop. Accepts `?kid=UNIQUE_ID` for curated beta sessions.
- `/feedback` — Post-session feedback form (star rating, observations, child age, WhatsApp)
- `/done` — Shown when a kid has completed all 3 allowed sessions

### API Routes (`app/api/`) — all set to `runtime = 'nodejs'`
- `POST /api/chat` — Core AI route. Loads kid profile from Firestore if `kidId` provided, builds dynamic system prompt, calls Claude 3 Haiku via OpenRouter. **Post-processing pipeline on output**: strips `*action*` patterns → normalizes whitespace → enforces single `?` (truncates at first if multiple) → caps at 4 lines → fallback if empty.
- `GET /api/kid?id=` — Loads kid profile from Firestore. Returns `null` gracefully if Firebase not configured.
- `POST /api/session` — Saves full session transcript to Firestore. Increments `sessionCount` on kid document. Saves session memory for next session's prompt.
- `POST /api/feedback` — Updates Firestore session document with feedback AND relays to webhook (both best-effort, parallel).
- `POST /api/tts` — ElevenLabs TTS route (built but not called — browser TTS is primary).

### Core Hooks (`hooks/`)
- `useSession` — Session lifecycle: 10-turn limit, 5-minute countdown, message history, session summary. Saves to `sessionStorage.mithu:session` on end.
- `useSpeechRecognition` — Wraps browser Web Speech API. Auto-stops after 2s silence. Language: `hi-IN` or `en-IN`.
- `useVoiceOutput` — Wraps browser SpeechSynthesis. Preloads voices on mount. Selects best available Google voice (prefers `Google UK English Female` for EN, `Google हिन्दी` for HI). Rate 0.85, pitch 1.1.

### Library (`lib/`)
- `firebaseAdmin.ts` — Firebase Admin SDK init. Exports `getDb()` and `isFirebaseConfigured()`. All routes degrade gracefully when env vars are absent.
- `kidProfile.ts` — `KidProfile` type, Firestore read/write helpers (`getKidProfile`, `incrementSessionCount`, `saveSessionSummary`, `getSessionSummary`).
- `promptBuilder.ts` — Builds dynamic system prompt per kid. Key exports: `buildSystemPrompt(kid, sessionNumber, prevSummary?)` and `generateSessionMemory(kidName, messages)`.

### Prompt Architecture
`constants/prompts.ts` exports `MITHU_SYSTEM_PROMPT` — used only for anonymous sessions (no `?kid=` param).

For kid sessions, `lib/promptBuilder.ts` builds a standalone prompt that includes:
- Storytelling rhythm (2–3 story turns, then 1 choice question, repeat)
- Conversational choices ("Should we go left or right?" — no A/B labels)
- Age-specific voice and sentence length (calibrated for ages 4–8)
- Age-specific maths woven into story (counting → addition → subtraction → multiplication)
- Indian cultural defaults (haathi, mango jungle, Diwali mela, bazaar, Shabash praise)
- KNOWN FACTS section (name, age, class, interests — no invention allowed)
- Session memory from previous session injected if sessionNumber > 1
- FINAL CHECK section (model self-audits before outputting)

### Firestore Schema
```
kids/{kidId}
  name, ageYears, class, language, interests[], sessionCount (max 3)
  session1Summary, session2Summary  (short memory for next session's prompt)

sessions/{sessionId}
  kidId, sessionNumber, startedAt, endedAt, durationSeconds, turnCount, language
  turns[]: { role, text, turnIndex }
  starRating, chips[], openText, whatsappNumber, childAge, feedbackAt
```

### Kid Session Flow (`/play?kid=UNIQUE_ID`)
1. On mount: fetch `/api/kid?id=` — if `sessionCount >= 3`, redirect to `/done`
2. Use kid's language preference (overrides localStorage)
3. On start: call `/api/chat` with trigger message `[session started]` — Mithu opens using child's name from dynamic prompt
4. Each turn: transcript → `/api/chat` (with `kidId` + `sessionNumber`) → cleaned response → TTS → auto-listen
5. On session end: `saveSession()` → `/api/session` (also fires via `sendBeacon` on tab close) → redirect to `/feedback`
6. Feedback submission: `/api/feedback` updates Firestore session document

### Anonymous Session Flow (`/play` with no kid param)
Uses hardcoded `OPENERS` (language-aware), static `MITHU_SYSTEM_PROMPT`, no Firestore logging.

## Styling

Tailwind with custom `mithu-` color palette (orange, yellow, teal, indigo, offwhite, purple) in `tailwind.config.ts`. Global styles in `app/globals.css`: radial gradient background, floating particles, `.mithu-card` and `.mithu-gradient-bg` utility classes.

## Browser Compatibility

Chrome/Chromium required for Web Speech API. iOS shows a warning (SpeechSynthesis works; recognition unreliable). Target: Android Chrome and desktop Chrome.
