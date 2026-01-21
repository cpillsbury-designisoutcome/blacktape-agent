'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Scenario } from '@/types';

interface ScenariosProps {
  scenarios: Scenario[];
}

export function Scenarios({ scenarios }: ScenariosProps) {
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>(
    scenarios.filter((s) => s.isBaseline).map((s) => s.id)
  );

  const toggleScenario = (id: string) => {
    setSelectedScenarios((prev) =>
      prev.includes(id)
        ? prev.filter((sid) => sid !== id)
        : [...prev, id]
    );
  };

  const selectedData = scenarios.filter((s) => selectedScenarios.includes(s.id));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scenario Comparison</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap gap-2">
          {scenarios.map((scenario) => (
            <Button
              key={scenario.id}
              variant={selectedScenarios.includes(scenario.id) ? 'primary' : 'outline'}
              size="sm"
              onClick={() => toggleScenario(scenario.id)}
            >
              {scenario.name}
              {scenario.isBaseline && (
                <Badge variant="info" className="ml-2">
                  Baseline
                </Badge>
              )}
            </Button>
          ))}
        </div>

        {selectedData.length === 0 ? (
          <p className="text-blacktape-500 text-center py-8">
            Select scenarios to compare
          </p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {selectedData.map((scenario) => (
              <div
                key={scenario.id}
                className="border border-blacktape-200 rounded-lg p-4 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-blacktape-900">
                    {scenario.name}
                  </h4>
                  {scenario.isBaseline && (
                    <Badge variant="info">Baseline</Badge>
                  )}
                </div>

                <p className="text-sm text-blacktape-600">{scenario.description}</p>

                {scenario.changes.length > 0 && (
                  <div>
                    <h5 className="text-xs font-semibold text-blacktape-500 uppercase mb-2">
                      Changes
                    </h5>
                    <ul className="text-sm text-blacktape-700 space-y-1">
                      {scenario.changes.map((change, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-blacktape-400">•</span>
                          {change}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-xs font-semibold text-green-600 uppercase mb-2">
                      Benefits
                    </h5>
                    <ul className="text-sm text-blacktape-700 space-y-1">
                      {scenario.predictedBenefits.map((benefit, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-green-500">+</span>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-xs font-semibold text-red-600 uppercase mb-2">
                      Risks
                    </h5>
                    <ul className="text-sm text-blacktape-700 space-y-1">
                      {scenario.predictedRisks.map((risk, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-red-500">-</span>
                          {risk}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {scenario.secondOrderEffects.length > 0 && (
                  <div>
                    <h5 className="text-xs font-semibold text-blacktape-500 uppercase mb-2">
                      Second-Order Effects
                    </h5>
                    <ul className="text-sm text-blacktape-600 space-y-1">
                      {scenario.secondOrderEffects.map((effect, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-blacktape-400">→</span>
                          {effect}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {scenario.validationsNeeded.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                    <h5 className="text-xs font-semibold text-yellow-700 uppercase mb-2">
                      Validations Needed
                    </h5>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      {scenario.validationsNeeded.map((validation, i) => (
                        <li key={i}>• {validation}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
