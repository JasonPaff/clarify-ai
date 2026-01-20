import type { IpcMainInvokeEvent } from 'electron';

import { ipcMain } from 'electron';

import { countTokensWithTokenlens, tokenlens } from '../lib/tokenlens';
import { IpcChannels } from './channels';

/** Context limits result */
export interface TokenlensContextResult {
  context?: number;
}

/** Cost estimation result */
export interface TokenlensCostResult {
  inputTokenCostUSD?: number;
  outputTokenCostUSD?: number;
  totalTokenCostUSD?: number;
}

/** Token count result */
export interface TokenlensCountResult {
  count?: number;
}

/** Model data result */
export interface TokenlensModelData {
  context?: number;
  id?: string;
  inputCostPer1M?: number;
  name?: string;
  outputCostPer1M?: number;
}

export function registerTokenlensHandlers(): void {
  // Estimate cost for a model request
  ipcMain.handle(
    IpcChannels.tokenlens.estimateCost,
    async (
      _event: IpcMainInvokeEvent,
      modelId: string,
      inputTokens: number,
      outputTokens: number,
      provider?: string
    ): Promise<TokenlensCostResult> => {
      try {
        const result = await tokenlens.computeCostUSD({
          modelId,
          provider,
          usage: { input_tokens: inputTokens, output_tokens: outputTokens },
        });

        return {
          inputTokenCostUSD: result.inputTokenCostUSD,
          outputTokenCostUSD: result.outputTokenCostUSD,
          totalTokenCostUSD: result.totalTokenCostUSD,
        };
      } catch (error) {
        console.warn('[tokenlens] Cost estimation failed:', error);
        return {};
      }
    }
  );

  // Get context limits for a model
  ipcMain.handle(
    IpcChannels.tokenlens.getContextLimits,
    async (
      _event: IpcMainInvokeEvent,
      modelId: string,
      provider?: string
    ): Promise<TokenlensContextResult> => {
      try {
        const result = await tokenlens.getContextLimits({ modelId, provider });
        return {
          context: result?.context,
        };
      } catch (error) {
        console.warn('[tokenlens] Context limits lookup failed:', error);
        return {};
      }
    }
  );

  // Get model metadata
  ipcMain.handle(
    IpcChannels.tokenlens.getModelData,
    async (
      _event: IpcMainInvokeEvent,
      modelId: string,
      provider?: string
    ): Promise<TokenlensModelData> => {
      try {
        const data = await tokenlens.getModelData({ modelId, provider });

        if (!data) {
          return {};
        }

        return {
          context: data.limit?.context,
          id: data.id,
          inputCostPer1M: data.cost?.input,
          name: data.name,
          outputCostPer1M: data.cost?.output,
        };
      } catch (error) {
        console.warn('[tokenlens] Model data lookup failed:', error);
        return {};
      }
    }
  );

  // Count tokens in text
  ipcMain.handle(
    IpcChannels.tokenlens.countTokens,
    async (
      _event: IpcMainInvokeEvent,
      modelId: string,
      text: string
    ): Promise<TokenlensCountResult> => {
      try {
        const count = await countTokensWithTokenlens(modelId, text);
        return { count };
      } catch (error) {
        console.warn('[tokenlens] Token counting failed:', error);
        return {};
      }
    }
  );
}
