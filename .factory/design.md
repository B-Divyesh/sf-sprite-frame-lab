# Frame UV Lab — visual system

## Thesis

Frame UV Lab is a **blueprint drafting sheet for texture coordinates**. It should feel like a precise working document laid over a midnight cutting mat: ruled, annotated, and tactile, but never nostalgic decoration. The selected sprite is the specimen; measurements, crosshairs, crop marks, and cyan pencil lines explain what the tool is doing. This fits the job because UV work is spatial math, and a drafting language makes invisible normalized bounds visible and checkable.

The experience is intentionally single-mode. A deep navy surface protects sprite color fidelity and lets the cyan construction lines remain legible. This is an explicit, product-specific dark treatment, not an absent theme.

## Palette

| Token | Hex | Use |
| --- | --- | --- |
| `--ink-950` | `#07131C` | page and canvas ground |
| `--ink-900` | `#0B1E2A` | raised drafting panels |
| `--ink-800` | `#123042` | borders and wells |
| `--paper` | `#F1F7F2` | primary text |
| `--paper-muted` | `#A8BBC1` | secondary copy (7:1 on background) |
| `--cyan` | `#55DDE0` | active geometry, focus, primary action |
| `--cyan-ink` | `#042126` | text on cyan |
| `--amber` | `#FFC857` | warnings and unsaved annotations |
| `--green` | `#71E6A2` | valid/export-ready |
| `--red` | `#FF7A7A` | errors |

Grid lines use cyan at 7–15% opacity and are never the only carrier of meaning. All text and focus combinations meet WCAG AA contrast.

## Type

Use two local system stacks to avoid network fonts and keep the first load tiny:

- Labels, controls, and body: `Inter`-like system sans (`ui-sans-serif`, `system-ui`). Direct and readable at 16px minimum.
- Coordinates and code: `ui-monospace`, `SFMono-Regular`, `Consolas`. Tabular figures turn values into drafting measurements.

Scale: 12px technical overline, 14px compact annotation, 16px body/control, 20px section title, clamp(32–56px) sole h1. Body line-height is 1.5.

## Spacing and geometry

The base unit is 4px; primary gaps are 8, 12, 16, 24, 32, and 48px. Controls are at least 44px high. Corners are clipped or tight (2–6px), avoiding soft generic cards. Panels are grouped by proximity and interrupted by calibration ticks. Desktop uses a 300px source rail, flexible stage, and 330px inspector; at 980px it becomes a single drafting column. At 390px, secondary annotations compress, panels stack, and the live canvas remains first after source controls.

## Interaction grammar

- Primary action: a cyan filled control with an arrow or direct verb.
- Selection: cyan outline plus a visible check/label, never color alone.
- Sliders immediately redraw the preview and update a live numeric readout.
- Frame selection follows listbox keyboard behavior: arrows move, Home/End jump, Enter/Space select.
- Import surfaces name accepted files and show recovery instructions for errors.
- Export actions confirm the file and bounds copied/saved in a polite live region.

## Depth and motion

Panels sit one tonal step above the page; the preview well sits one step below them. A selected frame arrives with a 180ms opacity/scale settle, and notices slide from their origin over 220ms. No decorative loops. Under `prefers-reduced-motion: reduce`, transforms and smooth scrolling are removed and changes are immediate while hierarchy remains through line weight and tone.

## Asset plan and provenance

- Original generated hero/empty-state plate: a square blueprint-style sprite-sheet drafting diagram—small geometric robot animation frames, crop marks, UV arrows, and a magnified frame. It explains the frame-to-atlas relationship without claiming engine output.
- Hand-authored SVG app icons: compass/crop-mark motif derived from the product grid. MIT with the repository.
- Built-in sample sheet: deterministic HTML Canvas pixels authored in product code; no external art.

### Image prompt sheet

Subject: a technical animator's blueprint showing a compact 4×4 sprite sheet of a tiny geometric robot in successive poses, one cell enlarged and connected with dimension arrows. World: a midnight-blue drafting mat. Materials: cyan pencil, faint paper grain, precise ink. Light: flat archival scan with restrained luminous cyan. Lens: orthographic top-down. Palette words: blueprint navy, electric cyan, chalk white, safety amber. Composition: wide 3:2, dense diagram on the right with breathing room, no UI mockup. Negative list: no readable text, no letters, no numbers, no logos, no watermark, no brand marks, no copyrighted characters, no photoreal people, no gradients masquerading as UI.

Generated with the factory image deployment through `/opt/fleet/lib/gen-image.sh` on 2026-08-28. The selected image and prompt sidecar live in `assets/src/`; optimized derivatives live in `public/assets/`. Generated imagery is original to this product.

## Accessibility and content

The document has one h1 and one main landmark. Every icon is paired with a label unless decorative. Focus is a 3px cyan/ink double ring. Status and errors are announced. Canvas previews have a generated text alternative describing the selected frame, bounds, and effect. Generated shader code is explicitly labeled as an example requiring validation in the target engine.
