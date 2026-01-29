import React from 'react';

type Variant = 'dot' | 'pulse';

export function UnreadBadge({
  count,
  variant,
  className = '',
}: {
  count?: number;
  variant: Variant;
  className?: string;
}) {
  if (variant === 'dot') {
    return (
      <span
        className={`flex h-2.5 w-2.5 rounded-full bg-red-500 ${className}`}
        aria-hidden="true"
      />
    );
  }

  const safeCount = typeof count === 'number' ? count : 0;
  if (safeCount <= 0) return null;

  const label = safeCount > 99 ? '99+' : String(safeCount);

  return (
    <span
      className={`relative flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-extrabold leading-none text-white ${className}`}
      aria-label={`Unread leads: ${safeCount}`}
    >
      <span
        className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-600 opacity-30"
        aria-hidden="true"
      />
      <span className="relative">{label}</span>
    </span>
  );
}

