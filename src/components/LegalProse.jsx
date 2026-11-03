/**
 * The shared frame for the legal and informational pages: one measure for
 * the prose, a contents list on the side, and a visible marker wherever a
 * fact is not filled in yet.
 */
export default function LegalProse({ title, intro, updated, children, note }) {
  return (
    <article className="mx-auto max-w-3xl">
      <header className="border-b border-rp-line pb-6">
        <h1 className="text-page text-rp-text">{title}</h1>
        {intro && <p className="mt-3 text-body leading-7 text-rp-subtle">{intro}</p>}
        {updated && <p className="mt-3 text-small text-rp-muted">Zadnja sprememba: {updated}</p>}
      </header>

      {note && (
        <p className="note mt-6 text-small leading-6" data-tone="warn">
          {note}
        </p>
      )}

      <div className="mt-8 grid gap-8 [&_h2]:text-title [&_h2]:text-rp-text [&_h2]:mt-10 [&_h2]:mb-3 [&_h3]:text-subtitle [&_h3]:text-rp-text [&_h3]:mt-6 [&_h3]:mb-2 [&_li]:text-body [&_li]:leading-6 [&_li]:text-rp-muted [&_p]:mt-3 [&_p]:text-body [&_p]:leading-7 [&_p]:text-rp-muted [&_ul]:mt-3 [&_ul]:grid [&_ul]:gap-2 [&_ul]:pl-5 [&_ul]:list-disc">
        {children}
      </div>
    </article>
  );
}
