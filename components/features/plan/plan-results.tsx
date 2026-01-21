'use client';

import type { ComponentPropsWithRef } from 'react';

import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Download,
  FlaskConical,
  RefreshCw,
  Shield,
  Terminal,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import type { ImplementationPlan, PlanStep, QualityGates } from '@/lib/validations/plan';

import { PlanStepCard } from '@/components/features/plan/plan-step-card';
import { QualityGateList } from '@/components/features/plan/quality-gate-list';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { TabsIndicator, TabsList, TabsPanel, TabsRoot, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface PlanResultsProps extends ComponentPropsWithRef<'div'> {
  /** Callback when edit is requested for a specific step */
  onEditStep?: (stepIndex: number) => void;
  /** Callback when export action is triggered */
  onExport?: () => void;
  /** Callback when regenerate action is triggered */
  onRegenerate?: () => void;
  /** The complete implementation plan to display */
  plan: ImplementationPlan;
}

/**
 * Displays the complete generated implementation plan with navigation, editing, and export capabilities.
 * Shows plan header, prerequisites, steps with navigation, risks, and testing strategy.
 */
export const PlanResults = ({
  className,
  onEditStep,
  onExport,
  onRegenerate,
  plan,
  ref,
  ...props
}: PlanResultsProps) => {
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  const { overview, prerequisites, risks, steps, summary, testingStrategy } = plan;

  // Derived conditions
  const hasSteps = steps && steps.length > 0;
  const hasPrerequisites = prerequisites && prerequisites.length > 0;
  const hasRisks = risks && risks.length > 0;
  const hasTestingStrategy = testingStrategy !== undefined;
  const hasHighRiskItems = risks?.some((risk) => risk.level === 'high') ?? false;
  const hasUnitTests = testingStrategy?.unitTests && testingStrategy.unitTests.length > 0;
  const hasTestCommands = testingStrategy?.commands && testingStrategy.commands.length > 0;

  // Current step information
  const currentStep: PlanStep | undefined = hasSteps ? steps[activeStepIndex] : undefined;
  const isFirstStep = activeStepIndex === 0;
  const isLastStep = activeStepIndex === steps.length - 1;

  // Compute statistics
  const statistics = useMemo(() => {
    if (!hasSteps) {
      return { byComplexity: { high: 0, low: 0, medium: 0 }, totalFiles: 0, totalSteps: 0 };
    }

    const byComplexity = { high: 0, low: 0, medium: 0 };
    let totalFiles = 0;

    for (const step of steps) {
      byComplexity[step.complexity]++;
      totalFiles += step.files?.length ?? 0;
    }

    return { byComplexity, totalFiles, totalSteps: steps.length };
  }, [hasSteps, steps]);

  // Collect all quality gates from all steps for the overview
  const allQualityGates: QualityGates = useMemo(() => {
    if (!hasSteps) return [];

    const gates: QualityGates = [];
    for (const step of steps) {
      if (step.qualityGates) {
        gates.push(...step.qualityGates);
      }
    }
    return gates;
  }, [hasSteps, steps]);

  const hasOverallQualityGates = allQualityGates.length > 0;

  /**
   * Navigate to previous step
   */
  const handlePreviousStep = useCallback(() => {
    if (!isFirstStep) {
      setActiveStepIndex((prev) => prev - 1);
    }
  }, [isFirstStep]);

  /**
   * Navigate to next step
   */
  const handleNextStep = useCallback(() => {
    if (!isLastStep) {
      setActiveStepIndex((prev) => prev + 1);
    }
  }, [isLastStep]);

  /**
   * Navigate to specific step by index
   */
  const handleStepSelect = useCallback((index: number) => {
    setActiveStepIndex(index);
  }, []);

  /**
   * Handle edit step
   */
  const handleEditStep = useCallback(
    (index: number) => {
      onEditStep?.(index);
    },
    [onEditStep]
  );

  /**
   * Handle export action
   */
  const handleExportClick = useCallback(() => {
    onExport?.();
  }, [onExport]);

  /**
   * Handle regenerate action
   */
  const handleRegenerateClick = useCallback(() => {
    onRegenerate?.();
  }, [onRegenerate]);

  // Show empty state if no steps
  if (!hasSteps) {
    return (
      <div className={cn('rounded-md border border-border bg-background p-6', className)} ref={ref} {...props}>
        <EmptyState
          description={'The implementation plan has no steps defined. Try regenerating the plan.'}
          icon={<ClipboardList className={'size-6'} />}
          title={'No Implementation Steps'}
        />
      </div>
    );
  }

  return (
    <div className={cn('rounded-md border border-border bg-background', className)} ref={ref} {...props}>
      {/* Header Section */}
      <div className={'border-b border-border p-4'}>
        <div className={'flex items-start justify-between gap-4'}>
          {/* Title and Summary */}
          <div className={'min-w-0 flex-1'}>
            <div className={'flex items-center gap-2'}>
              <ClipboardList aria-hidden={'true'} className={'size-5 text-accent'} />
              <h3 className={'text-lg font-semibold text-foreground'}>Implementation Plan</h3>
            </div>
            <p className={'mt-1 text-sm text-muted-foreground'}>{summary}</p>
          </div>

          {/* Action Buttons */}
          <div className={'flex shrink-0 items-center gap-2'}>
            {onExport && (
              <Button onClick={handleExportClick} size={'sm'} variant={'outline'}>
                <Download aria-hidden={'true'} className={'mr-2 size-4'} />
                Export
              </Button>
            )}
            {onRegenerate && (
              <Button onClick={handleRegenerateClick} size={'sm'} variant={'outline'}>
                <RefreshCw aria-hidden={'true'} className={'mr-2 size-4'} />
                Regenerate
              </Button>
            )}
          </div>
        </div>

        {/* Statistics Summary */}
        <div className={'mt-4 flex flex-wrap items-center gap-4'}>
          {/* Steps Count */}
          <div className={'flex items-center gap-1.5'}>
            <span className={'text-xs text-muted-foreground'}>Steps:</span>
            <Badge size={'sm'} variant={'default'}>
              {statistics.totalSteps}
            </Badge>
          </div>

          {/* Files Count */}
          <div className={'flex items-center gap-1.5'}>
            <span className={'text-xs text-muted-foreground'}>Files:</span>
            <Badge size={'sm'} variant={'default'}>
              {statistics.totalFiles}
            </Badge>
          </div>

          {/* Complexity Breakdown */}
          <div className={'flex items-center gap-1.5'}>
            <span className={'text-xs text-muted-foreground'}>Complexity:</span>
            <div className={'flex gap-1'}>
              {statistics.byComplexity.low > 0 && (
                <span
                  className={
                    'inline-flex items-center rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-500/20 dark:text-green-400'
                  }
                >
                  {statistics.byComplexity.low} low
                </span>
              )}
              {statistics.byComplexity.medium > 0 && (
                <span
                  className={
                    'inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                  }
                >
                  {statistics.byComplexity.medium} medium
                </span>
              )}
              {statistics.byComplexity.high > 0 && (
                <span
                  className={
                    'inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-500/20 dark:text-red-400'
                  }
                >
                  <AlertTriangle aria-hidden={'true'} className={'size-3'} />
                  {statistics.byComplexity.high} high
                </span>
              )}
            </div>
          </div>

          {/* Confidence Score */}
          {plan.confidence !== undefined && (
            <div className={'flex items-center gap-1.5'}>
              <span className={'text-xs text-muted-foreground'}>Confidence:</span>
              <Badge
                size={'sm'}
                variant={plan.confidence >= 80 ? 'completed' : plan.confidence >= 50 ? 'clarifying' : 'failed'}
              >
                {plan.confidence}%
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Tabs for Sections */}
      <TabsRoot defaultValue={'overview'}>
        <TabsList className={'px-4'}>
          <TabsTrigger value={'overview'}>Overview</TabsTrigger>
          <TabsTrigger value={'steps'}>Steps ({statistics.totalSteps})</TabsTrigger>
          {hasRisks && <TabsTrigger value={'risks'}>Risks ({risks.length})</TabsTrigger>}
          {hasTestingStrategy && <TabsTrigger value={'testing'}>Testing</TabsTrigger>}
          {hasOverallQualityGates && <TabsTrigger value={'quality'}>Quality Gates</TabsTrigger>}
          <TabsIndicator />
        </TabsList>

        {/* Overview Tab */}
        <TabsPanel className={'p-4'} value={'overview'}>
          <div className={'space-y-4'}>
            {/* Overview Text */}
            <div>
              <h4 className={'text-sm font-medium text-foreground'}>Overview</h4>
              <p className={'mt-2 max-w-none text-sm/relaxed text-muted-foreground'}>{overview}</p>
            </div>

            {/* Prerequisites Section */}
            {hasPrerequisites && (
              <div>
                <h4 className={'text-sm font-medium text-foreground'}>Prerequisites</h4>
                <ul className={'mt-2 list-inside list-disc space-y-1'}>
                  {prerequisites.map((prerequisite, index) => (
                    <li className={'text-sm text-muted-foreground'} key={index}>
                      {prerequisite}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Model Info */}
            {plan.modelUsed && (
              <div className={'flex items-center gap-2 text-xs text-muted-foreground'}>
                <span>Generated by:</span>
                <Badge size={'sm'} variant={'default'}>
                  {plan.modelUsed}
                </Badge>
              </div>
            )}
          </div>
        </TabsPanel>

        {/* Steps Tab */}
        <TabsPanel className={'p-4'} value={'steps'}>
          <div className={'space-y-4'}>
            {/* Step Navigation Header */}
            <div className={'flex items-center justify-between'}>
              {/* Step Selector Sidebar */}
              <div className={'flex flex-wrap gap-1'}>
                {steps.map((_, index) => (
                  <button
                    aria-current={index === activeStepIndex ? 'step' : undefined}
                    aria-label={`Go to step ${index + 1}`}
                    className={cn(
                      'flex size-8 items-center justify-center rounded-md text-xs font-medium transition-colors',
                      'hover:bg-muted',
                      'focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none',
                      index === activeStepIndex
                        ? 'bg-accent text-accent-foreground'
                        : 'bg-muted/50 text-muted-foreground'
                    )}
                    key={index}
                    onClick={() => handleStepSelect(index)}
                    type={'button'}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              {/* Previous/Next Navigation */}
              <div className={'flex items-center gap-2'}>
                <Button disabled={isFirstStep} onClick={handlePreviousStep} size={'sm'} variant={'outline'}>
                  <ChevronLeft aria-hidden={'true'} className={'mr-1 size-4'} />
                  Previous
                </Button>
                <Button disabled={isLastStep} onClick={handleNextStep} size={'sm'} variant={'outline'}>
                  Next
                  <ChevronRight aria-hidden={'true'} className={'ml-1 size-4'} />
                </Button>
              </div>
            </div>

            {/* Current Step Card */}
            {currentStep && (
              <PlanStepCard
                onEdit={onEditStep ? () => handleEditStep(activeStepIndex) : undefined}
                step={currentStep}
                stepNumber={activeStepIndex + 1}
              />
            )}

            {/* Step Progress Indicator */}
            <div className={'flex items-center justify-center gap-2 text-xs text-muted-foreground'}>
              <span>
                Step {activeStepIndex + 1} of {statistics.totalSteps}
              </span>
            </div>
          </div>
        </TabsPanel>

        {/* Risks Tab */}
        {hasRisks && (
          <TabsPanel className={'p-4'} value={'risks'}>
            <div className={'space-y-3'}>
              {/* High Risk Warning */}
              {hasHighRiskItems && (
                <Alert variant={'warning'}>
                  <AlertTriangle aria-hidden={'true'} className={'size-4'} />
                  <div>
                    <AlertTitle>High Risk Items Detected</AlertTitle>
                    <AlertDescription>
                      This plan contains high-risk items that require careful attention during implementation.
                    </AlertDescription>
                  </div>
                </Alert>
              )}

              {/* Risk List */}
              <div className={'space-y-2'}>
                {risks.map((risk, index) => (
                  <div
                    className={cn(
                      'rounded-md border border-border p-3',
                      risk.level === 'high' && 'border-red-500/50 bg-red-500/5',
                      risk.level === 'medium' && 'border-amber-500/50 bg-amber-500/5',
                      risk.level === 'low' && 'border-green-500/50 bg-green-500/5'
                    )}
                    key={index}
                  >
                    <div className={'flex items-start gap-2'}>
                      <Shield
                        aria-hidden={'true'}
                        className={cn(
                          'mt-0.5 size-4 shrink-0',
                          risk.level === 'high' && 'text-red-600 dark:text-red-400',
                          risk.level === 'medium' && 'text-amber-600 dark:text-amber-400',
                          risk.level === 'low' && 'text-green-600 dark:text-green-400',
                          !risk.level && 'text-muted-foreground'
                        )}
                      />
                      <div className={'min-w-0 flex-1'}>
                        <div className={'flex items-center gap-2'}>
                          <p className={'text-sm font-medium text-foreground'}>{risk.description}</p>
                          {risk.level && (
                            <Badge
                              size={'sm'}
                              variant={
                                risk.level === 'high' ? 'failed' : risk.level === 'medium' ? 'clarifying' : 'completed'
                              }
                            >
                              {risk.level}
                            </Badge>
                          )}
                        </div>
                        {risk.mitigation && (
                          <p className={'mt-1 text-sm text-muted-foreground'}>
                            <strong>Mitigation:</strong> {risk.mitigation}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsPanel>
        )}

        {/* Testing Tab */}
        {hasTestingStrategy && testingStrategy && (
          <TabsPanel className={'p-4'} value={'testing'}>
            <div className={'space-y-4'}>
              {/* Testing Description */}
              <div className={'flex items-start gap-3'}>
                <FlaskConical aria-hidden={'true'} className={'mt-0.5 size-5 text-accent'} />
                <div>
                  <h4 className={'text-sm font-medium text-foreground'}>Testing Strategy</h4>
                  <p className={'mt-1 max-w-none text-sm/relaxed text-muted-foreground'}>
                    {testingStrategy.description}
                  </p>
                </div>
              </div>

              {/* Unit Tests */}
              {hasUnitTests && testingStrategy.unitTests && (
                <div>
                  <h5 className={'flex items-center gap-2 text-sm font-medium text-foreground'}>
                    <CheckCircle2 aria-hidden={'true'} className={'size-4 text-green-600 dark:text-green-400'} />
                    Unit Tests
                  </h5>
                  <ul className={'mt-2 list-inside list-disc space-y-1'}>
                    {testingStrategy.unitTests.map((test, index) => (
                      <li className={'text-sm text-muted-foreground'} key={index}>
                        {test}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Test Commands */}
              {hasTestCommands && testingStrategy.commands && (
                <div>
                  <h5 className={'flex items-center gap-2 text-sm font-medium text-foreground'}>
                    <Terminal aria-hidden={'true'} className={'size-4 text-blue-600 dark:text-blue-400'} />
                    Test Commands
                  </h5>
                  <div className={'mt-2 space-y-1'}>
                    {testingStrategy.commands.map((command, index) => (
                      <code
                        className={'block rounded-sm bg-muted px-2 py-1.5 font-mono text-xs text-foreground'}
                        key={index}
                      >
                        {command}
                      </code>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsPanel>
        )}

        {/* Quality Gates Tab */}
        {hasOverallQualityGates && (
          <TabsPanel className={'p-4'} value={'quality'}>
            <QualityGateList qualityGates={allQualityGates} />
          </TabsPanel>
        )}
      </TabsRoot>
    </div>
  );
};
