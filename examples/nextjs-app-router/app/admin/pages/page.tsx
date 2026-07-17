import Link from "next/link";
import { AdminIcon } from "@/components/admin/AdminIcon";
import { listPages } from "@/lib/storage";
import { PagesManager } from "./PagesManager";

export const dynamic = "force-dynamic";

export default async function PagesPage() {
  const pages = await listPages();

  return (
    <main className="admin-page">
      <header className="admin-page-header admin-page-header-compact">
        <div>
          <span className="admin-kicker">Content</span>
          <h1>Pages</h1>
          <p>Manage every page and open the visual editor.</p>
        </div>
        <Link href="/admin/pages/new" className="admin-button admin-button-primary">
          <AdminIcon name="plus" />
          New page
        </Link>
      </header>
      <PagesManager pages={pages} />
    </main>
  );
}

