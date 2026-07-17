import React from "react";
import type { BlockDefinition, FieldDefinition } from "../types";
import { spacingStyle } from "../types";
import { registerBlocks } from "../registry";

const spacingFields: FieldDefinition[] = [
  { name: "marginTop", label: "Margin top", type: "range", min: 0, max: 96, step: 4 },
  { name: "marginBottom", label: "Margin bottom", type: "range", min: 0, max: 96, step: 4 },
  { name: "marginLeft", label: "Margin left", type: "range", min: 0, max: 96, step: 4 },
  { name: "marginRight", label: "Margin right", type: "range", min: 0, max: 96, step: 4 },
  { name: "paddingTop", label: "Padding top", type: "range", min: 0, max: 96, step: 4 },
  { name: "paddingBottom", label: "Padding bottom", type: "range", min: 0, max: 96, step: 4 },
  { name: "paddingLeft", label: "Padding left", type: "range", min: 0, max: 96, step: 4 },
  { name: "paddingRight", label: "Padding right", type: "range", min: 0, max: 96, step: 4 },
];

/* ------------------------------------------------------------------ */
/* Layout                                                              */
/* ------------------------------------------------------------------ */

const Section: BlockDefinition = {
  type: "core/section",
  label: "Section",
  category: "Layout",
  icon: "▭",
  isContainer: true,
  defaultProps: {
    background: "#ffffff",
    paddingY: 48,
    paddingX: 24,
    maxWidth: 1140,
    fullWidth: false,
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
  },
  fields: [
    { name: "background", label: "Background", type: "color" },
    { name: "paddingY", label: "Vertical padding", type: "range", min: 0, max: 200, step: 4 },
    { name: "paddingX", label: "Horizontal padding", type: "range", min: 0, max: 120, step: 4 },
    { name: "maxWidth", label: "Content max width", type: "number", min: 320, max: 1920 },
    { name: "fullWidth", label: "Full-width content", type: "boolean" },
    ...spacingFields,
  ],
  render: ({ node, children }) => {
    const p = node.props;
    return (
      <section
        style={{
          ...spacingStyle(p),
          background: p.background,
          paddingTop: p.paddingY,
          paddingBottom: p.paddingY,
          paddingLeft: p.paddingX,
          paddingRight: p.paddingX,
        }}
      >
        <div
          style={{
            maxWidth: p.fullWidth ? "none" : p.maxWidth,
            margin: "0 auto",
          }}
        >
          {children}
        </div>
      </section>
    );
  },
};

const Columns: BlockDefinition = {
  type: "core/columns",
  label: "Columns",
  category: "Layout",
  icon: "▥",
  isContainer: true,
  showEmptyContainerHint: false,
  defaultProps: {
    columns: 2,
    gap: 24,
    stackOnMobile: true,
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
  },
  fields: [
    { name: "columns", label: "Columns", type: "range", min: 1, max: 6, step: 1 },
    { name: "gap", label: "Gap", type: "range", min: 0, max: 80, step: 4 },
    {
      name: "stackOnMobile",
      label: "Stack on mobile",
      type: "boolean",
      helperText: "Show columns one below another on screens narrower than 768px.",
    },
    ...spacingFields,
  ],
  render: ({ node, children, isEditing }) => {
    const columnCount = Math.max(1, Math.min(6, Math.round(Number(node.props.columns) || 2)));
    const gap = Math.max(0, Math.min(80, Number(node.props.gap) || 0));
    const isEmpty = (node.children?.length ?? 0) === 0;

    return (
      <>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              .rpb-core-columns > .rpb-dropzone,
              .rpb-core-columns > .rpb-dropzone-collapsed { display: none !important; }
              .rpb-core-columns > .rpb-node { min-width: 0; }
              @media (max-width: 767px) {
                .rpb-core-columns[data-stack-mobile="true"] {
                  grid-template-columns: minmax(0, 1fr) !important;
                }
              }
            `,
          }}
        />
        <div
          className="rpb-core-columns"
          data-stack-mobile={node.props.stackOnMobile !== false ? "true" : "false"}
          style={{
            ...spacingStyle(node.props),
            display: "grid",
            gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
            gap,
            alignItems: "start",
          }}
        >
          {children}
          {isEditing && isEmpty
            ? Array.from({ length: columnCount }, (_, index) => (
                <div
                  key={index}
                  aria-hidden="true"
                  style={{
                    minHeight: 88,
                    display: "grid",
                    placeItems: "center",
                    color: "#94a3b8",
                    fontSize: 12,
                    border: "1px dashed #cbd5e1",
                    borderRadius: 8,
                    background: "rgba(248,250,252,.75)",
                  }}
                >
                  Column {index + 1}
                </div>
              ))
            : null}
        </div>
      </>
    );
  },
};

/* ------------------------------------------------------------------ */
/* Basic content                                                       */
/* ------------------------------------------------------------------ */

const Heading: BlockDefinition = {
  type: "core/heading",
  label: "Heading",
  category: "Basic",
  icon: "H",
  defaultProps: {
    text: "Add your heading",
    level: "h2",
    align: "left",
    color: "#111827",
    marginBottom: 16,
    marginTop: 0,
    marginLeft: 0,
    marginRight: 0,
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
  },
  fields: [
    { name: "text", label: "Text", type: "textarea" },
    {
      name: "level",
      label: "Level",
      type: "select",
      options: ["h1", "h2", "h3", "h4", "h5", "h6"].map((v) => ({ label: v.toUpperCase(), value: v })),
    },
    {
      name: "align",
      label: "Align",
      type: "select",
      options: [
        { label: "Left", value: "left" },
        { label: "Center", value: "center" },
        { label: "Right", value: "right" },
      ],
    },
    { name: "color", label: "Color", type: "color" },
    { name: "marginBottom", label: "Bottom margin", type: "range", min: 0, max: 96, step: 4 },
    ...spacingFields.filter((field) => field.name !== "marginBottom"),
  ],
  render: ({ node }) => {
    const p = node.props;
    const Tag = (p.level || "h2") as keyof React.JSX.IntrinsicElements;
    return (
      <Tag
        style={{
          textAlign: p.align,
          color: p.color,
          margin: 0,
          ...spacingStyle(p),
        }}
      >
        {p.text}
      </Tag>
    );
  },
};

const Text: BlockDefinition = {
  type: "core/text",
  label: "Text",
  category: "Basic",
  icon: "¶",
  defaultProps: {
    text: "Write something meaningful here. Double-click a block on the canvas to select it, then edit everything in the panel on the right.",
    align: "left",
    color: "#374151",
    fontSize: 16,
    lineHeight: 1.7,
    marginBottom: 16,
    marginTop: 0,
    marginLeft: 0,
    marginRight: 0,
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
  },
  fields: [
    { name: "text", label: "Text", type: "textarea" },
    {
      name: "align",
      label: "Align",
      type: "select",
      options: [
        { label: "Left", value: "left" },
        { label: "Center", value: "center" },
        { label: "Right", value: "right" },
      ],
    },
    { name: "color", label: "Color", type: "color" },
    { name: "fontSize", label: "Font size", type: "range", min: 12, max: 32, step: 1 },
    { name: "marginBottom", label: "Bottom margin", type: "range", min: 0, max: 96, step: 4 },
    ...spacingFields.filter((field) => field.name !== "marginBottom"),
  ],
  render: ({ node }) => {
    const p = node.props;
    return (
      <p
        style={{
          textAlign: p.align,
          color: p.color,
          fontSize: p.fontSize,
          lineHeight: p.lineHeight,
          margin: 0,
          whiteSpace: "pre-wrap",
          ...spacingStyle(p),
        }}
      >
        {p.text}
      </p>
    );
  },
};

const Button: BlockDefinition = {
  type: "core/button",
  label: "Button",
  category: "Basic",
  icon: "◉",
  defaultProps: {
    label: "Get started",
    href: "#",
    align: "left",
    background: "#2563eb",
    color: "#ffffff",
    radius: 8,
    paddingY: 12,
    paddingX: 24,
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
  },
  fields: [
    { name: "label", label: "Label", type: "text" },
    { name: "href", label: "Link (href)", type: "text", placeholder: "https://…" },
    {
      name: "align",
      label: "Align",
      type: "select",
      options: [
        { label: "Left", value: "left" },
        { label: "Center", value: "center" },
        { label: "Right", value: "right" },
      ],
    },
    { name: "background", label: "Background", type: "color" },
    { name: "color", label: "Text color", type: "color" },
    { name: "radius", label: "Corner radius", type: "range", min: 0, max: 40, step: 1 },
    ...spacingFields,
  ],
  render: ({ node, isEditing }) => {
    const p = node.props;
    return (
      <div style={{ ...spacingStyle(p), textAlign: p.align }}>
        <a
          href={isEditing ? undefined : p.href}
          style={{
            display: "inline-block",
            background: p.background,
            color: p.color,
            borderRadius: p.radius,
            padding: `${p.paddingY}px ${p.paddingX}px`,
            textDecoration: "none",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {p.label}
        </a>
      </div>
    );
  },
};

/* ------------------------------------------------------------------ */
/* Media & misc                                                        */
/* ------------------------------------------------------------------ */

const Image: BlockDefinition = {
  type: "core/image",
  label: "Image",
  category: "Media",
  icon: "🖼",
  defaultProps: {
    src: "https://placehold.co/1200x600/e2e8f0/64748b?text=Image",
    alt: "",
    radius: 0,
    width: "100%",
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
  },
  fields: [
    { name: "src", label: "Image URL", type: "image" },
    { name: "alt", label: "Alt text", type: "text" },
    { name: "radius", label: "Corner radius", type: "range", min: 0, max: 48, step: 2 },
    ...spacingFields,
  ],
  render: ({ node }) => {
    const p = node.props;
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={p.src}
        alt={p.alt}
        style={{ ...spacingStyle(p), width: p.width, height: "auto", display: "block", borderRadius: p.radius }}
      />
    );
  },
};

const Spacer: BlockDefinition = {
  type: "core/spacer",
  label: "Spacer",
  category: "Layout",
  icon: "↕",
  defaultProps: {
    height: 40,
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
  },
  fields: [{ name: "height", label: "Height", type: "range", min: 4, max: 240, step: 4 }, ...spacingFields],
  render: ({ node, isEditing }) => (
    <div
      style={{
        ...spacingStyle(node.props),
        height: node.props.height,
        background: isEditing
          ? "repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(37,99,235,.08) 6px, rgba(37,99,235,.08) 12px)"
          : undefined,
      }}
    />
  ),
};

const Divider: BlockDefinition = {
  type: "core/divider",
  label: "Divider",
  category: "Layout",
  icon: "―",
  defaultProps: {
    color: "#e5e7eb",
    thickness: 1,
    marginTop: 16,
    marginBottom: 16,
    marginLeft: 0,
    marginRight: 0,
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
  },
  fields: [
    { name: "color", label: "Color", type: "color" },
    { name: "thickness", label: "Thickness", type: "range", min: 1, max: 12, step: 1 },
    ...spacingFields.filter((field) => field.name !== "marginBottom"),
  ],
  render: ({ node }) => {
    const p = node.props;
    return (
      <hr
        style={{
          border: "none",
          borderTop: `${p.thickness}px solid ${p.color}`,
          ...spacingStyle(p),
        }}
      />
    );
  },
};

const Embed: BlockDefinition = {
  type: "core/embed",
  label: "Embed / HTML",
  category: "Media",
  icon: "</>",
  defaultProps: {
    html: "<div style='padding:24px;background:#f1f5f9;border-radius:8px'>Custom HTML block</div>",
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
  },
  fields: [{ name: "html", label: "Raw HTML", type: "textarea" }, ...spacingFields],
  render: ({ node }) => (
    <div style={{ ...spacingStyle(node.props) }} dangerouslySetInnerHTML={{ __html: node.props.html || "" }} />
  ),
};

export const coreBlocks: BlockDefinition[] = [
  Section,
  Columns,
  Heading,
  Text,
  Button,
  Image,
  Spacer,
  Divider,
  Embed,
];

/** Register the built-in block set. Call once at startup (optional — bring your own blocks if you prefer). */
export function registerCoreBlocks(): void {
  registerBlocks(coreBlocks);
}
