# @manjeetkmr18/react-page-builder

An extensible drag-and-drop page builder for React and Next.js. Developers register React blocks, editors compose pages visually, and the application stores the result as portable JSON.

- **Headless:** you own the database, API, authentication, publishing workflow, and media storage.
- **Next.js friendly:** the editor is a client component; the public renderer is safe in React Server Components.
- **Extensible:** create application-specific blocks with typed inspector fields.
- **Portable:** page documents are plain JSON that can live in Postgres, MongoDB, a CMS, files, or edge KV.
- **Lightweight runtime:** only `react` and `react-dom` are peer dependencies.

```text
PageBuilder -> PageDocument JSON -> your storage -> PageRenderer
```

## Contents

- [Installation](#installation)
- [Five-minute start](#five-minute-start)
- [Next.js App Router setup](#nextjs-app-router-setup)
- [Persistence and autosave](#persistence-and-autosave)
- [Media uploads](#media-uploads)
- [Custom blocks](#custom-blocks)
- [Built-in blocks](#built-in-blocks)
- [API reference](#api-reference)
- [Production checklist](#production-checklist)
- [Troubleshooting](#troubleshooting)

## Installation

```bash
npm install @manjeetkmr18/react-page-builder
```

```bash
pnpm add @manjeetkmr18/react-page-builder
```

```bash
yarn add @manjeetkmr18/react-page-builder
```

The package requires `react >= 18` and `react-dom >= 18`.

There are two entry points:

| Import | Where to use it | Includes |
| --- | --- | --- |
| `@manjeetkmr18/react-page-builder` | Server or client | Renderer, registry, core blocks, document utilities, adapters, and types |
| `@manjeetkmr18/react-page-builder/editor` | Client only | `PageBuilder` and `Field` |

## Five-minute start

### 1. Register the built-in blocks

Create one registration module. Import this module anywhere that renders the editor or a published page.

```ts
// lib/page-builder-blocks.ts
import { registerCoreBlocks } from "@manjeetkmr18/react-page-builder";

registerCoreBlocks();
```

### 2. Add an in-memory editor

```tsx
"use client";

import { useState } from "react";
import {
  createEmptyDocument,
  type PageDocument,
} from "@manjeetkmr18/react-page-builder";
import { PageBuilder } from "@manjeetkmr18/react-page-builder/editor";
import "@/lib/page-builder-blocks";

export default function EditorPage() {
  const [document, setDocument] = useState<PageDocument>(() =>
    createEmptyDocument()
  );

  return (
    <PageBuilder
      value={document}
      onChange={setDocument}
      height="100vh"
    />
  );
}
```

This works without a backend. Use **Import JSON** and **Export JSON** in the editor toolbar while prototyping.

### 3. Render a saved document

```tsx
import {
  PageRenderer,
  type PageDocument,
} from "@manjeetkmr18/react-page-builder";
import "@/lib/page-builder-blocks";

export function PublishedPage({ document }: { document: PageDocument }) {
  return <PageRenderer document={document} />;
}
```

`PageRenderer` has no editor state, effects, or browser API usage. It can render in a React Server Component, a client component, static generation, or `renderToStaticMarkup()`.

## Next.js App Router setup

Keep the editor and public rendering paths separate:

```text
app/admin/editor/page.tsx  -> client component -> PageBuilder
app/[slug]/page.tsx        -> server component -> PageRenderer
app/api/pages/[slug]       -> validates and stores PageDocument JSON
```

### Client-side storage adapter

Define adapters at module scope so their object identity stays stable between React renders.

```ts
// lib/page-builder-storage.ts
import type { PageStorageAdapter } from "@manjeetkmr18/react-page-builder";

export const pageStorage: PageStorageAdapter = {
  async load(slug) {
    const response = await fetch(`/api/pages/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });

    if (response.status === 404) return null;
    if (!response.ok) throw new Error("Could not load the page");
    return response.json();
  },

  async save(slug, document) {
    const response = await fetch(`/api/pages/${encodeURIComponent(slug)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(document),
    });

    if (!response.ok) throw new Error("Could not save the page");
    return response.json();
  },
};
```

### Admin editor route

```tsx
// app/admin/editor/page.tsx
"use client";

import { PageBuilder } from "@manjeetkmr18/react-page-builder/editor";
import { pageStorage } from "@/lib/page-builder-storage";
import "@/lib/page-builder-blocks";

export default function AdminEditorPage() {
  return (
    <PageBuilder
      slug="home"
      storageAdapter={pageStorage}
      autoSave={{ delayMs: 1500 }}
      height="100vh"
    />
  );
}
```

When `storageAdapter.load()` returns `null`, the editor starts with an empty document. The Save button appears when you provide `onSave`, or when both `storageAdapter` and `slug` are present.

### Public server-rendered route

```tsx
// app/[slug]/page.tsx
import { notFound } from "next/navigation";
import { PageRenderer } from "@manjeetkmr18/react-page-builder";
import { loadPageFromDatabase } from "@/lib/server/pages";
import "@/lib/page-builder-blocks";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const document = await loadPageFromDatabase(slug);

  if (!document) notFound();
  return <PageRenderer document={document} />;
}
```

The repository includes a complete example with an admin dashboard, page management, media library, API routes, local JSON storage, and dynamic public pages:

```bash
cd examples/nextjs-app-router
npm install
npm run dev
```

Open these routes after starting it:

| Route | Purpose |
| --- | --- |
| `/admin` | Admin overview |
| `/admin/pages` | Search, create, edit, preview, and delete pages |
| `/admin/media` | Upload and manage images |
| `/admin/editor?slug=home` | Visual editor with autosave |
| `/home` | Server-rendered public page |

See [the complete Next.js example](./examples/nextjs-app-router) for the API and storage implementations.

## Persistence and autosave

`PageStorageAdapter` keeps backend decisions outside the editor:

| Method | Required | Purpose |
| --- | --- | --- |
| `load(slug, context?)` | No | Loads a document when the editor opens; return `null` for a new page |
| `save(slug, document, context?)` | Yes | Persists the current document and may return URL/update metadata |
| `list(context?)` | No | Supplies page metadata to a custom page-management interface |
| `delete(slug, context?)` | No | Deletes a stored page |
| `publish(slug, context?)` | No | Promotes a draft or triggers an application publishing workflow |

The client adapter can call REST or GraphQL. The server behind that endpoint can use Prisma, Drizzle, MongoDB, a CMS, filesystem storage, or KV.

Autosave is disabled by default:

```tsx
<PageBuilder
  slug="home"
  storageAdapter={pageStorage}
  autoSave={{ delayMs: 1500 }}
  onError={(error, phase) => {
    console.error(`Page ${phase} failed`, error);
  }}
/>
```

`autoSave={true}` uses a 1200 ms delay. You may also use `onSave` without a storage adapter.

## Media uploads

Image fields accept URLs without configuration. Add a `MediaStorageAdapter` to show upload and media-selection controls.

```ts
import type { MediaStorageAdapter } from "@manjeetkmr18/react-page-builder";

export const mediaStorage: MediaStorageAdapter = {
  async upload(file, context) {
    const form = new FormData();
    form.append("file", file);
    form.append("slug", context?.slug ?? "");

    const response = await fetch("/api/media", {
      method: "POST",
      body: form,
    });

    if (!response.ok) throw new Error("Upload failed");
    return response.json(); // A URL string or { url, id?, alt?, width?, height? }
  },
};
```

```tsx
<PageBuilder
  slug="home"
  storageAdapter={pageStorage}
  mediaAdapter={mediaStorage}
/>
```

Use the adapter with S3, Cloudinary, UploadThing, object storage, or your own authenticated upload endpoint.

## Custom blocks

A block is a React render function plus metadata for the editor palette and inspector.

```tsx
// lib/page-builder-blocks.tsx
import {
  registerBlock,
  registerCoreBlocks,
} from "@manjeetkmr18/react-page-builder";

registerCoreBlocks();

registerBlock({
  type: "marketing/testimonial",
  label: "Testimonial",
  category: "Marketing",
  icon: "Quote",
  defaultProps: {
    quote: "This page was assembled visually.",
    author: "A happy customer",
    accent: "#2563eb",
  },
  fields: [
    { name: "quote", label: "Quote", type: "textarea" },
    { name: "author", label: "Author", type: "text" },
    { name: "accent", label: "Accent color", type: "color" },
  ],
  render: ({ node }) => (
    <figure
      style={{
        borderLeft: `4px solid ${node.props.accent}`,
        margin: 0,
        paddingLeft: 20,
      }}
    >
      <blockquote>{node.props.quote}</blockquote>
      <figcaption>- {node.props.author}</figcaption>
    </figure>
  ),
});
```

Supported inspector field types are `text`, `textarea`, `number`, `range`, `color`, `select`, `boolean`, and `image`.

To create a layout block that accepts nested content, set `isContainer: true` and render the supplied `children`:

```tsx
registerBlock({
  type: "layout/card",
  label: "Card",
  category: "Layout",
  isContainer: true,
  defaultProps: { background: "#ffffff", padding: 24 },
  fields: [
    { name: "background", label: "Background", type: "color" },
    { name: "padding", label: "Padding", type: "number", min: 0 },
  ],
  render: ({ node, children }) => (
    <section
      style={{
        background: node.props.background,
        padding: node.props.padding,
      }}
    >
      {children}
    </section>
  ),
});
```

Use a unique namespace such as `your-app/hero` for custom block types. Render functions must be SSR-safe if the block will appear on server-rendered pages.

## Built-in blocks

Calling `registerCoreBlocks()` adds these starter blocks:

| Category | Blocks |
| --- | --- |
| Layout | `core/section`, `core/columns`, `core/spacer`, `core/divider` |
| Basic | `core/heading`, `core/text`, `core/button` |
| Media | `core/image`, `core/embed` |

`core/columns` supports two, three, or four columns, configurable gaps, and mobile stacking. For complete props and examples, see the [core blocks reference](./docs/02-core-blocks.md).

Register only a subset when an application should expose fewer blocks:

```ts
import {
  coreBlocks,
  registerBlocks,
} from "@manjeetkmr18/react-page-builder";

registerBlocks(
  coreBlocks.filter((block) => block.type !== "core/embed")
);
```

## Document format

The editor reads and writes a JSON-serializable `PageDocument`:

```json
{
  "version": 1,
  "root": [
    {
      "id": "section-1",
      "type": "core/section",
      "props": {
        "background": "#ffffff",
        "paddingY": 64
      },
      "children": [
        {
          "id": "heading-1",
          "type": "core/heading",
          "props": {
            "text": "Hello world",
            "level": "h1"
          }
        }
      ]
    }
  ]
}
```

Validate data from APIs, imports, databases, or a CMS before rendering or saving it:

```ts
import {
  assertPageDocument,
  isPageDocument,
} from "@manjeetkmr18/react-page-builder";

if (!isPageDocument(value)) {
  throw new Error("Invalid page document");
}

assertPageDocument(value); // Narrows `value` to PageDocument or throws.
```

## API reference

### Main entry point

| Export | Purpose |
| --- | --- |
| `PageRenderer`, `renderTree` | Render complete documents or individual node trees |
| `registerBlock`, `registerBlocks`, `unregisterBlock` | Manage block definitions |
| `getBlock`, `getAllBlocks`, `getBlocksByCategory` | Read the active registry |
| `registerCoreBlocks`, `coreBlocks` | Use the built-in block collection |
| `createEmptyDocument`, `createNode`, `generateId` | Create documents and nodes |
| `findNode`, `insertNode`, `moveNode`, `removeNode`, `updateNodeProps`, `cloneNode` | Immutable tree operations |
| `isPageDocument`, `assertPageDocument`, `isPageNode` | Runtime validation |
| `PageDocument`, `PageNode`, `BlockDefinition`, `FieldDefinition` | Core TypeScript types |
| `PageStorageAdapter`, `MediaStorageAdapter` | Backend and media integration contracts |

### Editor entry point

| Export | Purpose |
| --- | --- |
| `PageBuilder` | Complete visual editor shell |
| `Field` | Inspector field renderer for custom editor interfaces |

### `PageBuilder` props

| Prop | Default | Description |
| --- | --- | --- |
| `value` | - | Controlled/current `PageDocument` |
| `defaultValue` | Empty document | Initial uncontrolled document |
| `slug` | - | Page identifier passed to storage and media adapters |
| `storageAdapter` | - | Optional load/save/list/delete/publish integration |
| `storageContext` | - | Locale, user, draft, or other adapter metadata |
| `mediaAdapter` | - | Upload/select integration for image fields |
| `autoSave` | `false` | `boolean` or `{ delayMs?: number }` |
| `onChange` | - | Runs after every document change |
| `onSave` | - | Custom save callback; enables the Save button |
| `onLoad` | - | Runs after adapter loading succeeds |
| `onError` | Console error | Handles `load` or `save` errors |
| `height` | `"100vh"` | Editor shell height |

## Production checklist

- Protect the editor and all write/upload endpoints with authentication and authorization.
- Validate incoming JSON with `isPageDocument()` or `assertPageDocument()`.
- Apply request-size limits and rate limits to save and upload routes.
- Validate media MIME type, extension, file size, and storage destination server-side.
- Treat link URLs, image URLs, and block props as untrusted input in multi-tenant applications.
- `core/embed` renders raw HTML with `dangerouslySetInnerHTML`. Register it only for trusted editors, or sanitize the HTML before storage/rendering.
- Keep draft and published documents separate when editors need approval or rollback workflows.
- Revalidate cached public routes after publishing in Next.js.
- Store page revisions if destructive edits must be recoverable.

## Troubleshooting

### The block palette is empty

Call `registerCoreBlocks()` or `registerBlock()` before rendering the editor. In Next.js, import the registration module from both the client editor route and the server-rendered public route.

### Next.js says the editor requires a Client Component

Import `PageBuilder` from `@manjeetkmr18/react-page-builder/editor` only inside a file beginning with `"use client"`. Import `PageRenderer` from the main entry point on public server routes.

### The Save button does not appear

Provide `onSave`, or provide both `storageAdapter` and `slug`.

### The storage adapter keeps loading again

Define the adapter outside the React component or memoize it with `useMemo()`. Creating a new adapter object on every render changes the effect dependency.

### A published page renders nothing

Validate the stored JSON and confirm every `node.type` has been registered in the rendering environment. Unknown blocks render nothing unless you provide `PageRenderer` with `renderUnknown`.

### Image upload controls are missing

The selected block must have an inspector field with `type: "image"`, and `PageBuilder` must receive a `mediaAdapter`.

## Examples and guides

- [Vite playground](./examples/vite-demo) - in-memory editing and JSON import/export.
- [Next.js App Router application](./examples/nextjs-app-router) - admin dashboard, APIs, storage, media, autosave, and SSR pages.
- [Example landing-page document](./examples/demo-page.json) - ready for editor import.

Full guides:

1. [Getting started](./docs/01-getting-started.md)
2. [Core blocks reference](./docs/02-core-blocks.md)
3. [Building custom blocks](./docs/03-custom-blocks.md)
4. [Editor API](./docs/04-editor.md)
5. [Rendering and Next.js patterns](./docs/05-rendering.md)
6. [Document schema](./docs/06-document-schema.md)
7. [Persistence recipes and security](./docs/07-persistence.md)
8. [Publishing block packs](./docs/08-block-packs.md)

## Development and release verification

```bash
npm ci
npm run check
npm publish --dry-run --access public
```

`npm run check` typechecks the source, creates fresh ESM/CommonJS bundles and declarations, and smoke-tests both package entry points, server-side rendering, and the Next.js client boundary.

## License

MIT
