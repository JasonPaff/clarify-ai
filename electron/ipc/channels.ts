export const IpcChannels = {
  app: {
    getPath: 'app:getPath',
    getVersion: 'app:getVersion',
  },
  db: {
    projects: {
      create: 'db:projects:create',
      delete: 'db:projects:delete',
      getAll: 'db:projects:getAll',
      getById: 'db:projects:getById',
      update: 'db:projects:update',
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
