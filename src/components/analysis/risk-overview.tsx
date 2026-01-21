'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { RiskScores, RiskDetail } from '@/types';
import { getRiskColor } from '@/lib/utils';

interface RiskOverviewProps {
  scores: RiskScores;
  details?: RiskDetail[];
}

const riskLabels: Record<keyof RiskScores, string> = {
  cost: 'Cost',
  timeline: 'Timeline',
  compliance: 'Compliance',
  consensus: 'Consensus',
  executionCapacity: 'Execution Capacity',
  adoption: 'Adoption',
  trust: 'Trust',
};

export function RiskOverview({ scores, details }: RiskOverviewProps) {
  const dimensions = Object.entries(scores) as [keyof RiskScores, string][];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Risk Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dimensions.map(([dimension, level]) => {
            const detail = details?.find((d) => d.dimension === dimension);
            return (
              <div
                key={dimension}
                className={`p-4 rounded-lg border ${getRiskColor(level)}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{riskLabels[dimension]}</span>
                  <Badge
                    variant={
                      level === 'high'
                        ? 'danger'
                        : level === 'medium'
                        ? 'warning'
                        : 'success'
                    }
                  >
                    {level.toUpperCase()}
                  </Badge>
                </div>
                {detail && (
                  <p className="text-sm opacity-80">{detail.rationale}</p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
