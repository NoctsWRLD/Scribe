/**
 * Filtering and sorting for the task list, kept out of the component so it
 * can be tested without a browser.
 */
export function filterTasks(tasks, subjects, options = {}) {
  const { status = 'pending', subjectId = '', search = '', sort = 'dueDate' } = options;
  const term = search.trim().toLocaleLowerCase('sl');
  const subjectNames = new Map(subjects.map((subject) => [subject.id, subject.name]));

  const list = tasks.filter((task) => {
    if (status === 'pending' && task.completed) return false;
    if (status === 'completed' && !task.completed) return false;
    if (subjectId && task.subjectId !== subjectId) return false;
    if (!term) return true;
    const subjectName = subjectNames.get(task.subjectId) || '';
    return `${task.title} ${task.description || ''} ${subjectName}`
      .toLocaleLowerCase('sl')
      .includes(term);
  });

  return list.sort((a, b) => {
    if (sort === 'createdAt') {
      return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
    }
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate.localeCompare(b.dueDate);
  });
}

/** The counts the summary row shows, all from the same list. */
export function summarizeTasks(tasks, today, threeDaysFromNow) {
  const pending = tasks.filter((task) => !task.completed);
  const completed = tasks.filter((task) => task.completed);
  const overdue = pending.filter((task) => task.dueDate && task.dueDate < today);
  const dueSoon = pending.filter(
    (task) => task.dueDate && task.dueDate >= today && task.dueDate <= threeDaysFromNow,
  );
  return {
    pending: pending.length,
    completed: completed.length,
    overdue: overdue.length,
    dueSoon: dueSoon.length,
    completion: tasks.length ? Math.round((completed.length / tasks.length) * 100) : 0,
  };
}

/**
 * What the "done" button does for the current selection.
 *
 * Ticking a box only selects; nothing is written until the student presses
 * the button. If anything selected is still open, the button closes the open
 * ones. Only a selection made entirely of finished tasks offers to reopen
 * them. Ids that are no longer in the visible list (a filter changed) are
 * ignored, so the button can never act on a row the student cannot see.
 */
export function planSelection(visibleTasks, selectedIds) {
  const chosen = new Set(selectedIds);
  const tasks = visibleTasks.filter((task) => chosen.has(task.id));
  const open = tasks.filter((task) => !task.completed).map((task) => task.id);
  const done = tasks.filter((task) => task.completed).map((task) => task.id);
  if (open.length) return { action: 'complete', ids: open, all: tasks.map((task) => task.id) };
  if (done.length) return { action: 'reopen', ids: done, all: done };
  return { action: 'none', ids: [], all: [] };
}
