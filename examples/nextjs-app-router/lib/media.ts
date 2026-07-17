import { promises as fs } from "fs";
import path from "path";

export const MEDIA_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export interface MediaListItem {
  name: string;
  url: string;
  size: number;
  mimeType: string;
  updatedAt: string;
}

const MIME_TYPES: Record<string, string> = {
  ".gif": "image/gif",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

export function isSafeMediaFilename(filename: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,190}$/.test(filename) && path.basename(filename) === filename;
}

export async function listMediaAssets(): Promise<MediaListItem[]> {
  await fs.mkdir(MEDIA_UPLOAD_DIR, { recursive: true });
  const entries = await fs.readdir(MEDIA_UPLOAD_DIR, { withFileTypes: true }).catch(() => []);

  const assets = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && MIME_TYPES[path.extname(entry.name).toLowerCase()])
      .map(async (entry) => {
        const stat = await fs.stat(path.join(MEDIA_UPLOAD_DIR, entry.name));
        return {
          name: entry.name,
          url: `/uploads/${encodeURIComponent(entry.name)}`,
          size: stat.size,
          mimeType: MIME_TYPES[path.extname(entry.name).toLowerCase()],
          updatedAt: stat.mtime.toISOString(),
        } satisfies MediaListItem;
      })
  );

  return assets.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

