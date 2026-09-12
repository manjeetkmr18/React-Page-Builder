import React from 'react';

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
/** Which inspector tab a field appears under. Defaults to "content". */
type FieldGroup = "content" | "style" | "advanced";
/** Describes one editable prop shown in the inspector panel. */
interface FieldDefinition {
    /** Key inside node.props this field edits. */
    name: string;
    label: string;
    type: FieldType;
    /** Inspector tab this field is grouped under. Defaults to "content". */
    group?: FieldGroup;
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

interface PageBuilderProps {
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
    autoSave?: boolean | {
        delayMs?: number;
    };
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
}
declare function PageBuilder({ value, defaultValue, slug, storageAdapter, storageContext, mediaAdapter, autoSave, onChange, onSave, onLoad, onError, height, previewUrl, brand, }: PageBuilderProps): React.JSX.Element;

interface FieldProps {
    field: FieldDefinition;
    value: any;
    onChange: (value: any) => void;
    mediaAdapter?: MediaStorageAdapter;
    mediaContext?: Omit<MediaUploadContext, "field" | "currentValue">;
}
declare function Field({ field, value, onChange, mediaAdapter, mediaContext }: FieldProps): React.JSX.Element | null;

export { Field, type FieldProps, PageBuilder, type PageBuilderProps };
