# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mithu is a voice-based AI learning companion for children aged 4-8 in India. Children interact through voice with an animated parrot character ("Mithu") that tells interactive stories in Hinglish (Hindi + English). Sessions are 10 turns / 5 minutes max.

## Commands

```bash
npm run dev      # Dev server on localhost:3000
npm run build    # Production build
npm run start    # Production server
npm run lint     # ESLint
```

## Environment

Copy `.env.local.example` to `.env.local`. Required keys: `OPENROUTER_API_KEY`, `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `NEXT_PUBLIC_APP_URL`. Optional: `FEEDBACK_WEBHOOK_URL`.

## Architecture

**Stack**: Next.js 16 (App Router) + TypeScript (strict) + Tailwind CSS + React 18

**Pages** (`app/`):
- `/` — Landing page: language selection (EN/HI), microphone permission
- `/play` — Main interaction loop: voice conversation with Mithu
- `/feedback` — Post-session feedback form (rating, age, observations)

**API Routes** (`app/api/`):
- `POST /api/chat` — Sends conversation history to Claude 3 Haiku via OpenRouter, returns text response
- `POST /api/tts` — Sends text to ElevenLabs, returns audio/mpeg stream
- `POST /api/feedback` — Relays feedback JSON to a webhook URL

**Core Hooks** (`hooks/`):
- `useSession` — Session lifecycle: 10-turn limit, 5-minute countdown, message history
- `useSpeechRecognition` — Wraps browser Web Speech API for child's voice input
- `useVoiceOutput` — Wraps browser SpeechSynthesis for Mithu's voice output

**Interaction Flow**: Child speaks → `useSpeechRecognition` transcribes → transcript sent to `/api/chat` → Claude response displayed in `SpeechBubble` → response spoken via `useVoiceOutput` → repeat (up to 10 turns)

**Character Component**: `MithuCharacter.tsx` is an SVG animated parrot with four states: idle, listening, thinking, speaking.

**System Prompt**: `constants/prompts.ts` defines `MITHU_SYSTEM_PROMPT` — the comprehensive persona rules. This prompt enforces strict constraints critical to the product:
- ONE question per response, TWO sentences max
- No emojis, markdown, sound effects, dashes, ellipses, or numeric digits
- Hinglish by default, with language switching rules based on child's responses
- Grade 1 vocabulary only; child-safe content boundaries
- Roman script for Hindi words (for TTS compatibility)

**Data Persistence**: Stateless — no database. `localStorage.mithu:lang` for language preference, `sessionStorage.mithu:session` for session summary passed to feedback page.

## Styling

Tailwind with custom `mithu-` prefixed color palette (orange, yellow, teal, indigo, offwhite, purple) defined in `tailwind.config.ts`. Global styles in `app/globals.css` include radial gradient background, floating particles, and `.mithu-card` component class.

## Browser Compatibility

Chrome/Chromium required (Web Speech API). iOS has limited support (warning shown). Development should target desktop Chrome and Android Chrome.
