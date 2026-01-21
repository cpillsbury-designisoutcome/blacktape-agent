# BlackTape

AI-powered foresight copilot for strategic planning. Stress-test your plans before the point of no return.

## Features

- **Plan Understanding**: Convert messy inputs into structured summaries
- **Risk Modeling**: Assess risk across cost, timeline, compliance, consensus, execution, and adoption
- **Scenario Exploration**: Compare what-if scenarios with tradeoff analysis
- **Next Best Actions**: Get ranked, actionable recommendations
- **Audit Trail**: Maintain decision logs and evidence lockers
- **Ethics & Governance**: Built-in checks for bias, overreliance, and accountability

## Two Modes

1. **Plan-In-Hand**: Detailed analysis when you have project documentation
2. **Idea-Only**: Rapid baseline modeling from a high-level concept

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Anthropic API key

### Installation

1. Clone or copy the project:

```bash
cd blacktape
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

4. Edit `.env` and add your Anthropic API key:

```
ANTHROPIC_API_KEY=your-api-key-here
```

### Running Locally

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
blacktape/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── api/               # API routes
│   │   │   ├── analyze/       # Analysis endpoint
│   │   │   └── chat/          # Chat streaming endpoint
│   │   ├── analysis/[id]/     # Analysis view page
│   │   └── page.tsx           # Dashboard
│   ├── components/
│   │   ├── ui/                # Base UI components
│   │   └── analysis/          # Analysis-specific components
│   ├── lib/
│   │   ├── anthropic.ts       # Claude API client
│   │   ├── storage.ts         # Data storage utilities
│   │   └── utils.ts           # Helper functions
│   ├── types/
│   │   └── index.ts           # TypeScript definitions
│   └── prompts/
│       └── system-prompt.ts   # BlackTape system prompt
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.js
```

## Data Model

BlackTape produces structured outputs that include:

- **Executive Summary**: TL;DR, top risks, top actions, confidence level
- **Plan Summary**: Objective, scope, stakeholders, dependencies, timeline, budget
- **Risk Scores**: Cost, timeline, compliance, consensus, execution, adoption, trust
- **Assumptions Register**: Labeled assumptions with confidence levels
- **Unknowns**: Missing inputs with impact and priority
- **Scenarios**: Multiple variants with benefits, risks, and second-order effects
- **Next Best Actions**: Ranked actions with feasibility and first steps
- **Evidence Locker**: Claims with source types and provenance
- **Decision Log**: Version history with timestamps and reasons
- **Ethics Check**: Bias, overreliance, dual-use, and accountability assessments

## API Endpoints

### POST /api/analyze

Start a new analysis or refine an existing one.

```json
{
  "userInput": "100-unit apartment complex, Boston, MA",
  "action": "new",
  "analysisId": "optional-for-existing"
}
```

### GET /api/analyze?id={id}

Fetch an existing analysis session.

### POST /api/chat

Send a message with streaming response.

```json
{
  "analysisId": "analysis-id",
  "message": "What about permitting risks?",
  "action": "question"
}
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key | Required |
| `ANTHROPIC_MODEL` | Claude model to use | `claude-sonnet-4-20250514` |

## Customization

### System Prompt

The system prompt is located at `src/prompts/system-prompt.ts`. You can modify it to:

- Adjust tone and style
- Add domain-specific guidance
- Modify output format requirements
- Update source tier preferences

### UI Components

All UI components are in `src/components/`. The design uses Tailwind CSS with a custom color scheme defined in `tailwind.config.js`.

## Production Deployment

For production, you'll want to:

1. Replace in-memory storage with a database (PostgreSQL, MongoDB, etc.)
2. Add authentication
3. Set up proper error handling and logging
4. Configure rate limiting
5. Deploy to Vercel, Railway, or your preferred platform

### Build for Production

```bash
npm run build
npm start
```

## Operating Principles

BlackTape follows these non-negotiable principles:

- **Transparency**: Always explain why something is a risk
- **Plain Language**: No jargon unless requested
- **User-in-the-Loop**: Never lock conclusions
- **Prescriptive, Not Directive**: Recommendations, not commands
- **Audit-Ready**: Structured, exportable outputs
- **No Hallucinations**: Never invent evidence

## License

MIT
