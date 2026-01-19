'use client';

import type { ReactNode } from 'react';

import { X } from 'lucide-react';
import { useState } from 'react';

import type { CreateFeatureRequestFormValues } from '@/lib/validations/feature-request';

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
import { useSetFeatureRequestRepositories } from '@/hooks/queries/use-feature-request-repositories';
import { useCreateFeatureRequest } from '@/hooks/queries/use-feature-requests';

import { CreateFeatureRequestForm } from './create-feature-request-form';

interface NewFeatureRequestDialogProps {
  children: ReactNode;
  projectId: number;
}

export function NewFeatureRequestDialog({ children, projectId }: NewFeatureRequestDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const createFeatureRequest = useCreateFeatureRequest();
  const setRepositories = useSetFeatureRequestRepositories();

  const handleSubmit = async (values: CreateFeatureRequestFormValues) => {
    const featureRequest = await createFeatureRequest.mutateAsync({
      description: values.description,
      projectId,
      title: values.title,
    });

    if (featureRequest) {
      // Save repository associations if any were selected
      if (values.repositoryIds && values.repositoryIds.length > 0) {
        await setRepositories.mutateAsync({
          featureRequestId: featureRequest.id,
          repositoryIds: values.repositoryIds,
        });
      }
      setIsOpen(false);
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  return (
    <DialogRoot onOpenChange={setIsOpen} open={isOpen}>
      <DialogTrigger>{children}</DialogTrigger>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup>
          {/* Close Button */}
          <div className={'relative'}>
            <DialogClose render={<IconButton className={'absolute -top-2 -right-2'} />}>
              <X className={'size-4'} />
            </DialogClose>
          </div>

          {/* Dialog Header */}
          <DialogTitle>New Feature Request</DialogTitle>
          <DialogDescription>
            Create a new feature request to transform into an actionable implementation plan.
          </DialogDescription>

          {/* Form */}
          <div className={'mt-6'}>
            <CreateFeatureRequestForm
              isSubmitting={createFeatureRequest.isPending}
              onCancel={handleCancel}
              onSubmit={handleSubmit}
              projectId={projectId}
            />
          </div>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
}
