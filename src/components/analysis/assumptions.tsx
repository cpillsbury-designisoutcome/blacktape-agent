'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Assumption, Unknown } from '@/types';

interface AssumptionsProps {
  assumptions: Assumption[];
  unknowns: Unknown[];
}

export function Assumptions({ assumptions, unknowns }: AssumptionsProps) {
  const getConfidenceVariant = (confidence: string) => {
    switch (confidence) {
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

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'danger';
      case 'medium':
        return 'warning';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Assumptions Register</CardTitle>
        </CardHeader>
        <CardContent>
          {assumptions.length === 0 ? (
            <p className="text-blacktape-500 text-center py-6">
              No assumptions documented yet
            </p>
          ) : (
            <div className="space-y-4">
              {assumptions.map((assumption) => (
                <div
                  key={assumption.id}
                  className="border border-blacktape-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-mono text-blacktape-500">
                          {assumption.id}
                        </span>
                        <Badge variant={getConfidenceVariant(assumption.confidence) as 'success' | 'warning' | 'danger' | 'default'}>
                          {assumption.confidence} confidence
                        </Badge>
                        <Badge variant="default">{assumption.category}</Badge>
                      </div>
                      <p className="text-blacktape-800 font-medium">
                        {assumption.statement}
                      </p>
                      <p className="text-sm text-blacktape-600 mt-2">
                        <span className="font-semibold">Rationale:</span>{' '}
                        {assumption.rationale}
                      </p>
                      {assumption.validationNeeded && (
                        <p className="text-sm text-yellow-700 mt-2 bg-yellow-50 p-2 rounded">
                          <span className="font-semibold">Validation Needed:</span>{' '}
                          {assumption.validationNeeded}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Unknowns / Missing Inputs</CardTitle>
        </CardHeader>
        <CardContent>
          {unknowns.length === 0 ? (
            <p className="text-blacktape-500 text-center py-6">
              No unknowns identified
            </p>
          ) : (
            <div className="space-y-4">
              {unknowns.map((unknown) => (
                <div
                  key={unknown.id}
                  className="border border-red-200 bg-red-50 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-mono text-blacktape-500">
                          {unknown.id}
                        </span>
                        <Badge variant={getPriorityVariant(unknown.priority) as 'danger' | 'warning' | 'default'}>
                          {unknown.priority} priority
                        </Badge>
                      </div>
                      <p className="text-blacktape-800 font-medium">
                        {unknown.description}
                      </p>
                      <p className="text-sm text-blacktape-600 mt-2">
                        <span className="font-semibold">Impact:</span>{' '}
                        {unknown.impact}
                      </p>
                      {unknown.dataToHarvest && (
                        <p className="text-sm text-blue-700 mt-2 bg-blue-50 p-2 rounded">
                          <span className="font-semibold">Data to Harvest:</span>{' '}
                          {unknown.dataToHarvest}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
