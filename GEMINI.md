# Mithu (Beta) - Project Overview

Mithu is a screen-free AI voice learning companion designed for children aged 4 to 8 years old in India. It features Mithu, a cheerful parrot character that interacts with children through speech, telling stories and playing games in Hinglish (English mixed with Hindi).

## Architecture & Technology Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS with a custom "mithu" design system
- **AI Backend:** Claude 3 Haiku (via OpenRouter API)
- **Speech Capabilities:** 
  - **Speech Recognition:** Browser Web Speech API (via `useSpeechRecognition.ts`)
  - **Speech Synthesis:** Likely Browser `speechSynthesis` or a TTS API (via `useVoiceOutput.ts`)
- **Key Components:**
  - `MithuCharacter`: SVG-based animated character representing the parrot.
  - `useSession`: Manages 10-turn conversation limits and session state.
  - Hinglish System Prompt: Specialized instructions to ensure child-safe, age-appropriate interactions.

## Project Structure

- `app/`: Next.js App Router pages and API routes (`/api/chat`, `/api/tts`, `/api/feedback`).
- `components/`: UI components (Mithu character, transcript display, feedback forms).
- `hooks/`: Custom React hooks for session management, speech recognition, and voice output.
- `constants/`: Project-wide constants, including the highly refined `MITHU_SYSTEM_PROMPT`.
- `lib/`: Utility functions.

## Building and Running

### Prerequisites
- Node.js (v18+ recommended)
- `.env.local` file with the following keys:
  - `OPENROUTER_API_KEY`: API key for Claude 3 Haiku.
  - `NEXT_PUBLIC_APP_URL`: Base URL of the application.

### Commands
- **Development:** `npm run dev` (starts the development server)
- **Build:** `npm run build` (creates an optimized production build)
- **Production Start:** `npm run start` (starts the built application)
- **Linting:** `npm run lint` (runs ESLint checks)

## Development Conventions

- **Character Identity:** The AI character is "Mithu", a parrot. All UI and system prompts should reflect this.
- **Language:** Default interaction is Hinglish. System prompts should ensure "One question only" and "Two sentences maximum" rules are followed.
- **Styling:** Use the custom `mithu-` prefix for Tailwind classes and component styles (defined in `tailwind.config.ts`).
- **Safety:** Always prioritize child-safe content and warm, encouraging responses. No emojis or markdown in AI spoken responses.
- **Verification:** When modifying speech or chat logic, ensure browser compatibility (especially for microphone and voice synthesis).

## TODO / Future Improvements
- [ ] Complete implementation of feedback persistence.
- [ ] Optimize TTS for common Hindi words using Roman script spelling.
- [ ] Add more interactive "story worlds" for Mithu to explore with the child.
