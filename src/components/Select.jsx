import { Children, isValidElement, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDownIcon, CheckIcon } from './icons';
import { useI18n } from '../i18n';

/** Theme-native select popover with a hidden native control for form validation. */
export default function Select({
  id,
  value = '',
  onChange,
  children,
  className = '',
  'aria-label': ariaLabel,
  required = false,
  disabled = false,
  ...buttonProps
}) {
  const { t } = useI18n();
  const generatedId = useId();
  const controlId = id || generatedId;
  const [open, setOpen] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const listRef = useRef(null);
  const optionRefs = useRef([]);
  const [position, setPosition] = useState(null);
  const listId = `${controlId}-options`;
  const options = useMemo(() => Children.toArray(children).filter(
    (child) => isValidElement(child) && child.type === 'option',
  ), [children]);
  const selectedIndex = options.findIndex((option) => String(option.props.value ?? '') === String(value));
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null;

  useEffect(() => {
    if (!open) return undefined;
    function positionList() {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const below = Math.max(0, window.innerHeight - rect.bottom - 8);
      const above = Math.max(0, rect.top - 8);
      const desired = Math.min(options.length * 40 + 8, 256);
      const opensUp = below < desired && above > below;
      const maxHeight = Math.max(80, Math.min(desired, opensUp ? above : below));
      setPosition({
        left: rect.left,
        top: opensUp ? rect.top - maxHeight - 6 : rect.bottom + 6,
        width: rect.width,
        maxHeight,
      });
    }
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target) && !listRef.current?.contains(event.target)) setOpen(false);
    };
    positionList();
    window.addEventListener('resize', positionList);
    document.addEventListener('scroll', positionList, true);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('resize', positionList);
      document.removeEventListener('scroll', positionList, true);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open, options.length]);

  useEffect(() => {
    if (open) {
      const selectedIsDisabled = selectedIndex >= 0 && options[selectedIndex].props.disabled;
      const index = selectedIndex >= 0 && !selectedIsDisabled
        ? selectedIndex
        : options.findIndex((option) => !option.props.disabled);
      requestAnimationFrame(() => optionRefs.current[index]?.focus());
    }
  }, [open, options, selectedIndex]);

  function choose(option) {
    const nextValue = String(option.props.value ?? '');
    setOpen(false);
    setInvalid(false);
    onChange?.({ target: { value: nextValue } });
    buttonRef.current?.focus();
  }

  function focusOption(index, direction = 1) {
    if (!options.length) return;
    let next = (index + options.length) % options.length;
    for (let count = 0; count < options.length; count += 1) {
      if (!options[next].props.disabled) {
        optionRefs.current[next]?.focus();
        return;
      }
      next = (next + direction + options.length) % options.length;
    }
  }

  function handleTriggerKeyDown(event) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
    } else if (event.key === 'Escape' && open) {
      event.preventDefault();
      setOpen(false);
    }
  }

  function handleOptionKeyDown(event, index) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      focusOption(index + (event.key === 'ArrowDown' ? 1 : -1), event.key === 'ArrowDown' ? 1 : -1);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      const indexToFocus = event.key === 'Home' ? 0 : options.length - 1;
      focusOption(indexToFocus, event.key === 'Home' ? 1 : -1);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
    } else if (event.key === 'Tab') {
      setOpen(false);
    }
  }

  return (
    <>
    <div className="relative min-w-0" ref={rootRef}>
      <select
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        value={value}
        required={required}
        disabled={disabled}
        onChange={() => {}}
        onInvalid={(event) => {
          event.preventDefault();
          setInvalid(true);
          buttonRef.current?.focus();
        }}
      >
        {children}
      </select>
      <button
        {...buttonProps}
        ref={buttonRef}
        id={controlId}
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-required={required || undefined}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? `${listId}-error` : undefined}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={handleTriggerKeyDown}
        className={`field flex items-center justify-between gap-3 text-left ${invalid ? 'border-rp-danger' : ''} ${className}`}
      >
        <span className="min-w-0 truncate">{selected?.props.children ?? '—'}</span>
        <ChevronDownIcon className={`h-4 w-4 shrink-0 text-rp-muted transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>
      {invalid && (
        <span id={`${listId}-error`} className="sr-only" role="alert">{t('Izberi možnost.')}</span>
      )}
    </div>
    {createPortal(
      <div
        ref={listRef}
        id={listId}
        hidden={!open}
        role="listbox"
        aria-label={ariaLabel || undefined}
        aria-labelledby={ariaLabel ? undefined : controlId}
        style={position ? { left: position.left, top: position.top, width: position.width, maxHeight: position.maxHeight } : undefined}
        className={`floating modal-pop fixed z-[60] overflow-y-auto p-1 ${open ? '' : 'hidden'}`}
      >
        {options.map((option, index) => {
          const optionValue = String(option.props.value ?? '');
          const isSelected = optionValue === String(value);
          return (
            <button
              key={optionValue || `option-${index}`}
              ref={(element) => { optionRefs.current[index] = element; }}
              type="button"
              role="option"
              aria-selected={isSelected}
              disabled={option.props.disabled}
              tabIndex={-1}
              onClick={() => choose(option)}
              onKeyDown={(event) => handleOptionKeyDown(event, index)}
              className={`flex min-h-10 w-full items-center justify-between gap-3 px-3 py-2 text-left text-body transition-colors hover:bg-rp-overlay focus-visible:bg-rp-overlay focus-visible:outline-none ${isSelected ? 'font-semibold text-rp-accent' : 'text-rp-text'} disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <span className="min-w-0 truncate">{option.props.children}</span>
              {isSelected && <CheckIcon className="h-4 w-4 shrink-0 text-rp-accent" />}
            </button>
          );
        })}
      </div>,
      document.body,
    )}
    </>
  );
}
