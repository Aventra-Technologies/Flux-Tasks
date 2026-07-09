import React, { useState } from 'react';
import { useStore } from '../../store';
import { getTranslation } from '../../localization';
import * as Icons from 'lucide-react';

export const GeneralSettings: React.FC = () => {
  const {
    settings,
    updateSettings,
    triggerBackup,
    cleanAutoBackups,
    resetDatabase,
    loadAllFromDB,
    tasks,
    projects,
    releases,
    notes,
    prompts,
    showToast
  } = useStore();

  const lang = settings.language;
  const [restoreFeedback, setRestoreFeedback] = useState<string | null>(null);

  const handleImport = async () => {
    if (window.api) {
      try {
        const result = await window.api.importData();
        if (result && result.data) {
          const { tasks: impTasks, projects: impProj, releases: impRel, notes: impNotes, prompts: impPrompts } = result.data;
          
          if (impProj && impProj.length > 0) {
            for (const p of impProj) await window.api.saveProject(p);
          }
          if (impTasks && impTasks.length > 0) {
            for (const t of impTasks) await window.api.saveTask(t);
          }
          if (impNotes && impNotes.length > 0) {
            for (const n of impNotes) await window.api.saveNote(n);
          }
          if (impRel && impRel.length > 0) {
            for (const r of impRel) await window.api.saveRelease(r);
          }
          if (impPrompts && impPrompts.length > 0) {
            for (const p of impPrompts) await window.api.savePrompt(p);
          }

          await loadAllFromDB();
          setRestoreFeedback(lang === 'ru' ? 'Импорт завершен!' : lang === 'uk' ? 'Імпорт завершено!' : 'Import complete!');
          setTimeout(() => setRestoreFeedback(null), 3000);
        }
      } catch (err: any) {
        setRestoreFeedback(`Error: ${err.message}`);
        setTimeout(() => setRestoreFeedback(null), 5000);
      }
    }
  };

  const handleExportData = async (format: 'json' | 'md' | 'html' | 'csv') => {
    if (window.api) {
      const result = await window.api.exportData(format, { tasks, projects, releases, notes, prompts });
      if (result && result.success) {
        setRestoreFeedback(lang === 'ru' ? 'Экспорт выполнен!' : lang === 'uk' ? 'Експорт виконано!' : 'Export successful!');
        setTimeout(() => setRestoreFeedback(null), 3000);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Language Switch */}
      <div className="p-5 rounded-2xl border border-white/5 bg-slate-950/20 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="text-xs font-semibold tracking-wider text-slate-200 uppercase flex items-center gap-2">
              <Icons.Globe className="w-4 h-4 accent-text" />
              <span>{lang === 'ru' ? 'Язык интерфейса' : lang === 'uk' ? 'Мова інтерфейсу' : 'App Language'}</span>
            </h4>
            <p className="text-[10px] text-slate-500 mt-1">
              {lang === 'ru' ? 'Выберите язык для интерфейса приложения.' : lang === 'uk' ? 'Виберіть мову для інтерфейсу програми.' : 'Select the language for the application interface.'}
            </p>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-900/40 rounded-xl p-1 border border-white/5 select-none shrink-0">
            {[
              { tag: 'ru', text: 'RU' },
              { tag: 'uk', text: 'UK' },
              { tag: 'en', text: 'EN' }
            ].map(({ tag, text }) => {
              const isSel = settings.language === tag;
              return (
                <button
                  key={tag}
                  onClick={() => updateSettings('language', tag)}
                  className={`py-1 px-3 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    isSel 
                      ? 'bg-white text-slate-950 shadow' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {text}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Backup Settings */}
      <div className="p-5 rounded-2xl border border-white/5 bg-slate-950/20 space-y-4">
        <h4 className="text-xs font-semibold tracking-wider text-slate-200 uppercase flex items-center gap-2">
          <Icons.ShieldAlert className="w-4 h-4 accent-text" />
          <span>{lang === 'ru' ? 'Резервное копирование' : lang === 'uk' ? 'Резервне копіювання' : 'Backup Settings'}</span>
        </h4>
        <p className="text-[10px] text-slate-500">
          {lang === 'ru' ? 'Настройте автоматическое создание резервных копий вашей локальной базы данных.' : lang === 'uk' ? 'Налаштуйте автоматичне створення резервних копій вашої локальної бази даних.' : 'Configure automatic creation of database backup files.'}
        </p>

        <div className="space-y-3.5 pt-1.5">
          {/* Enabled Toggle */}
          <div className="flex items-center justify-between text-xs p-3 rounded-xl border border-white/5 bg-white/[0.02]">
            <span>
              <span className="block text-xs text-slate-200">{lang === 'ru' ? 'Автоматическое копирование' : lang === 'uk' ? 'Автоматичне копіювання' : 'Automatic Backup'}</span>
              <span className="block text-[10px] text-slate-500 mt-1">{lang === 'ru' ? 'Создавать резервные копии в фоновом режиме.' : lang === 'uk' ? 'Створювати резервні копії у фоновому режимі.' : 'Periodically create backups in the background.'}</span>
            </span>
            <button
              onClick={() => updateSettings('autoBackupEnabled', settings.autoBackupEnabled === 'false' ? 'true' : 'false')}
              className={`py-1 px-3.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${
                settings.autoBackupEnabled !== 'false'
                  ? 'accent-bg-10 accent-text accent-border-25'
                  : 'bg-slate-900/50 text-slate-500 border-white/5'
              }`}
            >
              {settings.autoBackupEnabled !== 'false' 
                ? (lang === 'ru' ? 'Включено' : 'Enabled') 
                : (lang === 'ru' ? 'Выключено' : 'Disabled')}
            </button>
          </div>

          {/* Backup Interval Select */}
          <div className="flex items-center justify-between text-xs p-3 rounded-xl border border-white/5 bg-white/[0.02]">
            <span className="text-slate-300 font-semibold">{lang === 'ru' ? 'Интервал автобэкапа:' : 'Auto backup interval:'}</span>
            <select
              value={settings.autoBackupIntervalHours || '12'}
              onChange={(e) => updateSettings('autoBackupIntervalHours', e.target.value)}
              className="py-1 px-2.5 bg-slate-950 border border-white/10 rounded-xl font-mono text-[10px] text-white focus:outline-none cursor-pointer"
            >
              <option value="6">6 {lang === 'ru' ? 'часов' : 'hours'}</option>
              <option value="12">12 {lang === 'ru' ? 'часов' : 'hours'}</option>
              <option value="24">24 {lang === 'ru' ? 'часа' : 'hours'}</option>
              <option value="48">48 {lang === 'ru' ? 'часов' : 'hours'}</option>
            </select>
          </div>

          {/* Retention period */}
          <div className="flex items-center justify-between text-xs p-3 rounded-xl border border-white/5 bg-white/[0.02]">
            <span className="text-slate-300 font-semibold">{lang === 'ru' ? 'Хранить автобэкапы:' : 'Backup retention:'}</span>
            <select
              value={settings.backupRetentionDays || '3'}
              onChange={(e) => updateSettings('backupRetentionDays', e.target.value)}
              className="py-1 px-2.5 bg-slate-950 border border-white/10 rounded-xl font-mono text-[10px] text-white focus:outline-none cursor-pointer"
            >
              <option value="1">1 {lang === 'ru' ? 'день' : 'day'}</option>
              <option value="3">3 {lang === 'ru' ? 'дня' : 'days'}</option>
              <option value="7">7 {lang === 'ru' ? 'дней' : 'days'}</option>
              <option value="14">14 {lang === 'ru' ? 'дней' : 'days'}</option>
              <option value="30">30 {lang === 'ru' ? 'дней' : 'days'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Database Operations */}
      <div className="p-5 rounded-2xl border border-white/5 bg-slate-950/20 space-y-4">
        <h4 className="text-xs font-semibold tracking-wider text-slate-200 uppercase flex items-center gap-2">
          <Icons.Database className="w-4 h-4 accent-text" />
          <span>{lang === 'ru' ? 'Управление данными' : lang === 'uk' ? 'Керування даними' : 'Data Operations'}</span>
        </h4>
        <p className="text-[10px] text-slate-500">
          {lang === 'ru' ? 'Экспорт, импорт и сброс данных вашего локального профиля.' : lang === 'uk' ? 'Експорт, імпорт та скидання даних вашого локального профілю.' : 'Export, import, and reset local profile data.'}
        </p>

        {restoreFeedback && (
          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-400">
            {restoreFeedback}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Create Manual Backup */}
          <button
            onClick={() => triggerBackup('manual')}
            className="py-2.5 px-4 rounded-xl btn-accent text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <Icons.Plus className="w-4 h-4" />
            <span>{lang === 'ru' ? 'Создать копию сейчас' : lang === 'uk' ? 'Створити копію зараз' : 'Create Copy Now'}</span>
          </button>

          {/* Import JSON/MD */}
          <button
            onClick={handleImport}
            className="py-2.5 px-4 rounded-xl border border-white/10 bg-white/5 text-slate-300 text-[11px] hover:bg-white/10 hover:text-white flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <Icons.Upload className="w-4 h-4" />
            <span>{lang === 'ru' ? 'Импортировать JSON / MD' : lang === 'uk' ? 'Імпортувати JSON / MD' : 'Import JSON / MD'}</span>
          </button>
        </div>

        {/* Exports */}
        <div className="pt-2 border-t border-white/[0.03] space-y-2">
          <label className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">{lang === 'ru' ? 'Экспортировать данные в формат:' : 'Export data to format:'}</label>
          <div className="grid grid-cols-4 gap-2">
            {['json', 'md', 'html', 'csv'].map((format) => (
              <button
                key={format}
                onClick={() => handleExportData(format as any)}
                className="py-2 px-3 text-center rounded-xl border border-white/5 hover:border-teal-500/20 bg-slate-900/50 hover:bg-teal-500/5 text-xs text-teal-400 font-bold cursor-pointer transition-all uppercase"
              >
                {format}
              </button>
            ))}
          </div>
        </div>

        {/* Clear/Reset Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-white/[0.03]">
          {/* Retention clean button */}
          <button
            onClick={async () => {
              const res = await cleanAutoBackups();
              if (res.success) {
                showToast(
                  lang === 'ru' 
                    ? `Очищено старых копий: ${res.deletedCount}` 
                    : `Deleted old auto backups: ${res.deletedCount}`, 
                  'success'
                );
              }
            }}
            className="py-2.5 px-4 rounded-xl border border-rose-500/10 hover:border-rose-500/20 hover:bg-rose-500/5 text-rose-400 hover:text-rose-300 text-[10px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <Icons.Trash2 className="w-4 h-4" />
            <span>{lang === 'ru' ? 'Очистить старые автобэкапы' : 'Clean old auto backups'}</span>
          </button>

          {/* Clear DB Button */}
          <button
            onClick={resetDatabase}
            className="py-2.5 px-4 rounded-xl border border-transparent hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 text-[10px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <Icons.AlertTriangle className="w-4 h-4" />
            <span>{lang === 'ru' ? 'Очистить базу данных' : lang === 'uk' ? 'Очистити базу даних' : 'Clear Database'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
