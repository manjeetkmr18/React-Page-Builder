# Next.js App Router example

Full-stack demo with:

- a responsive admin dashboard at `/admin`;
- page management with search, create, edit, preview, and delete actions;
- a media library with upload, search, URL copy, preview, and delete actions;
- visual editor at `/admin/editor?slug=home`;
- dynamic public pages at `/{slug}`;
- JSON page storage through `PageStorageAdapter`;
- local image uploads through `MediaStorageAdapter`;
- metadata and `generateStaticParams()` for App Router;
- server-rendered public pages with zero builder JavaScript.

## Run it

```bash
# 1. Build the library once from the repo root
cd ../..
npm install
npm run build

# 2. Start this example
cd examples/nextjs-app-router
npm install
npm run dev
```

Open http://localhost:3000.

Useful routes:

- `/` - lists stored JSON pages and edit links.
- `/home` - published server-rendered page.
- `/admin` - admin overview with content and storage status.
- `/admin/pages` - searchable page management table.
- `/admin/pages/new` - create a simple or prebuilt landing page.
- `/admin/media` - manage locally uploaded images.
- `/admin/editor?slug=home` - editor with 1.5s autosave.
- `/admin/editor?slug=my-page` - creates/edits a new dynamic page slug.
- `/api/pages` - lists page metadata.
- `/api/pages/[slug]` - loads, saves, and deletes JSON documents.
- `/api/media` - lists and uploads images in `public/uploads`.

## Where things live

| File | Purpose |
| --- | --- |
| `lib/storage.ts` | JSON-backed `PageStorageAdapter`; replace this with Prisma, MongoDB, CMS, etc. |
| `app/admin/page.tsx` | Admin overview and recent content dashboard |
| `app/admin/pages/*` | Page list and safe create-page workflow |
| `app/admin/media/*` | Upload and media management interface |
| `app/admin/editor/page.tsx` | Client editor that passes storage/media adapters into `<PageBuilder>` |
| `app/[slug]/page.tsx` | Dynamic App Router render route with metadata and static params |
| `app/api/pages/[slug]/route.ts` | GET/PUT API for page JSON |
| `app/api/media/route.ts` | Demo upload endpoint; replace with S3, Cloudinary, etc. |
| `lib/blocks.tsx` | Registers core blocks and a custom Testimonial block |
| `content/pages/*.json` | Pretty-printed saved page documents |

## Replacing storage

Keep the editor code the same and swap `lib/storage.ts`:

```ts
export const prismaPageStorage: PageStorageAdapter = {
  load: async (slug) => {
    const page = await prisma.page.findUnique({ where: { slug } });
    return page?.document as PageDocument | null;
  },
  save: async (slug, document) => {
    await prisma.page.upsert({
      where: { slug },
      update: { document },
      create: { slug, document },
    });
  },
};
```

## Production notes

- Protect `/admin`, `PUT /api/pages/[slug]`, and `POST /api/media` with auth.
- Validate documents with `isPageDocument()` before saving.
- Add upload size/type limits for your own media route.
- Use draft/live documents if editors need a publish step.
- Call `revalidatePath("/" + slug)` after publishing if you cache public pages.
