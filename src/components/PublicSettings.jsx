import { useEffect, useRef, useState } from 'react';
import { LOCALES } from '../i18n/locales';
import { useI18n } from '../i18n';
import { useSettings } from '../contexts/SettingsContext';
import { THEMES } from '../utils/themes';
import { GearIcon } from './icons';
import Select from './Select';

/**
 * The public pages have no account, so they carry one settings popover. It is
 * the only place language and appearance can be changed before signing in;
 * once signed in, the Settings page owns every option.
 */
export default function PublicSettings() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const buttonRef = useRef(null);
  const { locale, setLocale, t } = useI18n();
  const { theme, setTheme, highContrast, setHighContrast, reduceMotion, setReduceMotion } = useSettings();

  useEffect(() => {
    if (!open) return undefined;
    function onKey(event) {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    function onPointer(event) {
      const panel = panelRef.current;
      if (!panel || panel.contains(event.target)) return;

      // Select renders its listbox in a portal at the document root. Treat a
      // listbox controlled by one of this panel's selects as an inside click.
      const listbox = event.target.closest?.('[role="listbox"]');
      const belongsToPanel = listbox && [...panel.querySelectorAll('[aria-controls]')]
        .some((control) => control.getAttribute('aria-controls') === listbox.id);
      if (!belongsToPanel) setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  const checkRow = (id, label, checked, onChange) => (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center justify-between gap-4 border-t border-rp-line py-3 text-body text-rp-text"
    >
      {label}
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="check-control"
      />
    </label>
  );

  return (
    <div className="relative" ref={panelRef}>
      <button
        ref={buttonRef}
        type="button"
        title={t('Nastavitve')}
        aria-label={t('Nastavitve')}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="btn btn-icon"
      >
        <GearIcon className="h-[18px] w-[18px]" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={t('Nastavitve')}
          className="floating modal-pop absolute right-0 top-full z-50 mt-2 w-72 p-4"
        >
          <p className="eyebrow">{t('Nastavitve')}</p>

          <label className="mt-4 block">
            <span className="field-label">{t('Jezik')}</span>
            <Select
              value={locale}
              onChange={(event) => setLocale(event.target.value)}
              className="field"
            >
              {LOCALES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </Select>
          </label>

          <label className="mt-3 block">
            <span className="field-label">{t('Videz')}</span>
            <Select
              value={theme}
              onChange={(event) => setTheme(event.target.value)}
              className="field"
            >
              {THEMES.map((item) => (
                <option key={item.id} value={item.id}>
                  {t(item.name)}
                </option>
              ))}
            </Select>
          </label>

          <div className="mt-3">
            {checkRow('public-contrast', t('Močnejši kontrast'), highContrast, setHighContrast)}
            {checkRow('public-motion', t('Manj gibanja'), reduceMotion, setReduceMotion)}
          </div>
        </div>
      )}
    </div>
  );
}
