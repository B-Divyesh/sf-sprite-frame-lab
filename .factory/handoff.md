# Frame UV Lab — verification handoff: FAIL

Work order `sprite-frame-lab-verify-1` independently tested candidate `ff128e60a55d8efcb76e5088622678ab06ecab8c` at `https://sprite-frame-lab.sociobot.in` on 2026-08-28 UTC.

## Verdict

**FAIL. Do not promote this candidate.** The deployed root, worker, and manifest are byte-for-byte identical to the candidate build, so this is not a stale-deployment result.

Release blockers:

1. **HIGH:** The advertised production checkout returns HTTP 404 with `{"error":"enabled factory product","status":404}`.
2. **HIGH:** The default Pixel outline export does not implement an outline; it comments that neighboring samples are needed and returns the unmodified color.
3. **MEDIUM:** A small valid image plus accepted 64-column/row settings creates zero-area frames and invalid atlas output.
4. **MEDIUM:** Duplicate imported frame names are displayed separately but silently collapse to one object entry on export.
5. **MEDIUM:** The hidden file input has no visible keyboard focus on its label, and several 390 px controls are only 36 px high; legal links are 15–19 px high.
6. **LOW:** Production lacks CSP, Permissions-Policy, and explicit anti-framing headers, and static assets use a 30-second revalidation policy rather than immutable caching.

Full evidence and reproductions are in [verification-1.md](verification-1.md).

## Passing evidence

- Clean candidate: local HEAD and `origin/main` both `ff128e60a55d8efcb76e5088622678ab06ecab8c`.
- `npm ci`, `npm audit`, `npm test` (7/7), `npx tsc --noEmit`, `npm run build`, and `npm run test:e2e` (4/4) passed. No lint command exists.
- Free sample/image, grid, valid/invalid JSON, frame selection, three free previews, clipboard, atlas download, persistence, keyboard core flow, and error recovery were exercised locally and live.
- Free workflow emitted only same-origin and local `blob:` requests; no art upload, analytics, tracker, CDN font, or third-party script was observed.
- Axe reported zero violations (including zero serious/critical) in empty/editor/legal states. No console or page errors occurred.
- Desktop 1440×1000, mobile 390×844, 200% text, and reduced motion were checked. Layouts did not overflow horizontally.
- PWA installability had zero Chromium errors. Service-worker control, update notification, offline editor reload, IndexedDB restoration, and offline cold start at `/?v=1` worked.
- Live Lighthouse: Performance 99, Accessibility 100, Best Practices 100, SEO 100; LCP 1.1 s, TBT 110 ms, CLS 0.
- Bundle budgets pass: 24,539 B inline JS, 10,616 B inline CSS, 40,218 B hero WebP; 101,202 B complete `dist/`.

## Reverify after fixes

Run:

```sh
npm ci
npm audit --audit-level=low
npm test
npx tsc --noEmit
npm run build
npm run test:e2e
```

Then retest the live checkout, compare deployed artifact hashes with `dist/`, exercise outline GLSL behavior, 1×1 and other narrow-sheet grid limits, duplicate-name import/export, visible keyboard focus, 44 px mobile targets, service-worker update/offline reload, request privacy, response headers, axe, and Lighthouse.
