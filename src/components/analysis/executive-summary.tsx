'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ExecutiveSummary as ExecutiveSummaryType, ConfidenceLevel } from '@/types';
import { getConfidenceColor } from '@/lib/utils';

const CONFIDENCE_EXPLANATIONS: Record<ConfidenceLevel, { meaning: string; howToImprove: string }> = {
  low: {
    meaning: 'Limited information available. Analysis is based primarily on assumptions and general patterns rather than plan-specific evidence.',
    howToImprove: 'Provide detailed documentation such as a project charter, budget, timeline, stakeholder list, or known constraints to increase confidence.',
  },
  medium: {
    meaning: 'Some key details are available, but gaps remain. Analysis blends provided facts with reasonable assumptions.',
    howToImprove: 'Fill in missing inputs flagged in the Unknowns section, validate key assumptions, and provide stakeholder or compliance specifics.',
  },
  high: {
    meaning: 'Sufficient detail to produce a well-grounded analysis. Most claims are backed by provided evidence or strong precedent patterns.',
    howToImprove: 'Validate remaining assumptions with subject-matter experts and confirm regulatory or compliance details with legal counsel.',
  },
};

interface ExecutiveSummaryProps {
  summary: ExecutiveSummaryType;
}

export function ExecutiveSummary({ summary }: ExecutiveSummaryProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const explanation = CONFIDENCE_EXPLANATIONS[summary.confidenceLevel];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Executive Summary</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant={summary.modeDetected === 'plan-in-hand' ? 'info' : 'default'}>
            {summary.modeDetected === 'plan-in-hand' ? 'Plan-In-Hand' : 'Idea-Only'}
          </Badge>
          <div className="relative">
            <Badge
              className={`${getConfidenceColor(summary.confidenceLevel)} cursor-help`}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              {summary.confidenceLevel.toUpperCase()} Confidence
            </Badge>
            {showTooltip && (
              <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-lg border border-blacktape-200 bg-white p-4 shadow-lg text-sm">
                <p className="font-semibold text-blacktape-900 mb-1">
                  What does this mean?
                </p>
                <p className="text-blacktape-600 mb-3">
                  {explanation.meaning}
                </p>
                <p className="font-semibold text-blacktape-900 mb-1">
                  How to improve it
                </p>
                <p className="text-blacktape-600">
                  {explanation.howToImprove}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="text-blacktape-700 leading-relaxed">{summary.tldr}</p>
          {summary.confidenceRationale && (
            <p className="text-sm text-blacktape-500 mt-2 italic">
              {summary.confidenceRationale}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-blacktape-900 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              Top Risks
            </h4>
            <ul className="space-y-2">
              {summary.topRisks.map((risk, index) => (
                <li
                  key={index}
                  className="text-sm text-blacktape-600 pl-4 border-l-2 border-red-200"
                >
                  {risk}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-blacktape-900 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Top Actions
            </h4>
            <ul className="space-y-2">
              {summary.topActions.map((action, index) => (
                <li
                  key={index}
                  className="text-sm text-blacktape-600 pl-4 border-l-2 border-green-200"
                >
                  {action}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
