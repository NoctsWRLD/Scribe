import { useMemo, useState } from 'react';
import TaskCard from './TaskCard';
import { planSelection } from '../utils/tasks';
import { useI18n } from '../i18n';

/**
 * A list of tasks the student can select and then finish in one go.
 *
 * Ticking a row only selects it. The bar that appears under the list says
 * how many are chosen and what the button will do, and nothing is saved
 * until that button is pressed — also when only one task is selected, so
 * the list never changes under a stray tap.
 */
export default function TaskLedger({ tasks, subjects, onEdit, onDelete, onSetCompleted, onDeleteMany, className = '' }) {
  const { t, tn } = useI18n();
  const [selectedIds, setSelectedIds] = useState([]);
  const [busy, setBusy] = useState(false);

  // A filter change can hide a selected row; the plan only counts rows that
  // are still on screen.
  const plan = useMemo(() => planSelection(tasks, selectedIds), [tasks, selectedIds]);
  const count = plan.all.length;
  const allSelected = tasks.length > 0 && count === tasks.length;

  const taskForms = { one: t('nalogo'), two: t('nalogi'), few: t('naloge'), other: t('nalog') };

  function toggle(task) {
    setSelectedIds((previous) =>
      previous.includes(task.id) ? previous.filter((id) => id !== task.id) : [...previous, task.id],
    );
  }

  function toggleAll() {
    setSelectedIds(allSelected ? [] : tasks.map((task) => task.id));
  }

  async function submit() {
    if (plan.action === 'none' || busy) return;
    setBusy(true);
    const ok = await onSetCompleted(plan.ids, plan.action === 'complete');
    setBusy(false);
    if (ok !== false) setSelectedIds([]);
  }

  async function removeSelected() {
    if (!count || busy || !onDeleteMany) return;
    if (!window.confirm(t('Izbrišem {count}?', { count: tn(count, taskForms) }))) return;
    setBusy(true);
    const ok = await onDeleteMany(plan.all);
    setBusy(false);
    if (ok !== false) setSelectedIds([]);
  }

  const submitLabel =
    plan.action === 'reopen'
      ? t('Vrni med odprte ({count})', { count: plan.ids.length })
      : t('Označi kot opravljeno ({count})', { count: plan.ids.length });

  return (
    <div className={className}>
      <div className="sheet ledger overflow-hidden">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            subject={subjects.find((subject) => subject.id === task.subjectId) || null}
            selected={selectedIds.includes(task.id)}
            onSelect={toggle}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

      {count > 0 && (
        <div
          role="region"
          aria-label={t('Izbrane naloge')}
          className="selection-bar sticky bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-30 mt-3 flex flex-wrap items-center gap-2 rounded-md border border-rp-line-strong bg-rp-raised p-2 pl-3 lg:bottom-4"
        >
          <p className="mr-auto text-small font-semibold text-rp-text" aria-live="polite">
            {t('Izbrano: {count}', { count: tn(count, taskForms) })}
          </p>
          {tasks.length > 1 && (
            <button type="button" onClick={toggleAll} className="btn btn-sm border-transparent bg-transparent">
              {allSelected ? t('Počisti izbor') : t('Izberi vse')}
            </button>
          )}
          {onDeleteMany && (
            <button type="button" onClick={removeSelected} disabled={busy} className="btn btn-sm btn-danger">
              {t('Izbriši')}
            </button>
          )}
          <button type="button" onClick={submit} disabled={busy} className="btn btn-primary">
            {submitLabel}
          </button>
        </div>
      )}
    </div>
  );
}
