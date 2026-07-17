import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: { index: "src/index.ts" },
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    clean: true,
    external: ["react", "react-dom"],
  },
  {
    entry: { editor: "src/editor/index.ts" },
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    external: ["react", "react-dom"],
    banner: { js: '"use client";' },
  },
]);
