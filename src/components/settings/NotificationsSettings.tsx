import React from 'react';
import { useStore } from '../../store';
import { getTranslation } from '../../localization';
import * as Icons from 'lucide-react';

export const NotificationsSettings: React.FC = () => {
  const { settings, updateSettings, showToast } = useStore();
  const lang = settings.language;

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl border border-white/5 bg-slate-950/20 space-y-4">
        <h4 className="text-xs font-semibold tracking-wider text-slate-200 uppercase flex items-center gap-2">
          <Icons.BellRing className="w-4 h-4 text-amber-400" />
          <span>{lang === 'ru' ? 'Фоновая работа и публикации' : lang === 'uk' ? 'Фонова робота та публікації' : 'Background & Notifications'}</span>
        </h4>
        <p className="text-[10px] text-slate-500">
          {lang === 'ru' ? 'Управление поведением приложения в фоновом режиме и отправкой системных уведомлений.' : 
           lang === 'uk' ? 'Керування поведінкою програми у фоновому режимі та надсиланням системних сповіщень.' : 
           'Manage background worker behavior and configure system notifications.'}
        </p>

        <div className="space-y-3.5 pt-1.5">
          {[
            ['runInBackground', lang === 'ru' ? 'Работать в фоне' : lang === 'uk' ? 'Працювати в фоні' : 'Run in Background', lang === 'ru' ? 'Напоминания и релизы продолжают обрабатываться после закрытия основного окна.' : lang === 'uk' ? 'Нагадування та релізи продовжують оброблятися після закриття основного вікна.' : 'Reminders and releases continue processing after the main window is closed.'],
            ['autoLaunch', lang === 'ru' ? 'Запускать вместе с Windows' : lang === 'uk' ? 'Запускати разом з Windows' : 'Launch on Windows Startup', lang === 'ru' ? 'Запускать приложение автоматически в свернутом виде при входе в систему.' : lang === 'uk' ? 'Запускати програму автоматично у згорнутому вигляді при вході в систему.' : 'Automatically launch the application in tray mode on system login.'],
            ['backgroundReleasePublishing', lang === 'ru' ? 'Разрешить фоновые публикации релизов' : lang === 'uk' ? 'Дозволити фонові публікації релізів' : 'Allow Background Release Publishing', lang === 'ru' ? 'Публиковать запланированные GitHub-релизы автоматически в фоновом режиме.' : lang === 'uk' ? 'Публікувати заплановані GitHub-релізи автоматично у фоновому режимі.' : 'Automatically publish scheduled GitHub releases in the background.'],
            ['releaseNotifications', lang === 'ru' ? 'Показывать уведомления о релизах' : lang === 'uk' ? 'Показувати сповіщення про релізи' : 'Show Release Notifications', lang === 'ru' ? 'Отправлять уведомления об успехе или ошибках автоматических публикаций.' : lang === 'uk' ? 'Надсилати сповіщення про успіх або помилки автоматичних публікацій.' : 'Notify on success or failure of automatic background publications.']
          ].map(([key, title, description]) => (
            <label key={key} className="flex items-center justify-between gap-4 p-3 rounded-xl border border-white/5 bg-white/[0.02] cursor-pointer hover:border-white/10 hover:bg-white/[0.04] transition-all select-none">
              <span>
                <span className="block text-xs font-semibold text-slate-200">{title}</span>
                <span className="block text-[10px] text-slate-500 mt-1">{description}</span>
              </span>
              <input 
                type="checkbox" 
                className="w-4 h-4"
                checked={settings[key] !== 'false'} 
                onChange={async e => {
                  const enabled = e.target.checked;
                  await updateSettings(key as any, String(enabled));
                  if (key === 'runInBackground') await window.api?.settings.setRunInBackground(enabled);
                  if (key === 'autoLaunch') await window.api?.settings.setAutoLaunch(enabled);
                }} 
              />
            </label>
          ))}
          
          <div className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.02]">
            <span className="text-xs text-slate-300">{lang === 'ru' ? 'Проверять расписание каждые:' : 'Check schedule interval:'}</span>
            <select 
              value={settings.releaseCheckIntervalSeconds || '60'} 
              onChange={e => updateSettings('releaseCheckIntervalSeconds' as any, e.target.value)} 
              className="px-2.5 py-1.5 rounded-xl border border-white/10 bg-slate-950 text-[10px] font-mono focus:outline-none cursor-pointer"
            >
              <option value="60">60 {lang === 'ru' ? 'секунд' : 'seconds'}</option>
              <option value="120">2 {lang === 'ru' ? 'минуты' : 'minutes'}</option>
              <option value="300">5 {lang === 'ru' ? 'минут' : 'minutes'}</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-3 border-t border-white/[0.03]">
          <button 
            onClick={async () => {
              const status = await window.api?.settings.getNotificationStatus();
              showToast(status?.supported ? 'Уведомления Electron поддерживаются системой' : 'Уведомления отключены или не поддерживаются системой', status?.supported ? 'success' : 'error');
            }} 
            className="btn-secondary px-3.5 py-2.5 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            <Icons.CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{lang === 'ru' ? 'Проверить уведомления Windows' : 'Check Windows Support'}</span>
          </button>
          <button 
            onClick={async () => {
              if (window.api?.notifications?.test) {
                await window.api.notifications.test();
                showToast(
                  lang === 'ru' ? 'Тестовое уведомление отправлено' : lang === 'uk' ? 'Тестове сповіщення відправлено' : 'Test notification sent',
                  'success'
                );
              }
            }} 
            className="btn-accent-soft px-3.5 py-2.5 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            <Icons.Send className="w-4 h-4" />
            <span>{lang === 'ru' ? 'Отправить тестовое уведомление' : lang === 'uk' ? 'Надіслати тестове сповіщення' : 'Send Test Notification'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
