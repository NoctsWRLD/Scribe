/**
 * Plurals without string concatenation.
 *
 * `Intl.PluralRules` decides the category; the caller supplies the forms.
 * Slovenian and Croatian need four (`one`, `two`, `few`, `other`); English,
 * German and Italian need two. A missing category falls back to `other`, so a
 * locale can never render nothing.
 */
const cache = new Map();

function rulesFor(tag) {
  if (!cache.has(tag)) cache.set(tag, new Intl.PluralRules(tag));
  return cache.get(tag);
}

/**
 * "3 naloge" — the count plus the noun form, already inflected.
 *
 * `forms` is `{ one, two, few, other }`. Numbers are formatted by the
 * locale, so 1 000 in German is "1.000".
 */
export function counted(count, forms, tag = 'sl-SI') {
  const category = rulesFor(tag).select(count);
  const form = forms[category] || forms.other || forms.one || '';
  return `${new Intl.NumberFormat(tag).format(count)} ${form}`;
}

/** The form alone, for a label where the number is rendered separately. */
export function nounForm(count, forms, tag = 'sl-SI') {
  const category = rulesFor(tag).select(count);
  return forms[category] || forms.other || forms.one || '';
}
