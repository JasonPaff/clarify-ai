'use client';

import { AlertTriangle, FolderOutput, Loader2, Pencil, Trash2 } from 'lucide-react';
import { withParamValidation } from 'next-typesafe-url/app/hoc';
import { use } from 'react';

import { PageProps, Route } from '@/app/(app)/projects/[projectId]/settings/route-type';
import { DefaultModelSettings } from '@/components/projects/default-model-settings';
import { DeleteProjectDialog } from '@/components/projects/delete-project-dialog';
import { EditProjectDialog } from '@/components/projects/edit-project-dialog';
import { PlanExportFolderField } from '@/components/projects/plan-export-folder-field';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useProject, useUpdateProject } from '@/hooks/queries/use-projects';
import { useAppForm } from '@/lib/forms/form-hook';

type ProjectSettingsPageProps = PageProps;

function ProjectSettingsPage({ routeParams }: ProjectSettingsPageProps) {
  const { projectId } = use(routeParams);
  const { data: project, error, isLoading } = useProject(projectId);
  const updateProject = useUpdateProject();

  const exportFolderForm = useAppForm({
    defaultValues: {
      planExportFolder: project ? (project.planExportFolder ?? '') : '',
    },
    onSubmit: async ({ value }) => {
      await updateProject.mutateAsync({
        data: {
          planExportFolder: value.planExportFolder || null,
        },
        id: projectId,
      });
    },
  });

  if (isLoading) {
    return (
      <div className={'flex items-center justify-center py-12'}>
        <Loader2 className={'size-6 animate-spin text-muted-foreground'} />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className={'py-12 text-center'}>
        <p className={'text-sm text-destructive'}>{error?.message || 'Project not found'}</p>
      </div>
    );
  }

  return (
    <div className={'space-y-6'}>
      {/* General Settings */}
      <Card>
        <CardHeader>
          <div className={'flex items-center gap-3'}>
            <div
              className={`
                flex size-10 items-center justify-center rounded-lg bg-muted
              `}
            >
              <Pencil className={'size-5 text-muted-foreground'} />
            </div>
            <div>
              <CardTitle>General</CardTitle>
              <CardDescription>Basic project information</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div
            className={`
              flex items-center justify-between rounded-lg border border-border
              p-4
            `}
          >
            <div>
              <p className={'text-sm font-medium'}>{project.name}</p>
              <p className={'text-xs text-muted-foreground'}>{project.description || 'No description'}</p>
            </div>
            <EditProjectDialog project={project}>
              <Button size={'sm'} variant={'outline'}>
                <Pencil className={'size-4'} />
                Edit
              </Button>
            </EditProjectDialog>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Export Settings */}
      <Card>
        <CardHeader>
          <div className={'flex items-center gap-3'}>
            <div className={'flex size-10 items-center justify-center rounded-lg bg-muted'}>
              <FolderOutput className={'size-5 text-muted-foreground'} />
            </div>
            <div>
              <CardTitle>Export Settings</CardTitle>
              <CardDescription>Configure where implementation plans are exported</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void exportFolderForm.handleSubmit();
            }}
          >
            <div className={'flex flex-col gap-4'}>
              <exportFolderForm.AppField name={'planExportFolder'}>
                {() => (
                  <PlanExportFolderField
                    description={'Select a folder to automatically export implementation plans as markdown files'}
                    isDisabled={updateProject.isPending}
                    label={'Plan Export Folder'}
                  />
                )}
              </exportFolderForm.AppField>

              {/* Save Button */}
              <div className={'flex justify-end'}>
                <exportFolderForm.AppForm>
                  <exportFolderForm.SubmitButton>
                    {updateProject.isPending ? 'Saving...' : 'Save'}
                  </exportFolderForm.SubmitButton>
                </exportFolderForm.AppForm>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Separator />

      {/* Default AI Models */}
      <DefaultModelSettings projectId={projectId} />

      <Separator />

      {/* Danger Zone */}
      <Card className={'border-destructive/50'}>
        <CardHeader>
          <div className={'flex items-center gap-3'}>
            <div
              className={`
                flex size-10 items-center justify-center rounded-lg
                bg-destructive/10
              `}
            >
              <AlertTriangle className={'size-5 text-destructive'} />
            </div>
            <div>
              <CardTitle className={'text-destructive'}>Danger Zone</CardTitle>
              <CardDescription>Irreversible actions for this project</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div
            className={`
              flex items-center justify-between rounded-lg border border-border
              p-4
            `}
          >
            <div>
              <p className={'text-sm font-medium'}>Delete this project</p>
              <p className={'text-xs text-muted-foreground'}>
                Once deleted, this project and all its data cannot be recovered.
              </p>
            </div>
            <DeleteProjectDialog project={project}>
              <Button size={'sm'} variant={'destructive'}>
                <Trash2 className={'size-4'} />
                Delete
              </Button>
            </DeleteProjectDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default withParamValidation(ProjectSettingsPage, Route);
