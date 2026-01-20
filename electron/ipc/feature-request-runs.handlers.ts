import { ipcMain, type IpcMainInvokeEvent } from 'electron';

import type { FeatureRequestRunsRepository } from '@/db/repositories/feature-request-runs.repository';
import type {
  FeatureRequestRun,
  FeatureRequestRunStatus,
  FeatureRequestRunStep,
  NewFeatureRequestRun,
} from '@/db/schema/feature-request-runs.schema';

import { IpcChannels } from './channels';

export function registerFeatureRequestRunsHandlers(featureRequestRunsRepository: FeatureRequestRunsRepository): void {
  ipcMain.handle(
    IpcChannels.db.featureRequestRuns.getById,
    (_event: IpcMainInvokeEvent, id: number): FeatureRequestRun | undefined => {
      return featureRequestRunsRepository.getById(id);
    }
  );

  ipcMain.handle(
    IpcChannels.db.featureRequestRuns.getByFeatureRequestId,
    (_event: IpcMainInvokeEvent, featureRequestId: number): Array<FeatureRequestRun> => {
      return featureRequestRunsRepository.getByFeatureRequestId(featureRequestId);
    }
  );

  ipcMain.handle(
    IpcChannels.db.featureRequestRuns.getByFeatureRequestIdAndStep,
    (_event: IpcMainInvokeEvent, featureRequestId: number, step: FeatureRequestRunStep): Array<FeatureRequestRun> => {
      return featureRequestRunsRepository.getByFeatureRequestIdAndStep(featureRequestId, step);
    }
  );

  ipcMain.handle(
    IpcChannels.db.featureRequestRuns.getByFeatureRequestIdAndStatus,
    (
      _event: IpcMainInvokeEvent,
      featureRequestId: number,
      status: FeatureRequestRunStatus
    ): Array<FeatureRequestRun> => {
      return featureRequestRunsRepository.getByFeatureRequestIdAndStatus(featureRequestId, status);
    }
  );

  ipcMain.handle(
    IpcChannels.db.featureRequestRuns.getLatestByFeatureRequestId,
    (_event: IpcMainInvokeEvent, featureRequestId: number): FeatureRequestRun | undefined => {
      return featureRequestRunsRepository.getLatestByFeatureRequestId(featureRequestId);
    }
  );

  ipcMain.handle(
    IpcChannels.db.featureRequestRuns.getLatestByFeatureRequestIdAndStep,
    (
      _event: IpcMainInvokeEvent,
      featureRequestId: number,
      step: FeatureRequestRunStep
    ): FeatureRequestRun | undefined => {
      return featureRequestRunsRepository.getLatestByFeatureRequestIdAndStep(featureRequestId, step);
    }
  );

  ipcMain.handle(
    IpcChannels.db.featureRequestRuns.create,
    (_event: IpcMainInvokeEvent, data: NewFeatureRequestRun): FeatureRequestRun => {
      return featureRequestRunsRepository.create(data);
    }
  );

  ipcMain.handle(
    IpcChannels.db.featureRequestRuns.update,
    (_event: IpcMainInvokeEvent, id: number, data: Partial<NewFeatureRequestRun>): FeatureRequestRun | undefined => {
      return featureRequestRunsRepository.update(id, data);
    }
  );

  ipcMain.handle(IpcChannels.db.featureRequestRuns.delete, (_event: IpcMainInvokeEvent, id: number): boolean => {
    return featureRequestRunsRepository.delete(id);
  });

  ipcMain.handle(
    IpcChannels.db.featureRequestRuns.getCurrentRun,
    (
      _event: IpcMainInvokeEvent,
      featureRequestId: number,
      step: FeatureRequestRunStep
    ): FeatureRequestRun | undefined => {
      return featureRequestRunsRepository.getCurrentRun(featureRequestId, step);
    }
  );

  ipcMain.handle(
    IpcChannels.db.featureRequestRuns.setCurrentRun,
    (
      _event: IpcMainInvokeEvent,
      featureRequestId: number,
      step: FeatureRequestRunStep,
      runId: number
    ): FeatureRequestRun | undefined => {
      return featureRequestRunsRepository.setCurrentRun(featureRequestId, step, runId);
    }
  );
}
