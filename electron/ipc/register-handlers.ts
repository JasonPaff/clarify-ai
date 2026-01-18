import type { BrowserWindow } from 'electron';

import type { DrizzleDatabase } from '../../db';

import { createFeatureRequestsRepository } from '../../db/repositories/feature-requests.repository';
import { createProjectsRepository } from '../../db/repositories/projects.repository';
import { createRepositoriesRepository } from '../../db/repositories/repositories.repository';
import { registerApiKeysHandlers } from './api-keys.handlers';
import { registerAppHandlers } from './app.handlers';
import { registerDialogHandlers } from './dialog.handlers';
import { registerFeatureRequestsHandlers } from './feature-requests.handlers';
import { registerFsHandlers } from './fs.handlers';
import { registerProjectsHandlers } from './projects.handlers';
import { registerRepositoriesHandlers } from './repositories.handlers';
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

  // Database handlers - Projects
  const projectsRepository = createProjectsRepository(db);
  registerProjectsHandlers(projectsRepository);

  // Database handlers - Repositories
  const repositoriesRepository = createRepositoriesRepository(db);
  registerRepositoriesHandlers(repositoriesRepository);

  // Database handlers - Feature Requests
  const featureRequestsRepository = createFeatureRequestsRepository(db);
  registerFeatureRequestsHandlers(featureRequestsRepository);
}
