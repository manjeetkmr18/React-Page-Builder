# Building Custom Blocks

Blocks are the extension model. A block definition is a plain object: type, label, inspector fields, default props, and a pure render function.

```ts
interface BlockDefinition {
  type: string;
  label: string;
  category?: string;
  icon?: string;
  defaultProps?: Record<string, any>;
  isContainer?: boolean;
  fields?: FieldDefinition[];
  render: (ctx: BlockRenderContext) => ReactNode;
}
```

`render` receives:

```ts
interface BlockRenderContext {
  node: PageNode;
  children?: ReactNode;
  isEditing: boolean;
}
```

## Render rules

1. Be pure and SSR-safe. Do not read `window` during render.
2. Read all editable values from `node.props`.
3. Keep props JSON-serializable.
4. Use `isEditing` to disable links, iframes, autoplay, and expensive widgets inside the editor.
5. Containers must set `isContainer: true` and render `{children}`.

## Example: testimonial card

```tsx
import { registerBlock } from "@manjeetkmr18/react-page-builder";

registerBlock({
  type: "app/testimonial",
  label: "Testimonial",
  category: "Marketing",
  icon: "Quote",
  defaultProps: {
    quote: "They shipped our site in a week.",
    author: "Happy Client",
    role: "CEO, Acme Inc.",
    accent: "#2563eb",
  },
  fields: [
    { name: "quote", label: "Quote", type: "textarea" },
    { name: "author", label: "Author", type: "text" },
    { name: "role", label: "Role / company", type: "text" },
    { name: "accent", label: "Accent color", type: "color" },
  ],
  render: ({ node }) => {
    const p = node.props;
    return (
      <figure style={{ borderLeft: `4px solid ${p.accent}`, paddingLeft: 20, margin: 0 }}>
        <blockquote style={{ margin: 0, fontSize: 18, fontStyle: "italic" }}>
          "{p.quote}"
        </blockquote>
        <figcaption style={{ marginTop: 10, color: "#64748b" }}>
          <strong style={{ color: "#111827" }}>{p.author}</strong> - {p.role}
        </figcaption>
      </figure>
    );
  },
});
```

## Example: container block

```tsx
registerBlock({
  type: "app/card",
  label: "Card",
  category: "Layout",
  icon: "Card",
  isContainer: true,
  defaultProps: { background: "#ffffff", radius: 12, padding: 24, shadow: true },
  fields: [
    { name: "background", label: "Background", type: "color" },
    { name: "radius", label: "Radius", type: "range", min: 0, max: 32 },
    { name: "padding", label: "Padding", type: "range", min: 0, max: 64, step: 4 },
    { name: "shadow", label: "Shadow", type: "boolean" },
  ],
  render: ({ node, children }) => (
    <div
      style={{
        background: node.props.background,
        borderRadius: node.props.radius,
        padding: node.props.padding,
        boxShadow: node.props.shadow ? "0 4px 16px rgba(15,23,42,.08)" : "none",
      }}
    >
      {children}
    </div>
  ),
});
```

## Example: `isEditing` for embeds

```tsx
registerBlock({
  type: "app/youtube",
  label: "YouTube",
  category: "Media",
  icon: "Video",
  defaultProps: { videoId: "dQw4w9WgXcQ", ratio: 56.25 },
  fields: [{ name: "videoId", label: "Video ID", type: "text" }],
  render: ({ node, isEditing }) => (
    <div style={{ position: "relative", paddingTop: `${node.props.ratio}%` }}>
      {isEditing ? (
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", background: "#0f172a", color: "#fff" }}>
          YouTube: {node.props.videoId}
        </div>
      ) : (
        <iframe
          src={`https://www.youtube.com/embed/${node.props.videoId}`}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
          allowFullScreen
        />
      )}
    </div>
  ),
});
```

Showing a lightweight placeholder while editing keeps the canvas fast and prevents iframes from swallowing drag events.

## `next/image` example

```tsx
// blocks/next-image.tsx
import Image from "next/image";
import { registerBlock } from "@manjeetkmr18/react-page-builder";

registerBlock({
  type: "app/image",
  label: "Optimized image",
  category: "Media",
  icon: "Image",
  defaultProps: { src: "/placeholder.jpg", alt: "", width: 1200, height: 600 },
  fields: [
    { name: "src", label: "Image URL", type: "image" },
    { name: "alt", label: "Alt text", type: "text" },
  ],
  render: ({ node }) => (
    <Image
      src={node.props.src}
      alt={node.props.alt}
      width={node.props.width}
      height={node.props.height}
      style={{ width: "100%", height: "auto" }}
    />
  ),
});
```

When the editor receives a `mediaAdapter`, `image` fields can upload/select media and store the returned URL in `node.props.src`.

## Field types

| Type | Control | Value |
| --- | --- | --- |
| `text` | single-line input | `string` |
| `textarea` | multi-line input | `string` |
| `number` | number input | `number` |
| `range` | slider | `number` |
| `color` | color picker + text input | `string` |
| `select` | dropdown | `string` |
| `boolean` | checkbox | `boolean` |
| `image` | URL input plus optional media adapter controls | `string` |

## Naming conventions

- Namespace types: `yourorg/blockname`.
- Keep type strings stable forever; they are stored in every document.
- Reserve `core/*` for built-in blocks.
