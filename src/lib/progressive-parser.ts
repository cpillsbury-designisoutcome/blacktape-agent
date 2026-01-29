// Progressive JSON parser for streaming analysis responses
// Extracts completed top-level sections from partial JSON inside <analysis_json> tags

export type AnalysisSection =
  | 'executiveSummary'
  | 'planSummary'
  | 'riskScores'
  | 'riskDetails'
  | 'assumptions'
  | 'unknowns'
  | 'scenarios'
  | 'nextBestActions'
  | 'evidenceLocker'
  | 'ethicsCheck';

export const SECTION_LABELS: Record<AnalysisSection, string> = {
  executiveSummary: 'Executive Summary',
  planSummary: 'Plan Summary',
  riskScores: 'Risk Scores',
  riskDetails: 'Risk Details',
  assumptions: 'Assumptions',
  unknowns: 'Unknowns',
  scenarios: 'Scenarios',
  nextBestActions: 'Next Best Actions',
  evidenceLocker: 'Evidence Locker',
  ethicsCheck: 'Ethics & Governance',
};

export const ALL_SECTIONS: AnalysisSection[] = Object.keys(SECTION_LABELS) as AnalysisSection[];

// Maps sections to the tab they belong to
export const SECTION_TO_TAB: Record<AnalysisSection, string> = {
  executiveSummary: 'overview',
  planSummary: 'overview',
  riskScores: 'risks',
  riskDetails: 'risks',
  assumptions: 'risks',
  unknowns: 'risks',
  scenarios: 'scenarios',
  nextBestActions: 'scenarios',
  evidenceLocker: 'evidence',
  ethicsCheck: 'audit',
};

export interface ProgressiveParseResult {
  completedSections: Record<string, unknown>;
  newSections: string[];
  raw: string;
}

/**
 * Attempts to extract completed top-level JSON sections from accumulated streamed text.
 * Looks for content inside <analysis_json> tags and tries to parse completed key-value pairs.
 */
export function parseProgressiveSections(
  accumulated: string,
  previouslyCompleted: Set<string>
): ProgressiveParseResult {
  const result: ProgressiveParseResult = {
    completedSections: {},
    newSections: [],
    raw: accumulated,
  };

  // Check if we have the opening tag
  const openTag = '<analysis_json>';
  const openIdx = accumulated.indexOf(openTag);
  if (openIdx === -1) return result;

  const jsonStart = openIdx + openTag.length;

  // Check if we have the closing tag (full JSON available)
  const closeTag = '</analysis_json>';
  const closeIdx = accumulated.indexOf(closeTag);

  if (closeIdx !== -1) {
    // Full JSON is available - parse the whole thing
    const jsonStr = accumulated.slice(jsonStart, closeIdx).trim();
    try {
      const parsed = JSON.parse(jsonStr);
      for (const key of ALL_SECTIONS) {
        if (parsed[key] !== undefined && !previouslyCompleted.has(key)) {
          result.completedSections[key] = parsed[key];
          result.newSections.push(key);
        }
      }
    } catch {
      // Full JSON didn't parse - fall through to partial parsing
    }
    if (result.newSections.length > 0) return result;
  }

  // Partial JSON - try to extract completed sections
  const partialJson = accumulated.slice(jsonStart).trim();

  for (const section of ALL_SECTIONS) {
    if (previouslyCompleted.has(section)) continue;

    const extracted = tryExtractSection(partialJson, section);
    if (extracted !== undefined) {
      result.completedSections[section] = extracted;
      result.newSections.push(section);
    }
  }

  return result;
}

/**
 * Try to extract a single top-level section from partial JSON.
 * Uses a bracket/brace counting approach to find complete values.
 */
function tryExtractSection(partialJson: string, key: string): unknown | undefined {
  // Find the key in the JSON
  const keyPattern = `"${key}"`;
  const keyIdx = partialJson.indexOf(keyPattern);
  if (keyIdx === -1) return undefined;

  // Find the colon after the key
  const colonIdx = partialJson.indexOf(':', keyIdx + keyPattern.length);
  if (colonIdx === -1) return undefined;

  // Find the start of the value (skip whitespace)
  let valueStart = colonIdx + 1;
  while (valueStart < partialJson.length && /\s/.test(partialJson[valueStart])) {
    valueStart++;
  }
  if (valueStart >= partialJson.length) return undefined;

  const startChar = partialJson[valueStart];

  // Determine the value type and find its end
  let valueEnd: number;

  if (startChar === '{' || startChar === '[') {
    valueEnd = findMatchingBracket(partialJson, valueStart);
    if (valueEnd === -1) return undefined;
    valueEnd++; // include the closing bracket
  } else if (startChar === '"') {
    valueEnd = findStringEnd(partialJson, valueStart);
    if (valueEnd === -1) return undefined;
  } else {
    // primitive (number, boolean, null)
    valueEnd = valueStart;
    while (valueEnd < partialJson.length && /[^,}\]\s]/.test(partialJson[valueEnd])) {
      valueEnd++;
    }
  }

  const valueStr = partialJson.slice(valueStart, valueEnd);
  try {
    return JSON.parse(valueStr);
  } catch {
    return undefined;
  }
}

function findMatchingBracket(str: string, start: number): number {
  const openChar = str[start];
  const closeChar = openChar === '{' ? '}' : ']';
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < str.length; i++) {
    const ch = str[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (ch === '\\' && inString) {
      escaped = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (ch === openChar) depth++;
    if (ch === closeChar) depth--;

    if (depth === 0) return i;
  }

  return -1; // unmatched
}

function findStringEnd(str: string, start: number): number {
  let escaped = false;
  for (let i = start + 1; i < str.length; i++) {
    if (escaped) {
      escaped = false;
      continue;
    }
    if (str[i] === '\\') {
      escaped = true;
      continue;
    }
    if (str[i] === '"') return i + 1;
  }
  return -1;
}
