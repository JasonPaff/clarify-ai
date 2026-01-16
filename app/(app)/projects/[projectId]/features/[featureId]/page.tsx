"use client";

import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Lightbulb,
  Search,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { type ReactNode, use, useState } from "react";

import { WorkflowSteps } from "@/components/features/workflow-steps";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IconButton } from "@/components/ui/icon-button";
import { Separator } from "@/components/ui/separator";
import { Tooltip } from "@/components/ui/tooltip";

interface FeatureWorkflowPageProps {
  params: Promise<{ featureId: string; projectId: string }>;
}

const STEP_ORDER = ["entry", "refine", "research", "plan"] as const;

type StepId = (typeof STEP_ORDER)[number];

export default function FeatureWorkflowPage({
  params,
}: FeatureWorkflowPageProps) {
  const { featureId, projectId } = use(params);
  const [currentStep, setCurrentStep] = useState<StepId>("entry");

  // This will be replaced with actual feature data
  const featureName = `Feature ${featureId}`;

  const currentIndex = STEP_ORDER.indexOf(currentStep);
  const canGoBack = currentIndex > 0;
  const canGoNext = currentIndex < STEP_ORDER.length - 1;

  const handleGoBack = () => {
    if (canGoBack) {
      setCurrentStep(STEP_ORDER[currentIndex - 1] as StepId);
    }
  };

  const handleGoNext = () => {
    if (canGoNext) {
      setCurrentStep(STEP_ORDER[currentIndex + 1] as StepId);
    }
  };

  const stepContent: Record<
    StepId,
    { description: string; icon: ReactNode; title: string }
  > = {
    entry: {
      description:
        "Describe your feature idea in plain language. Be as detailed or brief as you like - the AI will help refine it.",
      icon: <Lightbulb className={"size-6"} />,
      title: "Describe Your Feature",
    },
    plan: {
      description:
        "Review the generated implementation plan with specific files, code changes, and testing strategies.",
      icon: <FileText className={"size-6"} />,
      title: "Implementation Plan",
    },
    refine: {
      description:
        "Work with AI to clarify requirements, identify edge cases, and expand on your initial idea.",
      icon: <Sparkles className={"size-6"} />,
      title: "Refine Requirements",
    },
    research: {
      description:
        "AI analyzes your connected repositories to understand the codebase context and identify relevant patterns.",
      icon: <Search className={"size-6"} />,
      title: "Codebase Research",
    },
  };

  const current = stepContent[currentStep];

  return (
    <div className={"space-y-6"}>
      {/* Header */}
      <div className={"flex items-center gap-3"}>
        <Tooltip content={"Back to features"} side={"right"}>
          <Link href={`/projects/${projectId}/features`}>
            <IconButton>
              <ArrowLeft className={"size-4"} />
            </IconButton>
          </Link>
        </Tooltip>
        <div>
          <h1 className={"text-xl font-semibold"}>{featureName}</h1>
          <p className={"text-sm text-muted-foreground"}>Feature workflow</p>
        </div>
      </div>

      <Separator />

      {/* Workflow Steps */}
      <div className={"py-2"}>
        <WorkflowSteps
          currentStep={currentStep}
          onStepClick={(stepId) => setCurrentStep(stepId as StepId)}
        />
      </div>

      <Separator />

      {/* Step Content */}
      <Card>
        <CardHeader>
          <div className={"flex items-center gap-3"}>
            <div
              className={`
                flex size-12 items-center justify-center rounded-lg bg-accent/10
              `}
            >
              <div className={"text-accent"}>{current.icon}</div>
            </div>
            <div>
              <CardTitle>{current.title}</CardTitle>
              <CardDescription>{current.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div
            className={`
              min-h-75 rounded-lg border border-dashed border-border p-8
              text-center
            `}
          >
            <p className={"text-sm text-muted-foreground"}>
              {currentStep.charAt(0).toUpperCase() + currentStep.slice(1)} step
              content coming soon
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className={"flex items-center justify-between"}>
        <Button
          disabled={!canGoBack}
          onClick={handleGoBack}
          variant={"outline"}
        >
          <ArrowLeft className={"size-4"} />
          Previous
        </Button>
        <span className={"text-sm text-muted-foreground"}>
          Step {currentIndex + 1} of {STEP_ORDER.length}
        </span>
        <Button disabled={!canGoNext} onClick={handleGoNext}>
          Next
          <ArrowRight className={"size-4"} />
        </Button>
      </div>
    </div>
  );
}
