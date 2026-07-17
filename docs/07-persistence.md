# Persistence Recipes

The library is storage-agnostic. A page is a JSON `PageDocument`; your app chooses where that JSON lives. You can use simple callbacks or the first-class adapter contracts:

- `PageStorageAdapter` for loading/saving/listing/publishing pages.
- `MediaStorageAdapter` for image upload/selection from image fields.

## PageStorageAdapter

```ts
import type { PageStorageAdapter } from "@manjeetkmr18/react-page-builder";

export const pageStorage: PageStorageAdapter = {
  async load(slug) {
    // return PageDocument | null
  },
  async save(slug, document) {
    // persist PageDocument anywhere
    return { slug, url: `/${slug}`, updatedAt: new Date().toISOString() };
  },
  async list() {
    // optional: return [{ slug, title, description, updatedAt }]
    return [];
  },
  async publish(slug) {
    // optional: copy draft to published
  },
};
```

Use it in the editor:

```tsx
<PageBuilder
  slug="home"
  storageAdapter={pageStorage}
  autoSave={{ delayMs: 1500 }}
/>
```

## File-based JSON storage

This is what `examples/nextjs-app-router` uses by default. It is good for demos, local development, templates, and Git-backed content workflows.

```ts
import { promises as fs } from "fs";
import path from "path";
import type { PageStorageAdapter } from "@manjeetkmr18/react-page-builder";
import { isPageDocument } from "@manjeetkmr18/react-page-builder";

const DIR = path.join(process.cwd(), "content", "pages");
const safeSlug = (slug: string) => /^[a-z0-9-]{1,64}$/.test(slug);

export const jsonFilePageStorage: PageStorageAdapter = {
  async load(slug) {
    if (!safeSlug(slug)) return null;
    try {
      const raw = await fs.readFile(path.join(DIR, `${slug}.json`), "utf8");
      const parsed = JSON.parse(raw);
      return isPageDocument(parsed) ? parsed : null;
    } catch {
      return null;
    }
  },
  async save(slug, document) {
    if (!safeSlug(slug)) throw new Error("Invalid slug");
    if (!isPageDocument(document)) throw new Error("Invalid PageDocument");
    await fs.mkdir(DIR, { recursive: true });
    await fs.writeFile(path.join(DIR, `${slug}.json`), JSON.stringify(document, null, 2));
  },
};
```

## Route handler using the adapter

```ts
// app/api/pages/[slug]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { isPageDocument } from "@manjeetkmr18/react-page-builder";
import { jsonFilePageStorage, isSafeSlug } from "@/lib/storage";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { slug } = await params;
  if (!isSafeSlug(slug)) return NextResponse.json({ error: "bad slug" }, { status: 400 });
  const doc = await jsonFilePageStorage.load?.(slug);
  if (!doc) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(doc);
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { slug } = await params;
  if (!isSafeSlug(slug)) return NextResponse.json({ error: "bad slug" }, { status: 400 });
  const doc = await req.json().catch(() => null);
  if (!isPageDocument(doc)) {
    return NextResponse.json({ error: "invalid document" }, { status: 400 });
  }

  // Production: check auth/session/tenant here.
  await jsonFilePageStorage.save(slug, doc);
  return NextResponse.json({ ok: true });
}
```

## Postgres with Prisma

```prisma
model Page {
  slug        String   @id
  title       String?
  description String?
  document    Json
  updatedAt   DateTime @updatedAt
}
```

```ts
import type { PageStorageAdapter } from "@manjeetkmr18/react-page-builder";

export const prismaPageStorage: PageStorageAdapter = {
  async load(slug) {
    const page = await prisma.page.findUnique({ where: { slug } });
    return page?.document as PageDocument | null;
  },
  async save(slug, document) {
    await prisma.page.upsert({
      where: { slug },
      update: { document },
      create: { slug, document },
    });
  },
  async list() {
    return prisma.page.findMany({
      select: { slug: true, title: true, description: true, updatedAt: true },
      orderBy: { slug: "asc" },
    });
  },
};
```

## Drafts vs. published

Keep two documents per page and copy on publish:

```prisma
model Page {
  slug          String @id
  draftDocument Json
  liveDocument  Json?
  publishedAt   DateTime?
}
```

The editor loads/saves `draftDocument`; public routes render only `liveDocument`. A publish action copies draft to live and calls `revalidatePath("/" + slug)`.

## Revisions

Documents are usually small. Store each save if you want history:

```sql
CREATE TABLE page_revisions (
  id bigserial PRIMARY KEY,
  slug text NOT NULL,
  document jsonb NOT NULL,
  saved_at timestamptz DEFAULT now()
);
```

Restoring means loading an old revision back into the editor.

## MediaStorageAdapter

Image fields are URL inputs by default. Add a media adapter to upload files.

```ts
import type { MediaStorageAdapter } from "@manjeetkmr18/react-page-builder";

export const mediaStorage: MediaStorageAdapter = {
  async upload(file, context) {
    const form = new FormData();
    form.append("file", file);
    form.append("slug", context?.slug ?? "");
    const res = await fetch("/api/media", { method: "POST", body: form });
    if (!res.ok) throw new Error("Upload failed");
    return res.json(); // { url, width, height, mimeType }
  },
};
```

The upload implementation can write to:

- local `public/uploads` for a demo;
- S3/R2/GCS with a signed URL flow;
- Cloudinary or UploadThing;
- your own media library service.

## Local media route example

```ts
// app/api/media/route.ts
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "unsupported file" }, { status: 400 });
  }

  const ext = file.type === "image/png" ? ".png" : ".jpg";
  const name = `${Date.now()}-${randomUUID()}${ext}`;
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ url: `/uploads/${name}` });
}
```

Use a stricter allowlist and size limit in production.

## Security checklist

1. Protect the editor and write/upload endpoints. Never expose admin writes publicly.
2. Validate on write with `isPageDocument()` or your own Zod schema.
3. Enforce size limits for JSON documents and uploads.
4. Reject unknown block types if your app uses a closed block set.
5. Sanitize raw HTML. `core/embed` uses `dangerouslySetInnerHTML`; only register it for trusted editors or sanitize server-side.
6. Treat `href`, `src`, and embed props as untrusted in multi-tenant apps. Filter `javascript:` and unsafe protocols.
7. Check tenant/user ownership inside adapters and API routes. The `slug` alone is not authorization.
