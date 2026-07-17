"use client";
import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PageBuilder } from "@manjeetkmr18/react-page-builder/editor";
import {
  createEmptyDocument,
  type MediaStorageAdapter,
  type PageStorageAdapter,
} from "@manjeetkmr18/react-page-builder";
import "@/lib/blocks";
import { AdminIcon } from "@/components/admin/AdminIcon";

function Editor() {
  const slug = useSearchParams().get("slug") ?? "home";
  const justCreated = useSearchParams().get("created") === "1";

  const storageAdapter = useMemo<PageStorageAdapter>(
    () => ({
      async load(pageSlug) {
        const res = await fetch(`/api/pages/${encodeURIComponent(pageSlug)}`, {
          cache: "no-store",
        });
        if (res.status === 404) return createEmptyDocument();
        if (!res.ok) throw new Error(`Could not load /${pageSlug}`);
        return res.json();
      },
      async save(pageSlug, document) {
        const res = await fetch(`/api/pages/${encodeURIComponent(pageSlug)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(document),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `Could not save /${pageSlug}`);
        }
        return res.json();
      },
    }),
    []
  );

  const mediaAdapter = useMemo<MediaStorageAdapter>(
    () => ({
      async upload(file) {
        const body = new FormData();
        body.append("file", file);
        const res = await fetch("/api/media", { method: "POST", body });
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload.error ?? "Upload failed");
        }
        return res.json();
      },
    }),
    []
  );

  return (
    <div className="admin-editor-screen">
      <header className="admin-editor-header">
        <Link href="/admin/pages" className="admin-editor-back" title="Back to pages">
          <AdminIcon name="arrow-left" />
        </Link>
        <div className="admin-editor-identity">
          <span className="admin-editor-logo"><span /></span>
          <div>
            <strong>{slug.replace(/-/g, " ")}</strong>
            <span>/{slug}</span>
          </div>
        </div>
        <div className="admin-editor-spacer" />
        {justCreated && <span className="admin-editor-created"><AdminIcon name="check" /> Page created</span>}
        <span className="admin-editor-autosave"><i /> Autosave on</span>
        <Link href={`/${slug}`} target="_blank" className="admin-editor-view">
          View page <AdminIcon name="external" />
        </Link>
      </header>
      <PageBuilder
        slug={slug}
        storageAdapter={storageAdapter}
        mediaAdapter={mediaAdapter}
        autoSave={{ delayMs: 1500 }}
        height="calc(100vh - 58px)"
      />
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense>
      <Editor />
    </Suspense>
  );
}
