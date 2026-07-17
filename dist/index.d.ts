import React, { ReactNode, CSSProperties } from 'react';

type MaybePromise<T> = T | Promise<T>;
/** A single node in the page tree. */
interface PageNode {
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
interface PageDocument {
    version: 1;
    root: PageNode[];
}
/** Lightweight page metadata used by storage adapters and page lists. */
interface PageListItem {
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
interface PageStorageContext {
    slug?: string;
    locale?: string;
    userId?: string;
    draft?: boolean;
    metadata?: Record<string, any>;
}
interface PageSaveResult {
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
interface PageStorageAdapter {
    load?: (slug: string, context?: PageStorageContext) => MaybePromise<PageDocument | null>;
    save: (slug: string, document: PageDocument, context?: PageStorageContext) => MaybePromise<void | PageSaveResult>;
    list?: (context?: PageStorageContext) => MaybePromise<PageListItem[]>;
    delete?: (slug: string, context?: PageStorageContext) => MaybePromise<void>;
    publish?: (slug: string, context?: PageStorageContext) => MaybePromise<void | PageSaveResult>;
}
interface MediaAsset {
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
type MediaUploadResult = string | MediaAsset;
interface MediaUploadContext {
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
interface MediaStorageAdapter {
    upload: (file: File, context?: MediaUploadContext) => MaybePromise<MediaUploadResult>;
    select?: (context?: MediaUploadContext) => MaybePromise<MediaUploadResult | null>;
}
type FieldType = "text" | "textarea" | "number" | "color" | "select" | "boolean" | "image" | "range";
/** Describes one editable prop shown in the inspector panel. */
interface FieldDefinition {
    /** Key inside node.props this field edits. */
    name: string;
    label: string;
    type: FieldType;
    /** For "select" fields. */
    options?: {
        label: string;
        value: string;
    }[];
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
interface BlockRenderContext {
    node: PageNode;
    /** Rendered children (for container blocks). */
    children?: ReactNode;
    /** True while rendering inside the editor canvas. */
    isEditing: boolean;
}
/** A block definition — the unit of extensibility. */
interface BlockDefinition {
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
declare function spacingStyle(props: Record<string, any>): CSSProperties;
declare function isPageNode(value: unknown): value is PageNode;
declare function isPageDocument(value: unknown): value is PageDocument;
declare function assertPageDocument(value: unknown): asserts value is PageDocument;

declare global {
    var __manjeetReactPageBuilderRegistry: Map<string, BlockDefinition> | undefined;
}
/**
 * Global block registry. Works like Elementor's widget manager:
 * call registerBlock() before rendering the editor or the renderer.
 *
 * The registry is stored on the runtime-global object so it is shared
 * across the package's different entry points (editor vs renderer).
 */
declare function registerBlock(def: BlockDefinition): void;
declare function registerBlocks(defs: BlockDefinition[]): void;
declare function unregisterBlock(type: string): void;
declare function getBlock(type: string): BlockDefinition | undefined;
declare function getAllBlocks(): BlockDefinition[];
declare function getBlocksByCategory(): Record<string, BlockDefinition[]>;

/** Generate a short unique id. */
declare function generateId(): string;
declare function createEmptyDocument(): PageDocument;
declare function createNode(type: string, props?: Record<string, any>, children?: PageNode[]): PageNode;
/** Depth-first search for a node by id. Returns the node or null. */
declare function findNode(doc: PageDocument, id: string): PageNode | null;
/** Returns true if `maybeDescendant` is inside the subtree of `ancestorId`. */
declare function isDescendant(doc: PageDocument, ancestorId: string, maybeDescendant: string): boolean;
/** A drop target: either the root list or a container node's children, at an index. */
interface DropTarget {
    parentId: string | null;
    index: number;
}
/** Immutably insert a node at a target location. */
declare function insertNode(doc: PageDocument, node: PageNode, target: DropTarget): PageDocument;
/** Immutably remove a node by id. Returns [newDoc, removedNode]. */
declare function removeNode(doc: PageDocument, id: string): [PageDocument, PageNode | null];
/** Immutably move a node to a new target. No-op if move is invalid (into own subtree). */
declare function moveNode(doc: PageDocument, id: string, target: DropTarget): PageDocument;
/** Immutably merge new props into a node. */
declare function updateNodeProps(doc: PageDocument, id: string, patch: Record<string, any>): PageDocument;
/** Deep-clone a node with fresh ids (for duplicate). */
declare function cloneNode(node: PageNode): PageNode;

interface PageRendererProps {
    document: PageDocument;
    /** Rendered when a node's block type isn't registered. */
    renderUnknown?: (node: PageNode) => React.ReactNode;
}
/**
 * Pure, SSR-safe renderer. Use it directly in a Next.js server component:
 *
 *   import { PageRenderer } from "@manjeetkmr18/react-page-builder";
 *   import "./blocks"; // your registerBlock() calls
 *
 *   export default async function Page({ params }) {
 *     const doc = await loadPage(params.slug);
 *     return <PageRenderer document={doc} />;
 *   }
 */
declare function PageRenderer({ document, renderUnknown }: PageRendererProps): React.JSX.Element;
/** Render a single node subtree (exported for advanced use). */
declare function renderTree(node: PageNode, renderUnknown?: (node: PageNode) => React.ReactNode): React.ReactNode;

declare const coreBlocks: BlockDefinition[];
/** Register the built-in block set. Call once at startup (optional — bring your own blocks if you prefer). */
declare function registerCoreBlocks(): void;

export { type BlockDefinition, type BlockRenderContext, type DropTarget, type FieldDefinition, type FieldType, type MaybePromise, type MediaAsset, type MediaStorageAdapter, type MediaUploadContext, type MediaUploadResult, type PageDocument, type PageListItem, type PageNode, PageRenderer, type PageRendererProps, type PageSaveResult, type PageStorageAdapter, type PageStorageContext, assertPageDocument, cloneNode, coreBlocks, createEmptyDocument, createNode, findNode, generateId, getAllBlocks, getBlock, getBlocksByCategory, insertNode, isDescendant, isPageDocument, isPageNode, moveNode, registerBlock, registerBlocks, registerCoreBlocks, removeNode, renderTree, spacingStyle, unregisterBlock, updateNodeProps };
