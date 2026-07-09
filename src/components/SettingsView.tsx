import React, { useState, Suspense, startTransition } from 'react';
import { useStore } from '../store';
import { getTranslation } from '../localization';
import * as Icons from 'lucide-react';

// Lazy load tab components
const GeneralSettings = React.lazy(() => import('./settings/GeneralSettings').then(m => ({ default: m.GeneralSettings })));
const AppearanceSettings = React.lazy(() => import('./settings/AppearanceSettings').then(m => ({ default: m.AppearanceSettings })));
const WorkspaceSettings = React.lazy(() => import('./settings/WorkspaceSettings').then(m => ({ default: m.WorkspaceSettings })));
const ProjectsSettings = React.lazy(() => import('./settings/ProjectsSettings').then(m => ({ default: m.ProjectsSettings })));
const NotificationsSettings = React.lazy(() => import('./settings/NotificationsSettings').then(m => ({ default: m.NotificationsSettings })));
const IntegrationsSettings = React.lazy(() => import('./settings/IntegrationsSettings').then(m => ({ default: m.IntegrationsSettings })));
const AboutSettings = React.lazy(() => import('./settings/AboutSettings').then(m => ({ default: m.AboutSettings })));

type SettingsTab = 'general' | 'appearance' | 'workspace' | 'projects' | 'notifications' | 'integrations' | 'about';

const tabLabels: Record<string, Record<SettingsTab, string>> = {
  ru: {
    general: 'Общее',
    appearance: 'Внешний вид',
    workspace: 'Рабочее пространство',
    projects: 'Проекты',
    notifications: 'Уведомления',
    integrations: 'Интеграции',
    about: 'О программе'
  },
  uk: {
    general: 'Загальні',
    appearance: 'Зовнішній вигляд',
    workspace: 'Робочий простір',
    projects: 'Проекти',
    notifications: 'Сповіщення',
    integrations: 'Інтеграції',
    about: 'Про програму'
  },
  en: {
    general: 'General',
    appearance: 'Appearance',
    workspace: 'Workspace',
    projects: 'Projects',
    notifications: 'Notifications',
    integrations: 'Integrations',
    about: 'About App'
  }
};

const tabDescriptions: Record<string, Record<SettingsTab, string>> = {
  ru: {
    general: 'Основные параметры, язык интерфейса и резервные копии.',
    appearance: 'Настройка тем, фонов, эффектов стекла и анимаций.',
    workspace: 'Просмотр и управление локальными резервными копиями.',
    projects: 'Статистика SQLite базы данных и метрики проекта.',
    notifications: 'Настройка фонового режима, уведомлений и автозапуска.',
    integrations: 'Подключение аккаунта GitHub и параметры интеграции.',
    about: 'Информация о приложении, системные характеристики и обновления.'
  },
  uk: {
    general: 'Основні параметри, мова інтерфейсу та резервні копії.',
    appearance: 'Налаштування тем, фонів, ефектів скла та анімацій.',
    workspace: 'Перегляд та керування локальними резервними копіями.',
    projects: 'Статистика SQLite бази даних та метрики проекту.',
    notifications: 'Налаштування фонового режима, сповіщень та автозапуску.',
    integrations: 'Підключення акаунта GitHub та параметри інтеграції.',
    about: 'Інформація про програму, системні характеристики та оновлення.'
  },
  en: {
    general: 'Core configurations, system language, and backup policies.',
    appearance: 'Customize themes, desktop backgrounds, materials, and motion.',
    workspace: 'Inspect and manage local profile database backups.',
    projects: 'SQLite database performance statistics and metrics.',
    notifications: 'Configure background workers, desktop warnings, and startup.',
    integrations: 'Link GitHub account and setup version control features.',
    about: 'Application specifications, platform specs, and updates check.'
  }
};

const tabIcons: Record<SettingsTab, React.ComponentType<any>> = {
  general: Icons.Sliders,
  appearance: Icons.Palette,
  workspace: Icons.LayoutGrid,
  projects: Icons.Database,
  notifications: Icons.Bell,
  integrations: Icons.Github,
  about: Icons.Info
};

export const SettingsView: React.FC = () => {
  const { settings, setCurrentView } = useStore();
  const lang = settings.language || 'ru';
  const activeLang = ['ru', 'uk', 'en'].includes(lang) ? lang : 'en';

  const [activeTab, setActiveTab] = useState<SettingsTab>(() => {
    const saved = localStorage.getItem('flux_tasks_last_settings_tab');
    if (saved && ['general', 'appearance', 'workspace', 'projects', 'notifications', 'integrations', 'about'].includes(saved)) {
      return saved as SettingsTab;
    }
    return 'general';
  });

  const handleTabChange = (tab: SettingsTab) => {
    startTransition(() => {
      setActiveTab(tab);
      localStorage.setItem('flux_tasks_last_settings_tab', tab);
    });
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralSettings />;
      case 'appearance':
        return <AppearanceSettings />;
      case 'workspace':
        return <WorkspaceSettings />;
      case 'projects':
        return <ProjectsSettings />;
      case 'notifications':
        return <NotificationsSettings />;
      case 'integrations':
        return <IntegrationsSettings />;
      case 'about':
        return <AboutSettings />;
      default:
        return <GeneralSettings />;
    }
  };

  const getIcon = (tab: SettingsTab, isSelected: boolean) => {
    const IconComp = tabIcons[tab];
    return <IconComp className={`w-4 h-4 shrink-0 ${isSelected ? 'accent-text' : 'text-slate-400'}`} />;
  };

  return (
    <div className="flex-1 flex overflow-hidden w-full h-full p-2 bg-transparent select-none">
      
      {/* Custom Styles for Transitions */}
      <style>{`
        @keyframes settingsFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-settings-fade-in {
          animation: settingsFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Main Settings Window Splitter */}
      <div className="flex-1 flex w-full h-full rounded-2xl border border-white/[0.04] bg-[#080c1d] overflow-hidden relative">
        
        {/* ESC Close Button */}
        <div className="absolute top-5 right-5 z-20">
          <button
            onClick={() => setCurrentView('dashboard')}
            className="flex flex-col items-center gap-1 group cursor-pointer"
            title={lang === 'ru' ? 'Закрыть настройки' : 'Close Settings'}
          >
            <div className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center bg-slate-950/50 text-slate-400 group-hover:bg-rose-500/10 group-hover:border-rose-500/30 group-hover:text-rose-400 transition-all select-none shadow">
              <Icons.X className="w-4 h-4" />
            </div>
            <span className="text-[9px] font-mono font-bold tracking-widest text-slate-500 group-hover:text-rose-400 uppercase select-none transition-colors">
              ESC
            </span>
          </button>
        </div>

        {/* LEFT COLUMN: SIDEBAR */}
        <div className="w-60 shrink-0 border-r border-white/5 bg-black/15 p-4 flex flex-col justify-between overflow-y-auto select-none">
          <div className="space-y-6">
            
            {/* Header / Brand */}
            <div className="px-2 pt-2 pb-1 flex items-center gap-2">
              <Icons.Settings className="w-5 h-5 text-indigo-400 animate-spin" style={{ animationDuration: '8s' }} />
              <h2 className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase">
                {lang === 'ru' ? 'Настройки' : lang === 'uk' ? 'Налаштування' : 'Settings'}
              </h2>
            </div>

            {/* List of tabs */}
            <nav className="space-y-1">
              {(Object.keys(tabLabels[activeLang]) as SettingsTab[]).map((tab) => {
                const isSelected = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => handleTabChange(tab)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold select-none cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-white/[0.07] text-white font-bold shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),_0_4px_12px_rgba(0,0,0,0.15)] border border-white/[0.08]'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.03] border border-transparent'
                    }`}
                  >
                    {getIcon(tab, isSelected)}
                    <span>{tabLabels[activeLang][tab]}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer */}
          <div className="px-2 py-1 text-[10px] text-slate-500 font-mono select-none">
            Flux Tasks v1.1.28
          </div>
        </div>

        {/* RIGHT COLUMN: CONTENT */}
        <div className="flex-1 flex flex-col h-full min-w-0 bg-[#080d22]/5 select-none overflow-hidden relative">
          
          {/* Active Tab Header Details */}
          <div className="p-6 pb-4 border-b border-white/[0.03] select-none shrink-0 pr-20">
            <h2 className="text-base font-display font-semibold text-white tracking-tight flex items-center gap-2">
              {getIcon(activeTab, true)}
              <span>{tabLabels[activeLang][activeTab]}</span>
            </h2>
            <p className="text-[10px] text-slate-500 mt-1">
              {tabDescriptions[activeLang][activeTab]}
            </p>
          </div>

          {/* Scrollable Contents Pane */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            <div key={activeTab} className="max-w-3xl animate-settings-fade-in">
              <Suspense fallback={
                <div className="flex items-center justify-center py-20">
                  <Icons.Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                </div>
              }>
                {renderActiveTab()}
              </Suspense>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
