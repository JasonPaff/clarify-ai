import type { BrowserWindow } from 'electron';

import type { DrizzleDatabase } from '../../db';

import { createFeatureRequestRepositoriesRepository } from '../../db/repositories/feature-request-repositories.repository';
import { createFeatureRequestsRepository } from '../../db/repositories/feature-requests.repository';
import { createProjectsRepository } from '../../db/repositories/projects.repository';
import { createRepositoriesRepository } from '../../db/repositories/repositories.repository';
import { createRepositoryOverviewsRepository } from '../../db/repositories/repository-overviews.repository';
import { registerAiClarificationHandlers } from './ai-clarification.handlers';
import { registerAiOverviewHandlers } from './ai-overview.handlers';
import { registerApiKeysHandlers } from './api-keys.handlers';
import { registerAppHandlers } from './app.handlers';
import { registerDialogHandlers } from './dialog.handlers';
import { registerFeatureRequestRepositoriesHandlers } from './feature-request-repositories.handlers';
import { registerFeatureRequestsHandlers } from './feature-requests.handlers';
import { registerFsHandlers } from './fs.handlers';
import { registerOpenRouterModelsHandlers } from './openrouter-models.handlers';
import { registerProjectsHandlers } from './projects.handlers';
import { registerRepositoriesHandlers } from './repositories.handlers';
import { registerRepositoryOverviewsHandlers } from './repository-overviews.handlers';
import { registerStoreHandlers } from './store.handlers';

export function registerAllHandlers(db: DrizzleDatabase, getMainWindow: () => BrowserWindow | null): void {
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

  // AI clarification handlers (need window reference for streaming)
  registerAiClarificationHandlers(getMainWindow);

  // AI overview handlers (need window reference for streaming)
  registerAiOverviewHandlers(getMainWindow);

  // OpenRouter models handlers (caching via electron-store)
  registerOpenRouterModelsHandlers();

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

  // Database handlers - Repository Overviews
  const repositoryOverviewsRepository = createRepositoryOverviewsRepository(db);
  registerRepositoryOverviewsHandlers(repositoryOverviewsRepository);
}
