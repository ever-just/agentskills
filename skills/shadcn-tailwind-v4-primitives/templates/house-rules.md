# Primitive house-rules — hand this SAME file to every authoring agent

> The shared contract for authoring a shadcn/ui + Radix primitive set on
> **Tailwind v4**. Copy it verbatim, hand every author agent (1) this file,
> (2) the existing `button.tsx` (+ `input.tsx`) as the style reference, and
> (3) a DISJOINT list of NEW files to create. The point of a shared spec is that
> N agents produce ONE house style, not N personal styles. Replace the bracketed
> paths with your project's real ones before handing it out.

## 0. Non-negotiables
- **Honor `CLAUDE.md` / `AGENTS.md`.** Project rules win over anything here.
- **Create ONLY the new files in YOUR assigned list.** Do not edit existing
  shared files (`package.json`, `globals.css`/theme, `layout`, a barrel/index).
  If one needs a change, put it in `ANYTHING UNSURE` — do not touch it.
- **A semantic token layer MUST already exist.** If `bg-popover`, `border-input`,
  `bg-primary` don't resolve to real CSS vars, STOP and report it — do not invent
  tokens. Every rule below assumes the token layer is committed.
- **Match `[components/ui/button.tsx]`** for `"use client"` placement, the `cn`
  import path, `React.forwardRef` + `displayName` shape, and formatting. When in
  doubt, mirror the button.

## 1. File header boilerplate (every primitive)
```tsx
"use client"                                   // first line, like the button

import * as React from "react"
import * as XPrimitive from "@radix-ui/react-x"
import { cn } from "[@/lib/utils]"             // the PROJECT's util — match the button's import EXACTLY

const X = React.forwardRef<
  React.ComponentRef<typeof XPrimitive.Root>,          // §6 — ComponentRef, NOT ElementRef
  React.ComponentPropsWithoutRef<typeof XPrimitive.Root>
>(({ className, ...props }, ref) => (
  <XPrimitive.Root ref={ref} className={cn("…", className)} {...props} />
))
X.displayName = XPrimitive.Root.displayName    // always set displayName, like the button

export { X }
```

## 2. Color — semantic tokens ONLY (never a raw palette shade for chrome)
Emit only these token utilities. A raw shade (`bg-gray-100`, `#1e293b`,
`text-white`) breaks in the opposite theme — tokens are why the set is dark-ready
with zero extra work.

| Use for | Class |
|---|---|
| Popover / menu / dropdown surface | `bg-popover` + `text-popover-foreground` |
| Primary / selected | `bg-primary` + `text-primary-foreground` |
| Hover / highlighted item | `bg-accent` + `text-accent-foreground` |
| Muted surface / secondary text | `bg-muted`, `text-muted-foreground` |
| Destructive | `bg-destructive` (+ `text-destructive-foreground`) |
| Borders / control borders | `border-border`, `border-input` |

FORBIDDEN for chrome: `bg-white`/`bg-black`/`text-white`/`text-black`, any
`bg-(gray|slate|zinc|neutral)-*`, any `text-(gray|slate|zinc)-*`, any `#rrggbb`.
Whenever you set a background token, set its **matching foreground token** in the
same change (`bg-primary`→`text-primary-foreground`, `bg-accent`→`text-accent-foreground`).

## 3. Focus — rely on the GLOBAL ring
This project has a global `:focus-visible` ring. Do **NOT** add per-component
`focus-visible:ring-*`, `focus-visible:outline-*`, or `focus:ring-*`. One source
of truth keeps focus consistent; per-component rings drift and fight the global
one. (Disabled states are fine: `disabled:opacity-50 disabled:cursor-not-allowed`.)

## 4. Animation — transitions + built-in motion, NEVER `animate-*`
Tailwind v4 ships **no `tailwindcss-animate`**. These classes render **nothing —
no error, no warning** — so delete them when copying stock shadcn snippets:

```
animate-in  animate-out
fade-in-*   fade-out-*
zoom-in-*   zoom-out-*
slide-in-from-*   slide-out-to-*
data-[state=open]:animate-*   data-[state=closed]:animate-*
```

Use instead:
- `transition-*` + `duration-*` (e.g. `transition-colors`, `transition-transform`).
- Radix exposes `data-[state]` attributes you drive with `transition-*`/CSS
  keyframes (it does **not** animate itself); `vaul` self-animates.
- The ONE blessed state-motion: a chevron —
  `data-[state=open]:rotate-180 transition-transform`.

## 5. Touch targets
| Control kind | Rule | Class |
|---|---|---|
| **Triggers / menu-items** (SelectTrigger, DropdownMenuItem, CommandItem row, TabsTrigger, CopyButton) | ≥ 44px on touch | `pointer-coarse:min-h-11` |
| **Text-entry** (command input, combobox input, textarea) | 16px on touch — prevents the **iOS focus-zoom trap** | `text-sm … pointer-coarse:text-base` |
| **checkbox / switch** | do NOT balloon the control — it looks wrong | keep native size; **pair with a `<Label>`** so the label extends the hit-area |

## 6. Radius, border, types
- **Radius:** `rounded-md` for controls (trigger, input, item); `rounded-lg`/
  `rounded-xl` for surfaces (popover, menu, sheet, dialog).
- **Border:** hairline `border` widths + `border-border` / `border-input`. No
  heavy or colored borders for chrome.
- **Types:** `React.ComponentRef<typeof X.Root>` and
  `React.ComponentPropsWithoutRef<typeof X.Root>`. **`React.ElementRef` is
  `@deprecated` in `@types/react` 19** — never use it (swap it out of stock
  snippets that predate v19).

## 7. Radix call-site API (set the RIGHT prop names in your primitive, and hand this to the migrator)
The primitives are NOT the native DOM API. Expose/forward these:

| Primitive | Correct | Wrong (native reflex) |
|---|---|---|
| `Select` | `onValueChange(value)` — value, not an event | ~~`onChange(e)` / `e.target.value`~~ |
| `SelectItem` | a sentinel value like `"all"` | ~~`value=""`~~ — empty string throws at runtime |
| `Switch` / `Checkbox` | `onCheckedChange(checked: boolean)` | ~~`onChange`~~ |
| `Tabs` | `onValueChange(value)` | ~~`onChange`~~ |
| `CommandItem` | `onSelect(value)` | ~~`onClick`~~ |
| generic `Combobox` wrapper | props `{ options: {value,label}[], value, onChange }` | — (house convenience API) |

## 8. Interdependencies (author, but expect these to resolve at the barrier)
- `combobox` imports `popover` + `command` — same owner.
- `command`'s `CommandDialog` reuses the base `Dialog` — strip the Dialog's own
  padding/border/shadow so the palette isn't double-framed.
- `form` imports `label` — the import is cross-file and resolves when both land
  at the barrier; don't inline a second label.

## 9. Return format (paste this filled-in as your final message)
```
FILES CREATED:
- components/ui/<each new file>
WHAT EACH DOES (one line):
- <file>: <primitive> over <package>, house rules applied
DEVIATIONS / ANYTHING UNSURE:
- <missing token, a shared-file change you avoided, an API you weren't sure of,
   any place you couldn't follow the spec> (write "none" if none)
```
