# House-rules spec — hand this SAME file to every write-agent

> Example shared spec for a Next.js / Tailwind v4 / Radix (shadcn-style) migration.
> Copy it, replace the bracketed values with your project's real tokens/classes,
> freeze it before wave C, and give every write-agent: (1) this spec, (2) its
> DISJOINT file list, (3) one reference file to match house style. The point is
> that N agents produce ONE house style, not N personal styles.

## 0. Non-negotiables
- **Honor `CLAUDE.md` / `AGENTS.md`.** Project rules win over anything here.
- **Only edit the files in YOUR assigned list.** Do not touch shared files
  (`package.json`, `app/globals.css`, `app/layout.tsx`, the route manifest,
  `README.md`) — the orchestrator owns those. If you think one needs a change,
  put it in `ANYTHING UNSURE`, do not edit it.
- **Match the reference file** you were given for structure, import order, and
  formatting. When in doubt, mirror it.

## 1. Allowed tokens / classes (emit ONLY these for color)
Use semantic tokens, never raw palette colors or hex:

| Use for | Class |
|---|---|
| Page / card background | `bg-background`, `bg-card` |
| Primary surface | `bg-primary` + `text-primary-foreground` |
| Muted surface | `bg-muted` + `text-muted-foreground` |
| Body text | `text-foreground` |
| Secondary text | `text-muted-foreground` |
| Borders / inputs | `border-border`, `border-input` |
| Destructive | `bg-destructive` + `text-destructive-foreground` |

These tokens are defined in the (already-committed) token layer. Do **not**
invent new token names — if you need one that doesn't exist, stop and report it.

## 2. FORBIDDEN patterns (these silently break — never emit them)
- **Tailwind-v4 animation classes with no plugin installed.** This project has
  **no `tailwindcss-animate`**. The following produce **nothing — no error**:
  `animate-in`, `animate-out`, `fade-in-*`, `fade-out-*`, `zoom-in-*`,
  `zoom-out-*`, `slide-in-from-*`, `data-[state=open]:animate-*`,
  `data-[state=closed]:animate-*`. **Delete them** when copying stock snippets;
  use CSS transitions (`transition-*`, `duration-*`) instead.
- **Hardcoded colors:** no `text-white`, `text-black`, `bg-white`, `bg-black`,
  no `#rrggbb`, no `text-gray-500` / `bg-slate-*`. Map to a token (see §5).
- **`text-white` on a tokenized background** — it goes invisible in dark mode.
  See pairing rules §4.

## 3. API adaptation at call-sites (Radix / shadcn primitives)
When migrating a form control onto the new primitive, adapt the handler — the
API is NOT the native DOM API:

| Primitive | Correct handler | Wrong (native) |
|---|---|---|
| `Select` | `onValueChange={(value) => …}` | ~~`onChange={(e) => …}`~~ |
| `Switch` | `onCheckedChange={(checked) => …}` | ~~`onChange`~~ |
| `Checkbox` | `onCheckedChange={(checked) => …}` | ~~`onChange`~~ |
| `Tabs` | `onValueChange={(value) => …}` | ~~`onChange`~~ |

- `Select` gives you the **value directly**, not an event — don't read
  `e.target.value`.
- An **empty-string `<SelectItem value="">` is illegal** and throws at runtime.
  Use a sentinel: `<SelectItem value="all">All</SelectItem>` and treat `"all"`
  as "no filter" in your handler.

## 4. Pairing rules (move foreground + background together)
Whenever you set a background token, set its matching foreground token in the
same change — never leave a hardcoded foreground behind:

- `bg-primary` → `text-primary-foreground`
- `bg-muted` → `text-muted-foreground`
- `bg-destructive` → `text-destructive-foreground`
- `bg-card` → `text-card-foreground`

A `bg-primary` left with `text-white` is white-on-near-white in dark mode.

## 5. Mapping table (mechanical — zero discretion)
For codemod-style edits, apply exactly:

| Old | New |
|---|---|
| `text-gray-500`, `text-slate-500` | `text-muted-foreground` |
| `text-gray-900`, `text-black` | `text-foreground` |
| `bg-white` | `bg-background` (or `bg-card` on cards) |
| `border-gray-200` | `border-border` |
| `<select onChange={e => set(e.target.value)}>` | `<Select onValueChange={set}>` |
| `<input type="checkbox" onChange=…>` | `<Checkbox onCheckedChange=…>` |
| `value=""` on a `SelectItem` | `value="all"` (+ handle `"all"` upstream) |

## 6. Return format (paste this filled-in as your final message)
```
FILES TOUCHED:
- <each file you edited>
WHAT CHANGED (old → new):
- <file>: <before → after, one line per meaningful change>
ANYTHING UNSURE:
- <spec ambiguity, needed-but-missing token, shared-file change you avoided,
   or any deviation> (write "none" if none)
```
