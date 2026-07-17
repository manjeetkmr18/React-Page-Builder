import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { listMediaAssets, MEDIA_UPLOAD_DIR } from "@/lib/media";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/svg+xml",
  "image/webp",
]);

export async function POST(req: NextRequest) {
  // Production: add your auth/session check here before accepting uploads.
  const form = await req.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "unsupported image type" }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "image is too large" }, { status: 400 });
  }

  const extension = extensionFor(file.type);
  const storedName = `${Date.now()}-${randomUUID()}${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  await fs.mkdir(MEDIA_UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(MEDIA_UPLOAD_DIR, storedName), bytes);

  return NextResponse.json({
    url: `/uploads/${storedName}`,
    name: file.name,
    size: file.size,
    mimeType: file.type,
  });
}

export async function GET() {
  return NextResponse.json({ assets: await listMediaAssets() });
}

function extensionFor(mimeType: string): string {
  switch (mimeType) {
    case "image/gif":
      return ".gif";
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/svg+xml":
      return ".svg";
    case "image/webp":
      return ".webp";
    default:
      return "";
  }
}
