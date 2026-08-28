# Frame UV Lab — build handoff

Work order: `sprite-frame-lab-build-1` · Completed: 2026-08-28

## What shipped

- A finished vanilla TypeScript/Vite PWA at the repository root, building to `dist/`.
- Local PNG/JPEG/WebP import with decode, size, and format errors.
- A deterministic original 4×4 sample sheet for a zero-setup path.
- Even-grid frame mapping plus TexturePacker/generic atlas JSON import and validation.
- Click and keyboard frame selection, live pixel/UV bounds, frame descriptions, and canvas previews for outline, tint, dissolve, damage-flash, and scanline effects.
- Annotated GLSL example copy and generic atlas JSON download. Core export is not paywalled.
- IndexedDB workspace persistence, explicit JSON atlas ownership, offline/install manifest, versioned service-worker shell, offline status, and update toast.
- $12 one-time Pro presentation, hosted Sociobot checkout link, returned-token capture, device restore field, once-daily verification cache, optimistic offline unlock, and quiet revocation behavior. No hardcoded product ID.
- Responsive blueprint drafting-sheet system, original generated hero plate (40 KB optimized WebP), authored PWA icons, 390px layout, focus/reduced-motion treatments, and privacy/terms pages.

## Verification

Run from a clean clone with Node.js 20+:

```sh
npm ci
npm test
npm run build
npm run test:e2e
```

- `npm test`: 7/7 unit tests passing.
- `npm run test:e2e`: 4/4 Chromium tests passing, including real `context.setOffline(true)` reload with IndexedDB workspace restored, arrow-key frame navigation, 390 × 844 mobile flow, no console errors, and axe with zero serious/critical findings in empty and editor states.
- `npm run build`: passing; output is `dist/` with `dist/index.html` at root.
- Production payload: inlined JS + CSS shell is 35.9 KB raw / 12.25 KB gzip; optimized hero is 40.2 KB. This is under the 200 KB JS, 50 KB CSS, and 300 KB hero budgets.
- Lighthouse 13 mobile/default throttling against the production preview: Performance **100**, Accessibility **100**, Best Practices **100**, SEO **92**; LCP **1.0 s**, total blocking time **20 ms**, CLS **0**.
- `npm audit`: 0 vulnerabilities.

## Asset provenance

`assets/src/uv-blueprint-plate.png` was generated through the factory image deployment using `/opt/fleet/lib/gen-image.sh`, reviewed for text artifacts/brands/unwanted symbols, and optimized to `public/assets/uv-blueprint-plate.webp`. The exact prompt and review are in `.factory/design.md` and its adjacent JSON sidecar. The sample sprite and icons are authored in repository code.

## Known gaps and next steps

- GLSL is intentionally generic and must be validated in the target engine; engine-specific Godot/Unity export adapters are future Pro targets.
- The factory still needs to register the live/test paid product and switch environment routing at release. The app uses the required production slug URL and contains no provider secret.
- SEO scored 92 because the local preview has no crawlable deployed-origin canonical metadata; this does not affect the installed editor.
