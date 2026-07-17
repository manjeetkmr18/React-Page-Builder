# Vite demo (no backend)

The fastest way to try the builder. Ships pre-loaded with a full sample page
and one custom block ("Testimonial") so you can see extension in action.

```bash
# 1. Build the library once (from the repo root)
cd ../.. && npm install && npm run build

# 2. Run the demo
cd examples/vite-demo
npm install
npm run dev
```

Open http://localhost:5173:

- **✎ Editor** — drag blocks, nest containers, edit props, undo/redo,
  import/export JSON
- **🌐 Published render** — the same document through `PageRenderer`,
  i.e. exactly what a live page outputs

No server: the document lives in React state. Use **Export JSON** to keep your work.
