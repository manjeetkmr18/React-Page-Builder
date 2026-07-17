# Getting Started

`@manjeetkmr18/react-page-builder` is a headless drag-and-drop page builder for React and Next.js. It has four moving parts:

1. The block registry - register the blocks your app can render.
2. The editor - `<PageBuilder>` is a client component where users visually build pages.
3. The renderer - `<PageRenderer>` turns a saved JSON document into React output.
4. Optional adapters - `PageStorageAdapter` and `MediaStorageAdapter` connect the editor to your database, CMS, filesystem, cloud storage, or API.

The output of the editor is a plain JSON `PageDocument`. You own storage.

## Installation

```bash
npm install @manjeetkmr18/react-page-builder
pnpm add @manjeetkmr18/react-page-builder
yarn add @manjeetkmr18/react-page-builder
```

Peer dependencies: `react >= 18` and `react-dom >= 18`. There are no runtime dependencies.

## Entry points

| Import path | Environment | Contains |
| --- | --- | --- |
| `@manjeetkmr18/react-page-builder` | Server and client | Types, adapters, registry, tree utilities, `PageRenderer`, core blocks |
| `@manjeetkmr18/react-page-builder/editor` | Client only | `PageBuilder`, `Field` |

In Next.js, import the editor only from client components. The renderer is server-safe.

## Your first page in 3 steps

### Step 1 - register blocks

Create one module that registers every block your app uses, and import it from both the editor page and the render route.

```ts
// lib/blocks.ts
import { registerCoreBlocks } from "@manjeetkmr18/react-page-builder";

registerCoreBlocks();
```

### Step 2 - mount the editor

```tsx
"use client";
import { PageBuilder } from "@manjeetkmr18/react-page-builder/editor";
import "@/lib/blocks";

export default function EditorPage() {
  return (
    <PageBuilder
      slug="home"
      onSave={(doc) =>
        fetch("/api/pages/home", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(doc),
        })
      }
    />
  );
}
```

### Step 3 - render the saved page

```tsx
import { PageRenderer } from "@manjeetkmr18/react-page-builder";
import "@/lib/blocks";

export default async function Page({ params }) {
  const doc = await loadFromYourDb(params.slug);
  return <PageRenderer document={doc} />;
}
```

`PageRenderer` is pure: no effects, no browser APIs, no editor state. It works in React Server Components, `renderToString`, static export, and plain client rendering.

## Adapter-based editor setup

For apps that should be configurable by other developers, prefer adapters:

```tsx
import type { PageStorageAdapter, MediaStorageAdapter } from "@manjeetkmr18/react-page-builder";

const storageAdapter: PageStorageAdapter = {
  load: async (slug) => {
    const res = await fetch(`/api/pages/${slug}`);
    return res.ok ? res.json() : null;
  },
  save: async (slug, document) => {
    await fetch(`/api/pages/${slug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(document),
    });
  },
};

const mediaAdapter: MediaStorageAdapter = {
  upload: async (file) => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/media", { method: "POST", body: form });
    return res.json(); // { url }
  },
};

<PageBuilder
  slug="home"
  storageAdapter={storageAdapter}
  mediaAdapter={mediaAdapter}
  autoSave={{ delayMs: 1500 }}
/>;
```

The editor stays the same whether your backend is JSON files, Postgres, MongoDB, S3, Cloudinary, or a headless CMS.

## Trying it without a backend

`<PageBuilder>` works fully in-memory. Use Import JSON / Export JSON in the toolbar to move documents around before wiring persistence. See `examples/vite-demo` for a zero-backend playground and `examples/nextjs-app-router` for the full-stack adapter pattern.

## Next steps

- [Core blocks reference](./02-core-blocks.md)
- [Building custom blocks](./03-custom-blocks.md)
- [Editor API](./04-editor.md)
- [Rendering & Next.js patterns](./05-rendering.md)
- [Document schema](./06-document-schema.md)
- [Persistence recipes](./07-persistence.md)
- [Publishing block packs](./08-block-packs.md)
