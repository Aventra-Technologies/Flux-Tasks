import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { getTranslation } from '../../localization';
import * as Icons from 'lucide-react';
import { GlassPreset, BackgroundStyle } from '../../types';
import { getIconComponent } from '../../iconRegistry';

export const AppearanceSettings: React.FC = () => {
  const { settings, updateSettings } = useStore();
  const lang = settings.language;
  const [accentInput, setAccentInput] = useState(settings.accentColor);

  useEffect(() => {
    setAccentInput(settings.accentColor);
  }, [settings.accentColor]);

  // Background presets config
  const bgConfigs: { style: BackgroundStyle; labelKey: any; icon: string }[] = [
    { style: 'orbit', labelKey: 'bgOrbit', icon: 'Orbit' },
    { style: 'aurora', labelKey: 'bgAurora', icon: 'Sparkles' },
    { style: 'deep-noir', labelKey: 'bgDeepNoir', icon: 'Moon' },
    { style: 'crystal-lake', labelKey: 'bgCrystalLake', icon: 'Compass' }
  ];

  // Glass Materials presets config
  const glassConfigs: { preset: GlassPreset; labelKey: any; desc: string }[] = [
    { preset: 'crystal', labelKey: 'presetCrystal', desc: '90% Light transmission, thin bright borders' },
    { preset: 'frosted', labelKey: 'presetFrosted', desc: 'Balanced frosted look with blur saturate scale' },
    { preset: 'acrylic', labelKey: 'presetAcrylic', desc: 'Heavy night-tint backdrop, subtle chromatic dust' },
    { preset: 'ultra-blur', labelKey: 'presetUltraBlur', desc: 'Overwhelming frosted fog, soft glow vectors' },
    { preset: 'minimal', labelKey: 'presetMinimal', desc: 'Solid fast performance, classic clear outline' }
  ];

  // Color preset swatches
  const swatchColors = [
    { name: 'emerald', start: '#10b981', end: '#06b6d4', text: 'Flux Emerald' },
    { name: 'blue', start: '#3b82f6', end: '#8b5cf6', text: 'Arctic Indigo' },
    { name: 'purple', start: '#a855f7', end: '#ec4899', text: 'Vapor Fuchsia' },
    { name: 'pink', start: '#ec4899', end: '#f43f5e', text: 'Cherry Blossom' },
    { name: 'orange', start: '#f97316', end: '#ef4444', text: 'Neon Aurora' },
    { name: 'teal', start: '#14b8a6', end: '#10b981', text: 'Minty Glass' },
    { name: 'yellow', start: '#f59e0b', end: '#eab308', text: 'Amber Sun' }
  ];

  const handleApplyCustomAccent = (hex: string) => {
    setAccentInput(hex);
    if (!/^#[0-9a-f]{6}$/i.test(hex)) return;

    const normalizedHex = hex.toLowerCase();
    updateSettings('accentColor', normalizedHex);
    updateSettings('gradientStart', normalizedHex);
    updateSettings('gradientEnd', normalizedHex);
  };

  const handleSwatchClick = (preset: typeof swatchColors[0]) => {
    updateSettings('accentColor', preset.start);
    setAccentInput(preset.start);
    updateSettings('gradientStart', preset.start);
    updateSettings('gradientEnd', preset.end);
    updateSettings('glassTint', preset.name as any);
  };

  return (
    <div className="space-y-6">
      {/* 1. DESKTOP BACKGROUND STYLE */}
      <div className="p-5 rounded-2xl border border-white/5 bg-slate-950/20 space-y-4">
        <div>
          <h4 className="text-xs font-semibold tracking-wider text-slate-200 uppercase flex items-center gap-2">
            <Icons.Wallpaper className="w-4 h-4 accent-text" />
            <span>{getTranslation(lang, 'bgStyleLabel')}</span>
          </h4>
          <p className="text-[10px] text-slate-500 mt-1">{getTranslation(lang, 'themeSectionDesc')}</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 select-none">
          {bgConfigs.map(({ style, labelKey, icon }) => {
            const isSel = settings.bgStyle === style;
            const IconComponent = getIconComponent(icon, Icons.HelpCircle);
            return (
              <div
                key={style}
                onClick={() => updateSettings('bgStyle', style)}
                className={`cursor-pointer p-3.5 rounded-xl border text-center flex flex-col items-center gap-2 transition-all bg-slate-900/30 ${
                  isSel 
                    ? 'accent-border-50 bg-slate-900/60 shadow-md scale-[1.01]'
                    : 'border-white/5 hover:border-white/10'
                }`}
              >
                <div className={`p-1 rounded ${isSel ? 'accent-text accent-bg-10' : 'text-slate-500'}`}>
                  <IconComponent className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-white">{getTranslation(lang, labelKey)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. ACCENT Presets & Custom Color */}
      <div className="p-5 rounded-2xl border border-white/5 bg-slate-950/20 space-y-4">
        <h4 className="text-xs font-semibold tracking-wider text-slate-200 uppercase flex items-center gap-2">
          <Icons.SlidersHorizontal className="w-4 h-4 accent-text" />
          <span>{getTranslation(lang, 'accentColorLabel')}</span>
        </h4>

        {/* Color presets swatches */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {swatchColors.map((clrPreset) => {
            const isSel = settings.accentColor.toLowerCase() === clrPreset.start.toLowerCase() && settings.gradientEnd.toLowerCase() === clrPreset.end.toLowerCase();
            return (
              <div
                key={clrPreset.name}
                onClick={() => handleSwatchClick(clrPreset)}
                className={`p-3 rounded-xl border cursor-pointer select-none transition-all flex items-center gap-2.5 bg-slate-900/30 font-medium ${
                  isSel 
                    ? 'accent-border-50 bg-slate-900/50 shadow'
                    : 'border-white/5 hover:border-white/10 hover:bg-slate-900/40'
                }`}
              >
                <div 
                  className="w-4 h-4 rounded-full border border-white/20 shrink-0" 
                  style={{ backgroundImage: `linear-gradient(to right, ${clrPreset.start}, ${clrPreset.end})` }} 
                />
                <span className="text-[11px] text-slate-300 leading-none">{clrPreset.text}</span>
              </div>
            );
          })}
        </div>

        {/* Custom hex selector */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 pt-2 border-t border-white/[0.03]">
          <div className="flex items-center gap-1.5 shrink-0">
            <label className="text-[10px] text-slate-400 font-mono">{getTranslation(lang, 'customColorHex')}</label>
            <input
              type="color"
              value={/^#[0-9a-f]{6}$/i.test(accentInput) ? accentInput : settings.accentColor}
              onChange={(e) => handleApplyCustomAccent(e.target.value)}
              className="w-7 h-7 rounded border-none bg-transparent cursor-pointer shrink-0"
              title="Accent color picker"
            />
            <input
              type="text"
              value={accentInput}
              onChange={(e) => handleApplyCustomAccent(e.target.value)}
              onBlur={() => {
                if (!/^#[0-9a-f]{6}$/i.test(accentInput)) {
                  setAccentInput(settings.accentColor);
                }
              }}
              maxLength={7}
              className="py-1 px-2 border border-white/10 bg-black/45 rounded font-mono text-[10px] text-white w-20 uppercase"
            />
          </div>
          <div className="text-[10px] text-slate-500 font-sans">
            {getTranslation(lang, 'activeStyleStartsFrom')} <span className="font-mono font-bold text-white uppercase">{settings.gradientStart}</span> {getTranslation(lang, 'convergesGradientInto')} <span className="font-mono font-bold text-white uppercase">{settings.gradientEnd}</span>.
          </div>
        </div>
      </div>

      {/* 3. GLASS MATERIAL PRESETS */}
      <div className="p-5 rounded-2xl border border-white/5 bg-slate-950/20 space-y-4">
        <h4 className="text-xs font-semibold tracking-wider text-slate-200 uppercase flex items-center gap-2">
          <Icons.GlassWater className="w-4 h-4 accent-text" />
          <span>{getTranslation(lang, 'glassPresetLabel')}</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 select-none">
          {glassConfigs.map(({ preset, labelKey, desc }) => {
            const isSel = settings.glassPreset === preset;
            return (
              <div
                key={preset}
                onClick={() => updateSettings('glassPreset', preset)}
                className={`cursor-pointer p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all bg-slate-900/30 ${
                  isSel 
                    ? 'accent-border-50 bg-slate-900/70 scale-[1.02] shadow-lg'
                    : 'border-white/5 hover:border-white/10'
                }`}
              >
                <div className="text-xs font-semibold text-white truncate">{getTranslation(lang, labelKey)}</div>
                <div className="text-[9px] text-slate-500 leading-tight mt-1.5 line-clamp-2">{desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. FINE-TUNED APPEARANCE METRICS */}
      <div className="p-5 rounded-2xl border border-white/5 bg-slate-950/20 space-y-5">
        <h4 className="text-xs font-semibold tracking-wider text-slate-200 uppercase flex items-center gap-2">
          <Icons.Sliders className="w-4 h-4 accent-text" />
          <span>{lang === 'ru' ? 'Тонкая настройка интерфейса' : lang === 'uk' ? 'Тонке налаштування інтерфейсу' : 'Fine-Tuned Metrics'}</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Spacing Scale & Animations */}
          <div className="space-y-4">
            {/* Spacing Mode */}
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-slate-300 flex justify-between">
                <span>{lang === 'ru' ? 'Масштаб интервалов (Spacing)' : lang === 'uk' ? 'Масштаб інтервалів (Spacing)' : 'Layout Spacing Scale'}</span>
                <span className="text-[10px] font-mono accent-text font-bold uppercase">{settings.spacingScale === 'compact' ? (lang === 'ru' ? 'Компактный' : lang === 'uk' ? 'Компактний' : 'Compact') : (lang === 'ru' ? 'Комфортный' : lang === 'uk' ? 'Комфортний' : 'Comfortable')}</span>
              </label>
              <div className="flex bg-slate-900/40 rounded-xl p-1 border border-white/5 select-none w-fit">
                <button
                  onClick={() => updateSettings('spacingScale', 'comfortable')}
                  className={`py-1 px-3.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${settings.spacingScale !== 'compact' ? 'bg-white text-slate-950 shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  {lang === 'ru' ? 'Комфортный' : lang === 'uk' ? 'Комфортний' : 'Comfortable'}
                </button>
                <button
                  onClick={() => updateSettings('spacingScale', 'compact')}
                  className={`py-1 px-3.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${settings.spacingScale === 'compact' ? 'bg-white text-slate-950 shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  {lang === 'ru' ? 'Компактный' : lang === 'uk' ? 'Компактний' : 'Compact'}
                </button>
              </div>
            </div>

            {/* Interface Animations */}
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-slate-300 flex justify-between">
                <span>{lang === 'ru' ? 'Анимации интерфейса' : lang === 'uk' ? 'Анімації інтерфейсу' : 'UI Animations'}</span>
                <span className="text-[10px] font-mono accent-text font-bold uppercase">{settings.animationsEnabled === 'false' ? (lang === 'ru' ? 'Выкл' : 'Off') : (lang === 'ru' ? 'Вкл' : 'On')}</span>
              </label>
              <div className="flex bg-slate-900/40 rounded-xl p-1 border border-white/5 select-none w-fit">
                <button
                  onClick={() => updateSettings('animationsEnabled', 'true')}
                  className={`py-1 px-3.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${settings.animationsEnabled !== 'false' ? 'bg-white text-slate-950 shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  {lang === 'ru' ? 'Включены' : lang === 'uk' ? 'Увімкнено' : 'Enabled'}
                </button>
                <button
                  onClick={() => updateSettings('animationsEnabled', 'false')}
                  className={`py-1 px-3.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${settings.animationsEnabled === 'false' ? 'bg-white text-slate-950 shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  {lang === 'ru' ? 'Выключены' : lang === 'uk' ? 'Вимкнено' : 'Disabled'}
                </button>
              </div>
            </div>
          </div>

          {/* Font Scale & Radius */}
          <div className="space-y-4">
            {/* Font Scale */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-medium text-slate-300">
                <span>{lang === 'ru' ? 'Масштаб шрифта' : lang === 'uk' ? 'Масштаб шрифту' : 'Font Size Scale'}</span>
                <span className="font-mono accent-text font-bold">{settings.fontScale || '1.0'}x</span>
              </div>
              <input
                type="range"
                min="0.80"
                max="1.30"
                step="0.05"
                value={settings.fontScale || '1.0'}
                onChange={(e) => updateSettings('fontScale', e.target.value)}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                style={{ accentColor: 'var(--accent)' }}
              />
            </div>

            {/* Card Radius */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-medium text-slate-300">
                <span>{lang === 'ru' ? 'Скругление карточек (Radius)' : lang === 'uk' ? 'Скруглення карток (Radius)' : 'Card Border Radius'}</span>
                <span className="font-mono accent-text font-bold">{settings.cardRadius || '18'}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="32"
                step="1"
                value={settings.cardRadius || '18'}
                onChange={(e) => updateSettings('cardRadius', e.target.value)}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                style={{ accentColor: 'var(--accent)' }}
              />
            </div>
          </div>
        </div>

        {/* Sliders row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-3 border-t border-white/[0.03]">
          {/* Glass Opacity */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-medium text-slate-300">
              <span>{lang === 'ru' ? 'Интенсивность стекла' : 'Glass Opacity'}</span>
              <span className="font-mono accent-text font-bold">{Math.round((parseFloat(settings.glassOpacity || '0.015')) * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.00"
              max="0.30"
              step="0.005"
              value={settings.glassOpacity || '0.015'}
              onChange={(e) => updateSettings('glassOpacity', e.target.value)}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
              style={{ accentColor: 'var(--accent)' }}
            />
          </div>

          {/* Glass Blur */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-medium text-slate-300">
              <span>{lang === 'ru' ? 'Радиус размытия (Blur)' : 'Glass Blur Radius'}</span>
              <span className="font-mono accent-text font-bold">{settings.glassBlur || '36'}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="64"
              step="2"
              value={settings.glassBlur || '36'}
              onChange={(e) => updateSettings('glassBlur', e.target.value)}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
              style={{ accentColor: 'var(--accent)' }}
            />
          </div>

          {/* Sidebar Opacity */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-medium text-slate-300">
              <span>{lang === 'ru' ? 'Прозрачность боковой панели' : 'Sidebar Opacity'}</span>
              <span className="font-mono accent-text font-bold">{Math.round((parseFloat(settings.sidebarOpacity || '0.03')) * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.00"
              max="0.20"
              step="0.005"
              value={settings.sidebarOpacity || '0.03'}
              onChange={(e) => updateSettings('sidebarOpacity', e.target.value)}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
              style={{ accentColor: 'var(--accent)' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
