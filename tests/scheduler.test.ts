import test from 'node:test';
import assert from 'node:assert/strict';
import { isScheduledReleaseDue, shouldSendReminder } from '../electron/scheduler-logic';
import { Task } from '../src/types';

const task = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1', title: 'Test', description: '', projectId: 'unassigned',
  priority: 'medium', type: 'feature', status: 'planned', tags: [], checklist: [],
  attachments: [], prompts: [], codeSnippets: [], notes: '', createdDate: '', updatedDate: '',
  history: [], dueAt: '2026-01-01T10:00:00.000Z', reminderAt: '2026-01-01T10:00:00.000Z',
  reminderEnabled: true, reminderRepeat: 'none', reminderCustomMinutes: null,
  reminderSentAt: null, completedAt: null, isOverdue: false, ...overrides
});

test('completed tasks never send reminders', () => {
  assert.equal(shouldSendReminder(task({ status: 'completed', completedAt: '2026-01-01T09:00:00.000Z' }), Date.parse('2026-01-01T11:00:00Z')), false);
});

test('one-shot reminders are not duplicated', () => {
  assert.equal(shouldSendReminder(task({ reminderSentAt: '2026-01-01T10:00:00.000Z' }), Date.parse('2026-01-01T11:00:00Z')), false);
});

test('hourly reminders repeat only after interval', () => {
  const repeated = task({ reminderRepeat: 'hourly', reminderSentAt: '2026-01-01T10:00:00.000Z' });
  assert.equal(shouldSendReminder(repeated, Date.parse('2026-01-01T10:59:00Z')), false);
  assert.equal(shouldSendReminder(repeated, Date.parse('2026-01-01T11:00:00Z')), true);
});

test('scheduled releases become due at scheduled time', () => {
  assert.equal(isScheduledReleaseDue('scheduled', '2026-01-01T10:00:00Z', Date.parse('2026-01-01T10:00:00Z')), true);
  assert.equal(isScheduledReleaseDue('failed', '2026-01-01T10:00:00Z', Date.parse('2026-01-01T11:00:00Z')), false);
});
