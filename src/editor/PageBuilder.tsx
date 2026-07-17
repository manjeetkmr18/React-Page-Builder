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

/* ------------------------------------------------------------------ */
/* Drag payload (module-level because dataTransfer is opaque on hover) */
/* ------------------------------------------------------------------ */

type DragPayload =
  | { kind: "new"; blockType: string }
  | { kind: "move"; id: string };

let currentDrag: DragPayload | null = null;

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
  const past = useRef<PageDocument[]>([]);
  const future = useRef<PageDocument[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const latestDoc = useRef(doc);

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
        const [next] = removeNode(doc, selectedId);
        commit(next);
        setSelectedId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doc, selectedId, undo, redo, commit]);

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

  return (
    <div className="rpb-root" style={{ height }}>
      <style dangerouslySetInnerHTML={{ __html: EDITOR_CSS }} />

      <div className="rpb-toolbar">
        <span className="rpb-brand">Page Builder</span>
        <div className="rpb-toolbar-group">
          <button className="rpb-btn" onClick={undo} title="Undo (Ctrl+Z)">Undo</button>
          <button className="rpb-btn" onClick={redo} title="Redo (Ctrl+Y)">Redo</button>
        </div>
        <div className="rpb-toolbar-group">
          <button className="rpb-btn" onClick={() => fileInput.current?.click()}>Import JSON</button>
          <button className="rpb-btn" onClick={exportJson}>Export JSON</button>
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
        <div className="rpb-toolbar-spacer" />
        <button
          className={"rpb-btn" + (previewing ? " rpb-btn-active" : "")}
          onClick={() => {
            setPreviewing(!previewing);
            setSelectedId(null);
          }}
        >
          {previewing ? "Edit" : "Preview"}
        </button>
        {canSave && (
          <button
            className="rpb-btn rpb-btn-primary"
            disabled={saveState === "saving"}
            onClick={() => void saveDocument(doc)}
          >
            {saveState === "saving" ? "Saving..." : "Save"}
          </button>
        )}
        {canSave && saveState !== "idle" && (
          <span className={"rpb-save-status rpb-save-status-" + saveState}>
            {saveMessage ?? (saveState === "saved" ? "Saved" : saveState)}
          </span>
        )}
      </div>

      <div className="rpb-body">
        {!previewing && (
          <aside className="rpb-palette">
            <Palette onDragChange={setDragging} />
          </aside>
        )}

        <main
          className={"rpb-canvas" + (previewing ? " rpb-canvas-preview" : "")}
          onClick={() => setSelectedId(null)}
        >
          <div
            className="rpb-page"
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
                />
                {doc.root.length === 0 && (
                  <div className="rpb-empty">
                    Drag a <strong>Section</strong> from the left panel to start building
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        {!previewing && (
          <aside className="rpb-inspector">
            {selected && selectedDef ? (
              <Inspector
                node={selected}
                def={selectedDef}
                onPatch={(patch) => commit(updateNodeProps(doc, selected.id, patch))}
                onDelete={() => {
                  const [next] = removeNode(doc, selected.id);
                  commit(next);
                  setSelectedId(null);
                }}
                onDuplicate={() => {
                  const copy = cloneNode(selected);
                  const target = locateAfter(doc, selected.id);
                  if (target) {
                    commit(insertNode(doc, copy, target));
                    setSelectedId(copy.id);
                  }
                }}
                mediaAdapter={mediaAdapter}
                mediaContext={{ slug, document: doc }}
              />
            ) : (
              <div className="rpb-inspector-empty">
                Select a block on the canvas to edit its settings
              </div>
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

function Palette({ onDragChange }: { onDragChange: (d: boolean) => void }) {
  const grouped = useMemo(() => getBlocksByCategory(), []);
  return (
    <>
      <div className="rpb-panel-title">Blocks</div>
      {Object.entries(grouped).map(([cat, defs]) => (
        <div key={cat}>
          <div className="rpb-category">{cat}</div>
          <div className="rpb-palette-grid">
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
                <span className="rpb-palette-icon">{def.icon ?? "[]"}</span>
                <span>{def.label}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
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
  const { node, selectedId, onSelect, onDrop, onDragChange, dragging, doc, commit } = props;
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
      <span className="rpb-node-label">{def.label}</span>
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

function Inspector({
  node,
  def,
  onPatch,
  onDelete,
  onDuplicate,
  mediaAdapter,
  mediaContext,
}: {
  node: PageNode;
  def: BlockDefinition;
  onPatch: (patch: Record<string, any>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  mediaAdapter?: MediaStorageAdapter;
  mediaContext?: Omit<MediaUploadContext, "field" | "currentValue">;
}) {
  return (
    <>
      <div className="rpb-panel-title">
        {def.icon ? <span>{def.icon} </span> : null}
        {def.label}
      </div>
      <div className="rpb-inspector-actions">
        <button className="rpb-btn" onClick={onDuplicate}>Duplicate</button>
        <button className="rpb-btn rpb-btn-danger" onClick={onDelete}>Delete</button>
      </div>
      {(def.fields ?? []).map((field) => (
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
      {(def.fields ?? []).length === 0 && (
        <div className="rpb-inspector-empty">This block has no settings</div>
      )}
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
