export const IpcChannels = {
  ai: {
    clarification: {
      cancel: 'ai:clarification:cancel',
      generate: 'ai:clarification:generate',
      stream: 'ai:clarification:stream',
    },
  },
  apiKeys: {
    delete: 'apiKeys:delete',
    get: 'apiKeys:get',
    getAll: 'apiKeys:getAll',
    isEncryptionAvailable: 'apiKeys:isEncryptionAvailable',
    set: 'apiKeys:set',
    test: 'apiKeys:test',
  },
  app: {
    getPath: 'app:getPath',
    getVersion: 'app:getVersion',
  },
  db: {
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
      update: 'db:projects:update',
    },
    repositories: {
      create: 'db:repositories:create',
      delete: 'db:repositories:delete',
      getById: 'db:repositories:getById',
      getByProjectId: 'db:repositories:getByProjectId',
      update: 'db:repositories:update',
    },
  },
  dialog: {
    openDirectory: 'dialog:openDirectory',
    openFile: 'dialog:openFile',
    saveFile: 'dialog:saveFile',
  },
  fs: {
    exists: 'fs:exists',
    readDirectory: 'fs:readDirectory',
    readFile: 'fs:readFile',
    stat: 'fs:stat',
    writeFile: 'fs:writeFile',
  },
  store: {
    delete: 'store:delete',
    get: 'store:get',
    set: 'store:set',
  },
} as const;
