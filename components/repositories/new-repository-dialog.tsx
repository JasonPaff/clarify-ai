'use client';

import { X } from 'lucide-react';
import { type ReactNode, useState } from 'react';

import type { CreateRepositoryFormValues } from '@/lib/validations/repository';

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
import { useCreateRepository } from '@/hooks/queries/use-repositories';

import { CreateRepositoryForm } from './create-repository-form';

interface NewRepositoryDialogProps {
  children: ReactNode;
  projectId: number;
}

export function NewRepositoryDialog({ children, projectId }: NewRepositoryDialogProps) {
  const [open, setOpen] = useState(false);

  const createRepository = useCreateRepository();

  const handleSubmit = async (values: CreateRepositoryFormValues) => {
    const repository = await createRepository.mutateAsync({
      name: values.name,
      path: values.path,
      projectId,
    });

    if (repository) {
      setOpen(false);
    }
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <DialogRoot onOpenChange={setOpen} open={open}>
      <DialogTrigger>{children}</DialogTrigger>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup>
          <div className={'relative'}>
            <DialogClose render={<IconButton className={'absolute -top-2 -right-2'} />}>
              <X className={'size-4'} />
            </DialogClose>
          </div>
          <DialogTitle>Connect Repository</DialogTitle>
          <DialogDescription>
            Connect a local code repository to this project for context-aware implementation planning.
          </DialogDescription>
          <div className={'mt-6'}>
            <CreateRepositoryForm
              isSubmitting={createRepository.isPending}
              onCancel={handleCancel}
              onSubmit={handleSubmit}
            />
          </div>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
}
