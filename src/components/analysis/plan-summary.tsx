'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PlanSummary as PlanSummaryType } from '@/types';

interface PlanSummaryProps {
  summary: PlanSummaryType;
}

export function PlanSummary({ summary }: PlanSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Plan Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-semibold text-blacktape-500 uppercase tracking-wide mb-2">
              Objective
            </h4>
            <p className="text-blacktape-800">{summary.objective || 'Not specified'}</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-blacktape-500 uppercase tracking-wide mb-2">
              Scope
            </h4>
            <p className="text-blacktape-800">{summary.scope || 'Not specified'}</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-blacktape-500 uppercase tracking-wide mb-2">
              Timeline
            </h4>
            <p className="text-blacktape-800">{summary.timeline || 'Not specified'}</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-blacktape-500 uppercase tracking-wide mb-2">
              Budget / Resourcing
            </h4>
            <p className="text-blacktape-800">{summary.budget || 'Not specified'}</p>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-blacktape-500 uppercase tracking-wide mb-2">
            Stakeholders
          </h4>
          {summary.stakeholders.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {summary.stakeholders.map((stakeholder, index) => (
                <Badge key={index} variant="default">
                  {stakeholder.name} ({stakeholder.role})
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-blacktape-400 text-sm">No stakeholders identified</p>
          )}
        </div>

        <div>
          <h4 className="text-sm font-semibold text-blacktape-500 uppercase tracking-wide mb-2">
            Dependencies
          </h4>
          {summary.dependencies.length > 0 ? (
            <ul className="list-disc list-inside text-blacktape-700 space-y-1">
              {summary.dependencies.map((dep, index) => (
                <li key={index}>{dep}</li>
              ))}
            </ul>
          ) : (
            <p className="text-blacktape-400 text-sm">No dependencies identified</p>
          )}
        </div>

        <div>
          <h4 className="text-sm font-semibold text-blacktape-500 uppercase tracking-wide mb-2">
            Success Metrics
          </h4>
          {summary.successMetrics.length > 0 ? (
            <ul className="list-disc list-inside text-blacktape-700 space-y-1">
              {summary.successMetrics.map((metric, index) => (
                <li key={index}>{metric}</li>
              ))}
            </ul>
          ) : (
            <p className="text-blacktape-400 text-sm">No success metrics defined</p>
          )}
        </div>

        <div>
          <h4 className="text-sm font-semibold text-blacktape-500 uppercase tracking-wide mb-2">
            Constraints
          </h4>
          {summary.constraints.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {summary.constraints.map((constraint, index) => (
                <Badge key={index} variant="warning">
                  {constraint}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-blacktape-400 text-sm">No constraints identified</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
