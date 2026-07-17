"use client";

import { useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { AdminIcon } from "@/components/admin/AdminIcon";
import type { MediaListItem } from "@/lib/media";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function MediaManager({ initialAssets }: { initialAssets: MediaListItem[] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [assets, setAssets] = useState(initialAssets);
  const [query, setQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const filteredAssets = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return normalized ? assets.filter((asset) => asset.name.toLowerCase().includes(normalized)) : assets;
  }, [assets, query]);

  async function refreshAssets() {
    const response = await fetch("/api/media", { cache: "no-store" });
    if (!response.ok) throw new Error("Could not refresh the media library.");
    const body = await response.json();
    setAssets(body.assets ?? []);
  }

  async function uploadFiles(files: File[]) {
    if (!files.length) return;
    setUploading(true);
    setError("");
    setNotice("");
    try {
      for (const file of files) {
        const form = new FormData();
        form.append("file", file);
        const response = await fetch("/api/media", { method: "POST", body: form });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error ?? `Could not upload ${file.name}.`);
        }
      }
      await refreshAssets();
      setNotice(`${files.length} ${files.length === 1 ? "image" : "images"} uploaded.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function selectFiles(event: ChangeEvent<HTMLInputElement>) {
    void uploadFiles(Array.from(event.target.files ?? []));
  }

  function dropFiles(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    void uploadFiles(Array.from(event.dataTransfer.files).filter((file) => file.type.startsWith("image/")));
  }

  async function deleteAsset(asset: MediaListItem) {
    if (!window.confirm(`Delete ${asset.name}? Pages using this image will no longer display it.`)) return;
    setError("");
    setNotice("");
    const response = await fetch(`/api/media/${encodeURIComponent(asset.name)}`, { method: "DELETE" });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "Could not delete this image.");
      return;
    }
    setAssets((current) => current.filter((item) => item.name !== asset.name));
    setNotice("Image deleted.");
  }

  async function copyUrl(url: string) {
    await navigator.clipboard.writeText(url);
    setNotice("Image URL copied.");
    setError("");
  }

  return (
    <div className="admin-media-stack">
      <div
        className={`admin-upload-zone${dragging ? " is-dragging" : ""}`}
        onDragEnter={() => setDragging(true)}
        onDragLeave={() => setDragging(false)}
        onDragOver={(event) => event.preventDefault()}
        onDrop={dropFiles}
      >
        <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml" multiple onChange={selectFiles} hidden />
        <span className="admin-upload-icon"><AdminIcon name="upload" /></span>
        <div>
          <strong>{uploading ? "Uploading images..." : "Drop images here to upload"}</strong>
          <p>PNG, JPG, GIF, SVG, or WebP up to 5 MB each.</p>
        </div>
        <button type="button" className="admin-button admin-button-secondary" disabled={uploading} onClick={() => inputRef.current?.click()}>
          {uploading ? "Please wait..." : "Choose files"}
        </button>
      </div>

      {error && <div className="admin-alert is-error">{error}</div>}
      {notice && <div className="admin-alert is-success"><AdminIcon name="check" /> {notice}</div>}

      <section className="admin-panel admin-media-panel">
        <div className="admin-table-toolbar">
          <label className="admin-search-field">
            <AdminIcon name="search" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search media..." aria-label="Search media" />
            {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search"><AdminIcon name="x" /></button>}
          </label>
          <span className="admin-result-count">{filteredAssets.length} {filteredAssets.length === 1 ? "file" : "files"}</span>
        </div>

        {assets.length === 0 ? (
          <div className="admin-empty-state">
            <span className="admin-empty-icon"><AdminIcon name="image" /></span>
            <h2>Your media library is empty</h2>
            <p>Upload an image here or directly from an image field in the page editor.</p>
            <button type="button" className="admin-button admin-button-primary" onClick={() => inputRef.current?.click()}>
              <AdminIcon name="upload" /> Upload image
            </button>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="admin-empty-state is-small">
            <span className="admin-empty-icon"><AdminIcon name="search" /></span>
            <h2>No matching media</h2>
            <p>Try searching for another filename.</p>
          </div>
        ) : (
          <div className="admin-media-grid">
            {filteredAssets.map((asset) => (
              <article className="admin-media-card" key={asset.name}>
                <div className="admin-media-preview">
                  {/* Media URLs are generated by this app's validated upload endpoint. */}
                  <img src={asset.url} alt="" />
                  <div className="admin-media-overlay">
                    <button type="button" className="admin-icon-button" onClick={() => copyUrl(asset.url)} title="Copy image URL">
                      <AdminIcon name="page" />
                    </button>
                    <a href={asset.url} target="_blank" rel="noreferrer" className="admin-icon-button" title="Open image">
                      <AdminIcon name="external" />
                    </a>
                    <button type="button" className="admin-icon-button is-danger" onClick={() => deleteAsset(asset)} title="Delete image">
                      <AdminIcon name="trash" />
                    </button>
                  </div>
                </div>
                <div className="admin-media-meta">
                  <strong title={asset.name}>{asset.name}</strong>
                  <span>{formatBytes(asset.size)} · {formatDate(asset.updatedAt)}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

