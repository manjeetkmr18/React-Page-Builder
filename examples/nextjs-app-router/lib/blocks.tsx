/**
 * Register every block the app uses. Import this module from BOTH the editor
 * page and the public render route so the registry is populated in each bundle.
 */
import React from "react";
import { registerCoreBlocks, registerBlock } from "@manjeetkmr18/react-page-builder";

registerCoreBlocks();

// Example custom block, to show how easy extension is.
registerBlock({
  type: "app/testimonial",
  label: "Testimonial",
  category: "Marketing",
  icon: "Quote",
  defaultProps: {
    quote: "WebX rebuilt our landing pages in days, not weeks.",
    author: "A Happy Client",
    role: "Marketing Director",
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
        <blockquote style={{ margin: 0, fontSize: 18, fontStyle: "italic", color: "#1f2937" }}>
          "{p.quote}"
        </blockquote>
        <figcaption style={{ marginTop: 10, color: "#64748b", fontSize: 14 }}>
          <strong style={{ color: "#111827" }}>{p.author}</strong> - {p.role}
        </figcaption>
      </figure>
    );
  },
});
