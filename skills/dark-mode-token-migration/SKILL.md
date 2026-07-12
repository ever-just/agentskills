---
name: dark-mode-token-migration
description: Add dark mode to a light-only app that styles with RAW color utilities (Tailwind `stone-*`/`slate-*`/`gray-*`) via a semantic token layer, migrating utilities onto it so light stays PIXEL-IDENTICAL and dark comes for free. Use when asked to "add dark mode", or to refactor hardcoded color utilities into a themeable token system. Not for apps already on semantic tokens — just add `.dark` values plus a toggle.
---

# Dark-Mode Token Migration

## Overview
The wrong way to add dark mode is per-page `dark:` variants — you double every color class, drift, and never finish. The right way is a **semantic token layer**: define CSS variables (`--background`, `--foreground`, `--card`, …) once, set them to the app's **exact current palette** in `:root`, override them with an inverted palette in `.dark`, and migrate the app's raw color utilities (`bg-stone-50`, `text-stone-500`) onto the tokens (`bg-background`, `text-muted-foreground`). Because each token's **light value equals the raw value it replaces**, a correct migration is **pixel-identical in light mode** and gains dark mode for free.

This produces four deliverables: a token layer, a no-flash toggle, a per-route utility migration (the parallelizable bulk), and a both-themes visual QA. The discipline that makes it safe is one **invariant** plus one **do-not-touch list** — hold both and the diff is boringly mechanical.

## When to use
- "Add dark mode to the app / dashboard / marketing site." (light-only today, no theme system)
- "Refactor our hardcoded colors into a themeable token system."
- "We style everything with raw `stone-*` / `slate-*` / `gray-*` classes and want a theme switch."
- Any migration from direct color utilities to a `bg-background`/`text-foreground` semantic system.

## When NOT to use this skill
- **The app already uses semantic tokens** (`bg-background`, `text-muted-foreground`, shadcn-style vars). There's nothing to migrate — just add the `.dark { … }` values and a toggle. This skill's whole bulk (the utility migration) doesn't apply.
- **A single component** needs a dark variant. Just write the `dark:` classes inline; don't stand up a token system for one card.
- **You want to also redo the visual design.** Keep migration and redesign separate — migrate to identical light first (prove pixel-parity), redesign after. Mixing them makes "is light broken?" unanswerable. Use `frontend-design` for the redesign pass.

## The invariant that makes this safe
**Every token's LIGHT value MUST equal the raw utility value it replaces.** `--background` in `:root` is literally `stone-50`; `--foreground` is literally `stone-900`. So swapping `bg-stone-50 → bg-background` changes **nothing** visually in light mode — it only adds a `.dark` code path. This gives you a cheap, machine-checkable correctness test: **light mode screenshots before and after must be pixel-identical.** Any light-mode difference means you either picked the wrong token or touched something on the do-not-touch list. Never "improve" a color during migration — that breaks the invariant and hides real regressions.

## Step 1 — the semantic token layer (do this FIRST, single-owner)
One person/agent owns the theme file (`globals.css`). Define every token in `:root` at the current palette, then invert in `.dark`. Keep the **one accent hue** (e.g. red `--destructive`) **identical in both themes** — it's a signal color, not chrome. Set `color-scheme` so native controls (scrollbars, form widgets) follow the theme.

```css
/* globals.css — :root light values EQUAL the current stone palette (pixel-identical).
   .dark inverts each one; @theme inline binds them to utilities. Full file below. */
:root {
  color-scheme: light;
  --background: #fafaf9;            /* stone-50  — app canvas            */
  --foreground: #1c1917;            /* stone-900 — primary text          */
  --card: #ffffff;                  /* white     — panels/inputs (NOT bg)*/
  --muted-foreground: #78716c;      /* stone-500 — secondary/label text  */
  --border: #e7e5e4;                /* stone-200 — dividers, card edges   */
  --primary: #1c1917;               /* stone-900 — emphasis fill          */
  --destructive: #dc2626;           /* red-600   — the ONE hue, kept in .dark */
  /* …full token set (popover/accent/secondary/input/ring/foregrounds) in the template */
}
```

**Tailwind v4** binds each token to a utility with `@theme inline` (e.g. `--color-background: var(--background);`) — that's what makes `bg-background`, `text-muted-foreground`, `border-border`, `ring-ring` exist and resolve at the **use site**, so they follow `.dark` automatically. **Tailwind v3** has no `@theme`: define the vars in `@layer base` and map them into `theme.extend.colors` (`background: "var(--background)"`, `card: { DEFAULT: "var(--card)", foreground: "var(--card-foreground)" }`, …) instead.

Full ready-to-paste file (both `:root`/`.dark` sets + `@theme inline`): **`templates/token-layer.css`**. Commit this layer **before** any utility migration — leaf agents that migrate a route need the tokens to already exist, or they'll invent names that don't resolve.

## Step 2 — the no-flash theme toggle
A theme applied in React (`useEffect`) flashes light-then-dark on every load. Apply it **before paint** with an inline script in the document head, then hydrate.

```tsx
// app/layout.tsx (Next.js App Router) — runs before React hydrates
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            // stay LIGHT unless the user EXPLICITLY chose dark
            __html: `try{if(localStorage.getItem('theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

- `suppressHydrationWarning` on `<html>` is required — the pre-paint script mutates the class list, which would otherwise trip a hydration mismatch.
- **CRITICAL DEFAULT: stay LIGHT unless the stored value is exactly `'dark'`.** Do **NOT** fall back to `matchMedia('(prefers-color-scheme: dark)')` until the **entire app is migrated**. Auto-adopting the OS preference while un-migrated surfaces still use raw light-only utilities renders the app **half-dark** — a dark shell around white-on-white pages. Flip to `prefers-color-scheme` only as the final step, once every route is tokenized.

The `useTheme` hook reads what the pre-paint script already applied and lets a visible control flip it:

```tsx
// hooks/useTheme.ts
import { useCallback, useEffect, useState } from "react";

export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);
  const apply = useCallback((next: "light" | "dark") => {
    document.documentElement.classList.toggle("dark", next === "dark");
    try { localStorage.setItem("theme", next); } catch {}
    setTheme(next);
  }, []);
  return { theme, setTheme: apply, toggle: () => apply(theme === "dark" ? "light" : "dark") };
}
```

Ship a **visible toggle** (a sun/moon button in the header or settings). If the app has a **command palette** (⌘K), also register "Toggle theme / Switch to dark mode" there — power users expect it.

## Step 3 — migrate raw utilities to tokens (per route)
This is the bulk, and it's the **parallelizable** part — the work partitions cleanly by file, so fan it out one agent per route behind a build barrier (see `parallel-agent-refactor`). Every migrating agent carries the **same two artifacts**: the mapping table below and the do-not-touch list. The rule for each agent: apply the mapping mechanically, leave anything on the do-not-touch list raw, and leave any shade with no exact token match **raw rather than guessing** (guessing breaks the pixel-identical-light invariant).

## The mapping table
The highest-value rows below (`stone` shown; same shape for `slate`/`gray`/`zinc`/`neutral`). **Full table — every shade row plus the do-not-touch list, formatted as the house-rules artifact to hand each fan-out agent: `templates/mapping-table.md`.**

| Raw utility | Token utility | Why |
|---|---|---|
| `bg-stone-50` | `bg-background` | the app canvas |
| `bg-white` | **`bg-card`** (NOT `bg-background`) | white panels/inputs must stay *lighter than* the canvas — in dark, card is stone-900 on a stone-950 page, preserving the white-on-paper contrast step |
| `text-stone-900/800/700` | `text-foreground` | primary text |
| `text-stone-600/500/400` | `text-muted-foreground` | secondary/label text |
| `border-stone-200/100` | `border-border` | dividers, card edges (form controls → `border-input`) |
| `bg-stone-900` **paired with** `text-stone-50` | `bg-primary` **+** `text-primary-foreground` | a dark emphasis box → tokenize the pair together |

Rule of thumb: **surfaces** map to `background`/`card`/`muted`/`accent`, **text** to `foreground`/`muted-foreground`, **lines** to `border`/`input`, **emphasis** to `primary`(+`-foreground`). `bg-white → bg-card` is the one everyone gets wrong — mapping it to `bg-background` collapses the contrast step and makes cards vanish into the page in dark.

## Do-not-touch list (leave these RAW)
These are intentionally not chrome, or have no exact token. Migrating them breaks the design or the invariant. Leave the raw class exactly as-is:

- **Deliberately-dark blocks** — a one-time-secret reveal, a code/terminal banner, a "copy this token" box built on `bg-stone-950`/`bg-stone-900` that is *meant* to be dark in **both** themes. It's not following the theme; it's a fixed dark surface.
- **Destructive / red** — the one accent hue (`bg-red-*`, `text-red-*`, `border-red-*`). It's already identical in both themes via `--destructive`; raw red usages stay raw.
- **Brand, data-viz, and provider colors** — logo colors, chart series palettes, a "Sign in with Google/GitHub" button's brand color. These are semantic to *their* meaning, not to the theme.
- **Customer-facing embedded previews** — a widget mock / iframe preview that always renders how the customer's end-users will see it (typically always light). It must not follow the operator's theme.
- **Overlay scrims** — `bg-stone-950/40` behind a modal should become **`bg-black/40`** (a fixed dark scrim), NOT a token. A scrim that inverts to light in dark mode stops dimming.
- **Any shade with no exact token** — an off-palette `stone-700` mid-tone, a `bg-stone-200` used somewhere the tokens don't cover. **Leave it raw rather than guessing** a near-match. A wrong guess is a visible light-mode regression; a raw class is at worst a spot that doesn't darken yet (catch it in visual QA).

## The paired-class trap + the cleanup grep
The migration's signature bug: after `bg-stone-900 → bg-primary`, in **dark mode** `--primary` inverts to near-white. A **sibling `text-white` or `text-stone-50`** that was correct on the old dark fill is now **white-on-near-white — invisible**, and **no build or typecheck catches it** (it's valid CSS, valid TSX). The foreground must move with its background: it has to become `text-primary-foreground`.

After **each** migration wave, grep the files that wave touched for the orphaned partners and fix the pairs:

```bash
# run over the files this wave migrated (not the whole repo)
rg -n 'text-white|text-stone-50|bg-stone-900|border-stone-900|bg-stone-700' <changed-files>
```

Fix each hit by pairing it to its tokenized neighbor:

| Orphan found next to a tokenized element | Fix |
|---|---|
| `text-white` / `text-stone-50` on a `bg-primary` | `text-primary-foreground` |
| `border-stone-900` outlining an emphasis element | `border-foreground` (or `border-primary`) |
| a low-contrast dark fill like `bg-stone-700` (e.g. a progress-bar track) | `bg-muted-foreground` |

If the `text-white` is on something on the do-not-touch list (a deliberately-dark block, a brand button), leave it — it's correct there. The grep finds candidates; you decide per hit.

## Execution order
Order matters — foundation before fan-out, verification before the next wave.

1. **Token layer + toggle FIRST**, inline, single-owner (`globals.css` + `@theme inline`, the pre-paint script, `useTheme`, the visible toggle). Commit it. Everything downstream depends on these tokens existing.
2. **Author any NEW components token-based from the start** — never add a raw-color component during the migration; build it on `bg-card`/`text-foreground`/… so it's dark-ready on arrival (see `shadcn-tailwind-v4-primitives`).
3. **Fan out per-route color migration** — one agent per route, each carrying the **mapping table + do-not-touch list**, disjoint file ownership (`parallel-agent-refactor`).
4. **Barrier-verify per wave** — one whole-tree typecheck + build; then run the **cleanup grep** over the wave's files and fix paired-class orphans; commit + push the checkpoint. Only then start the next wave.
5. **Both-themes visual QA at the end** — screenshot key surfaces in **light** (must be pixel-identical to before) **and dark** (must be legible, correct contrast). The build cannot see color regressions; only a render can.
6. **Only after every route is migrated**, optionally switch the pre-paint default to honor `prefers-color-scheme`. Not before — half-migrated + OS-dark = a broken half-dark app.

## Output
A dark-mode migration PR containing:
- **The token layer** — `globals.css` with `:root`/`.dark` at the exact current palette + `@theme inline` (or the v3 config), `color-scheme` set, the accent hue identical in both.
- **The no-flash toggle** — pre-paint inline script, `suppressHydrationWarning`, `useTheme`, a visible control (+ command-palette entry if one exists), defaulting to LIGHT.
- **Per-route utility migrations** — mechanical mapping applied, do-not-touch list respected, no-exact-token shades left raw.
- **Proof** — light-mode before/after screenshots that are **pixel-identical**, plus dark-mode screenshots of the same surfaces. Auth-gated dashboards screenshotted from a **logged-in session** (a logged-out shell is not QA of the app).

Copy this checklist into the PR and tick it:
```
[ ] Token layer committed FIRST; light values EQUAL the old raw values
[ ] Accent/destructive hue identical in light and dark
[ ] Pre-paint script applied before hydration; suppressHydrationWarning on <html>
[ ] Default is LIGHT (no prefers-color-scheme until fully migrated)
[ ] Visible toggle (+ command-palette entry if applicable)
[ ] Every route migrated via the mapping table; do-not-touch list respected
[ ] No-exact-token shades left RAW (not guessed)
[ ] Cleanup grep run per wave; paired text-white/foreground orphans fixed
[ ] Light screenshots PIXEL-IDENTICAL before vs after
[ ] Dark screenshots legible on every key surface (incl. auth-gated, logged in)
```

## Pitfalls
- **`bg-white → bg-background`.** The classic mistake. White panels must map to `bg-card` so they stay a step lighter than the canvas; mapped to `background`, cards dissolve into the page in dark. Inputs too.
- **Improving a color mid-migration.** Any light-mode change breaks the pixel-identical invariant and hides real regressions behind intentional ones. Migrate to *identical* light; redesign separately.
- **The paired-class trap.** `text-white` orphaned next to a now-`bg-primary` element is invisible in dark and the build is green. Grep every migrated wave and pair foregrounds to backgrounds.
- **Guessing a token for an off-palette shade.** A near-match is a visible light regression. Leave unmatched shades raw.
- **Auto-adopting `prefers-color-scheme` before finishing.** Un-migrated routes render half-dark. Default LIGHT until the last route lands.
- **Theme flash (FOUC).** Applying the theme in `useEffect` instead of a pre-paint script flashes light→dark on every load. It must run before hydration, in the head.
- **Trusting the build for QA.** Typecheck/build never sees color. A both-themes render is mandatory — and for auth-gated dashboards it needs a real logged-in session.
- **Fanning out before the token layer is committed.** Leaf agents invent token names that don't resolve and ship dead styles. Foundation first, always.

## Combining with other skills
- `parallel-agent-refactor` — the fan-out engine and barrier discipline for Step 3; hand each per-route agent the mapping table + do-not-touch list as its house-rules spec, verify per wave.
- `shadcn-tailwind-v4-primitives` — author new/replacement primitives directly on this token layer so they're dark-ready from the start (and mind the Tailwind-v4 gotchas).
- `empirical-responsive-audit` — re-run the render probe in **both themes** after migration to catch contrast/overflow regressions dark mode exposes that light mode hid.
- `ux-decision-rubrics` — for the toggle-placement and default-theme (stay-light vs honor `prefers-color-scheme`) UX calls this migration forces, plus keeping the accent hue.
- `ui-ux-audit` — the broader human UX pass over the finished dark theme (hierarchy, states, edge surfaces).
- `frontend-design` — for a *redesign* (do it after migration, not during).
- `production-agent-audit` / `finding-forensic-remediation` — the general evidence-bound-findings → prioritized-fix discipline this migration's QA report follows.
