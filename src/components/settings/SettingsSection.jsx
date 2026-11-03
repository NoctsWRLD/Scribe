/**
 * One topic on the settings page: a heading, an optional sentence about it,
 * then its controls. No box — a hairline above the heading starts the topic.
 */
export default function SettingsSection({ id, title, description, children, action }) {
  return (
    <section className="border-t border-rp-line pt-5" aria-labelledby={`${id}-heading`}>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 id={`${id}-heading`} className="text-subtitle text-rp-text">{title}</h2>
          {description && <p className="mt-1 max-w-xl text-small text-rp-muted">{description}</p>}
        </div>
        {action}
      </div>
      <div className="flex flex-col">{children}</div>
    </section>
  );
}
