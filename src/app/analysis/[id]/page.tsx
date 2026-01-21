'use client';

import { useState, useEffect, useRef } from 'react';
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

export default function AnalysisPage() {
  const params = useParams();
  const id = params.id as string;

  const [session, setSession] = useState<AnalysisSession | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [chatInput, setChatInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSession();
  }, [id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages, streamingContent]);

  const fetchSession = async () => {
    try {
      const response = await fetch(`/api/analyze?id=${id}`);
      if (!response.ok) throw new Error('Failed to fetch analysis');
      const data = await response.json();
      setSession(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analysis');
    }
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isStreaming) return;

    const message = chatInput;
    setChatInput('');
    setIsStreaming(true);
    setStreamingContent('');

    // Optimistically add user message
    if (session) {
      setSession({
        ...session,
        messages: [
          ...session.messages,
          {
            id: Date.now().toString(),
            role: 'user',
            content: message,
            timestamp: new Date().toISOString(),
          },
        ],
      });
    }

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
            const data = JSON.parse(line.slice(6));
            if (data.chunk) {
              fullContent += data.chunk;
              setStreamingContent(fullContent);
            }
            if (data.done) {
              // Refresh session to get updated messages
              await fetchSession();
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

  if (error) {
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

  if (!session) {
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

  const { analysis, messages } = session;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-blacktape-900">{analysis.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <Badge variant={analysis.mode === 'plan-in-hand' ? 'info' : 'default'}>
              {analysis.mode === 'plan-in-hand' ? 'Plan-In-Hand' : 'Idea-Only'}
            </Badge>
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
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blacktape-900 text-blacktape-900'
                      : 'border-transparent text-blacktape-500 hover:text-blacktape-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab content */}
          <div className="space-y-6">
            {activeTab === 'overview' && (
              <>
                <ExecutiveSummary summary={analysis.executiveSummary} />
                <PlanSummary summary={analysis.planSummary} />
              </>
            )}

            {activeTab === 'risks' && (
              <>
                <RiskOverview
                  scores={analysis.riskScores}
                  details={analysis.riskDetails}
                />
                <Assumptions
                  assumptions={analysis.assumptions}
                  unknowns={analysis.unknowns}
                />
              </>
            )}

            {activeTab === 'scenarios' && (
              <>
                <Scenarios scenarios={analysis.scenarios} />
                <NextActions actions={analysis.nextBestActions} />
              </>
            )}

            {activeTab === 'evidence' && (
              <EvidenceLocker entries={analysis.evidenceLocker} />
            )}

            {activeTab === 'audit' && (
              <>
                <EthicsCheck ethics={analysis.ethicsCheck} />
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
