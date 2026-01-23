'use client';

import { Brain, Bug, ExternalLink, Palette, Settings2, Trash2 } from 'lucide-react';
import { Fragment, useState } from 'react';

import { PageHeader } from '@/components/layout/page-header';
import { useThinkingPreference } from '@/components/providers/thinking-preference-provider';
import { ApiKeysSection } from '@/components/settings/api-keys-section';
import { GlobalModelDefaultsSection } from '@/components/settings/global-model-defaults-section';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { ThemeSelector } from '@/components/ui/theme-selector';
import { useAiDebugLoggingConfig, usePurgeAiLogs, useUpdateAiDebugLoggingConfig } from '@/hooks/queries/use-ai-logs';
import { useElectronAiDebugLogging } from '@/hooks/useElectron';

export default function SettingsPage() {
  const { isThinkingEnabled, setIsThinkingEnabled } = useThinkingPreference();

  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  const { data: aiLogConfig } = useAiDebugLoggingConfig();
  const updateConfig = useUpdateAiDebugLoggingConfig();
  const purgeAiLogs = usePurgeAiLogs();
  const { openWindow } = useElectronAiDebugLogging();

  const isLoggingEnabled = aiLogConfig?.enabled ?? false;

  const handleThinkingToggle = (isChecked: boolean) => {
    setIsThinkingEnabled(isChecked);
  };

  const handleLoggingToggle = (isChecked: boolean) => {
    if (aiLogConfig) {
      updateConfig.mutate({
        ...aiLogConfig,
        enabled: isChecked,
      });
    }
  };

  const handleOpenDebugWindow = async () => {
    await openWindow();
  };

  const handleClearAllLogs = () => {
    if (isConfirmingClear) {
      // Pass a future date to delete all logs
      purgeAiLogs.mutate(new Date(Date.now() + 86400000).toISOString());
      setIsConfirmingClear(false);
    } else {
      setIsConfirmingClear(true);
    }
  };

  const handleCancelClear = () => {
    setIsConfirmingClear(false);
  };

  return (
    <Fragment>
      <PageHeader description={'Configure your application preferences'} title={'Settings'} />

      <div className={'space-y-6'}>
        {/* Appearance Section */}
        <Card>
          <CardHeader>
            <div className={'flex items-center gap-3'}>
              <div
                className={`
                  flex size-10 items-center justify-center rounded-lg bg-muted
                `}
              >
                <Palette className={'size-5 text-muted-foreground'} />
              </div>
              <div>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize the look and feel of the application</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ThemeSelector />
          </CardContent>
        </Card>

        <Separator />

        {/* Preferences Section */}
        <Card>
          <CardHeader>
            <div className={'flex items-center gap-3'}>
              <div
                className={`
                  flex size-10 items-center justify-center rounded-lg bg-muted
                `}
              >
                <Settings2 className={'size-5 text-muted-foreground'} />
              </div>
              <div>
                <CardTitle>Preferences</CardTitle>
                <CardDescription>General application preferences</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className={'space-y-4'}>
              {/* AI Thinking Toggle */}
              <div className={'flex items-center justify-between gap-4'}>
                <div className={'flex items-center gap-3'}>
                  <div
                    className={`
                      flex size-8 items-center justify-center rounded-md bg-muted
                    `}
                  >
                    <Brain className={'size-4 text-muted-foreground'} />
                  </div>
                  <div className={'space-y-0.5'}>
                    <label className={'text-sm font-medium'} htmlFor={'thinking-toggle'}>
                      Enable AI Thinking
                    </label>
                    <p className={'text-xs text-muted-foreground'}>
                      When enabled, models that support extended thinking will show their reasoning process
                    </p>
                  </div>
                </div>
                <Switch checked={isThinkingEnabled} id={'thinking-toggle'} onCheckedChange={handleThinkingToggle} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Default AI Models Section */}
        <GlobalModelDefaultsSection />

        {/* API Keys Section */}
        <ApiKeysSection />

        <Separator />

        {/* Developer Tools Section */}
        <Card>
          <CardHeader>
            <div className={'flex items-center gap-3'}>
              <div
                className={`
                  flex size-10 items-center justify-center rounded-lg bg-muted
                `}
              >
                <Bug className={'size-5 text-muted-foreground'} />
              </div>
              <div>
                <CardTitle>Developer Tools</CardTitle>
                <CardDescription>Debugging and diagnostic tools for development</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className={'space-y-4'}>
              {/* AI Debug Logging Toggle */}
              <div className={'flex items-center justify-between gap-4'}>
                <div className={'flex items-center gap-3'}>
                  <div
                    className={`
                      flex size-8 items-center justify-center rounded-md bg-muted
                    `}
                  >
                    <Bug className={'size-4 text-muted-foreground'} />
                  </div>
                  <div className={'space-y-0.5'}>
                    <label className={'text-sm font-medium'} htmlFor={'debug-logging-toggle'}>
                      Enable AI Debug Logging
                    </label>
                    <p className={'text-xs text-muted-foreground'}>
                      Captures AI requests and responses for debugging. Logs may consume disk space.
                    </p>
                  </div>
                </div>
                <Switch
                  checked={isLoggingEnabled}
                  id={'debug-logging-toggle'}
                  onCheckedChange={handleLoggingToggle}
                />
              </div>

              {/* Actions */}
              <div className={'flex items-center gap-3 pt-2'}>
                <Button onClick={handleOpenDebugWindow} size={'sm'} variant={'outline'}>
                  <ExternalLink className={'size-4'} />
                  Open Debug Logs
                </Button>
                {isConfirmingClear ? (
                  <div className={'flex items-center gap-2'}>
                    <Button
                      disabled={purgeAiLogs.isPending}
                      onClick={handleClearAllLogs}
                      size={'sm'}
                      variant={'destructive'}
                    >
                      <Trash2 className={'size-4'} />
                      {purgeAiLogs.isPending ? 'Clearing...' : 'Confirm Clear'}
                    </Button>
                    <Button onClick={handleCancelClear} size={'sm'} variant={'ghost'}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button onClick={handleClearAllLogs} size={'sm'} variant={'outline'}>
                    <Trash2 className={'size-4'} />
                    Clear All Logs
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Fragment>
  );
}
