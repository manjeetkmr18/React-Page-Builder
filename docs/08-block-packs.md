# Publishing Block Packs

The registry makes third-party block collections possible. A block pack is just an npm package that exports `BlockDefinition[]` and a registration helper.

## Minimal pack

```text
my-blocks/
  src/index.tsx
  package.json
  tsconfig.json
```

```tsx
// src/index.tsx
import type { BlockDefinition } from "@manjeetkmr18/react-page-builder";
import { registerBlocks } from "@manjeetkmr18/react-page-builder";

export const pricingTable: BlockDefinition = {
  type: "acme/pricing-table",
  label: "Pricing table",
  category: "Marketing",
  icon: "Price",
  defaultProps: { plans: 3, accent: "#16a34a" },
  fields: [
    { name: "plans", label: "Plans", type: "range", min: 1, max: 4 },
    { name: "accent", label: "Accent", type: "color" },
  ],
  render: ({ node }) => {
    return null;
  },
};

export const acmeBlocks: BlockDefinition[] = [pricingTable];

export function registerAcmeBlocks() {
  registerBlocks(acmeBlocks);
}
```

```jsonc
{
  "name": "@acme/page-builder-blocks",
  "peerDependencies": {
    "@manjeetkmr18/react-page-builder": ">=0.1.0",
    "react": ">=18"
  }
}
```

Consumers then do:

```ts
// lib/blocks.ts
import { registerCoreBlocks } from "@manjeetkmr18/react-page-builder";
import { registerAcmeBlocks } from "@acme/page-builder-blocks";

registerCoreBlocks();
registerAcmeBlocks();
```

## Conventions

- Namespace every type, for example `acme/pricing-table`.
- Never rename a shipped type. Type strings live inside saved documents forever.
- Depend on the builder as a peer dependency so the app has one registry instance.
- Export the array and a register function. The array allows cherry-picking.
- Keep `render` SSR-safe. If a block needs browser APIs, isolate that in a client component and document it.
- Ship TypeScript types.

## Publishing this repo itself

```bash
npm login
npm version patch
npm publish
git push --follow-tags
```

`publishConfig.access: "public"` is already set for the scoped package.
