import { app, BrowserWindow, Menu, Notification, Tray } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import {
  loadScheduledReleases,
  loadSettings,
  loadTasks,
  markTaskReminderSent,
  saveSetting,
  saveScheduledRelease,
  updateScheduledReleaseStatus
} from './database';
import { getDecryptedToken } from './git-github';
import { ScheduledRelease } from '../src/types';
import { isScheduledReleaseDue, shouldSendReminder } from './scheduler-logic';

let reminderTimer: NodeJS.Timeout | null = null;
let releaseTimer: NodeJS.Timeout | null = null;
let tray: Tray | null = null;
let openingTaskId: string | null = null;

function showWindow(getWindow: () => BrowserWindow | null, taskId?: string) {
  const win = getWindow();
  if (!win) return;
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
  if (taskId) {
    openingTaskId = taskId;
    win.webContents.send('reminders:openTask', taskId);
  }
}

export function checkReminders(getWindow: () => BrowserWindow | null): number {
  const now = Date.now();
  let sent = 0;
  for (const task of loadTasks()) {
    if (!shouldSendReminder(task, now)) continue;

    if (Notification.isSupported()) {
      const notification = new Notification({
        title: 'Flux Tasks',
        body: `Дедлайн задачи: ${task.title}`,
        icon: path.join(__dirname, '../assets/icon.png')
      });
      notification.on('click', () => showWindow(getWindow, task.id));
      notification.show();
    }
    markTaskReminderSent(task.id, new Date().toISOString());
    sent += 1;
  }
  return sent;
}

export function startReminderService(getWindow: () => BrowserWindow | null) {
  stopReminderService();
  checkReminders(getWindow);
  reminderTimer = setInterval(() => checkReminders(getWindow), 60_000);
}

export function stopReminderService() {
  if (reminderTimer) clearInterval(reminderTimer);
  reminderTimer = null;
}

async function githubRequest(url: string, init: RequestInit) {
  const token = getDecryptedToken();
  if (!token) throw new Error('GitHub не подключён. Добавьте токен в настройках.');
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'Flux-Tasks-App',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init.headers || {})
    }
  });
  if (!response.ok) {
    const details = await response.text();
    if (response.status === 422 && details.toLowerCase().includes('already_exists')) {
      throw new Error('Релиз или tag уже существует. Измените tag либо опубликуйте релиз как draft.');
    }
    if (response.status === 401) throw new Error('Неверный или истёкший GitHub token.');
    if (response.status === 403) throw new Error('Недостаточно прав token: требуется repo/public_repo или contents:write.');
    throw new Error(`GitHub API ${response.status}: ${details.slice(0, 300)}`);
  }
  return response;
}

export async function publishScheduledRelease(release: ScheduledRelease) {
  updateScheduledReleaseStatus(release.id, 'publishing');
  try {
    for (const asset of release.assets) {
      if (!fs.existsSync(asset.localPath)) throw new Error(`Файл релиза не найден: ${asset.name}`);
    }
    const createdResponse = await githubRequest(
      `https://api.github.com/repos/${encodeURIComponent(release.repoOwner)}/${encodeURIComponent(release.repoName)}/releases`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tag_name: release.tagName,
          target_commitish: release.targetCommitish,
          name: release.releaseName,
          body: release.body,
          draft: release.draft,
          prerelease: release.prerelease
        })
      }
    );
    const created: any = await createdResponse.json();
    for (const asset of release.assets) {
      const file = fs.readFileSync(asset.localPath);
      await githubRequest(
        `https://uploads.github.com/repos/${encodeURIComponent(release.repoOwner)}/${encodeURIComponent(release.repoName)}/releases/${created.id}/assets?name=${encodeURIComponent(asset.name)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/octet-stream', 'Content-Length': String(file.length) },
          body: file
        }
      );
    }
    const publishedAt = new Date().toISOString();
    updateScheduledReleaseStatus(release.id, 'published', {
      publishedAt,
      githubReleaseId: String(created.id),
      githubHtmlUrl: created.html_url,
      lastError: null
    });
    if ((loadSettings().releaseNotifications ?? 'true') === 'true' && Notification.isSupported()) {
      new Notification({ title: 'Flux Tasks', body: `GitHub релиз опубликован: ${release.tagName}` }).show();
    }
    return { success: true };
  } catch (error: any) {
    const message = error?.message || 'Неизвестная ошибка публикации';
    updateScheduledReleaseStatus(release.id, 'failed', { lastError: message });
    if ((loadSettings().releaseNotifications ?? 'true') === 'true' && Notification.isSupported()) {
      new Notification({ title: 'Flux Tasks', body: `Не удалось опубликовать релиз: ${message}` }).show();
    }
    return { success: false, error: message };
  }
}

export async function checkScheduledReleases() {
  if ((loadSettings().backgroundReleasePublishing ?? 'true') !== 'true') return;
  const now = Date.now();
  const due = loadScheduledReleases().filter(r => isScheduledReleaseDue(r.status, r.scheduledAt, now));
  for (const release of due) await publishScheduledRelease(release);
}

export function startReleaseScheduler() {
  if (releaseTimer) clearInterval(releaseTimer);
  checkScheduledReleases();
  const seconds = Math.max(15, Number(loadSettings().releaseCheckIntervalSeconds || 60));
  releaseTimer = setInterval(checkScheduledReleases, seconds * 1000);
}

export function configureTray(getWindow: () => BrowserWindow | null, onQuit: () => void) {
  if (tray) return tray;
  tray = new Tray(path.join(__dirname, '../assets/icon.png'));
  const refreshMenu = () => {
    const upcoming = loadTasks().filter(t => t.dueAt && t.status !== 'completed')
      .sort((a, b) => new Date(a.dueAt!).getTime() - new Date(b.dueAt!).getTime()).slice(0, 5);
    tray!.setContextMenu(Menu.buildFromTemplate([
      { label: 'Открыть Flux Tasks', click: () => showWindow(getWindow) },
      {
        label: 'Ближайшие дедлайны',
        submenu: upcoming.length
          ? upcoming.map(t => ({ label: `${t.title} — ${new Date(t.dueAt!).toLocaleString()}`, click: () => showWindow(getWindow, t.id) }))
          : [{ label: 'Нет ближайших задач', enabled: false }]
      },
      { type: 'separator' },
      { label: 'Выйти', click: onQuit }
    ]));
  };
  refreshMenu();
  tray.on('click', () => showWindow(getWindow));
  tray.on('right-click', refreshMenu);
  tray.setToolTip('Flux Tasks');
  return tray;
}

export function setRunInBackground(enabled: boolean) {
  saveSetting('runInBackground', String(enabled));
}

export function setAutoLaunch(enabled: boolean) {
  app.setLoginItemSettings({ openAtLogin: enabled, args: enabled ? ['--background'] : [] });
  saveSetting('autoLaunch', String(enabled));
}

export function consumePendingTaskId() {
  const id = openingTaskId;
  openingTaskId = null;
  return id;
}

export function normalizeScheduledRelease(release: ScheduledRelease) {
  saveScheduledRelease({ ...release, updatedAt: new Date().toISOString() });
}
