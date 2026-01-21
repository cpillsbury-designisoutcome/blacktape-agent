'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { EthicsCheck as EthicsCheckType } from '@/types';

interface EthicsCheckProps {
  ethics: EthicsCheckType;
}

export function EthicsCheck({ ethics }: EthicsCheckProps) {
  const getRiskVariant = (level: string) => {
    switch (level) {
      case 'high':
        return 'danger';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getClarityVariant = (level: string) => {
    switch (level) {
      case 'clear':
        return 'success';
      case 'partial':
        return 'warning';
      case 'unclear':
        return 'danger';
      default:
        return 'default';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ethics & Governance Check</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-blacktape-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-blacktape-700">Bias Risk</h4>
              <Badge variant={getRiskVariant(ethics.biasRisk.level) as 'danger' | 'warning' | 'success' | 'default'}>
                {ethics.biasRisk.level}
              </Badge>
            </div>
            <p className="text-sm text-blacktape-600">{ethics.biasRisk.notes}</p>
          </div>

          <div className="border border-blacktape-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-blacktape-700">Overreliance Risk</h4>
              <Badge variant={getRiskVariant(ethics.overrelianceRisk.level) as 'danger' | 'warning' | 'success' | 'default'}>
                {ethics.overrelianceRisk.level}
              </Badge>
            </div>
            <p className="text-sm text-blacktape-600">
              {ethics.overrelianceRisk.notes}
            </p>
          </div>

          <div className="border border-blacktape-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-blacktape-700">Dual-Use Risk</h4>
              <Badge variant={getRiskVariant(ethics.dualUseRisk.level) as 'danger' | 'warning' | 'success' | 'default'}>
                {ethics.dualUseRisk.level}
              </Badge>
            </div>
            <p className="text-sm text-blacktape-600">{ethics.dualUseRisk.notes}</p>
          </div>

          <div className="border border-blacktape-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-blacktape-700">
                Accountability Clarity
              </h4>
              <Badge variant={getClarityVariant(ethics.accountabilityClarity.level) as 'success' | 'warning' | 'danger' | 'default'}>
                {ethics.accountabilityClarity.level}
              </Badge>
            </div>
            <p className="text-sm text-blacktape-600">
              {ethics.accountabilityClarity.notes}
            </p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">Purpose Limits</h4>
          <p className="text-sm text-blue-700">{ethics.purposeLimits}</p>
        </div>

        {ethics.requiredReviews.length > 0 && (
          <div>
            <h4 className="font-semibold text-blacktape-700 mb-2">
              Required SME Reviews
            </h4>
            <ul className="list-disc list-inside text-sm text-blacktape-600 space-y-1">
              {ethics.requiredReviews.map((review, index) => (
                <li key={index}>{review}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-800 mb-2">
            Human Decision Reminder
          </h4>
          <p className="text-sm text-yellow-700">{ethics.humanDecideReminder}</p>
        </div>
      </CardContent>
    </Card>
  );
}
