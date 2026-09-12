"use client";
import React from "react";

/**
 * Minimal inline icon set so the editor stays dependency-free (no icon
 * library in package.json). Stroke-based, 24x24 viewBox, sized via the
 * `size` prop.
 */
export type IconName =
  | "undo"
  | "redo"
  | "import"
  | "export"
  | "eye"
  | "eyeOff"
  | "save"
  | "chevronDown"
  | "chevronRight"
  | "search"
  | "monitor"
  | "tablet"
  | "smartphone"
  | "layers"
  | "blocks"
  | "panelLeftClose"
  | "panelLeftOpen"
  | "panelRightClose"
  | "panelRightOpen"
  | "grip"
  | "copy"
  | "trash"
  | "chevronLeft";

const PATHS: Record<IconName, React.ReactNode> = {
  undo: <path d="M3 10h10a5 5 0 015 5v2m0 0l-3-3m3 3l3-3M3 10l3-3m-3 3l3 3" />,
  redo: <path d="M21 10H11a5 5 0 00-5 5v2m0 0l3-3m-3 3l-3-3m14-4l-3-3m3 3l-3 3" />,
  import: <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />,
  export: <path d="M12 15V3m0 0L8 7m4-4l4 4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />,
  eye: (
    <>
      <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M17.94 17.94A10.94 10.94 0 0112 19c-4.478 0-8.268-2.943-9.542-7a11.02 11.02 0 012.51-4.19M9.9 4.24A10.6 10.6 0 0112 4c4.478 0 8.268 2.943 9.542 7a10.98 10.98 0 01-4.132 5.411" />
      <path d="M14.12 14.12a3 3 0 11-4.24-4.24M1 1l22 22" />
    </>
  ),
  save: <path d="M5 13l4 4L19 7" />,
  chevronDown: <path d="M19 9l-7 7-7-7" />,
  chevronRight: <path d="M9 6l6 6-6 6" />,
  chevronLeft: <path d="M15 6l-6 6 6 6" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" />
    </>
  ),
  monitor: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="1.5" />
      <path d="M8 20h8M12 16v4" />
    </>
  ),
  tablet: <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />,
  smartphone: <rect x="7" y="2" width="10" height="20" rx="2" ry="2" />,
  layers: (
    <>
      <path d="M12 2l9 5-9 5-9-5 9-5z" />
      <path d="M3 12l9 5 9-5M3 17l9 5 9-5" />
    </>
  ),
  blocks: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  panelLeftClose: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16M14 10l-2 2 2 2" />
    </>
  ),
  panelLeftOpen: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16M13 10l2 2-2 2" />
    </>
  ),
  panelRightClose: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M15 4v16M11 10l2 2-2 2" />
    </>
  ),
  panelRightOpen: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M15 4v16M12 10l-2 2 2 2" />
    </>
  ),
  grip: (
    <>
      <circle cx="9" cy="6" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="15" cy="6" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="9" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="9" cy="18" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="15" cy="18" r="1.2" fill="currentColor" stroke="none" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15H4a1 1 0 01-1-1V4a1 1 0 011-1h10a1 1 0 011 1v1" />
    </>
  ),
  trash: <path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m2 0v12a2 2 0 01-2 2H8a2 2 0 01-2-2V7h12z" />,
};

export function Icon({
  name,
  size = 14,
  className,
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
