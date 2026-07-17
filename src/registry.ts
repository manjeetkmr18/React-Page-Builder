import type { BlockDefinition } from "./types";

declare global {
  // eslint-disable-next-line no-var
  var __manjeetReactPageBuilderRegistry: Map<string, BlockDefinition> | undefined;
}

function getRegistry(): Map<string, BlockDefinition> {
  const globalScope = globalThis as typeof globalThis & {
    __manjeetReactPageBuilderRegistry?: Map<string, BlockDefinition>;
  };
  if (!globalScope.__manjeetReactPageBuilderRegistry) {
    globalScope.__manjeetReactPageBuilderRegistry = new Map<string, BlockDefinition>();
  }
  return globalScope.__manjeetReactPageBuilderRegistry;
}

/**
 * Global block registry. Works like Elementor's widget manager:
 * call registerBlock() before rendering the editor or the renderer.
 *
 * The registry is stored on the runtime-global object so it is shared
 * across the package's different entry points (editor vs renderer).
 */
export function registerBlock(def: BlockDefinition): void {
  if (!def.type) throw new Error("registerBlock: block needs a `type`.");
  getRegistry().set(def.type, def);
}

export function registerBlocks(defs: BlockDefinition[]): void {
  defs.forEach(registerBlock);
}

export function unregisterBlock(type: string): void {
  getRegistry().delete(type);
}

export function getBlock(type: string): BlockDefinition | undefined {
  return getRegistry().get(type);
}

export function getAllBlocks(): BlockDefinition[] {
  return Array.from(getRegistry().values());
}

export function getBlocksByCategory(): Record<string, BlockDefinition[]> {
  const grouped: Record<string, BlockDefinition[]> = {};
  for (const def of getRegistry().values()) {
    const cat = def.category ?? "Other";
    (grouped[cat] ??= []).push(def);
  }
  return grouped;
}
