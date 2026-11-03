import { useId } from 'react';

/** Custom S monogram on a flat tile, drawn with theme-aware tokens. */
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
      <path
        d="M33.5 16.2c-2.6-3.4-12.6-4.2-16.5.2-6.2 7.1 3.5 8.1 10 10.1 8.7 2.7 6.1 10.2-1.5 11.5-4.6.8-9.4-.9-12-4.6"
        stroke="var(--rp-mark-ink)"
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
