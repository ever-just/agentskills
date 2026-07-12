# Wave plan — dependency-ordered fan-out

> Example plan for a Next.js / Tailwind v4 / Radix redesign (~20 agents, 5 waves,
> all merged). Fill in your real routes and files. Rule: order waves by
> DEPENDENCY (foundation → centralized → parallel leaves → accelerators →
> parallel leaves). Every wave ends at a typecheck+build BARRIER and is committed
> AND pushed as a durable checkpoint before the next wave starts.

## Ownership legend
- **[INLINE]** — the orchestrator edits it directly (shared / foundation / high-conflict).
- **[AGENT n]** — one write-agent owns exactly this DISJOINT file set.
- No file may appear under two agents. Shared files are always **[INLINE]**.

---

## Wave A — Foundation (LOW parallelism)
Establish the token layer FIRST, then author the new primitive files.

- **[INLINE]** `app/globals.css` — define the token layer (CSS vars: `--background`,
  `--foreground`, `--primary`, `--muted`, `--border`, …) in light + dark.
- **[INLINE]** `package.json` — add the primitive deps (single owner).
- **[AGENT A1]** `components/ui/select.tsx` (new file)
- **[AGENT A2]** `components/ui/switch.tsx`, `components/ui/checkbox.tsx` (new files)
- **[AGENT A3]** `components/ui/button.tsx`, `components/ui/card.tsx` (new files)

New-file authorship parallelizes safely (distinct files can't collide), but the
**token layer must be committed before primitives reference it** — so either do
`globals.css` inline first, or make it a strict pre-step. Freeze
`templates/house-rules-spec.md` at the end of this wave.

**BARRIER A:** `typecheck && build` → commit `"wave A: token layer + primitives"` → **push**.

---

## Wave B — Core value (SERIAL, deliberately)
The one centralized change everything downstream assumes.

- **[INLINE]** `app/layout.tsx` — app shell adopts the new theme provider / tokens.
- **[INLINE]** shared nav / theme-toggle wiring.

Kept single-owner because it's the app shell (high-conflict) and every leaf
depends on it.

**BARRIER B:** `typecheck && build` → commit `"wave B: shell on new theme"` → **push**.

---

## Wave C — Per-route component migration (HIGH parallelism)
One agent per route, fully disjoint. Each agent gets: this spec, its file list,
and `app/dashboard/page.tsx` as the house-style reference.

- **[AGENT C1]** `app/pricing/page.tsx` (+ `app/pricing/_components/*`)
- **[AGENT C2]** `app/settings/page.tsx` (+ `app/settings/_components/*`)
- **[AGENT C3]** `app/billing/page.tsx`
- **[AGENT C4]** `app/team/page.tsx`
- … one agent per remaining route …

Launch ALL Wave-C agents in a SINGLE message so they run concurrently. Wait for
every completion notification before the barrier.

**BARRIER C:** merge structured returns → run cleanup greps
(`rg 'animate-in|fade-in|zoom-in|data-\[state.*animate'`,
`rg 'text-white|bg-white|#[0-9a-fA-F]{6}'`) → `typecheck && build` →
commit `"wave C: routes on new primitives"` → **push**.

---

## Wave D — Accelerators (MEDIUM)
Shared helpers that make the remaining leaf work uniform.

- **[INLINE or AGENT D1]** `lib/use-token-color.ts`, `lib/format.ts` — shared hooks/utils.

**BARRIER D:** `typecheck && build` → commit `"wave D: shared helpers"` → **push**.

---

## Wave E — Per-route token / color migration (HIGH parallelism)
One agent per route again, disjoint, applying the §5 mapping table + §4 pairing rules.

- **[AGENT E1]** `app/pricing/**`
- **[AGENT E2]** `app/settings/**`
- **[AGENT E3]** `app/billing/**`
- … one agent per route …

**BARRIER E:** cleanup greps (esp. paired-class invisibility) → `typecheck && build` →
commit `"wave E: tokenized colors + dark mode"` → **push**.

---

## Checkpoint log (orchestrator fills as it goes)
| Wave | Agents | Typecheck | Build | Commit SHA (pushed) | Unresolved `unsure` carried fwd |
|---|---|---|---|---|---|
| A | A1–A3 + inline | | | | |
| B | inline | | | | |
| C | C1–Cn | | | | |
| D | D1 | | | | |
| E | E1–En | | | | |
