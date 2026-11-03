/**
 * An empty screen is an invitation to act, not an apology.
 *
 * No box: the message sits on the page under a hairline, the action right
 * under it, aligned with everything else on the screen.
 */
export default function EmptyState({ icon, title, description, action, compact = false }) {
  return (
    <div className={`flex gap-4 border-t border-rp-line ${compact ? 'py-5' : 'py-8'}`}>
      {icon && (
        <span className="mt-0.5 shrink-0 text-rp-accent" aria-hidden="true">
          {icon}
        </span>
      )}
      <div className="min-w-0 max-w-md">
        <h2 className="text-subtitle font-semibold text-rp-text">{title}</h2>
        {description && <p className="mt-1 text-body text-rp-muted">{description}</p>}
        {action && <div className="mt-4">{action}</div>}
      </div>
    </div>
  );
}
