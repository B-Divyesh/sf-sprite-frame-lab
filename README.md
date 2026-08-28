# Frame UV Lab

Frame UV Lab is a local-first sprite-sheet workbench for 2D artists and shader developers. It turns a selected frame into visible pixel bounds, normalized UV constants, an effect preview, an annotated GLSL example, and generic atlas JSON.

Live product: [sprite-frame-lab.sociobot.in](https://sprite-frame-lab.sociobot.in)

## What it does

- Opens PNG, JPEG, and WebP sheets locally; files are never uploaded.
- Builds even grids or imports TexturePacker/generic JSON frame maps.
- Selects frames from the sheet or a keyboard-operable frame list.
- Previews outline, tint, and dissolve effects in the free tier.
- Exports annotated GLSL constants and a portable generic atlas.
- Persists the current sheet and settings in IndexedDB and works offline.
- Offers a one-time $12 Pro license for extra effect templates through the hosted Sociobot checkout. No product ID or payment provider is embedded.

Shader output is intentionally labeled as an example: validate coordinate origin, filtering, syntax, and performance in the target engine.

## Run locally

Requires Node.js 20 or newer.

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. To create the exact static deployment artifact:

```sh
npm run build
```

The deployable site is written to `dist/`, with `dist/index.html` at its root.

## Verify

```sh
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e
```

The browser suite covers the sample workflow, 1×1 grid safety, duplicate-name rejection, outline shader compilation, IndexedDB restoration, an actual offline reload, keyboard focus and frame selection, 44px targets at 390px, legal pages, console errors, and serious/critical axe violations. Playwright 1.58.2 is pinned; the factory image includes its Chromium build.

## Frame JSON

Imports accept either a TexturePacker-style `frames` object or an array:

```json
{
  "frames": {
    "idle_0": { "frame": { "x": 0, "y": 0, "w": 32, "h": 32 } }
  }
}
```

```json
[
  { "name": "idle_0", "x": 0, "y": 0, "w": 32, "h": 32 }
]
```

## Privacy and assets

There are no analytics, trackers, CDN fonts, or third-party runtime scripts. The generated blueprint illustration is disclosed in the UI; its prompt and provenance are recorded in `.factory/design.md` and `assets/src/`. Legal pages ship at `/privacy/` and `/terms/`.

Licensed under the [MIT License](LICENSE).
