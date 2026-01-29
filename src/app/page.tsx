'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { AnalysisLoading } from '@/components/ui/loading-spinner';
import { SECTION_LABELS, type AnalysisSection } from '@/lib/progressive-parser';

export default function Dashboard() {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedSections, setCompletedSections] = useState<Set<AnalysisSection>>(new Set());
  const abortRef = useRef<AbortController | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsLoading(true);
    setError(null);
    setCompletedSections(new Set());

    abortRef.current = new AbortController();

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInput: input,
          action: 'new',
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to start analysis');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let redirected = false;
      let analysisId: string | null = null;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter((line) => line.startsWith('data: '));

          for (const line of lines) {
            try {
              const data = JSON.parse(line.slice(6));

              // Capture analysis ID from first event
              if (data.analysisId && !analysisId) {
                analysisId = data.analysisId;
              }

              // When we get the first section, redirect to the analysis page
              if (data.section && analysisId && !redirected) {
                redirected = true;
                router.push(`/analysis/${analysisId}`);
                // Don't break - let the stream continue in background
                // The analysis page will pick up via its own SSE or polling
              }

              if (data.section) {
                setCompletedSections((prev) => {
                  const next = new Set(Array.from(prev));
                  next.add(data.section as AnalysisSection);
                  return next;
                });
              }

              if (data.error) {
                throw new Error(data.error);
              }
            } catch (parseErr) {
              // Skip malformed SSE lines
              if (parseErr instanceof Error && parseErr.message !== 'Analysis streaming failed') {
                continue;
              }
              throw parseErr;
            }
          }
        }
      }

      // If stream ended without any sections (edge case), redirect anyway
      if (analysisId && !redirected) {
        router.push(`/analysis/${analysisId}`);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsLoading(false);
    }
  };

  const examplePrompts = [
    {
      title: 'Housing Development',
      description: '100-unit apartment complex, new build, Boston, MA',
    },
    {
      title: 'Medical Device',
      description: 'Class II live-monitoring medical device for cardiac patients',
    },
    {
      title: 'Enterprise Platform',
      description: 'Company-wide ERP migration from legacy system to cloud-based solution',
    },
    {
      title: 'Public Transit',
      description: 'City bus rapid transit expansion project, 15 new routes',
    },
  ];

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Card>
          <CardContent className="py-8">
            <AnalysisLoading completedSections={completedSections} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-blacktape-900 mb-4">
          Stress-Test Your Strategic Plans
        </h1>
        <p className="text-lg text-blacktape-600 max-w-2xl mx-auto">
          BlackTape helps you surface risks, explore scenarios, and build audit-ready
          decision trails before the point of no return.
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Start New Analysis</CardTitle>
          <CardDescription>
            Describe your plan or idea. You can provide detailed documentation or just
            a high-level concept.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your plan, project, or idea...

Examples:
- A detailed project charter or PRD
- A high-level concept like '100-unit apartment complex, Boston, MA'
- A policy draft or budget proposal
- An enterprise deployment plan"
              className="min-h-[200px]"
            />
            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}
            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading || !input.trim()}>
                {isLoading ? 'Analyzing...' : 'Start Analysis'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold text-blacktape-800 mb-4">
          Or try an example
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {examplePrompts.map((example, index) => (
            <button
              key={index}
              onClick={() => setInput(example.description)}
              className="text-left p-4 border border-blacktape-200 rounded-lg hover:border-blacktape-400 hover:bg-blacktape-50 transition-colors"
            >
              <h3 className="font-medium text-blacktape-900">{example.title}</h3>
              <p className="text-sm text-blacktape-600 mt-1">{example.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-blacktape-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-blacktape-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="font-semibold text-blacktape-900">Risk Assessment</h3>
          <p className="text-sm text-blacktape-600 mt-1">
            Surface risks across cost, timeline, compliance, consensus, and execution
          </p>
        </div>
        <div className="text-center">
          <div className="w-12 h-12 bg-blacktape-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-blacktape-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <h3 className="font-semibold text-blacktape-900">Scenario Modeling</h3>
          <p className="text-sm text-blacktape-600 mt-1">
            Explore what-if scenarios and compare tradeoffs
          </p>
        </div>
        <div className="text-center">
          <div className="w-12 h-12 bg-blacktape-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-blacktape-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="font-semibold text-blacktape-900">Audit-Ready Output</h3>
          <p className="text-sm text-blacktape-600 mt-1">
            Get traceable decision logs and evidence lockers
          </p>
        </div>
      </div>
    </div>
  );
}
