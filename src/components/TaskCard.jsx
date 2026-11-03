import { daysBetweenDateKeys, formatDate, getSlovenianDateKey } from '../utils/dates';
import { getSubjectColor } from '../utils/colors';
import { useI18n } from '../i18n';
import { EditIcon, TrashIcon } from './icons';

/**
 * One row in the ledger.
 *
 * The box at the start of the row selects the task; it never completes it.
 * Completion happens in the bar under the list, after the student has said
 * which tasks they mean — one or twenty, the same button does it.
 */
export default function TaskCard({ task, subject, selected, onSelect, onEdit, onDelete }) {
  const { t, localeTag } = useI18n();
  const color = subject ? getSubjectColor(subject.colorIndex) : null;

  function formatDue(dateStr) {
    if (!dateStr) return null;
    const diff = daysBetweenDateKeys(dateStr, getSlovenianDateKey());
    const label = formatDate(dateStr, { day: 'numeric', month: 'short' }, localeTag);
    if (task.completed) return { label, tone: 'text-rp-muted' };
    if (diff < 0) return { label: t('Zamujeno {date}', { date: label }), tone: 'text-rp-danger' };
    if (diff === 0) return { label: t('Danes'), tone: 'text-rp-accent' };
    if (diff === 1) return { label: t('Jutri'), tone: 'text-rp-subtle' };
    return { label, tone: 'text-rp-muted' };
  }

  const due = formatDue(task.dueDate);
  const checkboxId = `task-select-${task.id}`;

  return (
    <div className="ledger-row flex items-center gap-1 pr-1" data-selected={selected ? 'true' : 'false'}>
      {/* The whole left part of the row is the label, so a thumb does not
          have to hit a 20px box. */}
      <label htmlFor={checkboxId} className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 py-3 pl-3">
        <input
          id={checkboxId}
          type="checkbox"
          className="check-control"
          checked={!!selected}
          onChange={() => onSelect(task)}
        />
        <span className="min-w-0 flex-1">
          <span
            className={`block truncate text-body font-semibold leading-snug ${
              task.completed ? 'text-rp-muted line-through' : 'text-rp-text'
            }`}
          >
            {task.title}
            {task.completed && <span className="sr-only"> ({t('opravljeno')})</span>}
          </span>
          {(subject || due) && (
            <span className="mt-0.5 flex min-w-0 items-center gap-2 text-small text-rp-muted">
              {subject && (
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color.colorVar }} aria-hidden="true" />
                  <span className="truncate">{subject.name}</span>
                </span>
              )}
              {due && <span className={`mono shrink-0 ${due.tone}`}>{due.label}</span>}
            </span>
          )}
        </span>
      </label>

      <button
        type="button"
        onClick={() => onEdit(task)}
        aria-label={t('Uredi nalogo {title}', { title: task.title })}
        className="btn btn-icon border-transparent bg-transparent text-rp-muted hover:text-rp-text"
      >
        <EditIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onDelete(task)}
        aria-label={t('Izbriši nalogo {title}', { title: task.title })}
        className="btn btn-icon border-transparent bg-transparent text-rp-muted hover:!text-rp-danger"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
