import { NextRequest, NextResponse } from "next/server";
import { isPageDocument } from "@manjeetkmr18/react-page-builder";
import { isSafeSlug, jsonFilePageStorage } from "@/lib/storage";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { slug } = await params;
  if (!isSafeSlug(slug)) {
    return NextResponse.json({ error: "bad slug" }, { status: 400 });
  }

  const doc = await jsonFilePageStorage.load?.(slug);
  if (!doc) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(doc);
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { slug } = await params;
  if (!isSafeSlug(slug)) {
    return NextResponse.json({ error: "bad slug" }, { status: 400 });
  }

  const doc = await req.json().catch(() => null);
  if (!isPageDocument(doc)) {
    return NextResponse.json({ error: "invalid document" }, { status: 400 });
  }

  // Production: add your auth/session check here before allowing writes.
  const result = await jsonFilePageStorage.save(slug, doc);
  return NextResponse.json({ ok: true, ...result });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { slug } = await params;
  if (!isSafeSlug(slug)) {
    return NextResponse.json({ error: "bad slug" }, { status: 400 });
  }

  await jsonFilePageStorage.delete?.(slug);
  return NextResponse.json({ ok: true });
}
