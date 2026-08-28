# Independent product verification — FAIL

Verified 2026-08-28 UTC for work order `sprite-frame-lab-verify-1`.

- Candidate: `ff128e60a55d8efcb76e5088622678ab06ecab8c`
- Repository: `https://github.com/B-Divyesh/sf-sprite-frame-lab.git`, branch `main`
- Production URL: `https://sprite-frame-lab.sociobot.in`
- Artifact: offline-first PWA
- Verdict: **FAIL**

The free local-first workflow is useful and mostly polished, the candidate builds cleanly, and the deployed artifact exactly matches it. It does not meet the acceptance contract because the advertised purchase path is unavailable, the default outline export does not implement the previewed effect, invalid grid dimensions produce degenerate frames, duplicate frame names are silently lost on export, and keyboard/touch accessibility misses the required baseline.

## Release-blocking defects

### HIGH — Pro checkout is unavailable in production

The app advertises “Frame UV Pro · $12” and links `Buy Pro securely` to the required Sociobot endpoint. A fresh request to that exact production link returned:

```text
GET https://api.sociobot.in/api/v1/products/sprite-frame-lab/checkout
HTTP/2 404
{"error":"enabled factory product","status":404}
```

No buyer can begin checkout. This is fresh production evidence, not an inference from the prior builder handoff. The verification endpoint itself is online: a deliberately invalid token returned HTTP 200 with `{"expires_at":null,"reason":"invalid","valid":false}` and the correct CORS origin.

### HIGH — The default exported outline shader applies no outline

Reproduction:

1. Load the 16-frame sample.
2. Leave the default effect on “Pixel outline”.
3. Select “Copy GLSL” and inspect `apply_frame_effect`.

The preview visibly applies an outline, but the corresponding generated function contains only:

```glsl
// Outline needs neighboring atlas texels; sample with pixel_size offsets.
return color;
```

It therefore returns the original sample unchanged. This breaks the core promise that a previewed frame effect yields a usable annotated shader example. The generated outline, tint, and dissolve snippets do compile when embedded in a minimal WebGL2 fragment-shader wrapper, so the defect is specifically missing outline behavior rather than syntax.

## Other defects

### MEDIUM — Accepted grid bounds can create zero-area frames

A valid 1×1 PNG can be opened, after which the controls accept 64 columns and 4 rows. The UI then produces 256 frames, 255 of which display a zero width or height. UV minimum and maximum can be identical and the exported atlas contains zero-area rectangles. The controls clamp numeric values to 1–64 but do not constrain them to the image dimensions or reject the resulting invalid grid.

### MEDIUM — Duplicate frame names are silently discarded on export

A valid generic map containing two rectangles both named `idle` is accepted and displayed as two frames. Exporting the atlas produces only one `idle` entry because object-key conversion overwrites the first. No validation or warning is shown, and the success toast still reports two exported frames. This is silent output data loss.

### MEDIUM — Import focus and touch targets miss the accessibility contract

Keyboard focus reaches the sprite import input, but the input is `opacity: 0` and its visible label has no `:focus-within` treatment. The focused control's 3 px outline is therefore invisible. Keyboard-only import has no visible location even though the rest of the keyboard flow works.

At 390 px, visible interactive targets below the required 44 px include `Use sample`, `Copy GLSL`, `Export atlas JSON`, and `Buy Pro securely` at 36 px high, plus footer/legal links at 15–19 px high. These miss the attached accessibility/design target-size requirement.

### LOW — Production response hardening and asset caching are incomplete

Production sends HSTS, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff`, Brotli compression, and a short revalidation policy. It does not send Content-Security-Policy, Permissions-Policy, or an explicit anti-framing policy. All tested resources, including the 40 KB WebP and icons, use `Cache-Control: public, must-revalidate, max-age=30` rather than long-lived immutable caching. The service worker mitigates repeat-load cost after installation, but the HTTP policy misses the supplied performance guidance.

## Clean-checkout and build evidence

The workspace began clean at the candidate SHA, and `origin/main` resolved to the same SHA.

| Check | Result |
| --- | --- |
| Runtime | Node `v22.23.2`, npm `10.9.8` |
| `npm ci` | PASS; 58 packages installed |
| `npm audit --audit-level=low` | PASS; 0 vulnerabilities |
| `npm test` | PASS; 1 file, 7 tests |
| `npx tsc --noEmit` | PASS |
| Lint | No lint script or lint configuration exists |
| `npm run build` | PASS; TypeScript plus Vite 7.3.6, `dist/` produced |
| `npm run test:e2e` | PASS; 4/4 Chromium tests |

Production output is 101,202 bytes total. The single-file shell is 35,900 bytes raw / 12,228 bytes gzip, containing 24,539 bytes of inline JavaScript and 10,616 bytes of inline CSS. The hero WebP is 40,218 bytes. These are within the 200 KB JS, 50 KB CSS, 120 KB font, and 300 KB hero budgets; there are no webfont files.

## Deployment identity

The live deployment matches the candidate's exact production build:

| Artifact | Local/live SHA-256 |
| --- | --- |
| `/index.html` | `72c605ab55e88a9f7059c2cc69428c2af20134d45bfbc6ad5c3d071b0b32af55` |
| `/sw.js` | `5f3216d89de979ec832d575d04ab57081a06e19986a2616ede7c778627792fd6` |
| `/manifest.webmanifest` | `a5a34aded77ed68434864d60550672b7a581053e386a2c193d6b657a7648597a` |

The live root returned HTTP/2 200, 35,900 bytes, and Brotli compressed to 12,250 transferred bytes. `git ls-remote origin refs/heads/main` also returned the candidate SHA.

## End-to-end product evidence

Verified against both the local production preview and live URL in fresh Chromium contexts:

- Loaded the original 4×4 sample, selected frame 6, and obtained pixel origin `64, 64`, size `64 × 64`, UV min `0.250000, 0.250000`, UV max `0.500000, 0.500000`.
- Pixel outline, tint, and dissolve generated distinct canvas results. Amount boundaries 0% and 100% updated both preview state and shader text.
- Clipboard output exactly matched the displayed GLSL. The standard 16-frame atlas download parsed as JSON with all 16 unique frames and the correct image metadata.
- Valid generic JSON imported successfully. Malformed JSON and out-of-bounds rectangles produced specific recovery text; a subsequent valid import succeeded.
- Grid inputs clamp 0 to 1 and 65 to 64. The valid-but-degenerate small-image case above remains defective.
- Refresh restored image blob, frame map, selection, and settings from IndexedDB.
- Keyboard-only sample loading, frame Arrow navigation, Home/End selection, and effect selection worked. The import focus defect above remains.
- An actual invalid license produced the correct production verification request, locked Pro again, and left free tools available.
- PNG/JPEG/WebP type rejection and corrupt-image decode errors were actionable, and a valid local PNG recovered without reload.
- Desktop at 1440×1000 and mobile at 390×844 were visually inspected. Both layouts had zero horizontal overflow. At 200% root text size, the 390 px layout still had zero horizontal overflow.

## Privacy and request audit

During the entire free editor workflow—including local image load, effects, persistence, and export—the only requests were same-origin app assets plus browser-local `blob:` URLs. No artwork request, analytics request, CDN font, tracker, or third-party runtime script was observed. Source search found only the documented Sociobot license verification request. Privacy and terms pages accurately disclose IndexedDB/localStorage and the paid verification boundary.

## PWA and offline evidence

- Manifest parsed successfully in Chromium with zero manifest or installability errors; 192 px, 512 px, and maskable 512 px icons have the declared dimensions.
- Service worker installed and activated, controlled the page, and created the versioned `frame-uv-v1.5` cache.
- After `context.setOffline(true)`, both an editor reload with IndexedDB restoration and a cold navigation to the manifest start URL `/?v=1` succeeded from the service worker. The offline banner was visible and exports/editor UI remained available.
- Calling `registration.update()` against the unchanged live worker completed normally with no waiting worker.
- In an isolated production-build server, serving a byte-changed worker and calling `registration.update()` triggered the in-app “A new lab build is ready. Reload” notice and visible Reload button. This exercises the update path without modifying product source or production.

## Accessibility, errors, and performance

- Axe 4.13.0: zero violations of any impact in fresh empty and populated editor states, locally and live; zero violations on `/privacy/` and `/terms/`. In particular, there were zero serious/critical findings.
- Main page: correct title, `lang="en"`, exactly one `h1`, exactly one `main`, and no images lacking `alt`.
- No console errors or uncaught page errors occurred in the tested empty, editor, mobile, offline, privacy, or terms flows.
- `prefers-reduced-motion: reduce` matched and reduced transitions to `0.01ms` with automatic scrolling.
- Live Lighthouse 13.0.1 mobile/default throttling: Performance 99, Accessibility 100, Best Practices 100, SEO 100; FCP 0.8 s, LCP 1.1 s, TBT 110 ms, CLS 0, Speed Index 0.9 s.

## Required disposition

Do not promote this candidate as complete. Register/enable the production billing product, implement the outline shader export, reject grids that produce zero-area frames, reject or safely encode duplicate names, and fix visible file-input focus plus all undersized targets. Then rerun the full verification, including production checkout and live artifact identity.
