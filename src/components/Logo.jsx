import { useId } from 'react';

/**
 * The mark is a nib: a flat vermilion tile with a fountain-pen nib cut in
 * ink — a sharp point, the breather hole, the slit. It is set at 35° because
 * a pen in the hand is never upright, and drawn from the token layer so it
 * follows the theme without a second set of colours.
 *
 * There is no gradient, no outline and no second element. The wordmark beside
 * it is always set in Fraunces.
 */
export default function Logo({ size = 36, className = '' }) {
  const titleId = useId();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-labelledby={titleId}
      className={className}
    >
      <title id={titleId}>Scribe</title>
      <rect width="48" height="48" rx="2" fill="var(--rp-mark)" />
      <g transform="rotate(35 24 24)">
        <path
          d="M24 8.5C20.4 8.5 18 11 18 14.5V22c0 8 2.5 14.5 6 20 3.5-5.5 6-12 6-20v-7.5c0-3.5-2.4-6-6-6Z"
          fill="var(--rp-mark-ink)"
        />
        <circle cx="24" cy="21" r="2.8" fill="var(--rp-mark)" />
        <path
          d="M24 24V38"
          stroke="var(--rp-mark)"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
