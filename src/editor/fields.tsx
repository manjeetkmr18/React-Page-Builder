"use client";
import React, { useRef, useState } from "react";
import type {
  FieldDefinition,
  MediaStorageAdapter,
  MediaUploadContext,
  MediaUploadResult,
} from "../types";

export interface FieldProps {
  field: FieldDefinition;
  value: any;
  onChange: (value: any) => void;
  mediaAdapter?: MediaStorageAdapter;
  mediaContext?: Omit<MediaUploadContext, "field" | "currentValue">;
}

export function Field({ field, value, onChange, mediaAdapter, mediaContext }: FieldProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaUploadContext: MediaUploadContext = {
    ...mediaContext,
    field,
    currentValue: value,
  };

  const applyMediaResult = (result: MediaUploadResult | null | undefined) => {
    if (!result) return;
    onChange(typeof result === "string" ? result : result.url);
  };

  const uploadFile = async (file: File) => {
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
      return (
        <input
          className="rpb-input"
          type="text"
          value={value ?? ""}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "image":
      return (
        <div className="rpb-image-field">
          <input
            className="rpb-input"
            type="text"
            value={value ?? ""}
            placeholder={field.placeholder ?? "https://..."}
            onChange={(e) => onChange(e.target.value)}
          />
          {mediaAdapter && (
            <div className="rpb-media-actions">
              <button
                type="button"
                className="rpb-btn"
                disabled={busy}
                onClick={() => fileInput.current?.click()}
              >
                {busy ? "Uploading..." : "Upload"}
              </button>
              {mediaAdapter.select && (
                <button
                  type="button"
                  className="rpb-btn"
                  disabled={busy}
                  onClick={chooseMedia}
                >
                  Choose
                </button>
              )}
              <input
                ref={fileInput}
                type="file"
                accept={field.accept ?? "image/*"}
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadFile(file);
                  e.target.value = "";
                }}
              />
            </div>
          )}
          {typeof value === "string" && value && (
            <img className="rpb-image-preview" src={value} alt="" />
          )}
          {error && <div className="rpb-field-error">{error}</div>}
        </div>
      );
    case "textarea":
      return (
        <textarea
          className="rpb-input rpb-textarea"
          rows={4}
          value={value ?? ""}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "number":
      return (
        <input
          className="rpb-input"
          type="number"
          value={value ?? ""}
          min={field.min}
          max={field.max}
          step={field.step}
          onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
        />
      );
    case "range":
      return (
        <div className="rpb-range-row">
          <input
            type="range"
            value={value ?? field.min ?? 0}
            min={field.min ?? 0}
            max={field.max ?? 100}
            step={field.step ?? 1}
            onChange={(e) => onChange(Number(e.target.value))}
          />
          <span className="rpb-range-value">{value ?? field.min ?? 0}</span>
        </div>
      );
    case "color":
      return (
        <div className="rpb-color-row">
          <input
            type="color"
            value={toHex(value)}
            onChange={(e) => onChange(e.target.value)}
          />
          <input
            className="rpb-input"
            type="text"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      );
    case "select":
      return (
        <select
          className="rpb-input"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        >
          {(field.options ?? []).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    case "boolean":
      return (
        <label className="rpb-switch">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
          />
          <span>{value ? "On" : "Off"}</span>
        </label>
      );
    default:
      return null;
  }
}

function toHex(v: any): string {
  if (typeof v === "string" && /^#([0-9a-f]{6})$/i.test(v)) return v;
  return "#000000";
}
