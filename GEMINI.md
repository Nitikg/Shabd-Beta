# Shabd-Beta — Project Overview

Shabd-Beta is the web MVP of Shabd, a screen-free AI voice learning companion for children aged 4–8 in India. The AI character is **Mithu**, a magical parrot who tells interactive stories in Hinglish (English + Hindi). Currently in controlled beta with 25 curated kids doing 3 sessions each.

## What Is Working

**Voice conversation loop**
- Child taps Mithu → microphone opens → speech transcribed via browser Web Speech API
- Transcript sent to Claude 3 Haiku (via OpenRouter) with a dynamic per-kid system prompt
- Response cleaned server-side (strips stage directions, enforces single question, caps at 4 lines)
- Mithu speaks response via browser SpeechSynthesis with Google voice selection
- Auto-listen restarts — loop repeats for up to 10 turns or 5 minutes

**Per-kid curated sessions**
- Each of the 25 kids has a Firestore profile (name, age, class, language, interests)
- Unique URL per kid: `/play?kid=UNIQUE_ID`
- Mithu greets child by name, adapts vocabulary and story to their age
- 3-session limit — locked after completion, redirects to `/done`
- Session memory: key child answers from session 1 injected into session 2 and 3 prompts

**Session logging**
- Every turn (child speech + Mithu response) saved to Firestore
- Saves on clean session end AND on tab close (sendBeacon)
- Post-session feedback form saves star rating, observations, child age, WhatsApp number back to same Firestore document

**Prompt engineering (promptBuilder.ts)**
- Storytelling rhythm: 2–3 story turns, then 1 conversational choice question, repeat
- Choices phrased naturally: "Should we go left or right?" — no A/B labels
- Indian cultural defaults: haathi, mango jungle, Diwali mela, bazaar, Shabash praise words
- Age-calibrated voice: sentence length, vocabulary, and maths difficulty tuned per age (4–8)
- Maths woven into story: counting (age 4) → addition (5) → subtraction (6–7) → multiplication (8)
- FINAL CHECK section: model self-audits before outputting

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + custom mithu- palette |
| AI Model | Claude 3 Haiku via OpenRouter |
| Speech Input | Browser Web Speech API |
| Speech Output | Browser SpeechSynthesis (Google voice preferred) |
| Database | Firebase Firestore (via Admin SDK, server-side only) |
| Deployment | Vercel |

## Key Files

| File | Purpose |
|---|---|
| `app/play/page.tsx` | Main conversation loop, kid profile loading, session saving |
| `app/api/chat/route.ts` | AI call + full output cleanup pipeline |
| `lib/promptBuilder.ts` | Dynamic system prompt builder per kid and session |
| `lib/kidProfile.ts` | Firestore read/write for kid profiles and session memory |
| `constants/prompts.ts` | Static `MITHU_SYSTEM_PROMPT` for anonymous sessions |
| `hooks/useVoiceOutput.ts` | Browser TTS with Google voice selection |
| `hooks/useSpeechRecognition.ts` | Browser STT with silence detection |
| `hooks/useSession.ts` | Session lifecycle (turns, timer, message history) |

## What Is Not Built Yet

- Parent dashboard (no UI — Firestore console used directly for now)
- Parent authentication for web app
- ElevenLabs TTS (blocked on free tier — browser TTS is primary)
- WhatsApp session summary notifications
- Analytics dashboard
- Structured curriculum beyond prompt-level guidance

## Known Learnings from Real Sessions

- Open-ended questions → kids freeze → fixed with conversational two-option choices
- Constant questioning breaks story → fixed with 2–3 turn storytelling rhythm before each choice
- Stage directions `*chirps*` break TTS → stripped server-side in `/api/chat`
- Double confirmation after choices → single `?` enforced server-side
- Indian settings (haathi, mango tree, Diwali mela) land immediately with Indian kids
- Age 4–5 need very short sentences (8 words max) — enforced in ageVoice()
