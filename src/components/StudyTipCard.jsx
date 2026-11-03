import { getDayOfYear, getSlovenianDateKey } from '../utils/dates';
import { useI18n } from '../i18n';

/* Keys are Slovenian source strings; translations live in i18n/messages.js. */
const STUDY_TIPS = [
  { title: 'Preverjaj spomin', copy: 'Zapri zapiske in s svojimi besedami razloži tri glavne ideje.' },
  { title: 'Uči se v krogih', copy: 'Razdeli snov na manjše sklope in vmes naredi kratek odmor.' },
  { title: 'Povej na glas', copy: 'Razloži snov, kot da jo učiš prijatelja.' },
  { title: 'Začni z vprašanjem', copy: 'Zapiši si, kaj želiš razumeti, preden začneš.' },
  { title: 'Ponavljaj z razmikom', copy: 'Vrni se čez dan, čez nekaj dni in čez teden.' },
  { title: 'Menjaj način', copy: 'Izmenjuj branje, naloge in razlago.' },
  { title: 'Najprej osnutek', copy: 'Težko nalogo začni z grobim načrtom.' },
];

export default function StudyTipCard() {
  const { t } = useI18n();
  const tip = STUDY_TIPS[getDayOfYear(getSlovenianDateKey()) % STUDY_TIPS.length];
  return (
    <section className="border-t border-rp-line pt-4" aria-labelledby="study-tip-title">
      <h2 id="study-tip-title" className="text-body font-semibold text-rp-text">{t(tip.title)}</h2>
      <p className="mt-1 text-small text-rp-muted">{t(tip.copy)}</p>
    </section>
  );
}
