import { ipcMain, type IpcMainInvokeEvent } from 'electron';

import type { StepConfigurationsRepository } from '@/db/repositories/step-configurations.repository';
import type {
  NewStepConfiguration,
  StepConfiguration,
  StepConfigurationStep,
} from '@/db/schema/step-configurations.schema';

import { IpcChannels } from './channels';

export function registerStepConfigurationsHandlers(stepConfigurationsRepository: StepConfigurationsRepository): void {
  ipcMain.handle(
    IpcChannels.db.stepConfigurations.getById,
    (_event: IpcMainInvokeEvent, id: number): StepConfiguration | undefined => {
      return stepConfigurationsRepository.getById(id);
    }
  );

  ipcMain.handle(
    IpcChannels.db.stepConfigurations.getByFeatureRequestId,
    (_event: IpcMainInvokeEvent, featureRequestId: number): Array<StepConfiguration> => {
      return stepConfigurationsRepository.getByFeatureRequestId(featureRequestId);
    }
  );

  ipcMain.handle(
    IpcChannels.db.stepConfigurations.getByFeatureRequestIdAndStep,
    (
      _event: IpcMainInvokeEvent,
      featureRequestId: number,
      step: StepConfigurationStep
    ): StepConfiguration | undefined => {
      return stepConfigurationsRepository.getByFeatureRequestIdAndStep(featureRequestId, step);
    }
  );

  ipcMain.handle(
    IpcChannels.db.stepConfigurations.create,
    (_event: IpcMainInvokeEvent, data: NewStepConfiguration): StepConfiguration => {
      return stepConfigurationsRepository.create(data);
    }
  );

  ipcMain.handle(
    IpcChannels.db.stepConfigurations.update,
    (_event: IpcMainInvokeEvent, id: number, data: Partial<NewStepConfiguration>): StepConfiguration | undefined => {
      return stepConfigurationsRepository.update(id, data);
    }
  );

  ipcMain.handle(
    IpcChannels.db.stepConfigurations.upsert,
    (
      _event: IpcMainInvokeEvent,
      featureRequestId: number,
      step: StepConfigurationStep,
      data: Omit<NewStepConfiguration, 'featureRequestId' | 'step'>
    ): StepConfiguration => {
      return stepConfigurationsRepository.upsert(featureRequestId, step, data);
    }
  );

  ipcMain.handle(IpcChannels.db.stepConfigurations.delete, (_event: IpcMainInvokeEvent, id: number): boolean => {
    return stepConfigurationsRepository.delete(id);
  });
}
