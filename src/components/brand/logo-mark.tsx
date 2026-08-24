"use client";

import { useId } from "react";

interface LogoMarkProps {
  size?: number;
  className?: string;
}

/**
 * CreatorToolWorks brand mark: a rounded tile with three adjustable
 * "slider" tracks, evoking creator tooling/controls rather than any
 * single platform's iconography.
 */
export function LogoMark({ size = 32, className }: LogoMarkProps) {
  const gradientId = useId();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="CreatorToolWorks"
    >
      <rect width="32" height="32" rx="9" fill={`url(#${gradientId})`} />
      <g stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" opacity="0.85">
        <line x1="10.5" y1="8.5" x2="10.5" y2="23.5" />
        <line x1="16" y1="8.5" x2="16" y2="23.5" />
        <line x1="21.5" y1="8.5" x2="21.5" y2="23.5" />
      </g>
      <circle cx="10.5" cy="13" r="2.4" fill="#ffffff" />
      <circle cx="16" cy="19.5" r="2.4" fill="#ffffff" />
      <circle cx="21.5" cy="10.5" r="2.4" fill="#ffffff" />
      <circle cx="25.5" cy="7" r="2.1" fill="#ffb84d" />
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6d4aff" />
          <stop offset="1" stopColor="#5535e8" />
        </linearGradient>
      </defs>
    </svg>
  );
}
