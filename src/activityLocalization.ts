import { AppLanguage, Project, TaskPriority, TaskStatus } from './types';
import { getTranslation } from './localization';

const localeByLang: Record<AppLanguage, string> = {
  ru: 'ru-RU',
  uk: 'uk-UA',
  en: 'en-US'
};

const actionLabels: Record<AppLanguage, Record<string, string>> = {
  ru: {
    created: 'Задача создана',
    updated: 'Задача обновлена',
    edited: 'Задача обновлена',
    title_changed: 'Заголовок изменён',
    description_changed: 'Описание изменено',
    status_changed: 'Статус изменён',
    priority_changed: 'Приоритет изменён',
    due_date_changed: 'Срок изменён',
    project_changed: 'Проект изменён',
    assigned_user_changed: 'Исполнитель изменён',
    deleted: 'Задача удалена'
  },
  uk: {
    created: 'Завдання створено',
    updated: 'Завдання оновлено',
    edited: 'Завдання оновлено',
    title_changed: 'Заголовок змінено',
    description_changed: 'Опис змінено',
    status_changed: 'Статус змінено',
    priority_changed: 'Пріоритет змінено',
    due_date_changed: 'Термін змінено',
    project_changed: 'Проект змінено',
    assigned_user_changed: 'Виконавця змінено',
    deleted: 'Завдання видалено'
  },
  en: {
    created: 'Task created',
    updated: 'Task updated',
    edited: 'Task updated',
    title_changed: 'Title changed',
    description_changed: 'Description changed',
    status_changed: 'Status changed',
    priority_changed: 'Priority changed',
    due_date_changed: 'Due date changed',
    project_changed: 'Project changed',
    assigned_user_changed: 'Assigned user changed',
    deleted: 'Task deleted'
  }
};

function parseDetails(details: string) {
  try {
    const parsed = JSON.parse(details);
    if (parsed && typeof parsed === 'object' && ('from' in parsed || 'to' in parsed)) return parsed as { from: unknown; to: unknown };
  } catch {}
  return null;
}

function formatDate(value: unknown, lang: AppLanguage) {
  if (!value) return lang === 'en' ? 'none' : lang === 'uk' ? 'немає' : 'нет';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString(localeByLang[lang], { dateStyle: 'medium', timeStyle: 'short' });
}

function formatProject(value: unknown, projects: Project[], lang: AppLanguage) {
  if (!value || value === 'unassigned') return getTranslation(lang, 'unassigned');
  return projects.find(project => project.id === value)?.name || String(value);
}

function formatPriority(value: unknown, lang: AppLanguage) {
  const priority = String(value || 'none') as TaskPriority;
  const key = `priority${priority.charAt(0).toUpperCase()}${priority.slice(1)}` as any;
  return getTranslation(lang, key);
}

function formatStatus(value: unknown, lang: AppLanguage) {
  return getTranslation(lang, String(value || 'planned') as TaskStatus);
}

function formatPair(action: string, details: string, projects: Project[], lang: AppLanguage) {
  const data = parseDetails(details);
  if (!data) return null;

  const value = (raw: unknown) => {
    if (action === 'status_changed') return formatStatus(raw, lang);
    if (action === 'priority_changed') return formatPriority(raw, lang);
    if (action === 'due_date_changed') return formatDate(raw, lang);
    if (action === 'project_changed') return formatProject(raw, projects, lang);
    if (raw === null || raw === undefined || raw === '') return lang === 'en' ? 'empty' : lang === 'uk' ? 'порожньо' : 'пусто';
    return String(raw);
  };

  const arrow = lang === 'en' ? 'to' : lang === 'uk' ? 'на' : 'на';
  return `${value(data.from)} ${arrow} ${value(data.to)}`;
}

function legacyDetails(action: string, details: string, lang: AppLanguage) {
  const lower = details.toLowerCase();
  if (action === 'created' || lower.includes('task initiated')) return actionLabels[lang].created;
  if (action === 'deleted' || lower.startsWith('task deleted')) return actionLabels[lang].deleted;
  if (lower.includes('deadline changed')) return actionLabels[lang].due_date_changed;
  if (lower.includes('status changed')) return actionLabels[lang].status_changed;
  if (lower.includes('priority')) return actionLabels[lang].priority_changed;
  if (lower.includes('project')) return actionLabels[lang].project_changed;
  if (lower.includes('specification') || lower.includes('description')) return actionLabels[lang].description_changed;
  return details || actionLabels[lang][action] || action;
}

export function formatActivityAction(action: string, lang: AppLanguage) {
  return actionLabels[lang][action] || actionLabels[lang].updated;
}

export function formatActivityDetails(action: string, details: string, projects: Project[], lang: AppLanguage) {
  const pair = formatPair(action, details, projects, lang);
  const label = formatActivityAction(action, lang);
  if (pair) return `${label}: ${pair}`;
  return legacyDetails(action, details, lang);
}

export function formatActivityTimestamp(timestamp: string, lang: AppLanguage, withSeconds = true) {
  try {
    return new Date(timestamp).toLocaleString(localeByLang[lang], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      ...(withSeconds ? { second: '2-digit' } : {})
    });
  } catch {
    return timestamp;
  }
}
