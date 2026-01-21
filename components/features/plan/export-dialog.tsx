'use client';

import type { ComponentPropsWithRef, ReactNode } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';
import { format } from 'date-fns';
import { Clipboard, FileDown, FolderOpen, Loader2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import type { ImplementationPlan } from '@/lib/validations/plan';

import { Button } from '@/components/ui/button';
import {
  DialogBackdrop,
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useElectronDialog, useElectronFs } from '@/hooks/useElectron';
import { cn } from '@/lib/utils';

/**
 * Export option types available in the dialog
 */
type ExportOption = 'clipboard' | 'docs' | 'file';

/**
 * CVA variants for export option buttons
 */
export const exportOptionVariants = cva(
  `
    flex w-full items-center gap-3 rounded-lg border border-border p-4
    text-left transition-colors
    focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0 focus-visible:outline-none
    data-disabled:pointer-events-none data-disabled:opacity-50
  `,
  {
    defaultVariants: {
      isSelected: false,
    },
    variants: {
      isSelected: {
        false: 'hover:bg-muted/50',
        true: 'border-accent bg-accent/10',
      },
    },
  }
);

interface ExportDialogProps extends ComponentPropsWithRef<'div'>, VariantProps<typeof exportOptionVariants> {
  /** The name of the feature being exported */
  featureName: string;
  /** Callback when export is completed */
  onExport?: (option: ExportOption, filePath?: string) => void;
  /** The implementation plan data to export */
  plan: ImplementationPlan;
  /** The trigger element to open the dialog */
  trigger?: ReactNode;
}

/**
 * Dialog component for exporting implementation plans to clipboard, file, or docs folder.
 */
export const ExportDialog = ({ className, featureName, onExport, plan, ref, trigger, ...props }: ExportDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportingOption, setExportingOption] = useState<ExportOption | null>(null);
  const [isShowingPreview, setIsShowingPreview] = useState(false);

  const toast = useToast();
  const { saveFile } = useElectronDialog();
  const { mkdir, writeFile } = useElectronFs();

  /**
   * Generate a slug from the feature name for file naming
   */
  const featureSlug = useMemo(() => {
    return featureName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }, [featureName]);

  /**
   * Generate formatted markdown content from the plan
   */
  const markdownContent = useMemo(() => {
    const lines: Array<string> = [];

    // Header
    lines.push(`# Implementation Plan: ${featureName}`);
    lines.push('');
    lines.push(`*Generated: ${plan.timestamp ?? format(new Date(), 'yyyy-MM-dd HH:mm:ss')}*`);
    if (plan.modelUsed) {
      lines.push(`*Model: ${plan.modelUsed}*`);
    }
    if (plan.confidence !== undefined) {
      lines.push(`*Confidence: ${plan.confidence}%*`);
    }
    lines.push('');

    // Summary
    lines.push('## Summary');
    lines.push('');
    lines.push(plan.summary);
    lines.push('');

    // Overview
    lines.push('## Overview');
    lines.push('');
    lines.push(plan.overview);
    lines.push('');

    // Prerequisites
    if (plan.prerequisites && plan.prerequisites.length > 0) {
      lines.push('## Prerequisites');
      lines.push('');
      for (const prereq of plan.prerequisites) {
        lines.push(`- ${prereq}`);
      }
      lines.push('');
    }

    // Reasoning
    if (plan.reasoning) {
      lines.push('## Reasoning');
      lines.push('');
      lines.push(plan.reasoning);
      lines.push('');
    }

    // Implementation Steps
    lines.push('## Implementation Steps');
    lines.push('');

    for (const step of plan.steps) {
      lines.push(`### Step ${step.order}: ${step.title}`);
      lines.push('');
      lines.push(`**Complexity:** ${step.complexity}`);
      lines.push('');
      lines.push(step.description);
      lines.push('');

      // Files affected
      if (step.files && step.files.length > 0) {
        lines.push('**Files:**');
        lines.push('');
        for (const file of step.files) {
          const action = file.action ?? 'modify';
          const reason = file.reason ? ` - ${file.reason}` : '';
          lines.push(`- \`${file.path}\` (${action})${reason}`);
        }
        lines.push('');
      }

      // Quality gates
      if (step.qualityGates && step.qualityGates.length > 0) {
        lines.push('**Quality Gates:**');
        lines.push('');
        for (const gate of step.qualityGates) {
          lines.push(`- [ ] ${gate.description}`);
          if (gate.type === 'command' && gate.command) {
            lines.push(`  \`\`\`bash`);
            lines.push(`  ${gate.command}`);
            lines.push(`  \`\`\``);
          }
        }
        lines.push('');
      }
    }

    // Testing Strategy
    if (plan.testingStrategy) {
      lines.push('## Testing Strategy');
      lines.push('');
      lines.push(plan.testingStrategy.description);
      lines.push('');

      if (plan.testingStrategy.unitTests && plan.testingStrategy.unitTests.length > 0) {
        lines.push('**Unit Tests:**');
        lines.push('');
        for (const test of plan.testingStrategy.unitTests) {
          lines.push(`- ${test}`);
        }
        lines.push('');
      }

      if (plan.testingStrategy.commands && plan.testingStrategy.commands.length > 0) {
        lines.push('**Test Commands:**');
        lines.push('');
        lines.push('```bash');
        for (const cmd of plan.testingStrategy.commands) {
          lines.push(cmd);
        }
        lines.push('```');
        lines.push('');
      }
    }

    // Risks
    if (plan.risks && plan.risks.length > 0) {
      lines.push('## Risks');
      lines.push('');
      for (const risk of plan.risks) {
        const level = risk.level ? ` (${risk.level})` : '';
        lines.push(`### ${risk.description}${level}`);
        if (risk.mitigation) {
          lines.push('');
          lines.push(`**Mitigation:** ${risk.mitigation}`);
        }
        lines.push('');
      }
    }

    return lines.join('\n');
  }, [featureName, plan]);

  /**
   * Handle clipboard copy
   */
  const handleClipboardExport = useCallback(async () => {
    setIsExporting(true);
    setExportingOption('clipboard');

    try {
      await navigator.clipboard.writeText(markdownContent);
      toast.success({
        description: 'Implementation plan copied to clipboard',
        title: 'Copied!',
      });
      onExport?.('clipboard');
      setIsOpen(false);
    } catch {
      toast.error({
        description: 'Failed to copy to clipboard. Please try again.',
        title: 'Error',
      });
    } finally {
      setIsExporting(false);
      setExportingOption(null);
    }
  }, [markdownContent, onExport, toast]);

  /**
   * Handle file save
   */
  const handleFileSave = useCallback(async () => {
    setIsExporting(true);
    setExportingOption('file');

    try {
      const defaultFileName = `${featureSlug}-implementation-plan.md`;
      const filePath = await saveFile(defaultFileName, [{ extensions: ['md'], name: 'Markdown' }]);

      if (filePath) {
        const result = await writeFile(filePath, markdownContent);

        if (result.success) {
          toast.success({
            description: `Saved to ${filePath}`,
            title: 'Exported!',
          });
          onExport?.('file', filePath);
          setIsOpen(false);
        } else {
          toast.error({
            description: result.error ?? 'Failed to save file. Please try again.',
            title: 'Error',
          });
        }
      }
    } catch {
      toast.error({
        description: 'Failed to save file. Please try again.',
        title: 'Error',
      });
    } finally {
      setIsExporting(false);
      setExportingOption(null);
    }
  }, [featureSlug, markdownContent, onExport, saveFile, toast, writeFile]);

  /**
   * Handle docs folder export
   */
  const handleDocsExport = useCallback(async () => {
    setIsExporting(true);
    setExportingOption('docs');

    try {
      // Generate the docs folder path following project conventions
      // docs/YYYY_MM_DD/plans/{feature-name}-implementation-plan.md
      const dateFolder = format(new Date(), 'yyyy_MM_dd');
      const fileName = `${featureSlug}-implementation-plan.md`;
      const dirPath = `docs/${dateFolder}/plans`;
      const filePath = `${dirPath}/${fileName}`;

      // Ensure the directory exists before writing
      const mkdirResult = await mkdir(dirPath);
      if (!mkdirResult.success) {
        toast.error({
          description: mkdirResult.error ?? 'Failed to create docs directory.',
          title: 'Error',
        });
        return;
      }

      const result = await writeFile(filePath, markdownContent);

      if (result.success) {
        toast.success({
          description: `Saved to ${filePath}`,
          title: 'Exported to Docs!',
        });
        onExport?.('docs', filePath);
        setIsOpen(false);
      } else {
        toast.error({
          description: result.error ?? 'Failed to export to docs folder. Please try again.',
          title: 'Error',
        });
      }
    } catch {
      toast.error({
        description: 'Failed to export to docs folder. Please try again.',
        title: 'Error',
      });
    } finally {
      setIsExporting(false);
      setExportingOption(null);
    }
  }, [featureSlug, markdownContent, mkdir, onExport, toast, writeFile]);

  /**
   * Toggle preview visibility
   */
  const handlePreviewToggle = useCallback(() => {
    setIsShowingPreview((prev) => !prev);
  }, []);

  // Derived conditions
  const isClipboardExporting = isExporting && exportingOption === 'clipboard';
  const isFileExporting = isExporting && exportingOption === 'file';
  const isDocsExporting = isExporting && exportingOption === 'docs';

  return (
    <div className={cn(className)} ref={ref} {...props}>
      <DialogRoot onOpenChange={setIsOpen} open={isOpen}>
        {/* Trigger */}
        {trigger && <DialogTrigger>{trigger}</DialogTrigger>}

        {/* Dialog Content */}
        <DialogPortal>
          <DialogBackdrop />
          <DialogPopup size={'lg'}>
            {/* Header */}
            <DialogTitle>Export Implementation Plan</DialogTitle>
            <DialogDescription>Choose how you would like to export the implementation plan.</DialogDescription>

            {/* Export Options */}
            <div className={'mt-6 space-y-3'}>
              {/* Copy to Clipboard */}
              <button
                className={cn(exportOptionVariants({ isSelected: false }))}
                disabled={isExporting}
                onClick={handleClipboardExport}
                type={'button'}
              >
                <div className={'flex size-10 items-center justify-center rounded-md bg-accent/10 text-accent'}>
                  {isClipboardExporting ? (
                    <Loader2 aria-hidden={'true'} className={'size-5 animate-spin'} />
                  ) : (
                    <Clipboard aria-hidden={'true'} className={'size-5'} />
                  )}
                </div>
                <div className={'min-w-0 flex-1'}>
                  <span className={'block font-medium text-foreground'}>Copy to Clipboard</span>
                  <span className={'block text-sm text-muted-foreground'}>
                    Copy the markdown content to your clipboard
                  </span>
                </div>
              </button>

              {/* Save to File */}
              <button
                className={cn(exportOptionVariants({ isSelected: false }))}
                disabled={isExporting}
                onClick={handleFileSave}
                type={'button'}
              >
                <div
                  className={
                    'flex size-10 items-center justify-center rounded-md bg-green-500/10 text-green-600 dark:text-green-400'
                  }
                >
                  {isFileExporting ? (
                    <Loader2 aria-hidden={'true'} className={'size-5 animate-spin'} />
                  ) : (
                    <FileDown aria-hidden={'true'} className={'size-5'} />
                  )}
                </div>
                <div className={'min-w-0 flex-1'}>
                  <span className={'block font-medium text-foreground'}>Save to File</span>
                  <span className={'block text-sm text-muted-foreground'}>
                    Choose a location to save the markdown file
                  </span>
                </div>
              </button>

              {/* Export to Docs */}
              <button
                className={cn(exportOptionVariants({ isSelected: false }))}
                disabled={isExporting}
                onClick={handleDocsExport}
                type={'button'}
              >
                <div
                  className={
                    'flex size-10 items-center justify-center rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  }
                >
                  {isDocsExporting ? (
                    <Loader2 aria-hidden={'true'} className={'size-5 animate-spin'} />
                  ) : (
                    <FolderOpen aria-hidden={'true'} className={'size-5'} />
                  )}
                </div>
                <div className={'min-w-0 flex-1'}>
                  <span className={'block font-medium text-foreground'}>Export to Docs</span>
                  <span className={'block text-sm text-muted-foreground'}>
                    Save to docs/{format(new Date(), 'yyyy_MM_dd')}/plans/{featureSlug}-implementation-plan.md
                  </span>
                </div>
              </button>
            </div>

            {/* Preview Toggle */}
            <div className={'mt-6 border-t border-border pt-4'}>
              <button
                className={cn(
                  'text-sm text-muted-foreground hover:text-foreground',
                  'transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none'
                )}
                onClick={handlePreviewToggle}
                type={'button'}
              >
                {isShowingPreview ? 'Hide Preview' : 'Show Preview'}
              </button>

              {/* Preview Content */}
              {isShowingPreview && (
                <div className={'mt-3 max-h-64 overflow-y-auto rounded-md border border-border bg-muted/30 p-4'}>
                  <pre className={'font-mono text-xs whitespace-pre-wrap text-muted-foreground'}>{markdownContent}</pre>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className={'mt-6 flex justify-end'}>
              <DialogClose>
                <Button disabled={isExporting} variant={'outline'}>
                  Cancel
                </Button>
              </DialogClose>
            </div>
          </DialogPopup>
        </DialogPortal>
      </DialogRoot>
    </div>
  );
};
