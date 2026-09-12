"use client";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  BlockDefinition,
  FieldGroup,
  MaybePromise,
  MediaStorageAdapter,
  MediaUploadContext,
  PageDocument,
  PageNode,
  PageSaveResult,
  PageStorageAdapter,
  PageStorageContext,
} from "../types";
import { isPageDocument } from "../types";
import { getBlock, getBlocksByCategory } from "../registry";
import {
  createEmptyDocument,
  createNode,
  cloneNode,
  findNode,
  insertNode,
  moveNode,
  removeNode,
  updateNodeProps,
  type DropTarget,
} from "../tree";
import { Field } from "./fields";
import { EDITOR_CSS } from "./styles";
import { Icon } from "./icons";

/* ------------------------------------------------------------------ */
/* Drag payload (module-level because dataTransfer is opaque on hover) */
/* ------------------------------------------------------------------ */

type DragPayload =
  | { kind: "new"; blockType: string }
  | { kind: "move"; id: string };

let currentDrag: DragPayload | null = null;

type Breakpoint = "desktop" | "tablet" | "mobile";
const BREAKPOINT_WIDTH: Record<Breakpoint, number | undefined> = {
  desktop: undefined,
  tablet: 768,
  mobile: 375,
};

type LeftMode = "elements" | "layers";

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

export interface PageBuilderProps {
  /** Initial document (uncontrolled) or current document (controlled with onChange). */
  value?: PageDocument;
  /** Initial document used when `value` is not provided. */
  defaultValue?: PageDocument;
  /** Slug passed to storage/media adapters. Required when using storageAdapter save/load. */
  slug?: string;
  /** Optional persistence adapter. Save to a DB, CMS, flat files, edge KV, or an API. */
  storageAdapter?: PageStorageAdapter;
  /** Extra context passed through to storageAdapter calls. */
  storageContext?: PageStorageContext;
  /** Optional media adapter used by image fields. */
  mediaAdapter?: MediaStorageAdapter;
  /** Debounced autosave. Requires onSave or storageAdapter + slug. Defaults to off. */
  autoSave?: boolean | { delayMs?: number };
  /** Called on every document change. */
  onChange?: (doc: PageDocument) => void;
  /** Called when the user hits Save. A Save button appears when this or storageAdapter+slug is provided. */
  onSave?: (doc: PageDocument) => MaybePromise<void | PageSaveResult>;
  /** Called after a storageAdapter load succeeds. */
  onLoad?: (doc: PageDocument) => void;
  /** Called when storage load/save fails. */
  onError?: (error: unknown, phase: "load" | "save") => void;
  /** Editor height. Defaults to 100vh. */
  height?: number | string;
  /** Shown in the canvas browser-chrome address pill, e.g. "/about". */
  previewUrl?: string;
  /** Editor brand label in the toolbar. Defaults to "Page Builder". */
  brand?: string;
  /** Hide the brand label — use when the host supplies its own via toolbarStart. */
  hideBrand?: boolean;
  /** Hide the built-in Save button — use when the host supplies its own actions. */
  hideSave?: boolean;
  /** Host content rendered at the start of the toolbar (page title, back link…). */
  toolbarStart?: React.ReactNode;
  /** Host content rendered at the end of the toolbar (publish actions…). */
  toolbarEnd?: React.ReactNode;
}

export function PageBuilder({
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
  brand = "Page Builder",
  hideBrand = false,
  hideSave = false,
  toolbarStart,
  toolbarEnd,
}: PageBuilderProps) {
  const [doc, setDoc] = useState<PageDocument>(
    value ?? defaultValue ?? createEmptyDocument()
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [breakpoint, setBreakpoint] = useState<Breakpoint>("desktop");
  const [zoom, setZoom] = useState(100);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [leftMode, setLeftMode] = useState<LeftMode>("elements");
  const [inspectorTab, setInspectorTab] = useState<FieldGroup>("content");
  const [search, setSearch] = useState("");
  const [closedCategories, setClosedCategories] = useState<Set<string>>(new Set());
  const past = useRef<PageDocument[]>([]);
  const future = useRef<PageDocument[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const latestDoc = useRef(doc);
  const nodeRefs = useRef<Map<string, HTMLElement>>(new Map());

  const adapterContext = useMemo<PageStorageContext>(
    () => ({ ...storageContext, slug }),
    [storageContext, slug]
  );

  const canSave = Boolean(onSave || (storageAdapter && slug));

  useEffect(() => {
    latestDoc.current = doc;
  }, [doc]);

  // Controlled mode support.
  useEffect(() => {
    if (value) {
      setDoc(value);
      latestDoc.current = value;
    }
  }, [value]);

  // Reset the inspector back to Content whenever the selection changes.
  useEffect(() => {
    setInspectorTab("content");
  }, [selectedId]);

  const reportStorageError = useCallback(
    (error: unknown, phase: "load" | "save") => {
      onError?.(error, phase);
      if (!onError && typeof console !== "undefined") {
        console.error(`PageBuilder ${phase} failed`, error);
      }
    },
    [onError]
  );

  const saveDocument = useCallback(
    async (next: PageDocument = latestDoc.current) => {
      if (!canSave) return;
      setSaveState("saving");
      setSaveMessage(null);
      try {
        let result: void | PageSaveResult = undefined;
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

  const scheduleAutoSave = useCallback(
    (next: PageDocument) => {
      const delay = getAutoSaveDelay(autoSave);
      if (delay == null || !canSave) return;
      clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => {
        void saveDocument(next);
      }, delay);
    },
    [autoSave, canSave, saveDocument]
  );

  useEffect(() => {
    if (value || !storageAdapter?.load || !slug) return;
    let cancelled = false;
    setLoading(true);
    setSaveState("idle");
    setSaveMessage(null);

    Promise.resolve(storageAdapter.load(slug, adapterContext))
      .then((loaded) => {
        if (cancelled) return;
        const next = loaded ?? defaultValue ?? createEmptyDocument();
        past.current = [];
        future.current = [];
        setDoc(next);
        latestDoc.current = next;
        setSelectedId(null);
        onLoad?.(next);
      })
      .catch((error) => {
        if (cancelled) return;
        setSaveState("error");
        setSaveMessage("Load failed");
        reportStorageError(error, "load");
      })
      .finally(() => {
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
    value,
  ]);

  useEffect(() => {
    return () => clearTimeout(autoSaveTimer.current);
  }, []);

  const commit = useCallback(
    (next: PageDocument) => {
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

  const undo = useCallback(() => {
    const prev = past.current.pop();
    if (!prev) return;
    future.current.push(doc);
    setDoc(prev);
    latestDoc.current = prev;
    onChange?.(prev);
    scheduleAutoSave(prev);
  }, [doc, onChange, scheduleAutoSave]);

  const redo = useCallback(() => {
    const next = future.current.pop();
    if (!next) return;
    past.current.push(doc);
    setDoc(next);
    latestDoc.current = next;
    onChange?.(next);
    scheduleAutoSave(next);
  }, [doc, onChange, scheduleAutoSave]);

  const deleteNode = useCallback(
    (id: string) => {
      const [next] = removeNode(doc, id);
      commit(next);
      if (selectedId === id) setSelectedId(null);
    },
    [doc, commit, selectedId]
  );

  const duplicateNode = useCallback(
    (id: string) => {
      const node = findNode(doc, id);
      const target = locateAfter(doc, id);
      if (!node || !target) return;
      const copy = cloneNode(node);
      commit(insertNode(doc, copy, target));
      setSelectedId(copy.id);
    },
    [doc, commit]
  );

  // Keyboard shortcuts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (mod && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
      } else if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedId &&
        !isTypingTarget(e.target)
      ) {
        e.preventDefault();
        deleteNode(selectedId);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, undo, redo, deleteNode]);

  const clearDragState = useCallback(() => {
    currentDrag = null;
    setDragging(false);
  }, []);

  const handleDrop = useCallback(
    (target: DropTarget) => {
      if (!currentDrag) return;
      if (currentDrag.kind === "new") {
        const def = getBlock(currentDrag.blockType);
        if (!def) return;
        const node = createNode(
          def.type,
          JSON.parse(JSON.stringify(def.defaultProps ?? {})),
          def.isContainer ? [] : undefined
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

  const selectAndReveal = useCallback((id: string) => {
    setSelectedId(id);
    nodeRefs.current.get(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const selected = selectedId ? findNode(doc, selectedId) : null;
  const selectedDef = selected ? getBlock(selected.type) : undefined;

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = slug ? `${slug}.json` : "page.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importJson = (file: File) => {
    file.text().then((txt) => {
      try {
        const parsed = JSON.parse(txt);
        if (isPageDocument(parsed)) {
          commit(parsed);
          setSelectedId(null);
        }
      } catch {
        // Invalid file: leave the current document untouched.
      }
    });
  };

  if (loading) {
    return (
      <div className="rpb-root rpb-loading" style={{ height }}>
        <style dangerouslySetInnerHTML={{ __html: EDITOR_CSS }} />
        <div className="rpb-loading-message">Loading page...</div>
      </div>
    );
  }

  const width = BREAKPOINT_WIDTH[breakpoint];

  return (
    <div className="rpb-root" style={{ height }}>
      <style dangerouslySetInnerHTML={{ __html: EDITOR_CSS }} />

      <div className="rpb-toolbar">
        {!hideBrand && (
          <span className="rpb-brand">
            <Icon name="blocks" size={15} />
            {brand}
          </span>
        )}
        {toolbarStart}

        <div className="rpb-toolbar-group">
          <button className="rpb-icon-btn" onClick={undo} title="Undo (Ctrl+Z)">
            <Icon name="undo" />
          </button>
          <button className="rpb-icon-btn" onClick={redo} title="Redo (Ctrl+Shift+Z)">
            <Icon name="redo" />
          </button>
        </div>

        <div className="rpb-toolbar-group">
          <button className="rpb-icon-btn" onClick={() => fileInput.current?.click()} title="Import JSON">
            <Icon name="import" />
          </button>
          <button className="rpb-icon-btn" onClick={exportJson} title="Export JSON">
            <Icon name="export" />
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importJson(f);
              e.target.value = "";
            }}
          />
        </div>

        {!previewing && (
          <div className="rpb-toolbar-group rpb-breakpoints">
            {(["desktop", "tablet", "mobile"] as Breakpoint[]).map((bp) => (
              <button
                key={bp}
                className={"rpb-breakpoint-btn" + (breakpoint === bp ? " rpb-breakpoint-btn-active" : "")}
                onClick={() => setBreakpoint(bp)}
                title={bp === "desktop" ? "Desktop" : bp === "tablet" ? "Tablet (768px)" : "Mobile (375px)"}
              >
                <Icon name={bp === "desktop" ? "monitor" : bp === "tablet" ? "tablet" : "smartphone"} size={13} />
              </button>
            ))}
          </div>
        )}

        {!previewing && (
          <select
            className="rpb-zoom-select"
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            title="Zoom"
          >
            <option value={100}>100%</option>
            <option value={75}>75%</option>
            <option value={50}>50%</option>
          </select>
        )}

        <div className="rpb-toolbar-spacer" />

        <button
          className={"rpb-btn" + (previewing ? " rpb-btn-active" : "")}
          onClick={() => {
            setPreviewing(!previewing);
            setSelectedId(null);
          }}
        >
          <Icon name={previewing ? "eyeOff" : "eye"} />
          {previewing ? "Edit" : "Preview"}
        </button>
        {canSave && !hideSave && (
          <button
            className="rpb-btn rpb-btn-primary"
            disabled={saveState === "saving"}
            onClick={() => void saveDocument(doc)}
          >
            <Icon name="save" />
            {saveState === "saving" ? "Saving..." : "Save"}
          </button>
        )}
        {canSave && saveState !== "idle" && (
          <span className={"rpb-save-status rpb-save-status-" + saveState}>
            {saveMessage ?? (saveState === "saved" ? "Saved" : saveState)}
          </span>
        )}
        {toolbarEnd}
      </div>

      <div className="rpb-body">
        {!previewing && (
          <aside className={"rpb-side rpb-side-left" + (leftCollapsed ? " rpb-side-collapsed" : "")}>
            <div className="rpb-side-header">
              <span className="rpb-panel-title">
                <Icon name={leftMode === "elements" ? "blocks" : "layers"} size={13} />
                {leftMode === "elements" ? "Elements" : "Layers"}
              </span>
            </div>
            <div className="rpb-side-content">
              {leftMode === "elements" ? (
                <Palette
                  search={search}
                  onSearchChange={setSearch}
                  closedCategories={closedCategories}
                  onToggleCategory={(cat) =>
                    setClosedCategories((prev) => {
                      const next = new Set(prev);
                      if (next.has(cat)) next.delete(cat);
                      else next.add(cat);
                      return next;
                    })
                  }
                  onDragChange={setDragging}
                />
              ) : (
                <Navigator
                  nodes={doc.root}
                  selectedId={selectedId}
                  onSelect={selectAndReveal}
                  depth={0}
                />
              )}
            </div>
            <div className="rpb-side-dock">
              {leftCollapsed ? (
                <div className="rpb-collapse-rail">
                  <button
                    className={"rpb-icon-btn" + (leftMode === "elements" ? " rpb-icon-btn-active" : "")}
                    title="Elements"
                    onClick={() => {
                      setLeftMode("elements");
                      setLeftCollapsed(false);
                    }}
                  >
                    <Icon name="blocks" />
                  </button>
                  <button
                    className={"rpb-icon-btn" + (leftMode === "layers" ? " rpb-icon-btn-active" : "")}
                    title="Layers"
                    onClick={() => {
                      setLeftMode("layers");
                      setLeftCollapsed(false);
                    }}
                  >
                    <Icon name="layers" />
                  </button>
                  <button className="rpb-icon-btn" title="Expand panel" onClick={() => setLeftCollapsed(false)}>
                    <Icon name="panelLeftOpen" />
                  </button>
                </div>
              ) : (
                <>
                  <button
                    className={"rpb-icon-btn" + (leftMode === "elements" ? " rpb-icon-btn-active" : "")}
                    title="Elements"
                    onClick={() => setLeftMode("elements")}
                  >
                    <Icon name="blocks" />
                  </button>
                  <button
                    className={"rpb-icon-btn" + (leftMode === "layers" ? " rpb-icon-btn-active" : "")}
                    title="Layers"
                    onClick={() => setLeftMode("layers")}
                  >
                    <Icon name="layers" />
                  </button>
                  <button className="rpb-icon-btn" title="Collapse panel" onClick={() => setLeftCollapsed(true)}>
                    <Icon name="panelLeftClose" />
                  </button>
                </>
              )}
            </div>
          </aside>
        )}

        <main
          className={"rpb-canvas" + (previewing ? " rpb-canvas-preview" : "")}
          onClick={() => setSelectedId(null)}
        >
          <div
            className="rpb-canvas-frame"
            style={{ maxWidth: width }}
          >
            {!previewing && (
              <div className="rpb-canvas-chrome">
                <div className="rpb-canvas-chrome-dots">
                  <span className="rpb-canvas-chrome-dot" />
                  <span className="rpb-canvas-chrome-dot" />
                  <span className="rpb-canvas-chrome-dot" />
                </div>
                <span className="rpb-canvas-chrome-url">{previewUrl ?? (slug ? `/${slug}` : "/")}</span>
              </div>
            )}
            <div
              className="rpb-page"
              style={{ transform: zoom !== 100 ? `scale(${zoom / 100})` : undefined }}
              onDragOver={(e) => {
                if (!currentDrag) return;
                e.preventDefault();
                e.stopPropagation();
                setDragging(true);
              }}
              onDrop={(e) => {
                if (!currentDrag) return;
                e.preventDefault();
                e.stopPropagation();
                handleDrop({ parentId: null, index: doc.root.length });
              }}
            >
              {previewing ? (
                <RenderPlain nodes={doc.root} />
              ) : (
                <>
                  <NodeList
                    nodes={doc.root}
                    parentId={null}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    onDrop={handleDrop}
                    onDragChange={setDragging}
                    dragging={dragging}
                    doc={doc}
                    commit={commit}
                    onDuplicate={duplicateNode}
                    onDelete={deleteNode}
                    nodeRefs={nodeRefs}
                  />
                  {doc.root.length === 0 && (
                    <div className="rpb-empty">
                      Drag a <strong>Section</strong> from the left panel to start building
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </main>

        {!previewing && (
          <aside className={"rpb-side rpb-side-right" + (rightCollapsed ? " rpb-side-collapsed" : "")}>
            {rightCollapsed ? (
              <div className="rpb-collapse-rail">
                <button className="rpb-icon-btn" title="Expand panel" onClick={() => setRightCollapsed(false)}>
                  <Icon name="panelRightOpen" />
                </button>
              </div>
            ) : (
              <>
                <div className="rpb-side-header">
                  <span className="rpb-panel-title">
                    {selectedDef?.icon ? <span>{selectedDef.icon}</span> : null}
                    {selectedDef ? selectedDef.label : "Settings"}
                  </span>
                  <button className="rpb-icon-btn" title="Collapse panel" onClick={() => setRightCollapsed(true)}>
                    <Icon name="panelRightClose" />
                  </button>
                </div>
                <div className="rpb-side-content">
                  {selected && selectedDef ? (
                    <Inspector
                      node={selected}
                      def={selectedDef}
                      tab={inspectorTab}
                      onTabChange={setInspectorTab}
                      onPatch={(patch) => commit(updateNodeProps(doc, selected.id, patch))}
                      onDelete={() => deleteNode(selected.id)}
                      onDuplicate={() => duplicateNode(selected.id)}
                      mediaAdapter={mediaAdapter}
                      mediaContext={{ slug, document: doc }}
                    />
                  ) : (
                    <div className="rpb-inspector-empty">
                      Select a block on the canvas to edit its settings
                    </div>
                  )}
                </div>
              </>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Palette                                                             */
/* ------------------------------------------------------------------ */

function Palette({
  search,
  onSearchChange,
  closedCategories,
  onToggleCategory,
  onDragChange,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  closedCategories: Set<string>;
  onToggleCategory: (cat: string) => void;
  onDragChange: (d: boolean) => void;
}) {
  const grouped = useMemo(() => getBlocksByCategory(), []);
  const query = search.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!query) return grouped;
    const out: Record<string, BlockDefinition[]> = {};
    for (const [cat, defs] of Object.entries(grouped)) {
      const hits = defs.filter((d) => d.label.toLowerCase().includes(query));
      if (hits.length) out[cat] = hits;
    }
    return out;
  }, [grouped, query]);

  const categories = Object.entries(filtered);

  return (
    <>
      <div className="rpb-search">
        <span className="rpb-search-icon">
          <Icon name="search" size={13} />
        </span>
        <input
          className="rpb-search-input"
          type="text"
          placeholder="Search widgets..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {categories.length === 0 && (
        <div className="rpb-palette-empty">No widgets match "{search}"</div>
      )}

      {categories.map(([cat, defs]) => {
        const open = query.length > 0 || !closedCategories.has(cat);
        return (
          <div className="rpb-category" key={cat}>
            <button
              type="button"
              className={"rpb-category-header" + (open ? " rpb-category-open" : "")}
              onClick={() => onToggleCategory(cat)}
            >
              <span>{cat}</span>
              <Icon name="chevronRight" size={12} className="rpb-category-chevron" />
            </button>
            {open && (
              <div className="rpb-category-body">
                {defs.map((def) => (
                  <div
                    key={def.type}
                    className="rpb-palette-item"
                    draggable
                    onDragStart={(e) => {
                      currentDrag = { kind: "new", blockType: def.type };
                      e.dataTransfer.effectAllowed = "copy";
                      onDragChange(true);
                    }}
                    onDragEnd={() => {
                      window.setTimeout(() => {
                        currentDrag = null;
                        onDragChange(false);
                      }, 0);
                    }}
                  >
                    <span className="rpb-palette-icon">{def.icon ?? <Icon name="blocks" size={17} />}</span>
                    <span>{def.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Navigator (layers tree)                                             */
/* ------------------------------------------------------------------ */

function Navigator({
  nodes,
  selectedId,
  onSelect,
  depth,
}: {
  nodes: PageNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  depth: number;
}) {
  if (depth === 0 && nodes.length === 0) {
    return <div className="rpb-navigator-empty">Nothing on this page yet. Drag a block in from Elements.</div>;
  }
  return (
    <>
      {nodes.map((node) => {
        const def = getBlock(node.type);
        return (
          <div key={node.id}>
            <div
              className={"rpb-navigator-row" + (selectedId === node.id ? " rpb-navigator-row-selected" : "")}
              style={{ paddingLeft: 6 + depth * 16 }}
              onClick={() => onSelect(node.id)}
            >
              <Icon name={def?.isContainer ? "layers" : "blocks"} size={12} />
              <span className="rpb-navigator-label">{def?.label ?? node.type}</span>
            </div>
            {node.children && node.children.length > 0 && (
              <Navigator nodes={node.children} selectedId={selectedId} onSelect={onSelect} depth={depth + 1} />
            )}
          </div>
        );
      })}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Canvas rendering                                                    */
/* ------------------------------------------------------------------ */

interface NodeListProps {
  nodes: PageNode[];
  parentId: string | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDrop: (t: DropTarget) => void;
  onDragChange: (d: boolean) => void;
  dragging: boolean;
  doc: PageDocument;
  commit: (d: PageDocument) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  nodeRefs: React.MutableRefObject<Map<string, HTMLElement>>;
}

function NodeList(props: NodeListProps) {
  const { nodes, parentId, onDrop, dragging } = props;
  return (
    <>
      <DropZone target={{ parentId, index: 0 }} onDrop={onDrop} visible={dragging} />
      {nodes.map((node, i) => (
        <React.Fragment key={node.id}>
          <NodeFrame {...props} node={node} />
          <DropZone
            target={{ parentId, index: i + 1 }}
            onDrop={onDrop}
            visible={dragging}
          />
        </React.Fragment>
      ))}
    </>
  );
}

function NodeFrame(props: NodeListProps & { node: PageNode }) {
  const { node, selectedId, onSelect, onDrop, onDragChange, dragging, onDuplicate, onDelete, nodeRefs } = props;
  const def = getBlock(node.type);
  if (!def) {
    return <div className="rpb-unknown">Unknown block: {node.type}</div>;
  }

  const isSelected = selectedId === node.id;
  const children = def.isContainer ? (
    <NodeList {...props} nodes={node.children ?? []} parentId={node.id} />
  ) : undefined;

  return (
    <div
      ref={(el) => {
        if (el) nodeRefs.current.set(node.id, el);
        else nodeRefs.current.delete(node.id);
      }}
      className={
        "rpb-node" +
        (isSelected ? " rpb-node-selected" : "") +
        (def.isContainer ? " rpb-node-container" : "")
      }
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.id);
      }}
      onDragOver={(e) => {
        if (!currentDrag) return;
        e.preventDefault();
        e.stopPropagation();
        onDragChange(true);
      }}
      onDrop={(e) => {
        if (!currentDrag) return;
        e.preventDefault();
        e.stopPropagation();
        onDrop({ parentId: node.id, index: (node.children ?? []).length });
      }}
      draggable
      onDragStart={(e) => {
        e.stopPropagation();
        currentDrag = { kind: "move", id: node.id };
        e.dataTransfer.effectAllowed = "move";
        onDragChange(true);
      }}
      onDragEnd={() => {
        window.setTimeout(() => {
          currentDrag = null;
          onDragChange(false);
        }, 0);
      }}
    >
      <div className="rpb-node-toolbar">
        <span className="rpb-node-toolbar-label">
          <Icon name="grip" size={11} /> {def.label}
        </span>
        <span className="rpb-node-toolbar-actions">
          <button
            type="button"
            className="rpb-node-toolbar-btn"
            title="Duplicate"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(node.id);
            }}
          >
            <Icon name="copy" size={12} />
          </button>
          <button
            type="button"
            className="rpb-node-toolbar-btn"
            title="Delete"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node.id);
            }}
          >
            <Icon name="trash" size={12} />
          </button>
        </span>
      </div>
      {def.render({ node, children, isEditing: true })}
      {def.isContainer &&
        def.showEmptyContainerHint !== false &&
        (node.children ?? []).length === 0 &&
        !dragging && (
        <div className="rpb-container-hint">Drop blocks here</div>
      )}
    </div>
  );
}

function DropZone({
  target,
  onDrop,
  visible,
}: {
  target: DropTarget;
  onDrop: (t: DropTarget) => void;
  visible: boolean;
}) {
  const [over, setOver] = useState(false);
  if (!visible) return <div className="rpb-dropzone-collapsed" />;
  return (
    <div
      className={"rpb-dropzone" + (over ? " rpb-dropzone-over" : "")}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setOver(false);
        onDrop(target);
      }}
    />
  );
}

/** Plain render used by Preview mode (same output as PageRenderer). */
function RenderPlain({ nodes }: { nodes: PageNode[] }) {
  return (
    <>
      {nodes.map((n) => {
        const def = getBlock(n.type);
        if (!def) return null;
        const children = n.children ? <RenderPlain nodes={n.children} /> : undefined;
        return (
          <React.Fragment key={n.id}>
            {def.render({ node: n, children, isEditing: false })}
          </React.Fragment>
        );
      })}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Inspector                                                           */
/* ------------------------------------------------------------------ */

const TAB_LABELS: Record<FieldGroup, string> = {
  content: "Content",
  style: "Style",
  advanced: "Advanced",
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
  mediaContext,
}: {
  node: PageNode;
  def: BlockDefinition;
  tab: FieldGroup;
  onTabChange: (t: FieldGroup) => void;
  onPatch: (patch: Record<string, any>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  mediaAdapter?: MediaStorageAdapter;
  mediaContext?: Omit<MediaUploadContext, "field" | "currentValue">;
}) {
  const allFields = def.fields ?? [];
  const byTab = (t: FieldGroup) => allFields.filter((f) => (f.group ?? "content") === t);
  const visible = byTab(tab);

  return (
    <>
      <div className="rpb-inspector-tabs">
        {(["content", "style", "advanced"] as FieldGroup[]).map((t) => (
          <button
            key={t}
            className={"rpb-inspector-tab" + (tab === t ? " rpb-inspector-tab-active" : "")}
            onClick={() => onTabChange(t)}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      <div className="rpb-inspector-actions">
        <button className="rpb-btn" onClick={onDuplicate}>
          <Icon name="copy" size={12} /> Duplicate
        </button>
        <button className="rpb-btn rpb-btn-danger" onClick={onDelete}>
          <Icon name="trash" size={12} /> Delete
        </button>
      </div>

      {visible.map((field) => (
        <div className="rpb-field" key={field.name}>
          <label className="rpb-field-label">{field.label}</label>
          <Field
            field={field}
            value={node.props[field.name]}
            onChange={(v) => onPatch({ [field.name]: v })}
            mediaAdapter={mediaAdapter}
            mediaContext={{ ...mediaContext, node }}
          />
          {field.helperText && <div className="rpb-field-help">{field.helperText}</div>}
        </div>
      ))}
      {visible.length === 0 && (
        <div className="rpb-inspector-empty">
          {allFields.length === 0
            ? "This block has no settings"
            : `No ${TAB_LABELS[tab].toLowerCase()} settings for this block`}
        </div>
      )}

      <div className="rpb-inspector-footer">
        <span className="rpb-inspector-id">#{node.id.slice(0, 8)}</span>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function isTypingTarget(t: EventTarget | null): boolean {
  const el = t as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

/** Find the DropTarget immediately after a node (for duplicate). */
function locateAfter(doc: PageDocument, id: string): DropTarget | null {
  const search = (nodes: PageNode[], parentId: string | null): DropTarget | null => {
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

function getAutoSaveDelay(autoSave: PageBuilderProps["autoSave"]): number | null {
  if (!autoSave) return null;
  if (autoSave === true) return 1200;
  return Math.max(0, autoSave.delayMs ?? 1200);
}

function describeSaveResult(result: void | PageSaveResult): string {
  if (result?.updatedAt) return "Saved";
  if (result?.url) return "Saved";
  return "Saved";
}
