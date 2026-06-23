import React, { useEffect, useState } from 'react';
import * as Icons from 'lucide-react';
import { ScheduledRelease, ScheduledReleaseAsset } from '../types';
import { useStore } from '../store';

const emptyDraft = (): ScheduledRelease => {
  const date = new Date(Date.now() + 3600000);
  return {
    id: `scheduled-release-${Date.now()}`,
    repoOwner: '',
    repoName: '',
    targetCommitish: 'main',
    tagName: '',
    releaseName: '',
    body: '',
    draft: false,
    prerelease: false,
    scheduledAt: date.toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    status: 'scheduled',
    assets: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    publishedAt: null,
    githubReleaseId: null,
    githubHtmlUrl: null,
    lastError: null
  };
};

export const ScheduledReleasesView: React.FC = () => {
  const { projects, settings, showToast } = useStore();
  const [items, setItems] = useState<ScheduledRelease[]>([]);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ScheduledRelease>(emptyDraft());

  const reload = async () => setItems(await window.api?.scheduledReleases.list() || []);
  useEffect(() => { reload(); }, []);

  const setRepo = (value: string) => {
    const [repoOwner, repoName] = value.split('/');
    const project = projects.find(p => p.githubOwner === repoOwner && p.githubRepo === repoName);
    setDraft(current => ({ ...current, repoOwner, repoName, targetCommitish: project?.githubDefaultBranch || 'main' }));
  };

  const addAssets = async () => {
    const assets: ScheduledReleaseAsset[] = await window.api?.scheduledReleases.selectAssets() || [];
    setDraft(current => ({ ...current, assets: [...current.assets, ...assets] }));
  };

  const validate = () => {
    if (!draft.repoOwner || !draft.repoName) return 'Выберите GitHub репозиторий';
    if (!draft.tagName.trim()) return 'Tag обязателен';
    if (!draft.releaseName.trim()) return 'Название релиза обязательно';
    if (new Date(draft.scheduledAt).getTime() <= Date.now()) return 'Дата публикации должна быть в будущем';
    return '';
  };

  const save = async () => {
    const error = validate();
    if (error) return showToast(error, 'error');
    await window.api?.scheduledReleases.save(draft);
    showToast('Расписание релиза сохранено', 'success');
    setEditing(false);
    setDraft(emptyDraft());
    reload();
  };

  const publishNow = async () => {
    const error = !draft.repoOwner || !draft.repoName || !draft.tagName || !draft.releaseName ? 'Заполните репозиторий, tag и название' : '';
    if (error) return showToast(error, 'error');
    const result = await window.api?.scheduledReleases.publishNow(draft);
    showToast(result?.success ? 'Релиз опубликован' : result?.error || 'Ошибка публикации', result?.success ? 'success' : 'error');
    setEditing(false);
    reload();
  };

  const localDateTime = draft.scheduledAt.slice(0, 16);
  const statuses: ScheduledRelease['status'][] = ['scheduled', 'publishing', 'published', 'failed', 'cancelled'];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white flex items-center gap-2"><Icons.Rocket className="w-5 h-5 text-purple-400" /> GitHub Releases</h2>
          <p className="text-xs text-slate-500 mt-1">Локальное расписание публикаций GitHub</p>
        </div>
        <button onClick={() => { setDraft(emptyDraft()); setEditing(true); }} className="btn-primary px-4 py-2 text-xs flex items-center gap-2"><Icons.Plus className="w-4 h-4" /> Новый релиз</button>
      </div>

      <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs text-amber-300 flex gap-2">
        <Icons.AlertTriangle className="w-4 h-4 shrink-0" />
        <span>Запланированный релиз будет опубликован только если Flux Tasks запущен в фоне. Рекомендуется включить работу в фоне и запуск вместе с Windows.</span>
      </div>

      {editing && (
        <div className="glass-card p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <select value={`${draft.repoOwner}/${draft.repoName}`} onChange={e => setRepo(e.target.value)} className="input-field bg-slate-950">
              <option value="/">Выберите репозиторий</option>
              {projects.filter(p => p.githubOwner && p.githubRepo).map(p => <option key={p.id} value={`${p.githubOwner}/${p.githubRepo}`}>{p.githubOwner}/{p.githubRepo}</option>)}
            </select>
            <input value={draft.targetCommitish} onChange={e => setDraft({ ...draft, targetCommitish: e.target.value })} className="input-field" placeholder="Branch / target_commitish" />
            <input value={draft.tagName} onChange={e => setDraft({ ...draft, tagName: e.target.value })} className="input-field" placeholder="v1.0.0" />
            <input value={draft.releaseName} onChange={e => setDraft({ ...draft, releaseName: e.target.value })} className="input-field" placeholder="Название релиза" />
          </div>
          <textarea value={draft.body} onChange={e => setDraft({ ...draft, body: e.target.value })} rows={7} className="input-field w-full font-mono" placeholder="Changelog Markdown" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input type="datetime-local" value={localDateTime} onChange={e => setDraft({ ...draft, scheduledAt: new Date(e.target.value).toISOString() })} className="input-field" />
            <input value={draft.timezone} readOnly className="input-field text-slate-400" />
          </div>
          <div className="flex gap-5 text-xs text-slate-300">
            <label className="flex gap-2"><input type="checkbox" checked={draft.draft} onChange={e => setDraft({ ...draft, draft: e.target.checked })} /> Draft</label>
            <label className="flex gap-2"><input type="checkbox" checked={draft.prerelease} onChange={e => setDraft({ ...draft, prerelease: e.target.checked })} /> Prerelease</label>
          </div>
          <div className="space-y-2">
            <button onClick={addAssets} className="btn-secondary px-3 py-2 text-xs flex items-center gap-2"><Icons.Upload className="w-4 h-4" /> Добавить assets</button>
            {draft.assets.map(asset => <div key={asset.id} className="text-xs text-slate-400 font-mono">{asset.name} — {asset.localPath}</div>)}
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setEditing(false)} className="btn-secondary px-4 py-2 text-xs">Отмена</button>
            <button onClick={publishNow} className="btn-secondary px-4 py-2 text-xs">Опубликовать сейчас</button>
            <button onClick={save} className="btn-primary px-4 py-2 text-xs">Сохранить расписание</button>
          </div>
        </div>
      )}

      {statuses.map(status => {
        const list = items.filter(item => item.status === status);
        if (!list.length) return null;
        return (
          <section key={status} className="space-y-2">
            <h3 className="text-xs uppercase tracking-wider text-slate-500">{status} ({list.length})</h3>
            {list.map(item => (
              <div key={item.id} className="glass-card p-4 flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm text-white font-semibold">{item.tagName} — {item.releaseName}</div>
                  <div className="text-xs text-slate-500 mt-1">{item.repoOwner}/{item.repoName} · {new Date(item.scheduledAt).toLocaleString()}</div>
                  {item.lastError && <div className="text-xs text-rose-400 mt-2">{item.lastError}</div>}
                  {item.githubHtmlUrl && <a href={item.githubHtmlUrl} target="_blank" rel="noreferrer" className="text-xs text-sky-400 mt-2 inline-block">Открыть на GitHub</a>}
                </div>
                <div className="flex gap-2">
                  {item.status === 'failed' && <button onClick={async () => { await window.api?.scheduledReleases.retry(item.id); reload(); }} className="btn-secondary px-3 py-1.5 text-xs">Повторить</button>}
                  {item.status === 'scheduled' && <button onClick={async () => { await window.api?.scheduledReleases.cancel(item.id); reload(); }} className="btn-secondary px-3 py-1.5 text-xs">Отменить</button>}
                </div>
              </div>
            ))}
          </section>
        );
      })}
      {!items.length && !editing && <div className="text-center py-20 text-xs text-slate-500">Запланированных релизов нет</div>}
    </div>
  );
};
