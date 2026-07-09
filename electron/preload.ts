import { contextBridge, ipcRenderer } from 'electron';
import { Task, Project, Release, NoteItem, PromptItem } from '../src/types';

contextBridge.exposeInMainWorld('api', {
  // DB Core
  loadAll: () => ipcRenderer.invoke('db:loadAll'),
  saveTask: (task: Task) => ipcRenderer.invoke('db:saveTask', task),
  deleteTask: (id: string) => ipcRenderer.invoke('db:deleteTask', id),
  saveProject: (project: Project) => ipcRenderer.invoke('db:saveProject', project),
  deleteProject: (id: string) => ipcRenderer.invoke('db:deleteProject', id),
  saveRelease: (release: Release) => ipcRenderer.invoke('db:saveRelease', release),
  deleteRelease: (id: string) => ipcRenderer.invoke('db:deleteRelease', id),
  saveNote: (note: NoteItem) => ipcRenderer.invoke('db:saveNote', note),
  deleteNote: (id: string) => ipcRenderer.invoke('db:deleteNote', id),
  savePrompt: (prompt: PromptItem) => ipcRenderer.invoke('db:savePrompt', prompt),
  deletePrompt: (id: string) => ipcRenderer.invoke('db:deletePrompt', id),
  saveSettings: (settings: Record<string, string>) => ipcRenderer.invoke('db:saveSettings', settings),
  resetDatabase: () => ipcRenderer.invoke('db:resetDatabase'),

  // Backups
  getBackups: () => ipcRenderer.invoke('backup:list'),
  createBackup: (type: 'auto' | 'manual') => ipcRenderer.invoke('backup:create', type),
  restoreBackup: (fileName: string) => ipcRenderer.invoke('backup:restore', fileName),
  deleteBackup: (fileName: string) => ipcRenderer.invoke('backup:delete', fileName),
  getDbPath: () => ipcRenderer.invoke('db:getPath'),
  cleanAutoBackups: () => ipcRenderer.invoke('backup:cleanAuto'),

  // Attachments
  saveAttachment: (sourcePath: string, fileName: string) => ipcRenderer.invoke('attachment:save', sourcePath, fileName),
  openAttachment: (filePath: string) => ipcRenderer.invoke('attachment:open', filePath),

  // Dialogs
  selectFile: (options: any) => ipcRenderer.invoke('dialog:selectFile'),
  selectDirectory: () => ipcRenderer.invoke('dialog:selectDirectory'),
  selectSaveFile: (options: any) => ipcRenderer.invoke('dialog:selectSaveFile'),
  resizeProjectIcon: (sourcePath: string) => ipcRenderer.invoke('project:resizeIcon', sourcePath),

  // Import / Export
  exportData: (format: 'json' | 'md' | 'html' | 'csv', data: any) => ipcRenderer.invoke('data:export', format, data),
  importData: () => ipcRenderer.invoke('data:import'),
  reminders: {
    start: () => ipcRenderer.invoke('reminders:start'),
    stop: () => ipcRenderer.invoke('reminders:stop'),
    checkNow: () => ipcRenderer.invoke('reminders:checkNow'),
    getUpcoming: () => ipcRenderer.invoke('reminders:getUpcoming'),
    openTask: (taskId: string) => ipcRenderer.invoke('reminders:openTask', taskId),
    onOpenTask: (callback: (taskId: string) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, taskId: string) => callback(taskId);
      ipcRenderer.on('reminders:openTask', listener);
      return () => ipcRenderer.removeListener('reminders:openTask', listener);
    }
  },
  notifications: {
    scheduleDeadline: (task: Task) => ipcRenderer.invoke('tasks:schedule-deadline-notification', task),
    cancelDeadline: (taskId: string) => ipcRenderer.invoke('tasks:cancel-deadline-notification', taskId),
    rescheduleAll: () => ipcRenderer.invoke('tasks:reschedule-all-deadline-notifications'),
    test: () => ipcRenderer.invoke('notifications:test')
  },
  settings: {
    setRunInBackground: (enabled: boolean) => ipcRenderer.invoke('settings:setRunInBackground', enabled),
    setAutoLaunch: (enabled: boolean) => ipcRenderer.invoke('settings:setAutoLaunch', enabled),
    getNotificationStatus: () => ipcRenderer.invoke('settings:getNotificationStatus')
  },
  scheduledReleases: {
    list: () => ipcRenderer.invoke('scheduledReleases:list'),
    save: (release: any) => ipcRenderer.invoke('scheduledReleases:save', release),
    cancel: (id: string) => ipcRenderer.invoke('scheduledReleases:cancel', id),
    retry: (id: string) => ipcRenderer.invoke('scheduledReleases:retry', id),
    publishNow: (release: any) => ipcRenderer.invoke('scheduledReleases:publishNow', release),
    selectAssets: () => ipcRenderer.invoke('scheduledReleases:selectAssets')
  },

  // Updates & Maintenance
  checkForUpdates: (channel: string) => ipcRenderer.invoke('update:check', channel),
  downloadUpdate: (manifest: any) => ipcRenderer.invoke('update:download', manifest),
  installUpdate: (packagePath: string, isAsarOnly: boolean, manifest?: any) => ipcRenderer.invoke('update:install', packagePath, isAsarOnly, manifest),
  getUpdateLogs: () => ipcRenderer.invoke('update:getLogs'),
  openUpdateLog: () => ipcRenderer.invoke('update:openLog'),
  getCurrentVersion: () => ipcRenderer.invoke('update:getVersion'),
  checkRollback: () => ipcRenderer.invoke('update:checkRollback'),
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
    getSystemInfo: () => ipcRenderer.invoke('app:getSystemInfo'),
    openFolder: () => ipcRenderer.invoke('app:openFolder'),
    openDataFolder: () => ipcRenderer.invoke('app:openDataFolder')
  },

  // Crash Recovery
  checkStartupCrash: () => ipcRenderer.invoke('recovery:check'),
  resetAppCrashFlag: () => ipcRenderer.invoke('recovery:resetFlag'),
  repairDatabase: () => ipcRenderer.invoke('recovery:repair'),

  // Window Controls
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    restore: () => ipcRenderer.invoke('window:restore'),
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized')
  },

  // GitHub Integration API
  github: {
    connect: (token: string) => ipcRenderer.invoke('github:connect', token),
    disconnect: () => ipcRenderer.invoke('github:disconnect'),
    getStatus: () => ipcRenderer.invoke('github:getStatus'),
    startOAuth: (clientId: string, clientSecret: string) => ipcRenderer.invoke('github:startOAuth', clientId, clientSecret),
    fetchRepos: () => ipcRenderer.invoke('github:fetchRepos'),
    getRepositoryDashboard: (owner: string, repo: string) => ipcRenderer.invoke('github:getRepositoryDashboard', owner, repo),
    fetchIssues: (owner: string, repo: string) => ipcRenderer.invoke('github:fetchIssues', owner, repo),
    getIssue: (owner: string, repo: string, number: number) => ipcRenderer.invoke('github:getIssue', owner, repo, number),
    createIssue: (owner: string, repo: string, issue: any) => ipcRenderer.invoke('github:createIssue', owner, repo, issue),
    updateIssueStatus: (owner: string, repo: string, number: number, state: 'open' | 'closed') => ipcRenderer.invoke('github:updateIssueStatus', owner, repo, number, state),
    getReleases: (owner: string, repo: string) => ipcRenderer.invoke('github:getReleases', owner, repo),
    validateRepositoryAccess: (owner: string, repo: string) => ipcRenderer.invoke('github:validateRepositoryAccess', owner, repo),
    createRelease: (owner: string, repo: string, releaseData: any) => ipcRenderer.invoke('github:createRelease', owner, repo, releaseData),
    uploadReleaseAsset: (owner: string, repo: string, releaseId: number, filePath: string, name: string) => ipcRenderer.invoke('github:uploadReleaseAsset', owner, repo, releaseId, filePath, name)
  },

  // Git Local API
  git: {
    getStatus: (localPath: string) => ipcRenderer.invoke('git:getStatus', localPath),
    getCommits: (localPath: string, limit?: number) => ipcRenderer.invoke('git:getCommits', localPath, limit),
    getTags: (localPath: string) => ipcRenderer.invoke('git:getTags', localPath),
    validateRelease: (localPath: string, tagName: string) => ipcRenderer.invoke('git:validateRelease', localPath, tagName),
    pull: (localPath: string) => ipcRenderer.invoke('git:pull', localPath),
    push: (localPath: string) => ipcRenderer.invoke('git:push', localPath),
    commit: (localPath: string, message: string) => ipcRenderer.invoke('git:commit', localPath, message),
    tag: (localPath: string, tagName: string, message?: string) => ipcRenderer.invoke('git:tag', localPath, tagName, message),
    pushTag: (localPath: string, tagName: string) => ipcRenderer.invoke('git:pushTag', localPath, tagName),
    copyFile: (sourcePath: string, destDirectory: string) => ipcRenderer.invoke('git:copyFile', sourcePath, destDirectory),
    openFolder: (localPath: string) => ipcRenderer.invoke('git:openFolder', localPath),
    openTerminal: (localPath: string) => ipcRenderer.invoke('git:openTerminal', localPath)
  }
});

