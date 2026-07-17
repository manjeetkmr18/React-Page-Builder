import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const packageName = "@manjeetkmr18/react-page-builder";

test("ES module entry points expose the public API", async () => {
  const core = await import(packageName);
  const editor = await import(`${packageName}/editor`);

  assert.equal(typeof core.PageRenderer, "function");
  assert.equal(typeof core.registerBlock, "function");
  assert.equal(typeof core.registerCoreBlocks, "function");
  assert.equal(typeof editor.PageBuilder, "function");
  assert.equal(typeof editor.Field, "function");
});

test("CommonJS entry points expose the public API", () => {
  const require = createRequire(import.meta.url);
  const core = require(packageName);
  const editor = require(`${packageName}/editor`);

  assert.equal(typeof core.PageRenderer, "function");
  assert.equal(typeof core.registerBlock, "function");
  assert.equal(typeof core.registerCoreBlocks, "function");
  assert.equal(typeof editor.PageBuilder, "function");
  assert.equal(typeof editor.Field, "function");
});

test("the published renderer produces server-side HTML", async () => {
  const { PageRenderer, registerCoreBlocks } = await import(packageName);
  registerCoreBlocks();

  const html = renderToStaticMarkup(
    React.createElement(PageRenderer, {
      document: {
        version: 1,
        root: [
          {
            id: "release-smoke-heading",
            type: "core/heading",
            props: {
              text: "Release smoke test",
              level: "h2",
              align: "left",
              color: "#111827",
              marginBottom: 0,
            },
          },
        ],
      },
    })
  );

  assert.match(html, /<h2/);
  assert.match(html, /Release smoke test/);
});

test("the editor bundles retain the Next.js client boundary", async () => {
  const [esm, cjs] = await Promise.all([
    readFile(new URL("../dist/editor.js", import.meta.url), "utf8"),
    readFile(new URL("../dist/editor.cjs", import.meta.url), "utf8"),
  ]);

  assert.match(esm.slice(0, 100), /["']use client["']/);
  assert.match(cjs.slice(0, 100), /["']use client["']/);
});
