# Review 1 — Preview sprite-frame effects and export UVs

**Verdict: FAIL**

- Review date: 2026-09-05 UTC
- Live URL: <https://sprite-frame-lab.sociobot.in>
- Implementation reviewed: `94130ddb1eeccef8746beb45a4d21d6f30d125dd`
- Documentation baseline: `adc9e8ee9ff9f7b92efb420f4554ee0b9dab2548`
- Finding count: **9** (`P1: 4`, `P2: 4`, `P3: 1`)
- Untested public claim count: **18**

The product cannot pass while any finding or untested claim remains.

## Job, audience, and first action before scrolling

- Job: preview an effect on one sprite-sheet frame, inspect its normalized UV
  bounds, and export sample GLSL and generic atlas JSON.
- Audience: 2D game artists and shader developers. The live first screen does
  not state this audience.
- Desktop first action: **Import sprite sheet** is primary. **Load 16-frame
  sample** is visible beside it.
- Phone first action: **Import sprite sheet** is visible at the bottom of the
  390 × 844 viewport. **Load 16-frame sample** starts at y=844 and requires a
  scroll.

The visible `h1` is “Frame UV Lab,” not the job. The task heading is the `h2`
“Stop guessing where the frame begins.” It does not meet the attached job-title
or plain-words contract.

## Findings

### F-01 — P1 — All 18 public product claims lack the required claim tests

`.factory/claims.json` does not exist, and no test contains an
`@claim:<id>` tag. There are therefore no declared claim commands to run.
The live page and README still make 18 distinct product claims listed below.
Several happen to have independent review evidence, but none meets the
required claim-registry and one-test-per-claim contract.

This is a release-blocking claims failure. Add the registry and one observable
demo-sandbox test for each retained claim, or remove the claim.

### F-02 — P1 — The sample is not an isolated demo and overwrites real workspace state

Neither `/demo` nor `/?demo=1` loads sample data. Both return the normal empty
workspace with the root title. There is no persistent “Demo — sample data,
nothing is saved” label, **Reset demo**, or **Start for real** action.
`.factory/demo.md` is also missing.

The sample uses the production IndexedDB database `frame-uv-lab`. In a fresh
context, I imported `real-project.png`, waited for its save, selected **Use
sample**, waited, and reloaded. The restored workspace was
`frame-uv-sample.png`; no warning or confirmation appeared. This directly
contradicts the required promise that a demo never reads or writes real data.

### F-03 — P1 — An arbitrary unverified license unlocks paid effects offline

After the service worker had cached the app, I went offline, pasted an invalid
string into **Have a license?**, and selected **Restore**. Damage flash and CRT
scanline became enabled before verification. The request failed offline, but
the UI kept “Pro unlocked · ACTIVE.” After an offline reload, the invalid
license still unlocked Pro and preserved the scanline selection.

`storeLicense()` clears the verdict, while `licenseState()` treats a token with
no verdict as unlocked. Optimistic access is therefore based on an unverified
token instead of a cached valid verdict. This bypasses the paid license check.

### F-04 — P1 — The paid offer promises undefined export targets that are not present

The paid panel sells “future engine export targets.” The terms say future
targets are “included with this version,” but the product only exports generic
atlas JSON and GLSL. No engine target, delivery list, or test exists. A buyer
cannot know what the $12 purchase includes, and the promise cannot be verified
as written.

Remove the promise or name and ship the exact targets with claim tests. The
price, one-time basis, hosted checkout, merchant-of-record statement, and two
current effect templates can remain as separately tested claims.

### F-05 — P2 — The latest workspace change is lost on immediate reload or tab close

The prior verification-2 defect still reproduces on the current live build:

1. Load the sample and wait for the initial save.
2. Select frame 06.
3. Reload immediately.
4. The restored frame is `frame_00`, not `frame_05`.

`scheduleSave()` waits 350 ms and has no `pagehide` or `visibilitychange`
flush. Frame selection, effect settings, imported maps, and replacement images
can all lose the latest change. A completed save and subsequent offline reload
does restore `frame_05`, so this is specifically a write-boundary defect.

### F-06 — P2 — The first screen fails the job, audience, facts, and phone-action contract

The `h1` is the product name. The large `h2` uses “Stop guessing,” rather than
naming the job. The following copy explains operations but does not name 2D
artists or shader developers. The required three privacy/offline/price facts
are not grouped with the first action. `.factory/copy-audit.md` is missing.

On a fresh 390 × 844 phone, the sample action begins at y=844 and is not usable
before scrolling. The first screen must state the job and audience and expose
the one-click sample without a scroll.

### F-07 — P2 — Required landing and route structure is absent

The root has no header navigation, no **How it works** section, no plain
limitations/privacy section, and no paid section until after a sheet is
loaded. The footer omits the required “Built by Param Factory” and build/version
identifier. Privacy and terms use different headers and footers from the app.
The `/demo` route has neither demo content nor its own “Demo — Frame UV Lab”
title.

These gaps make the required site skeleton and consistent route structure
incomplete even though the editor itself is usable.

### F-08 — P2 — 404 handling, sitemap, and required metadata are incomplete

A fresh navigation to `/not-a-real-route-qa` returns HTTP 200 and renders the
normal app. There is no designed 404 page. `/sitemap.xml` returns the expected
HTTP 404 for a missing file, but the sitemap is required and does not exist.

The root also lacks a canonical URL, Open Graph title/image, Twitter card, and
Apple touch icon link. The root title, description, language, theme color,
favicon, manifest, robots file, privacy title, and terms title are present.

The defect is not that a missing resource can return 404. It is that the
required sitemap and designed not-found route are absent, while an unknown page
incorrectly returns the product as HTTP 200.

### F-09 — P3 — One purchase-disclosure link is smaller than 44 × 44 CSS pixels

At 390 px, the inline **terms** link below the license controls measures about
38 × 44 CSS pixels. Visible file labels and other controls meet the size
baseline; the hidden file input itself is not counted separately from its
label. The existing browser test checks height only, so it misses narrow touch
targets.

## Public claim inventory

Every row is **UNTESTED** under the attached claims contract because there is
no registry entry or matching tagged test. “Observed” records this review's
extra evidence; it does not replace the required claim test.

| # | Public claim | Where | Observed |
| ---: | --- | --- | --- |
| 1 | A selected frame produces visible bounds, UV constants, an effect preview, GLSL, and atlas JSON | README/root | Pass for the sample |
| 2 | PNG, JPEG, and WebP sheets open | README/root | PNG and rejection paths checked; full format set lacks a claim test |
| 3 | Files up to 20 MB are accepted | Root | Over-limit rejection passes; exact supported-format boundary lacks a claim test |
| 4 | Art is processed locally and never uploaded | Root/README | Free flow requested only same-origin assets and a local `blob:` URL |
| 5 | Even sprite grids are built | README/editor | Pass for 4 × 4 and 1 × 1 boundaries |
| 6 | TexturePacker and generic frame JSON import | README/editor | Generic valid/invalid/recovery passes; TexturePacker only has a unit test |
| 7 | Frames can be selected with the keyboard | README | Arrow and End selection pass |
| 8 | Outline, tint, and dissolve previews work in the free tier | README/editor | All three change the populated preview description |
| 9 | Annotated GLSL exports | README/editor | Clipboard matches displayed GLSL; outline compiles in WebGL2 |
| 10 | Generic atlas JSON exports | README/editor | Download contains 16 frames and correct 256 × 256 metadata |
| 11 | The current sheet and settings survive refresh in IndexedDB | README/privacy | **Fail** on immediate reload; pass after “Saved” appears |
| 12 | Editing and exports work offline after the first visit | README/offline banner | Pass after a completed save; no required isolated claim test |
| 13 | There are no analytics or trackers | README/footer/privacy | Pass for the reviewed free flow |
| 14 | There are no CDN fonts or third-party runtime scripts | README | Source and requests pass |
| 15 | Pro is a one-time $12 purchase | README/editor/terms | Checkout starts with HTTP 303; no purchase was made |
| 16 | Pro provides damage flash and CRT scanline templates | Editor | Not tested with a valid entitlement |
| 17 | Checkout is hosted by Sociobot without an embedded payment provider | README/editor | Endpoint returns HTTP 303 to hosted checkout |
| 18 | Pro includes future engine export targets | Editor/terms | **Incomplete and unverifiable; no targets are present** |

## Earlier finding disposition

| Earlier finding | Current disposition | Evidence |
| --- | --- | --- |
| Production checkout returned 404 | Fixed | Checkout now returns HTTP 303 to the hosted checkout |
| Outline GLSL returned the input unchanged | Fixed | Eight frame-clipped neighbor samples are present; exact displayed shader compiles in WebGL2 |
| Grid dimensions created zero-area frames | Fixed | A 1 × 1 image clamps attempted 0 and 64 columns to 1 and keeps one 1 × 1 frame |
| Duplicate names were silently overwritten | Fixed | Import rejects duplicate `idle` and retains all 16 existing frames |
| File focus and undersized targets | Partly fixed | Import focus is visible and most controls meet 44 px; F-09 remains |
| Security headers and immutable asset caching were missing | Fixed | CSP, Permissions-Policy, anti-framing, HSTS, nosniff, immutable hashed assets, and no-cache worker are live |
| Latest state was lost on immediate reload | Open | F-05 reproduces unchanged |

## Clean-checkout command results

Node was `v22.23.2`; npm was `10.9.8`. The tree was clean before commands.

| Command | Result |
| --- | --- |
| `npm ci` | PASS — 51 packages installed, 0 vulnerabilities |
| `npm test` | PASS — 13/13 tests |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run build` | PASS — `dist/index.html` produced |
| `npm run test:e2e` | PASS — 9/9 Chromium tests |
| `npm audit --audit-level=low` | PASS — 0 vulnerabilities |
| `git diff --check` | PASS |
| Claim commands | **None declared; `.factory/claims.json` is missing** |

The passing generic suite does not clear F-01, F-02, F-03, F-04, F-05,
F-06, F-07, F-08, or F-09.

## Workflow, invalid input, boundaries, and recovery

- The one-click sample loads a realistic 256 × 256, 4 × 4 sheet with 16
  animated robot frames.
- Frame 06 reports pixel origin `64, 64`, size `64 × 64`, UV min
  `0.250000, 0.250000`, and UV max `0.500000, 0.500000`.
- Outline, tint, and dissolve update the preview. Amount 0% and 100% update the
  output. Clipboard content exactly matches the displayed GLSL.
- Atlas export downloads `frame-uv-sample.atlas.json` with 16 frames and the
  correct 256 × 256 source metadata.
- Wrong file type, over-20-MB input, corrupt image, malformed JSON,
  out-of-bounds frame, duplicate frame name, zero grid value, and grid values
  larger than a one-pixel sheet all produce safe outcomes. A valid image or map
  succeeds after each error.
- Online invalid-license verification locks Pro again and leaves free tools
  usable. The offline bypass is F-03.

## Accessibility, phone, keyboard, and motion

- Factory `verify-url.sh`: PASS, HTTPS 200, no console errors, title and
  language present, one `h1`, one `main`, no missing image alt, no unlabeled
  buttons.
- Axe 4.13.0 through Playwright: zero violations of any impact on the empty
  root, populated editor, privacy, and terms pages.
- Keyboard order starts with the skip link, then sprite import, sample,
  privacy, and terms. Focus rings are visible. Frame Arrow/End navigation works
  and no trap was observed.
- Reduced motion matches and cuts transition/animation duration to `0.01ms`.
- At 200% root text size and 390 px width, empty and populated states have no
  horizontal overflow.
- The layout has no horizontal overflow at desktop or 390 px. F-06 and F-09
  remain despite those passes.

## Privacy, offline, updates, legal pages, and links

- The free sample/edit/export flow made only same-origin requests plus a local
  `blob:` image request. No analytics, tracker, font CDN, upload, or third-party
  runtime script appeared.
- Privacy and terms return HTTP 200 with route-specific titles, one `h1`, one
  `main`, and links back to the product. Privacy explains browser-site-data
  removal and supplies an operator contact route.
- A completed workspace save survives an offline reload, shows the offline
  banner, and preserves frame 06.
- An isolated byte-changed service-worker probe against the exact built
  artifact displays “A new lab build is ready” and a **Reload** button.
- The invalid-license verification endpoint returns HTTP 200, `no-store`, and
  an invalid verdict. Checkout returns HTTP 303. No payment was completed.
- Internal product links to `/`, `/privacy/`, and `/terms/` return 200. The
  missing/incorrect routes are recorded in F-02, F-07, and F-08.
- This is a static PWA. Backend tenant isolation, restart persistence,
  health/rate limits, and CLI/desktop consumer installation do not apply.

## Performance and deployment identity

Fresh live Lighthouse 13.0.1 mobile results:

| Category/metric | Result |
| --- | ---: |
| Performance | 100 |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 100 |
| FCP | 0.8 s |
| LCP | 1.1 s |
| TBT | 0 ms |
| CLS | 0 |
| Speed Index | 0.8 s |

The build emits 26,549 bytes raw / 9.43 KB gzip initial JavaScript and 10,973
bytes raw / 3.20 KB gzip CSS. The hero WebP is 40,218 bytes and no fonts ship.
These pass the budgets.

Live and local SHA-256 values match:

| Asset | SHA-256 |
| --- | --- |
| `/index.html` | `18860d0b04352c55b5c2bff11a923b0226f1540d7d65fd0b5abecae32bf4ec02` |
| `/sw.js` | `713c4d26fe6b79148889d0ca162a47f38cdef3efaa4bb1234aaa6d65035b38f9` |
| `/manifest.webmanifest` | `a5a34aded77ed68434864d60550672b7a581053e386a2c193d6b657a7648597a` |
| `/assets/index-ZqGKQHu6.js` | `043afea5c117717f2ecb5fcbb9ede5dc871b141b16d3288b36e63c4411380560` |
| `/assets/index-DTxba-7K.css` | `d7a16ee57c114f0d4640ed222ef81e1f7cce455d49e40106cb88042d46957ea3` |

Only `.factory/handoff.md` and `.factory/verification-2.md` changed after
implementation commit `94130dd`; both later commits were report-only. The live
runtime therefore correctly matches the implementation candidate, not the
documentation baseline.

## Evidence files

- `/work/.evidence/desktop-first.png`
- `/work/.evidence/desktop-populated.png`
- `/work/.evidence/phone-first.png`
- `/work/.evidence/phone-populated.png`
- `/work/.evidence/not-found.png`
- `/work/.evidence/verify-url/verify.json`
- `/work/.evidence/lighthouse.json`

## Required disposition

Do not declare or promote this candidate as complete. Resolve all nine
findings, create and pass all 18 claim tests from the isolated demo, then repeat
the clean-checkout and live review.
