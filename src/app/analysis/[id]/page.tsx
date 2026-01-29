'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExecutiveSummary } from '@/components/analysis/executive-summary';
import { PlanSummary } from '@/components/analysis/plan-summary';
import { RiskOverview } from '@/components/analysis/risk-overview';
import { Assumptions } from '@/components/analysis/assumptions';
import { Scenarios } from '@/components/analysis/scenarios';
import { NextActions } from '@/components/analysis/next-actions';
import { EvidenceLocker } from '@/components/analysis/evidence-locker';
import { EthicsCheck } from '@/components/analysis/ethics-check';
import { DecisionLog } from '@/components/analysis/decision-log';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ALL_SECTIONS, SECTION_LABELS, SECTION_TO_TAB, type AnalysisSection } from '@/lib/progressive-parser';
import type { Analysis, AnalysisSession, ChatMessage } from '@/types';
import { formatRelativeTime } from '@/lib/utils';

type TabId = 'overview' | 'risks' | 'scenarios' | 'evidence' | 'audit';

const tabs: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'risks', label: 'Risks & Assumptions' },
  { id: 'scenarios', label: 'Scenarios' },
  { id: 'evidence', label: 'Evidence' },
  { id: 'audit', label: 'Audit & Ethics' },
];

// Which sections belong to which tab
const TAB_SECTIONS: Record<TabId, AnalysisSection[]> = {
  overview: ['executiveSummary', 'planSummary'],
  risks: ['riskScores', 'riskDetails', 'assumptions', 'unknowns'],
  scenarios: ['scenarios', 'nextBestActions'],
  evidence: ['evidenceLocker'],
  audit: ['ethicsCheck'],
};

function SectionSkeleton({ label }: { label: string }) {
  return (
    <Card>
      <CardContent className="py-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-5 h-5 border-2 border-blacktape-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-blacktape-500">Loading {label}...</span>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-blacktape-100 rounded animate-pulse w-3/4" />
          <div className="h-4 bg-blacktape-100 rounded animate-pulse w-1/2" />
          <div className="h-4 bg-blacktape-100 rounded animate-pulse w-5/6" />
          <div className="h-4 bg-blacktape-100 rounded animate-pulse w-2/3" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function AnalysisPage() {
  const params = useParams();
  const id = params.id as string;

  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [chatInput, setChatInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loadedSections, setLoadedSections] = useState<Set<AnalysisSection>>(new Set());
  const [isAnalysisComplete, setIsAnalysisComplete] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch full session data
  const fetchSession = useCallback(async () => {
    try {
      const response = await fetch(`/api/analyze?id=${id}`);
      if (!response.ok) throw new Error('Failed to fetch analysis');
      const data: AnalysisSession = await response.json();
      setAnalysis(data.analysis);
      setMessages(data.messages);

      // Determine which sections are loaded from the fetched data
      const sections = new Set<AnalysisSection>();
      for (const section of ALL_SECTIONS) {
        const value = data.analysis[section as keyof Analysis];
        if (value !== undefined && value !== null && !isEmptySection(value)) {
          sections.add(section);
        }
      }
      setLoadedSections(sections);

      if (data.analysis.status === 'completed') {
        setIsAnalysisComplete(true);
        // Mark all sections as loaded when complete
        setLoadedSections(new Set(ALL_SECTIONS));
      }

      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analysis');
      return null;
    }
  }, [id]);

  // Initial load
  useEffect(() => {
    fetchSession().then((data) => {
      if (data && data.analysis.status !== 'completed') {
        // Analysis is still in progress — poll for updates
        pollingRef.current = setInterval(async () => {
          const updated = await fetchSession();
          if (updated && updated.analysis.status === 'completed') {
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }
          }
        }, 2000);
      }
    });

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [id, fetchSession]);

  // Only auto-scroll the chat container (not the whole page) when the user is chatting
  useEffect(() => {
    if (!chatEndRef.current) return;
    // Only scroll when actively streaming a chat response or when a new user message is added
    if (isStreaming || streamingContent) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [messages, streamingContent, isStreaming]);

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isStreaming) return;

    const message = chatInput;
    setChatInput('');
    setIsStreaming(true);
    setStreamingContent('');

    // Optimistically add user message
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      },
    ]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisId: id,
          message,
          action: 'question',
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter((line) => line.startsWith('data: '));

          for (const line of lines) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.chunk) {
                fullContent += data.chunk;
                setStreamingContent(fullContent);
              }
              if (data.done) {
                await fetchSession();
              }
            } catch {
              // skip malformed lines
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
    }
  };

  if (error && !analysis) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-red-600">{error}</p>
            <Button onClick={() => window.location.href = '/'} className="mt-4">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <Card>
          <CardContent className="py-12">
            <LoadingSpinner
              size="lg"
              message="Loading analysis..."
              subMessage="Retrieving your analysis data"
              className="py-8"
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if a tab has any loaded sections
  const tabHasData = (tabId: TabId): boolean => {
    return TAB_SECTIONS[tabId].some((s) => loadedSections.has(s));
  };

  // Check if all sections in a tab are loaded
  const tabFullyLoaded = (tabId: TabId): boolean => {
    return TAB_SECTIONS[tabId].every((s) => loadedSections.has(s));
  };

  const isSectionLoaded = (section: AnalysisSection): boolean => {
    return loadedSections.has(section);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-blacktape-900">{analysis.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <Badge variant={analysis.mode === 'plan-in-hand' ? 'info' : 'default'}>
              {analysis.mode === 'plan-in-hand' ? 'Plan-In-Hand' : 'Idea-Only'}
            </Badge>
            {!isAnalysisComplete && (
              <Badge variant="warning">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 border border-current border-t-transparent rounded-full animate-spin" />
                  Analyzing
                </span>
              </Badge>
            )}
            <span className="text-sm text-blacktape-500">
              v{analysis.version} • Updated {formatRelativeTime(analysis.updatedAt)}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="border-b border-blacktape-200">
            <nav className="flex gap-4">
              {tabs.map((tab) => {
                const hasData = tabHasData(tab.id);
                const fullyLoaded = tabFullyLoaded(tab.id);

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                      activeTab === tab.id
                        ? 'border-blacktape-900 text-blacktape-900'
                        : 'border-transparent text-blacktape-500 hover:text-blacktape-700'
                    }`}
                  >
                    {tab.label}
                    {!isAnalysisComplete && hasData && fullyLoaded && (
                      <svg className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {!isAnalysisComplete && hasData && !fullyLoaded && (
                      <span className="w-3 h-3 border-2 border-blacktape-400 border-t-transparent rounded-full animate-spin" />
                    )}
                    {!isAnalysisComplete && !hasData && (
                      <span className="w-2 h-2 bg-blacktape-300 rounded-full" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab content */}
          <div className="space-y-6">
            {activeTab === 'overview' && (
              <>
                {isSectionLoaded('executiveSummary') ? (
                  <ExecutiveSummary summary={analysis.executiveSummary} />
                ) : (
                  <SectionSkeleton label={SECTION_LABELS.executiveSummary} />
                )}
                {isSectionLoaded('planSummary') ? (
                  <PlanSummary summary={analysis.planSummary} />
                ) : (
                  <SectionSkeleton label={SECTION_LABELS.planSummary} />
                )}
              </>
            )}

            {activeTab === 'risks' && (
              <>
                {isSectionLoaded('riskScores') || isSectionLoaded('riskDetails') ? (
                  <RiskOverview
                    scores={analysis.riskScores}
                    details={analysis.riskDetails}
                  />
                ) : (
                  <SectionSkeleton label="Risk Overview" />
                )}
                {isSectionLoaded('assumptions') || isSectionLoaded('unknowns') ? (
                  <Assumptions
                    assumptions={analysis.assumptions}
                    unknowns={analysis.unknowns}
                  />
                ) : (
                  <SectionSkeleton label="Assumptions & Unknowns" />
                )}
              </>
            )}

            {activeTab === 'scenarios' && (
              <>
                {isSectionLoaded('scenarios') ? (
                  <Scenarios scenarios={analysis.scenarios} />
                ) : (
                  <SectionSkeleton label={SECTION_LABELS.scenarios} />
                )}
                {isSectionLoaded('nextBestActions') ? (
                  <NextActions actions={analysis.nextBestActions} />
                ) : (
                  <SectionSkeleton label={SECTION_LABELS.nextBestActions} />
                )}
              </>
            )}

            {activeTab === 'evidence' && (
              <>
                {isSectionLoaded('evidenceLocker') ? (
                  <EvidenceLocker entries={analysis.evidenceLocker} />
                ) : (
                  <SectionSkeleton label={SECTION_LABELS.evidenceLocker} />
                )}
              </>
            )}

            {activeTab === 'audit' && (
              <>
                {isSectionLoaded('ethicsCheck') ? (
                  <EthicsCheck ethics={analysis.ethicsCheck} />
                ) : (
                  <SectionSkeleton label={SECTION_LABELS.ethicsCheck} />
                )}
                <DecisionLog entries={analysis.decisionLog} />
              </>
            )}
          </div>
        </div>

        {/* Chat sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <div className="p-4 border-b border-blacktape-100">
              <h3 className="font-semibold text-blacktape-900">Conversation</h3>
              <p className="text-xs text-blacktape-500 mt-1">
                Ask questions or refine the analysis
              </p>
            </div>
            <div className="h-96 overflow-y-auto p-4 space-y-4">
              {messages.map((msg: ChatMessage) => (
                <div
                  key={msg.id}
                  className={`${
                    msg.role === 'user' ? 'ml-8' : 'mr-8'
                  }`}
                >
                  <div
                    className={`p-3 rounded-lg text-sm ${
                      msg.role === 'user'
                        ? 'bg-blacktape-900 text-white'
                        : 'bg-blacktape-100 text-blacktape-800'
                    }`}
                  >
                    <div className="prose prose-sm max-w-none">
                      {msg.content}
                    </div>
                  </div>
                  <p className="text-xs text-blacktape-400 mt-1">
                    {formatRelativeTime(msg.timestamp)}
                  </p>
                </div>
              ))}
              {isStreaming && streamingContent && (
                <div className="mr-8">
                  <div className="p-3 rounded-lg text-sm bg-blacktape-100 text-blacktape-800">
                    <div className="prose prose-sm max-w-none">
                      {streamingContent}
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="p-4 border-t border-blacktape-100">
              <form onSubmit={handleChat} className="space-y-2">
                <Textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask a question or provide more context..."
                  className="min-h-[80px]"
                  disabled={isStreaming}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isStreaming || !chatInput.trim()}
                >
                  {isStreaming ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Thinking...
                    </span>
                  ) : (
                    'Send'
                  )}
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/** Check if a section value is "empty" (default placeholder data) */
function isEmptySection(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    // Check for placeholder executive summary
    if ('tldr' in obj && obj.tldr === '') return true;
    // Check for placeholder plan summary
    if ('objective' in obj && obj.objective === '') return true;
    // Check for placeholder ethics with "Pending analysis"
    if ('biasRisk' in obj) {
      const ethics = obj as { biasRisk?: { notes?: string } };
      if (ethics.biasRisk?.notes === 'Pending analysis') return true;
    }
  }
  return false;
}
