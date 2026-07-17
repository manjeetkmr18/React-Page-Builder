import React from "react";
import type { PageDocument, PageNode } from "./types";
import { getBlock } from "./registry";

export interface PageRendererProps {
  document: PageDocument;
  /** Rendered when a node's block type isn't registered. */
  renderUnknown?: (node: PageNode) => React.ReactNode;
}

/**
 * Pure, SSR-safe renderer. Use it directly in a Next.js server component:
 *
 *   import { PageRenderer } from "@manjeetkmr18/react-page-builder";
 *   import "./blocks"; // your registerBlock() calls
 *
 *   export default async function Page({ params }) {
 *     const doc = await loadPage(params.slug);
 *     return <PageRenderer document={doc} />;
 *   }
 */
export function PageRenderer({ document, renderUnknown }: PageRendererProps) {
  return <>{document.root.map((n) => renderTree(n, renderUnknown))}</>;
}

/** Render a single node subtree (exported for advanced use). */
export function renderTree(
  node: PageNode,
  renderUnknown?: (node: PageNode) => React.ReactNode
): React.ReactNode {
  const def = getBlock(node.type);
  if (!def) {
    return renderUnknown ? (
      <React.Fragment key={node.id}>{renderUnknown(node)}</React.Fragment>
    ) : null;
  }
  const children = node.children?.map((c) => renderTree(c, renderUnknown));
  return (
    <React.Fragment key={node.id}>
      {def.render({ node, children, isEditing: false })}
    </React.Fragment>
  );
}
