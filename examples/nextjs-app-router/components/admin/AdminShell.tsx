"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AdminIcon, type AdminIconName } from "./AdminIcon";

const navigation: Array<{ href: string; label: string; icon: AdminIconName }> = [
  { href: "/admin", label: "Overview", icon: "dashboard" },
  { href: "/admin/pages", label: "Pages", icon: "page" },
  { href: "/admin/media", label: "Media", icon: "image" },
];

function getPageTitle(pathname: string): string {
  if (pathname === "/admin") return "Overview";
  if (pathname === "/admin/pages/new") return "Create page";
  if (pathname.startsWith("/admin/pages")) return "Pages";
  if (pathname.startsWith("/admin/media")) return "Media library";
  return "Admin";
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [pathname]);

  if (pathname.startsWith("/admin/editor")) {
    return <>{children}</>;
  }

  return (
    <div className="admin-shell">
      <button
        className={`admin-sidebar-scrim${menuOpen ? " is-open" : ""}`}
        onClick={() => setMenuOpen(false)}
        aria-label="Close navigation"
        type="button"
      />
      <aside className={`admin-sidebar${menuOpen ? " is-open" : ""}`}>
        <div className="admin-brand-row">
          <Link className="admin-brand" href="/admin">
            <span className="admin-brand-mark"><span /></span>
            <span>
              <strong>Canvas</strong>
              <small>Page manager</small>
            </span>
          </Link>
          <button className="admin-icon-button admin-mobile-close" type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu">
            <AdminIcon name="x" />
          </button>
        </div>

        <div className="admin-workspace">
          <span className="admin-workspace-avatar">RP</span>
          <span>
            <strong>React Builder</strong>
            <small>Example workspace</small>
          </span>
          <span className="admin-workspace-chevron">⌄</span>
        </div>

        <nav className="admin-nav" aria-label="Admin navigation">
          <span className="admin-nav-label">Workspace</span>
          {navigation.map((item) => {
            const active = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={active ? "is-active" : undefined}>
                <AdminIcon name={item.icon} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-demo-note">
            <span className="admin-demo-note-icon"><AdminIcon name="sparkles" /></span>
            <div>
              <strong>Example project</strong>
              <p>Connect your auth and database before production.</p>
            </div>
          </div>
          <Link href="/" target="_blank" className="admin-view-site">
            <AdminIcon name="external" />
            View live site
          </Link>
        </div>
      </aside>

      <div className="admin-main-column">
        <header className="admin-topbar">
          <div className="admin-topbar-start">
            <button className="admin-icon-button admin-menu-button" type="button" onClick={() => setMenuOpen(true)} aria-label="Open menu">
              <AdminIcon name="menu" />
            </button>
            <div>
              <span className="admin-topbar-eyebrow">Admin</span>
              <strong className="admin-topbar-title">{getPageTitle(pathname)}</strong>
            </div>
          </div>
          <div className="admin-topbar-actions">
            <span className="admin-live-indicator"><i /> Live</span>
            <Link href="/" target="_blank" className="admin-topbar-link">
              Open site <AdminIcon name="external" />
            </Link>
            <span className="admin-user-avatar" title="Demo administrator">AD</span>
          </div>
        </header>
        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}

