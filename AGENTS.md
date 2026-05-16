# AI Agent Instructions for Agentes-IA

## Project overview
- Frontend-only React + Vite + TypeScript app.
- Uses Gemini AI via `@google/genai` from the browser.
- Supports a mock OpenAI provider for architecture demonstration.
- No backend folder is present; most AI integration and state management live in the client.

## Key commands
- `npm install`
- `npm run dev`
- `npm run build`
- `npm run lint` (`tsc --noEmit`)
- `npm run preview`

## Important files and folders
- `App.tsx` — main application state, chat flow, persona selection, message streaming, and prompt injection.
- `index.tsx` — React root setup and `LanguageProvider` mount.
- `components/` — UI components for chat, tabs, modals, agent controls, and sharing.
- `services/llm/gemini.ts` — Gemini streaming implementation and quota tracking via `GoogleGenAI`.
- `services/llm/openai.ts` — placeholder/mock OpenAI provider implementation.
- `services/llmService.ts` — provider router for `gemini` and `openai`.
- `services/usageService.ts` — local quota tracker for Gemini models.
- `types.ts` — shared app interfaces, enums, and provider/model types.
- `personas/` — default persona definitions, including specialized agents.
- `i18n.ts` — translation provider and language strings.

## Environment and runtime notes
- The app expects a Gemini API key in `.env.local` as `GEMINI_API_KEY`.
- Local storage is used for API keys, chats, personas, active tab, and advanced UI state.
- The repo is configured as ESM via `type: "module"` in `package.json`.

## Architecture and conventions
- This is a single-page app with no server-side code.
- AI calls are performed from the browser, so watch for browser-specific behavior and CORS.
- Gemini provider uses a global `window.fetch` patch in `services/llm/gemini.ts` to intercept quota headers.
- Persona prompt injection happens in `App.tsx` before streaming AI responses.
- `services/llm/openai.ts` is a mock; do not treat it as production API logic.
- Chat messages may include streamed text, sources, error handling, and regeneration variants.
- A special single-agent mode is enabled when URL hash parameters include `agent` and `expires`.

## Best practices for agents
- Prefer minimal changes that keep the front-end-only design intact.
- Preserve the TypeScript and React functional component style used across the app.
- Do not add server-side code unless the user explicitly wants to introduce a backend.
- Use `npm run lint` to verify type correctness after edits.
- Avoid modifying `dist/` or `node_modules/`.

## Where to look for details
- `README.md` — run instructions and local development setup.
- `package.json` — dependency list and scripts.
- `services/llm/gemini.ts` — core Gemini streaming logic.
- `types.ts` — data model expectations.
