'use client';

import { Brain, Palette, Settings2 } from 'lucide-react';
import { Fragment } from 'react';

import { PageHeader } from '@/components/layout/page-header';
import { useThinkingPreference } from '@/components/providers/thinking-preference-provider';
import { ApiKeysSection } from '@/components/settings/api-keys-section';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { ThemeSelector } from '@/components/ui/theme-selector';

export default function SettingsPage() {
  const { isThinkingEnabled, setIsThinkingEnabled } = useThinkingPreference();

  const handleThinkingToggle = (isChecked: boolean) => {
    setIsThinkingEnabled(isChecked);
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

        {/* API Keys Section */}
        <ApiKeysSection />

        <Separator />
      </div>
    </Fragment>
  );
}
