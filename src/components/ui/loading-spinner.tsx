'use client';

import { cn } from '@/lib/utils';
import { ALL_SECTIONS, SECTION_LABELS, type AnalysisSection } from '@/lib/progressive-parser';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  message?: string;
  subMessage?: string;
}

export function LoadingSpinner({
  size = 'md',
  className,
  message,
  subMessage,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-4', className)}>
      <div className="relative">
        <div
          className={cn(
            'rounded-full border-4 border-blacktape-200',
            sizeClasses[size]
          )}
        />
        <div
          className={cn(
            'absolute top-0 left-0 rounded-full border-4 border-transparent border-t-blacktape-700 animate-spin',
            sizeClasses[size]
          )}
        />
      </div>
      {message && (
        <div className="text-center">
          <p className="text-blacktape-800 font-medium">{message}</p>
          {subMessage && (
            <p className="text-blacktape-500 text-sm mt-1">{subMessage}</p>
          )}
        </div>
      )}
    </div>
  );
}

interface AnalysisLoadingProps {
  className?: string;
  completedSections?: Set<AnalysisSection>;
}

export function AnalysisLoading({ className, completedSections }: AnalysisLoadingProps) {
  const completed = completedSections || new Set<AnalysisSection>();
  const completedCount = completed.size;
  const totalCount = ALL_SECTIONS.length;
  const hasStarted = completedCount > 0;

  // Find current section being worked on
  const currentSection = ALL_SECTIONS.find((s) => !completed.has(s));

  return (
    <div className={cn('flex flex-col items-center justify-center py-12', className)}>
      {/* Animated dots */}
      <div className="flex items-center gap-2 mb-6">
        <div className="w-3 h-3 bg-blacktape-700 rounded-full animate-bounce [animation-delay:-0.3s]" />
        <div className="w-3 h-3 bg-blacktape-700 rounded-full animate-bounce [animation-delay:-0.15s]" />
        <div className="w-3 h-3 bg-blacktape-700 rounded-full animate-bounce" />
      </div>

      {/* Pulsing icon */}
      <div className="relative mb-6">
        <div className="w-16 h-16 bg-blacktape-100 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-blacktape-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>
        <div className="absolute inset-0 w-16 h-16 bg-blacktape-200 rounded-full animate-ping opacity-20" />
      </div>

      {/* Main message */}
      <h3 className="text-xl font-semibold text-blacktape-900 mb-2">
        Analyzing Your Plan
      </h3>
      <p className="text-blacktape-600 text-center max-w-md mb-6">
        {hasStarted && currentSection
          ? `${SECTION_LABELS[currentSection]}...`
          : 'BlackTape is stress-testing your plan across cost, timeline, compliance, consensus, and execution dimensions.'}
      </p>

      {/* Progress bar */}
      {hasStarted && (
        <div className="w-full max-w-xs mb-6">
          <div className="h-2 bg-blacktape-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blacktape-700 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            />
          </div>
          <p className="text-xs text-blacktape-500 mt-1 text-center">
            {completedCount} of {totalCount} sections complete
          </p>
        </div>
      )}

      {/* Section status list */}
      <div className="space-y-1.5 w-full max-w-xs">
        {ALL_SECTIONS.map((section) => {
          const isCompleted = completed.has(section);
          const isCurrent = section === currentSection && hasStarted;

          return (
            <div
              key={section}
              className={cn(
                'flex items-center gap-2 text-sm transition-all duration-300',
                isCompleted
                  ? 'text-blacktape-800'
                  : isCurrent
                  ? 'text-blacktape-700'
                  : 'text-blacktape-400'
              )}
            >
              {isCompleted ? (
                <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : isCurrent ? (
                <div className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
                  <div className="w-3 h-3 border-2 border-blacktape-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-blacktape-300 rounded-full" />
                </div>
              )}
              {SECTION_LABELS[section]}
            </div>
          );
        })}
      </div>
    </div>
  );
}
