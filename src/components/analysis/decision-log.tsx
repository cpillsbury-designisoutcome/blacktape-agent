'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { DecisionLogEntry } from '@/types';
import { formatDate } from '@/lib/utils';

interface DecisionLogProps {
  entries: DecisionLogEntry[];
}

export function DecisionLog({ entries }: DecisionLogProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Decision Log</CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-blacktape-500 text-center py-6">
            No decisions logged yet
          </p>
        ) : (
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-blacktape-200"></div>
            <div className="space-y-6">
              {entries.map((entry, index) => (
                <div key={index} className="relative pl-10">
                  <div className="absolute left-2 w-5 h-5 rounded-full bg-blacktape-900 border-4 border-white flex items-center justify-center">
                    <span className="text-[10px] text-white font-bold">
                      {entry.version.split('.')[1] || index}
                    </span>
                  </div>
                  <div className="bg-blacktape-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-sm text-blacktape-600">
                        v{entry.version}
                      </span>
                      <span className="text-xs text-blacktape-500">
                        {formatDate(entry.timestamp)}
                      </span>
                    </div>
                    <p className="text-blacktape-800 font-medium">
                      {entry.changeSummary}
                    </p>
                    <p className="text-sm text-blacktape-600 mt-1">
                      <span className="font-semibold">Reason:</span> {entry.reason}
                    </p>
                    {entry.author && (
                      <p className="text-xs text-blacktape-500 mt-2">
                        By: {entry.author}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
