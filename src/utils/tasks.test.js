import { describe, expect, it } from 'vitest';
import { filterTasks, planSelection, summarizeTasks } from './tasks';

const subjects = [
  { id: 's1', name: 'Matematika' },
  { id: 's2', name: 'Fizika' },
];

const tasks = [
  { id: '1', title: 'Potence', description: 'Naloge 12–18', subjectId: 's1', dueDate: '2026-10-19', completed: false, createdAt: { seconds: 100 } },
  { id: '2', title: 'Odvod', description: '', subjectId: 's1', dueDate: '2026-10-22', completed: false, createdAt: { seconds: 300 } },
  { id: '3', title: 'Gravitacija', description: 'Projekt', subjectId: 's2', dueDate: '2026-10-17', completed: false, createdAt: { seconds: 200 } },
  { id: '4', title: 'Enačbe', description: '', subjectId: 's2', dueDate: '2026-10-25', completed: true, createdAt: { seconds: 400 } },
  { id: '5', title: 'Brez roka', description: '', subjectId: 's1', dueDate: null, completed: false, createdAt: { seconds: 50 } },
];

describe('filterTasks', () => {
  it('shows only open tasks by default', () => {
    const result = filterTasks(tasks, subjects, {});
    expect(result.map((task) => task.id)).toEqual(['3', '1', '2', '5']);
  });

  it('shows completed tasks when asked', () => {
    const result = filterTasks(tasks, subjects, { status: 'completed' });
    expect(result.map((task) => task.id)).toEqual(['4']);
  });

  it('shows everything with the "all" status', () => {
    const result = filterTasks(tasks, subjects, { status: 'all' });
    expect(result).toHaveLength(5);
  });

  it('filters by subject', () => {
    const result = filterTasks(tasks, subjects, { status: 'all', subjectId: 's2' });
    expect(result.map((task) => task.id).sort()).toEqual(['3', '4']);
  });

  it('searches the title, the description and the subject name', () => {
    expect(filterTasks(tasks, subjects, { status: 'all', search: 'poten' }).map((t) => t.id)).toEqual(['1']);
    expect(filterTasks(tasks, subjects, { status: 'all', search: 'projekt' }).map((t) => t.id)).toEqual(['3']);
    // Both Fizika tasks carry the subject name in their search text.
    expect(filterTasks(tasks, subjects, { status: 'all', search: 'fizika' }).map((t) => t.id)).toEqual(['3', '4']);
  });

  it('ignores case and surrounding whitespace', () => {
    expect(filterTasks(tasks, subjects, { status: 'all', search: '  ENačBe  ' }).map((t) => t.id)).toEqual(['4']);
  });

  it('sorts by due date, putting undated tasks last', () => {
    const result = filterTasks(tasks, subjects, { status: 'all', sort: 'dueDate' });
    expect(result.map((task) => task.id)).toEqual(['3', '1', '2', '4', '5']);
  });

  it('sorts by newest first when asked', () => {
    const result = filterTasks(tasks, subjects, { status: 'all', sort: 'createdAt' });
    expect(result.map((task) => task.id)).toEqual(['4', '2', '3', '1', '5']);
  });

  it('does not mutate the source list', () => {
    const before = tasks.map((task) => task.id);
    filterTasks(tasks, subjects, { status: 'all', sort: 'createdAt' });
    expect(tasks.map((task) => task.id)).toEqual(before);
  });

  it('returns nothing when the search matches nothing', () => {
    expect(filterTasks(tasks, subjects, { status: 'all', search: 'zzz' })).toEqual([]);
  });
});

describe('summarizeTasks', () => {
  const summary = summarizeTasks(tasks, '2026-10-21', '2026-10-24');

  it('counts open, completed, overdue and due-soon', () => {
    expect(summary.pending).toBe(4);
    expect(summary.completed).toBe(1);
    // 19. 10. and 17. 10. both sit before the 21. 10.
    expect(summary.overdue).toBe(2);
    expect(summary.dueSoon).toBe(1);
  });

  it('reports the completion rate', () => {
    expect(summary.completion).toBe(20);
  });

  it('handles an empty list', () => {
    const empty = summarizeTasks([], '2026-10-21', '2026-10-24');
    expect(empty.pending).toBe(0);
    expect(empty.completion).toBe(0);
  });
});

describe('planSelection', () => {
  it('does nothing until something is selected', () => {
    expect(planSelection(tasks, [])).toEqual({ action: 'none', ids: [], all: [] });
  });

  it('completes a single selected task only through the plan, not on tick', () => {
    expect(planSelection(tasks, ['1'])).toEqual({ action: 'complete', ids: ['1'], all: ['1'] });
  });

  it('completes the open tasks of a mixed selection and leaves finished ones alone', () => {
    const plan = planSelection(tasks, ['1', '4', '2']);
    expect(plan.action).toBe('complete');
    expect(plan.ids).toEqual(['1', '2']);
  });

  it('offers to reopen when every selected task is already finished', () => {
    expect(planSelection(tasks, ['4'])).toEqual({ action: 'reopen', ids: ['4'], all: ['4'] });
  });

  it('ignores ids that are no longer visible', () => {
    const visible = tasks.filter((task) => task.id !== '3');
    expect(planSelection(visible, ['3'])).toEqual({ action: 'none', ids: [], all: [] });
  });
});
