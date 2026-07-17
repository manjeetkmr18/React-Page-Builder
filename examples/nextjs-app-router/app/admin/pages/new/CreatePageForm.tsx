"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AdminIcon } from "@/components/admin/AdminIcon";
import { createPageFromTemplate, type PageTemplate } from "@/lib/page-templates";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function CreatePageForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [template, setTemplate] = useState<PageTemplate>("starter");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function updateTitle(nextTitle: string) {
    setTitle(nextTitle);
    if (!slugEdited) setSlug(slugify(nextTitle));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !slug) {
      setError("Add a page title and URL before continuing.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, document: createPageFromTemplate(title.trim(), template) }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not create the page.");
      }
      router.push(`/admin/editor?slug=${encodeURIComponent(slug)}&created=1`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create the page.");
      setSubmitting(false);
    }
  }

  return (
    <form className="admin-create-grid" onSubmit={submit}>
      <section className="admin-panel admin-form-card">
        <div className="admin-form-section-heading">
          <span>1</span>
          <div><h2>Page details</h2><p>Used to identify the page in your workspace and public URL.</p></div>
        </div>
        <div className="admin-form-fields">
          <label className="admin-field">
            <span>Page title</span>
            <input
              value={title}
              onChange={(event) => updateTitle(event.target.value)}
              placeholder="e.g. About our studio"
              autoFocus
              maxLength={100}
            />
          </label>
          <label className="admin-field">
            <span>Page URL</span>
            <div className="admin-slug-input">
              <span>/</span>
              <input
                value={slug}
                onChange={(event) => {
                  setSlugEdited(true);
                  setSlug(slugify(event.target.value));
                }}
                placeholder="about-our-studio"
                maxLength={64}
              />
            </div>
            <small>Lowercase letters, numbers, and dashes only.</small>
          </label>
        </div>
      </section>

      <section className="admin-panel admin-form-card">
        <div className="admin-form-section-heading">
          <span>2</span>
          <div><h2>Starting layout</h2><p>You can change every block once the editor opens.</p></div>
        </div>
        <div className="admin-template-grid">
          <button
            type="button"
            className={template === "starter" ? "is-selected" : undefined}
            onClick={() => setTemplate("starter")}
          >
            <span className="admin-template-preview is-starter">
              <i /><i /><i />
            </span>
            <span className="admin-template-copy"><strong>Simple page</strong><small>A clean heading and text area</small></span>
            <span className="admin-template-check"><AdminIcon name="check" /></span>
          </button>
          <button
            type="button"
            className={template === "landing" ? "is-selected" : undefined}
            onClick={() => setTemplate("landing")}
          >
            <span className="admin-template-preview is-landing">
              <i /><i /><i /><i />
            </span>
            <span className="admin-template-copy"><strong>Landing page</strong><small>Hero, call to action, and content</small></span>
            <span className="admin-template-check"><AdminIcon name="check" /></span>
          </button>
        </div>
      </section>

      {error && <div className="admin-alert is-error admin-form-error">{error}</div>}

      <div className="admin-form-actions">
        <Link href="/admin/pages" className="admin-button admin-button-secondary">Cancel</Link>
        <button type="submit" className="admin-button admin-button-primary" disabled={submitting}>
          {submitting ? "Creating..." : "Create and open editor"}
          {!submitting && <AdminIcon name="arrow-right" />}
        </button>
      </div>
    </form>
  );
}

