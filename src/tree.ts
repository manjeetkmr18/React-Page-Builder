import type { PageDocument, PageNode } from "./types";

/** Generate a short unique id. */
export function generateId(): string {
  return (
    "n_" +
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 8)
  );
}

export function createEmptyDocument(): PageDocument {
  return { version: 1, root: [] };
}

export function createNode(
  type: string,
  props: Record<string, any> = {},
  children?: PageNode[]
): PageNode {
  return { id: generateId(), type, props, ...(children ? { children } : {}) };
}

/** Depth-first search for a node by id. Returns the node or null. */
export function findNode(doc: PageDocument, id: string): PageNode | null {
  const walk = (nodes: PageNode[]): PageNode | null => {
    for (const n of nodes) {
      if (n.id === id) return n;
      if (n.children) {
        const hit = walk(n.children);
        if (hit) return hit;
      }
    }
    return null;
  };
  return walk(doc.root);
}

/** Returns true if `maybeDescendant` is inside the subtree of `ancestorId`. */
export function isDescendant(
  doc: PageDocument,
  ancestorId: string,
  maybeDescendant: string
): boolean {
  const ancestor = findNode(doc, ancestorId);
  if (!ancestor?.children) return false;
  const walk = (nodes: PageNode[]): boolean =>
    nodes.some((n) => n.id === maybeDescendant || (n.children ? walk(n.children) : false));
  return walk(ancestor.children);
}

/** A drop target: either the root list or a container node's children, at an index. */
export interface DropTarget {
  parentId: string | null; // null = root
  index: number;
}

/** Immutably insert a node at a target location. */
export function insertNode(
  doc: PageDocument,
  node: PageNode,
  target: DropTarget
): PageDocument {
  const insertInto = (nodes: PageNode[]): PageNode[] => {
    if (target.parentId === null) {
      const copy = nodes.slice();
      copy.splice(clampIndex(target.index, copy.length), 0, node);
      return copy;
    }
    return nodes.map((n) => {
      if (n.id === target.parentId) {
        const kids = (n.children ?? []).slice();
        kids.splice(clampIndex(target.index, kids.length), 0, node);
        return { ...n, children: kids };
      }
      if (n.children) return { ...n, children: insertInto(n.children) };
      return n;
    });
  };
  if (target.parentId === null) {
    return { ...doc, root: insertInto(doc.root) };
  }
  return { ...doc, root: insertInto(doc.root) };
}

/** Immutably remove a node by id. Returns [newDoc, removedNode]. */
export function removeNode(
  doc: PageDocument,
  id: string
): [PageDocument, PageNode | null] {
  let removed: PageNode | null = null;
  const filter = (nodes: PageNode[]): PageNode[] =>
    nodes
      .filter((n) => {
        if (n.id === id) {
          removed = n;
          return false;
        }
        return true;
      })
      .map((n) => (n.children ? { ...n, children: filter(n.children) } : n));
  const root = filter(doc.root);
  return [{ ...doc, root }, removed];
}

/** Immutably move a node to a new target. No-op if move is invalid (into own subtree). */
export function moveNode(
  doc: PageDocument,
  id: string,
  target: DropTarget
): PageDocument {
  if (target.parentId === id) return doc;
  if (target.parentId && isDescendant(doc, id, target.parentId)) return doc;
  const [without, node] = removeNode(doc, id);
  if (!node) return doc;
  return insertNode(without, node, target);
}

/** Immutably merge new props into a node. */
export function updateNodeProps(
  doc: PageDocument,
  id: string,
  patch: Record<string, any>
): PageDocument {
  const walk = (nodes: PageNode[]): PageNode[] =>
    nodes.map((n) => {
      if (n.id === id) return { ...n, props: { ...n.props, ...patch } };
      if (n.children) return { ...n, children: walk(n.children) };
      return n;
    });
  return { ...doc, root: walk(doc.root) };
}

/** Deep-clone a node with fresh ids (for duplicate). */
export function cloneNode(node: PageNode): PageNode {
  return {
    id: generateId(),
    type: node.type,
    props: JSON.parse(JSON.stringify(node.props ?? {})),
    ...(node.children ? { children: node.children.map(cloneNode) } : {}),
  };
}

function clampIndex(i: number, len: number): number {
  return Math.max(0, Math.min(i, len));
}
