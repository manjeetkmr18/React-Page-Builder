# Editor API

```tsx
"use client";
import { PageBuilder } from "@manjeetkmr18/react-page-builder/editor";
```

`<PageBuilder>` renders the full editor: toolbar, block palette, canvas, inspector, undo/redo history, preview, and import/export. It can run purely in-memory, through callbacks, or through storage/media adapters.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `PageDocument` | - | Controlled/current document |
| `defaultValue` | `PageDocument` | empty document | Initial document for uncontrolled use |
| `slug` | `string` | - | Page id passed to storage/media adapters |
| `storageAdapter` | `PageStorageAdapter` | - | Optional load/save/list/delete/publish integration |
| `storageContext` | `PageStorageContext` | - | Extra context passed to storage calls |
| `mediaAdapter` | `MediaStorageAdapter` | - | Optional upload/select integration for image fields |
| `autoSave` | `boolean \| { delayMs?: number }` | `false` | Debounced save through `storageAdapter` or `onSave` |
| `onChange` | `(doc) => void` | - | Fires after every mutation |
| `onSave` | `(doc) => void \| Promise<void>` | - | Shows a Save button when provided |
| `onLoad` | `(doc) => void` | - | Fires after adapter load succeeds |
| `onError` | `(error, phase) => void` | console error | Handles adapter load/save failures |
| `height` | `number \| string` | `"100vh"` | Height of the editor shell |

The Save button appears when either `onSave` is provided or both `storageAdapter` and `slug` are provided.

## Callback-only loading and saving

```tsx
"use client";
import { useEffect, useState } from "react";
import { PageBuilder } from "@manjeetkmr18/react-page-builder/editor";
import type { PageDocument } from "@manjeetkmr18/react-page-builder";
import "@/lib/blocks";

export default function Editor({ slug }: { slug: string }) {
  const [doc, setDoc] = useState<PageDocument | null>(null);

  useEffect(() => {
    fetch(`/api/pages/${slug}`).then((r) => r.json()).then(setDoc);
  }, [slug]);

  if (!doc) return <p>Loading...</p>;

  return (
    <PageBuilder
      value={doc}
      onChange={setDoc}
      onSave={(next) =>
        fetch(`/api/pages/${slug}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(next),
        })
      }
    />
  );
}
```

## Adapter loading, saving, and autosave

```tsx
import type { PageStorageAdapter } from "@manjeetkmr18/react-page-builder";

const storageAdapter: PageStorageAdapter = {
  async load(slug) {
    const res = await fetch(`/api/pages/${slug}`, { cache: "no-store" });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Could not load page");
    return res.json();
  },
  async save(slug, document) {
    const res = await fetch(`/api/pages/${slug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(document),
    });
    if (!res.ok) throw new Error("Could not save page");
    return res.json();
  },
};

<PageBuilder
  slug="home"
  storageAdapter={storageAdapter}
  autoSave={{ delayMs: 1500 }}
/>;
```

When `storageAdapter.load` returns `null`, the editor starts from an empty document. This is useful for "create a new page by slug" flows.

## Media adapter for image fields

```tsx
import type { MediaStorageAdapter } from "@manjeetkmr18/react-page-builder";

const mediaAdapter: MediaStorageAdapter = {
  async upload(file, context) {
    const form = new FormData();
    form.append("file", file);
    form.append("slug", context?.slug ?? "");
    const res = await fetch("/api/media", { method: "POST", body: form });
    if (!res.ok) throw new Error("Upload failed");
    return res.json(); // { url }
  },
};

<PageBuilder slug="home" storageAdapter={storageAdapter} mediaAdapter={mediaAdapter} />;
```

For an `image` field, the inspector shows the normal URL input plus Upload/Choose controls when a media adapter is present. `upload()` can return either a URL string or an object with a `url` field.

## Built-in toolbar features

- Undo / Redo - 50-step history. `Ctrl/Cmd+Z`, `Ctrl/Cmd+Shift+Z`, or `Ctrl+Y`.
- Import / Export JSON - round-trips the full `PageDocument`.
- Preview - renders the document without editor chrome.
- Save - calls `storageAdapter.save` and/or `onSave`.

## Canvas interactions

- Click a block to select it, then edit fields in the inspector.
- Drag from the palette to insert blocks.
- Drag an existing block to move it.
- Delete / Backspace removes the selected block, ignored while typing.
- Duplicate deep-clones the selected block with fresh ids.

## Headless usage

The editor is a convenience shell. Everything it does goes through exported document utilities, so you can build your own editor UI:

```ts
import {
  createEmptyDocument,
  createNode,
  insertNode,
  updateNodeProps,
} from "@manjeetkmr18/react-page-builder";

let doc = createEmptyDocument();
const section = createNode("core/section", { background: "#0f172a" }, []);
doc = insertNode(doc, section, { parentId: null, index: 0 });
doc = insertNode(doc, createNode("core/heading", { text: "Hi" }), {
  parentId: section.id,
  index: 0,
});
doc = updateNodeProps(doc, section.id, { paddingY: 96 });
```
