'use client';

import type { ChangeEvent, ComponentPropsWithRef, KeyboardEvent } from 'react';

import { FolderGit2, Package, Plus, Settings2, Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import type { DiscoveryScopeConfig } from '@/lib/validations/discovery';

import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { IconButton } from '@/components/ui/icon-button';
import { Input } from '@/components/ui/input';
import {
  NumberInputDecrement,
  NumberInputField,
  NumberInputGroup,
  NumberInputIncrement,
  NumberInputRoot,
} from '@/components/ui/number-input';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

/** Preset exclusion pattern groups */
const PRESET_EXCLUSIONS = [
  { description: 'Dependencies', label: 'node_modules', pattern: '**/node_modules/**' },
  { description: 'Version control', label: '.git', pattern: '**/.git/**' },
  { description: 'Build artifacts', label: 'dist', pattern: '**/dist/**' },
  { description: 'Build output', label: 'build', pattern: '**/build/**' },
  { description: 'Coverage reports', label: 'coverage', pattern: '**/coverage/**' },
  { description: 'Package lock', label: 'lockfiles', pattern: '**/*lock*' },
] as const;

/** Common include pattern presets */
const PRESET_INCLUSIONS = [
  { description: 'Source code', label: 'src/**', pattern: 'src/**' },
  { description: 'App directory', label: 'app/**', pattern: 'app/**' },
  { description: 'Components', label: 'components/**', pattern: 'components/**' },
  { description: 'Library code', label: 'lib/**', pattern: 'lib/**' },
] as const;

/** Repository option for per-repo scope */
interface RepositoryOption {
  id: number;
  name: string;
  path: string;
}

interface ScopeSelectorProps extends ComponentPropsWithRef<'div'> {
  /** Whether per-repository scope is enabled */
  isPerRepoEnabled?: boolean;
  /** Callback when per-repository scope toggle changes */
  onPerRepoChange?: (isEnabled: boolean) => void;
  /** Callback when scope configuration changes */
  onScopeChange: (config: DiscoveryScopeConfig) => void;
  /** Available repositories for per-repo scope */
  repositories?: Array<RepositoryOption>;
  /** Current scope configuration */
  scopeConfig: DiscoveryScopeConfig;
}

/**
 * Validates a glob pattern for basic syntax errors.
 * Returns an error message if invalid, null if valid.
 */
function validateGlobPattern(pattern: string): null | string {
  // Empty pattern is valid (will be filtered out)
  if (!pattern.trim()) {
    return null;
  }

  // Check for unbalanced brackets
  const openBrackets = (pattern.match(/\[/g) ?? []).length;
  const closeBrackets = (pattern.match(/\]/g) ?? []).length;
  if (openBrackets !== closeBrackets) {
    return 'Unbalanced brackets in pattern';
  }

  // Check for unbalanced braces
  const openBraces = (pattern.match(/\{/g) ?? []).length;
  const closeBraces = (pattern.match(/\}/g) ?? []).length;
  if (openBraces !== closeBraces) {
    return 'Unbalanced braces in pattern';
  }

  // Check for invalid consecutive wildcards that don't make sense
  if (pattern.includes('***')) {
    return 'Invalid pattern: too many consecutive wildcards';
  }

  // Check for trailing slash without pattern
  if (pattern.endsWith('/') && !pattern.endsWith('**/')) {
    return 'Pattern should not end with a trailing slash';
  }

  return null;
}

/**
 * Scope configuration panel for defining discovery boundaries.
 * Allows users to specify include/exclude patterns and configure file limits.
 */
export const ScopeSelector = ({
  className,
  isPerRepoEnabled = false,
  onPerRepoChange,
  onScopeChange,
  ref,
  repositories = [],
  scopeConfig,
  ...props
}: ScopeSelectorProps) => {
  const [includeInput, setIncludeInput] = useState('');
  const [excludeInput, setExcludeInput] = useState('');
  const [includeError, setIncludeError] = useState<null | string>(null);
  const [excludeError, setExcludeError] = useState<null | string>(null);

  // Memoize derived patterns to avoid re-creating arrays on every render
  const includePatterns = useMemo(() => scopeConfig.includePatterns ?? [], [scopeConfig.includePatterns]);
  const excludePatterns = useMemo(() => scopeConfig.excludePatterns ?? [], [scopeConfig.excludePatterns]);
  const maxFiles = scopeConfig.maxFiles ?? 500;

  const hasIncludePatterns = includePatterns.length > 0;
  const hasExcludePatterns = excludePatterns.length > 0;
  const hasMultipleRepositories = repositories.length > 1;

  // Calculate which presets are currently active
  const activeExcludePresets = useMemo(() => {
    return new Set(
      PRESET_EXCLUSIONS.filter((preset) => excludePatterns.includes(preset.pattern)).map((preset) => preset.pattern)
    );
  }, [excludePatterns]);

  const activeIncludePresets = useMemo(() => {
    return new Set(
      PRESET_INCLUSIONS.filter((preset) => includePatterns.includes(preset.pattern)).map((preset) => preset.pattern)
    );
  }, [includePatterns]);

  /**
   * Handle adding an include pattern
   */
  const handleAddIncludePattern = useCallback(() => {
    const pattern = includeInput.trim();
    if (!pattern) return;

    const error = validateGlobPattern(pattern);
    if (error) {
      setIncludeError(error);
      return;
    }

    // Don't add duplicates
    if (includePatterns.includes(pattern)) {
      setIncludeError('Pattern already exists');
      return;
    }

    onScopeChange({
      ...scopeConfig,
      includePatterns: [...includePatterns, pattern],
    });
    setIncludeInput('');
    setIncludeError(null);
  }, [includeInput, includePatterns, onScopeChange, scopeConfig]);

  /**
   * Handle adding an exclude pattern
   */
  const handleAddExcludePattern = useCallback(() => {
    const pattern = excludeInput.trim();
    if (!pattern) return;

    const error = validateGlobPattern(pattern);
    if (error) {
      setExcludeError(error);
      return;
    }

    // Don't add duplicates
    if (excludePatterns.includes(pattern)) {
      setExcludeError('Pattern already exists');
      return;
    }

    onScopeChange({
      ...scopeConfig,
      excludePatterns: [...excludePatterns, pattern],
    });
    setExcludeInput('');
    setExcludeError(null);
  }, [excludeInput, excludePatterns, onScopeChange, scopeConfig]);

  /**
   * Handle removing an include pattern
   */
  const handleRemoveIncludePattern = useCallback(
    (pattern: string) => {
      onScopeChange({
        ...scopeConfig,
        includePatterns: includePatterns.filter((p) => p !== pattern),
      });
    },
    [includePatterns, onScopeChange, scopeConfig]
  );

  /**
   * Handle removing an exclude pattern
   */
  const handleRemoveExcludePattern = useCallback(
    (pattern: string) => {
      onScopeChange({
        ...scopeConfig,
        excludePatterns: excludePatterns.filter((p) => p !== pattern),
      });
    },
    [excludePatterns, onScopeChange, scopeConfig]
  );

  /**
   * Handle toggling an exclude preset
   */
  const handleToggleExcludePreset = useCallback(
    (pattern: string) => {
      const isActive = excludePatterns.includes(pattern);
      if (isActive) {
        // Remove the preset
        onScopeChange({
          ...scopeConfig,
          excludePatterns: excludePatterns.filter((p) => p !== pattern),
        });
      } else {
        // Add the preset
        onScopeChange({
          ...scopeConfig,
          excludePatterns: [...excludePatterns, pattern],
        });
      }
    },
    [excludePatterns, onScopeChange, scopeConfig]
  );

  /**
   * Handle toggling an include preset
   */
  const handleToggleIncludePreset = useCallback(
    (pattern: string) => {
      const isActive = includePatterns.includes(pattern);
      if (isActive) {
        // Remove the preset
        onScopeChange({
          ...scopeConfig,
          includePatterns: includePatterns.filter((p) => p !== pattern),
        });
      } else {
        // Add the preset
        onScopeChange({
          ...scopeConfig,
          includePatterns: [...includePatterns, pattern],
        });
      }
    },
    [includePatterns, onScopeChange, scopeConfig]
  );

  /**
   * Handle max files change
   */
  const handleMaxFilesChange = useCallback(
    (value: null | number) => {
      if (value !== null && value > 0) {
        onScopeChange({
          ...scopeConfig,
          maxFiles: value,
        });
      }
    },
    [onScopeChange, scopeConfig]
  );

  /**
   * Handle per-repo toggle
   */
  const handlePerRepoToggle = useCallback(
    (isChecked: boolean) => {
      onPerRepoChange?.(isChecked);
    },
    [onPerRepoChange]
  );

  /**
   * Handle include input key press (add on Enter)
   */
  const handleIncludeKeyPress = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleAddIncludePattern();
      }
    },
    [handleAddIncludePattern]
  );

  /**
   * Handle exclude input key press (add on Enter)
   */
  const handleExcludeKeyPress = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleAddExcludePattern();
      }
    },
    [handleAddExcludePattern]
  );

  /**
   * Handle include input change
   */
  const handleIncludeInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setIncludeInput(event.target.value);
      if (includeError) {
        setIncludeError(null);
      }
    },
    [includeError]
  );

  /**
   * Handle exclude input change
   */
  const handleExcludeInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setExcludeInput(event.target.value);
      if (excludeError) {
        setExcludeError(null);
      }
    },
    [excludeError]
  );

  return (
    <div className={cn('rounded-md border border-border bg-background', className)} ref={ref} {...props}>
      {/* Header Section */}
      <div className={'border-b border-border p-4'}>
        <div className={'flex items-center gap-2'}>
          <Settings2 aria-hidden={'true'} className={'size-5 text-muted-foreground'} />
          <div>
            <h3 className={'text-sm font-semibold text-foreground'}>Discovery Scope</h3>
            <p className={'text-xs text-muted-foreground'}>
              Configure which files and directories to include or exclude
            </p>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className={'divide-y divide-border'}>
        {/* Include Patterns Section */}
        <Collapsible defaultOpen>
          <CollapsibleTrigger className={'w-full p-4'}>
            <span className={'text-sm font-medium'}>Include Patterns</span>
            {hasIncludePatterns && (
              <span className={'ml-auto text-xs text-muted-foreground'}>({includePatterns.length} active)</span>
            )}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className={'space-y-3 px-4 py-2.5'}>
              {/* Preset Buttons */}
              <div className={'flex flex-wrap gap-2'}>
                {PRESET_INCLUSIONS.map((preset) => {
                  const isActive = activeIncludePresets.has(preset.pattern);
                  return (
                    <Button
                      key={preset.pattern}
                      onClick={() => handleToggleIncludePreset(preset.pattern)}
                      size={'sm'}
                      title={preset.description}
                      variant={isActive ? 'default' : 'outline'}
                    >
                      <Package aria-hidden={'true'} className={'mr-1.5 size-3.5'} />
                      {preset.label}
                    </Button>
                  );
                })}
              </div>

              {/* Custom Input */}
              <div className={'flex gap-2'}>
                <div className={'flex-1'}>
                  <Input
                    aria-describedby={includeError ? 'include-error' : undefined}
                    aria-invalid={!!includeError}
                    className={'font-mono text-sm'}
                    isInvalid={!!includeError}
                    onChange={handleIncludeInputChange}
                    onKeyDown={handleIncludeKeyPress}
                    placeholder={'e.g., **/*.ts, src/utils/**'}
                    size={'sm'}
                    value={includeInput}
                  />
                  {includeError && (
                    <p className={'mt-1 text-xs text-destructive'} id={'include-error'}>
                      {includeError}
                    </p>
                  )}
                </div>
                <Button
                  disabled={!includeInput.trim()}
                  onClick={handleAddIncludePattern}
                  size={'sm'}
                  variant={'outline'}
                >
                  <Plus aria-hidden={'true'} className={'size-4'} />
                </Button>
              </div>

              {/* Active Patterns List */}
              {hasIncludePatterns && (
                <div className={'flex flex-wrap gap-2'}>
                  {includePatterns.map((pattern) => (
                    <div
                      className={'flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 font-mono text-xs'}
                      key={pattern}
                    >
                      <span className={'text-foreground'}>{pattern}</span>
                      <IconButton
                        aria-label={`Remove pattern ${pattern}`}
                        className={'size-4 hover:text-destructive'}
                        onClick={() => handleRemoveIncludePattern(pattern)}
                      >
                        <Trash2 className={'size-3'} />
                      </IconButton>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Exclude Patterns Section */}
        <Collapsible defaultOpen>
          <CollapsibleTrigger className={'w-full p-4'}>
            <span className={'text-sm font-medium'}>Exclude Patterns</span>
            {hasExcludePatterns && (
              <span className={'ml-auto text-xs text-muted-foreground'}>({excludePatterns.length} active)</span>
            )}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className={'space-y-3 px-4 py-2.5'}>
              {/* Preset Buttons */}
              <div className={'flex flex-wrap gap-2'}>
                {PRESET_EXCLUSIONS.map((preset) => {
                  const isActive = activeExcludePresets.has(preset.pattern);
                  return (
                    <Button
                      key={preset.pattern}
                      onClick={() => handleToggleExcludePreset(preset.pattern)}
                      size={'sm'}
                      title={preset.description}
                      variant={isActive ? 'destructive' : 'outline'}
                    >
                      <Package aria-hidden={'true'} className={'mr-1.5 size-3.5'} />
                      {preset.label}
                    </Button>
                  );
                })}
              </div>

              {/* Custom Input */}
              <div className={'flex gap-2'}>
                <div className={'flex-1'}>
                  <Input
                    aria-describedby={excludeError ? 'exclude-error' : undefined}
                    aria-invalid={!!excludeError}
                    className={'font-mono text-sm'}
                    isInvalid={!!excludeError}
                    onChange={handleExcludeInputChange}
                    onKeyDown={handleExcludeKeyPress}
                    placeholder={'e.g., **/*.test.ts, **/fixtures/**'}
                    size={'sm'}
                    value={excludeInput}
                  />
                  {excludeError && (
                    <p className={'mt-1 text-xs text-destructive'} id={'exclude-error'}>
                      {excludeError}
                    </p>
                  )}
                </div>
                <Button
                  disabled={!excludeInput.trim()}
                  onClick={handleAddExcludePattern}
                  size={'sm'}
                  variant={'outline'}
                >
                  <Plus aria-hidden={'true'} className={'size-4'} />
                </Button>
              </div>

              {/* Active Patterns List */}
              {hasExcludePatterns && (
                <div className={'flex flex-wrap gap-2'}>
                  {excludePatterns.map((pattern) => (
                    <div
                      className={'flex items-center gap-1.5 rounded-md bg-destructive/10 px-2 py-1 font-mono text-xs'}
                      key={pattern}
                    >
                      <span className={'text-foreground'}>{pattern}</span>
                      <IconButton
                        aria-label={`Remove pattern ${pattern}`}
                        className={'size-4 hover:text-destructive'}
                        onClick={() => handleRemoveExcludePattern(pattern)}
                      >
                        <Trash2 className={'size-3'} />
                      </IconButton>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Advanced Settings Section */}
        <Collapsible>
          <CollapsibleTrigger className={'w-full p-4'}>
            <span className={'text-sm font-medium'}>Advanced Settings</span>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className={'space-y-4 px-4 py-2.5'}>
              {/* Max Files Limit */}
              <div className={'flex items-center justify-between'}>
                <div>
                  <p className={'text-sm font-medium text-foreground'}>Max Files Limit</p>
                  <p className={'text-xs text-muted-foreground'}>Maximum number of files to analyze</p>
                </div>
                <NumberInputRoot max={5000} min={10} onValueChange={handleMaxFilesChange} step={50} value={maxFiles}>
                  <NumberInputGroup>
                    <NumberInputDecrement size={'sm'} />
                    <NumberInputField size={'sm'} />
                    <NumberInputIncrement size={'sm'} />
                  </NumberInputGroup>
                </NumberInputRoot>
              </div>

              {/* Per-Repository Scope Toggle - Only show for multi-repo projects */}
              {hasMultipleRepositories && (
                <div className={'flex items-center justify-between'}>
                  <div className={'flex items-center gap-2'}>
                    <FolderGit2 aria-hidden={'true'} className={'size-4 text-muted-foreground'} />
                    <div>
                      <p className={'text-sm font-medium text-foreground'}>Per-Repository Scope</p>
                      <p className={'text-xs text-muted-foreground'}>Configure scope separately for each repository</p>
                    </div>
                  </div>
                  <Switch checked={isPerRepoEnabled} onCheckedChange={handlePerRepoToggle} />
                </div>
              )}

              {/* Repository List (when per-repo is enabled) */}
              {hasMultipleRepositories && isPerRepoEnabled && (
                <div className={'rounded-md border border-border bg-muted/30 p-3'}>
                  <p className={'mb-2 text-xs font-medium text-muted-foreground'}>Active Repositories:</p>
                  <div className={'space-y-2'}>
                    {repositories.map((repo) => (
                      <div className={'flex items-center gap-2 text-sm text-foreground'} key={repo.id}>
                        <FolderGit2 aria-hidden={'true'} className={'size-3.5 text-muted-foreground'} />
                        <span className={'font-medium'}>{repo.name}</span>
                        <span className={'truncate text-xs text-muted-foreground'}>{repo.path}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};
