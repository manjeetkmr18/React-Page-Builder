# Core Blocks Reference

Call `registerCoreBlocks()` to register the built-in starter set. All core block types are namespaced `core/*`. Treat these blocks as a useful default kit and as reference implementations for your own blocks.

```ts
import { registerCoreBlocks } from "@manjeetkmr18/react-page-builder";

registerCoreBlocks();
```

## Layout

### `core/section` - Section container

Full-width band with a centered content wrapper. This is the standard top-level page block.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `background` | color | `#ffffff` | Any CSS color |
| `paddingY` | number | `48` | top/bottom padding in px |
| `paddingX` | number | `24` | left/right padding in px |
| `maxWidth` | number | `1140` | inner wrapper max width |
| `fullWidth` | boolean | `false` | ignore `maxWidth` |

### `core/columns` - Columns container

CSS grid with equal columns. Children fill columns in order.

| Prop | Type | Default |
| --- | --- | --- |
| `columns` | number, 1 to 6 | `2` |
| `gap` | number | `24` |
| `stackOnMobile` | boolean | `true` |

Children fill the grid from left to right. In the editor, drag blocks onto the Columns container; the editor and published renderer use the same grid positions. When `stackOnMobile` is enabled, the columns become one vertical stack below 768px.

### `core/spacer` - Spacer

Vertical gap. Shows a lightweight placeholder in the editor and empty space on the live page.

| Prop | Type | Default |
| --- | --- | --- |
| `height` | number | `40` |

### `core/divider` - Divider

Horizontal rule. Main props: `color`, `thickness`, `marginTop`, `marginBottom`.

## Basic

### `core/heading` - Heading

Props: `text`, `level`, `align`, `color`, `marginBottom`, spacing props.

### `core/text` - Text

Paragraph with preserved line breaks. Props: `text`, `align`, `color`, `fontSize`, `lineHeight`, `marginBottom`, spacing props.

### `core/button` - Button

Renders an `<a>` styled as a button. The link is disabled while editing so clicks select the block instead of navigating.

Props: `label`, `href`, `align`, `background`, `color`, `radius`, `paddingY`, `paddingX`, spacing props.

## Media

### `core/image` - Image

Plain `<img>` with `width: 100%`. Props: `src`, `alt`, `radius`, spacing props.

Use `mediaAdapter` on `<PageBuilder>` if you want the image field to upload to your own API/cloud storage instead of typing a URL.

### `core/embed` - Embed / HTML

Renders raw HTML via `dangerouslySetInnerHTML`. Prop: `html`.

Security: only expose this block to trusted editors, or sanitize `html` server-side before rendering documents from untrusted users.

## Using a subset

`registerCoreBlocks()` is optional. To register only some blocks:

```ts
import { coreBlocks, registerBlocks } from "@manjeetkmr18/react-page-builder";

registerBlocks(coreBlocks.filter((block) => block.type !== "core/embed"));
```
