---
name: empirical-responsive-audit
description: Audit a web UI for mobile/layout defects EMPIRICALLY by rendering every servable surface across a phone/tablet/desktop viewport matrix (both orientations, light + dark) with a Playwright DOM probe that MECHANICALLY flags horizontal overflow, sub-44px tap targets and sub-16px inputs, then ships the probe as a non-zero-exit pre-merge gate. Use when the frontend "isn't optimized for mobile", text "spills outside its container", small-screen stacking is "awkward", or for any responsive / tap-target / layout audit or checked-in gate. Not for pure visual-taste questions — use `ui-ux-audit` / `frontend-design`.
---

# Empirical Responsive Audit

## Overview
Auditing responsiveness by *reading the code* misses real defects and invents fake ones. This skill audits **empirically — by rendering the UI** across a device viewport matrix and letting the browser tell you the truth: does the page scroll sideways, are tap targets reachable, will an input trigger iOS zoom. It combines three lenses (render → grep → rubric), **weights the render highest**, and ships a re-runnable probe so the audit becomes a permanent regression gate, not a one-off report.

**The cardinal rule: the render corrects the grep.** A static scan will produce false positives ("no viewport meta export → desktop-width layout!"); rendering reveals the framework injected a sane default and there is zero overflow. When Lens A and Lens B disagree, **Lens A wins** — trust what the browser actually painted over what the source seemed to imply.

## When to use
- "The frontend isn't optimized for mobile." / "It looks broken on my phone."
- "Text spills outside its container / overflows the card / gets cut off."
- "The stacking / spacing is awkward on small screens."
- Any responsive-layout, tap-target, or mobile-accessibility audit.
- As a **checked-in pre-merge gate**: after layout fixes, wire the probe into CI so horizontal overflow can never regress silently.

## When NOT to use this skill
- Pure visual-design taste ("does this look premium / on-brand / beautiful?") → use `frontend-design` or `ui-ux-audit`.
- A broad UX/IA/accessibility-content review (copy, empty states, flows) → `ui-ux-audit` is the human checklist; this skill is the mechanical layout gate.
- Backend/data correctness. This skill only asserts things a rendered DOM can prove.

## The three lenses (empirical-first)
Run all three, but resolve conflicts in favor of the render.

| Lens | What it does | Trust | Tool |
|---|---|---|---|
| **A — Empirical rendering** (primary) | Actually renders each surface across the viewport matrix and mechanically flags overflow / small targets / small inputs / viewport-meta | **Highest** — it's ground truth | `templates/responsive-probe.mjs` |
| **B — Static anti-patterns** | Greps the source for the *causes* of layout defects, to locate the `file:line` root cause of what Lens A saw | Medium — confirms/root-causes, never overrides | `rg` |
| **C — Brand / rubric** | Scores palette, type scale, spacing, hierarchy against the design kit | Judgment | design kit + `ux-decision-rubrics` |

## Lens A — empirical rendering (the probe)
Prereq: `npm i -D playwright-core` plus a preinstalled Chromium — the probe resolves the browser via `executablePath` and never runs `playwright install`.

Ship and run `templates/responsive-probe.mjs`. It resolves the **preinstalled** Chromium (never `playwright install`), loops the viewport matrix with `deviceScaleFactor: 2` + `isMobile`, loads each surface (`networkidle`, falling back to `domcontentloaded` on timeout), injects a DOM probe, screenshots full-page, prints a JSON defect log, and **exits non-zero if any viewport overflows**.

```bash
# one surface, default full matrix (phones both orientations + tablets + desktop, light + dark)
node templates/responsive-probe.mjs https://app.example.com/dashboard dashboard ./probe-out

# fast inner-loop: phones only
PROBE_MATRIX=phones node templates/responsive-probe.mjs http://localhost:3000/ home

# CI gate — the exit code IS the gate
node templates/responsive-probe.mjs "$URL" pr-check || { echo "layout regressed"; exit 1; }
```

The injected probe mechanically flags, per viewport:
- **Horizontal overflow** — `document.documentElement.scrollWidth > innerWidth` (1px slack for sub-pixel rounding), plus **every element whose right edge exceeds the viewport**, sorted worst-first with tag/class/id/text so you can find the offender instantly.
- **Sub-44px tap targets** — every `a/button/input/select/textarea/[role=button]/[onclick]` smaller than 44×44 CSS px (WCAG 2.5.5).
- **Sub-16px inputs** — every text input whose computed `font-size < 16px` (the iOS focus-zoom trap).
- **Viewport meta** — presence, exact `content`, and a `zoomDisabled` flag if it contains `user-scalable=no` / `maximum-scale=1` (WCAG 1.4.4 violation).

Viewport matrix (the default `full` set): phones **320 / 360 / 375 / 390 / 414** in **both orientations**, tablets **768 / 834**, desktop **1024 / 1280 / 1440**, each rendered in **light and dark**. Read the JSON per-viewport, and eyeball the screenshots for defects the DOM can't quantify (broken stacking, clipped art, contrast).

## Lens B — static anti-pattern grep
Once the render shows *where* it breaks, grep for *why*. These are the patterns that cause the Lens-A defects — use them to pin the root-cause `file:line`, not to raise findings on their own:

```bash
rg -n 'w-\[[0-9]+px\]|width:\s*[0-9]+px'        # fixed px widths — need max-w-full / min-w-0
rg -n 'grid-cols-[2-9]|flex-row' -g '*.tsx' | rg -v 'sm:|md:|lg:'   # no responsive prefix
rg -n '100vw|w-screen'                           # 100vw ignores the scrollbar → overflow
rg -n 'h-screen|min-h-screen'                    # should be dvh on mobile (URL bar)
rg -n '<table'                                   # each must sit in an overflow-x-auto wrapper
rg -n 'user-scalable|maximum-scale'              # must NOT disable pinch-zoom
rg -n 'overflow-x-hidden|overflow-hidden'        # root clipping: prefer clip so sticky survives
```
Also hunt **unbreakable strings** — long domains, URLs, wallet addresses, API tokens rendered inline without `min-w-0` / `truncate` / `break-all` / `break-words`. A single 60-char token is a classic mobile overflow the grep for `w-[...]` won't catch — the render will.

## Lens C — brand / rubric
Score palette, type scale, spacing rhythm, and hierarchy against the project's design kit. The mobile *acceptance criteria* (what counts as pass/fail) live in `ux-decision-rubrics` — defer to it rather than re-deriving thresholds here.

## Mobile-correctness rules to assert
Assert these on every audited surface. Each has a *why* so you can generalize to cases not listed.

| Rule | Assert | Why |
|---|---|---|
| **Viewport height** | `min-h-dvh`, not `min-h-screen` | `100vh`/`h-screen` includes the mobile URL bar → content jumps / clips as it hides. `dvh` tracks the real viewport. |
| **Input font-size** | inputs ≥ **16px** (or `pointer-coarse:text-base`) | iOS auto-zooms any focused input under 16px — the page then can't scroll back. Fix the size; do NOT disable zoom. |
| **Tap targets** | ≥ **44×44px** (e.g. `pointer-coarse:min-h-11 min-w-11`) | WCAG 2.5.5. Sub-44px controls are mis-tapped on touch. |
| **Safe areas** | `viewport-fit=cover` + `env(safe-area-inset-*)` on sticky/fixed/sheet/bottom bars | Otherwise notch/home-indicator overlaps controls on modern phones. |
| **Overlay scroll** | `overscroll-behavior: contain` on modals/sheets/drawers | Stops scroll-chaining that scrolls the page *behind* the overlay. |
| **Vertical-only page scroll** | `overflow-x: clip` on the root (**clip, not hidden** — hidden breaks `position: sticky`); wrap genuinely-wide content in its **own** `overflow-x: auto` | The *page* must never scroll sideways; wide tables/code may scroll inside their own container. |
| **Never suppress zoom** | NO `user-scalable=no`, NO `maximum-scale=1` | WCAG 1.4.4. Pinch-zoom must stay. The correct fix for iOS focus-zoom is the 16px input rule above, not killing zoom. |

## Defect taxonomy (severity)
Tag every finding S1/S2/S3 so the fix backlog is prioritized.

| Sev | Class | Examples |
|---|---|---|
| **S1 — Blocking** | The page is broken or unusable on the device | Horizontal page scroll; content clipped/unreachable off-screen; tap targets too small to hit; input-zoom trap you can't recover from |
| **S2 — Major** | Looks broken or violates the kit, still usable | Awkward stacking/spacing; card/table content overflowing its container; palette/type-scale violations; missing safe-area padding under the notch |
| **S3 — Minor** | Polish | Inconsistent spacing scale; sub-optimal breakpoint choice; missing `prefers-reduced-motion`; dark-mode contrast nits |

## Serving strategy
You can only audit what you can render. Get as many surfaces served as possible before falling back to component-level static review.

- **Public routes** — render directly with the probe.
- **Auth-gated routes** — render via a **seeded / mocked session** (test user, injected cookie, storage state) where the app allows it. If you truly can't get in, audit those screens at the **component level (Lens B)** and screenshot every shell/skeleton that *does* render (login, loading, error, empty states).
- **Widgets / embeds** — open them in a **narrow iframe on a stub host page** so the probe measures them at real embed widths.

## Output
Two deliverables:

**1) Findings report** — one row per defect, most-severe first:

| Sev | Defect | Viewport(s) | Root cause (`file:line`) | Fix |
|---|---|---|---|---|
| S1 | Page scrolls sideways +37px | phone-360, phone-375 (both) | `Header.tsx:42` — `w-[420px]` logo row | `w-full max-w-[420px]` + `min-w-0` on the flex child |
| S1 | Email input zooms on focus (iOS) | all phones | `SignIn.tsx:18` — `text-sm` input | `text-base` (or `pointer-coarse:text-base`) |
| S2 | Token string overflows card | phone-320 | `ApiKey.tsx:27` — inline `<code>` no wrap | `break-all min-w-0` |

Each finding = **severity × viewport(s) × root-cause `file:line` × exact fix**. Attach the offending screenshot. Lead with the empirical evidence (`overflowPx`, offender tag/class) — that's what makes a finding undeniable.

**2) The checked-in probe** — commit `responsive-probe.mjs` (and an npm script / CI step invoking it on the key surfaces). Its non-zero exit on overflow is the regression gate. Copy this acceptance checklist into your report and tick it:

```
[ ] Probe run across the FULL matrix (phones both orientations + tablets + desktop, light+dark)
[ ] Zero horizontal overflow in every viewport (probe exit 0)
[ ] No sub-16px inputs; no sub-44px tap targets on touch surfaces
[ ] Viewport meta present; pinch-zoom NOT disabled
[ ] Auth-gated + widget surfaces served (or component-audited with a stated reason)
[ ] Probe committed + wired into CI as a pre-merge gate
```

## Pitfalls
- **Auditing the code instead of the render.** The grep says "broken," the browser says "fine" (framework injected a default viewport/width). **Trust the render.** Static findings are leads to confirm, not verdicts.
- **Running `playwright install`.** Don't — it re-downloads a browser (slow, often blocked). Use the **preinstalled** Chromium via `executablePath`, with the `headless_shell` fallback path the probe already discovers.
- **`networkidle` hangs** on pages with long-poll/websocket/analytics. The probe already falls back to `domcontentloaded` on timeout — keep that fallback; don't wait forever.
- **Forgetting mobile emulation.** Set `deviceScaleFactor` + `isMobile` (+ `hasTouch`) on the context, or touch media queries and DPR-dependent layout never fire and you audit a lie.
- **Flagging a self-contained scroller as page overflow.** A wide table/code block that scrolls inside **its own** `overflow-x: auto` wrapper satisfies vertical-only *page* scroll — that's **acceptable, not a defect**. Only `documentElement.scrollWidth > innerWidth` is the failure.
- **"Fixing" iOS input-zoom by disabling zoom.** `user-scalable=no` is a WCAG 1.4.4 violation and treats the symptom. The fix is 16px inputs.
- **One viewport ≠ audited.** Overflow that hides at 390px screams at 320px, and dark mode surfaces contrast/overflow bugs light mode hides. Run the whole matrix, both themes.

## Combining with other skills
- `parallel-agent-refactor` — fan out the S1/S2 fixes in parallel, then **re-run the probe as the gate** to prove every fix landed and nothing regressed.
- `dark-mode-token-migration` — re-run the probe in **both themes** after a token migration to catch contrast/overflow regressions the build can't see.
- `shadcn-tailwind-v4-primitives` — the primitive layer where the mobile-correctness rules (dvh, 44px targets, safe-area, 16px inputs) should be baked in once, so the audit stops finding them.
- `ux-decision-rubrics` — the acceptance criteria / thresholds this audit scores against.
- `ui-ux-audit` — the broader human UX checklist; this skill is its mechanical, empirical layout half.
- `frontend-design` — for the visual-taste redesign once the layout defects are fixed.
- `production-agent-audit` / `finding-forensic-remediation` — the general "evidence-bound findings → prioritized backlog" discipline this report follows.
