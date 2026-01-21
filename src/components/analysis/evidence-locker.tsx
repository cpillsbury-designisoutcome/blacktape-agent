'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { EvidenceEntry } from '@/types';
import { getEvidenceTypeLabel, getEvidenceTypeColor } from '@/lib/utils';

interface EvidenceLockerProps {
  entries: EvidenceEntry[];
}

const categories = [
  'all',
  'financial',
  'operational',
  'stakeholder',
  'precedent',
  'regulatory',
  'technical',
] as const;

export function EvidenceLocker({ entries }: EvidenceLockerProps) {
  const [filter, setFilter] = useState<string>('all');

  const filteredEntries =
    filter === 'all'
      ? entries
      : entries.filter((e) => e.category === filter);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evidence Locker</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={filter === category ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilter(category)}
            >
              {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
            </Button>
          ))}
        </div>

        {filteredEntries.length === 0 ? (
          <p className="text-blacktape-500 text-center py-8">
            No evidence entries found
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-blacktape-200">
                  <th className="text-left py-3 px-4 font-semibold text-blacktape-600">
                    Claim
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-blacktape-600">
                    Source Type
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-blacktape-600">
                    Provenance
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-blacktape-600">
                    Category
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-blacktape-100 hover:bg-blacktape-50"
                  >
                    <td className="py-3 px-4">
                      <p className="text-blacktape-800">{entry.claim}</p>
                      {entry.notes && (
                        <p className="text-xs text-blacktape-500 mt-1">
                          {entry.notes}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={getEvidenceTypeColor(entry.sourceType)}>
                        {getEvidenceTypeLabel(entry.sourceType)}
                      </Badge>
                      {entry.sourceTier && (
                        <span className="block text-xs text-blacktape-500 mt-1">
                          {entry.sourceTier.replace('-', ' ').toUpperCase()}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-blacktape-700">{entry.provenance}</p>
                      {entry.link && (
                        <a
                          href={entry.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          View Source
                        </a>
                      )}
                      {entry.publishDate && (
                        <span className="block text-xs text-blacktape-500">
                          {entry.publishDate}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="default">{entry.category}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
