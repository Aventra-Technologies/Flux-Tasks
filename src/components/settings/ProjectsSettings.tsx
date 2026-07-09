import React, { useState } from 'react';
import { useStore } from '../../store';
import * as Icons from 'lucide-react';

export const ProjectsSettings: React.FC = () => {
  const {
    dbPath,
    tasks,
    projects,
    notes,
    settings
  } = useStore();

  const lang = settings.language;
  const [copyFeedback, setCopyFeedback] = useState(false);

  const handleCopyPath = () => {
    navigator.clipboard.writeText(dbPath || 'tasks.db');
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* SQLite Local DB stats */}
      <div className="p-5 rounded-2xl border border-white/5 bg-slate-950/20 space-y-5">
        <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-2 uppercase tracking-wider">
          <Icons.Database className="w-4 h-4 text-indigo-400" />
          <span>{lang === 'ru' ? 'Локальная БД SQLite' : lang === 'uk' ? 'Локальна БД SQLite' : 'SQLite Local DB'}</span>
        </h4>
        <p className="text-[10px] text-slate-500">
          {lang === 'ru' ? 'Информация о локальной базе данных SQLite, используемой для хранения ваших данных.' : 
           lang === 'uk' ? 'Інформація про локальну базу даних SQLite, що використовується для збереження ваших даних.' : 
           'Information about the local SQLite database used to store your application data.'}
        </p>

        <div className="space-y-3.5 font-sans pt-1">
          <div className="flex items-center justify-between text-xs p-3 rounded-xl border border-white/5 bg-white/[0.02]">
            <span className="text-slate-400">{lang === 'ru' ? 'Статус:' : 'Status:'}</span>
            <span className="font-mono font-bold accent-text flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full accent-bg animate-pulse inline-block" />
              Live / Connected
            </span>
          </div>
          
          <div className="flex items-center justify-between text-xs p-3 rounded-xl border border-white/5 bg-white/[0.02]">
            <span className="text-slate-400">Engine:</span>
            <span className="font-mono text-slate-300 font-semibold">SQLite 3 (Sync)</span>
          </div>

          <div className="p-3 rounded-xl border border-white/5 bg-white/[0.02] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">{lang === 'ru' ? 'Путь к файлу базы данных:' : 'Database file path:'}</span>
              <button 
                onClick={handleCopyPath}
                className="text-[10px] font-bold text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
              >
                {copyFeedback ? (
                  <>
                    <Icons.Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">{lang === 'ru' ? 'Скопировано!' : 'Copied!'}</span>
                  </>
                ) : (
                  <>
                    <Icons.Copy className="w-3 h-3" />
                    <span>{lang === 'ru' ? 'Копировать' : 'Copy'}</span>
                  </>
                )}
              </button>
            </div>
            <div 
              onClick={handleCopyPath}
              className="font-mono text-[10px] text-slate-300 break-all select-all font-semibold p-2.5 rounded-lg bg-black/40 border border-white/5 max-h-24 overflow-y-auto cursor-pointer hover:border-white/10 transition-all"
            >
              {dbPath || 'tasks.db'}
            </div>
          </div>

          {/* Counts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl border border-white/5 bg-slate-900/20 text-center">
              <span className="block text-[10px] text-slate-500 uppercase font-semibold">{lang === 'ru' ? 'Всего задач' : 'Total Tasks'}</span>
              <span className="font-mono text-xl font-bold text-white mt-1 block">{tasks.length}</span>
            </div>
            <div className="p-3.5 rounded-xl border border-white/5 bg-slate-900/20 text-center">
              <span className="block text-[10px] text-slate-500 uppercase font-semibold">{lang === 'ru' ? 'Проекты' : 'Projects'}</span>
              <span className="font-mono text-xl font-bold text-white mt-1 block">{projects.length}</span>
            </div>
            <div className="p-3.5 rounded-xl border border-white/5 bg-slate-900/20 text-center">
              <span className="block text-[10px] text-slate-500 uppercase font-semibold">{lang === 'ru' ? 'Заметки' : 'Notes'}</span>
              <span className="font-mono text-xl font-bold text-white mt-1 block">{notes.length}</span>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-white/[0.03] text-center">
          <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">
            {lang === 'ru' 
              ? 'Локальное изолированное хранилище данных' 
              : lang === 'uk' 
                ? 'Локальне ізольоване сховище даних' 
                : 'Local Sandboxed Storage Engine'}
          </span>
        </div>
      </div>
    </div>
  );
};
