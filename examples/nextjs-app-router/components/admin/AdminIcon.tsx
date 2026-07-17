import type { SVGProps } from "react";

export type AdminIconName =
  | "arrow-left"
  | "arrow-right"
  | "check"
  | "dashboard"
  | "database"
  | "edit"
  | "external"
  | "eye"
  | "image"
  | "menu"
  | "page"
  | "plus"
  | "search"
  | "sparkles"
  | "trash"
  | "upload"
  | "x";

export function AdminIcon({ name, ...props }: SVGProps<SVGSVGElement> & { name: AdminIconName }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {name === "dashboard" && (
        <>
          <rect x="3" y="3" width="7" height="7" rx="2" />
          <rect x="14" y="3" width="7" height="7" rx="2" />
          <rect x="3" y="14" width="7" height="7" rx="2" />
          <rect x="14" y="14" width="7" height="7" rx="2" />
        </>
      )}
      {name === "page" && (
        <>
          <path d="M6 3h8l4 4v14H6z" />
          <path d="M14 3v5h5M9 13h6M9 17h4" />
        </>
      )}
      {name === "image" && (
        <>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="9" cy="10" r="2" />
          <path d="m4 17 4-4 3 3 3-3 6 6" />
        </>
      )}
      {name === "external" && (
        <>
          <path d="M14 4h6v6M20 4l-9 9" />
          <path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6" />
        </>
      )}
      {name === "menu" && <path d="M4 7h16M4 12h16M4 17h16" />}
      {name === "x" && <path d="m6 6 12 12M18 6 6 18" />}
      {name === "plus" && <path d="M12 5v14M5 12h14" />}
      {name === "search" && (
        <>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-4-4" />
        </>
      )}
      {name === "edit" && (
        <>
          <path d="M4 20h4l11-11-4-4L4 16v4Z" />
          <path d="m13.5 6.5 4 4" />
        </>
      )}
      {name === "trash" && (
        <>
          <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" />
        </>
      )}
      {name === "eye" && (
        <>
          <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
          <circle cx="12" cy="12" r="2.5" />
        </>
      )}
      {name === "arrow-left" && <path d="m15 18-6-6 6-6" />}
      {name === "arrow-right" && <path d="m9 18 6-6-6-6" />}
      {name === "check" && <path d="m5 12 4 4L19 6" />}
      {name === "database" && (
        <>
          <ellipse cx="12" cy="5" rx="8" ry="3" />
          <path d="M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7" />
        </>
      )}
      {name === "sparkles" && (
        <>
          <path d="m12 3 1.2 3.2L16 7.5l-2.8 1.3L12 12l-1.2-3.2L8 7.5l2.8-1.3L12 3Z" />
          <path d="m18 13 .8 2.2L21 16l-2.2.8L18 19l-.8-2.2L15 16l2.2-.8L18 13ZM6 14l.8 2.2L9 17l-2.2.8L6 20l-.8-2.2L3 17l2.2-.8L6 14Z" />
        </>
      )}
      {name === "upload" && (
        <>
          <path d="M12 16V4M7 9l5-5 5 5" />
          <path d="M5 15v4h14v-4" />
        </>
      )}
    </svg>
  );
}

