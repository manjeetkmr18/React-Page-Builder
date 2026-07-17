import Link from "next/link";
import { AdminIcon } from "@/components/admin/AdminIcon";
import { CreatePageForm } from "./CreatePageForm";

export default function NewPagePage() {
  return (
    <main className="admin-page admin-form-page">
      <Link href="/admin/pages" className="admin-back-link">
        <AdminIcon name="arrow-left" /> Back to pages
      </Link>
      <header className="admin-page-header admin-page-header-compact">
        <div>
          <span className="admin-kicker">New content</span>
          <h1>Create a page</h1>
          <p>Give it a name and choose the best place to start.</p>
        </div>
      </header>
      <CreatePageForm />
    </main>
  );
}

