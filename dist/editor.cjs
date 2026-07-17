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
.rpb-root{display:flex;flex-direction:column;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;font-size:13px;color:#1e293b;background:#eef1f5;overflow:hidden;border:1px solid #d8dee6}
.rpb-root *,.rpb-root *::before,.rpb-root *::after{box-sizing:border-box}

/* Toolbar */
.rpb-toolbar{display:flex;align-items:center;gap:12px;padding:8px 14px;background:#ffffff;border-bottom:1px solid #d8dee6;flex-shrink:0}
.rpb-brand{font-weight:700;letter-spacing:.02em;margin-right:8px;color:#0f172a}
.rpb-toolbar-group{display:flex;gap:6px}
.rpb-toolbar-spacer{flex:1}
.rpb-btn{appearance:none;border:1px solid #cbd5e1;background:#fff;border-radius:6px;padding:6px 12px;font-size:12.5px;font-weight:500;color:#334155;cursor:pointer;transition:background .12s,border-color .12s}
.rpb-btn:hover{background:#f1f5f9;border-color:#94a3b8}
.rpb-btn:disabled{opacity:.6;cursor:not-allowed}
.rpb-btn:disabled:hover{background:inherit;border-color:#cbd5e1}
.rpb-btn-active{background:#eff6ff;border-color:#2563eb;color:#1d4ed8}
.rpb-btn-primary{background:#2563eb;border-color:#2563eb;color:#fff}
.rpb-btn-primary:hover{background:#1d4ed8}
.rpb-btn-danger{color:#b91c1c;border-color:#fecaca}
.rpb-btn-danger:hover{background:#fef2f2;border-color:#f87171}
.rpb-save-status{font-size:12px;color:#64748b}
.rpb-save-status-saved{color:#15803d}
.rpb-save-status-error{color:#b91c1c}

/* Layout */
.rpb-body{display:flex;flex:1;min-height:0}
.rpb-loading{align-items:center;justify-content:center}
.rpb-loading-message{color:#64748b;font-size:14px}
.rpb-palette,.rpb-inspector{width:250px;flex-shrink:0;background:#ffffff;overflow-y:auto;padding:14px}
.rpb-palette{border-right:1px solid #d8dee6}
.rpb-inspector{border-left:1px solid #d8dee6}
.rpb-panel-title{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#64748b;margin-bottom:12px}
.rpb-category{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin:14px 0 8px}
.rpb-palette-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.rpb-palette-item{display:flex;flex-direction:column;align-items:center;gap:6px;padding:12px 6px;border:1px solid #e2e8f0;border-radius:8px;background:#fbfcfe;cursor:grab;text-align:center;font-size:12px;color:#334155;transition:border-color .12s,box-shadow .12s}
.rpb-palette-item:hover{border-color:#2563eb;box-shadow:0 1px 4px rgba(37,99,235,.15)}
.rpb-palette-item:active{cursor:grabbing}
.rpb-palette-icon{font-size:17px;line-height:1}

/* Canvas */
.rpb-canvas{flex:1;overflow-y:auto;padding:28px}
.rpb-canvas-preview{padding:0}
.rpb-page{background:#fff;min-height:100%;box-shadow:0 1px 8px rgba(15,23,42,.09);border-radius:4px;overflow:hidden}
.rpb-canvas-preview .rpb-page{border-radius:0;box-shadow:none}
.rpb-empty{padding:80px 24px;text-align:center;color:#94a3b8;font-size:14px}

/* Nodes */
.rpb-node{position:relative;outline:1px dashed transparent;outline-offset:-1px;transition:outline-color .12s;cursor:pointer}
.rpb-node:hover{outline-color:#93c5fd}
.rpb-node-selected{outline:2px solid #2563eb !important;outline-offset:-2px}
.rpb-node-label{display:none;position:absolute;top:0;left:0;z-index:5;background:#2563eb;color:#fff;font-size:10px;font-weight:600;padding:2px 7px;border-radius:0 0 6px 0;letter-spacing:.03em;pointer-events:none}
.rpb-node-selected>.rpb-node-label,.rpb-node:hover>.rpb-node-label{display:block}
.rpb-node-container{min-height:36px}
.rpb-container-hint{padding:18px;text-align:center;color:#94a3b8;font-size:12px;border:1px dashed #cbd5e1;border-radius:6px;margin:6px}
.rpb-unknown{padding:12px;background:#fef2f2;color:#b91c1c;font-size:12px;border:1px dashed #fca5a5}

/* Drop zones */
.rpb-dropzone-collapsed{height:0}
.rpb-dropzone{height:14px;margin:1px 0;border-radius:4px;background:rgba(37,99,235,.07);outline:1px dashed rgba(37,99,235,.35);outline-offset:-1px;transition:height .1s,background .1s}
.rpb-dropzone-over{height:30px;background:rgba(37,99,235,.18);outline:2px solid #2563eb}

/* Inspector */
.rpb-inspector-empty{color:#94a3b8;font-size:12.5px;padding:12px 0;line-height:1.6}
.rpb-inspector-actions{display:flex;gap:6px;margin-bottom:14px}
.rpb-field{margin-bottom:13px}
.rpb-field-label{display:block;font-size:11.5px;font-weight:600;color:#475569;margin-bottom:5px}
.rpb-field-help{margin-top:5px;color:#94a3b8;font-size:11.5px;line-height:1.45}
.rpb-field-error{margin-top:5px;color:#b91c1c;font-size:11.5px;line-height:1.45}
.rpb-input{width:100%;border:1px solid #cbd5e1;border-radius:6px;padding:7px 9px;font-size:12.5px;color:#1e293b;background:#fff;font-family:inherit}
.rpb-input:focus{outline:2px solid #bfdbfe;border-color:#2563eb}
.rpb-textarea{resize:vertical;line-height:1.5}
.rpb-range-row{display:flex;align-items:center;gap:10px}
.rpb-range-row input[type=range]{flex:1;accent-color:#2563eb}
.rpb-range-value{font-size:12px;color:#475569;min-width:32px;text-align:right;font-variant-numeric:tabular-nums}
.rpb-color-row{display:flex;align-items:center;gap:8px}
.rpb-color-row input[type=color]{width:34px;height:32px;padding:2px;border:1px solid #cbd5e1;border-radius:6px;background:#fff;cursor:pointer;flex-shrink:0}
.rpb-switch{display:flex;align-items:center;gap:8px;font-size:12.5px;color:#334155;cursor:pointer}
.rpb-switch input{accent-color:#2563eb;width:16px;height:16px}
.rpb-image-field{display:flex;flex-direction:column;gap:8px}
.rpb-media-actions{display:flex;gap:6px}
.rpb-image-preview{width:100%;max-height:140px;object-fit:cover;border:1px solid #e2e8f0;border-radius:6px;background:#f8fafc}
`;

// src/editor/PageBuilder.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
var currentDrag = null;
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
  height = "100vh"
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
  const past = (0, import_react2.useRef)([]);
  const future = (0, import_react2.useRef)([]);
  const fileInput = (0, import_react2.useRef)(null);
  const autoSaveTimer = (0, import_react2.useRef)(void 0);
  const latestDoc = (0, import_react2.useRef)(doc);
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
        const [next] = removeNode(doc, selectedId);
        commit(next);
        setSelectedId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doc, selectedId, undo, redo, commit]);
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
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "rpb-root rpb-loading", style: { height }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("style", { dangerouslySetInnerHTML: { __html: EDITOR_CSS } }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "rpb-loading-message", children: "Loading page..." })
    ] });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "rpb-root", style: { height }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("style", { dangerouslySetInnerHTML: { __html: EDITOR_CSS } }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "rpb-toolbar", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "rpb-brand", children: "Page Builder" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "rpb-toolbar-group", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "rpb-btn", onClick: undo, title: "Undo (Ctrl+Z)", children: "Undo" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "rpb-btn", onClick: redo, title: "Redo (Ctrl+Y)", children: "Redo" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "rpb-toolbar-group", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "rpb-btn", onClick: () => fileInput.current?.click(), children: "Import JSON" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "rpb-btn", onClick: exportJson, children: "Export JSON" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
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
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "rpb-toolbar-spacer" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        "button",
        {
          className: "rpb-btn" + (previewing ? " rpb-btn-active" : ""),
          onClick: () => {
            setPreviewing(!previewing);
            setSelectedId(null);
          },
          children: previewing ? "Edit" : "Preview"
        }
      ),
      canSave && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        "button",
        {
          className: "rpb-btn rpb-btn-primary",
          disabled: saveState === "saving",
          onClick: () => void saveDocument(doc),
          children: saveState === "saving" ? "Saving..." : "Save"
        }
      ),
      canSave && saveState !== "idle" && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "rpb-save-status rpb-save-status-" + saveState, children: saveMessage ?? (saveState === "saved" ? "Saved" : saveState) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "rpb-body", children: [
      !previewing && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("aside", { className: "rpb-palette", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Palette, { onDragChange: setDragging }) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        "main",
        {
          className: "rpb-canvas" + (previewing ? " rpb-canvas-preview" : ""),
          onClick: () => setSelectedId(null),
          children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "div",
            {
              className: "rpb-page",
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
              children: previewing ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(RenderPlain, { nodes: doc.root }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
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
                    commit
                  }
                ),
                doc.root.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "rpb-empty", children: [
                  "Drag a ",
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { children: "Section" }),
                  " from the left panel to start building"
                ] })
              ] })
            }
          )
        }
      ),
      !previewing && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("aside", { className: "rpb-inspector", children: selected && selectedDef ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        Inspector,
        {
          node: selected,
          def: selectedDef,
          onPatch: (patch) => commit(updateNodeProps(doc, selected.id, patch)),
          onDelete: () => {
            const [next] = removeNode(doc, selected.id);
            commit(next);
            setSelectedId(null);
          },
          onDuplicate: () => {
            const copy = cloneNode(selected);
            const target = locateAfter(doc, selected.id);
            if (target) {
              commit(insertNode(doc, copy, target));
              setSelectedId(copy.id);
            }
          },
          mediaAdapter,
          mediaContext: { slug, document: doc }
        }
      ) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "rpb-inspector-empty", children: "Select a block on the canvas to edit its settings" }) })
    ] })
  ] });
}
function Palette({ onDragChange }) {
  const grouped = (0, import_react2.useMemo)(() => getBlocksByCategory(), []);
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "rpb-panel-title", children: "Blocks" }),
    Object.entries(grouped).map(([cat, defs]) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "rpb-category", children: cat }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "rpb-palette-grid", children: defs.map((def) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
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
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "rpb-palette-icon", children: def.icon ?? "[]" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: def.label })
          ]
        },
        def.type
      )) })
    ] }, cat))
  ] });
}
function NodeList(props) {
  const { nodes, parentId, onDrop, dragging } = props;
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(DropZone, { target: { parentId, index: 0 }, onDrop, visible: dragging }),
    nodes.map((node, i) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_react2.default.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(NodeFrame, { ...props, node }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
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
  const { node, selectedId, onSelect, onDrop, onDragChange, dragging, doc, commit } = props;
  const def = getBlock(node.type);
  if (!def) {
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "rpb-unknown", children: [
      "Unknown block: ",
      node.type
    ] });
  }
  const isSelected = selectedId === node.id;
  const children = def.isContainer ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(NodeList, { ...props, nodes: node.children ?? [], parentId: node.id }) : void 0;
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
    "div",
    {
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
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "rpb-node-label", children: def.label }),
        def.render({ node, children, isEditing: true }),
        def.isContainer && def.showEmptyContainerHint !== false && (node.children ?? []).length === 0 && !dragging && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "rpb-container-hint", children: "Drop blocks here" })
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
  if (!visible) return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "rpb-dropzone-collapsed" });
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
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
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_jsx_runtime2.Fragment, { children: nodes.map((n) => {
    const def = getBlock(n.type);
    if (!def) return null;
    const children = n.children ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(RenderPlain, { nodes: n.children }) : void 0;
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_react2.default.Fragment, { children: def.render({ node: n, children, isEditing: false }) }, n.id);
  }) });
}
function Inspector({
  node,
  def,
  onPatch,
  onDelete,
  onDuplicate,
  mediaAdapter,
  mediaContext
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "rpb-panel-title", children: [
      def.icon ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { children: [
        def.icon,
        " "
      ] }) : null,
      def.label
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "rpb-inspector-actions", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "rpb-btn", onClick: onDuplicate, children: "Duplicate" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "rpb-btn rpb-btn-danger", onClick: onDelete, children: "Delete" })
    ] }),
    (def.fields ?? []).map((field) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "rpb-field", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { className: "rpb-field-label", children: field.label }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        Field,
        {
          field,
          value: node.props[field.name],
          onChange: (v) => onPatch({ [field.name]: v }),
          mediaAdapter,
          mediaContext: { ...mediaContext, node }
        }
      ),
      field.helperText && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "rpb-field-help", children: field.helperText })
    ] }, field.name)),
    (def.fields ?? []).length === 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "rpb-inspector-empty", children: "This block has no settings" })
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