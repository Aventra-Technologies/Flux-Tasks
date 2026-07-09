import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { getTranslation } from '../../localization';
import * as Icons from 'lucide-react';
import logoIcon from '../../../assets/icon.png';
import logo1Icon from '../../../assets/logo1.png';

interface SystemInfo {
  os: string;
  arch: string;
  cpu: string;
  ram: string;
  gpu: string;
  isMicrosoftStore: boolean;
}

const systemInfoLabels: Record<string, Record<string, string>> = {
  ru: {
    os: 'Операционная система',
    arch: 'Архитектура',
    cpu: 'Процессор',
    ram: 'Оперативная память',
    gpu: 'Видеокарта'
  },
  uk: {
    os: 'Операційна система',
    arch: 'Архітектура',
    cpu: 'Процесор',
    ram: 'Оперативна пам\'ять',
    gpu: 'Відеокарта'
  },
  en: {
    os: 'Operating System',
    arch: 'Architecture',
    cpu: 'Processor',
    ram: 'RAM',
    gpu: 'GPU'
  }
};

// Static in-memory cache to prevent redundant heavy powershell IPC queries on every tab click
let cachedSystemInfo: SystemInfo | null = null;
let cachedVersion: string = '';

export const AboutSettings: React.FC = () => {
  const { settings, showToast } = useStore();
  const lang = settings.language;
  const currentLang = ['ru', 'uk', 'en'].includes(lang) ? lang : 'en';

  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(cachedSystemInfo);
  const [version, setVersion] = useState<string>(cachedVersion);
  const [showLicenseModal, setShowLicenseModal] = useState(false);

  // Update states
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'available' | 'no-update' | 'downloading' | 'downloaded' | 'error'>('idle');
  const [discoveredManifest, setDiscoveredManifest] = useState<any>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [downloadedPackagePath, setDownloadedPackagePath] = useState<string | null>(null);

  useEffect(() => {
    if (cachedSystemInfo && cachedVersion) return;
    const fetchInfo = async () => {
      if (window.api) {
        try {
          const info = await window.api.app.getSystemInfo();
          cachedSystemInfo = info as any;
          setSystemInfo(info as any);
          const ver = await window.api.app.getVersion();
          cachedVersion = ver;
          setVersion(ver);
        } catch (err) {}
      }
    };
    fetchInfo();
  }, []);

  const handleCheckForUpdates = async () => {
    setUpdateStatus('checking');
    setUpdateError(null);
    if (window.api) {
      try {
        const res = await window.api.checkForUpdates(settings.updateChannel || 'stable');
        if (res.error) {
          setUpdateStatus('error');
          setUpdateError(res.error);
        } else if (res.updateAvailable) {
          setUpdateStatus('available');
          setDiscoveredManifest(res.manifest);
        } else {
          setUpdateStatus('no-update');
        }
      } catch (err: any) {
        setUpdateStatus('error');
        setUpdateError(err.message || 'Error occurred');
      }
    }
  };

  const handleDownloadUpdate = async () => {
    if (!discoveredManifest || !window.api) return;
    setUpdateStatus('downloading');
    try {
      const res = await window.api.downloadUpdate(discoveredManifest);
      if (res.success && res.packagePath) {
        setUpdateStatus('downloaded');
        setDownloadedPackagePath(res.packagePath);
      } else {
        setUpdateStatus('error');
        setUpdateError(res.error || 'Download failed');
      }
    } catch (err: any) {
      setUpdateStatus('error');
      setUpdateError(err.message || 'Download failed');
    }
  };

  const handleInstallUpdate = async () => {
    if (!downloadedPackagePath || !discoveredManifest || !window.api) return;
    try {
      const isAsarOnly = downloadedPackagePath.endsWith('app.asar');
      await window.api.installUpdate(downloadedPackagePath, isAsarOnly);
    } catch (err: any) {
      setUpdateStatus('error');
      setUpdateError(err.message || 'Installation failed');
    }
  };

  const handleOpenAppFolder = async () => {
    if (window.api?.app?.openFolder) {
      await window.api.app.openFolder();
      showToast(lang === 'ru' ? 'Папка приложения открыта' : 'Application folder opened', 'success');
    }
  };

  const handleOpenDataFolder = async () => {
    if (window.api?.app?.openDataFolder) {
      await window.api.app.openDataFolder();
      showToast(lang === 'ru' ? 'Папка данных открыта' : 'Data folder opened', 'success');
    }
  };

  const linkCards = [
    {
      title: 'Telegram',
      url: 'https://t.me/aventra_technologies',
      desc: lang === 'ru' ? 'Официальный канал Aventra' : lang === 'uk' ? 'Офіційний канал Aventra' : 'Official Aventra Channel',
      icon: (
        <svg className="w-5 h-5 text-[#24A1DE] transition-transform group-hover:scale-105 shrink-0" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM17.18 8.8L15.34 17.53C15.2 18.17 14.82 18.32 14.28 18.02L11.47 15.94L10.12 17.25C9.97 17.4 9.84 17.53 9.55 17.53L9.75 14.67L14.94 9.94C15.17 9.74 14.89 9.62 14.59 9.82L8.17 13.88L5.41 13.01C4.81 12.82 4.8 12.41 5.54 12.12L16.34 7.93C16.84 7.75 17.28 8.05 17.18 8.8Z" />
        </svg>
      )
    },
    {
      title: 'Website',
      url: 'https://aventra.technology/',
      desc: lang === 'ru' ? 'Официальный сайт Aventra' : lang === 'uk' ? 'Офіційний сайт Aventra' : 'Official Aventra Website',
      icon: (
        <svg className="w-5 h-5 text-teal-400 transition-transform group-hover:scale-105 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      )
    },
    {
      title: 'GitHub Repository',
      url: 'https://github.com/Aventra-Technologies/Flux-Tasks',
      desc: lang === 'ru' ? 'Репозиторий проекта Flux Tasks' : lang === 'uk' ? 'Репозиторій проекту Flux Tasks' : 'Flux Tasks Repository',
      icon: (
        <svg className="w-5 h-5 text-white transition-transform group-hover:scale-105 shrink-0" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12C2 16.42 4.87 20.17 8.84 21.5C9.34 21.58 9.5 21.27 9.5 21.02C9.5 20.79 9.49 19.99 9.49 19.17C7 19.71 6.31 18.77 6.12 18.23C6.01 17.95 5.53 17.07 5.11 16.83C4.76 16.64 4.26 16.18 5.1 16.17C5.89 16.16 6.45 16.9 6.64 17.2C7.54 18.72 8.99 18.29 9.57 18.03C9.66 17.38 9.92 16.94 10.21 16.69C7.97 16.44 5.63 15.58 5.63 11.7C5.63 10.6 6.02 9.69 6.66 8.98C6.56 8.72 6.21 7.69 6.76 6.31C6.76 6.31 7.6 6.04 9.5 7.33C10.3 7.11 11.15 7 12 7C12.85 7 13.7 7.11 14.5 7.33C16.4 6.03 17.24 6.31 17.24 6.31C17.79 7.69 17.44 8.72 17.34 8.98C17.98 9.69 18.37 10.59 18.37 11.7C18.37 15.59 16.02 16.44 13.78 16.69C14.15 17.01 14.47 17.63 14.47 18.59C14.47 19.97 14.46 21.08 14.46 21.42C14.46 21.68 14.62 21.99 15.12 21.89C19.1 20.55 22 16.8 22 12C22 6.477 17.52 2 12 2Z" />
        </svg>
      )
    },
    {
      title: 'Aventra GitHub',
      url: 'https://github.com/Aventra-Technologies',
      desc: lang === 'ru' ? 'Организация Aventra Technologies' : lang === 'uk' ? 'Організація Aventra Technologies' : 'Aventra Technologies Org',
      icon: (
        <img 
          src={logo1Icon} 
          className="w-5 h-5 rounded-lg object-contain select-none pointer-events-none transition-transform group-hover:scale-105 shrink-0" 
          alt="Aventra Logo" 
        />
      )
    }
  ];

  const systemDetails = [
    { label: systemInfoLabels[currentLang].os, val: systemInfo?.os || 'Windows' },
    { label: systemInfoLabels[currentLang].arch, val: systemInfo?.arch || 'x64' },
    { label: systemInfoLabels[currentLang].cpu, val: systemInfo?.cpu || '...' },
    { label: systemInfoLabels[currentLang].ram, val: systemInfo?.ram || '...' },
    { label: systemInfoLabels[currentLang].gpu, val: systemInfo?.gpu || '...' }
  ];

  return (
    <div className="space-y-6">
      {/* App Identity Card */}
      <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 flex flex-col md:flex-row items-center md:items-start gap-5">
        <img 
          src={logoIcon} 
          className="w-16 h-16 rounded-2xl border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)] select-none pointer-events-none object-contain" 
          alt="Flux Tasks Logo" 
        />
        <div className="space-y-2 text-center md:text-left flex-grow">
          <div>
            <h3 className="text-lg font-display font-bold text-white leading-none">Flux Tasks</h3>
            <div className="text-xs text-slate-400 mt-2 font-medium">
              {lang === 'ru' ? 'Версия' : lang === 'uk' ? 'Версія' : 'Version'} {version || '1.1.28'}
              {systemInfo?.isMicrosoftStore && (
                <span className="ml-1.5 px-2 py-0.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 font-semibold text-[9px] uppercase tracking-wide">
                  Microsoft Store
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">Build 1432</div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
            Flux Tasks — современный менеджер задач и проектов с поддержкой SQLite, GitHub Releases и локального хранения данных.
          </p>
          <div className="text-[10px] text-slate-500 font-sans">
            © Aventra Technologies. Все права защищены.
          </div>
        </div>
      </div>

      {/* Useful Links (Cards Grid) */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-2">
          <Icons.Link className="w-4 h-4 accent-text" />
          <span>{lang === 'ru' ? 'Полезные ссылки' : lang === 'uk' ? 'Корисні посилання' : 'Useful Links'}</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {linkCards.map((link) => {
            return (
              <a 
                key={link.title}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="p-3.5 rounded-xl border border-white/5 bg-slate-900/20 hover:border-white/10 hover:bg-slate-900/40 transition-all flex items-center gap-3.5 group select-none cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center shrink-0 group-hover:scale-105 transition-all duration-300">
                  {link.icon}
                </div>
                <div className="space-y-0.5 truncate flex-grow">
                  <div className="text-xs font-bold text-white group-hover:accent-text transition-colors flex items-center gap-1">
                    <span>{link.title}</span>
                    <Icons.ArrowUpRight className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100 transition-all duration-200" />
                  </div>
                  <div className="text-[10px] text-slate-500 leading-none truncate">{link.desc}</div>
                </div>
              </a>
            );
          })}
        </div>
      </div>

      {/* System Information */}
      <div className="p-5 rounded-2xl border border-white/5 bg-slate-950/20 space-y-4">
        <h4 className="text-xs font-semibold tracking-wider text-slate-200 uppercase flex items-center gap-2">
          <Icons.Cpu className="w-4 h-4 accent-text" />
          <span>{lang === 'ru' ? 'Информация о системе' : lang === 'uk' ? 'Інформація про систему' : 'System Information'}</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 font-sans pt-1">
          {systemDetails.map((info) => (
            <div key={info.label} className="p-3.5 rounded-xl border border-white/5 bg-white/[0.02] space-y-1.5 flex flex-col justify-between">
              <span className="block text-[9px] text-slate-500 font-semibold uppercase tracking-wider">{info.label}</span>
              <span className="block text-xs font-mono font-bold text-slate-200 truncate select-all leading-tight" title={info.val}>{info.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Maintenance Buttons */}
      <div className="p-5 rounded-2xl border border-white/5 bg-slate-950/20 space-y-4">
        <h4 className="text-xs font-semibold tracking-wider text-slate-200 uppercase flex items-center gap-2">
          <Icons.Wrench className="w-4 h-4 accent-text" />
          <span>{lang === 'ru' ? 'Обслуживание и действия' : lang === 'uk' ? 'Обслуговування та дії' : 'Maintenance'}</span>
        </h4>
        
        {/* Check/Download Updates Panel */}
        {updateStatus !== 'idle' && (
          <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 space-y-3 animate-fade-in text-xs">
            {updateStatus === 'checking' && (
              <span className="text-slate-400 animate-pulse flex items-center gap-2">
                <Icons.Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                <span>{lang === 'ru' ? 'Поиск обновлений...' : 'Checking for updates...'}</span>
              </span>
            )}
            {updateStatus === 'no-update' && (
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <Icons.CheckCircle className="w-4 h-4" />
                <span>{lang === 'ru' ? 'У вас установлена последняя версия.' : 'You are running the latest version.'}</span>
              </span>
            )}
            {updateStatus === 'available' && discoveredManifest && (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <span className="text-indigo-300 font-bold block">{lang === 'ru' ? 'Доступна новая версия!' : 'New Version Available!'}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">v{discoveredManifest.version}</span>
                </div>
                <button
                  onClick={handleDownloadUpdate}
                  className="py-1 px-3 rounded bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-[10px] cursor-pointer transition-colors"
                >
                  {lang === 'ru' ? 'Скачать обновление' : 'Download Update'}
                </button>
              </div>
            )}
            {updateStatus === 'downloading' && (
              <span className="text-slate-400 animate-pulse flex items-center gap-2">
                <Icons.Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                <span>{lang === 'ru' ? 'Загрузка обновления...' : 'Downloading update...'}</span>
              </span>
            )}
            {updateStatus === 'downloaded' && (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <span className="text-indigo-300 font-bold block">{lang === 'ru' ? 'Обновление готово к установке!' : 'Update Ready!'}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">{lang === 'ru' ? 'Перезагрузите приложение для обновления.' : 'Restart app to apply.'}</span>
                </div>
                <button
                  onClick={handleInstallUpdate}
                  className="py-1 px-3 rounded bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-[10px] cursor-pointer transition-colors animate-bounce"
                >
                  {lang === 'ru' ? 'Установить и перезапустить' : 'Install & Restart'}
                </button>
              </div>
            )}
            {updateStatus === 'error' && (
              <span className="text-rose-400 font-semibold flex items-center gap-1.5">
                <Icons.AlertCircle className="w-4 h-4" />
                <span>{lang === 'ru' ? `Ошибка обновления: ${updateError}` : `Update error: ${updateError}`}</span>
              </span>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <button 
            onClick={handleCheckForUpdates}
            className="py-2.5 px-4 rounded-xl btn-accent text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Icons.RefreshCw className="w-4 h-4" />
            <span>{lang === 'ru' ? 'Проверить обновления' : lang === 'uk' ? 'Перевірити оновлення' : 'Check for Updates'}</span>
          </button>
          
          <button 
            onClick={handleOpenAppFolder}
            className="py-2.5 px-4 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
          >
            <Icons.Folder className="w-4 h-4" />
            <span>{lang === 'ru' ? 'Открыть папку приложения' : lang === 'uk' ? 'Відкрити папку програми' : 'Open Application Folder'}</span>
          </button>

          <button 
            onClick={handleOpenDataFolder}
            className="py-2.5 px-4 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
          >
            <Icons.Database className="w-4 h-4" />
            <span>{lang === 'ru' ? 'Открыть папку данных' : lang === 'uk' ? 'Відкрити папку даних' : 'Open Application Data Folder'}</span>
          </button>

          <button 
            onClick={() => setShowLicenseModal(true)}
            className="py-2.5 px-4 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
          >
            <Icons.FileText className="w-4 h-4" />
            <span>{lang === 'ru' ? 'Лицензии Open Source' : lang === 'uk' ? 'Ліцензії Open Source' : 'Open Source Licenses'}</span>
          </button>
        </div>
      </div>

      {/* Licenses Modal */}
      {showLicenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-card max-w-2xl w-full flex flex-col max-h-[85vh] border border-white/10 bg-slate-950/95 overflow-hidden animate-scale-up">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-900/30">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Icons.Award className="w-4 h-4 text-indigo-400" />
                <span>Open Source Licenses</span>
              </h3>
              <button 
                onClick={() => setShowLicenseModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer transition-colors"
              >
                <Icons.X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-6 text-xs text-slate-300 leading-relaxed font-sans scrollbar-thin select-text">
              {/* MIT License */}
              <div className="space-y-2">
                <h4 className="font-bold text-white text-xs border-b border-white/5 pb-1">Flux Tasks (MIT License)</h4>
                <p className="font-mono text-[10px] bg-black/30 p-3 rounded-lg border border-white/5 select-all whitespace-pre-wrap">
{`MIT License

Copyright (c) 2026 Aventra Technologies

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`}
                </p>
              </div>

              {/* Dependencies Summary */}
              <div className="space-y-3">
                <h4 className="font-bold text-white text-xs border-b border-white/5 pb-1">Third-Party Library Acknowledgments</h4>
                <p>
                  This software is compiled using various Open Source third-party libraries and modules under their respective licenses:
                </p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li><strong>Electron:</strong> MIT License</li>
                  <li><strong>React & React DOM:</strong> MIT License</li>
                  <li><strong>Vite:</strong> MIT License</li>
                  <li><strong>Motion (Framer Motion):</strong> MIT License</li>
                  <li><strong>Lucide React:</strong> ISC License</li>
                  <li><strong>Tailwind CSS:</strong> MIT License</li>
                  <li><strong>Esbuild:</strong> MIT License</li>
                  <li><strong>SQLite:</strong> Public Domain</li>
                </ul>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/5 bg-slate-900/30 flex justify-end">
              <button
                onClick={() => setShowLicenseModal(false)}
                className="py-1.5 px-4 rounded-xl btn-secondary text-xs font-semibold cursor-pointer"
              >
                {lang === 'ru' ? 'Закрыть' : lang === 'uk' ? 'Закрити' : 'Close'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
