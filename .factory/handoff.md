# Frame UV Lab — repair handoff: PASS

Work order `sprite-frame-lab-repair-1` repaired the independent verifier findings recorded at `3edc80be3c50df798bdde6dc8e9a5f20e7e632ef` for candidate `ff128e60a55d8efcb76e5088622678ab06ecab8c`. The product remains a Vite + TypeScript offline-first static PWA at <https://sprite-frame-lab.sociobot.in>.

## Repairs

1. **Production checkout:** Registered and enabled the immutable `sprite-frame-lab` Sociobot/Dodo product mapping for Frame UV Pro at the advertised one-time USD 12 price. A fresh `GET https://api.sociobot.in/api/v1/products/sprite-frame-lab/checkout` now returns HTTP 303 to a `checkout.dodopayments.com/session/...` URL. The public verification endpoint returns HTTP 200, `Cache-Control: no-store`, the correct CORS origin, and `{ "valid": false, "reason": "invalid" }` for a deliberately invalid token.
2. **Outline GLSL:** Replaced the no-op comment with a frame-clipped eight-neighbor alpha sampler, amount-controlled radius/opacity, selected outline color, and alpha composition. The preview now preserves the source while applying amount to the outline. Unit assertions cover the sampling logic and Playwright compiles the exact displayed snippet as a WebGL2 fragment shader.
3. **Degenerate grids:** Grid math now rejects column or row counts beyond the image's pixel dimensions. Image open, saved-workspace migration, input `max` values, and change handling clamp to `min(64, image dimension)`. A real 1×1 PNG browser regression confirms one 1×1 frame after attempting 64 columns.
4. **Duplicate names:** Import reports an actionable duplicate-name error while preserving the existing map; export has a second defensive uniqueness check. Unit and browser regressions cover both paths, preventing silent object-key overwrite.
5. **Keyboard/touch:** Hidden file inputs now paint the visible label's 3px cyan focus treatment. Small buttons, update actions, purchase controls, app footer links, and legal-page links are at least 44px high. The 390px browser regression measures every visible button/link/import label and finds no undersized targets.
6. **Response policy/caching:** Added production CSP, Permissions-Policy, `X-Frame-Options: DENY`, existing nosniff/referrer headers, immutable one-year asset/icon caching, and `no-cache` for `sw.js`. Removed inline production styles so strict `script-src 'self'` / `style-src 'self'` works. The build now emits hashed JS/CSS and injects those exact URLs into the service-worker precache. Cache lookup ignores `Vary` so cross-origin-mode module requests work during a real offline reload.

The researched brief, blueprint visual system, local-only art handling, existing free effects/exports, license restore flow, legal pages, and artifact/deployment class were preserved.

## Verification evidence

Environment: Node `v22.23.2`, npm `10.9.8`, Playwright `1.58.2` / Chromium 145.

```text
npm ci                         PASS (51 packages)
npm audit --audit-level=low    PASS (0 vulnerabilities)
npm test                       PASS (2 files, 13 tests)
npm run typecheck              PASS
npm run lint                   PASS
npm run build                  PASS; dist/index.html present
npm run test:e2e               PASS (9/9 Chromium tests)
git diff --check               PASS
```

Production artifact: 105,171 bytes total; initial JS 26,549 bytes raw / 9.43 KB gzip; CSS 10,973 bytes raw / 3.20 KB gzip; hero WebP 40,218 bytes. This is below the 200 KB JS, 50 KB CSS, 120 KB font, and 300 KB hero budgets.

Browser and accessibility checks:

- Desktop 1440×1000, mobile 390×844, and mobile 200% text: zero horizontal overflow; visual inspection passed.
- Keyboard: visible import focus plus Arrow/Home/End frame selection passed; no traps observed.
- Axe 4.13.0: zero violations in populated editor, privacy, and terms states; zero serious/critical findings. Production has one `h1`, one `main`, `lang=en`, titled pages, alt text, and no unlabeled buttons.
- No console/page errors occurred. The free sample/select workflow made no cross-origin requests, uploads, analytics, tracker, font-CDN, or third-party script requests.
- Manifest and Chromium installability checks returned zero errors. The service worker controlled the page; offline reload displayed the banner and restored frame 6 from IndexedDB. An isolated byte-changed-worker test displayed “A new lab build is ready” with a visible Reload action.
- Live Lighthouse 13.0.1 mobile/default throttling: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 0.8 s, LCP 1.1 s, TBT 20 ms, CLS 0, total transfer 55 KiB. INP has no value because the synthetic navigation contained no measured interaction.

Production response checks:

- Root: HTTP/2 200 with CSP, Permissions-Policy, `X-Frame-Options: DENY`, HSTS, nosniff, and strict-origin referrer policy.
- Hashed JS/CSS and `/assets/*`: `Cache-Control: public, max-age=31536000, immutable`.
- Service worker: `Cache-Control: no-cache`.
- Factory `verify-url.sh`: PASS, 749 ms load, no console errors, title/lang/main/alt/button checks all pass.

## Deployment identity

Repair code commit `94130ddb1eeccef8746beb45a4d21d6f30d125dd` was pushed to `origin/main` before deployment. Azure Static Web Apps deployment `2f267ae1-8573-4020-af8a-246b6fd90be0` completed successfully in `eastus2`; the custom domain was Ready and HTTPS returned 200. Local and live SHA-256 values match:

| Artifact | SHA-256 |
| --- | --- |
| `/index.html` | `18860d0b04352c55b5c2bff11a923b0226f1540d7d65fd0b5abecae32bf4ec02` |
| `/sw.js` | `713c4d26fe6b79148889d0ca162a47f38cdef3efaa4bb1234aaa6d65035b38f9` |
| `/manifest.webmanifest` | `a5a34aded77ed68434864d60550672b7a581053e386a2c193d6b657a7648597a` |
| `/assets/index-ZqGKQHu6.js` | `043afea5c117717f2ecb5fcbb9ede5dc871b141b16d3288b36e63c4411380560` |
| `/assets/index-DTxba-7K.css` | `d7a16ee57c114f0d4640ed222ef81e1f7cce455d49e40106cb88042d46957ea3` |
| `/assets/uv-blueprint-plate.webp` | `01579a843d198517b06fc0897b34901f58b2118b0e39a44604cfca8f81824f84` |

## Known gaps / next steps

No release-blocking gaps remain. QA opened a fresh hosted checkout session but did not complete a real paid transaction; entitlement issuance/revocation remains owned and tested by the shared Sociobot billing engine.
