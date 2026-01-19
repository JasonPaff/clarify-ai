'use client';

import type { ComponentPropsWithRef, ReactNode } from 'react';

import { Cloud, Globe, Key, Pencil, Power, PowerOff, Server, Trash2, Zap } from 'lucide-react';
import { Fragment, useMemo } from 'react';

import type { ApiKeyInfo, ApiKeyProvider, ProviderCategory } from '@/types/electron';

import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { IconButton } from '@/components/ui/icon-button';
import { useToggleApiKeyDisabled } from '@/hooks/queries/use-api-keys';
import { cn } from '@/lib/utils';
import { getProvidersByCategory, PROVIDER_CATEGORIES, PROVIDER_DISPLAY_NAMES } from '@/types/electron';

/** Category display configuration */
interface CategoryConfig {
  description: string;
  icon: ReactNode;
  title: string;
}

/** Category configuration for display */
const CATEGORY_CONFIGS: Record<ProviderCategory, CategoryConfig> = {
  emerging: {
    description: 'Cloud-based alternatives with growing capabilities',
    icon: <Zap className={'size-4'} />,
    title: 'Emerging Providers',
  },
  enterprise: {
    description: 'Cloud platform integrations with advanced authentication',
    icon: <Cloud className={'size-4'} />,
    title: 'Enterprise',
  },
  local: {
    description: 'Self-hosted providers running on your machine',
    icon: <Server className={'size-4'} />,
    title: 'Local / Self-Hosted',
  },
  major: {
    description: 'Primary providers with full feature support',
    icon: <Globe className={'size-4'} />,
    title: 'Major Cloud Providers',
  },
};

/** Order of categories for display */
const CATEGORY_ORDER: ReadonlyArray<ProviderCategory> = ['major', 'emerging', 'enterprise', 'local'];

interface ApiKeyTableProps extends ComponentPropsWithRef<'div'> {
  apiKeys: Array<ApiKeyInfo>;
  onDelete?: (provider: ApiKeyProvider) => void;
  onEdit?: (provider: ApiKeyProvider) => void;
}

export const ApiKeyTable = ({ apiKeys, className, onDelete, onEdit, ref, ...props }: ApiKeyTableProps) => {
  const handleEditClick = (provider: ApiKeyProvider) => {
    onEdit?.(provider);
  };

  const handleDeleteClick = (provider: ApiKeyProvider) => {
    onDelete?.(provider);
  };

  /** Group API keys by category */
  const groupedApiKeys = useMemo(() => {
    const groups: Record<ProviderCategory, Array<ApiKeyInfo>> = {
      emerging: [],
      enterprise: [],
      local: [],
      major: [],
    };

    // Get providers in category order for consistent display
    for (const category of CATEGORY_ORDER) {
      const categoryProviders = getProvidersByCategory(category);
      for (const provider of categoryProviders) {
        const apiKey = apiKeys.find((key) => key.provider === provider);
        if (apiKey) {
          groups[category].push(apiKey);
        }
      }
    }

    return groups;
  }, [apiKeys]);

  const _hasApiKeys = apiKeys.length > 0;

  return (
    <div className={cn('w-full', className)} ref={ref} {...props}>
      {/* Empty State */}
      {!_hasApiKeys && (
        <EmptyState
          description={
            'Add API keys to enable AI-powered features like feature refinement and implementation planning.'
          }
          icon={<Key className={'size-5'} />}
          title={'No API keys configured'}
        />
      )}

      {/* Categorized API Keys */}
      {_hasApiKeys && (
        <div className={'space-y-6'}>
          {CATEGORY_ORDER.map((category) => {
            const categoryKeys = groupedApiKeys[category];
            const categoryConfig = CATEGORY_CONFIGS[category];

            return (
              <ApiKeyCategorySection
                apiKeys={categoryKeys}
                config={categoryConfig}
                key={category}
                onDelete={handleDeleteClick}
                onEdit={handleEditClick}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

interface ApiKeyCategorySectionProps {
  apiKeys: Array<ApiKeyInfo>;
  config: CategoryConfig;
  onDelete: (provider: ApiKeyProvider) => void;
  onEdit: (provider: ApiKeyProvider) => void;
}

const ApiKeyCategorySection = ({ apiKeys, config, onDelete, onEdit }: ApiKeyCategorySectionProps) => {
  const _hasConfiguredKeys = apiKeys.some((key) => key.isConfigured);

  return (
    <div className={'space-y-3'}>
      {/* Category Header */}
      <div className={'flex items-center gap-2'}>
        <div className={'flex size-6 items-center justify-center rounded-md bg-muted text-muted-foreground'}>
          {config.icon}
        </div>
        <div>
          <h3 className={'text-sm font-medium'}>{config.title}</h3>
          <p className={'text-xs text-muted-foreground'}>{config.description}</p>
        </div>
      </div>

      {/* Category Table */}
      <div className={'overflow-hidden rounded-lg border border-border'}>
        {/* Table Header */}
        <div
          className={`
            grid grid-cols-[1fr_minmax(120px,1fr)_auto_minmax(100px,1fr)_auto] gap-4 border-b
            border-border bg-muted/50 px-4 py-2.5 text-xs font-medium text-muted-foreground
          `}
        >
          <div>Provider</div>
          <div>Credentials</div>
          <div>Source</div>
          <div>Configuration</div>
          <div className={'text-right'}>Actions</div>
        </div>

        {/* Table Body */}
        <div className={'divide-y divide-border'}>
          {apiKeys.map((entry) => (
            <ApiKeyTableRow
              entry={entry}
              key={entry.provider}
              onDelete={() => onDelete(entry.provider)}
              onEdit={() => onEdit(entry.provider)}
            />
          ))}
        </div>
      </div>

      {/* Category Status Summary */}
      <div className={'flex items-center gap-2 text-xs text-muted-foreground'}>
        <span>
          {_hasConfiguredKeys ? (
            <span className={'text-emerald-600 dark:text-emerald-400'}>
              {apiKeys.filter((k) => k.isConfigured).length} of {apiKeys.length} configured
            </span>
          ) : (
            <span>No providers configured</span>
          )}
        </span>
      </div>
    </div>
  );
};

interface ApiKeyTableRowProps {
  entry: ApiKeyInfo;
  onDelete: () => void;
  onEdit: () => void;
}

const ApiKeyTableRow = ({ entry, onDelete, onEdit }: ApiKeyTableRowProps) => {
  const toggleMutation = useToggleApiKeyDisabled();
  const providerDisplayName = getProviderDisplayName(entry.provider);
  const category = PROVIDER_CATEGORIES[entry.provider];

  const _isUserKey = entry.source === 'user';
  const _isConfigured = entry.isConfigured;
  const _isDisabled = entry.isDisabled;
  const _isEnterprise = category === 'enterprise';
  const _isLocal = category === 'local';

  const handleToggleDisabled = () => {
    toggleMutation.mutate(entry.provider);
  };

  return (
    <div
      className={cn(
        'grid grid-cols-[1fr_minmax(120px,1fr)_auto_minmax(100px,1fr)_auto] items-center gap-4 px-4 py-3',
        'transition-colors hover:bg-muted/30',
        (!_isConfigured || _isDisabled) && 'opacity-60'
      )}
    >
      {/* Provider */}
      <div className={'flex items-center gap-2'}>
        <Badge variant={entry.provider}>{providerDisplayName}</Badge>
        {_isDisabled && (
          <Badge size={'sm'}>
            Disabled
          </Badge>
        )}
      </div>

      {/* Credentials Display */}
      <div className={'min-w-0'}>
        {_isConfigured ? (
          <CredentialsDisplay entry={entry} />
        ) : (
          <span className={'text-sm text-muted-foreground/50'}>Not configured</span>
        )}
      </div>

      {/* Source */}
      <div>
        {_isConfigured ? (
          <Badge size={'sm'} variant={entry.source}>
            {entry.source === 'environment' ? 'Environment' : 'User'}
          </Badge>
        ) : (
          <span className={'text-sm text-muted-foreground/50'}>-</span>
        )}
      </div>

      {/* Configuration Details */}
      <div className={'min-w-0'}>
        {_isConfigured ? (
          <ConfigurationDetails entry={entry} isEnterprise={_isEnterprise} isLocal={_isLocal} />
        ) : (
          <span className={'text-sm text-muted-foreground/50'}>-</span>
        )}
      </div>

      {/* Actions */}
      <div className={'flex justify-end gap-1'}>
        {_isUserKey && _isConfigured && (
          <Fragment>
            {/* Toggle button */}
            <IconButton
              aria-label={_isDisabled ? `Enable ${providerDisplayName}` : `Disable ${providerDisplayName}`}
              disabled={toggleMutation.isPending}
              onClick={handleToggleDisabled}
              type={'button'}
            >
              {_isDisabled ? <Power className={'size-4'} /> : <PowerOff className={'size-4'} />}
            </IconButton>

            {/* Edit button */}
            <IconButton
              aria-label={`Edit ${providerDisplayName} API key`}
              disabled={_isDisabled}
              onClick={onEdit}
              type={'button'}
            >
              <Pencil className={'size-4'} />
            </IconButton>

            {/* Delete button */}
            <IconButton aria-label={`Delete ${providerDisplayName} API key`} onClick={onDelete} type={'button'}>
              <Trash2 className={'size-4'} />
            </IconButton>
          </Fragment>
        )}
        {!_isUserKey && _isConfigured && <span className={'px-2 text-xs text-muted-foreground/50'}>Read-only</span>}
        {!_isConfigured && (
          <IconButton aria-label={`Configure ${providerDisplayName}`} onClick={onEdit} type={'button'}>
            <Pencil className={'size-4'} />
          </IconButton>
        )}
      </div>
    </div>
  );
};

/** Displays credentials information based on provider type */
interface CredentialsDisplayProps {
  entry: ApiKeyInfo;
}

const CredentialsDisplay = ({ entry }: CredentialsDisplayProps) => {
  const category = PROVIDER_CATEGORIES[entry.provider];

  // AWS Bedrock - show AWS credentials indicator
  if (category === 'enterprise' && entry.hasAwsCredentials) {
    return (
      <div className={'flex flex-col gap-0.5'}>
        <span className={'font-mono text-sm text-muted-foreground'}>{entry.maskedKey}</span>
        <span className={'text-xs text-emerald-600 dark:text-emerald-400'}>AWS Credentials</span>
      </div>
    );
  }

  // Ollama - show endpoint indicator
  if (category === 'local') {
    return (
      <div className={'flex flex-col gap-0.5'}>
        <span className={'text-sm text-muted-foreground'}>No key required</span>
        <span className={'text-xs text-blue-600 dark:text-blue-400'}>Local endpoint</span>
      </div>
    );
  }

  // Standard API key display
  return <span className={'font-mono text-sm text-muted-foreground'}>{entry.maskedKey}</span>;
};

/** Displays additional configuration details for enterprise/local providers */
interface ConfigurationDetailsProps {
  entry: ApiKeyInfo;
  isEnterprise: boolean;
  isLocal: boolean;
}

const ConfigurationDetails = ({ entry, isEnterprise, isLocal }: ConfigurationDetailsProps) => {
  const details: Array<{ label: string; value: string }> = [];

  // Azure-specific details
  if (entry.endpoint) {
    try {
      const url = new URL(entry.endpoint);
      details.push({ label: 'Endpoint', value: url.hostname });
    } catch {
      details.push({ label: 'Endpoint', value: entry.endpoint });
    }
  }

  if (entry.deploymentName) {
    details.push({ label: 'Deployment', value: entry.deploymentName });
  }

  // AWS Bedrock-specific details
  if (entry.region) {
    details.push({ label: 'Region', value: entry.region });
  }

  // Notes (for all providers)
  if (entry.notes && entry.notes.trim().length > 0) {
    details.push({ label: 'Notes', value: entry.notes });
  }

  // No details to show for standard API key providers
  if (details.length === 0) {
    if (isEnterprise || isLocal) {
      return <span className={'text-xs text-muted-foreground/50'}>Default config</span>;
    }
    return <span className={'text-sm text-muted-foreground/50'}>-</span>;
  }

  // Show first detail only to keep it compact
  const primaryDetail = details[0];

  return (
    <div className={'flex flex-col gap-0.5'}>
      <span className={'truncate text-sm text-muted-foreground'} title={primaryDetail?.value}>
        {primaryDetail?.value}
      </span>
      {details.length > 1 && <span className={'text-xs text-muted-foreground/70'}>+{details.length - 1} more</span>}
    </div>
  );
};

/** Helper function to format provider names */
const getProviderDisplayName = (provider: ApiKeyProvider): string => {
  return PROVIDER_DISPLAY_NAMES[provider];
};
