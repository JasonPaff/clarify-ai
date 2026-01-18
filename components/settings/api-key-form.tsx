'use client';

import { useCallback, useState } from 'react';

import type { ApiProvider, CreateApiKeyFormValues, UpdateApiKeyFormValues } from '@/lib/validations/api-key';

import { Button } from '@/components/ui/button';
import { useSetApiKey, useTestApiKey } from '@/hooks/queries/use-api-keys';
import { useAppForm } from '@/lib/forms/form-hook';
import { cn } from '@/lib/utils';
import { apiProviders, createApiKeySchema, updateApiKeySchema } from '@/lib/validations/api-key';

interface ApiKeyFormProps {
  initialValues?: {
    notes: string;
    provider: ApiProvider;
  };
  isSubmitting?: boolean;
  mode: FormMode;
  onCancel: () => void;
  onSuccess: () => void;
}

type FormMode = 'create' | 'edit';

const providerOptions = apiProviders.map((provider) => ({
  label: provider.charAt(0).toUpperCase() + provider.slice(1),
  value: provider,
}));

interface CreateApiKeyFormContentProps {
  isSubmitLoading: boolean;
  isTestLoading: boolean;
  onCancel: () => void;
  onSubmit: (values: CreateApiKeyFormValues) => Promise<void>;
  onTestApiKey: (params: { apiKey?: string; provider: ApiProvider }) => Promise<{ error?: string; success: boolean }>;
  setTestResult: (result: null | { isSuccess: boolean; message: string }) => void;
  testResult: null | { isSuccess: boolean; message: string };
}

interface EditApiKeyFormContentProps {
  initialValues?: {
    notes: string;
    provider: ApiProvider;
  };
  isSubmitLoading: boolean;
  isTestLoading: boolean;
  onCancel: () => void;
  onSubmit: (values: UpdateApiKeyFormValues) => Promise<void>;
  onTestApiKey: (params: { apiKey?: string; provider: ApiProvider }) => Promise<{ error?: string; success: boolean }>;
  setTestResult: (result: null | { isSuccess: boolean; message: string }) => void;
  testResult: null | { isSuccess: boolean; message: string };
}

export function ApiKeyForm({ initialValues, isSubmitting, mode, onCancel, onSuccess }: ApiKeyFormProps) {
  const [testResult, setTestResult] = useState<null | { isSuccess: boolean; message: string }>(null);

  const setApiKey = useSetApiKey();
  const testApiKey = useTestApiKey();

  const _isCreateMode = mode === 'create';
  const _isTestLoading = testApiKey.isPending;
  const _isSubmitLoading = setApiKey.isPending || isSubmitting || false;

  const handleSubmit = useCallback(
    async (values: CreateApiKeyFormValues | UpdateApiKeyFormValues) => {
      const isCreateMode = mode === 'create';

      try {
        const provider = isCreateMode ? (values as CreateApiKeyFormValues).provider : initialValues?.provider;

        if (!provider) {
          return;
        }

        const apiKey = isCreateMode
          ? (values as CreateApiKeyFormValues).apiKey
          : (values as UpdateApiKeyFormValues).apiKey;

        // Only set if we have an API key (required for create, optional for edit)
        if (apiKey) {
          const result = await setApiKey.mutateAsync({
            key: apiKey,
            notes: values.notes,
            provider,
          });

          if (!result.success) {
            throw new Error(result.error ?? 'Failed to save API key');
          }
        }

        onSuccess();
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to save API key');
      }
    },
    [mode, initialValues?.provider, onSuccess, setApiKey]
  );

  if (_isCreateMode) {
    return (
      <CreateApiKeyFormContent
        isSubmitLoading={_isSubmitLoading}
        isTestLoading={_isTestLoading}
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
      isSubmitLoading={_isSubmitLoading}
      isTestLoading={_isTestLoading}
      onCancel={onCancel}
      onSubmit={handleSubmit}
      onTestApiKey={testApiKey.mutateAsync}
      setTestResult={setTestResult}
      testResult={testResult}
    />
  );
}

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
      apiKey: '',
      notes: '',
      provider: '' as ApiProvider,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
    validators: {
      onSubmit: createApiKeySchema,
    },
  });

  const handleTestConnection = async () => {
    // Access form values directly from state to ensure we get current values
    const { apiKey, provider } = form.state.values;

    if (!provider || !apiKey) {
      setTestResult({ isSuccess: false, message: 'Please select a provider and enter an API key first' });
      return;
    }

    try {
      const result = await onTestApiKey({ apiKey, provider });

      if (result.success) {
        setTestResult({ isSuccess: true, message: 'Connection successful! API key is valid.' });
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

        {/* API Key Input */}
        <form.AppField name={'apiKey'}>
          {(field) => <field.TextField label={'API Key'} placeholder={'Enter your API key'} type={'password'} />}
        </form.AppField>

        {/* Notes Input */}
        <form.AppField name={'notes'}>
          {(field) => (
            <field.TextareaField
              description={'Optional notes about this API key'}
              label={'Notes'}
              placeholder={'Add any notes about this key...'}
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
            <form.SubmitButton>{isSubmitLoading ? 'Saving...' : 'Save API Key'}</form.SubmitButton>
          </form.AppForm>
        </div>
      </div>
    </form>
  );
}

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
  const form = useAppForm({
    defaultValues: {
      apiKey: '',
      notes: initialValues?.notes ?? '',
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
    validators: {
      onSubmit: updateApiKeySchema,
    },
  });

  const handleTestConnection = async () => {
    const provider = initialValues?.provider;

    if (!provider) {
      setTestResult({ isSuccess: false, message: 'Provider not found' });
      return;
    }

    // Get the new API key from form if entered, otherwise test the saved key
    const formApiKey = form.state.values.apiKey;
    const apiKey = formApiKey || undefined;

    try {
      const result = await onTestApiKey({ apiKey, provider });

      if (result.success) {
        setTestResult({ isSuccess: true, message: 'Connection successful! API key is valid.' });
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
            {initialValues?.provider
              ? initialValues.provider.charAt(0).toUpperCase() + initialValues.provider.slice(1)
              : 'Unknown'}
          </div>
        </div>

        {/* API Key Input */}
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

        {/* Notes Input */}
        <form.AppField name={'notes'}>
          {(field) => (
            <field.TextareaField
              description={'Optional notes about this API key'}
              label={'Notes'}
              placeholder={'Add any notes about this key...'}
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
