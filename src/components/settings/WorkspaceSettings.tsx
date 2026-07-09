import React from 'react';
import { useStore } from '../../store';
import * as Icons from 'lucide-react';

export const WorkspaceSettings: React.FC = () => {
  const {
    backups,
    restoreFromBackup,
    deleteBackup,
    showToast,
    settings
  } = useStore();

  const lang = settings.language;

  const formatBytes = (bytes: number | undefined) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl border border-white/5 bg-slate-950/20 space-y-4">
        <h4 className="text-xs font-semibold tracking-wider text-slate-200 uppercase flex items-center gap-2">
          <Icons.FolderOpen className="w-4 h-4 accent-text" />
          <span>{lang === 'ru' ? 'Резервные копии базы данных' : lang === 'uk' ? 'Резервні копії бази даних' : 'Database Backups List'}</span>
        </h4>
        <p className="text-[10px] text-slate-500">
          {lang === 'ru' ? 'Список всех резервных копий, хранящихся локально. Вы можете восстановить базу данных на момент создания копии.' : 
           lang === 'uk' ? 'Список усіх резервних копій, що зберігаються локально. Ви можете відновити базу даних на момент створення копії.' : 
           'List of backup files stored locally. You can restore your database to any backup point.'}
        </p>

        <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {backups.map((bak) => (
            <div key={bak.id} className="p-3.5 border border-white/5 bg-black/25 rounded-2xl space-y-2 hover:border-white/10 transition-all select-text">
              <div className="flex items-center justify-between">
                <span className={`text-[8px] font-mono px-2 py-0.5 rounded border font-semibold ${
                  bak.type === 'auto' 
                    ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25' 
                    : 'accent-bg-10 accent-text accent-border-25'
                }`}>
                  {bak.type === 'auto' ? 'AUTO' : 'MANUAL'}
                </span>
                
                <span className="font-mono text-[10px] text-slate-400 font-bold shrink-0">
                  {formatBytes(bak.sizeBytes)}
                </span>
              </div>
              
              <div className="font-mono text-xs text-slate-200 break-all select-all font-semibold">
                {bak.id}
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-white/[0.02] shrink-0 select-none">
                <span>{new Date(bak.timestamp).toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US')}</span>
                
                <div className="flex items-center gap-3.5 font-bold shrink-0 select-none">
                  <button 
                    onClick={async () => {
                      const res = await restoreFromBackup(bak.id);
                      if (res.success) {
                        showToast(lang === 'ru' ? 'База данных успешно восстановлена!' : 'Database restored successfully!', 'success');
                      } else {
                        showToast(`Error: ${res.error}`, 'error');
                      }
                    }}
                    className="text-[11px] accent-text accent-hover-text hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Icons.RotateCcw className="w-3 h-3" />
                    <span>{lang === 'ru' ? 'Восстановить' : 'Restore'}</span>
                  </button>
                  <button 
                    onClick={() => deleteBackup(bak.id)}
                    className="text-[11px] text-rose-400 hover:text-rose-300 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Icons.X className="w-3 h-3" />
                    <span>{lang === 'ru' ? 'Удалить' : 'Delete'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
          {backups.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center py-12 text-slate-600 text-xs font-sans text-center gap-2">
              <Icons.Inbox className="w-8 h-8 text-slate-700" />
              <span>{lang === 'ru' ? 'Резервные копии не найдены' : 'No backups found.'}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
