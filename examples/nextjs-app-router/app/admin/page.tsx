import Link from "next/link";
import { AdminIcon } from "@/components/admin/AdminIcon";
import { listMediaAssets } from "@/lib/media";
import { listPages } from "@/lib/storage";

export const dynamic = "force-dynamic";

function formatDate(value?: string): string {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

export default async function AdminDashboard() {
  const [pages, media] = await Promise.all([listPages(), listMediaAssets()]);
  const recentPages = [...pages]
    .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""))
    .slice(0, 5);
  const latestUpdate = recentPages[0]?.updatedAt;

  return (
    <main className="admin-page">
      <header className="admin-page-header">
        <div>
          <span className="admin-kicker">Good to see you</span>
          <h1>Manage your website</h1>
          <p>Create, edit, and publish pages from one clear workspace.</p>
        </div>
        <Link href="/admin/pages/new" className="admin-button admin-button-primary">
          <AdminIcon name="plus" />
          Create page
        </Link>
      </header>

      <section className="admin-stats-grid" aria-label="Website summary">
        <article className="admin-stat-card">
          <span className="admin-stat-icon is-purple"><AdminIcon name="page" /></span>
          <div className="admin-stat-copy">
            <span>Total pages</span>
            <strong>{pages.length}</strong>
            <small><i className="is-green" /> All pages are live</small>
          </div>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-icon is-blue"><AdminIcon name="eye" /></span>
          <div className="admin-stat-copy">
            <span>Published</span>
            <strong>{pages.length}</strong>
            <small>Server-rendered routes</small>
          </div>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-icon is-amber"><AdminIcon name="image" /></span>
          <div className="admin-stat-copy">
            <span>Media files</span>
            <strong>{media.length}</strong>
            <small>Stored in public/uploads</small>
          </div>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-icon is-green"><AdminIcon name="check" /></span>
          <div className="admin-stat-copy">
            <span>Last updated</span>
            <strong className="admin-stat-date">{latestUpdate ? formatDate(latestUpdate) : "No edits yet"}</strong>
            <small>Autosave is enabled</small>
          </div>
        </article>
      </section>

      <div className="admin-dashboard-grid">
        <section className="admin-panel admin-recent-panel">
          <div className="admin-panel-header">
            <div>
              <h2>Recently updated</h2>
              <p>Your latest page changes.</p>
            </div>
            <Link href="/admin/pages" className="admin-text-link">
              View all <AdminIcon name="arrow-right" />
            </Link>
          </div>

          {recentPages.length > 0 ? (
            <div className="admin-recent-list">
              {recentPages.map((page) => (
                <article className="admin-recent-row" key={page.slug}>
                  <span className="admin-page-file-icon"><AdminIcon name="page" /></span>
                  <div className="admin-recent-main">
                    <strong>{page.title ?? page.slug}</strong>
                    <span>/{page.slug}</span>
                  </div>
                  <span className="admin-status-badge"><i /> Published</span>
                  <time dateTime={page.updatedAt}>{formatDate(page.updatedAt)}</time>
                  <div className="admin-row-actions">
                    <Link href={`/admin/editor?slug=${page.slug}`} className="admin-icon-button" title="Edit page">
                      <AdminIcon name="edit" />
                    </Link>
                    <Link href={page.url ?? `/${page.slug}`} target="_blank" className="admin-icon-button" title="View page">
                      <AdminIcon name="external" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="admin-empty-inline">
              <span><AdminIcon name="page" /></span>
              <div><strong>No pages yet</strong><p>Create your first page to get started.</p></div>
              <Link href="/admin/pages/new" className="admin-button admin-button-secondary">Create page</Link>
            </div>
          )}
        </section>

        <aside className="admin-panel admin-quick-panel">
          <div className="admin-panel-header">
            <div>
              <h2>Quick start</h2>
              <p>Common admin tasks.</p>
            </div>
          </div>
          <div className="admin-quick-links">
            <Link href="/admin/pages/new">
              <span className="is-purple"><AdminIcon name="plus" /></span>
              <div><strong>Create a page</strong><small>Start blank or use a layout</small></div>
              <AdminIcon name="arrow-right" />
            </Link>
            <Link href="/admin/media">
              <span className="is-blue"><AdminIcon name="upload" /></span>
              <div><strong>Upload media</strong><small>Add reusable page images</small></div>
              <AdminIcon name="arrow-right" />
            </Link>
            <Link href="/" target="_blank">
              <span className="is-green"><AdminIcon name="eye" /></span>
              <div><strong>View live site</strong><small>Check the public experience</small></div>
              <AdminIcon name="arrow-right" />
            </Link>
          </div>
        </aside>
      </div>

      <section className="admin-system-strip">
        <div className="admin-system-icon"><AdminIcon name="database" /></div>
        <div>
          <strong>Local JSON storage is connected</strong>
          <p>This example saves pages to <code>content/pages</code>. Swap the adapter for your database without changing the editor.</p>
        </div>
        <span className="admin-healthy-badge"><i /> Healthy</span>
      </section>
    </main>
  );
}

