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
- **Voice is robotic** — browser SpeechSynthesis, not warm enough for children
- **iOS speech recognition broken** — Web Speech API unreliable on WebKit
- **All 3 sessions feel identical** — no structured progression or age-band differentiation
- **No parent registration UI** — kid profiles created manually in Firebase Console
- **No admin dashboard** — raw Firestore JSON, no way to analyze 75 sessions
- **No analytics** — can't track completion rates, drop-offs, engagement

---

## Architecture Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| TTS | ElevenLabs `eleven_multilingual_v2` | Best Hinglish quality, already have API key, viable to ~2K kids/mo |
| STT (Android/Desktop) | Browser Web Speech API | Free, works well on Chrome, `en-IN` / `hi-IN` locales |
| STT (iOS fallback) | Deepgram server-side | $0.0043/min, handles Indian accent, MediaRecorder works on iOS |
| AI Model | Claude 3 Haiku via OpenRouter | Already working, cheap, fast, follows prompt rules well |
| Database | Firestore | Already set up, kid profiles + sessions + feedback |
| Hosting | Vercel (free tier) | Already deployed at shabd-beta.vercel.app |
| Framework | Next.js 16 App Router | Already built, no migration needed |

---

## Phase 1: Voice Upgrade — ElevenLabs TTS (Day 1)

**Goal:** Replace robotic browser voice with warm, natural Hinglish voice.

### Tasks
- [ ] **1.1** Upgrade ElevenLabs account from free to Starter/Creator plan
- [ ] **1.2** Select best voice for Mithu — test `eleven_multilingual_v2` with Hindi, English, and Hinglish sample sentences
- [ ] **1.3** Update `/api/tts` route: confirm it streams audio correctly, add error handling for rate limits
- [ ] **1.4** Update `useVoiceOutput` hook: call `/api/tts` instead of browser SpeechSynthesis, play returned audio via `<audio>` element or Web Audio API
- [ ] **1.5** Keep browser SpeechSynthesis as silent fallback if ElevenLabs API fails
- [ ] **1.6** Test voice output on: Android Chrome, iOS Safari, Desktop Chrome
- [ ] **1.7** Tune `rate` and `stability` parameters for child-friendly delivery (slightly slower, warm tone)

### Success Criteria
- Mithu sounds warm and natural in both Hindi and English
- Audio plays reliably on Android Chrome and iOS Safari
- Fallback to browser TTS works if API fails (no silent failures)

---

## Phase 2: iOS Speech Recognition Fix — Deepgram Fallback (Day 2)

**Goal:** Make speech input work on iOS devices (some beta parents will use iPhones).

### Tasks
- [ ] **2.1** Create `/api/stt` route using Deepgram SDK (`@deepgram/sdk`)
  - Accept audio blob (WebM/MP4)
  - Return `{ transcript: string }`
  - Use `model: "nova-2"`, `language: "hi"` with `detect_language: true`
- [ ] **2.2** Create `useAudioRecorder` hook using MediaRecorder API
  - Start/stop recording
  - Return audio blob on stop
  - Works on iOS Safari (MediaRecorder supported since iOS 14.3)
- [ ] **2.3** Update `useSpeechRecognition` hook with platform detection
  - If `window.SpeechRecognition` available and reliable → use browser API (Android/Desktop)
  - If not (iOS) → use MediaRecorder + `/api/stt` Deepgram route
  - Same external interface: `startListening()`, `stopListening()`, `transcript`, `isListening`
- [ ] **2.4** Add silence detection for Deepgram path (analyze audio levels, auto-stop after 2s silence)
- [ ] **2.5** Test on iOS Safari and iOS Chrome with Hindi and English speech
- [ ] **2.6** Remove iOS warning banner from landing page (no longer needed)

### Success Criteria
- Speech recognition works on iOS Safari and iOS Chrome
- Same 2-second silence auto-stop behavior as browser API path
- No visible difference in UX between Android and iOS

---

## Phase 3: Session Progression Prompts (Day 3)

**Goal:** Make each of the 3 sessions feel distinct and progressively engaging, adapted to child's age.

### Tasks
- [ ] **3.1** Define 3 age bands with distinct interaction styles:

  | Age Band | Vocabulary | Story Complexity | Maths Element | Session 1 Length |
  |----------|-----------|-----------------|---------------|-----------------|
  | 4-5 yrs | Very simple, repetitive, musical | Animal friends, sensory (colors, sounds) | Counting 1-3 | 5 turns / 3 min |
  | 6-7 yrs | Simple sentences, some compound | Adventure with branching choices | Addition, simple patterns | 7 turns / 4 min |
  | 8-10 yrs | Grade 2-3, can handle longer | Mystery/quest with inference | Word puzzles, basic multiplication | 10 turns / 5 min |

- [ ] **3.2** Rewrite `promptBuilder.ts` with session-specific arc instructions:

  **Session 1 (Warm-up / First Impression)**
  - Shorter session (turn count based on age band)
  - Mithu introduces itself, learns child's name
  - Quick mini-story using child's favorite interest
  - Ends with excitement: "Next time, I have an even bigger story for you!"
  - Goal: child asks parent "When can I talk to Mithu again?"

  **Session 2 (Core Story)**
  - Full-length session (10 turns / 5 min)
  - Callbacks to Session 1 choices ("Remember the mango tree? Something magical happened there!")
  - Deeper story with 3-4 choice points
  - Introduces light learning element (counting, patterns, vocabulary)
  - Ends on a cliffhanger: "But what happened next? We will find out next time!"

  **Session 3 (Grand Finale)**
  - Full-length session (10 turns / 5 min)
  - Resolves Session 2 cliffhanger
  - Child is the hero who saves the day
  - Callbacks to all previous choices and interests
  - Warm farewell: "You are one of the bravest friends Mithu has ever had!"
  - Goal: parent sees child emotionally engaged, attached to Mithu

- [ ] **3.3** Add interest-specific story seeds to prompt (not generic jungle for everyone):

  | Interest | Story World | Characters |
  |----------|------------|------------|
  | Animals | Magical jungle | Haathi the elephant, Bandar the monkey |
  | Space | Mithu's sky journey | Tara the star, Chand the moon |
  | Food | Mango tree festival | Chef Bandar, Mithai the sweet-maker |
  | Cars/Trains | Railway adventure | Chhuk-Chhuk the train, Driver Uncle |
  | Dinosaurs | Dino Island | Raju the friendly dinosaur |
  | Art/Colors | Rainbow village | Rangoli the painter |

- [ ] **3.4** Update `useSession` hook to accept dynamic turn limits based on session number and age
- [ ] **3.5** Update session timer to use dynamic max duration
- [ ] **3.6** Test prompt quality: run 5-6 simulated conversations via direct API calls, verify:
  - Session 1 is noticeably shorter and simpler
  - Session 2 references Session 1 memory
  - Session 3 feels like a grand conclusion
  - Age 4-5 responses are genuinely simpler than age 8-10
  - Each interest produces a different story world

### Success Criteria
- A parent watching all 3 sessions can clearly see progression
- A 4-year-old's session feels different from an 8-year-old's
- Story callbacks ("Remember when you chose the mango?") work across sessions
- Session 1 is short enough that a 4-year-old finishes without losing interest

---

## Phase 4: Parent Registration UI (Day 4)

**Goal:** Simple mobile form so you can register kids during a phone call with parents.

### Tasks
- [ ] **4.1** Create `/register` page with access code gate
  - Simple code input (e.g., "MITHU2026") — not a login system, just a gate
  - Store code in `sessionStorage` so parent doesn't re-enter on same session

- [ ] **4.2** Build registration form (mobile-first, single page):
  - Child's first name (text input, required)
  - Age (dropdown: 4, 5, 6, 7, 8, 9, 10)
  - Class (dropdown: Nursery, LKG, UKG, 1st, 2nd, 3rd, 4th)
  - Preferred language (toggle: English / Hindi / Hinglish)
  - Interests (visual grid, select 2-3):
    - Animals, Space, Food/Cooking, Cars/Trains, Dinosaurs, Art/Colors, Music/Dance, Sports, Superheroes
  - Parent's WhatsApp number (for sharing session link)

- [ ] **4.3** On submit:
  - Generate unique kid ID (e.g., `kid_arjun_7_abc123`)
  - Create Firestore document in `kids/{kidId}`
  - Show success screen with:
    - Unique session link: `shabd-beta.vercel.app/play?kid={kidId}`
    - "Copy Link" button
    - "Share on WhatsApp" button (pre-filled message with link + instructions)
    - QR code for the link (optional, nice-to-have)

- [ ] **4.4** Pre-filled WhatsApp message template:
  ```
  Hi! Here's {child_name}'s personal link to talk to Mithu, the story parrot:

  {link}

  How to use:
  1. Open the link on Chrome (Android) or Safari (iPhone)
  2. Allow microphone when asked
  3. Tap "Start" and hand the phone to {child_name}
  4. Sit nearby but let them lead the conversation
  5. After the session, you'll see a short feedback form

  {child_name} gets 3 story sessions with Mithu. Have fun!
  ```

- [ ] **4.5** Handle edge cases:
  - Duplicate name check (show warning, allow override — siblings may share names)
  - Form validation (all required fields)
  - Network error handling (retry button)

### Success Criteria
- You can register a kid in under 60 seconds during a phone call
- Parent receives a WhatsApp message with clear instructions
- Link works immediately after registration

---

## Phase 5: Admin Dashboard (Day 5)

**Goal:** See all beta data at a glance, drill into individual sessions, export for analysis.

### Tasks
- [ ] **5.1** Create `/admin` page with password gate (separate from registration code)

- [ ] **5.2** Overview panel:
  - Total kids registered
  - Total sessions completed (out of possible 75)
  - Sessions today
  - Average star rating (with trend)
  - Top 3 feedback chips (most selected)
  - Completion rate (sessions that reached turn 5+ / total sessions)

- [ ] **5.3** Kids table:
  - Columns: Name, Age, Language, Sessions Done (0/3, 1/3, 2/3, 3/3), Last Session Date, Avg Stars
  - Click row → expand to show all sessions
  - Color code: green (3/3 done), yellow (in progress), red (0/3, not started)

- [ ] **5.4** Session detail view:
  - Full transcript (Mithu said / Child said, alternating)
  - Session metadata: duration, turn count, language used
  - Feedback: stars, chips selected, open text
  - Flags: short session (< 3 turns), no feedback submitted, errors

- [ ] **5.5** Export functionality:
  - "Export All" button → downloads CSV with:
    - Kid name, age, class, interests, language
    - Per-session: duration, turns, star rating, chips, open text
  - Useful for investor deck, analysis spreadsheet

- [ ] **5.6** Create `/api/admin/overview` and `/api/admin/kids` server routes
  - Password verified via header (simple, not a full auth system)
  - Firestore queries with proper indexing

### Success Criteria
- You can see at a glance: how many kids have completed sessions, what the average rating is
- You can read any session's full transcript
- You can export all data to CSV for your analysis

---

## Phase 6: Testing + Tuning (Day 6)

**Goal:** Test complete flow with real children, fix issues, tune prompts.

### Tasks
- [ ] **6.1** Prepare test matrix:

  | Test | Device | Browser | Age | Language | Expected |
  |------|--------|---------|-----|----------|----------|
  | 1 | Android mid-range | Chrome | 5 | Hindi | Full flow works |
  | 2 | iPhone | Safari | 7 | English | Deepgram fallback works |
  | 3 | Desktop | Chrome | 4 | Hinglish | Short session works |
  | 4 | Android high-end | Chrome | 9 | English | Complex story works |
  | 5 | iPad | Safari | 6 | Hindi | Full flow works |

- [ ] **6.2** Run 3-5 real sessions with children (friends/family)
- [ ] **6.3** After each session, check admin dashboard:
  - Was transcript captured correctly?
  - Did Mithu follow prompt rules (single question, no actions, age-appropriate)?
  - Did session memory work (for Session 2+)?
  - Was feedback captured?
- [ ] **6.4** Tune prompts based on observed issues:
  - If child goes silent → adjust "confused" fallback response
  - If Mithu talks too much → tighten sentence length rules
  - If story is boring → add more dramatic choices
  - If Hindi recognition is poor → consider Deepgram for all (not just iOS)
- [ ] **6.5** Fix any bugs discovered
- [ ] **6.6** Test parent flow end-to-end:
  - Register on `/register` → receive WhatsApp link → open link → child plays → feedback → check admin

### Success Criteria
- 3+ real child sessions complete without errors
- Admin dashboard shows correct data for all test sessions
- At least one Session 2 successfully references Session 1 memory
- Prompts produce age-appropriate, engaging conversations

---

## Phase 7: Polish + Launch (Day 7)

**Goal:** Final fixes, prepare distribution materials, launch first batch.

### Tasks
- [ ] **7.1** Fix all bugs from Day 6 testing
- [ ] **7.2** Final prompt polish based on test conversations
- [ ] **7.3** Update landing page:
  - Remove "No login needed" (kid sessions need registration)
  - Add "Your session link was shared on WhatsApp" guidance for parents who land on `/`
  - Keep anonymous mode working (for demos / drop-ins)
- [ ] **7.4** Prepare parent communication template (WhatsApp message you'll send):
  ```
  Hi [Parent Name]!

  Mithu is ready for [Child Name]!

  I've created a personal story session — your child gets 3 conversations
  with Mithu the parrot. Each one is 3-5 minutes.

  Link: [unique link]

  Tips:
  - Use Chrome (Android) or Safari (iPhone)
  - Allow microphone when asked
  - Let [Child Name] hold the phone and talk freely
  - Sit nearby but don't coach — we want natural reactions
  - After each session, there's a quick feedback form for you (1 min)

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
- Admin dashboard shows real session data
- No critical errors in Vercel logs
- You have a clear tracking system for which kids are in which batch

---

## Files That Will Be Modified

| File | Phase | Change |
|------|-------|--------|
| `hooks/useVoiceOutput.ts` | 1 | ElevenLabs audio playback |
| `app/api/tts/route.ts` | 1 | Verify/update ElevenLabs integration |
| `app/api/stt/route.ts` | 2 | **New** — Deepgram STT endpoint |
| `hooks/useSpeechRecognition.ts` | 2 | Add Deepgram fallback path |
| `hooks/useAudioRecorder.ts` | 2 | **New** — MediaRecorder wrapper |
| `lib/promptBuilder.ts` | 3 | Session progression + age bands |
| `hooks/useSession.ts` | 3 | Dynamic turn/time limits |
| `components/SessionTimer.tsx` | 3 | Dynamic max time |
| `app/register/page.tsx` | 4 | **New** — Registration form |
| `app/api/register/route.ts` | 4 | **New** — Create kid in Firestore |
| `app/admin/page.tsx` | 5 | **New** — Admin dashboard |
| `app/api/admin/overview/route.ts` | 5 | **New** — Admin data endpoint |
| `app/api/admin/kids/route.ts` | 5 | **New** — Kids + sessions endpoint |
| `app/page.tsx` | 7 | Landing page copy updates |
| `constants/prompts.ts` | 3 | May update anonymous prompt to match |

## New Dependencies

| Package | Phase | Purpose |
|---------|-------|---------|
| `@deepgram/sdk` | 2 | Server-side speech-to-text |
| `qrcode.react` | 4 | QR code on registration success (optional) |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| ElevenLabs rate limit hit during batch testing | Low | High | Browser TTS fallback auto-activates |
| Hindi speech recognition accuracy < 70% | Medium | High | Deepgram for all users (not just iOS), prompt assumes positive on unclear input |
| Child disengages before turn 3 | Medium | Medium | Session 1 is shorter, prompt opens with excitement, choices given early |
| Parent doesn't submit feedback | Medium | Medium | Feedback page is mandatory redirect, WhatsApp follow-up from you |
| iOS MediaRecorder audio format incompatible with Deepgram | Low | Medium | Test Day 2, Deepgram accepts WebM/MP4/WAV |
| Firestore free tier limits hit | Very Low | Low | 75 sessions + 25 kids well within free tier (50K reads/day) |

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
