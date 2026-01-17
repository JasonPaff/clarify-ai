'use client';

import { X } from 'lucide-react';
import { $path } from 'next-typesafe-url';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import type { CreateProjectFormValues } from '@/lib/validations/project';

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
import { IconButton } from '@/components/ui/icon-button';
import { useCreateProject } from '@/hooks/queries/use-projects';

import { CreateProjectForm } from './create-project-form';

type NewProjectDialogProps = RequiredChildren;

export function NewProjectDialog({ children }: NewProjectDialogProps) {
  const [open, setOpen] = useState(false);

  const router = useRouter();
  const createProject = useCreateProject();

  const handleSubmit = async (values: CreateProjectFormValues) => {
    const project = await createProject.mutateAsync({
      description: values.description || null,
      name: values.name,
    });

    if (project) {
      setOpen(false);
      router.push(
        $path({
          route: '/projects/[projectId]',
          routeParams: { projectId: project.id },
        })
      );
    }
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <DialogRoot onOpenChange={setOpen} open={open}>
      <DialogTrigger nativeButton={false} render={<span className={'inline-flex'} />}>
        {children}
      </DialogTrigger>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup>
          <div className={'relative'}>
            <DialogClose render={<IconButton className={'absolute -top-2 -right-2'} />}>
              <X className={'size-4'} />
            </DialogClose>
          </div>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Create a new project to organize your feature requests and implementation plans.
          </DialogDescription>
          <div className={'mt-6'}>
            <CreateProjectForm isSubmitting={createProject.isPending} onCancel={handleCancel} onSubmit={handleSubmit} />
          </div>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
}
