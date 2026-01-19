export const IpcChannels = {
  ai: {
    clarification: {
      cancel: 'ai:clarification:cancel',
      generate: 'ai:clarification:generate',
      stream: 'ai:clarification:stream',
    },
    repositoryOverview: {
      cancel: 'ai:repositoryOverview:cancel',
      generate: 'ai:repositoryOverview:generate',
      stream: 'ai:repositoryOverview:stream',
    },
  },
  apiKeys: {
    delete: 'apiKeys:delete',
    get: 'apiKeys:get',
    getAll: 'apiKeys:getAll',
    isEncryptionAvailable: 'apiKeys:isEncryptionAvailable',
    set: 'apiKeys:set',
    test: 'apiKeys:test',
    toggleDisabled: 'apiKeys:toggleDisabled',
  },
  app: {
    getPath: 'app:getPath',
    getVersion: 'app:getVersion',
  },
  db: {
    featureRequestRepositories: {
      addToFeatureRequest: 'db:featureRequestRepositories:addToFeatureRequest',
      getByFeatureRequestId: 'db:featureRequestRepositories:getByFeatureRequestId',
      removeFromFeatureRequest: 'db:featureRequestRepositories:removeFromFeatureRequest',
      setForFeatureRequest: 'db:featureRequestRepositories:setForFeatureRequest',
    },
    featureRequests: {
      create: 'db:featureRequests:create',
      delete: 'db:featureRequests:delete',
      getById: 'db:featureRequests:getById',
      getByProjectId: 'db:featureRequests:getByProjectId',
      update: 'db:featureRequests:update',
    },
    projects: {
      create: 'db:projects:create',
      delete: 'db:projects:delete',
      getAll: 'db:projects:getAll',
      getById: 'db:projects:getById',
      getFavorited: 'db:projects:getFavorited',
      update: 'db:projects:update',
    },
    repositories: {
      create: 'db:repositories:create',
      delete: 'db:repositories:delete',
      getById: 'db:repositories:getById',
      getByProjectId: 'db:repositories:getByProjectId',
      update: 'db:repositories:update',
    },
    repositoryOverviews: {
      create: 'db:repositoryOverviews:create',
      delete: 'db:repositoryOverviews:delete',
      deleteByRepositoryId: 'db:repositoryOverviews:deleteByRepositoryId',
      getByRepositoryId: 'db:repositoryOverviews:getByRepositoryId',
      update: 'db:repositoryOverviews:update',
      upsert: 'db:repositoryOverviews:upsert',
    },
  },
  dialog: {
    openDirectory: 'dialog:openDirectory',
    openFile: 'dialog:openFile',
    saveFile: 'dialog:saveFile',
  },
  fs: {
    collectRepositoryData: 'fs:collectRepositoryData',
    exists: 'fs:exists',
    readDirectory: 'fs:readDirectory',
    readFile: 'fs:readFile',
    stat: 'fs:stat',
    writeFile: 'fs:writeFile',
  },
  openRouterModels: {
    clear: 'openRouterModels:clear',
    fetch: 'openRouterModels:fetch',
    get: 'openRouterModels:get',
  },
  store: {
    delete: 'store:delete',
    get: 'store:get',
    set: 'store:set',
  },
} as const;
