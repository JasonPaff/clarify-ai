"use client";

import { Check } from "lucide-react";
import { Fragment } from "react";

import { cn } from "@/lib/utils";

interface Step {
  description: string;
  id: string;
  title: string;
}

export const WORKFLOW_STEPS: Array<Step> = [
  {
    description: "Describe your feature idea",
    id: "entry",
    title: "Entry",
  },
  {
    description: "Clarify and expand requirements",
    id: "refine",
    title: "Refine",
  },
  {
    description: "Analyze codebase context",
    id: "research",
    title: "Research",
  },
  {
    description: "Generate implementation plan",
    id: "plan",
    title: "Plan",
  },
];

interface WorkflowStepsProps {
  currentStep: string;
  onStepClick?: (stepId: string) => void;
}

export function WorkflowSteps({
  currentStep,
  onStepClick,
}: WorkflowStepsProps) {
  const currentIndex = WORKFLOW_STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div className={"flex items-center justify-between"}>
      {WORKFLOW_STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = step.id === currentStep;
        const isClickable = onStepClick && (isCompleted || isCurrent);

        return (
          <Fragment key={step.id}>
            <button
              className={cn(
                "flex flex-col items-center text-center",
                isClickable && "cursor-pointer",
                !isClickable && "cursor-default"
              )}
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick?.(step.id)}
              type={"button"}
            >
              {/* Step indicator */}
              <div
                className={cn(
                  `
                    flex size-10 items-center justify-center rounded-full
                    border-2 text-sm font-medium transition-colors
                  `,
                  isCompleted &&
                    "border-accent bg-accent text-accent-foreground",
                  isCurrent && "border-accent bg-background text-accent",
                  !isCompleted &&
                    !isCurrent &&
                    "border-border bg-background text-muted-foreground"
                )}
              >
                {isCompleted ? <Check className={"size-5"} /> : index + 1}
              </div>

              {/* Step label */}
              <span
                className={cn(
                  "mt-2 text-sm font-medium",
                  isCurrent && "text-foreground",
                  !isCurrent && "text-muted-foreground"
                )}
              >
                {step.title}
              </span>
              <span className={"mt-0.5 text-xs text-muted-foreground"}>
                {step.description}
              </span>
            </button>

            {/* Connector line */}
            {index < WORKFLOW_STEPS.length - 1 && (
              <div
                className={cn(
                  "mx-2 h-0.5 flex-1",
                  index < currentIndex ? "bg-accent" : "bg-border"
                )}
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
