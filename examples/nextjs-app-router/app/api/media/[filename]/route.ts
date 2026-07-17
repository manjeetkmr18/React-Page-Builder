import { promises as fs } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { isSafeMediaFilename, MEDIA_UPLOAD_DIR } from "@/lib/media";

type Ctx = { params: Promise<{ filename: string }> };

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { filename } = await params;
  if (!isSafeMediaFilename(filename)) {
    return NextResponse.json({ error: "invalid filename" }, { status: 400 });
  }

  await fs.rm(path.join(MEDIA_UPLOAD_DIR, filename), { force: true });
  return NextResponse.json({ ok: true });
}
