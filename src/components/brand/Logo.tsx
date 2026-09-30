import { useId } from "react";
import clsx from "clsx";
import { BRAND_GRADIENT } from "@config/brand";

/** The app mark (assets/brand/logo.svg) as a component. Decorative. */
export function Logo({ className }: { className?: string }) {
  // Unique gradient id per instance — two logos on a page must not share one.
  const gradientId = `ytg-logo-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg
      viewBox="0 0 512 512"
      aria-hidden="true"
      focusable="false"
      className={clsx("shrink-0", className)}
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="40"
          y1="24"
          x2="472"
          y2="488"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor={BRAND_GRADIENT.from} />
          <stop offset="1" stopColor={BRAND_GRADIENT.to} />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="120" fill={`url(#${gradientId})`} />
      <path
        d="M176 118c0-17.9 19.4-29.1 34.9-20.1l128.2 74c15.5 9 15.5 31.2 0 40.2l-128.2 74C195.4 295.1 176 283.9 176 266z"
        fill="#fff"
      />
      <rect x="136" y="322" width="240" height="32" rx="16" fill="#fff" fillOpacity=".92" />
      <rect x="136" y="374" width="160" height="32" rx="16" fill="#fff" fillOpacity=".6" />
    </svg>
  );
}
