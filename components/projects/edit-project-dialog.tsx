'use client';

import type { ReactNode } from 'react';

import { X } from 'lucide-react';
import { useState } from 'react';

import type { UpdateProjectFormValues } from '@/lib/validations/project';

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
import { useUpdateProject } from '@/hooks/queries/use-projects';

import { EditProjectForm } from './edit-project-form';

interface EditProjectDialogProps {
  children: ReactNode;
  project: {
    description: null | string;
    id: number;
    name: string;
  };
}

export function EditProjectDialog({ children, project }: EditProjectDialogProps) {
  const [open, setOpen] = useState(false);

  const updateProject = useUpdateProject();

  const handleSubmit = async (values: UpdateProjectFormValues) => {
    const updatedProject = await updateProject.mutateAsync({
      data: {
        description: values.description || null,
        name: values.name,
      },
      id: project.id,
    });

    if (updatedProject) {
      setOpen(false);
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
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>Update your project name and description.</DialogDescription>
          <div className={'mt-6'}>
            <EditProjectForm
              isSubmitting={updateProject.isPending}
              onCancel={handleCancel}
              onSubmit={handleSubmit}
              project={project}
            />
          </div>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
}
