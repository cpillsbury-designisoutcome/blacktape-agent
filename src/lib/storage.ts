import type { Analysis, AnalysisSession, ChatMessage } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// In-memory storage for development
// In production, replace with a proper database
// Use globalThis to persist across Next.js hot reloads
const globalForStorage = globalThis as unknown as {
  analysisStore: Map<string, AnalysisSession> | undefined;
};

const analysisStore = globalForStorage.analysisStore ?? new Map<string, AnalysisSession>();

if (process.env.NODE_ENV !== 'production') {
  globalForStorage.analysisStore = analysisStore;
}

export function createAnalysis(userInput: string): Analysis {
  const now = new Date().toISOString();

  return {
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
    title: userInput.slice(0, 100) + (userInput.length > 100 ? '...' : ''),
    userInput,
    mode: 'idea-only', // Will be determined by analysis
    status: 'pending',
    version: '1.0',
    executiveSummary: {
      tldr: '',
      topRisks: [],
      topActions: [],
      confidenceLevel: 'low',
      confidenceRationale: '',
      modeDetected: 'idea-only',
    },
    planSummary: {
      objective: '',
      scope: '',
      stakeholders: [],
      dependencies: [],
      timeline: '',
      budget: '',
      successMetrics: [],
      constraints: [],
    },
    riskScores: {
      cost: 'medium',
      timeline: 'medium',
      compliance: 'medium',
      consensus: 'medium',
      executionCapacity: 'medium',
      adoption: 'medium',
      trust: 'medium',
    },
    riskDetails: [],
    assumptions: [],
    unknowns: [],
    scenarios: [],
    nextBestActions: [],
    evidenceLocker: [],
    decisionLog: [{
      version: '1.0',
      timestamp: now,
      changeSummary: 'Initial baseline model created',
      reason: 'User initiated new analysis',
    }],
    ethicsCheck: {
      biasRisk: { level: 'medium', notes: 'Pending analysis' },
      overrelianceRisk: { level: 'medium', notes: 'Pending analysis' },
      dualUseRisk: { level: 'low', notes: 'Pending analysis' },
      accountabilityClarity: { level: 'partial', notes: 'Pending analysis' },
      purposeLimits: 'This analysis is for decision support only. Human judgment required for all final decisions.',
      requiredReviews: [],
      humanDecideReminder: 'All recommendations require human review and approval before action.',
    },
  };
}

export function saveSession(session: AnalysisSession): void {
  analysisStore.set(session.analysis.id, session);
}

export function getSession(id: string): AnalysisSession | undefined {
  return analysisStore.get(id);
}

export function updateAnalysis(id: string, updates: Partial<Analysis>): Analysis | undefined {
  const session = analysisStore.get(id);
  if (!session) return undefined;

  const updatedAnalysis = {
    ...session.analysis,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  session.analysis = updatedAnalysis;
  analysisStore.set(id, session);

  return updatedAnalysis;
}

export function addMessage(id: string, message: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage | undefined {
  const session = analysisStore.get(id);
  if (!session) return undefined;

  const newMessage: ChatMessage = {
    ...message,
    id: uuidv4(),
    timestamp: new Date().toISOString(),
  };

  session.messages.push(newMessage);
  analysisStore.set(id, session);

  return newMessage;
}

export function listSessions(): AnalysisSession[] {
  return Array.from(analysisStore.values())
    .sort((a, b) => new Date(b.analysis.updatedAt).getTime() - new Date(a.analysis.updatedAt).getTime());
}

export function deleteSession(id: string): boolean {
  return analysisStore.delete(id);
}

// Merge structured analysis from AI response into existing analysis
export function mergeAnalysisUpdate(existing: Analysis, update: Partial<Analysis>): Analysis {
  const now = new Date().toISOString();
  const newVersion = incrementVersion(existing.version);

  const merged: Analysis = {
    ...existing,
    ...update,
    id: existing.id, // Preserve ID
    createdAt: existing.createdAt, // Preserve creation date
    updatedAt: now,
    version: newVersion,
    decisionLog: [
      ...existing.decisionLog,
      {
        version: newVersion,
        timestamp: now,
        changeSummary: 'Analysis updated based on new input',
        reason: 'User refinement or AI analysis update',
      },
    ],
  };

  return merged;
}

function incrementVersion(version: string): string {
  const parts = version.split('.');
  const minor = parseInt(parts[1] || '0', 10);
  return `${parts[0]}.${minor + 1}`;
}

// Export analysis to different formats
export function exportAnalysis(analysis: Analysis, format: 'json' | 'markdown'): string {
  if (format === 'json') {
    return JSON.stringify(analysis, null, 2);
  }

  // Markdown export
  return `# ${analysis.title}

## Executive Summary
${analysis.executiveSummary.tldr}

**Confidence Level:** ${analysis.executiveSummary.confidenceLevel}
**Mode:** ${analysis.executiveSummary.modeDetected}

### Top Risks
${analysis.executiveSummary.topRisks.map((r, i) => `${i + 1}. ${r}`).join('\n')}

### Top Actions
${analysis.executiveSummary.topActions.map((a, i) => `${i + 1}. ${a}`).join('\n')}

---

## Plan Summary

**Objective:** ${analysis.planSummary.objective}

**Scope:** ${analysis.planSummary.scope}

**Timeline:** ${analysis.planSummary.timeline}

**Budget:** ${analysis.planSummary.budget}

### Stakeholders
${analysis.planSummary.stakeholders.map(s => `- **${s.name}** (${s.role})${s.notes ? `: ${s.notes}` : ''}`).join('\n')}

### Dependencies
${analysis.planSummary.dependencies.map(d => `- ${d}`).join('\n')}

### Success Metrics
${analysis.planSummary.successMetrics.map(m => `- ${m}`).join('\n')}

### Constraints
${analysis.planSummary.constraints.map(c => `- ${c}`).join('\n')}

---

## Risk Overview

| Dimension | Level |
|-----------|-------|
| Cost | ${analysis.riskScores.cost} |
| Timeline | ${analysis.riskScores.timeline} |
| Compliance | ${analysis.riskScores.compliance} |
| Consensus | ${analysis.riskScores.consensus} |
| Execution Capacity | ${analysis.riskScores.executionCapacity} |
| Adoption | ${analysis.riskScores.adoption} |
| Trust | ${analysis.riskScores.trust} |

---

## Assumptions Register

${analysis.assumptions.map(a => `### ${a.id}: ${a.statement}
- **Confidence:** ${a.confidence}
- **Category:** ${a.category}
- **Rationale:** ${a.rationale}
${a.validationNeeded ? `- **Validation Needed:** ${a.validationNeeded}` : ''}`).join('\n\n')}

---

## Unknowns / Missing Inputs

${analysis.unknowns.map(u => `### ${u.id}: ${u.description}
- **Impact:** ${u.impact}
- **Priority:** ${u.priority}
${u.dataToHarvest ? `- **Data to Harvest:** ${u.dataToHarvest}` : ''}`).join('\n\n')}

---

## Scenarios

${analysis.scenarios.map(s => `### ${s.name}${s.isBaseline ? ' (Baseline)' : ''}
${s.description}

**Changes:**
${s.changes.map(c => `- ${c}`).join('\n')}

**Predicted Benefits:**
${s.predictedBenefits.map(b => `- ${b}`).join('\n')}

**Predicted Risks:**
${s.predictedRisks.map(r => `- ${r}`).join('\n')}

**Second-Order Effects:**
${s.secondOrderEffects.map(e => `- ${e}`).join('\n')}

**Validations Needed:**
${s.validationsNeeded.map(v => `- ${v}`).join('\n')}`).join('\n\n---\n\n')}

---

## Next Best Actions

${analysis.nextBestActions.map((a, i) => `### ${i + 1}. ${a.action}
- **Why it matters:** ${a.whyItMatters}
- **Expected Impact:** ${a.expectedImpact}
- **Feasibility:** ${a.feasibility}
- **Dependencies:** ${a.dependencies.join(', ') || 'None'}
- **First Step:** ${a.firstStep}`).join('\n\n')}

---

## Evidence Locker

| Claim | Source Type | Provenance | Category |
|-------|-------------|------------|----------|
${analysis.evidenceLocker.map(e => `| ${e.claim} | ${e.sourceType} | ${e.provenance} | ${e.category} |`).join('\n')}

---

## Ethics & Governance Check

- **Bias Risk:** ${analysis.ethicsCheck.biasRisk.level} - ${analysis.ethicsCheck.biasRisk.notes}
- **Overreliance Risk:** ${analysis.ethicsCheck.overrelianceRisk.level} - ${analysis.ethicsCheck.overrelianceRisk.notes}
- **Dual-Use Risk:** ${analysis.ethicsCheck.dualUseRisk.level} - ${analysis.ethicsCheck.dualUseRisk.notes}
- **Accountability Clarity:** ${analysis.ethicsCheck.accountabilityClarity.level} - ${analysis.ethicsCheck.accountabilityClarity.notes}

**Purpose Limits:** ${analysis.ethicsCheck.purposeLimits}

**Required Reviews:** ${analysis.ethicsCheck.requiredReviews.join(', ') || 'None specified'}

**Reminder:** ${analysis.ethicsCheck.humanDecideReminder}

---

## Decision Log

| Version | Timestamp | Change | Reason |
|---------|-----------|--------|--------|
${analysis.decisionLog.map(d => `| ${d.version} | ${d.timestamp} | ${d.changeSummary} | ${d.reason} |`).join('\n')}

---

*Generated by BlackTape - AI-Powered Foresight Copilot*
*Analysis ID: ${analysis.id}*
*Version: ${analysis.version}*
*Last Updated: ${analysis.updatedAt}*
`;
}
