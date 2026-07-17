# Document Schema

A page is one JSON object:

```ts
interface PageDocument {
  version: 1;
  root: PageNode[];
}

interface PageNode {
  id: string;
  type: string;
  props: Record<string, any>;
  children?: PageNode[];
}
```

## Example

```json
{
  "version": 1,
  "root": [
    {
      "id": "n_hero",
      "type": "core/section",
      "props": { "background": "#0f172a", "paddingY": 96, "paddingX": 24, "maxWidth": 1140 },
      "children": [
        {
          "id": "n_title",
          "type": "core/heading",
          "props": { "text": "Build pages visually", "level": "h1", "align": "center", "color": "#ffffff" }
        }
      ]
    }
  ]
}
```

## Guarantees and rules

- Order matters. Arrays render first-to-last.
- Ids are unique within a document. The built-in utilities create ids with `generateId()`.
- Props must survive `JSON.stringify`. Use primitives, arrays, objects, and ISO strings.
- Unknown props are preserved. The inspector only edits declared fields.
- Unknown block types do not crash rendering. The renderer skips them unless you provide `renderUnknown`.
- `version` is the migration hook for future schema changes.

## Storing documents

The document is deliberately storage-agnostic:

- Postgres: `jsonb`.
- MongoDB: store as-is.
- Headless CMS: JSON field.
- Filesystem/Git: pretty-printed `.json`.
- Edge/config stores: any value type that can hold JSON.

## Validation

The package exports runtime guards:

```ts
import { assertPageDocument, isPageDocument } from "@manjeetkmr18/react-page-builder";

const parsed = JSON.parse(raw);

if (!isPageDocument(parsed)) {
  throw new Error("Invalid page JSON");
}

assertPageDocument(parsed); // narrows to PageDocument or throws
```

These guards validate the document shape, not your business rules. For production writes, also consider:

- document size limits;
- allowed block-type checks through `getBlock()`;
- URL protocol checks for `href` and `src`;
- sanitization for custom blocks that render raw HTML.

## Versioning strategy

Prefer adding props with defaults over renaming or removing props. Block `type` strings are stored in every document, so keep shipped type names stable forever.

If you need migrations:

```ts
function migrate(doc: any): PageDocument {
  if (doc.version === 1) return doc;
  throw new Error(`Unsupported document version: ${doc.version}`);
}
```
