// src/types.ts
function spacingStyle(props) {
  const s = {};
  if (props.marginTop != null) s.marginTop = props.marginTop;
  if (props.marginBottom != null) s.marginBottom = props.marginBottom;
  if (props.marginLeft != null) s.marginLeft = props.marginLeft;
  if (props.marginRight != null) s.marginRight = props.marginRight;
  if (props.paddingTop != null) s.paddingTop = props.paddingTop;
  if (props.paddingBottom != null) s.paddingBottom = props.paddingBottom;
  if (props.paddingLeft != null) s.paddingLeft = props.paddingLeft;
  if (props.paddingRight != null) s.paddingRight = props.paddingRight;
  if (props.paddingX != null) {
    s.paddingLeft = props.paddingX;
    s.paddingRight = props.paddingX;
  }
  if (props.paddingY != null) {
    s.paddingTop = props.paddingY;
    s.paddingBottom = props.paddingY;
  }
  return s;
}
function isPageNode(value) {
  if (!value || typeof value !== "object") return false;
  const node = value;
  if (typeof node.id !== "string" || typeof node.type !== "string") return false;
  if (!node.props || typeof node.props !== "object" || Array.isArray(node.props)) {
    return false;
  }
  if (node.children != null) {
    if (!Array.isArray(node.children)) return false;
    return node.children.every(isPageNode);
  }
  return true;
}
function isPageDocument(value) {
  if (!value || typeof value !== "object") return false;
  const doc = value;
  return doc.version === 1 && Array.isArray(doc.root) && doc.root.every(isPageNode);
}
function assertPageDocument(value) {
  if (!isPageDocument(value)) {
    throw new Error("Invalid PageDocument: expected { version: 1, root: PageNode[] }.");
  }
}

// src/registry.ts
function getRegistry() {
  const globalScope = globalThis;
  if (!globalScope.__manjeetReactPageBuilderRegistry) {
    globalScope.__manjeetReactPageBuilderRegistry = /* @__PURE__ */ new Map();
  }
  return globalScope.__manjeetReactPageBuilderRegistry;
}
function registerBlock(def) {
  if (!def.type) throw new Error("registerBlock: block needs a `type`.");
  getRegistry().set(def.type, def);
}
function registerBlocks(defs) {
  defs.forEach(registerBlock);
}
function unregisterBlock(type) {
  getRegistry().delete(type);
}
function getBlock(type) {
  return getRegistry().get(type);
}
function getAllBlocks() {
  return Array.from(getRegistry().values());
}
function getBlocksByCategory() {
  const grouped = {};
  for (const def of getRegistry().values()) {
    const cat = def.category ?? "Other";
    (grouped[cat] ?? (grouped[cat] = [])).push(def);
  }
  return grouped;
}

// src/tree.ts
function generateId() {
  return "n_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
function createEmptyDocument() {
  return { version: 1, root: [] };
}
function createNode(type, props = {}, children) {
  return { id: generateId(), type, props, ...children ? { children } : {} };
}
function findNode(doc, id) {
  const walk = (nodes) => {
    for (const n of nodes) {
      if (n.id === id) return n;
      if (n.children) {
        const hit = walk(n.children);
        if (hit) return hit;
      }
    }
    return null;
  };
  return walk(doc.root);
}
function isDescendant(doc, ancestorId, maybeDescendant) {
  const ancestor = findNode(doc, ancestorId);
  if (!ancestor?.children) return false;
  const walk = (nodes) => nodes.some((n) => n.id === maybeDescendant || (n.children ? walk(n.children) : false));
  return walk(ancestor.children);
}
function insertNode(doc, node, target) {
  const insertInto = (nodes) => {
    if (target.parentId === null) {
      const copy = nodes.slice();
      copy.splice(clampIndex(target.index, copy.length), 0, node);
      return copy;
    }
    return nodes.map((n) => {
      if (n.id === target.parentId) {
        const kids = (n.children ?? []).slice();
        kids.splice(clampIndex(target.index, kids.length), 0, node);
        return { ...n, children: kids };
      }
      if (n.children) return { ...n, children: insertInto(n.children) };
      return n;
    });
  };
  if (target.parentId === null) {
    return { ...doc, root: insertInto(doc.root) };
  }
  return { ...doc, root: insertInto(doc.root) };
}
function removeNode(doc, id) {
  let removed = null;
  const filter = (nodes) => nodes.filter((n) => {
    if (n.id === id) {
      removed = n;
      return false;
    }
    return true;
  }).map((n) => n.children ? { ...n, children: filter(n.children) } : n);
  const root = filter(doc.root);
  return [{ ...doc, root }, removed];
}
function moveNode(doc, id, target) {
  if (target.parentId === id) return doc;
  if (target.parentId && isDescendant(doc, id, target.parentId)) return doc;
  const [without, node] = removeNode(doc, id);
  if (!node) return doc;
  return insertNode(without, node, target);
}
function updateNodeProps(doc, id, patch) {
  const walk = (nodes) => nodes.map((n) => {
    if (n.id === id) return { ...n, props: { ...n.props, ...patch } };
    if (n.children) return { ...n, children: walk(n.children) };
    return n;
  });
  return { ...doc, root: walk(doc.root) };
}
function cloneNode(node) {
  return {
    id: generateId(),
    type: node.type,
    props: JSON.parse(JSON.stringify(node.props ?? {})),
    ...node.children ? { children: node.children.map(cloneNode) } : {}
  };
}
function clampIndex(i, len) {
  return Math.max(0, Math.min(i, len));
}

// src/Renderer.tsx
import React from "react";
import { Fragment, jsx } from "react/jsx-runtime";
function PageRenderer({ document, renderUnknown }) {
  return /* @__PURE__ */ jsx(Fragment, { children: document.root.map((n) => renderTree(n, renderUnknown)) });
}
function renderTree(node, renderUnknown) {
  const def = getBlock(node.type);
  if (!def) {
    return renderUnknown ? /* @__PURE__ */ jsx(React.Fragment, { children: renderUnknown(node) }, node.id) : null;
  }
  const children = node.children?.map((c) => renderTree(c, renderUnknown));
  return /* @__PURE__ */ jsx(React.Fragment, { children: def.render({ node, children, isEditing: false }) }, node.id);
}

// src/blocks/core.tsx
import { Fragment as Fragment2, jsx as jsx2, jsxs } from "react/jsx-runtime";
var spacingFields = [
  { name: "marginTop", label: "Margin top", type: "range", min: 0, max: 96, step: 4 },
  { name: "marginBottom", label: "Margin bottom", type: "range", min: 0, max: 96, step: 4 },
  { name: "marginLeft", label: "Margin left", type: "range", min: 0, max: 96, step: 4 },
  { name: "marginRight", label: "Margin right", type: "range", min: 0, max: 96, step: 4 },
  { name: "paddingTop", label: "Padding top", type: "range", min: 0, max: 96, step: 4 },
  { name: "paddingBottom", label: "Padding bottom", type: "range", min: 0, max: 96, step: 4 },
  { name: "paddingLeft", label: "Padding left", type: "range", min: 0, max: 96, step: 4 },
  { name: "paddingRight", label: "Padding right", type: "range", min: 0, max: 96, step: 4 }
];
var Section = {
  type: "core/section",
  label: "Section",
  category: "Layout",
  icon: "\u25AD",
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
    paddingRight: 0
  },
  fields: [
    { name: "background", label: "Background", type: "color" },
    { name: "paddingY", label: "Vertical padding", type: "range", min: 0, max: 200, step: 4 },
    { name: "paddingX", label: "Horizontal padding", type: "range", min: 0, max: 120, step: 4 },
    { name: "maxWidth", label: "Content max width", type: "number", min: 320, max: 1920 },
    { name: "fullWidth", label: "Full-width content", type: "boolean" },
    ...spacingFields
  ],
  render: ({ node, children }) => {
    const p = node.props;
    return /* @__PURE__ */ jsx2(
      "section",
      {
        style: {
          ...spacingStyle(p),
          background: p.background,
          paddingTop: p.paddingY,
          paddingBottom: p.paddingY,
          paddingLeft: p.paddingX,
          paddingRight: p.paddingX
        },
        children: /* @__PURE__ */ jsx2(
          "div",
          {
            style: {
              maxWidth: p.fullWidth ? "none" : p.maxWidth,
              margin: "0 auto"
            },
            children
          }
        )
      }
    );
  }
};
var Columns = {
  type: "core/columns",
  label: "Columns",
  category: "Layout",
  icon: "\u25A5",
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
    paddingRight: 0
  },
  fields: [
    { name: "columns", label: "Columns", type: "range", min: 1, max: 6, step: 1 },
    { name: "gap", label: "Gap", type: "range", min: 0, max: 80, step: 4 },
    {
      name: "stackOnMobile",
      label: "Stack on mobile",
      type: "boolean",
      helperText: "Show columns one below another on screens narrower than 768px."
    },
    ...spacingFields
  ],
  render: ({ node, children, isEditing }) => {
    const columnCount = Math.max(1, Math.min(6, Math.round(Number(node.props.columns) || 2)));
    const gap = Math.max(0, Math.min(80, Number(node.props.gap) || 0));
    const isEmpty = (node.children?.length ?? 0) === 0;
    return /* @__PURE__ */ jsxs(Fragment2, { children: [
      /* @__PURE__ */ jsx2(
        "style",
        {
          dangerouslySetInnerHTML: {
            __html: `
              .rpb-core-columns > .rpb-dropzone,
              .rpb-core-columns > .rpb-dropzone-collapsed { display: none !important; }
              .rpb-core-columns > .rpb-node { min-width: 0; }
              @media (max-width: 767px) {
                .rpb-core-columns[data-stack-mobile="true"] {
                  grid-template-columns: minmax(0, 1fr) !important;
                }
              }
            `
          }
        }
      ),
      /* @__PURE__ */ jsxs(
        "div",
        {
          className: "rpb-core-columns",
          "data-stack-mobile": node.props.stackOnMobile !== false ? "true" : "false",
          style: {
            ...spacingStyle(node.props),
            display: "grid",
            gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
            gap,
            alignItems: "start"
          },
          children: [
            children,
            isEditing && isEmpty ? Array.from({ length: columnCount }, (_, index) => /* @__PURE__ */ jsxs(
              "div",
              {
                "aria-hidden": "true",
                style: {
                  minHeight: 88,
                  display: "grid",
                  placeItems: "center",
                  color: "#94a3b8",
                  fontSize: 12,
                  border: "1px dashed #cbd5e1",
                  borderRadius: 8,
                  background: "rgba(248,250,252,.75)"
                },
                children: [
                  "Column ",
                  index + 1
                ]
              },
              index
            )) : null
          ]
        }
      )
    ] });
  }
};
var Heading = {
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
    paddingRight: 0
  },
  fields: [
    { name: "text", label: "Text", type: "textarea" },
    {
      name: "level",
      label: "Level",
      type: "select",
      options: ["h1", "h2", "h3", "h4", "h5", "h6"].map((v) => ({ label: v.toUpperCase(), value: v }))
    },
    {
      name: "align",
      label: "Align",
      type: "select",
      options: [
        { label: "Left", value: "left" },
        { label: "Center", value: "center" },
        { label: "Right", value: "right" }
      ]
    },
    { name: "color", label: "Color", type: "color" },
    { name: "marginBottom", label: "Bottom margin", type: "range", min: 0, max: 96, step: 4 },
    ...spacingFields.filter((field) => field.name !== "marginBottom")
  ],
  render: ({ node }) => {
    const p = node.props;
    const Tag = p.level || "h2";
    return /* @__PURE__ */ jsx2(
      Tag,
      {
        style: {
          textAlign: p.align,
          color: p.color,
          margin: 0,
          ...spacingStyle(p)
        },
        children: p.text
      }
    );
  }
};
var Text = {
  type: "core/text",
  label: "Text",
  category: "Basic",
  icon: "\xB6",
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
    paddingRight: 0
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
        { label: "Right", value: "right" }
      ]
    },
    { name: "color", label: "Color", type: "color" },
    { name: "fontSize", label: "Font size", type: "range", min: 12, max: 32, step: 1 },
    { name: "marginBottom", label: "Bottom margin", type: "range", min: 0, max: 96, step: 4 },
    ...spacingFields.filter((field) => field.name !== "marginBottom")
  ],
  render: ({ node }) => {
    const p = node.props;
    return /* @__PURE__ */ jsx2(
      "p",
      {
        style: {
          textAlign: p.align,
          color: p.color,
          fontSize: p.fontSize,
          lineHeight: p.lineHeight,
          margin: 0,
          whiteSpace: "pre-wrap",
          ...spacingStyle(p)
        },
        children: p.text
      }
    );
  }
};
var Button = {
  type: "core/button",
  label: "Button",
  category: "Basic",
  icon: "\u25C9",
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
    paddingRight: 0
  },
  fields: [
    { name: "label", label: "Label", type: "text" },
    { name: "href", label: "Link (href)", type: "text", placeholder: "https://\u2026" },
    {
      name: "align",
      label: "Align",
      type: "select",
      options: [
        { label: "Left", value: "left" },
        { label: "Center", value: "center" },
        { label: "Right", value: "right" }
      ]
    },
    { name: "background", label: "Background", type: "color" },
    { name: "color", label: "Text color", type: "color" },
    { name: "radius", label: "Corner radius", type: "range", min: 0, max: 40, step: 1 },
    ...spacingFields
  ],
  render: ({ node, isEditing }) => {
    const p = node.props;
    return /* @__PURE__ */ jsx2("div", { style: { ...spacingStyle(p), textAlign: p.align }, children: /* @__PURE__ */ jsx2(
      "a",
      {
        href: isEditing ? void 0 : p.href,
        style: {
          display: "inline-block",
          background: p.background,
          color: p.color,
          borderRadius: p.radius,
          padding: `${p.paddingY}px ${p.paddingX}px`,
          textDecoration: "none",
          fontWeight: 600,
          cursor: "pointer"
        },
        children: p.label
      }
    ) });
  }
};
var Image = {
  type: "core/image",
  label: "Image",
  category: "Media",
  icon: "\u{1F5BC}",
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
    paddingRight: 0
  },
  fields: [
    { name: "src", label: "Image URL", type: "image" },
    { name: "alt", label: "Alt text", type: "text" },
    { name: "radius", label: "Corner radius", type: "range", min: 0, max: 48, step: 2 },
    ...spacingFields
  ],
  render: ({ node }) => {
    const p = node.props;
    return /* @__PURE__ */ jsx2(
      "img",
      {
        src: p.src,
        alt: p.alt,
        style: { ...spacingStyle(p), width: p.width, height: "auto", display: "block", borderRadius: p.radius }
      }
    );
  }
};
var Spacer = {
  type: "core/spacer",
  label: "Spacer",
  category: "Layout",
  icon: "\u2195",
  defaultProps: {
    height: 40,
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0
  },
  fields: [{ name: "height", label: "Height", type: "range", min: 4, max: 240, step: 4 }, ...spacingFields],
  render: ({ node, isEditing }) => /* @__PURE__ */ jsx2(
    "div",
    {
      style: {
        ...spacingStyle(node.props),
        height: node.props.height,
        background: isEditing ? "repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(37,99,235,.08) 6px, rgba(37,99,235,.08) 12px)" : void 0
      }
    }
  )
};
var Divider = {
  type: "core/divider",
  label: "Divider",
  category: "Layout",
  icon: "\u2015",
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
    paddingRight: 0
  },
  fields: [
    { name: "color", label: "Color", type: "color" },
    { name: "thickness", label: "Thickness", type: "range", min: 1, max: 12, step: 1 },
    ...spacingFields.filter((field) => field.name !== "marginBottom")
  ],
  render: ({ node }) => {
    const p = node.props;
    return /* @__PURE__ */ jsx2(
      "hr",
      {
        style: {
          border: "none",
          borderTop: `${p.thickness}px solid ${p.color}`,
          ...spacingStyle(p)
        }
      }
    );
  }
};
var Embed = {
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
    paddingRight: 0
  },
  fields: [{ name: "html", label: "Raw HTML", type: "textarea" }, ...spacingFields],
  render: ({ node }) => /* @__PURE__ */ jsx2("div", { style: { ...spacingStyle(node.props) }, dangerouslySetInnerHTML: { __html: node.props.html || "" } })
};
var coreBlocks = [
  Section,
  Columns,
  Heading,
  Text,
  Button,
  Image,
  Spacer,
  Divider,
  Embed
];
function registerCoreBlocks() {
  registerBlocks(coreBlocks);
}
export {
  PageRenderer,
  assertPageDocument,
  cloneNode,
  coreBlocks,
  createEmptyDocument,
  createNode,
  findNode,
  generateId,
  getAllBlocks,
  getBlock,
  getBlocksByCategory,
  insertNode,
  isDescendant,
  isPageDocument,
  isPageNode,
  moveNode,
  registerBlock,
  registerBlocks,
  registerCoreBlocks,
  removeNode,
  renderTree,
  spacingStyle,
  unregisterBlock,
  updateNodeProps
};
//# sourceMappingURL=index.js.map