# Utility → Token mapping spec (hand to every per-route migration agent)

This is the single house-rules artifact each fan-out agent carries during Step 3
(see `parallel-agent-refactor`). It has three parts: the **rules**, the **mapping
table**, and the **do-not-touch list**. Apply mechanically. When in doubt, leave
the raw class as-is — a raw class is a spot that doesn't darken yet (caught in
visual QA); a wrong guess is a visible light-mode regression.

Family shown is Tailwind `stone`. If your app uses `slate`/`gray`/`zinc`/`neutral`,
substitute that family name in every row — the shade→token mapping is the same.

## Rules
1. **Light must stay pixel-identical.** Only swap a raw class for the token whose
   light value equals it. Never "improve" a color.
2. **Leave unmatched shades RAW.** If a shade has no exact row below, do not guess
   a near-match. Leave it.
3. **Respect the do-not-touch list** — those raw classes are intentional.
4. **Move foregrounds with backgrounds.** After tokenizing a `bg-*`, its paired
   `text-*` must be tokenized too (see the paired-class trap).
5. **Return** `FILES TOUCHED` + `WHAT CHANGED (old → new)` + `ANYTHING UNSURE`.

## Mapping table

| Raw utility | Token utility | Notes |
|---|---|---|
| `bg-stone-50` | `bg-background` | app canvas |
| `bg-white` | `bg-card` | **NOT `bg-background`** — panels/inputs stay a step lighter than the canvas |
| `bg-stone-100` | `bg-muted` | subtle filled surfaces |
| `hover:bg-stone-100` | `hover:bg-accent` | hover surface |
| `hover:bg-stone-200` | `hover:bg-accent` | hover surface |
| `text-stone-900` | `text-foreground` | primary text |
| `text-stone-800` | `text-foreground` | primary text |
| `text-stone-700` | `text-foreground` | primary text |
| `text-stone-600` | `text-muted-foreground` | secondary text |
| `text-stone-500` | `text-muted-foreground` | label text |
| `text-stone-400` | `text-muted-foreground` | placeholder/label |
| `border-stone-200` | `border-border` | dividers, card edges |
| `border-stone-100` | `border-border` | dividers |
| `border-stone-300` | `border-input` | form-control borders (heavier) |
| `divide-stone-200` | `divide-border` | list separators |
| `ring-stone-900` | `ring-foreground` | focus ring on neutral controls |
| `bg-stone-900` **+** `text-stone-50` (paired emphasis box) | `bg-primary` **+** `text-primary-foreground` | tokenize the pair together |
| lone `bg-stone-900` (emphasis fill) | `bg-primary` | + any `text-stone-50` on it → `text-primary-foreground` |

## Do-not-touch list (leave RAW)

- **Deliberately-dark blocks** — secret-reveal / code / terminal banners on
  `bg-stone-950`/`bg-stone-900` that are meant to be dark in BOTH themes.
- **Destructive / red** — `bg-red-*`, `text-red-*`, `border-red-*`. The hue is
  already theme-identical via `--destructive`.
- **Brand / data-viz / provider colors** — logo colors, chart series, an OAuth
  provider button's brand color.
- **Customer-facing embedded previews** — a widget mock / iframe that must always
  render how end-users see it (usually always light).
- **Overlay scrims** — change `bg-stone-950/40` → `bg-black/40` (fixed dark scrim),
  NOT a token. A scrim that inverts to light stops dimming.
- **Any off-palette shade with no exact row above** — leave raw.

## Paired-class cleanup grep (run over YOUR files before returning)

```bash
rg -n 'text-white|text-stone-50|bg-stone-900|border-stone-900|bg-stone-700' <your-files>
```

| Orphan next to a tokenized element | Fix |
|---|---|
| `text-white` / `text-stone-50` on a `bg-primary` | `text-primary-foreground` |
| `border-stone-900` outlining an emphasis element | `border-foreground` (or `border-primary`) |
| low-contrast dark fill `bg-stone-700` (e.g. a bar track) | `bg-muted-foreground` |

If the orphan is on a do-not-touch element (deliberately-dark block, brand button),
leave it — it's correct there. The grep finds candidates; you decide per hit.
