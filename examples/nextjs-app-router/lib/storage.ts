import { promises as fs } from "fs";
import path from "path";
import type {
  PageDocument,
  PageListItem,
  PageStorageAdapter,
} from "@manjeetkmr18/react-page-builder";
import { isPageDocument } from "@manjeetkmr18/react-page-builder";

const DIR = path.join(process.cwd(), "content", "pages");

export const isSafeSlug = (slug: string) => /^[a-z0-9-]{1,64}$/.test(slug);

export const jsonFilePageStorage: PageStorageAdapter = {
  async load(slug) {
    return loadPage(slug);
  },
  async save(slug, document) {
    await savePage(slug, document);
    return {
      slug,
      url: `/${slug}`,
      updatedAt: new Date().toISOString(),
    };
  },
  async list() {
    return listPages();
  },
  async delete(slug) {
    if (!isSafeSlug(slug)) return;
    await fs.rm(pagePath(slug), { force: true });
  },
};

export async function loadPage(slug: string): Promise<PageDocument | null> {
  if (!isSafeSlug(slug)) return null;
  try {
    const raw = await fs.readFile(pagePath(slug), "utf8");
    const parsed = JSON.parse(raw);
    return isPageDocument(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function loadPageRecord(slug: string): Promise<(PageListItem & { document: PageDocument }) | null> {
  const document = await loadPage(slug);
  if (!document) return null;
  return {
    slug,
    document,
    title: getTitle(document, slug),
    description: getDescription(document),
    updatedAt: await getUpdatedAt(slug),
    url: `/${slug}`,
  };
}

export async function savePage(slug: string, doc: PageDocument): Promise<void> {
  if (!isSafeSlug(slug)) {
    throw new Error("Invalid slug. Use lowercase letters, numbers, and dashes.");
  }
  if (!isPageDocument(doc)) {
    throw new Error("Invalid PageDocument.");
  }
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(pagePath(slug), JSON.stringify(doc, null, 2));
}

export async function listPages(): Promise<PageListItem[]> {
  await fs.mkdir(DIR, { recursive: true });
  const files = await fs.readdir(DIR).catch(() => []);
  const pages: Array<PageListItem | null> = await Promise.all(
    files
      .filter((file) => file.endsWith(".json"))
      .map(async (file) => {
        const slug = file.replace(/\.json$/, "");
        const document = await loadPage(slug);
        if (!document) return null;
        return {
          slug,
          title: getTitle(document, slug),
          description: getDescription(document),
          updatedAt: await getUpdatedAt(slug),
          url: `/${slug}`,
        } satisfies PageListItem;
      })
  );
  return pages
    .filter((page): page is PageListItem => Boolean(page))
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

function pagePath(slug: string): string {
  return path.join(DIR, `${slug}.json`);
}

async function getUpdatedAt(slug: string): Promise<string | undefined> {
  try {
    const stat = await fs.stat(pagePath(slug));
    return stat.mtime.toISOString();
  } catch {
    return undefined;
  }
}

function getTitle(doc: PageDocument, fallbackSlug: string): string {
  const heading = findFirstProp(doc.root, "text");
  return typeof heading === "string" && heading.trim()
    ? heading.trim()
    : titleFromSlug(fallbackSlug);
}

function getDescription(doc: PageDocument): string | undefined {
  const text = findFirstProp(doc.root, "text", "core/text");
  return typeof text === "string" && text.trim() ? text.trim().slice(0, 160) : undefined;
}

function findFirstProp(nodes: PageDocument["root"], prop: string, type?: string): unknown {
  for (const node of nodes) {
    if ((!type || node.type === type) && node.props[prop] != null) {
      return node.props[prop];
    }
    if (node.children) {
      const child = findFirstProp(node.children, prop, type);
      if (child != null) return child;
    }
  }
  return undefined;
}

function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}
