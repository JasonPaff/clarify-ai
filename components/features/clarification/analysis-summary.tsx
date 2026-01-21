'use client';

import { ChevronDown, FileText, ListChecks, MessageCircleQuestion, Target } from 'lucide-react';

import type { ClarificationAnalysis } from '@/lib/validations/clarification';

import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

type AnalysisSummaryProps = ClassName & {
  analysis: ClarificationAnalysis;
  defaultOpen?: boolean;
  isLoading?: boolean;
  onRequestOverride?: () => void;
};

/**
 * Collapsible section displaying AI analysis findings.
 * Optionally shows an override button for high detail scores.
 */
export const AnalysisSummary = ({
  analysis,
  className,
  defaultOpen = true,
  isLoading = false,
  onRequestOverride,
}: AnalysisSummaryProps) => {
  const scoreLabel = getScoreLabel(analysis.detailScore);
  const scoreColor = getScoreColor(analysis.detailScore);

  const hasAmbiguities = analysis.ambiguities && analysis.ambiguities.length > 0;
  const hasAffectedAreas = analysis.affectedAreas && analysis.affectedAreas.length > 0;
  const isHighDetailScore = analysis.detailScore >= 4;
  const isShowOverrideButton = isHighDetailScore && onRequestOverride;

  return (
    <Collapsible className={className} defaultOpen={defaultOpen}>
      <CollapsibleTrigger
        className={cn(
          'flex w-full items-center justify-between rounded-md border border-border bg-card p-3 text-left',
          'transition-colors hover:bg-muted/50'
        )}
        isHideChevron
      >
        <div className={'flex items-center gap-3'}>
          <FileText className={'size-4 text-muted-foreground'} />
          <span className={'text-sm font-medium'}>Analysis Summary</span>
          <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', scoreColor)}>
            Detail Score: {analysis.detailScore}/5 ({scoreLabel})
          </span>
        </div>
        <ChevronDown className={'size-4 text-muted-foreground transition-transform in-data-panel-open:rotate-180'} />
      </CollapsibleTrigger>

      <CollapsibleContent className={'mt-2'}>
        <div className={'space-y-3 rounded-md border border-border bg-card p-4'}>
          {/* Summary */}
          <div>
            <h4 className={'mb-1 text-sm font-medium'}>Summary</h4>
            <p className={'text-sm text-muted-foreground'}>{analysis.summary}</p>
          </div>

          {/* Reasoning */}
          {analysis.reasoning && (
            <div>
              <h4 className={'mb-1 flex items-center gap-1.5 text-sm font-medium'}>
                <Target className={'size-3.5'} />
                Reasoning
              </h4>
              <p className={'text-sm text-muted-foreground'}>{analysis.reasoning}</p>
            </div>
          )}

          {/* Ambiguities */}
          {hasAmbiguities && analysis.ambiguities && (
            <div>
              <h4 className={'mb-1 flex items-center gap-1.5 text-sm font-medium'}>
                <ListChecks className={'size-3.5'} />
                Ambiguities Identified
              </h4>
              <ul className={'list-inside list-disc space-y-0.5 text-sm text-muted-foreground'}>
                {analysis.ambiguities.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Affected Areas */}
          {hasAffectedAreas && analysis.affectedAreas && (
            <div>
              <h4 className={'mb-1 text-sm font-medium'}>Potentially Affected Areas</h4>
              <div className={'flex flex-wrap gap-1.5'}>
                {analysis.affectedAreas.map((area, index) => (
                  <span className={'rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground'} key={index}>
                    {area}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Override Option for High Detail Scores */}
          {isShowOverrideButton && (
            <div className={'border-t border-border pt-3'}>
              <div className={'flex items-center justify-between gap-3'}>
                <p className={'text-sm text-muted-foreground'}>
                  Your request has sufficient detail. Still want clarification?
                </p>
                <Button disabled={isLoading} onClick={onRequestOverride} size={'sm'} variant={'outline'}>
                  <MessageCircleQuestion className={'mr-1.5 size-3.5'} />
                  Request Clarification Anyway
                </Button>
              </div>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

function getScoreColor(score: number): string {
  switch (score) {
    case 1:
    case 2:
      return 'bg-destructive/10 text-destructive';
    case 3:
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
    case 4:
    case 5:
      return 'bg-green-500/10 text-green-600 dark:text-green-400';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

function getScoreLabel(score: number): string {
  switch (score) {
    case 1:
      return 'Very Vague';
    case 2:
      return 'Basic';
    case 3:
      return 'Moderate';
    case 4:
      return 'Good';
    case 5:
      return 'Excellent';
    default:
      return 'Unknown';
  }
}
