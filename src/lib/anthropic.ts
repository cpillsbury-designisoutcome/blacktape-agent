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
    max_tokens: 8192,
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

export async function analyzeWithStructuredOutput(
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

  // Build the current user message
  let userContent = '';

  switch (request.action) {
    case 'new':
      userContent = `Please analyze the following plan/idea and provide a complete stress-test analysis. Return your analysis as a JSON object matching the schema provided, followed by any additional narrative commentary.

Plan/Idea to analyze:
${request.userInput}

Return the JSON analysis first, wrapped in <analysis_json> tags, then provide your narrative commentary.`;
      break;
    case 'refine':
      userContent = `Based on the current analysis, please refine with this additional information and return updated JSON:

${request.additionalContext || request.userInput}

Return the updated JSON analysis wrapped in <analysis_json> tags.`;
      break;
    case 'scenario':
      userContent = `Please explore this scenario variation and return analysis as JSON:

${request.userInput}

Return the JSON analysis wrapped in <analysis_json> tags.`;
      break;
    case 'question':
      userContent = request.userInput;
      break;
  }

  messages.push({
    role: 'user',
    content: userContent,
  });

  const systemPrompt = `${BLACKTAPE_SYSTEM_PROMPT}

---

## STRUCTURED OUTPUT REQUIREMENT

When asked to return JSON analysis, you must return a JSON object matching this schema:

${JSON.stringify(ANALYSIS_OUTPUT_SCHEMA, null, 2)}

Wrap the JSON in <analysis_json></analysis_json> tags.`;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 8192,
    system: systemPrompt,
    messages,
  });

  // Extract text content
  const textContent = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n');

  // Try to extract structured JSON
  let structuredAnalysis: Partial<Analysis> | undefined;
  const jsonMatch = textContent.match(/<analysis_json>([\s\S]*?)<\/analysis_json>/);

  if (jsonMatch) {
    try {
      structuredAnalysis = JSON.parse(jsonMatch[1].trim());
    } catch {
      console.error('Failed to parse structured analysis JSON');
    }
  }

  // Remove JSON block from displayed content
  const displayContent = textContent.replace(/<analysis_json>[\s\S]*?<\/analysis_json>/, '').trim();

  return {
    content: displayContent,
    structuredAnalysis,
  };
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
    max_tokens: 8192,
    system: BLACKTAPE_SYSTEM_PROMPT,
    messages,
  });

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      onChunk(event.delta.text);
    }
  }
}
