import type { BrowserWindow } from 'electron';

import type { DrizzleDatabase } from '@/db';

import { createAiLogsRepository } from '@/db/repositories/ai-logs.repository';
import { createFeatureRequestContextFilesRepository } from '@/db/repositories/feature-request-context-files.repository';
import { createFeatureRequestRepositoriesRepository } from '@/db/repositories/feature-request-repositories.repository';
import { createFeatureRequestRunsRepository } from '@/db/repositories/feature-request-runs.repository';
import { createFeatureRequestsRepository } from '@/db/repositories/feature-requests.repository';
import { createProjectsRepository } from '@/db/repositories/projects.repository';
import { createRepositoriesRepository } from '@/db/repositories/repositories.repository';
import { createRepositoryOverviewsRepository } from '@/db/repositories/repository-overviews.repository';
import { createStepConfigurationsRepository } from '@/db/repositories/step-configurations.repository';

import { registerAiClarificationHandlers } from './ai-clarification.handlers';
import { registerAiDiscoveryHandlers } from './ai-discovery.handlers';
import { registerAiLogsHandlers } from './ai-logs.handlers';
import { registerAiOverviewHandlers } from './ai-overview.handlers';
import { registerAiPlanHandlers } from './ai-plan.handlers';
import { registerApiKeysHandlers } from './api-keys.handlers';
import { registerAppHandlers } from './app.handlers';
import { registerDialogHandlers } from './dialog.handlers';
import { registerFeatureRequestContextFilesHandlers } from './feature-request-context-files.handlers';
import { registerFeatureRequestRepositoriesHandlers } from './feature-request-repositories.handlers';
import { registerFeatureRequestRunsHandlers } from './feature-request-runs.handlers';
import { registerFeatureRequestsHandlers } from './feature-requests.handlers';
import { registerFileSearchHandlers } from './file-search.handlers';
import { registerFsHandlers } from './fs.handlers';
import { createAiLoggingService } from './lib/ai-logging-service';
import { registerOpenRouterModelsHandlers } from './openrouter-models.handlers';
import { registerProjectsHandlers } from './projects.handlers';
import { registerRepositoriesHandlers } from './repositories.handlers';
import { registerRepositoryOverviewsHandlers } from './repository-overviews.handlers';
import { registerStepConfigurationsHandlers } from './step-configurations.handlers';
import { registerStoreHandlers } from './store.handlers';

export function registerAllHandlers(
  db: DrizzleDatabase,
  getMainWindow: () => BrowserWindow | null,
  createDevToolsWindow: () => Promise<boolean>
): void {
  // File system handlers
  registerFsHandlers();

  // Dialog handlers (need window reference)
  registerDialogHandlers(getMainWindow);

  // Electron store handlers
  registerStoreHandlers();

  // App info handlers
  registerAppHandlers();

  // API keys handlers (encryption via safeStorage)
  registerApiKeysHandlers();

  // Create AI logging service (needs to be created early for AI handlers)
  const aiLogsRepository = createAiLogsRepository(db);
  const aiLoggingService = createAiLoggingService(aiLogsRepository);

  // AI clarification handlers (need window reference for streaming and logging service)
  registerAiClarificationHandlers(getMainWindow, aiLoggingService);

  // AI discovery handlers (need window reference for streaming and logging service)
  registerAiDiscoveryHandlers(getMainWindow, aiLoggingService);

  // AI overview handlers (need window reference for streaming and logging service)
  registerAiOverviewHandlers(getMainWindow, aiLoggingService);

  // AI plan handlers (need window reference for streaming and logging service)
  registerAiPlanHandlers(getMainWindow, aiLoggingService);

  // OpenRouter models handlers (caching via electron-store)
  registerOpenRouterModelsHandlers();

  // File search handlers (need window reference for progress updates)
  registerFileSearchHandlers(getMainWindow);

  // Database handlers - Projects
  const projectsRepository = createProjectsRepository(db);
  registerProjectsHandlers(projectsRepository);

  // Database handlers - Repositories
  const repositoriesRepository = createRepositoriesRepository(db);
  registerRepositoriesHandlers(repositoriesRepository);

  // Database handlers - Feature Requests
  const featureRequestsRepository = createFeatureRequestsRepository(db);
  registerFeatureRequestsHandlers(featureRequestsRepository);

  // Database handlers - Feature Request Repositories (junction table)
  const featureRequestRepositoriesRepository = createFeatureRequestRepositoriesRepository(db);
  registerFeatureRequestRepositoriesHandlers(featureRequestRepositoriesRepository);

  // Database handlers - Feature Request Context Files
  const featureRequestContextFilesRepository = createFeatureRequestContextFilesRepository(db);
  registerFeatureRequestContextFilesHandlers(featureRequestContextFilesRepository);

  // Database handlers - Repository Overviews
  const repositoryOverviewsRepository = createRepositoryOverviewsRepository(db);
  registerRepositoryOverviewsHandlers(repositoryOverviewsRepository);

  // Database handlers - Feature Request Runs
  const featureRequestRunsRepository = createFeatureRequestRunsRepository(db);
  registerFeatureRequestRunsHandlers(featureRequestRunsRepository);

  // Database handlers - Step Configurations
  const stepConfigurationsRepository = createStepConfigurationsRepository(db);
  registerStepConfigurationsHandlers(stepConfigurationsRepository);

  // Database handlers - AI Logs (uses the same repository created for logging service)
  registerAiLogsHandlers(aiLogsRepository, createDevToolsWindow);
}
