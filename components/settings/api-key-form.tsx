'use client';

import { useStore } from '@tanstack/react-form';
import { Fragment, useCallback, useState } from 'react';

import type { ApiKeyProvider, ProviderAuthType } from '@/electron/ipc/lib/provider-types';
import type { CreateExtendedApiKeyFormValues, UpdateExtendedApiKeyFormValues } from '@/lib/validations/api-key';

import { Button } from '@/components/ui/button';
import { PROVIDER_CATEGORIES, PROVIDER_CONFIGS, PROVIDER_DISPLAY_NAMES } from '@/electron/ipc/lib/provider-types';
import { useSetApiKey, useTestApiKey } from '@/hooks/queries/use-api-keys';
import { useAppForm } from '@/lib/forms/form-hook';
import { cn } from '@/lib/utils';
import {
  allApiProvidersTuple,
  createExtendedApiKeySchema,
  updateExtendedApiKeySchema,
} from '@/lib/validations/api-key';

// ============================================================================
// Types
// ============================================================================

interface ApiKeyFormProps {
  initialValues?: {
    notes: string;
    provider: ApiKeyProvider;
  };
  isSubmitting?: boolean;
  mode: FormMode;
  onCancel: () => void;
  onSuccess: () => void;
}

type FormMode = 'create' | 'edit';

// ============================================================================
// Provider Options with Category Grouping
// ============================================================================

const CATEGORY_LABELS: Record<string, string> = {
  emerging: 'Emerging Providers',
  enterprise: 'Enterprise',
  local: 'Local / Self-Hosted',
  major: 'Major Providers',
};

const CATEGORY_ORDER = ['major', 'emerging', 'enterprise', 'local'] as const;

// Build grouped options for the select dropdown
function buildProviderOptions(): Array<{ disabled?: boolean; label: string; value: string }> {
  const grouped: Record<string, Array<{ label: string; value: ApiKeyProvider }>> = {};

  // Group providers by category
  for (const provider of allApiProvidersTuple) {
    const category = PROVIDER_CATEGORIES[provider];
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push({
      label: PROVIDER_DISPLAY_NAMES[provider],
      value: provider,
    });
  }

  // Build flat options array with group headers
  const options: Array<{ disabled?: boolean; label: string; value: string }> = [];

  for (const category of CATEGORY_ORDER) {
    const categoryProviders = grouped[category];
    if (categoryProviders && categoryProviders.length > 0) {
      // Add group header (disabled option as separator)
      options.push({
        disabled: true,
        label: `--- ${CATEGORY_LABELS[category]} ---`,
        value: `_header_${category}`,
      });

      // Add provider options
      for (const provider of categoryProviders) {
        options.push(provider);
      }
    }
  }

  return options;
}

const providerOptions = buildProviderOptions();

// ============================================================================
// AWS Region Options
// ============================================================================

const AWS_REGIONS = [
  { label: 'US East (N. Virginia) - us-east-1', value: 'us-east-1' },
  { label: 'US East (Ohio) - us-east-2', value: 'us-east-2' },
  { label: 'US West (N. California) - us-west-1', value: 'us-west-1' },
  { label: 'US West (Oregon) - us-west-2', value: 'us-west-2' },
  { label: 'Europe (Frankfurt) - eu-central-1', value: 'eu-central-1' },
  { label: 'Europe (Ireland) - eu-west-1', value: 'eu-west-1' },
  { label: 'Europe (London) - eu-west-2', value: 'eu-west-2' },
  { label: 'Europe (Paris) - eu-west-3', value: 'eu-west-3' },
  { label: 'Asia Pacific (Mumbai) - ap-south-1', value: 'ap-south-1' },
  { label: 'Asia Pacific (Singapore) - ap-southeast-1', value: 'ap-southeast-1' },
  { label: 'Asia Pacific (Sydney) - ap-southeast-2', value: 'ap-southeast-2' },
  { label: 'Asia Pacific (Tokyo) - ap-northeast-1', value: 'ap-northeast-1' },
  { label: 'Asia Pacific (Seoul) - ap-northeast-2', value: 'ap-northeast-2' },
  { label: 'South America (São Paulo) - sa-east-1', value: 'sa-east-1' },
];

// ============================================================================
// Helper Text Components
// ============================================================================

interface CreateApiKeyFormContentProps {
  isSubmitLoading: boolean;
  isTestLoading: boolean;
  onCancel: () => void;
  onSubmit: (values: CreateExtendedApiKeyFormValues) => Promise<void>;
  onTestApiKey: (params: {
    credentials?: {
      accessKeyId?: string;
      apiKey?: string;
      deploymentName?: string;
      endpoint?: string;
      region?: string;
      secretAccessKey?: string;
    };
    provider: ApiKeyProvider;
  }) => Promise<{ error?: string; success: boolean }>;
  setTestResult: (result: null | { isSuccess: boolean; message: string }) => void;
  testResult: null | { isSuccess: boolean; message: string };
}

// ============================================================================
// Form Content Props
// ============================================================================

interface EditApiKeyFormContentProps {
  initialValues?: {
    notes: string;
    provider: ApiKeyProvider;
  };
  isSubmitLoading: boolean;
  isTestLoading: boolean;
  onCancel: () => void;
  onSubmit: (values: UpdateExtendedApiKeyFormValues) => Promise<void>;
  onTestApiKey: (params: {
    credentials?: {
      accessKeyId?: string;
      apiKey?: string;
      deploymentName?: string;
      endpoint?: string;
      region?: string;
      secretAccessKey?: string;
    };
    provider: ApiKeyProvider;
  }) => Promise<{ error?: string; success: boolean }>;
  setTestResult: (result: null | { isSuccess: boolean; message: string }) => void;
  testResult: null | { isSuccess: boolean; message: string };
}

export function ApiKeyForm({ initialValues, isSubmitting, mode, onCancel, onSuccess }: ApiKeyFormProps) {
  const [testResult, setTestResult] = useState<null | { isSuccess: boolean; message: string }>(null);

  const setApiKey = useSetApiKey();
  const testApiKey = useTestApiKey();

  const isCreateMode = mode === 'create';
  const isTestLoading = testApiKey.isPending;
  const isSubmitLoading = setApiKey.isPending || isSubmitting || false;

  const handleSubmit = useCallback(
    async (values: CreateExtendedApiKeyFormValues | UpdateExtendedApiKeyFormValues) => {
      const isCreate = mode === 'create';

      try {
        const provider = isCreate ? (values as CreateExtendedApiKeyFormValues).provider : initialValues?.provider;

        if (!provider) {
          return;
        }

        const apiKey = values.apiKey || undefined;
        const endpoint = values.endpoint || undefined;
        const region = values.region || undefined;
        const accessKeyId = values.accessKeyId || undefined;
        const secretAccessKey = values.secretAccessKey || undefined;
        const deploymentName = values.deploymentName || undefined;

        // Only set if we have credentials (required fields vary by provider)
        const result = await setApiKey.mutateAsync({
          accessKeyId,
          deploymentName,
          endpoint,
          key: apiKey,
          notes: values.notes,
          provider,
          region,
          secretAccessKey,
        });

        if (!result.success) {
          throw new Error(result.error ?? 'Failed to save API key');
        }

        onSuccess();
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to save API key');
      }
    },
    [mode, initialValues?.provider, onSuccess, setApiKey]
  );

  if (isCreateMode) {
    return (
      <CreateApiKeyFormContent
        isSubmitLoading={isSubmitLoading}
        isTestLoading={isTestLoading}
        onCancel={onCancel}
        onSubmit={handleSubmit}
        onTestApiKey={testApiKey.mutateAsync}
        setTestResult={setTestResult}
        testResult={testResult}
      />
    );
  }

  return (
    <EditApiKeyFormContent
      initialValues={initialValues}
      isSubmitLoading={isSubmitLoading}
      isTestLoading={isTestLoading}
      onCancel={onCancel}
      onSubmit={handleSubmit}
      onTestApiKey={testApiKey.mutateAsync}
      setTestResult={setTestResult}
      testResult={testResult}
    />
  );
}

// ============================================================================
// Main Form Component
// ============================================================================

function CreateApiKeyFormContent({
  isSubmitLoading,
  isTestLoading,
  onCancel,
  onSubmit,
  onTestApiKey,
  setTestResult,
  testResult,
}: CreateApiKeyFormContentProps) {
  const form = useAppForm({
    defaultValues: {
      accessKeyId: '',
      apiKey: '',
      deploymentName: '',
      endpoint: '',
      notes: '',
      provider: '' as ApiKeyProvider,
      region: '',
      secretAccessKey: '',
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
    validators: {
      onSubmit: createExtendedApiKeySchema,
    },
  });

  // Subscribe to provider value for conditional rendering
  const [selectedProvider] = useStore(form.store, (state) => [state.values.provider]);
  const providerConfig = selectedProvider ? PROVIDER_CONFIGS[selectedProvider] : null;
  const authType = providerConfig?.authType ?? 'api_key';

  // Derived booleans for conditional field rendering
  const isApiKeyAuth = authType === 'api_key';
  const isAzureAuth = authType === 'azure';
  const isAwsAuth = authType === 'aws';
  const isNoAuth = authType === 'none';

  // Show API key field for api_key and azure auth types
  const shouldShowApiKey = isApiKeyAuth || isAzureAuth;

  // Show endpoint for azure and ollama
  const shouldShowEndpoint = isAzureAuth || isNoAuth;

  // Show AWS fields for bedrock
  const shouldShowAwsFields = isAwsAuth;

  // Show deployment name for azure (optional)
  const shouldShowDeploymentName = isAzureAuth;

  const handleTestConnection = async () => {
    const { accessKeyId, apiKey, deploymentName, endpoint, provider, region, secretAccessKey } = form.state.values;

    if (!provider) {
      setTestResult({ isSuccess: false, message: 'Please select a provider first' });
      return;
    }

    const config = PROVIDER_CONFIGS[provider];

    // Validate required fields based on auth type
    if (config.authType === 'api_key' && !apiKey) {
      setTestResult({ isSuccess: false, message: 'Please enter an API key first' });
      return;
    }

    if (config.authType === 'azure' && (!apiKey || !endpoint)) {
      setTestResult({ isSuccess: false, message: 'Please enter both API key and endpoint' });
      return;
    }

    if (config.authType === 'aws' && (!accessKeyId || !secretAccessKey || !region)) {
      setTestResult({
        isSuccess: false,
        message: 'Please enter AWS credentials and region',
      });
      return;
    }

    try {
      const result = await onTestApiKey({
        credentials: {
          accessKeyId: accessKeyId || undefined,
          apiKey: apiKey || undefined,
          deploymentName: deploymentName || undefined,
          endpoint: endpoint || undefined,
          region: region || undefined,
          secretAccessKey: secretAccessKey || undefined,
        },
        provider,
      });

      if (result.success) {
        setTestResult({ isSuccess: true, message: 'Connection successful! Credentials are valid.' });
      } else {
        setTestResult({ isSuccess: false, message: result.error ?? 'Connection test failed' });
      }
    } catch (error) {
      setTestResult({
        isSuccess: false,
        message: error instanceof Error ? error.message : 'Connection test failed',
      });
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <div className={'flex flex-col gap-4'}>
        {/* Provider Selection */}
        <form.AppField name={'provider'}>
          {(field) => (
            <field.SelectField label={'Provider'} options={providerOptions} placeholder={'Select an AI provider'} />
          )}
        </form.AppField>

        {/* Provider Helper Text */}
        {selectedProvider && (
          <div className={'-mt-2'}>
            <ProviderHelperText authType={authType} />
          </div>
        )}

        {/* API Key Input - for api_key and azure auth types */}
        {shouldShowApiKey && (
          <form.AppField name={'apiKey'}>
            {(field) => <field.TextField label={'API Key'} placeholder={'Enter your API key'} type={'password'} />}
          </form.AppField>
        )}

        {/* Endpoint - for Azure and Ollama */}
        {shouldShowEndpoint && (
          <form.AppField name={'endpoint'}>
            {(field) => (
              <field.TextField
                description={
                  isAzureAuth
                    ? 'Your Azure OpenAI resource endpoint (e.g., https://your-resource.openai.azure.com)'
                    : 'Ollama endpoint URL (default: http://localhost:11434)'
                }
                label={'Endpoint URL'}
                placeholder={isAzureAuth ? 'https://your-resource.openai.azure.com' : 'http://localhost:11434'}
                type={'url'}
              />
            )}
          </form.AppField>
        )}

        {/* Deployment Name - for Azure (optional) */}
        {shouldShowDeploymentName && (
          <form.AppField name={'deploymentName'}>
            {(field) => (
              <field.TextField
                description={'The name of your Azure OpenAI deployment (optional)'}
                label={'Deployment Name'}
                placeholder={'gpt-4-deployment'}
              />
            )}
          </form.AppField>
        )}

        {/* AWS Credentials - for Bedrock */}
        {shouldShowAwsFields && (
          <Fragment>
            <form.AppField name={'accessKeyId'}>
              {(field) => <field.TextField label={'AWS Access Key ID'} placeholder={'AKIAIOSFODNN7EXAMPLE'} />}
            </form.AppField>

            <form.AppField name={'secretAccessKey'}>
              {(field) => (
                <field.TextField
                  label={'AWS Secret Access Key'}
                  placeholder={'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'}
                  type={'password'}
                />
              )}
            </form.AppField>

            <form.AppField name={'region'}>
              {(field) => (
                <field.SelectField
                  description={'AWS region where Bedrock is available'}
                  label={'AWS Region'}
                  options={AWS_REGIONS}
                  placeholder={'Select a region'}
                />
              )}
            </form.AppField>
          </Fragment>
        )}

        {/* Notes Input */}
        <form.AppField name={'notes'}>
          {(field) => (
            <field.TextareaField
              description={'Optional notes about this configuration'}
              label={'Notes'}
              placeholder={'Add any notes about this configuration...'}
              rows={3}
            />
          )}
        </form.AppField>

        {/* Test Connection Button and Result */}
        <div className={'flex flex-col gap-2'}>
          <Button
            disabled={isTestLoading || isSubmitLoading}
            onClick={(e) => {
              e.preventDefault();
              void handleTestConnection();
            }}
            type={'button'}
            variant={'secondary'}
          >
            {isTestLoading ? 'Testing...' : 'Test Connection'}
          </Button>

          {testResult && (
            <p
              className={cn(
                'text-sm',
                testResult.isSuccess ? 'text-green-600 dark:text-green-400' : 'text-destructive'
              )}
            >
              {testResult.message}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className={'mt-2 flex justify-end gap-3'}>
          <Button disabled={isSubmitLoading} onClick={onCancel} type={'button'} variant={'outline'}>
            Cancel
          </Button>
          <form.AppForm>
            <form.SubmitButton>{isSubmitLoading ? 'Saving...' : 'Save Configuration'}</form.SubmitButton>
          </form.AppForm>
        </div>
      </div>
    </form>
  );
}

// ============================================================================
// Create Form Content
// ============================================================================

function EditApiKeyFormContent({
  initialValues,
  isSubmitLoading,
  isTestLoading,
  onCancel,
  onSubmit,
  onTestApiKey,
  setTestResult,
  testResult,
}: EditApiKeyFormContentProps) {
  const provider = initialValues?.provider;
  const providerConfig = provider ? PROVIDER_CONFIGS[provider] : null;
  const authType = providerConfig?.authType ?? 'api_key';

  // Derived booleans for conditional field rendering
  const isApiKeyAuth = authType === 'api_key';
  const isAzureAuth = authType === 'azure';
  const isAwsAuth = authType === 'aws';
  const isNoAuth = authType === 'none';

  // Show API key field for api_key and azure auth types
  const shouldShowApiKey = isApiKeyAuth || isAzureAuth;

  // Show endpoint for azure and ollama
  const shouldShowEndpoint = isAzureAuth || isNoAuth;

  // Show AWS fields for bedrock
  const shouldShowAwsFields = isAwsAuth;

  // Show deployment name for azure (optional)
  const shouldShowDeploymentName = isAzureAuth;

  const form = useAppForm({
    defaultValues: {
      accessKeyId: '',
      apiKey: '',
      deploymentName: '',
      endpoint: '',
      notes: initialValues?.notes ?? '',
      region: '',
      secretAccessKey: '',
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
    validators: {
      onSubmit: updateExtendedApiKeySchema,
    },
  });

  const handleTestConnection = async () => {
    if (!provider) {
      setTestResult({ isSuccess: false, message: 'Provider not found' });
      return;
    }

    const { accessKeyId, apiKey, deploymentName, endpoint, region, secretAccessKey } = form.state.values;

    try {
      const result = await onTestApiKey({
        credentials: {
          accessKeyId: accessKeyId || undefined,
          apiKey: apiKey || undefined,
          deploymentName: deploymentName || undefined,
          endpoint: endpoint || undefined,
          region: region || undefined,
          secretAccessKey: secretAccessKey || undefined,
        },
        provider,
      });

      if (result.success) {
        setTestResult({ isSuccess: true, message: 'Connection successful! Credentials are valid.' });
      } else {
        setTestResult({ isSuccess: false, message: result.error ?? 'Connection test failed' });
      }
    } catch (error) {
      setTestResult({
        isSuccess: false,
        message: error instanceof Error ? error.message : 'Connection test failed',
      });
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <div className={'flex flex-col gap-4'}>
        {/* Provider Display (Read-only) */}
        <div className={'flex flex-col gap-1.5'}>
          <label className={'text-sm font-medium'}>Provider</label>
          <div className={'rounded-md border border-border bg-muted px-3 py-2 text-sm'}>
            {provider ? PROVIDER_DISPLAY_NAMES[provider] : 'Unknown'}
          </div>
        </div>

        {/* Provider Helper Text */}
        {provider && (
          <div className={'-mt-2'}>
            <ProviderHelperText authType={authType} />
          </div>
        )}

        {/* API Key Input - for api_key and azure auth types */}
        {shouldShowApiKey && (
          <form.AppField name={'apiKey'}>
            {(field) => (
              <field.TextField
                description={'Leave blank to keep the existing key'}
                label={'New API Key'}
                placeholder={'Enter new API key to update'}
                type={'password'}
              />
            )}
          </form.AppField>
        )}

        {/* Endpoint - for Azure and Ollama */}
        {shouldShowEndpoint && (
          <form.AppField name={'endpoint'}>
            {(field) => (
              <field.TextField
                description={
                  isAzureAuth
                    ? 'Your Azure OpenAI resource endpoint (leave blank to keep existing)'
                    : 'Ollama endpoint URL (leave blank to keep existing)'
                }
                label={'Endpoint URL'}
                placeholder={isAzureAuth ? 'https://your-resource.openai.azure.com' : 'http://localhost:11434'}
                type={'url'}
              />
            )}
          </form.AppField>
        )}

        {/* Deployment Name - for Azure (optional) */}
        {shouldShowDeploymentName && (
          <form.AppField name={'deploymentName'}>
            {(field) => (
              <field.TextField
                description={'Leave blank to keep the existing deployment name'}
                label={'Deployment Name'}
                placeholder={'gpt-4-deployment'}
              />
            )}
          </form.AppField>
        )}

        {/* AWS Credentials - for Bedrock */}
        {shouldShowAwsFields && (
          <Fragment>
            <form.AppField name={'accessKeyId'}>
              {(field) => (
                <field.TextField
                  description={'Leave blank to keep the existing access key'}
                  label={'AWS Access Key ID'}
                  placeholder={'AKIAIOSFODNN7EXAMPLE'}
                />
              )}
            </form.AppField>

            <form.AppField name={'secretAccessKey'}>
              {(field) => (
                <field.TextField
                  description={'Leave blank to keep the existing secret key'}
                  label={'AWS Secret Access Key'}
                  placeholder={'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'}
                  type={'password'}
                />
              )}
            </form.AppField>

            <form.AppField name={'region'}>
              {(field) => (
                <field.SelectField
                  description={'Leave unchanged to keep the existing region'}
                  label={'AWS Region'}
                  options={AWS_REGIONS}
                  placeholder={'Select a region'}
                />
              )}
            </form.AppField>
          </Fragment>
        )}

        {/* Notes Input */}
        <form.AppField name={'notes'}>
          {(field) => (
            <field.TextareaField
              description={'Optional notes about this configuration'}
              label={'Notes'}
              placeholder={'Add any notes about this configuration...'}
              rows={3}
            />
          )}
        </form.AppField>

        {/* Test Connection Button and Result */}
        <div className={'flex flex-col gap-2'}>
          <Button
            disabled={isTestLoading || isSubmitLoading}
            onClick={(e) => {
              e.preventDefault();
              void handleTestConnection();
            }}
            type={'button'}
            variant={'secondary'}
          >
            {isTestLoading ? 'Testing...' : 'Test Connection'}
          </Button>

          {testResult && (
            <p
              className={cn(
                'text-sm',
                testResult.isSuccess ? 'text-green-600 dark:text-green-400' : 'text-destructive'
              )}
            >
              {testResult.message}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className={'mt-2 flex justify-end gap-3'}>
          <Button disabled={isSubmitLoading} onClick={onCancel} type={'button'} variant={'outline'}>
            Cancel
          </Button>
          <form.AppForm>
            <form.SubmitButton>{isSubmitLoading ? 'Saving...' : 'Save Changes'}</form.SubmitButton>
          </form.AppForm>
        </div>
      </div>
    </form>
  );
}

// ============================================================================
// Edit Form Content
// ============================================================================

function ProviderHelperText({ authType }: { authType: ProviderAuthType }) {
  switch (authType) {
    case 'api_key':
      return <p className={'text-xs text-muted-foreground'}>Enter your API key from the provider&apos;s dashboard.</p>;
    case 'aws':
      return (
        <p className={'text-xs text-muted-foreground'}>
          AWS Bedrock requires IAM credentials with Bedrock access permissions.
        </p>
      );
    case 'azure':
      return (
        <p className={'text-xs text-muted-foreground'}>
          Azure OpenAI requires your resource endpoint and API key from the Azure portal.
        </p>
      );
    case 'none':
      return (
        <p className={'text-xs text-muted-foreground'}>
          Ollama runs locally - no API key required. Configure the endpoint if not using the default
          (http://localhost:11434).
        </p>
      );
    default:
      return null;
  }
}
