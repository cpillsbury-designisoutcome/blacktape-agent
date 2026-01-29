import Anthropic from '@anthropic-ai/sdk';
import { BLACKTAPE_SYSTEM_PROMPT, ANALYSIS_OUTPUT_SCHEMA } from '@/prompts/system-prompt';
import type { Analysis, AnalyzeRequest, ChatMessage } from '@/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';

export interface BlackTapeResponse {
  content: string;
  structuredAnalysis?: Partial<Analysis>;
}

export async function analyzeWithBlackTape(
  request: AnalyzeRequest,
  previousMessages: ChatMessage[] = []
): Promise<BlackTapeResponse> {
  const messages: Anthropic.MessageParam[] = [];

  // Add previous conversation context
  for (const msg of previousMessages) {
    messages.push({
      role: msg.role,
      content: msg.content,
    });
  }

  // Build the current user message based on action type
  let userContent = '';

  switch (request.action) {
    case 'new':
      userContent = `Please analyze the following plan/idea and provide a complete stress-test analysis:\n\n${request.userInput}`;
      break;
    case 'refine':
      userContent = `Based on the current analysis, please refine with this additional information:\n\n${request.additionalContext || request.userInput}`;
      break;
    case 'scenario':
      userContent = `Please explore this scenario variation:\n\n${request.userInput}`;
      break;
    case 'question':
      userContent = request.userInput;
      break;
  }

  messages.push({
    role: 'user',
    content: userContent,
  });

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 16384,
    system: BLACKTAPE_SYSTEM_PROMPT,
    messages,
  });

  // Extract text content
  const textContent = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n');

  return {
    content: textContent,
    structuredAnalysis: undefined, // Parsing happens on client or in separate step
  };
}

// Helper to extract text from Anthropic response
function extractText(response: Anthropic.Message): string {
  return response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n');
}

// Helper to extract JSON from tagged response
function extractTaggedJson<T>(text: string, tag: string): T | undefined {
  const regex = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`);
  const match = text.match(regex);
  if (match) {
    try {
      return JSON.parse(match[1].trim());
    } catch {
      console.error(`Failed to parse JSON from <${tag}> block`);
    }
  }
  return undefined;
}

// Pass 1: Plan summary, risk modeling, and assumptions
async function runPass1(
  userInput: string,
  previousMessages: Anthropic.MessageParam[]
): Promise<{ text: string; json: Record<string, unknown> | undefined }> {
  const messages: Anthropic.MessageParam[] = [
    ...previousMessages,
    {
      role: 'user',
      content: `Analyze the following plan/idea. For this pass, focus ONLY on these sections — produce them in full depth:

1) **Executive Summary** — TL;DR, top risks, top actions, confidence level + rationale, mode detected
2) **Plan Summary** — objective, scope, stakeholders (RACI), dependencies, timeline, budget, success metrics, constraints
3) **Risk Overview** — all 7 dimensions with detailed rationales (3+ sentences each), evidence types, and mitigations for medium/high risks
4) **Assumptions Register** — at least 6 assumptions with confidence, rationale, category, validation path, and interdependencies
5) **Unknowns** — at least 3 unknowns with specific data needed to resolve each

Plan/Idea:
${userInput}

Return your analysis as JSON wrapped in <pass1_json> tags, then provide narrative commentary.`,
    },
  ];

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 16384,
    system: BLACKTAPE_SYSTEM_PROMPT,
    messages,
  });

  const text = extractText(response);
  const json = extractTaggedJson<Record<string, unknown>>(text, 'pass1_json');
  return { text, json };
}

// Pass 2: Scenarios, next actions, evidence locker, ethics
async function runPass2(
  userInput: string,
  pass1Summary: string,
  previousMessages: Anthropic.MessageParam[]
): Promise<{ text: string; json: Record<string, unknown> | undefined }> {
  const messages: Anthropic.MessageParam[] = [
    ...previousMessages,
    {
      role: 'user',
      content: `I am analyzing this plan/idea:

${userInput}

Here is the analysis from Pass 1 (plan summary, risks, assumptions, unknowns):

${pass1Summary}

Now produce the remaining sections in full depth:

1) **Scenarios** — at least 3 meaningfully different scenarios (including baseline). Each must have 3+ changes, 3+ benefits, 3+ risks, 2+ second-order effects, and validations needed.
2) **Next Best Actions** — at least 4 ranked actions. Each with a concrete first step, dependency chains, impact, feasibility, and risk reduction potential.
3) **Evidence Locker** — an entry for every claim and risk rationale from Pass 1 and this pass. State evidence type, explain patterns/assumptions, cite provenance where possible.
4) **Ethics & Governance Check** — specific examples relevant to THIS plan for each dimension (bias, overreliance, dual-use, accountability). Not generic boilerplate.
5) **BlackTape Warnings** — any failure mode warnings detected.

Return your analysis as JSON wrapped in <pass2_json> tags, then provide narrative commentary.`,
    },
  ];

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 16384,
    system: BLACKTAPE_SYSTEM_PROMPT,
    messages,
  });

  const text = extractText(response);
  const json = extractTaggedJson<Record<string, unknown>>(text, 'pass2_json');
  return { text, json };
}

export async function analyzeWithStructuredOutput(
  request: AnalyzeRequest,
  previousMessages: ChatMessage[] = []
): Promise<BlackTapeResponse> {
  const prevMsgs: Anthropic.MessageParam[] = previousMessages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));

  // For non-new actions or questions, use a single pass
  if (request.action === 'question') {
    const messages: Anthropic.MessageParam[] = [
      ...prevMsgs,
      { role: 'user', content: request.userInput },
    ];
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 16384,
      system: BLACKTAPE_SYSTEM_PROMPT,
      messages,
    });
    return { content: extractText(response) };
  }

  if (request.action === 'refine' || request.action === 'scenario') {
    const userContent = request.action === 'refine'
      ? `Based on the current analysis, please refine with this additional information and return updated JSON:\n\n${request.additionalContext || request.userInput}\n\nReturn the updated JSON analysis wrapped in <analysis_json> tags.`
      : `Please explore this scenario variation and return analysis as JSON:\n\n${request.userInput}\n\nReturn the JSON analysis wrapped in <analysis_json> tags.`;

    const messages: Anthropic.MessageParam[] = [
      ...prevMsgs,
      { role: 'user', content: userContent },
    ];

    const systemPrompt = `${BLACKTAPE_SYSTEM_PROMPT}\n\n---\n\n## STRUCTURED OUTPUT REQUIREMENT\n\nReturn a JSON object matching this schema:\n\n${JSON.stringify(ANALYSIS_OUTPUT_SCHEMA, null, 2)}\n\nWrap the JSON in <analysis_json></analysis_json> tags.`;

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 16384,
      system: systemPrompt,
      messages,
    });

    const textContent = extractText(response);
    const structuredAnalysis = extractTaggedJson<Partial<Analysis>>(textContent, 'analysis_json');
    const displayContent = textContent.replace(/<analysis_json>[\s\S]*?<\/analysis_json>/, '').trim();

    return { content: displayContent, structuredAnalysis };
  }

  // Deep analysis: run two-pass pipeline
  if (request.action === 'deep-analysis') {
    const pass1 = await runPass1(request.userInput, prevMsgs);
    const pass1Display = pass1.text.replace(/<pass1_json>[\s\S]*?<\/pass1_json>/, '').trim();

    const pass2 = await runPass2(request.userInput, pass1.text, prevMsgs);
    const pass2Display = pass2.text.replace(/<pass2_json>[\s\S]*?<\/pass2_json>/, '').trim();

    const mergedAnalysis: Partial<Analysis> = {
      ...(pass1.json as Partial<Analysis> || {}),
      ...(pass2.json as Partial<Analysis> || {}),
    };

    const combinedContent = `${pass1Display}\n\n---\n\n${pass2Display}`;

    return {
      content: combinedContent,
      structuredAnalysis: Object.keys(mergedAnalysis).length > 0 ? mergedAnalysis : undefined,
    };
  }

  // New analysis: single pass (default)
  const userContent = `Please analyze the following plan/idea and provide a complete stress-test analysis. Return your analysis as a JSON object matching the schema provided, followed by any additional narrative commentary.

Plan/Idea to analyze:
${request.userInput}

Return the JSON analysis first, wrapped in <analysis_json> tags, then provide your narrative commentary.`;

  const messages: Anthropic.MessageParam[] = [
    ...prevMsgs,
    { role: 'user', content: userContent },
  ];

  const systemPrompt = `${BLACKTAPE_SYSTEM_PROMPT}\n\n---\n\n## STRUCTURED OUTPUT REQUIREMENT\n\nReturn a JSON object matching this schema:\n\n${JSON.stringify(ANALYSIS_OUTPUT_SCHEMA, null, 2)}\n\nWrap the JSON in <analysis_json></analysis_json> tags.`;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 16384,
    system: systemPrompt,
    messages,
  });

  const textContent = extractText(response);
  const structuredAnalysis = extractTaggedJson<Partial<Analysis>>(textContent, 'analysis_json');
  const displayContent = textContent.replace(/<analysis_json>[\s\S]*?<\/analysis_json>/, '').trim();

  return { content: displayContent, structuredAnalysis };
}

export async function streamAnalysis(
  request: AnalyzeRequest,
  previousMessages: ChatMessage[] = [],
  onChunk: (chunk: string) => void
): Promise<void> {
  const messages: Anthropic.MessageParam[] = [];

  for (const msg of previousMessages) {
    messages.push({
      role: msg.role,
      content: msg.content,
    });
  }

  let userContent = '';
  switch (request.action) {
    case 'new':
      userContent = `Please analyze the following plan/idea and provide a complete stress-test analysis:\n\n${request.userInput}`;
      break;
    case 'refine':
      userContent = `Based on the current analysis, please refine with this additional information:\n\n${request.additionalContext || request.userInput}`;
      break;
    case 'scenario':
      userContent = `Please explore this scenario variation:\n\n${request.userInput}`;
      break;
    case 'question':
      userContent = request.userInput;
      break;
  }

  messages.push({
    role: 'user',
    content: userContent,
  });

  const stream = anthropic.messages.stream({
    model: MODEL,
    max_tokens: 16384,
    system: BLACKTAPE_SYSTEM_PROMPT,
    messages,
  });

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      onChunk(event.delta.text);
    }
  }
}
