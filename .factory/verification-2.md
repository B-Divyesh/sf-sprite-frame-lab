# Frame UV Lab — independent verification 2: FAIL

**Candidate:** `7da70b5a7f4cd4f62c723941b47d3baf42ada19b`  
**Live URL:** <https://sprite-frame-lab.sociobot.in>  
**Verified:** 2026-08-28 (UTC)  
**Verdict:** **FAIL** — one P2 local-first durability defect prevents acceptance.

## Release-blocking defect

### P2 — last workspace change is lost on an immediate refresh or tab close

The app advertises and is required to preserve local state across refresh/tab
close. `scheduleSave()` defers every IndexedDB write by 350 ms. That timer is
not flushed on `pagehide`/`visibilitychange`, so an action followed immediately
by a reload loses the latest change.

Fresh live reproduction:

1. Open the live app in a new browser context and choose **Load 16-frame sample**.
2. Wait until the initial workspace reports `Saved …` (frame 1 is durable).
3. Click frame **06** and immediately reload.
4. The restored heading is `frame_00`, not `frame_05`.

This is deterministic with a prior successful save and demonstrates that the
most recent selection has not reached IndexedDB. The same debounce protects
effect, map, and imported-sheet changes. It contradicts the PWA/local-first
contract that state survives refresh and tab close. Normal offline reload *does*
pass after the `Saved …` status appears.

Recommended repair: persist the state synchronously/on every meaningful change,
or flush the pending save on `visibilitychange` and `pagehide`; add this
immediate-reload regression to Playwright.

## Passing evidence

### Clean checkout and automated quality gates

Environment: Node `v22.23.2`, npm `10.9.8`, Playwright `1.58.2`, Chromium
from the provided Playwright installation.

```text
npm ci                 PASS — 51 packages, 0 audit vulnerabilities
npm test               PASS — 2 files, 13 tests
npm run typecheck      PASS
npm run lint           PASS
npm run build          PASS — dist/ produced
npx playwright test    PASS — 9/9 Chromium tests in 28.4 s
git diff --check       PASS
```

The exact production build emits 26,549 B raw / 9,430 B gzip initial JS and
10,973 B raw / 3,200 B gzip CSS. The 40,218 B WebP is below the 300 KB image
budget; no fonts are shipped. All are within the applicable static-PWA budgets.

### Product workflow and recovery

Independent live Playwright checks completed with zero console/page errors:

- Empty state loads with title, `lang=en`, one `h1`, and one `main`; importing
  a sample produces a real 4×4/16-frame sheet.
- Selecting frame 06 produces UV min `0.250000, 0.250000`; keyboard End moves
  to `frame_15`; exported atlas JSON contains all 16 frame objects.
- Invalid JSON gives an actionable parse error, then valid one-frame JSON
  imports successfully and **Return to grid** restores 16 frames.
- Repository browser regressions additionally pass one-pixel-grid clamping,
  duplicate-name rejection, WebGL2 compilation of generated outline GLSL, and
  legal-page checks.
- Desktop 1440×1000 and 390×844 have no horizontal overflow. At 390 px no
  visible button/link/import target is under 44 px. Frame-list Arrow/Home/End,
  visible 3 px cyan import focus, and reduced-motion (`0.01ms`) all pass.
- Axe 4.13.0, independently against empty and populated live states, reports
  zero serious/critical violations.

### PWA behavior

- The live page becomes service-worker controlled. After a completed save,
  forcing the browser offline and reloading shows the Offline mode banner and
  restores `frame_05` with no errors.
- An update test against an isolated temporary copy of the exact `dist/`
  artifact changed only a comment byte in `sw.js`, waited for the HTTP
  modification time, then called `registration.update()`. The app displayed
  `A new lab build is ready.` and a visible **Reload** action. No product file
  was modified for that probe.
- Manifest has standalone display, versioned start URL, 192/512 icons, and a
  maskable icon. `sw.js` is `no-cache`; hashed assets are immutable for a year.

### Privacy, policy, deployment identity, and performance

- Normal free-editor navigation requested only same-origin HTML, JS, CSS,
  icon, image, and a local `blob:` image; no analytics, tracker, third-party
  font/script, upload, or API request occurred. Source review shows the only
  cross-origin runtime capability is the documented Sociobot license API.
- Checkout returned `303` to hosted Dodo. Invalid-token verification returned
  HTTP 200, `Cache-Control: no-store`, correct CORS, and
  `{"valid":false,"reason":"invalid"}`.
- Root, legal pages, service worker, JS, and CSS return HTTPS plus CSP, HSTS,
  `X-Frame-Options: DENY`, `nosniff`, strict-origin referrer policy, and the
  declared Permissions-Policy.
- Local/live SHA-256 matches:

| Asset | SHA-256 |
| --- | --- |
| `index.html` | `18860d0b04352c55b5c2bff11a923b0226f1540d7d65fd0b5abecae32bf4ec02` |
| `sw.js` | `713c4d26fe6b79148889d0ca162a47f38cdef3efaa4bb1234aaa6d65035b38f9` |
| `assets/index-ZqGKQHu6.js` | `043afea5c117717f2ecb5fcbb9ede5dc871b141b16d3288b36e63c4411380560` |
| `assets/index-DTxba-7K.css` | `d7a16ee57c114f0d4640ed222ef81e1f7cce455d49e40106cb88042d46957ea3` |

- Live mobile Lighthouse 13.4 produced Performance 96, Accessibility 100,
  Best Practices 100, and SEO 100; FCP 1.8 s, LCP 2.1 s, TBT 160 ms, CLS 0,
  and TTI 2.1 s. Its report was written but Lighthouse exited non-zero because
  this container's tab crashed while collecting the full-page screenshot after
  metrics/audits (`TARGET_CRASHED`). This is a tooling caveat; Playwright runs
  remained stable.

## Defect summary

| Severity | Count | Detail |
| --- | ---: | --- |
| P0 | 0 | — |
| P1 | 0 | — |
| P2 | 1 | Latest local workspace change is lost on immediate refresh/tab close. |
| P3 | 0 | — |

No product source was changed during verification. This report and the handoff
are the only repository changes.
