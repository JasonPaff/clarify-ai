'use client';

import type { ReactNode } from 'react';

import { X } from 'lucide-react';
import { useState } from 'react';

import type { UpdateRepositoryFormValues } from '@/lib/validations/repository';

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
import { useUpdateRepository } from '@/hooks/queries/use-repositories';

import { EditRepositoryForm } from './edit-repository-form';

interface EditRepositoryDialogProps {
  children?: ReactNode;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  repository: {
    id: number;
    name: string;
    path: string;
  };
}

export function EditRepositoryDialog({
  children,
  onOpenChange,
  open: controlledOpen,
  repository,
}: EditRepositoryDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = isControlled
    ? (onOpenChange ??
      (() => {
        /* empty on purpose */
      }))
    : setUncontrolledOpen;

  const updateRepository = useUpdateRepository();

  const handleSubmit = async (values: UpdateRepositoryFormValues) => {
    const updatedRepository = await updateRepository.mutateAsync({
      data: {
        name: values.name,
        path: values.path,
      },
      id: repository.id,
    });

    if (updatedRepository) {
      setOpen(false);
    }
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <DialogRoot onOpenChange={setOpen} open={open}>
      {children && (
        <DialogTrigger nativeButton={false} render={<span className={'inline-flex'} />}>
          {children}
        </DialogTrigger>
      )}
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup>
          <div className={'relative'}>
            <DialogClose render={<IconButton className={'absolute -top-2 -right-2'} />}>
              <X className={'size-4'} />
            </DialogClose>
          </div>
          <DialogTitle>Edit Repository</DialogTitle>
          <DialogDescription>Update the repository name or path.</DialogDescription>
          <div className={'mt-6'}>
            <EditRepositoryForm
              isSubmitting={updateRepository.isPending}
              onCancel={handleCancel}
              onSubmit={handleSubmit}
              repository={repository}
            />
          </div>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
}
