'use client';

import { X } from 'lucide-react';

import type { FeatureRequest } from '@/db/schema/feature-requests.schema';
import type { EditFeatureRequestFormValues } from '@/lib/validations/feature-request';

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
import { useUpdateFeatureRequest } from '@/hooks/queries/use-feature-requests';
import { useControllableState } from '@/hooks/use-controllable-state';

import { EditFeatureRequestForm } from './edit-feature-request-form';

type EditFeatureRequestDialogProps = Children & {
  featureRequest: Pick<FeatureRequest, 'description' | 'id' | 'status' | 'title'>;
  initialRepositoryIds: Array<number>;
  onOpenChange?: (isOpen: boolean) => void;
  open?: boolean;
  projectId: number;
};

export function EditFeatureRequestDialog({
  children,
  featureRequest,
  initialRepositoryIds,
  onOpenChange,
  open: controlledOpen,
  projectId,
}: EditFeatureRequestDialogProps) {
  const [isOpen, setIsOpen] = useControllableState({
    defaultValue: false,
    onChange: onOpenChange,
    value: controlledOpen,
  });

  const updateFeatureRequest = useUpdateFeatureRequest();

  const handleSubmit = async (values: EditFeatureRequestFormValues) => {
    const updatedFeatureRequest = await updateFeatureRequest.mutateAsync({
      data: {
        description: values.description,
        status: values.status,
        title: values.title,
      },
      id: featureRequest.id,
    });

    if (updatedFeatureRequest) {
      setIsOpen(false);
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  return (
    <DialogRoot onOpenChange={setIsOpen} open={isOpen}>
      {/* Trigger */}
      {children && <DialogTrigger>{children}</DialogTrigger>}

      {/* Dialog Content */}
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup>
          {/* Close Button */}
          <div className={'relative'}>
            <DialogClose render={<IconButton className={'absolute -top-2 -right-2'} />}>
              <X className={'size-4'} />
            </DialogClose>
          </div>

          {/* Header */}
          <DialogTitle>Edit Feature Request</DialogTitle>
          <DialogDescription>Update the feature request details.</DialogDescription>

          {/* Form */}
          <div className={'mt-6'}>
            <EditFeatureRequestForm
              featureRequest={featureRequest}
              initialRepositoryIds={initialRepositoryIds}
              isSubmitting={updateFeatureRequest.isPending}
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
