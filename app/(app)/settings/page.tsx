'use client';

import { Palette, Settings2 } from 'lucide-react';
import { Fragment } from 'react';

import { PageHeader } from '@/components/layout/page-header';
import { ApiKeysSection } from '@/components/settings/api-keys-section';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ThemeSelector } from '@/components/ui/theme-selector';

export default function SettingsPage() {
  return (
    <Fragment>
      <PageHeader description={'Configure your application preferences'} title={'Settings'} />

      <div className={'space-y-6'}>
        {/* API Keys Section */}
        <ApiKeysSection />

        <Separator />

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
            <div
              className={`
                rounded-lg border border-dashed border-border p-8 text-center
                text-sm text-muted-foreground
              `}
            >
              Preferences configuration coming soon
            </div>
          </CardContent>
        </Card>
      </div>
    </Fragment>
  );
}
