# BlackTape

AI-powered foresight copilot for strategic planning. Helps leaders stress-test plans before the point of no return.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State:** Zustand
- **AI:** Anthropic SDK (`@anthropic-ai/sdk`), default model `claude-sonnet-4-20250514`
- **Icons:** Lucide React

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── analyze/route.ts   # POST/GET - structured analysis endpoint
│   │   └── chat/route.ts      # POST - SSE streaming chat endpoint
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                    # Reusable UI primitives (button, card, badge, input, textarea)
│   └── analysis/              # Analysis display components (risk-overview, scenarios, etc.)
├── lib/
│   ├── anthropic.ts           # Anthropic client, analysis + streaming functions
│   └── utils.ts
├── prompts/
│   └── system-prompt.ts       # BlackTape system prompt + JSON output schema
└── types/
    └── index.ts               # Full data model (Analysis, Risk, Scenario, Evidence, etc.)
```

## Key Concepts

- **Two modes:** "plan-in-hand" (detailed docs) and "idea-only" (high-level concept)
- **Risk dimensions:** cost, timeline, compliance, consensus, execution capacity, adoption, trust
- **Evidence types:** source-backed, pattern-based-inference, assumption, unknown
- **Source tiers:** tier-1 (government/regulators) through tier-4 (blogs/forums)
- **Structured output** returned in `<analysis_json>` tags, parsed in `lib/anthropic.ts`
- **In-memory session storage** via `lib/storage.ts` (imported but not yet in repo)

## Commands

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run lint` — run linter

## Environment

Requires `ANTHROPIC_API_KEY` in `.env.local`. Optional `ANTHROPIC_MODEL` override.
