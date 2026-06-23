import { Task } from '../src/types';

export function reminderIntervalMinutes(task: Pick<Task, 'reminderRepeat' | 'reminderCustomMinutes'>): number | null {
  if (task.reminderRepeat === 'hourly') return 60;
  if (task.reminderRepeat === 'daily') return 1440;
  if (task.reminderRepeat === 'custom') return task.reminderCustomMinutes;
  return null;
}

export function shouldSendReminder(task: Task, now: number): boolean {
  if (!task.reminderEnabled || !task.reminderAt || task.status === 'completed' || task.completedAt) return false;
  const firstAt = new Date(task.reminderAt).getTime();
  if (!Number.isFinite(firstAt) || firstAt > now) return false;
  const repeat = reminderIntervalMinutes(task);
  const lastSent = task.reminderSentAt ? new Date(task.reminderSentAt).getTime() : 0;
  return !lastSent || Boolean(repeat && now - lastSent >= repeat * 60_000);
}

export function isScheduledReleaseDue(status: string, scheduledAt: string, now: number): boolean {
  return status === 'scheduled' && new Date(scheduledAt).getTime() <= now;
}
