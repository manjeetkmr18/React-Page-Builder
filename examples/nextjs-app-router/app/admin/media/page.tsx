import { listMediaAssets } from "@/lib/media";
import { MediaManager } from "./MediaManager";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  const assets = await listMediaAssets();

  return (
    <main className="admin-page">
      <header className="admin-page-header admin-page-header-compact">
        <div>
          <span className="admin-kicker">Assets</span>
          <h1>Media library</h1>
          <p>Upload images once, then use their URLs in any page.</p>
        </div>
      </header>
      <MediaManager initialAssets={assets} />
    </main>
  );
}

