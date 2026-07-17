"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { PageListItem } from "@manjeetkmr18/react-page-builder";
import { AdminIcon } from "@/components/admin/AdminIcon";

function formatDate(value?: string): string {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function PagesManager({ pages }: { pages: PageListItem[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);
  const [error, setError] = useState("");

  const filteredPages = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return pages;
    return pages.filter((page) =>
      [page.title, page.slug, page.description].some((value) => value?.toLowerCase().includes(normalized))
    );
  }, [pages, query]);

  async function deletePage(page: PageListItem) {
    if (!window.confirm(`Delete “${page.title ?? page.slug}”? This cannot be undone.`)) return;
    setDeletingSlug(page.slug);
    setError("");
    try {
      const response = await fetch(`/api/pages/${encodeURIComponent(page.slug)}`, { method: "DELETE" });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not delete the page.");
      }
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not delete the page.");
    } finally {
      setDeletingSlug(null);
    }
  }

  return (
    <section className="admin-panel admin-table-panel">
      <div className="admin-table-toolbar">
        <label className="admin-search-field">
          <AdminIcon name="search" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search pages..."
            aria-label="Search pages"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} aria-label="Clear search">
              <AdminIcon name="x" />
            </button>
          )}
        </label>
        <span className="admin-result-count">{filteredPages.length} {filteredPages.length === 1 ? "page" : "pages"}</span>
      </div>

      {error && <div className="admin-alert is-error">{error}</div>}

      {pages.length === 0 ? (
        <div className="admin-empty-state">
          <span className="admin-empty-icon"><AdminIcon name="page" /></span>
          <h2>Create your first page</h2>
          <p>Choose a starting layout, then use the drag-and-drop editor to make it yours.</p>
          <Link href="/admin/pages/new" className="admin-button admin-button-primary"><AdminIcon name="plus" /> New page</Link>
        </div>
      ) : filteredPages.length === 0 ? (
        <div className="admin-empty-state is-small">
          <span className="admin-empty-icon"><AdminIcon name="search" /></span>
          <h2>No matching pages</h2>
          <p>Try another title or URL.</p>
          <button type="button" className="admin-button admin-button-secondary" onClick={() => setQuery("")}>Clear search</button>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Page</th>
                <th>Status</th>
                <th>Last updated</th>
                <th><span className="admin-visually-hidden">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {filteredPages.map((page) => (
                <tr key={page.slug}>
                  <td>
                    <div className="admin-page-cell">
                      <span className="admin-page-file-icon"><AdminIcon name="page" /></span>
                      <div>
                        <Link href={`/admin/editor?slug=${page.slug}`}>{page.title ?? page.slug}</Link>
                        <span>/{page.slug}</span>
                      </div>
                    </div>
                  </td>
                  <td><span className="admin-status-badge"><i /> Published</span></td>
                  <td><time dateTime={page.updatedAt}>{formatDate(page.updatedAt)}</time></td>
                  <td>
                    <div className="admin-row-actions">
                      <Link href={`/admin/editor?slug=${page.slug}`} className="admin-icon-button" title="Edit page">
                        <AdminIcon name="edit" />
                      </Link>
                      <Link href={page.url ?? `/${page.slug}`} target="_blank" className="admin-icon-button" title="View page">
                        <AdminIcon name="eye" />
                      </Link>
                      <button
                        type="button"
                        className="admin-icon-button is-danger"
                        title="Delete page"
                        disabled={deletingSlug === page.slug}
                        onClick={() => deletePage(page)}
                      >
                        <AdminIcon name="trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

