# Rendering & Next.js Patterns

```tsx
import { PageRenderer } from "@manjeetkmr18/react-page-builder";
```

`<PageRenderer document={doc} />` walks the document tree, looks up each block `type` in the registry, and calls the block's `render` function. It is pure: no state, no effects, no browser APIs.

## Next.js App Router dynamic pages

```tsx
// app/[slug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageRenderer } from "@manjeetkmr18/react-page-builder";
import { listPages, loadPageRecord } from "@/lib/storage";
import "@/lib/blocks";

export const dynamicParams = true;
export const revalidate = 0;

type PageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await listPages()).map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await loadPageRecord(slug);
  if (!page) return {};
  return {
    title: page.title,
    description: page.description,
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const page = await loadPageRecord(slug);
  if (!page) notFound();
  return <PageRenderer document={page.document} />;
}
```

Because rendering happens on the server, public pages ship no editor JavaScript. The editor can live behind `/admin`, while the public route renders stored JSON.

`examples/nextjs-app-router` uses this pattern with JSON files, but the same route works if `loadPageRecord()` reads from Prisma, MongoDB, a CMS, or another API.

## Storage shape for metadata

The renderer needs only `PageDocument`, but your app usually wants metadata too:

```ts
type PageRecord = {
  slug: string;
  title?: string;
  description?: string;
  document: PageDocument;
  updatedAt?: string;
};
```

Store this however you like. In a database, `document` is typically a JSON/JSONB column.

## Caching choices

Documents are plain data, so all Next.js caching strategies apply:

```tsx
export const revalidate = 300; // ISR: re-render at most every 5 minutes

export async function generateStaticParams() {
  return (await listPages()).map((page) => ({ slug: page.slug }));
}
```

For admin-heavy demos where newly created JSON files should appear immediately, use `revalidate = 0`. For production publishing workflows, render only the published document and call `revalidatePath("/" + slug)` when a draft is published.

## Client blocks

Core blocks are server-safe. If a custom block needs hooks or browser APIs, make that block's inner component a client component and keep the rest of the page server-rendered.

```tsx
// blocks/video.tsx
import { VideoPlayer } from "./VideoPlayer"; // "use client"

registerBlock({
  type: "app/video",
  label: "Video",
  fields: [{ name: "src", label: "Video URL", type: "text" }],
  render: ({ node, isEditing }) =>
    isEditing ? <div>Video placeholder</div> : <VideoPlayer src={node.props.src} />,
});
```

## Pages Router

```tsx
// pages/[slug].tsx
import { PageRenderer } from "@manjeetkmr18/react-page-builder";
import "@/lib/blocks";

export async function getStaticProps({ params }) {
  return { props: { doc: await loadPage(params.slug) }, revalidate: 300 };
}

export default function Page({ doc }) {
  return <PageRenderer document={doc} />;
}
```

## Plain React

```tsx
const [doc, setDoc] = useState(null);

useEffect(() => {
  fetch(`/api/pages/${slug}`).then((r) => r.json()).then(setDoc);
}, [slug]);

return doc ? <PageRenderer document={doc} /> : null;
```

## Unknown block types

If a document references a type that is not registered, the renderer skips it by default. Override with `renderUnknown`:

```tsx
<PageRenderer
  document={doc}
  renderUnknown={(node) => (
    <div style={{ padding: 12, background: "#fef2f2" }}>
      Missing block: {node.type}
    </div>
  )}
/>
```

## Rendering outside React

Need static HTML for emails, PDFs, or webhooks? Use `react-dom/server`:

```ts
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { PageRenderer } from "@manjeetkmr18/react-page-builder";
import "./blocks";

const html = renderToStaticMarkup(createElement(PageRenderer, { document: doc }));
```
