'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { NextBestAction } from '@/types';

interface NextActionsProps {
  actions: NextBestAction[];
}

export function NextActions({ actions }: NextActionsProps) {
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'success';
      case 'medium':
        return 'warning';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  };

  const getFeasibilityColor = (feasibility: string) => {
    switch (feasibility) {
      case 'high':
        return 'success';
      case 'medium':
        return 'warning';
      case 'low':
        return 'danger';
      default:
        return 'default';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Next Best Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {actions.length === 0 ? (
            <p className="text-blacktape-500 text-center py-8">
              No actions identified yet
            </p>
          ) : (
            actions.map((action, index) => (
              <div
                key={action.id}
                className="border border-blacktape-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blacktape-900 text-white flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </span>
                    <div>
                      <h4 className="font-semibold text-blacktape-900">
                        {action.action}
                      </h4>
                      <p className="text-sm text-blacktape-600 mt-1">
                        {action.whyItMatters}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Badge variant={getImpactColor(action.expectedImpact) as 'success' | 'warning' | 'default'}>
                      Impact: {action.expectedImpact}
                    </Badge>
                    <Badge variant={getFeasibilityColor(action.feasibility) as 'success' | 'warning' | 'danger' | 'default'}>
                      Feasibility: {action.feasibility}
                    </Badge>
                  </div>
                </div>

                {action.dependencies.length > 0 && (
                  <div className="mt-3 ml-11">
                    <span className="text-xs font-semibold text-blacktape-500 uppercase">
                      Dependencies:{' '}
                    </span>
                    <span className="text-sm text-blacktape-600">
                      {action.dependencies.join(', ')}
                    </span>
                  </div>
                )}

                <div className="mt-3 ml-11 bg-green-50 border border-green-200 rounded p-3">
                  <span className="text-xs font-semibold text-green-700 uppercase">
                    First Step:{' '}
                  </span>
                  <span className="text-sm text-green-800">{action.firstStep}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
