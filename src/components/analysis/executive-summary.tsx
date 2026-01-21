'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ExecutiveSummary as ExecutiveSummaryType } from '@/types';
import { getConfidenceColor } from '@/lib/utils';

interface ExecutiveSummaryProps {
  summary: ExecutiveSummaryType;
}

export function ExecutiveSummary({ summary }: ExecutiveSummaryProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Executive Summary</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant={summary.modeDetected === 'plan-in-hand' ? 'info' : 'default'}>
            {summary.modeDetected === 'plan-in-hand' ? 'Plan-In-Hand' : 'Idea-Only'}
          </Badge>
          <Badge
            className={getConfidenceColor(summary.confidenceLevel)}
          >
            {summary.confidenceLevel.toUpperCase()} Confidence
          </Badge>
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
