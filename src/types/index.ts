// BlackTape Data Model Types
// Based on the Output Data Model specification

export type AnalysisMode = 'plan-in-hand' | 'idea-only';

export type RiskLevel = 'low' | 'medium' | 'high';

export type ConfidenceLevel = 'low' | 'medium' | 'high';

export type EvidenceType = 'source-backed' | 'pattern-based-inference' | 'assumption' | 'unknown';

export type SourceTier = 'tier-1' | 'tier-2' | 'tier-3' | 'tier-4';

export type TaskStatus = 'pending' | 'in_progress' | 'completed';

// Stakeholder using RACI model
export interface Stakeholder {
  name: string;
  role: 'accountable' | 'responsible' | 'consulted' | 'informed';
  notes?: string;
}

// Plan Summary structure
export interface PlanSummary {
  objective: string;
  scope: string;
  stakeholders: Stakeholder[];
  dependencies: string[];
  timeline: string;
  budget: string;
  successMetrics: string[];
  constraints: string[];
}

// Risk Scores by dimension
export interface RiskScores {
  cost: RiskLevel;
  timeline: RiskLevel;
  compliance: RiskLevel;
  consensus: RiskLevel;
  executionCapacity: RiskLevel;
  adoption: RiskLevel;
  trust: RiskLevel;
}

// Risk dimension detail
export interface RiskDetail {
  dimension: keyof RiskScores;
  level: RiskLevel;
  rationale: string;
  evidenceType: EvidenceType;
  mitigations?: string[];
}

// Assumption with metadata
export interface Assumption {
  id: string;
  statement: string;
  confidence: ConfidenceLevel;
  rationale: string;
  category: 'financial' | 'operational' | 'stakeholder' | 'precedent' | 'technical' | 'regulatory';
  validationNeeded?: string;
}

// Unknown / Missing Input
export interface Unknown {
  id: string;
  description: string;
  impact: string;
  dataToHarvest?: string;
  priority: 'high' | 'medium' | 'low';
}

// Scenario for what-if analysis
export interface Scenario {
  id: string;
  name: string;
  description: string;
  changes: string[];
  predictedBenefits: string[];
  predictedRisks: string[];
  secondOrderEffects: string[];
  validationsNeeded: string[];
  isBaseline?: boolean;
}

// Next Best Action
export interface NextBestAction {
  id: string;
  action: string;
  whyItMatters: string;
  expectedImpact: 'high' | 'medium' | 'low';
  feasibility: 'high' | 'medium' | 'low';
  dependencies: string[];
  firstStep: string;
  timeToEffect?: string;
  riskReductionPotential?: string;
}

// Evidence Locker Entry
export interface EvidenceEntry {
  id: string;
  claim: string;
  sourceType: EvidenceType;
  sourceTier?: SourceTier;
  provenance: string;
  link?: string;
  publishDate?: string;
  publisher?: string;
  notes?: string;
  category: 'financial' | 'operational' | 'stakeholder' | 'precedent' | 'regulatory' | 'technical';
}

// Decision Log Entry
export interface DecisionLogEntry {
  version: string;
  timestamp: string;
  changeSummary: string;
  reason: string;
  author?: string;
  affectedAreas?: string[];
}

// Ethics Check
export interface EthicsCheck {
  biasRisk: {
    level: RiskLevel;
    notes: string;
  };
  overrelianceRisk: {
    level: RiskLevel;
    notes: string;
  };
  dualUseRisk: {
    level: RiskLevel;
    notes: string;
  };
  accountabilityClarity: {
    level: 'clear' | 'partial' | 'unclear';
    notes: string;
  };
  purposeLimits: string;
  requiredReviews: string[];
  humanDecideReminder: string;
}

// Executive Summary
export interface ExecutiveSummary {
  tldr: string;
  topRisks: string[];
  topActions: string[];
  confidenceLevel: ConfidenceLevel;
  confidenceRationale: string;
  modeDetected: AnalysisMode;
}

// Complete Analysis object
export interface Analysis {
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  userInput: string;
  mode: AnalysisMode;
  executiveSummary: ExecutiveSummary;
  planSummary: PlanSummary;
  riskScores: RiskScores;
  riskDetails: RiskDetail[];
  assumptions: Assumption[];
  unknowns: Unknown[];
  scenarios: Scenario[];
  nextBestActions: NextBestAction[];
  evidenceLocker: EvidenceEntry[];
  decisionLog: DecisionLogEntry[];
  ethicsCheck: EthicsCheck;
  status: TaskStatus;
  version: string;
}

// Chat message for conversation
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// Analysis session with chat history
export interface AnalysisSession {
  analysis: Analysis;
  messages: ChatMessage[];
}

// API Request/Response types
export interface AnalyzeRequest {
  userInput: string;
  existingAnalysis?: Analysis;
  action: 'new' | 'refine' | 'scenario' | 'question';
  additionalContext?: string;
}

export interface AnalyzeResponse {
  analysis: Analysis;
  message: string;
  followUpQuestions?: string[];
}

// Comparable types for auto-harvest
export interface Comparable {
  id: string;
  category: string;
  description: string;
  relevance: string;
  sourceType: EvidenceType;
  failureModes?: string[];
  timelineDrivers?: string[];
  costDrivers?: string[];
  complianceGates?: string[];
  adoptionBarriers?: string[];
}

// Data to Harvest checklist item
export interface DataToHarvestItem {
  id: string;
  dataType: string;
  description: string;
  suggestedSources: string[];
  priority: 'high' | 'medium' | 'low';
  harvested: boolean;
}

// Warning types for failure mode detection
export interface BlackTapeWarning {
  id: string;
  type:
    | 'procurement-drag'
    | 'consensus-fragility'
    | 'training-burden'
    | 'integration-depth'
    | 'execution-mismatch'
    | 'hindsight-missing'
    | 'design-to-model';
  severity: 'high' | 'medium' | 'low';
  description: string;
  recommendation: string;
}

// Export artifact types
export type ExportFormat = 'executive-brief' | 'decision-log' | 'assumptions-register' | 'evidence-packet' | 'ethics-checklist';

export interface ExportRequest {
  analysisId: string;
  format: ExportFormat;
}
