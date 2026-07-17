import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageRenderer } from "@manjeetkmr18/react-page-builder";
import { listPages, loadPageRecord } from "@/lib/storage";
import "@/lib/blocks";

export const dynamicParams = true;
export const revalidate = 0;

type PageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await listPages()).map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await loadPageRecord(slug);
  if (!page) return {};
  return {
    title: page.title,
    description: page.description,
  };
}

// Server Component: the published page ships zero builder JavaScript.
export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const page = await loadPageRecord(slug);
  if (!page) notFound();
  return <PageRenderer document={page.document} />;
}
