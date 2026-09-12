import type { CSSProperties, ReactNode } from "react";

export type MaybePromise<T> = T | Promise<T>;

/** A single node in the page tree. */
export interface PageNode {
  /** Unique id within the document. */
  id: string;
  /** Block type — must match a registered block. */
  type: string;
  /** Arbitrary, JSON-serializable props consumed by the block's render fn. */
  props: Record<string, any>;
  /** Child nodes (only meaningful for container blocks). */
  children?: PageNode[];
}

/** The serializable page document. This is what you store in your DB / CMS. */
export interface PageDocument {
  version: 1;
  root: PageNode[];
}

/** Lightweight page metadata used by storage adapters and page lists. */
export interface PageListItem {
  slug: string;
  title?: string;
  description?: string;
  updatedAt?: string;
  publishedAt?: string;
  status?: "draft" | "published" | "archived" | string;
  url?: string;
  metadata?: Record<string, any>;
}

/** Extra information passed to persistence adapters. */
export interface PageStorageContext {
  slug?: string;
  locale?: string;
  userId?: string;
  draft?: boolean;
  metadata?: Record<string, any>;
}

export interface PageSaveResult {
  slug?: string;
  url?: string;
  updatedAt?: string;
  metadata?: Record<string, any>;
}

/**
 * Pluggable persistence contract.
 *
 * Implement this with a database, CMS, filesystem, edge KV, REST endpoint,
 * GraphQL mutation, or anything else. The editor only cares about documents.
 */
export interface PageStorageAdapter {
  load?: (
    slug: string,
    context?: PageStorageContext
  ) => MaybePromise<PageDocument | null>;
  save: (
    slug: string,
    document: PageDocument,
    context?: PageStorageContext
  ) => MaybePromise<void | PageSaveResult>;
  list?: (context?: PageStorageContext) => MaybePromise<PageListItem[]>;
  delete?: (slug: string, context?: PageStorageContext) => MaybePromise<void>;
  publish?: (
    slug: string,
    context?: PageStorageContext
  ) => MaybePromise<void | PageSaveResult>;
}

export interface MediaAsset {
  url: string;
  id?: string;
  name?: string;
  alt?: string;
  width?: number;
  height?: number;
  size?: number;
  mimeType?: string;
  metadata?: Record<string, any>;
}

export type MediaUploadResult = string | MediaAsset;

export interface MediaUploadContext {
  field: FieldDefinition;
  node?: PageNode;
  slug?: string;
  document?: PageDocument;
  currentValue?: any;
  metadata?: Record<string, any>;
}

/**
 * Pluggable media contract for image fields.
 *
 * Implement upload() with S3, Cloudinary, UploadThing, your own API route, etc.
 * Return either a URL string or a MediaAsset object with a `url`.
 */
export interface MediaStorageAdapter {
  upload: (
    file: File,
    context?: MediaUploadContext
  ) => MaybePromise<MediaUploadResult>;
  select?: (context?: MediaUploadContext) => MaybePromise<MediaUploadResult | null>;
}

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "color"
  | "select"
  | "boolean"
  | "image"
  | "range";

/** Which inspector tab a field appears under. Defaults to "content". */
export type FieldGroup = "content" | "style" | "advanced";

/** Describes one editable prop shown in the inspector panel. */
export interface FieldDefinition {
  /** Key inside node.props this field edits. */
  name: string;
  label: string;
  type: FieldType;
  /** Inspector tab this field is grouped under. Defaults to "content". */
  group?: FieldGroup;
  /** For "select" fields. */
  options?: { label: string; value: string }[];
  /** For "range" / "number" fields. */
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  /** For image/file inputs. Defaults to image/*. */
  accept?: string;
  /** Optional helper text shown by custom editor UIs. */
  helperText?: string;
}

/** Context passed to a block's render function. */
export interface BlockRenderContext {
  node: PageNode;
  /** Rendered children (for container blocks). */
  children?: ReactNode;
  /** True while rendering inside the editor canvas. */
  isEditing: boolean;
}

/** A block definition — the unit of extensibility. */
export interface BlockDefinition {
  /** Unique type string, e.g. "hero", "pricing-table". Namespace yours: "myplugin/hero". */
  type: string;
  /** Human-readable name shown in the palette. */
  label: string;
  /** Palette grouping, e.g. "Layout", "Basic", "Media". */
  category?: string;
  /** Emoji or short string used as the palette icon. */
  icon?: string;
  /** Props a freshly dropped node starts with. */
  defaultProps?: Record<string, any>;
  /** Whether this block accepts children (renders drop zones in the editor). */
  isContainer?: boolean;
  /** Set false when the block renders its own empty-state UI in the editor. */
  showEmptyContainerHint?: boolean;
  /** Inspector fields. */
  fields?: FieldDefinition[];
  /** Pure render function. Must be SSR-safe. */
  render: (ctx: BlockRenderContext) => ReactNode;
}

/** Utility: build a style object from common spacing props. */
export function spacingStyle(props: Record<string, any>): CSSProperties {
  const s: CSSProperties = {};
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

export function isPageNode(value: unknown): value is PageNode {
  if (!value || typeof value !== "object") return false;
  const node = value as PageNode;
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

export function isPageDocument(value: unknown): value is PageDocument {
  if (!value || typeof value !== "object") return false;
  const doc = value as PageDocument;
  return doc.version === 1 && Array.isArray(doc.root) && doc.root.every(isPageNode);
}

export function assertPageDocument(value: unknown): asserts value is PageDocument {
  if (!isPageDocument(value)) {
    throw new Error("Invalid PageDocument: expected { version: 1, root: PageNode[] }.");
  }
}
