---
name: shadcn-tailwind-v4-primitives
description: Scaffold a token-based shadcn/ui + Radix primitive set (select/combobox/command/switch/tooltip/form/drawer/…) matching a codebase's house conventions on Tailwind v4 — semantic-token colors, a global focus ring, no tailwindcss-animate, 44px touch targets, forwardRef like the existing button. Use when an app hand-rolls or fakes controls (native `<select>`s, `title=` tooltips, custom dropdowns, DIY meters), or when standing up shadcn/ui on Tailwind v4.
---

# shadcn/ui + Radix Primitives on Tailwind v4

## Overview
This skill scaffolds a **real, accessible component layer** — shadcn/ui-style wrappers over Radix primitives — that looks like it was written by the team, not pasted from the docs. The output is a set of **new files** under `components/ui/` (select, combobox, switch, tooltip, drawer, form, …) that every route can adopt in place of native `<select>`s, `title=` tooltips, hand-rolled dropdowns, and DIY meters.

Two disciplines make it work and both are non-optional. **First: a semantic-token layer must already exist** — stock shadcn code references CSS variables like `bg-background`, `border-input`, `bg-popover`; without them every primitive renders unstyled (see `dark-mode-token-migration`). **Second: one shared house-rules contract** (`templates/house-rules.md`) governs color, focus, animation, touch-targets, radius, and types, so a fleet of authoring agents produces one coherent style instead of twenty. Primitives authored this way are **dark-ready from birth** (tokens), **keyboard/AT-accessible** (Radix), and **touch-correct** (44px targets, 16px inputs). This method comes from a real shipped Next.js / Tailwind v4 redesign — every rule below earned its place fixing something that silently broke.

## When to use
- "The app is full of native `<select>`s / `title=` tooltips / custom dropdowns — give it a real component library."
- "Stand up shadcn/ui on this Tailwind v4 project."
- "We're faking a progress bar / toggle / combobox by hand — replace it with an accessible primitive."
- Before a per-route migration: build the primitive layer once, then swap call-sites onto it (with `parallel-agent-refactor`).

## When NOT to use this skill
- **The app already has a mature component system** (Radix already wrapped, MUI, Chakra, Mantine, an in-house kit). Don't fork a second one — extend what's there.
- **No semantic-token layer and you're not willing to build one first.** Every primitive here assumes tokens. Do `dark-mode-token-migration` first, or the whole set ships dead styles.
- **You need one control, once.** Adding `cmdk` + `vaul` + `react-hook-form` for a single dropdown is overkill — style one Radix component inline.
- **Pure visual redesign / taste work** → `frontend-design`. This skill builds the plumbing; it doesn't pick the aesthetic.

## What to build (the faked-control census)
Grep the app for the anti-patterns in the right column, then author the matching primitive as a **new file**. Authoring new files means a parallel fan-out has **zero write conflicts** (nobody edits the same file).

| Primitive (`components/ui/…`) | Package | Replaces (the faked control) |
|---|---|---|
| `select` | `@radix-ui/react-select` | native `<select>` |
| `combobox` | popover + command (`cmdk`) | custom searchable dropdown |
| `command` | `cmdk` | hand-built filter list; `CommandDialog` reuses the base `Dialog` |
| `switch` | `@radix-ui/react-switch` | a styled checkbox / toggle `<div>` |
| `checkbox` | `@radix-ui/react-checkbox` | native `<input type="checkbox">` |
| `radio-group` | `@radix-ui/react-radio-group` | loose native radios |
| `tooltip` | `@radix-ui/react-tooltip` | the `title=` attribute |
| `dropdown-menu` | `@radix-ui/react-dropdown-menu` | a custom absolutely-positioned menu |
| `popover` | `@radix-ui/react-popover` | a hand-floated panel |
| `tabs` | `@radix-ui/react-tabs` | hand-rolled tab state |
| `toggle` + `toggle-group` | `@radix-ui/react-toggle` + `@radix-ui/react-toggle-group` | active/inactive button pairs |
| `progress` | `@radix-ui/react-progress` | a hand-built meter `<div>` |
| `slider` | `@radix-ui/react-slider` | `<input type="range">` |
| `separator` | `@radix-ui/react-separator` | `<hr>` / a bordered div |
| `label` | `@radix-ui/react-label` | a bare `<label>` (consumed by `form`) |
| `textarea` | native, styled | an unstyled `<textarea>` |
| `form` | `react-hook-form` + `zod` + `@hookform/resolvers` | manual field state + ad-hoc validation |
| `drawer` | `vaul` | a custom bottom-sheet |
| `CopyButton` | house-original (no Radix) | a copy icon with `title=` |

## Dependencies
State these explicitly — never assume they're installed. Install only the packages for the primitives you're actually building.

```bash
npm i @radix-ui/react-select @radix-ui/react-switch @radix-ui/react-checkbox \
  @radix-ui/react-radio-group @radix-ui/react-tooltip @radix-ui/react-dropdown-menu \
  @radix-ui/react-popover @radix-ui/react-tabs @radix-ui/react-toggle \
  @radix-ui/react-toggle-group @radix-ui/react-progress @radix-ui/react-slider \
  @radix-ui/react-separator @radix-ui/react-label \
  cmdk vaul react-hook-form @hookform/resolvers zod

# optional
npm i lucide-react   # icons — OR keep inline SVG if that's the house style; don't mix
npm i tldts          # ONLY if you build smart domain inputs (public-suffix parsing)
```

Prereq that is not an npm package: **the semantic-token layer** (the CSS-var definitions for `--background`, `--popover`, `--primary`, `--border`, `--input`, `--accent`, `--muted`, `--destructive`, … and their `-foreground` pairs). If `bg-popover` and `border-input` don't resolve, stop and build the token layer first — see `dark-mode-token-migration`.

## Authoring discipline (the six house rules)
These are the whole point — hand the full contract in `templates/house-rules.md` to every authoring agent. The rules, and the *why* so you generalize past the listed cases:

1. **Read the existing `button` (and `input`) FIRST.** They are the style reference — copy their `"use client"` placement, their `cn` import path, their `React.forwardRef` + `displayName` shape, and their formatting. Every new primitive mirrors them exactly.
2. **Color = semantic tokens ONLY.** Use `bg-popover`/`text-popover-foreground`, `border-border`, `border-input`, `bg-primary`/`text-primary-foreground`, `bg-accent`/`text-accent-foreground`, `text-muted-foreground`, `bg-muted`, `bg-destructive`. **Never** a raw palette shade (`bg-gray-100`, `#1e293b`, `text-white`) for chrome. Tokens are why the set is dark-ready with zero extra work — a raw shade breaks in the other theme.
3. **Focus = rely on the global ring.** If the app has a global `:focus-visible` ring, do **not** add per-component `focus-visible:ring-*` / `outline-*`. Per-component rings drift and fight the global one; one source of truth keeps focus consistent.
4. **Animation = transitions + built-in motion, never `animate-*`.** Tailwind v4 ships **no `tailwindcss-animate`**. `animate-in`, `animate-out`, `fade-in-*`, `zoom-in-*`, `slide-in-from-*`, and `data-[state=…]:animate-*` **silently render nothing — no error, no warning**. Radix exposes `data-[state]` attributes you drive with `transition-*`/CSS keyframes (it does **not** animate itself); `vaul` self-animates. The one blessed state-motion is a chevron: `data-[state=open]:rotate-180 transition-transform`.
5. **Touch targets.** Interactive **triggers and menu-items** (SelectTrigger, DropdownMenuItem, CommandItem row, TabsTrigger, CopyButton) get `pointer-coarse:min-h-11`. **Text-entry** controls (command input, combobox input, textarea) use `text-sm … pointer-coarse:text-base` — 16px on touch, which **prevents the iOS focus-zoom trap**. Do **not** balloon `checkbox`/`switch` themselves (they'd look wrong); enlarge their hit-area by pairing them with a `label` instead.
6. **Radius, border, types.** `rounded-md` for controls, `rounded-lg`/`rounded-xl` for surfaces (popover/menu/sheet), hairline `border` widths. Type the ref with **`React.ComponentRef<…>` and `React.ComponentPropsWithoutRef<…>`** — `React.ElementRef` is `@deprecated` in `@types/react` 19.

## A reference primitive (annotated)
Every primitive is the canonical shadcn wrapper with the house rules applied. `Switch` shows all of them in ~20 lines — clone this shape for the rest.

```tsx
"use client"                                   // rule 1 — like the button

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"
import { cn } from "@/lib/utils"               // rule 1 — the PROJECT's util; match the button's import

const Switch = React.forwardRef<
  React.ComponentRef<typeof SwitchPrimitive.Root>,          // rule 6 — ComponentRef, not ElementRef
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full",
      "border-2 border-transparent transition-colors",       // rule 4 — transition, NOT animate-*
      "data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",   // rule 2 — tokens only
      "disabled:cursor-not-allowed disabled:opacity-50",     // rule 3 — no focus-visible ring; global handles it
      className,                                             // don't balloon size (rule 5) — pair with a <Label>
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform",
        "data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
      )}
    />
  </SwitchPrimitive.Root>
))
Switch.displayName = SwitchPrimitive.Root.displayName        // rule 1 — like the button

export { Switch }
```

Every other primitive is the same shape with rules 2/4/5/6 applied to its parts:
- **Triggers** (SelectTrigger, DropdownMenuItem, …) add `pointer-coarse:min-h-11`, and for a chevron the one blessed motion `data-[state=open]:rotate-180 transition-transform`.
- **Surfaces** (popover / menu / sheet content) use `rounded-lg border bg-popover text-popover-foreground shadow-md` — popover tokens, hairline border.
- **`CopyButton`** is fully house-original (no Radix) yet obeys the same rules: token colors, no per-component focus ring, `pointer-coarse:min-h-11`.

**Full authoring contract + call-site API table: `templates/house-rules.md`.** It carries the file-header/forwardRef boilerplate, the per-part patterns, and the Radix→native mapping — hand it to every author verbatim.

## Radix API notes for call-sites (hand these to the migrator)
The primitives are NOT drop-in for the native DOM API — e.g. `Select` gives you `onValueChange(value)` (not an `onChange` event), a `SelectItem` needs a sentinel value like `"all"` (empty string throws at runtime), `Switch`/`Checkbox` use `onCheckedChange(boolean)`, `CommandItem` uses `onSelect`. The full call-site mapping is the table in **`templates/house-rules.md` §7** — put it in the migration spec when a `parallel-agent-refactor` migrator rewires call-sites.

## Fan-out authorship (parallel, one barrier)
Because every primitive is a **new file**, you can author the whole set concurrently. Give **every** author agent the identical `templates/house-rules.md` + one reference file (the existing `button`) + a **disjoint** list of files to create. Group **interdependent** primitives under a single owner so a cross-file import lands from one hand; the few remaining cross-file imports resolve when all files land together at the end.

| Owner slice | New files it creates | Why grouped |
|---|---|---|
| Overlays | `popover`, `command`, `combobox` | `combobox` = popover + command; keep them with one owner |
| Command dialog | `command`'s `CommandDialog` | reuses the base `Dialog` — same owner as / after `dialog` exists |
| Menus | `dropdown-menu` | standalone |
| Toggles | `switch`, `checkbox`, `radio-group`, `toggle`, `toggle-group` | independent leaves |
| Inputs | `textarea`, `slider`, `label` | `label` is imported by `form` |
| Form | `form` | imports `label` (cross-file — **resolves at the barrier**) |
| Feedback | `tooltip`, `progress`, `separator` | independent |
| Sheet | `drawer` (vaul) | standalone |
| Config / misc | `select`, `tabs`, `CopyButton` | independent |

**Barrier discipline:** the orchestrator runs verification **ONCE, at the end** — never let agents run `build` concurrently. Cross-file imports (`form`→`label`, `combobox`→`popover`/`command`, `CommandDialog`→`Dialog`) are unresolved *within* the wave and resolve only when every file exists at the barrier. `parallel-agent-refactor` owns the orchestration mechanics (fan-out, structured returns, the barrier); this skill supplies *which* files and *how* each one is written.

## Output
The deliverable is a coherent primitive layer plus proof it isn't silently dead:

```
components/ui/
  select.tsx  combobox.tsx  command.tsx  switch.tsx  checkbox.tsx
  radio-group.tsx  tooltip.tsx  dropdown-menu.tsx  popover.tsx  tabs.tsx
  toggle.tsx  toggle-group.tsx  progress.tsx  slider.tsx  separator.tsx
  label.tsx  textarea.tsx  form.tsx  drawer.tsx  copy-button.tsx
```

Because unknown Tailwind utilities **no-op instead of erroring**, a green typecheck+build does **not** prove the styles exist. Run these greps at the barrier — the first two must return **nothing**, the third gets eyeballed — *then* verify:

```bash
# forbidden v4 animation classes (silently render nothing) — MUST be empty
rg -n 'animate-in|animate-out|fade-in|fade-out|zoom-in|zoom-out|slide-in-from|data-\[state=[^]]*\]:animate-' components/ui
# per-component focus rings fighting the global ring — MUST be empty if you rely on the global ring
rg -n 'focus-visible:ring|focus-visible:outline' components/ui
# raw palette shades / hex used for chrome instead of tokens — inspect every hit
rg -n 'bg-(gray|slate|zinc|neutral)-|text-(gray|slate|zinc)-|#[0-9a-fA-F]{6}' components/ui
# only now: ONE typecheck + ONE build (never run concurrently across agents)
npx tsc --noEmit && npm run build
```

Barrier checklist (copy into your notes and tick):
```
[ ] Semantic token layer exists (bg-popover / border-input / bg-primary resolve) — verified BEFORE authoring
[ ] Every primitive mirrors the existing button (use client, cn import, forwardRef + displayName)
[ ] Color grep clean — only semantic tokens, no raw palette / hex for chrome
[ ] Animation grep clean — no animate-*/fade-in-*/data-[state]:animate-* anywhere
[ ] Focus grep clean — no per-component rings (global ring relied on)
[ ] Triggers/menu-items have pointer-coarse:min-h-11; text inputs are 16px on touch
[ ] CommandDialog strips the base Dialog's own chrome; checkbox/switch paired with a label
[ ] ONE typecheck + ONE build, green, at the barrier
```

## Pitfalls
- **Authoring before the token layer exists.** Stock shadcn code assumes `bg-background`/`border-input`/`bg-popover` CSS vars are defined. Skip that layer and **every primitive is unstyled** — and the build stays green, so nothing tells you. Build the token layer **first** (`dark-mode-token-migration`).
- **Unknown Tailwind utilities don't error — they no-op.** A misspelled or non-existent token (`bg-poopver`, a class from a plugin you don't have) produces **no style and no warning**. A green build is not proof; **grep** the output and eyeball a render.
- **`tailwindcss-animate` isn't in v4.** `animate-in` / `fade-in-*` / `data-[state=open]:animate-*` copied from stock shadcn silently do nothing. Drive Radix's `data-[state]` attributes with `transition-*`/CSS keyframes (Radix doesn't animate itself; `vaul` does); grep to confirm none leaked in.
- **The base `Dialog`'s own chrome flows into `CommandDialog`.** `CommandDialog` wraps `Dialog`, so the dialog's padding/border/shadow layer onto the command palette. Strip or override the inherited chrome so the palette isn't double-framed.
- **Ballooning `checkbox`/`switch` to hit 44px.** Their hit-area *is* small, but forcing `min-h-11` on the control itself looks wrong. **Pair them with a `Label`** and let the label extend the clickable area — that's the accessible fix anyway.
- **`React.ElementRef`.** `@deprecated` in `@types/react` 19; use `React.ComponentRef`. Stock snippets predating v19 still use `ElementRef` — swap it.
- **Mixing icon strategies.** Pick `lucide-react` **or** inline SVG to match the house style — don't ship half and half.

## Combining with other skills
- `dark-mode-token-migration` — **the hard prerequisite.** It defines the semantic tokens every primitive here depends on, and once they're tokens the whole set gets **dark mode for free**. Do it first, always.
- `parallel-agent-refactor` — the orchestration engine: author this set as its **wave A** (new files, disjoint owners, one barrier), then run **wave C** to swap call-sites onto the primitives using the Radix API notes above.
- `ux-decision-rubrics` — decide **which** primitive each job actually needs (select vs combobox vs dropdown-menu; switch vs checkbox) **before** wiring anything, so you don't build the wrong control.
- `empirical-responsive-audit` — after building, **render and measure** to prove the 44px targets, 16px inputs, and safe-area rules actually hold — the primitive layer is where those mobile-correctness rules get baked in once.
- `ui-ux-audit` — sources the backlog: it's the review that finds the faked `<select>`s, `title=` tooltips, and DIY meters this skill replaces; run it again after to confirm the swap landed.
- `frontend-design` — for the visual/aesthetic layer on top; this skill builds accessible plumbing, not the look.
- `production-agent-audit`, `godaddy-api`, other platform-ops skills — orthogonal; unrelated to building a UI primitive layer.
