# Shabd-Beta MVP Launch Plan

**Objective:** Test with 25 kids (batches of 3-5/day), collect parent feedback, validate the product for full app development.
**Timeline:** 7 working days
**Budget:** ~$30 total (ElevenLabs $22/mo + Deepgram ~$2 + OpenRouter ~$1)

---

## Current State (as of 2026-03-21)

### Working
- Core voice conversation loop (10 turns, 5 min, auto-listen, 2s silence detection)
- Dynamic system prompt per kid (name, age, interests, session memory)
- Server-side output cleanup (strips `*actions*`, enforces single question, caps 4 lines)
- Firestore kid profiles + session transcript logging + feedback collection
- 3-session limit per kid with redirect to `/done`
- Session memory carry-over (Session 1 summary injected into Session 2 prompt)
- Feedback page (star rating, 9 observation chips, open text, WhatsApp number)
- `sendBeacon` backup for session save on tab close
- Landing page with language selection + mic permission

### Not Working / Missing
- ~~**Voice is robotic**~~ Done (Phase 1)
- ~~**iOS speech recognition broken**~~ Done (Phase 2)
- ~~**All 3 sessions feel identical**~~ Done (Phase 3)
- ~~**No parent registration UI**~~ Done (Phase 4)
- ~~**No admin dashboard**~~ Done (Phase 5)
- **No self-improving conversation quality** — prompts are static, no learning from actual sessions
- **No analytics** — can't track completion rates, drop-offs, engagement

---

## Architecture Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| TTS | ElevenLabs `eleven_multilingual_v2` | Best Hinglish quality, already have API key, viable to ~2K kids/mo |
| STT (Android/Desktop) | Browser Web Speech API | Free, works well on Chrome, `en-IN` / `hi-IN` locales |
| STT (iOS fallback) | Deepgram server-side (raw fetch, no SDK) | $0.0043/min, handles Indian accent, MediaRecorder works on iOS |
| AI Model | Claude 3 Haiku via OpenRouter | Already working, cheap, fast, follows prompt rules well |
| Database | Firestore | Already set up, kid profiles + sessions + feedback |
| Hosting | Vercel (free tier) | Already deployed at shabd-beta.vercel.app |
| Framework | Next.js 16 App Router | Already built, no migration needed |

---

## Phase 1: Voice Upgrade -- ElevenLabs TTS (Day 1) [DONE]

**Goal:** Replace robotic browser voice with warm, natural Hinglish voice.

### Tasks
- [x] **1.1** Upgrade ElevenLabs account from free to Starter/Creator plan
- [x] **1.2** Select best voice for Mithu -- test `eleven_multilingual_v2` with Hindi, English, and Hinglish sample sentences
- [x] **1.3** Update `/api/tts` route: added `runtime = 'nodejs'`, confirmed streaming works
- [x] **1.4** Rewrote `useVoiceOutput` hook: tries ElevenLabs first via `/api/tts`, plays audio via shared `Audio` element, falls back to browser SpeechSynthesis silently
- [x] **1.5** Browser SpeechSynthesis kept as silent fallback if ElevenLabs API fails
- [x] **1.6** Tested and deployed -- voice works well
- [x] **1.7** Added `stoppedRef` to prevent race conditions on stop during playback

### Delivered
- `hooks/useVoiceOutput.ts` -- complete rewrite with ElevenLabs primary + browser fallback
- `app/api/tts/route.ts` -- added runtime export
- Zero changes to play page (same `voice.play(text, { language })` interface)

---

## Phase 2: iOS Speech Recognition -- Deepgram Fallback (Day 2) [DONE]

**Goal:** Make speech input work on iOS devices.

### Tasks
- [x] **2.1** Created `/api/stt` route using Deepgram REST API (raw fetch, no SDK dependency)
  - Accepts audio blob via FormData
  - Uses `nova-3` model with `detect_language: true`
  - Supports Hindi and English
- [x] **2.2** Rewrote `useSpeechRecognition` hook with platform auto-detection
  - iOS detected -> MediaRecorder + `/api/stt` (Deepgram path)
  - Android/Desktop -> Web Speech API (existing path)
  - Same external interface: `startListening()`, `stopListening()`, `transcript`, `isListening`
- [x] **2.3** Added silence detection for Deepgram path via audio level analysis (RMS threshold + 2s timeout)
- [x] **2.4** Removed iOS warning from landing page (no longer needed)
- [x] **2.5** Fixed pre-existing smart quote encoding issue in `app/page.tsx`
- [x] **2.6** Updated `.env.local.example` with `DEEPGRAM_API_KEY`

### Delivered
- `app/api/stt/route.ts` -- new Deepgram STT endpoint
- `hooks/useSpeechRecognition.ts` -- complete rewrite with dual-path
- `app/page.tsx` -- cleaned up, iOS warning removed

---

## Phase 3: Session Progression Prompts (Day 3) [DONE]

**Goal:** Make each of the 3 sessions feel distinct and progressively engaging, adapted to child's age.

### Tasks
- [x] **3.1** Defined 3 age bands with distinct interaction styles:

  | Age Band | Vocabulary | Session 1 Length |
  |----------|-----------|-----------------|
  | 4-5 yrs | Very simple, repetitive, musical, rhyming | 5 turns / 3 min |
  | 6-7 yrs | Simple, compound sentences, descriptive | 7 turns / 4 min |
  | 8-10 yrs | Grade 2-3, longer sentences, puzzles | 8 turns / 4 min |

- [x] **3.2** Rewrote `promptBuilder.ts` with session-specific arc instructions:
  - Session 1: Short warm-up, mini-story, end with "come back for more"
  - Session 2: Full story with Session 1 callbacks, ends on cliffhanger
  - Session 3: Grand finale, child is the hero, emotional farewell
- [x] **3.3** Added 8 interest-specific story worlds with named characters (space, dinosaurs, trains, food, art, music, sports, superheroes)
- [x] **3.4** Updated `useSession` hook to accept dynamic `SessionLimits` (maxTurns, maxSeconds)
- [x] **3.5** Updated play page to compute session config from kid profile and pass to `useSession` and `ProgressDots`
- [x] **3.6** Improved `generateSessionMemory` to capture Q&A pairs instead of raw user text
- [x] **3.7** Added `getSessionConfig()` export for play page to use

### Delivered
- `lib/promptBuilder.ts` -- full rewrite (age bands, story worlds, session arcs, smart memory)
- `hooks/useSession.ts` -- dynamic limits, exposes `maxTurns`
- `app/play/page.tsx` -- imports `getSessionConfig`, passes dynamic limits

---

## Phase 4: Parent Registration UI (Day 4) [DONE]

**Goal:** Simple mobile form so you can register kids during a phone call with parents.

### Tasks
- [x] **4.1** Created `/register` page with access code gate ("MITHU2026", stored in sessionStorage)
- [x] **4.2** Built registration form: name, age (4-10), class, language toggle, interest chips (1-3), WhatsApp number
- [x] **4.3** On submit: generates kid ID, creates Firestore doc, shows success with session link
- [x] **4.4** Copy Link button + Share on WhatsApp button with pre-filled message template
- [x] **4.5** Register Another Child button to reset form

### Delivered
- `app/register/page.tsx` -- complete registration flow
- `app/api/register/route.ts` -- Firestore kid creation endpoint

---

## Phase 5: Admin Dashboard (Day 5) [DONE]

**Goal:** See all beta data at a glance, drill into individual sessions, export for analysis.

### Tasks
- [x] **5.1** Created `/admin` page with password gate ("MITHU_ADMIN_2026")
- [x] **5.2** Overview panel: total kids, total sessions, avg star rating, completion rate, top 3 feedback chips
- [x] **5.3** Kids table: name, age, sessions (color-coded), avg stars, last session -- expandable rows
- [x] **5.4** Session detail view: full transcript, metadata, feedback chips + open text
- [x] **5.5** Export CSV: one row per session with all kid + session + feedback data
- [x] **5.6** Created single `/api/admin/data` route (password via Authorization header)

### Delivered
- `app/admin/page.tsx` -- full dashboard with overview, table, drill-down, CSV export
- `app/api/admin/data/route.ts` -- combined data endpoint

---

## Phase 6: Smart Session Memory + Testing (Day 6)

**Goal:** Build self-improving conversation quality via AI-powered session analysis, then test complete flow with real children.

### Part A: Smart Session Analyzer

**Why:** Current session memory is a simple string concatenation of what the kid said. It carries facts but no insight. The next session's prompt doesn't know if the kid was engaged or bored, if they preferred Hindi or English, or which story moment worked best. This limits how well Mithu can adapt across sessions.

**What it does:** After each session is saved, an AI call analyzes the full transcript and produces a compact adaptation block (~50 tokens) that gets injected into the next session's prompt.

**Cost/Latency Analysis:**

| Item | Impact |
|------|--------|
| Extra AI call per session (Haiku, ~1K input tokens) | ~$0.005/session, ~$0.38 for 75 sessions |
| Added prompt context for next session | +50-80 tokens, ~50ms latency (unnoticeable) |
| Risk of prompt pollution | Low -- adaptation block is compact and non-contradictory |
| Storage | One extra field per session doc in Firestore |

#### Tasks

- [ ] **6A.1** Create `lib/sessionAnalyzer.ts` with function `analyzeSession(kidName, ageYears, messages) -> SessionInsights`
  - Input: full transcript (array of {role, content})
  - Makes one Claude Haiku call via OpenRouter with a tight analysis prompt
  - Analysis prompt asks for structured output:
    ```
    Analyze this conversation between Mithu (AI parrot) and {kidName} (age {age}).
    Output EXACTLY this format, nothing else:

    ENGAGEMENT: [high/medium/low]
    LANGUAGE_PREFERENCE: [hindi/english/hinglish]
    BEST_MOMENT: [one sentence describing which turn got the best response]
    ADAPTATION: [2-3 short bullet points for improving the next session, max 40 words total]
    ```
  - Parse the structured response into a typed `SessionInsights` object:
    ```typescript
    type SessionInsights = {
      engagement: 'high' | 'medium' | 'low';
      languagePreference: 'hindi' | 'english' | 'hinglish';
      bestMoment: string;
      adaptationNotes: string;  // compact, max 40 words
    };
    ```

- [ ] **6A.2** Update `/api/session` route to trigger analysis after save
  - After successfully saving the session transcript to Firestore
  - Call `analyzeSession()` (fire-and-forget, non-blocking)
  - Save `SessionInsights` to the session document: `sessions/{sessionId}.insights`
  - Also save the `adaptationNotes` to the kid doc: `kids/{kidId}/session{N}Insights`
  - If analysis fails, log error but don't break the session save flow

- [ ] **6A.3** Update `lib/kidProfile.ts`
  - Add `getSessionInsights(kidId, sessionNumber)` function
  - Returns the adaptation notes from the previous session

- [ ] **6A.4** Update `lib/promptBuilder.ts` to inject adaptation notes
  - In `buildSystemPrompt()`, after the session memory line, add:
    ```
    ADAPTATION (based on previous session analysis):
    {adaptationNotes}
    ```
  - Only inject if `adaptationNotes` is non-empty
  - Cap at 80 tokens to prevent prompt pollution

- [ ] **6A.5** Update `/api/chat` route to fetch and pass insights
  - When loading kid profile for session 2+, also fetch previous session's insights
  - Pass to `buildSystemPrompt()` as additional parameter

- [ ] **6A.6** Update admin dashboard to show session insights
  - In session detail view, show: engagement level, language preference, best moment, adaptation notes
  - Color-code engagement: green (high), yellow (medium), red (low)

#### Data Flow

```
Session ends
    |
    v
/api/session saves transcript to Firestore
    |
    v (async, non-blocking)
sessionAnalyzer.analyzeSession() calls Claude Haiku
    |
    v
Insights saved to:
  - sessions/{sessionId}.insights (for admin dashboard)
  - kids/{kidId}/session{N}Insights (for next session's prompt)
    |
    v (next session)
/api/chat loads kid profile + previous insights
    |
    v
buildSystemPrompt() injects adaptation notes
    |
    v
Mithu's behavior is adapted for THIS specific child
```

#### Example

Session 1 transcript:
```
Mithu: Namaste Arjun! Main hoon Mithu! What is your favourite animal?
Arjun: sher
Mithu: Wah, sher! A brave lion! Should we go to the jungle or the river?
Arjun: (silence for 4 seconds) jungle
Mithu: The jungle it is! A big mango tree was there. Should we climb it or sit under it?
Arjun: chadho
```

Analysis output:
```
ENGAGEMENT: medium
LANGUAGE_PREFERENCE: hindi
BEST_MOMENT: Arjun responded most enthusiastically to the lion (sher), showing strong animal interest
ADAPTATION:
- Child responds in Hindi. Use more Hindi words naturally.
- Give very concrete choices (climb/sit was better than jungle/river).
- Child paused before "jungle" -- simpler words work better.
```

Session 2 prompt now includes:
```
ADAPTATION (based on previous session analysis):
- Child responds in Hindi. Use more Hindi words naturally.
- Give very concrete choices (climb/sit was better than jungle/river).
- Child paused before "jungle" -- simpler words work better.
```

#### Success Criteria
- Analysis runs automatically after each session save without blocking
- Insights are visible in admin dashboard within 30 seconds of session end
- Session 2+ prompts contain adaptation notes from previous session
- Adaptation notes are compact (under 50 words) and actionable
- No degradation of response quality or formatting compliance from added context

### Part B: Manual Testing + Tuning

- [ ] **6B.1** Prepare test matrix:

  | Test | Device | Browser | Age | Language | Expected |
  |------|--------|---------|-----|----------|----------|
  | 1 | Android mid-range | Chrome | 5 | Hindi | Full flow works |
  | 2 | iPhone | Safari | 7 | English | Deepgram fallback works |
  | 3 | Desktop | Chrome | 4 | Hinglish | Short session (5 turns) works |
  | 4 | Android high-end | Chrome | 9 | English | Complex story works |
  | 5 | iPad | Safari | 6 | Hindi | Full flow works |

- [ ] **6B.2** Run 3-5 real sessions with children (friends/family)
- [ ] **6B.3** After each session, check admin dashboard:
  - Was transcript captured correctly?
  - Did Mithu follow prompt rules (single question, no actions, age-appropriate)?
  - Did session memory + insights carry forward (for Session 2+)?
  - Was feedback captured?
  - Did session analyzer produce useful insights?
- [ ] **6B.4** Tune prompts based on observed issues:
  - If child goes silent -> adjust "confused" fallback response
  - If Mithu talks too much -> tighten sentence length rules
  - If story is boring -> add more dramatic choices
  - If Hindi recognition is poor -> consider Deepgram for all (not just iOS)
  - If adaptation notes are too vague -> tighten analyzer prompt
- [ ] **6B.5** Fix any bugs discovered
- [ ] **6B.6** Test parent flow end-to-end:
  - Register on `/register` -> receive WhatsApp link -> open link -> child plays -> feedback -> check admin
- [ ] **6B.7** Verify session analyzer insights appear in admin dashboard

### Success Criteria
- 3+ real child sessions complete without errors
- Admin dashboard shows correct data + insights for all test sessions
- At least one Session 2 successfully uses adaptation notes from Session 1
- Prompts produce age-appropriate, engaging conversations
- Analyzer produces actionable insights (not generic platitudes)

---

## Phase 7: Polish + Launch (Day 7)

**Goal:** Final fixes, prepare distribution materials, launch first batch.

### Tasks
- [ ] **7.1** Fix all bugs from Day 6 testing
- [ ] **7.2** Final prompt polish based on test conversations and analyzer insights
- [ ] **7.3** Update landing page:
  - Remove "No login needed" (kid sessions need registration)
  - Add "Your session link was shared on WhatsApp" guidance for parents who land on `/`
  - Keep anonymous mode working (for demos / drop-ins)
- [ ] **7.4** Prepare parent communication template (WhatsApp message you send):
  ```
  Hi [Parent Name]!

  Mithu is ready for [Child Name]!

  I have created a personal story session -- your child gets 3 conversations
  with Mithu the parrot. Each one is 3-5 minutes.

  Link: [unique link]

  Tips:
  - Use Chrome (Android) or Safari (iPhone)
  - Allow microphone when asked
  - Let [Child Name] hold the phone and talk freely
  - Sit nearby but do not coach -- we want natural reactions
  - After each session, there is a quick feedback form for you (1 min)

  Try Session 1 today or tomorrow. Sessions 2 and 3 unlock after each one.

  Let me know how it goes!
  ```
- [ ] **7.5** Register first batch of 3-5 kids via `/register`
- [ ] **7.6** Send WhatsApp links to first batch parents
- [ ] **7.7** Monitor admin dashboard for incoming sessions
- [ ] **7.8** Verify Vercel production build is clean (`npm run build` passes)
- [ ] **7.9** Final deploy to Vercel

### Success Criteria
- First batch of 3-5 kids receive links and at least 2 complete Session 1
- Admin dashboard shows real session data with analyzer insights
- No critical errors in Vercel logs
- You have a clear tracking system for which kids are in which batch

---

## Files Modified / Created

| File | Phase | Change |
|------|-------|--------|
| `hooks/useVoiceOutput.ts` | 1 | Rewritten -- ElevenLabs primary + browser fallback |
| `app/api/tts/route.ts` | 1 | Added `runtime = 'nodejs'` |
| `app/api/stt/route.ts` | 2 | **New** -- Deepgram STT endpoint (raw fetch) |
| `hooks/useSpeechRecognition.ts` | 2 | Rewritten -- dual-path (Web Speech API + Deepgram) |
| `app/page.tsx` | 2 | Cleaned up, iOS warning removed |
| `.env.local.example` | 2 | Added `DEEPGRAM_API_KEY` |
| `lib/promptBuilder.ts` | 3 | Rewritten -- age bands, story worlds, session arcs |
| `hooks/useSession.ts` | 3 | Dynamic limits, exposes `maxTurns` |
| `app/play/page.tsx` | 3 | Dynamic session config + ProgressDots max |
| `app/register/page.tsx` | 4 | **New** -- Parent registration form |
| `app/api/register/route.ts` | 4 | **New** -- Create kid in Firestore |
| `app/admin/page.tsx` | 5 | **New** -- Admin dashboard |
| `app/api/admin/data/route.ts` | 5 | **New** -- Combined admin data endpoint |
| `lib/sessionAnalyzer.ts` | 6A | **New** -- AI-powered session analysis |
| `lib/kidProfile.ts` | 6A | Add `getSessionInsights()` |
| `app/api/session/route.ts` | 6A | Trigger analysis after save |
| `app/api/chat/route.ts` | 6A | Fetch + pass insights to prompt builder |

## Future: Aggregate Learning (Post-MVP, after 50+ sessions)

Once enough sessions are collected, build:
- **Pattern detection**: Analyze all session insights to find trends across kids
  - e.g., "4-5 year olds disengage 40% faster with abstract choices"
  - e.g., "Hindi-dominant kids respond 2x longer to animal sound stories"
- **Prompt evolution dashboard**: Admin page that shows suggested prompt changes with supporting data
- **A/B prompt testing**: Randomly assign kids to prompt variants, measure engagement differences
- **Automated prompt refinement**: Feed aggregate insights into a meta-prompt that generates improved system prompts

This requires 50+ sessions for statistical significance. Do not build before then.

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| ElevenLabs rate limit hit during batch testing | Low | High | Browser TTS fallback auto-activates |
| Hindi speech recognition accuracy < 70% | Medium | High | Deepgram for all users (not just iOS), prompt assumes positive on unclear input |
| Child disengages before turn 3 | Medium | Medium | Session 1 is shorter, prompt opens with excitement, choices given early |
| Parent does not submit feedback | Medium | Medium | Feedback page is mandatory redirect, WhatsApp follow-up from you |
| iOS MediaRecorder audio format incompatible with Deepgram | Low | Medium | Test Day 6, Deepgram accepts WebM/MP4/WAV |
| Firestore free tier limits hit | Very Low | Low | 75 sessions + 25 kids well within free tier (50K reads/day) |
| Session analyzer produces vague/unhelpful insights | Medium | Low | Tight analysis prompt with structured output, manual review during testing |
| Adaptation notes contradict base prompt rules | Low | Medium | Cap at 80 tokens, add "never override CRITICAL OUTPUT RULES" guard |

---

## Success Metrics for MVP

| Metric | Target | How Measured |
|--------|--------|-------------|
| Session completion rate | > 80% (reach turn 5+) | Admin dashboard |
| Average star rating | > 3.5 / 5 | Feedback data |
| "Child was engaged" chip | > 60% of sessions | Feedback data |
| "Child wanted to continue" chip | > 40% of sessions | Feedback data |
| Session 2 return rate | > 70% of kids do Session 2 | Firestore sessionCount |
| Session 3 return rate | > 50% of kids do Session 3 | Firestore sessionCount |
| Parent NPS (from open text) | Net positive sentiment | Manual review |
| Total sessions completed | > 50 out of 75 possible | Admin dashboard |
| Analyzer insight quality | > 70% of insights are actionable | Manual review of first 10 sessions |
| Session 2+ adaptation visible | Mithu noticeably adapts behavior | Compare Session 1 vs 2 transcripts |
