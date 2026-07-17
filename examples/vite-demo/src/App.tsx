import { useState } from "react";
import {
  PageRenderer,
  registerCoreBlocks,
  registerBlock,
  type PageDocument,
} from "@manjeetkmr18/react-page-builder";
import { PageBuilder } from "@manjeetkmr18/react-page-builder/editor";
import demoPage from "./demo-page.json";

/* 1 ─ Register blocks once at startup (module scope) */
registerCoreBlocks();

registerBlock({
  type: "demo/testimonial",
  label: "Testimonial",
  category: "Marketing",
  icon: "💬",
  defaultProps: {
    quote: "This is a custom block — it took 25 lines to add.",
    author: "You, in five minutes",
    accent: "#7c3aed",
  },
  fields: [
    { name: "quote", label: "Quote", type: "textarea" },
    { name: "author", label: "Author", type: "text" },
    { name: "accent", label: "Accent color", type: "color" },
  ],
  render: ({ node }) => (
    <figure style={{ borderLeft: `4px solid ${node.props.accent}`, paddingLeft: 20, margin: 0 }}>
      <blockquote style={{ margin: 0, fontSize: 18, fontStyle: "italic", color: "#1f2937" }}>
        “{node.props.quote}”
      </blockquote>
      <figcaption style={{ marginTop: 10, color: "#64748b", fontSize: 14 }}>
        — {node.props.author}
      </figcaption>
    </figure>
  ),
});

/* 2 ─ The demo shell: switch between the editor and the "published" render */
export default function App() {
  const [doc, setDoc] = useState<PageDocument>(demoPage as PageDocument);
  const [view, setView] = useState<"editor" | "published">("editor");

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 14px",
          background: "#111827",
          color: "#e5e7eb",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          fontSize: 13,
        }}
      >
        <strong style={{ marginRight: 8 }}>react-page-builder demo</strong>
        {(["editor", "published"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              padding: "5px 12px",
              borderRadius: 6,
              border: "1px solid " + (view === v ? "#3b82f6" : "#374151"),
              background: view === v ? "#1d4ed8" : "transparent",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            {v === "editor" ? "✎ Editor" : "🌐 Published render"}
          </button>
        ))}
        <span style={{ marginLeft: "auto", color: "#9ca3af" }}>
          Changes carry over between tabs — same JSON document
        </span>
      </nav>

      <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
        {view === "editor" ? (
          <PageBuilder value={doc} onChange={setDoc} height="100%" />
        ) : (
          /* This is exactly what your live Next.js route would output */
          <PageRenderer document={doc} />
        )}
      </div>
    </div>
  );
}
