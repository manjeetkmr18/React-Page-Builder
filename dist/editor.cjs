"use client";
"use strict";
"use client";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/editor/index.ts
var editor_exports = {};
__export(editor_exports, {
  Field: () => Field,
  PageBuilder: () => PageBuilder
});
module.exports = __toCommonJS(editor_exports);

// src/editor/PageBuilder.tsx
var import_react2 = __toESM(require("react"), 1);

// src/types.ts
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

// src/registry.ts
function getRegistry() {
  const globalScope = globalThis;
  if (!globalScope.__manjeetReactPageBuilderRegistry) {
    globalScope.__manjeetReactPageBuilderRegistry = /* @__PURE__ */ new Map();
  }
  return globalScope.__manjeetReactPageBuilderRegistry;
}
function getBlock(type) {
  return getRegistry().get(type);
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

// src/editor/fields.tsx
var import_react = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
function Field({ field, value, onChange, mediaAdapter, mediaContext }) {
  const fileInput = (0, import_react.useRef)(null);
  const [busy, setBusy] = (0, import_react.useState)(false);
  const [error, setError] = (0, import_react.useState)(null);
  const mediaUploadContext = {
    ...mediaContext,
    field,
    currentValue: value
  };
  const applyMediaResult = (result) => {
    if (!result) return;
    onChange(typeof result === "string" ? result : result.url);
  };
  const uploadFile = async (file) => {
    if (!mediaAdapter) return;
    setBusy(true);
    setError(null);
    try {
      const result = await mediaAdapter.upload(file, mediaUploadContext);
      applyMediaResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };
  const chooseMedia = async () => {
    if (!mediaAdapter?.select) return;
    setBusy(true);
    setError(null);
    try {
      const result = await mediaAdapter.select(mediaUploadContext);
      applyMediaResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not choose media");
    } finally {
      setBusy(false);
    }
  };
  switch (field.type) {
    case "text":
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "input",
        {
          className: "rpb-input",
          type: "text",
          value: value ?? "",
          placeholder: field.placeholder,
          onChange: (e) => onChange(e.target.value)
        }
      );
    case "image":
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "rpb-image-field", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            className: "rpb-input",
            type: "text",
            value: value ?? "",
            placeholder: field.placeholder ?? "https://...",
            onChange: (e) => onChange(e.target.value)
          }
        ),
        mediaAdapter && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "rpb-media-actions", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "button",
            {
              type: "button",
              className: "rpb-btn",
              disabled: busy,
              onClick: () => fileInput.current?.click(),
              children: busy ? "Uploading..." : "Upload"
            }
          ),
          mediaAdapter.select && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "button",
            {
              type: "button",
              className: "rpb-btn",
              disabled: busy,
              onClick: chooseMedia,
              children: "Choose"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              ref: fileInput,
              type: "file",
              accept: field.accept ?? "image/*",
              style: { display: "none" },
              onChange: (e) => {
                const file = e.target.files?.[0];
                if (file) void uploadFile(file);
                e.target.value = "";
              }
            }
          )
        ] }),
        typeof value === "string" && value && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { className: "rpb-image-preview", src: value, alt: "" }),
        error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "rpb-field-error", children: error })
      ] });
    case "textarea":
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "textarea",
        {
          className: "rpb-input rpb-textarea",
          rows: 4,
          value: value ?? "",
          placeholder: field.placeholder,
          onChange: (e) => onChange(e.target.value)
        }
      );
    case "number":
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "input",
        {
          className: "rpb-input",
          type: "number",
          value: value ?? "",
          min: field.min,
          max: field.max,
          step: field.step,
          onChange: (e) => onChange(e.target.value === "" ? void 0 : Number(e.target.value))
        }
      );
    case "range":
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "rpb-range-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            type: "range",
            value: value ?? field.min ?? 0,
            min: field.min ?? 0,
            max: field.max ?? 100,
            step: field.step ?? 1,
            onChange: (e) => onChange(Number(e.target.value))
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "rpb-range-value", children: value ?? field.min ?? 0 })
      ] });
    case "color":
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "rpb-color-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            type: "color",
            value: toHex(value),
            onChange: (e) => onChange(e.target.value)
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            className: "rpb-input",
            type: "text",
            value: value ?? "",
            onChange: (e) => onChange(e.target.value)
          }
        )
      ] });
    case "select":
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "select",
        {
          className: "rpb-input",
          value: value ?? "",
          onChange: (e) => onChange(e.target.value),
          children: (field.options ?? []).map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: o.value, children: o.label }, o.value))
        }
      );
    case "boolean":
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "rpb-switch", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            type: "checkbox",
            checked: !!value,
            onChange: (e) => onChange(e.target.checked)
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: value ? "On" : "Off" })
      ] });
    default:
      return null;
  }
}
function toHex(v) {
  if (typeof v === "string" && /^#([0-9a-f]{6})$/i.test(v)) return v;
  return "#000000";
}

// src/editor/styles.ts
var EDITOR_CSS = `
.rpb-root{
  --rpb-bg:#eef1f5;
  --rpb-panel-bg:#ffffff;
  --rpb-tint:#f7f8fa;
  --rpb-border:#d8dee6;
  --rpb-border-soft:#e2e8f0;
  --rpb-text:#1e293b;
  --rpb-text-muted:#64748b;
  --rpb-text-faint:#94a3b8;
  --rpb-accent:#2563eb;
  --rpb-accent-hover:#1d4ed8;
  --rpb-accent-soft:rgba(37,99,235,.12);
  --rpb-accent-contrast:#ffffff;
  --rpb-danger:#b91c1c;
  --rpb-danger-bg:#fef2f2;
  --rpb-danger-border:#fecaca;
  --rpb-success:#15803d;
  --rpb-warning:#b45309;
  --rpb-input-bg:#ffffff;
  --rpb-radius:8px;
  --rpb-font:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  --rpb-font-mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;

  display:flex;flex-direction:column;font-family:var(--rpb-font);font-size:13px;
  color:var(--rpb-text);background:var(--rpb-bg);overflow:hidden;border:1px solid var(--rpb-border);
}
.rpb-root *,.rpb-root *::before,.rpb-root *::after{box-sizing:border-box}

/* Toolbar */
.rpb-toolbar{display:flex;align-items:center;gap:8px;padding:7px 12px;background:var(--rpb-panel-bg);border-bottom:1px solid var(--rpb-border);flex-shrink:0;flex-wrap:wrap}
.rpb-brand{font-weight:700;letter-spacing:-.01em;margin-right:4px;color:var(--rpb-text);display:flex;align-items:center;gap:6px;font-size:12.5px}
.rpb-toolbar-group{display:flex;align-items:center;gap:2px;background:var(--rpb-tint);border:1px solid var(--rpb-border);border-radius:8px;padding:2px}
.rpb-toolbar-spacer{flex:1}
.rpb-icon-btn{appearance:none;border:1px solid transparent;background:transparent;border-radius:6px;width:28px;height:28px;display:inline-flex;align-items:center;justify-content:center;color:var(--rpb-text-muted);cursor:pointer;transition:background .12s,color .12s}
.rpb-icon-btn:hover{background:var(--rpb-border-soft);color:var(--rpb-text)}
.rpb-icon-btn:disabled{opacity:.4;cursor:not-allowed;background:transparent}
.rpb-icon-btn-active{background:var(--rpb-accent-soft);color:var(--rpb-accent)}
.rpb-btn{appearance:none;border:1px solid var(--rpb-border);background:var(--rpb-panel-bg);border-radius:7px;padding:6px 12px;font-size:12.5px;font-weight:500;color:var(--rpb-text-muted);cursor:pointer;transition:background .12s,border-color .12s;display:inline-flex;align-items:center;gap:6px}
.rpb-btn:hover{background:var(--rpb-tint);border-color:var(--rpb-text-faint)}
.rpb-btn:disabled{opacity:.6;cursor:not-allowed}
.rpb-btn:disabled:hover{background:var(--rpb-panel-bg);border-color:var(--rpb-border)}
.rpb-btn-active{background:var(--rpb-accent-soft);border-color:var(--rpb-accent);color:var(--rpb-accent)}
.rpb-btn-primary{background:var(--rpb-accent);border-color:var(--rpb-accent);color:var(--rpb-accent-contrast)}
.rpb-btn-primary:hover{background:var(--rpb-accent-hover);border-color:var(--rpb-accent-hover)}
.rpb-btn-danger{color:var(--rpb-danger);border-color:var(--rpb-danger-border)}
.rpb-btn-danger:hover{background:var(--rpb-danger-bg);border-color:var(--rpb-danger)}
.rpb-save-status{font-size:11.5px;color:var(--rpb-text-faint);white-space:nowrap}
.rpb-save-status-saved{color:var(--rpb-success)}
.rpb-save-status-error{color:var(--rpb-danger)}

/* Breakpoint + zoom controls */
.rpb-breakpoints{display:flex;align-items:center;gap:1px}
.rpb-breakpoint-btn{appearance:none;border:none;background:transparent;border-radius:5px;padding:5px 8px;display:inline-flex;align-items:center;gap:5px;color:var(--rpb-text-muted);cursor:pointer;font-size:11px;font-weight:500}
.rpb-breakpoint-btn:hover{color:var(--rpb-text)}
.rpb-breakpoint-btn-active{background:var(--rpb-panel-bg);color:var(--rpb-accent);box-shadow:0 1px 2px rgba(0,0,0,.08)}
.rpb-zoom-select{appearance:none;border:none;background:transparent;color:var(--rpb-text-muted);font-size:11.5px;font-family:var(--rpb-font-mono);padding:5px 6px;border-radius:6px;cursor:pointer}
.rpb-zoom-select:hover{background:var(--rpb-border-soft);color:var(--rpb-text)}

/* Layout */
.rpb-body{display:flex;flex:1;min-height:0}
.rpb-loading{align-items:center;justify-content:center}
.rpb-loading-message{color:var(--rpb-text-muted);font-size:14px}

.rpb-side{display:flex;flex-direction:column;flex-shrink:0;background:var(--rpb-panel-bg);overflow:hidden;transition:width .16s ease;position:relative}
.rpb-side-left{border-right:1px solid var(--rpb-border);width:264px}
.rpb-side-right{border-left:1px solid var(--rpb-border);width:280px}
.rpb-side-collapsed.rpb-side-left{width:44px}
.rpb-side-collapsed.rpb-side-right{width:44px}
.rpb-side-header{display:flex;align-items:center;justify-content:space-between;padding:9px 12px;border-bottom:1px solid var(--rpb-border);flex-shrink:0;background:var(--rpb-tint)}
.rpb-side-collapsed .rpb-side-header{display:none}
.rpb-side-content{flex:1;overflow-y:auto;padding:12px;min-width:264px}
.rpb-side-collapsed .rpb-side-content{display:none}
.rpb-side-dock{display:flex;align-items:center;justify-content:space-around;border-top:1px solid var(--rpb-border);background:var(--rpb-tint);padding:5px;flex-shrink:0}
.rpb-side-collapsed .rpb-side-dock{flex-direction:column;gap:4px;border-top:none;padding:8px 0}
.rpb-collapse-rail{display:none}
.rpb-side-collapsed .rpb-collapse-rail{display:flex;flex-direction:column;align-items:center;gap:6px;padding-top:10px;flex:1}

/* Search */
.rpb-search{position:relative;margin-bottom:10px}
.rpb-search-icon{position:absolute;left:9px;top:50%;transform:translateY(-50%);color:var(--rpb-text-faint);pointer-events:none}
.rpb-search-input{width:100%;background:var(--rpb-tint);border:1px solid var(--rpb-border);border-radius:7px;padding:7px 9px 7px 28px;font-size:12px;color:var(--rpb-text);font-family:var(--rpb-font)}
.rpb-search-input:focus{outline:none;border-color:var(--rpb-accent);box-shadow:0 0 0 2px var(--rpb-accent-soft)}
.rpb-search-input::placeholder{color:var(--rpb-text-faint)}

/* Palette */
.rpb-panel-title{font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--rpb-text);display:flex;align-items:center;gap:6px}
.rpb-category{margin-bottom:12px}
.rpb-category-header{display:flex;align-items:center;justify-content:space-between;width:100%;appearance:none;border:none;background:transparent;padding:4px 2px;cursor:pointer;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--rpb-text-faint)}
.rpb-category-chevron{transition:transform .14s ease;flex-shrink:0}
.rpb-category-open .rpb-category-chevron{transform:rotate(90deg)}
.rpb-category-body{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}
.rpb-palette-item{display:flex;flex-direction:column;align-items:center;gap:6px;padding:12px 6px;border:1px solid var(--rpb-border-soft);border-radius:9px;background:var(--rpb-tint);cursor:grab;text-align:center;font-size:11.5px;color:var(--rpb-text-muted);transition:border-color .12s,box-shadow .12s,color .12s}
.rpb-palette-item:hover{border-color:var(--rpb-accent);color:var(--rpb-text);box-shadow:0 1px 6px var(--rpb-accent-soft)}
.rpb-palette-item:active{cursor:grabbing}
.rpb-palette-icon{color:var(--rpb-accent);display:flex}
.rpb-palette-empty{padding:24px 8px;text-align:center;color:var(--rpb-text-faint);font-size:12px}

/* Navigator */
.rpb-navigator-row{display:flex;align-items:center;gap:6px;padding:6px 6px;border-radius:6px;cursor:pointer;font-size:12px;color:var(--rpb-text-muted);white-space:nowrap;overflow:hidden}
.rpb-navigator-row:hover{background:var(--rpb-tint);color:var(--rpb-text)}
.rpb-navigator-row-selected{background:var(--rpb-accent-soft);color:var(--rpb-accent)}
.rpb-navigator-label{overflow:hidden;text-overflow:ellipsis}
.rpb-navigator-empty{padding:16px 4px;color:var(--rpb-text-faint);font-size:12px;line-height:1.5}

/* Canvas */
.rpb-canvas{flex:1;overflow:auto;padding:28px;display:flex;flex-direction:column;align-items:center;background:var(--rpb-bg)}
.rpb-canvas-preview{padding:0}
.rpb-canvas-frame{width:100%;background:var(--rpb-panel-bg);border-radius:10px;box-shadow:0 1px 3px rgba(15,23,42,.08),0 1px 24px rgba(15,23,42,.06);overflow:hidden;transition:max-width .18s ease}
.rpb-canvas-preview .rpb-canvas-frame{border-radius:0;box-shadow:none;max-width:none!important}
.rpb-canvas-chrome{height:30px;background:var(--rpb-tint);border-bottom:1px solid var(--rpb-border);display:flex;align-items:center;justify-content:center;position:relative;flex-shrink:0;gap:8px}
.rpb-canvas-chrome-dots{position:absolute;left:10px;display:flex;gap:4px}
.rpb-canvas-chrome-dot{width:7px;height:7px;border-radius:50%;background:var(--rpb-border-soft)}
.rpb-canvas-chrome-url{font-size:10.5px;font-family:var(--rpb-font-mono);color:var(--rpb-text-faint);background:var(--rpb-panel-bg);border:1px solid var(--rpb-border-soft);border-radius:5px;padding:2px 10px;max-width:70%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rpb-page{background:var(--rpb-panel-bg);min-height:400px;transform-origin:top center}
.rpb-empty{padding:80px 24px;text-align:center;color:var(--rpb-text-faint);font-size:14px}

/* Nodes */
.rpb-node{position:relative;outline:1px dashed transparent;outline-offset:-1px;transition:outline-color .12s;cursor:pointer}
.rpb-node:hover{outline-color:var(--rpb-accent)}
.rpb-node-selected{outline:2px solid var(--rpb-accent)!important;outline-offset:-2px}
.rpb-node-toolbar{display:none;position:absolute;top:0;left:0;transform:translateY(-100%);z-index:6;align-items:center;background:var(--rpb-accent);color:var(--rpb-accent-contrast);border-radius:6px 6px 0 0;font-size:10px;font-weight:600;letter-spacing:.03em;text-transform:uppercase;pointer-events:none}
.rpb-node-selected>.rpb-node-toolbar,.rpb-node:hover>.rpb-node-toolbar{display:flex}
.rpb-node-toolbar-label{padding:4px 8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rpb-node-toolbar-actions{display:flex;pointer-events:auto}
.rpb-node-toolbar-btn{width:22px;height:22px;display:flex;align-items:center;justify-content:center;color:inherit;background:transparent;border:none;cursor:pointer;opacity:.9}
.rpb-node-toolbar-btn:hover{opacity:1;background:rgba(0,0,0,.15)}
.rpb-node-container{min-height:36px}
.rpb-container-hint{padding:18px;text-align:center;color:var(--rpb-text-faint);font-size:12px;border:1px dashed var(--rpb-border);border-radius:6px;margin:6px}
.rpb-unknown{padding:12px;background:var(--rpb-danger-bg);color:var(--rpb-danger);font-size:12px;border:1px dashed var(--rpb-danger-border)}

/* Drop zones */
.rpb-dropzone-collapsed{height:0}
.rpb-dropzone{height:14px;margin:1px 0;border-radius:4px;background:var(--rpb-accent-soft);outline:1px dashed var(--rpb-accent);outline-offset:-1px;transition:height .1s,background .1s;opacity:.6}
.rpb-dropzone-over{height:30px;opacity:1;outline-width:2px}

/* Inspector */
.rpb-inspector-empty{color:var(--rpb-text-faint);font-size:12.5px;padding:12px 0;line-height:1.6}
.rpb-inspector-actions{display:flex;gap:6px;margin-bottom:14px}
.rpb-inspector-tabs{display:flex;border-bottom:1px solid var(--rpb-border);margin:-12px -12px 12px}
.rpb-inspector-tab{flex:1;appearance:none;border:none;background:transparent;padding:9px 4px;font-size:11.5px;font-weight:600;color:var(--rpb-text-faint);cursor:pointer;border-bottom:2px solid transparent}
.rpb-inspector-tab:hover{color:var(--rpb-text)}
.rpb-inspector-tab-active{color:var(--rpb-accent);border-bottom-color:var(--rpb-accent)}
.rpb-field{margin-bottom:13px}
.rpb-field-label{display:block;font-size:11.5px;font-weight:600;color:var(--rpb-text-muted);margin-bottom:5px}
.rpb-field-help{margin-top:5px;color:var(--rpb-text-faint);font-size:11.5px;line-height:1.45}
.rpb-field-error{margin-top:5px;color:var(--rpb-danger);font-size:11.5px;line-height:1.45}
.rpb-input{width:100%;border:1px solid var(--rpb-border);border-radius:6px;padding:7px 9px;font-size:12.5px;color:var(--rpb-text);background:var(--rpb-input-bg);font-family:inherit}
.rpb-input:focus{outline:2px solid var(--rpb-accent-soft);border-color:var(--rpb-accent)}
.rpb-textarea{resize:vertical;line-height:1.5}
.rpb-range-row{display:flex;align-items:center;gap:10px}
.rpb-range-row input[type=range]{flex:1;accent-color:var(--rpb-accent)}
.rpb-range-value{font-size:12px;color:var(--rpb-text-muted);min-width:32px;text-align:right;font-variant-numeric:tabular-nums}
.rpb-color-row{display:flex;align-items:center;gap:8px}
.rpb-color-row input[type=color]{width:34px;height:32px;padding:2px;border:1px solid var(--rpb-border);border-radius:6px;background:var(--rpb-input-bg);cursor:pointer;flex-shrink:0}
.rpb-switch{display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--rpb-text);cursor:pointer}
.rpb-switch input{accent-color:var(--rpb-accent);width:16px;height:16px}
.rpb-image-field{display:flex;flex-direction:column;gap:8px}
.rpb-media-actions{display:flex;gap:6px}
.rpb-image-preview{width:100%;max-height:140px;object-fit:cover;border:1px solid var(--rpb-border-soft);border-radius:6px;background:var(--rpb-tint)}
.rpb-inspector-footer{display:flex;align-items:center;justify-content:space-between;margin:12px -12px -12px;padding:10px 12px;border-top:1px solid var(--rpb-border);background:var(--rpb-tint)}
.rpb-inspector-id{font-size:10.5px;font-family:var(--rpb-font-mono);color:var(--rpb-text-faint)}
`;

// src/editor/icons.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
var PATHS = {
  undo: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M3 10h10a5 5 0 015 5v2m0 0l-3-3m3 3l3-3M3 10l3-3m-3 3l3 3" }),
  redo: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M21 10H11a5 5 0 00-5 5v2m0 0l3-3m-3 3l-3-3m14-4l-3-3m3 3l-3 3" }),
  import: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" }),
  export: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M12 15V3m0 0L8 7m4-4l4 4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" }),
  eye: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: "12", cy: "12", r: "3" })
  ] }),
  eyeOff: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M17.94 17.94A10.94 10.94 0 0112 19c-4.478 0-8.268-2.943-9.542-7a11.02 11.02 0 012.51-4.19M9.9 4.24A10.6 10.6 0 0112 4c4.478 0 8.268 2.943 9.542 7a10.98 10.98 0 01-4.132 5.411" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M14.12 14.12a3 3 0 11-4.24-4.24M1 1l22 22" })
  ] }),
  save: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M5 13l4 4L19 7" }),
  chevronDown: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M19 9l-7 7-7-7" }),
  chevronRight: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M9 6l6 6-6 6" }),
  chevronLeft: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M15 6l-6 6 6 6" }),
  search: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: "11", cy: "11", r: "7" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M21 21l-4.35-4.35" })
  ] }),
  monitor: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("rect", { x: "3", y: "4", width: "18", height: "12", rx: "1.5" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M8 20h8M12 16v4" })
  ] }),
  tablet: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("rect", { x: "5", y: "2", width: "14", height: "20", rx: "2", ry: "2" }),
  smartphone: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("rect", { x: "7", y: "2", width: "10", height: "20", rx: "2", ry: "2" }),
  layers: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M12 2l9 5-9 5-9-5 9-5z" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M3 12l9 5 9-5M3 17l9 5 9-5" })
  ] }),
  blocks: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("rect", { x: "3", y: "3", width: "7", height: "7", rx: "1" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("rect", { x: "14", y: "3", width: "7", height: "7", rx: "1" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("rect", { x: "3", y: "14", width: "7", height: "7", rx: "1" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("rect", { x: "14", y: "14", width: "7", height: "7", rx: "1" })
  ] }),
  panelLeftClose: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("rect", { x: "3", y: "4", width: "18", height: "16", rx: "2" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M9 4v16M14 10l-2 2 2 2" })
  ] }),
  panelLeftOpen: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("rect", { x: "3", y: "4", width: "18", height: "16", rx: "2" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M9 4v16M13 10l2 2-2 2" })
  ] }),
  panelRightClose: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("rect", { x: "3", y: "4", width: "18", height: "16", rx: "2" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M15 4v16M11 10l2 2-2 2" })
  ] }),
  panelRightOpen: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("rect", { x: "3", y: "4", width: "18", height: "16", rx: "2" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M15 4v16M12 10l-2 2 2 2" })
  ] }),
  grip: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: "9", cy: "6", r: "1.2", fill: "currentColor", stroke: "none" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: "15", cy: "6", r: "1.2", fill: "currentColor", stroke: "none" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: "9", cy: "12", r: "1.2", fill: "currentColor", stroke: "none" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: "15", cy: "12", r: "1.2", fill: "currentColor", stroke: "none" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: "9", cy: "18", r: "1.2", fill: "currentColor", stroke: "none" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: "15", cy: "18", r: "1.2", fill: "currentColor", stroke: "none" })
  ] }),
  copy: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("rect", { x: "9", y: "9", width: "12", height: "12", rx: "2" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M5 15H4a1 1 0 01-1-1V4a1 1 0 011-1h10a1 1 0 011 1v1" })
  ] }),
  trash: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m2 0v12a2 2 0 01-2 2H8a2 2 0 01-2-2V7h12z" })
};
function Icon({
  name,
  size = 14,
  className
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className,
      "aria-hidden": "true",
      children: PATHS[name]
    }
  );
}

// src/editor/PageBuilder.tsx
var import_jsx_runtime3 = require("react/jsx-runtime");
var currentDrag = null;
var BREAKPOINT_WIDTH = {
  desktop: void 0,
  tablet: 768,
  mobile: 375
};
function PageBuilder({
  value,
  defaultValue,
  slug,
  storageAdapter,
  storageContext,
  mediaAdapter,
  autoSave = false,
  onChange,
  onSave,
  onLoad,
  onError,
  height = "100vh",
  previewUrl,
  brand = "Page Builder"
}) {
  const [doc, setDoc] = (0, import_react2.useState)(
    value ?? defaultValue ?? createEmptyDocument()
  );
  const [selectedId, setSelectedId] = (0, import_react2.useState)(null);
  const [previewing, setPreviewing] = (0, import_react2.useState)(false);
  const [dragging, setDragging] = (0, import_react2.useState)(false);
  const [loading, setLoading] = (0, import_react2.useState)(false);
  const [saveState, setSaveState] = (0, import_react2.useState)(
    "idle"
  );
  const [saveMessage, setSaveMessage] = (0, import_react2.useState)(null);
  const [breakpoint, setBreakpoint] = (0, import_react2.useState)("desktop");
  const [zoom, setZoom] = (0, import_react2.useState)(100);
  const [leftCollapsed, setLeftCollapsed] = (0, import_react2.useState)(false);
  const [rightCollapsed, setRightCollapsed] = (0, import_react2.useState)(false);
  const [leftMode, setLeftMode] = (0, import_react2.useState)("elements");
  const [inspectorTab, setInspectorTab] = (0, import_react2.useState)("content");
  const [search, setSearch] = (0, import_react2.useState)("");
  const [closedCategories, setClosedCategories] = (0, import_react2.useState)(/* @__PURE__ */ new Set());
  const past = (0, import_react2.useRef)([]);
  const future = (0, import_react2.useRef)([]);
  const fileInput = (0, import_react2.useRef)(null);
  const autoSaveTimer = (0, import_react2.useRef)(void 0);
  const latestDoc = (0, import_react2.useRef)(doc);
  const nodeRefs = (0, import_react2.useRef)(/* @__PURE__ */ new Map());
  const adapterContext = (0, import_react2.useMemo)(
    () => ({ ...storageContext, slug }),
    [storageContext, slug]
  );
  const canSave = Boolean(onSave || storageAdapter && slug);
  (0, import_react2.useEffect)(() => {
    latestDoc.current = doc;
  }, [doc]);
  (0, import_react2.useEffect)(() => {
    if (value) {
      setDoc(value);
      latestDoc.current = value;
    }
  }, [value]);
  (0, import_react2.useEffect)(() => {
    setInspectorTab("content");
  }, [selectedId]);
  const reportStorageError = (0, import_react2.useCallback)(
    (error, phase) => {
      onError?.(error, phase);
      if (!onError && typeof console !== "undefined") {
        console.error(`PageBuilder ${phase} failed`, error);
      }
    },
    [onError]
  );
  const saveDocument = (0, import_react2.useCallback)(
    async (next = latestDoc.current) => {
      if (!canSave) return;
      setSaveState("saving");
      setSaveMessage(null);
      try {
        let result = void 0;
        if (storageAdapter && slug) {
          result = await storageAdapter.save(slug, next, adapterContext);
        }
        if (onSave) {
          const callbackResult = await onSave(next);
          result = callbackResult ?? result;
        }
        setSaveState("saved");
        setSaveMessage(describeSaveResult(result));
        return result;
      } catch (error) {
        setSaveState("error");
        setSaveMessage("Save failed");
        reportStorageError(error, "save");
      }
    },
    [adapterContext, canSave, onSave, reportStorageError, slug, storageAdapter]
  );
  const scheduleAutoSave = (0, import_react2.useCallback)(
    (next) => {
      const delay = getAutoSaveDelay(autoSave);
      if (delay == null || !canSave) return;
      clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => {
        void saveDocument(next);
      }, delay);
    },
    [autoSave, canSave, saveDocument]
  );
  (0, import_react2.useEffect)(() => {
    if (value || !storageAdapter?.load || !slug) return;
    let cancelled = false;
    setLoading(true);
    setSaveState("idle");
    setSaveMessage(null);
    Promise.resolve(storageAdapter.load(slug, adapterContext)).then((loaded) => {
      if (cancelled) return;
      const next = loaded ?? defaultValue ?? createEmptyDocument();
      past.current = [];
      future.current = [];
      setDoc(next);
      latestDoc.current = next;
      setSelectedId(null);
      onLoad?.(next);
    }).catch((error) => {
      if (cancelled) return;
      setSaveState("error");
      setSaveMessage("Load failed");
      reportStorageError(error, "load");
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [
    adapterContext,
    defaultValue,
    onLoad,
    reportStorageError,
    slug,
    storageAdapter,
    value
  ]);
  (0, import_react2.useEffect)(() => {
    return () => clearTimeout(autoSaveTimer.current);
  }, []);
  const commit = (0, import_react2.useCallback)(
    (next) => {
      past.current.push(doc);
      if (past.current.length > 50) past.current.shift();
      future.current = [];
      setDoc(next);
      latestDoc.current = next;
      onChange?.(next);
      scheduleAutoSave(next);
    },
    [doc, onChange, scheduleAutoSave]
  );
  const undo = (0, import_react2.useCallback)(() => {
    const prev = past.current.pop();
    if (!prev) return;
    future.current.push(doc);
    setDoc(prev);
    latestDoc.current = prev;
    onChange?.(prev);
    scheduleAutoSave(prev);
  }, [doc, onChange, scheduleAutoSave]);
  const redo = (0, import_react2.useCallback)(() => {
    const next = future.current.pop();
    if (!next) return;
    past.current.push(doc);
    setDoc(next);
    latestDoc.current = next;
    onChange?.(next);
    scheduleAutoSave(next);
  }, [doc, onChange, scheduleAutoSave]);
  const deleteNode = (0, import_react2.useCallback)(
    (id) => {
      const [next] = removeNode(doc, id);
      commit(next);
      if (selectedId === id) setSelectedId(null);
    },
    [doc, commit, selectedId]
  );
  const duplicateNode = (0, import_react2.useCallback)(
    (id) => {
      const node = findNode(doc, id);
      const target = locateAfter(doc, id);
      if (!node || !target) return;
      const copy = cloneNode(node);
      commit(insertNode(doc, copy, target));
      setSelectedId(copy.id);
    },
    [doc, commit]
  );
  (0, import_react2.useEffect)(() => {
    const onKey = (e) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (mod && (e.key === "y" || e.key === "z" && e.shiftKey)) {
        e.preventDefault();
        redo();
      } else if ((e.key === "Delete" || e.key === "Backspace") && selectedId && !isTypingTarget(e.target)) {
        e.preventDefault();
        deleteNode(selectedId);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, undo, redo, deleteNode]);
  const clearDragState = (0, import_react2.useCallback)(() => {
    currentDrag = null;
    setDragging(false);
  }, []);
  const handleDrop = (0, import_react2.useCallback)(
    (target) => {
      if (!currentDrag) return;
      if (currentDrag.kind === "new") {
        const def = getBlock(currentDrag.blockType);
        if (!def) return;
        const node = createNode(
          def.type,
          JSON.parse(JSON.stringify(def.defaultProps ?? {})),
          def.isContainer ? [] : void 0
        );
        commit(insertNode(doc, node, target));
        setSelectedId(node.id);
      } else {
        commit(moveNode(doc, currentDrag.id, target));
      }
      clearDragState();
    },
    [doc, commit, clearDragState]
  );
  const selectAndReveal = (0, import_react2.useCallback)((id) => {
    setSelectedId(id);
    nodeRefs.current.get(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);
  const selected = selectedId ? findNode(doc, selectedId) : null;
  const selectedDef = selected ? getBlock(selected.type) : void 0;
  const exportJson = () => {
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = slug ? `${slug}.json` : "page.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const importJson = (file) => {
    file.text().then((txt) => {
      try {
        const parsed = JSON.parse(txt);
        if (isPageDocument(parsed)) {
          commit(parsed);
          setSelectedId(null);
        }
      } catch {
      }
    });
  };
  if (loading) {
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "rpb-root rpb-loading", style: { height }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("style", { dangerouslySetInnerHTML: { __html: EDITOR_CSS } }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "rpb-loading-message", children: "Loading page..." })
    ] });
  }
  const width = BREAKPOINT_WIDTH[breakpoint];
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "rpb-root", style: { height }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("style", { dangerouslySetInnerHTML: { __html: EDITOR_CSS } }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "rpb-toolbar", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "rpb-brand", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon, { name: "blocks", size: 15 }),
        brand
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "rpb-toolbar-group", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { className: "rpb-icon-btn", onClick: undo, title: "Undo (Ctrl+Z)", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon, { name: "undo" }) }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { className: "rpb-icon-btn", onClick: redo, title: "Redo (Ctrl+Shift+Z)", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon, { name: "redo" }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "rpb-toolbar-group", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { className: "rpb-icon-btn", onClick: () => fileInput.current?.click(), title: "Import JSON", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon, { name: "import" }) }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { className: "rpb-icon-btn", onClick: exportJson, title: "Export JSON", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon, { name: "export" }) }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          "input",
          {
            ref: fileInput,
            type: "file",
            accept: "application/json",
            style: { display: "none" },
            onChange: (e) => {
              const f = e.target.files?.[0];
              if (f) importJson(f);
              e.target.value = "";
            }
          }
        )
      ] }),
      !previewing && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "rpb-toolbar-group rpb-breakpoints", children: ["desktop", "tablet", "mobile"].map((bp) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        "button",
        {
          className: "rpb-breakpoint-btn" + (breakpoint === bp ? " rpb-breakpoint-btn-active" : ""),
          onClick: () => setBreakpoint(bp),
          title: bp === "desktop" ? "Desktop" : bp === "tablet" ? "Tablet (768px)" : "Mobile (375px)",
          children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon, { name: bp === "desktop" ? "monitor" : bp === "tablet" ? "tablet" : "smartphone", size: 13 })
        },
        bp
      )) }),
      !previewing && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
        "select",
        {
          className: "rpb-zoom-select",
          value: zoom,
          onChange: (e) => setZoom(Number(e.target.value)),
          title: "Zoom",
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("option", { value: 100, children: "100%" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("option", { value: 75, children: "75%" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("option", { value: 50, children: "50%" })
          ]
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "rpb-toolbar-spacer" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
        "button",
        {
          className: "rpb-btn" + (previewing ? " rpb-btn-active" : ""),
          onClick: () => {
            setPreviewing(!previewing);
            setSelectedId(null);
          },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon, { name: previewing ? "eyeOff" : "eye" }),
            previewing ? "Edit" : "Preview"
          ]
        }
      ),
      canSave && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
        "button",
        {
          className: "rpb-btn rpb-btn-primary",
          disabled: saveState === "saving",
          onClick: () => void saveDocument(doc),
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon, { name: "save" }),
            saveState === "saving" ? "Saving..." : "Save"
          ]
        }
      ),
      canSave && saveState !== "idle" && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "rpb-save-status rpb-save-status-" + saveState, children: saveMessage ?? (saveState === "saved" ? "Saved" : saveState) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "rpb-body", children: [
      !previewing && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("aside", { className: "rpb-side rpb-side-left" + (leftCollapsed ? " rpb-side-collapsed" : ""), children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "rpb-side-header", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "rpb-panel-title", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon, { name: leftMode === "elements" ? "blocks" : "layers", size: 13 }),
          leftMode === "elements" ? "Elements" : "Layers"
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "rpb-side-content", children: leftMode === "elements" ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          Palette,
          {
            search,
            onSearchChange: setSearch,
            closedCategories,
            onToggleCategory: (cat) => setClosedCategories((prev) => {
              const next = new Set(prev);
              if (next.has(cat)) next.delete(cat);
              else next.add(cat);
              return next;
            }),
            onDragChange: setDragging
          }
        ) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          Navigator,
          {
            nodes: doc.root,
            selectedId,
            onSelect: selectAndReveal,
            depth: 0
          }
        ) }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "rpb-side-dock", children: leftCollapsed ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "rpb-collapse-rail", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
            "button",
            {
              className: "rpb-icon-btn" + (leftMode === "elements" ? " rpb-icon-btn-active" : ""),
              title: "Elements",
              onClick: () => {
                setLeftMode("elements");
                setLeftCollapsed(false);
              },
              children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon, { name: "blocks" })
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
            "button",
            {
              className: "rpb-icon-btn" + (leftMode === "layers" ? " rpb-icon-btn-active" : ""),
              title: "Layers",
              onClick: () => {
                setLeftMode("layers");
                setLeftCollapsed(false);
              },
              children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon, { name: "layers" })
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { className: "rpb-icon-btn", title: "Expand panel", onClick: () => setLeftCollapsed(false), children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon, { name: "panelLeftOpen" }) })
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
            "button",
            {
              className: "rpb-icon-btn" + (leftMode === "elements" ? " rpb-icon-btn-active" : ""),
              title: "Elements",
              onClick: () => setLeftMode("elements"),
              children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon, { name: "blocks" })
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
            "button",
            {
              className: "rpb-icon-btn" + (leftMode === "layers" ? " rpb-icon-btn-active" : ""),
              title: "Layers",
              onClick: () => setLeftMode("layers"),
              children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon, { name: "layers" })
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { className: "rpb-icon-btn", title: "Collapse panel", onClick: () => setLeftCollapsed(true), children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon, { name: "panelLeftClose" }) })
        ] }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        "main",
        {
          className: "rpb-canvas" + (previewing ? " rpb-canvas-preview" : ""),
          onClick: () => setSelectedId(null),
          children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
            "div",
            {
              className: "rpb-canvas-frame",
              style: { maxWidth: width },
              children: [
                !previewing && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "rpb-canvas-chrome", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "rpb-canvas-chrome-dots", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "rpb-canvas-chrome-dot" }),
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "rpb-canvas-chrome-dot" }),
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "rpb-canvas-chrome-dot" })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "rpb-canvas-chrome-url", children: previewUrl ?? (slug ? `/${slug}` : "/") })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                  "div",
                  {
                    className: "rpb-page",
                    style: { transform: zoom !== 100 ? `scale(${zoom / 100})` : void 0 },
                    onDragOver: (e) => {
                      if (!currentDrag) return;
                      e.preventDefault();
                      e.stopPropagation();
                      setDragging(true);
                    },
                    onDrop: (e) => {
                      if (!currentDrag) return;
                      e.preventDefault();
                      e.stopPropagation();
                      handleDrop({ parentId: null, index: doc.root.length });
                    },
                    children: previewing ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(RenderPlain, { nodes: doc.root }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                        NodeList,
                        {
                          nodes: doc.root,
                          parentId: null,
                          selectedId,
                          onSelect: setSelectedId,
                          onDrop: handleDrop,
                          onDragChange: setDragging,
                          dragging,
                          doc,
                          commit,
                          onDuplicate: duplicateNode,
                          onDelete: deleteNode,
                          nodeRefs
                        }
                      ),
                      doc.root.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "rpb-empty", children: [
                        "Drag a ",
                        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("strong", { children: "Section" }),
                        " from the left panel to start building"
                      ] })
                    ] })
                  }
                )
              ]
            }
          )
        }
      ),
      !previewing && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("aside", { className: "rpb-side rpb-side-right" + (rightCollapsed ? " rpb-side-collapsed" : ""), children: rightCollapsed ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "rpb-collapse-rail", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { className: "rpb-icon-btn", title: "Expand panel", onClick: () => setRightCollapsed(false), children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon, { name: "panelRightOpen" }) }) }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "rpb-side-header", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "rpb-panel-title", children: [
            selectedDef?.icon ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: selectedDef.icon }) : null,
            selectedDef ? selectedDef.label : "Settings"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { className: "rpb-icon-btn", title: "Collapse panel", onClick: () => setRightCollapsed(true), children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon, { name: "panelRightClose" }) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "rpb-side-content", children: selected && selectedDef ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          Inspector,
          {
            node: selected,
            def: selectedDef,
            tab: inspectorTab,
            onTabChange: setInspectorTab,
            onPatch: (patch) => commit(updateNodeProps(doc, selected.id, patch)),
            onDelete: () => deleteNode(selected.id),
            onDuplicate: () => duplicateNode(selected.id),
            mediaAdapter,
            mediaContext: { slug, document: doc }
          }
        ) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "rpb-inspector-empty", children: "Select a block on the canvas to edit its settings" }) })
      ] }) })
    ] })
  ] });
}
function Palette({
  search,
  onSearchChange,
  closedCategories,
  onToggleCategory,
  onDragChange
}) {
  const grouped = (0, import_react2.useMemo)(() => getBlocksByCategory(), []);
  const query = search.trim().toLowerCase();
  const filtered = (0, import_react2.useMemo)(() => {
    if (!query) return grouped;
    const out = {};
    for (const [cat, defs] of Object.entries(grouped)) {
      const hits = defs.filter((d) => d.label.toLowerCase().includes(query));
      if (hits.length) out[cat] = hits;
    }
    return out;
  }, [grouped, query]);
  const categories = Object.entries(filtered);
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "rpb-search", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "rpb-search-icon", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon, { name: "search", size: 13 }) }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        "input",
        {
          className: "rpb-search-input",
          type: "text",
          placeholder: "Search widgets...",
          value: search,
          onChange: (e) => onSearchChange(e.target.value)
        }
      )
    ] }),
    categories.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "rpb-palette-empty", children: [
      'No widgets match "',
      search,
      '"'
    ] }),
    categories.map(([cat, defs]) => {
      const open = query.length > 0 || !closedCategories.has(cat);
      return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "rpb-category", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
          "button",
          {
            type: "button",
            className: "rpb-category-header" + (open ? " rpb-category-open" : ""),
            onClick: () => onToggleCategory(cat),
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: cat }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon, { name: "chevronRight", size: 12, className: "rpb-category-chevron" })
            ]
          }
        ),
        open && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "rpb-category-body", children: defs.map((def) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
          "div",
          {
            className: "rpb-palette-item",
            draggable: true,
            onDragStart: (e) => {
              currentDrag = { kind: "new", blockType: def.type };
              e.dataTransfer.effectAllowed = "copy";
              onDragChange(true);
            },
            onDragEnd: () => {
              window.setTimeout(() => {
                currentDrag = null;
                onDragChange(false);
              }, 0);
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "rpb-palette-icon", children: def.icon ?? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon, { name: "blocks", size: 17 }) }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: def.label })
            ]
          },
          def.type
        )) })
      ] }, cat);
    })
  ] });
}
function Navigator({
  nodes,
  selectedId,
  onSelect,
  depth
}) {
  if (depth === 0 && nodes.length === 0) {
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "rpb-navigator-empty", children: "Nothing on this page yet. Drag a block in from Elements." });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_jsx_runtime3.Fragment, { children: nodes.map((node) => {
    const def = getBlock(node.type);
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
        "div",
        {
          className: "rpb-navigator-row" + (selectedId === node.id ? " rpb-navigator-row-selected" : ""),
          style: { paddingLeft: 6 + depth * 16 },
          onClick: () => onSelect(node.id),
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon, { name: def?.isContainer ? "layers" : "blocks", size: 12 }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "rpb-navigator-label", children: def?.label ?? node.type })
          ]
        }
      ),
      node.children && node.children.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Navigator, { nodes: node.children, selectedId, onSelect, depth: depth + 1 })
    ] }, node.id);
  }) });
}
function NodeList(props) {
  const { nodes, parentId, onDrop, dragging } = props;
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(DropZone, { target: { parentId, index: 0 }, onDrop, visible: dragging }),
    nodes.map((node, i) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_react2.default.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(NodeFrame, { ...props, node }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        DropZone,
        {
          target: { parentId, index: i + 1 },
          onDrop,
          visible: dragging
        }
      )
    ] }, node.id))
  ] });
}
function NodeFrame(props) {
  const { node, selectedId, onSelect, onDrop, onDragChange, dragging, onDuplicate, onDelete, nodeRefs } = props;
  const def = getBlock(node.type);
  if (!def) {
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "rpb-unknown", children: [
      "Unknown block: ",
      node.type
    ] });
  }
  const isSelected = selectedId === node.id;
  const children = def.isContainer ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(NodeList, { ...props, nodes: node.children ?? [], parentId: node.id }) : void 0;
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
    "div",
    {
      ref: (el) => {
        if (el) nodeRefs.current.set(node.id, el);
        else nodeRefs.current.delete(node.id);
      },
      className: "rpb-node" + (isSelected ? " rpb-node-selected" : "") + (def.isContainer ? " rpb-node-container" : ""),
      onClick: (e) => {
        e.stopPropagation();
        onSelect(node.id);
      },
      onDragOver: (e) => {
        if (!currentDrag) return;
        e.preventDefault();
        e.stopPropagation();
        onDragChange(true);
      },
      onDrop: (e) => {
        if (!currentDrag) return;
        e.preventDefault();
        e.stopPropagation();
        onDrop({ parentId: node.id, index: (node.children ?? []).length });
      },
      draggable: true,
      onDragStart: (e) => {
        e.stopPropagation();
        currentDrag = { kind: "move", id: node.id };
        e.dataTransfer.effectAllowed = "move";
        onDragChange(true);
      },
      onDragEnd: () => {
        window.setTimeout(() => {
          currentDrag = null;
          onDragChange(false);
        }, 0);
      },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "rpb-node-toolbar", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "rpb-node-toolbar-label", children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon, { name: "grip", size: 11 }),
            " ",
            def.label
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "rpb-node-toolbar-actions", children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
              "button",
              {
                type: "button",
                className: "rpb-node-toolbar-btn",
                title: "Duplicate",
                onClick: (e) => {
                  e.stopPropagation();
                  onDuplicate(node.id);
                },
                children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon, { name: "copy", size: 12 })
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
              "button",
              {
                type: "button",
                className: "rpb-node-toolbar-btn",
                title: "Delete",
                onClick: (e) => {
                  e.stopPropagation();
                  onDelete(node.id);
                },
                children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon, { name: "trash", size: 12 })
              }
            )
          ] })
        ] }),
        def.render({ node, children, isEditing: true }),
        def.isContainer && def.showEmptyContainerHint !== false && (node.children ?? []).length === 0 && !dragging && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "rpb-container-hint", children: "Drop blocks here" })
      ]
    }
  );
}
function DropZone({
  target,
  onDrop,
  visible
}) {
  const [over, setOver] = (0, import_react2.useState)(false);
  if (!visible) return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "rpb-dropzone-collapsed" });
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
    "div",
    {
      className: "rpb-dropzone" + (over ? " rpb-dropzone-over" : ""),
      onDragOver: (e) => {
        e.preventDefault();
        e.stopPropagation();
        setOver(true);
      },
      onDragLeave: () => setOver(false),
      onDrop: (e) => {
        e.preventDefault();
        e.stopPropagation();
        setOver(false);
        onDrop(target);
      }
    }
  );
}
function RenderPlain({ nodes }) {
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_jsx_runtime3.Fragment, { children: nodes.map((n) => {
    const def = getBlock(n.type);
    if (!def) return null;
    const children = n.children ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(RenderPlain, { nodes: n.children }) : void 0;
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_react2.default.Fragment, { children: def.render({ node: n, children, isEditing: false }) }, n.id);
  }) });
}
var TAB_LABELS = {
  content: "Content",
  style: "Style",
  advanced: "Advanced"
};
function Inspector({
  node,
  def,
  tab,
  onTabChange,
  onPatch,
  onDelete,
  onDuplicate,
  mediaAdapter,
  mediaContext
}) {
  const allFields = def.fields ?? [];
  const byTab = (t) => allFields.filter((f) => (f.group ?? "content") === t);
  const visible = byTab(tab);
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "rpb-inspector-tabs", children: ["content", "style", "advanced"].map((t) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
      "button",
      {
        className: "rpb-inspector-tab" + (tab === t ? " rpb-inspector-tab-active" : ""),
        onClick: () => onTabChange(t),
        children: TAB_LABELS[t]
      },
      t
    )) }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "rpb-inspector-actions", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("button", { className: "rpb-btn", onClick: onDuplicate, children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon, { name: "copy", size: 12 }),
        " Duplicate"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("button", { className: "rpb-btn rpb-btn-danger", onClick: onDelete, children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon, { name: "trash", size: 12 }),
        " Delete"
      ] })
    ] }),
    visible.map((field) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "rpb-field", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("label", { className: "rpb-field-label", children: field.label }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        Field,
        {
          field,
          value: node.props[field.name],
          onChange: (v) => onPatch({ [field.name]: v }),
          mediaAdapter,
          mediaContext: { ...mediaContext, node }
        }
      ),
      field.helperText && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "rpb-field-help", children: field.helperText })
    ] }, field.name)),
    visible.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "rpb-inspector-empty", children: allFields.length === 0 ? "This block has no settings" : `No ${TAB_LABELS[tab].toLowerCase()} settings for this block` }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "rpb-inspector-footer", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "rpb-inspector-id", children: [
      "#",
      node.id.slice(0, 8)
    ] }) })
  ] });
}
function isTypingTarget(t) {
  const el = t;
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}
function locateAfter(doc, id) {
  const search = (nodes, parentId) => {
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].id === id) return { parentId, index: i + 1 };
      const kids = nodes[i].children;
      if (kids) {
        const hit = search(kids, nodes[i].id);
        if (hit) return hit;
      }
    }
    return null;
  };
  return search(doc.root, null);
}
function getAutoSaveDelay(autoSave) {
  if (!autoSave) return null;
  if (autoSave === true) return 1200;
  return Math.max(0, autoSave.delayMs ?? 1200);
}
function describeSaveResult(result) {
  if (result?.updatedAt) return "Saved";
  if (result?.url) return "Saved";
  return "Saved";
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Field,
  PageBuilder
});
//# sourceMappingURL=editor.cjs.map