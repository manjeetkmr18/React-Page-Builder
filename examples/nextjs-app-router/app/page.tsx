import Link from "next/link";
import { listPages } from "@/lib/storage";

export default async function Home() {
  const pages = await listPages();

  return (
    <main style={{ maxWidth: 760, margin: "80px auto", padding: 24, lineHeight: 1.7 }}>
      <h1>react-page-builder demo</h1>
      <p>
        This Next.js App Router example stores pages as JSON files by default, but the
        editor talks to a storage adapter so you can replace files with a database,
        CMS, edge KV store, or your own API.
      </p>

      <h2>Pages</h2>
      {pages.length > 0 ? (
        <ul>
          {pages.map((page) => (
            <li key={page.slug}>
              <Link href={page.url ?? `/${page.slug}`}>{page.title ?? page.slug}</Link>
              {" - "}
              <Link href={`/admin/editor?slug=${page.slug}`}>edit</Link>
            </li>
          ))}
        </ul>
      ) : (
        <p>No pages yet. Create one from the editor.</p>
      )}

      <h2>Create or edit</h2>
      <p>
        Open <Link href="/admin/editor?slug=home">/admin/editor?slug=home</Link>, or
        change the slug in the query string to create a new page.
      </p>

      <p style={{ color: "#64748b", fontSize: 14 }}>
        Production note: protect <code>/admin</code>, <code>PUT /api/pages/[slug]</code>,
        and <code>POST /api/media</code> with your auth.
      </p>
    </main>
  );
}
