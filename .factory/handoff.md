# Frame UV Lab review 1 handoff — FAIL

Review 1 audited live implementation
`94130ddb1eeccef8746beb45a4d21d6f30d125dd` from documentation baseline
`adc9e8ee9ff9f7b92efb420f4554ee0b9dab2548` on 2026-09-05 UTC.

**Verdict: FAIL — 9 findings and 18 untested public claims.**

The full evidence and required dispositions are in
`.factory/review-1.md`. No product code was changed.

## Main blockers

- The claims registry is missing, leaving 18 public claims without required
  tagged tests.
- There is no isolated demo. The sample writes the real IndexedDB workspace and
  can replace an existing project without warning.
- An arbitrary unverified token unlocks paid effects indefinitely while
  offline.
- The paid copy promises unspecified future engine export targets that are not
  present or testable.
- The prior immediate-refresh persistence defect still loses the latest
  workspace change.
- First-screen, site-structure, 404/sitemap/metadata, and one touch-target
  requirements remain incomplete.

## Verification summary

`npm ci`, all 13 unit tests, typecheck, lint, build, all 9 Playwright tests,
audit, and `git diff --check` pass. Factory URL verification and Axe pass with
no console errors or accessibility violations. Fresh mobile Lighthouse scores
100 in Performance, Accessibility, Best Practices, and SEO; LCP is 1.1 s and
CLS is 0.

The normal sample workflow, UV values, three free effects, GLSL copy, 16-frame
atlas export, invalid-input recovery, keyboard navigation, completed-save
offline reload, and service-worker update notice pass. Earlier checkout,
outline shader, degenerate-grid, duplicate-name, response-header, and caching
findings remain fixed. The live artifact matches the local implementation build
byte for byte.

## Reproduce the highest-risk defects

1. Save a real imported workspace, select **Use sample**, wait, and reload. The
   sample has replaced the real workspace; there is no demo label or reset.
2. Cache the app, go offline, paste any unverified license string, and select
   **Restore**. Pro remains active after an offline reload.
3. Load the sample, wait for its first save, select frame 06, and reload
   immediately. Frame 01 (`frame_00`) returns.

## Evidence and next steps

The required external evidence files are `/work/.evidence/qa-report.md` and
`/work/.evidence/qa-result.json`. Screenshots, factory URL output, and the
Lighthouse JSON are also under `/work/.evidence/`.

Implement the isolated demo and claim suite first. Then repair license verdict
handling and save flushing, remove or deliver the paid future-target claim,
complete the first screen and site routes/metadata, and fix the remaining touch
target. Repeat every claim command and the full live review before changing the
verdict.
