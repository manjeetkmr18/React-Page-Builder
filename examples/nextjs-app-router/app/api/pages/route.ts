import { NextRequest, NextResponse } from "next/server";
import { isPageDocument } from "@manjeetkmr18/react-page-builder";
import { isSafeSlug, jsonFilePageStorage, listPages, loadPage } from "@/lib/storage";

export async function GET() {
  return NextResponse.json({ pages: await listPages() });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const slug = typeof body?.slug === "string" ? body.slug : "";

  if (!isSafeSlug(slug)) {
    return NextResponse.json(
      { error: "Use a URL slug with lowercase letters, numbers, and dashes." },
      { status: 400 }
    );
  }
  if (!isPageDocument(body?.document)) {
    return NextResponse.json({ error: "invalid document" }, { status: 400 });
  }
  if (await loadPage(slug)) {
    return NextResponse.json({ error: "A page already uses this URL." }, { status: 409 });
  }

  const result = await jsonFilePageStorage.save(slug, body.document);
  return NextResponse.json({ ok: true, ...result }, { status: 201 });
}
