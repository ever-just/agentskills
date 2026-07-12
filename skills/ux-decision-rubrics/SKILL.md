---
name: ux-decision-rubrics
description: Make UI/UX calls objectively with two rubrics instead of by taste. Rubric A picks the right form control via decisive rules like NN/g's toggle-vs-checkbox test; Rubric B scores each key user flow 1–5 across 7 clarity dimensions to flag which to redesign. Use when choosing a form control, judging whether a flow needs redesign, justifying "objectively better" to a stakeholder, or writing UI acceptance criteria. Not for pure brand/visual work — use `frontend-design`.
---

# UX Decision Rubrics

## Overview
Two rubrics that turn "make it better" into **measurable, defensible calls** — so a UI decision is backed by a rule you can defend to a stakeholder (NN/g, Baymard, WCAG), not personal taste.

- **Rubric A — Component Choice:** which control belongs on which job. A default rule plus one decisive test settle most arguments in a single line.
- **Rubric B — User-Story Clarity Scoring:** which flows to redesign, scored 1–5 on 7 dimensions so "this feels clunky" becomes a number with a threshold and a ranking.

The whole value is the same discipline that makes an audit trustworthy: **decide by the rubric first, then implement — never pick by feel and back-fill a reason.** Cite the rule inline so the decision survives review.

## When to use
- "Which control should this be — a select or a combobox? a toggle or a checkbox?"
- "Is this flow clear enough to ship, or does it need a redesign?"
- "Prove this redesign is *objectively* better." / "Why is this the right control?"
- Setting **acceptance criteria** for a UI change (definition of done a reviewer can check).
- Ranking a backlog of screens/flows by where redesign effort actually pays off.

## When NOT to use this skill
- **Pure brand / visual-identity work** (typography personality, color story, art direction) → use `frontend-design`. These rubrics judge *fit-to-job and clarity*, not aesthetic taste.
- **Implementing** the chosen control (accessible primitive, tokens, focus ring) → use `shadcn-tailwind-v4-primitives`.
- **Mechanically verifying** the Mobile-parity row (overflow, tap-target, input-zoom) → use `empirical-responsive-audit` — render it, don't eyeball it.

---

## Rubric A — Component Choice

### The default rule
**Fewer options → more-visible control.** As the option count and dynamism drop, move up this ladder:

`segmented / buttons  >  radio group  >  select  >  combobox`

- A **binary that applies instantly** (no Save) → **toggle**.
- A **binary submitted with a form** → **checkbox**.

### The decisive toggle-vs-checkbox test (NN/g)
> **Is there an instant cause-and-effect with NO Save button?** → **toggle**.
> **Is the value collected and applied on Submit?** → **checkbox**.

**Never mix instant toggles inside a Submit-button form.** A switch tells the user "this already took effect"; if it actually waits for Save, you have broken the control's core contract. When in doubt, ask "does flipping it change the world *right now*?" — yes ⇒ toggle, no ⇒ checkbox.

### Fast path — pick a control in 3 questions
1. **Is it a binary (on/off)?** Instant, no Save → **toggle**. Submitted with a form → **checkbox**.
2. **Is it 1-of-N?** N≤5 all worth showing → **segmented** (parallel views) or **radio** (options, on submit); up to ~7–10, no search → **select**; long / dynamic / searchable → **combobox**.
3. **Is it an action, not a value?** Now → **button** (one primary per view) or **menu** (overflow/row actions). App-wide nav + actions → **command palette**.

### The full table
| Control | Use it when | Don't — use instead |
|---|---|---|
| **Text input** | short free-form single value (name, subdomain, note) | value has a known finite set → `select` / `radio` / `combobox` |
| **Textarea** | multi-line / long free-form value (description, DNS TXT body) | a single logical short value → `text input` |
| **Select (Radix)** | pick 1 of a small known list (≤~7–10), no search needed | list is long/searchable → `combobox`; or ≤5 options worth showing at once → `segmented` / `radio` |
| **Combobox (input + listbox)** | pick 1 of a long / dynamic / searchable list, or free-entry-with-suggestions. **Workhorse for country / timezone / domain pickers** | static short list → `select` |
| **Command palette (⌘/Ctrl-K, `cmdk`)** | **global** nav + actions app-wide for power users | selecting one field value inside a form → `combobox`. It is a different job than a field combobox |
| **Radio group** | pick 1 of 2–5 mutually-exclusive options, all worth showing, effect on submit. **Always give a default** | on/off → `toggle`; many options → `select` |
| **Checkbox group (multi)** | choose 0-to-many **independent** options | options are mutually exclusive → `radio` |
| **Single checkbox** | one binary **submitted with a form** ("I agree", "also add `www`") | takes effect instantly → `toggle` |
| **Toggle / Switch** | a binary that takes effect **immediately, no Save** | needs Submit/confirm, or is destructive → `checkbox` / confirm dialog |
| **Segmented / toggle-group** | switch between 2–5 **parallel views or modes** (All / Active / Errored; JSON / Table) | yes/no → `toggle` |
| **Button** | trigger an action or navigation **now**. One **primary** per view | it represents *state* → `toggle` / `checkbox` |
| **Menu (dropdown)** | secondary / overflow actions on a row or object (rename / delete / re-verify) | choosing a form value → `select` |
| **Number input (+ presets)** | an **exact** numeric value (TTL, port, priority) | an imprecise range → `slider` (rare) |
| **Date picker** | a specific date/time | experts type a range faster — also allow text entry |
| **Slider** | an imprecise value in a continuous range | exact value matters → `number input` |

### Common mistakes (all objectively wrong per the table)
- **Segmented control used for yes/no** — it's for *parallel views*, not a binary state. Use a toggle.
- **A native `<select>` where a searchable combobox is needed** — e.g. the full ~195-item country list. No type-ahead = a findability failure. Use a combobox.
- **A toggle used for a value that only applies on Save** — breaks the instant cause-and-effect contract. Use a checkbox.

---

## Rubric B — User-Story Clarity Scoring

For **each key job-to-be-done** (not each page — the whole task, e.g. "connect a custom domain"), score all 7 dimensions **1–5**. Anchor the scale: **1 = broken/absent, 3 = works but with friction, 5 = exemplary.**

| # | Dimension | Score 1–5 on whether the flow… |
|---|---|---|
| 1 | **Findability** | lets the user locate where to start in **≤2 clicks or one ⌘-K query** |
| 2 | **Clarity of next step** | makes the **single primary action obvious on every screen** |
| 3 | **Input forgiveness** | accepts messy input, **normalizes** it, and **prevents** errors |
| 4 | **Feedback / status** | keeps **system status visible at every async step** (nothing silent) |
| 5 | **Recoverability** | lets the user **undo / cancel and recover from any error — no dead-ends** |
| 6 | **Mobile parity** | is **fully completable on mobile** (no h-scroll, 44px targets, 16px inputs, thumb-reachable primary) |
| 7 | **Expert efficiency** | offers a **keyboard / ⌘-K / API path** for repeat use |

### The scoring rules (non-negotiable)
- **Any dimension ≤2 = a defect to fix before ship** — a ship-blocker on its own, *regardless of the total*. Never average a 2 away.
- **Task total < 28/35 → redesign that flow.** (28 = a mean of 4 across the seven.)
- **Track the scores per release** to catch regressions — a flow that was 31 dropping to 26 is a signal.
- **Rank flows by (low score × high value)** so the redesign starts where it matters, not where it's easiest.

### Copy-paste scorecard (fill one per flow)
```
Flow: <job-to-be-done>                     Value: <High | Med | Low>
  1 Findability            [ ]/5
  2 Clarity of next step   [ ]/5
  3 Input forgiveness      [ ]/5
  4 Feedback / status      [ ]/5
  5 Recoverability         [ ]/5
  6 Mobile parity          [ ]/5
  7 Expert efficiency      [ ]/5
  ─────────────────────────────────
  TOTAL                    [ ]/35
  Verdict: total <28 → REDESIGN.  Any dimension ≤2 → DEFECT (blocks ship) even if total ≥28.
  Priority = (35 − total) × value.   # rank the backlog by this
```

---

## Supporting principles — smart inputs
These are how you *earn* points 3–4 on Rubric B, and the acceptance criteria for any input you build.

- **Schema-first validation, shared client + server via `zod`.** One schema, both sides — the client and server can never drift.
- **Inline, reward-early / punish-late.** Validate a field the moment it becomes valid; surface its error only **after** the user leaves it invalid. Put the error **below the field, with an icon + text** (never a placeholder, never color-only).
- **Prevent errors over messaging them.** Constrain the input (masks, steppers, pickers, `<select>`) so the invalid state is unreachable in the first place.
- **Normalize, don't reject.** Trim, lowercase, strip protocol, coerce — accept `"Https://Foo.COM/ "` and store `foo.com`. Rejecting what you could have fixed is a self-inflicted error.
- **Color is never the only signal.** If the palette is monochrome, carry status by **icon + text + weight, NOT color alone** (WCAG 1.4.1). A red-only "invalid" is invisible to many users and in grayscale.

## Mobile-correctness acceptance criteria
Paste these into the ticket as the definition of done for the Mobile-parity dimension; verify with `empirical-responsive-audit`:
- [ ] Inputs use **≥16px** font (prevents iOS auto-zoom-on-focus).
- [ ] Interactive targets are **≥44px** (WCAG **2.5.5** Target Size (Enhanced, AAA) / Apple HIG; SC **2.5.8** Target Size (Minimum), AA, requires only ≥24px — we adopt the stronger 44px).
- [ ] Layout respects **safe-area insets** (`env(safe-area-inset-*)`).
- [ ] **Vertical-only scroll** — zero horizontal overflow at every breakpoint.
- [ ] **Pinch-zoom is KEPT** — never `maximum-scale=1` / `user-scalable=no` (WCAG 1.4.4).

---

## Output
A decision, not an essay. Two deliverable shapes:

**Component choice — a one-line decision record that cites the rule:**
> **Country picker → `combobox`** (searchable), not a native `<select>`. Rubric A: 1-of-a-long-list **with search needed**; a ~195-item native select fails Findability. *Cite: NN/g complex-application design.*

> **"Also add `www`" → single `checkbox`**, not a toggle. Rubric A / toggle-test: the value is **applied on Submit with the form**, so it is a checkbox — a toggle would falsely promise an instant effect.

**Flow review — the filled scorecard(s) plus a rollup:**
- One scorecard per key job (template above), each with its total, any ≤2 defects flagged, and Value.
- A **redesign list ranked by `(35 − total) × value`** — the flow at the top is where redesign pays off first.
- The **mobile acceptance-criteria checklist** attached to any flow whose Mobile-parity scored ≤3.

## Pitfalls
- **Deciding by taste, then back-filling a rule.** Run the rubric *first*; the rule is the decision, not the rationalization. If you can't cite one, you haven't decided objectively yet.
- **A toggle inside a Submit-button form.** The instant cause-and-effect contract is broken — users think it already applied. It's a checkbox.
- **A segmented control for yes/no.** It reads as two parallel views, not a binary state. It's a toggle.
- **A native `<select>` for a long/searchable list.** No type-ahead filtering; scrolling 195 items is a Findability failure. It's a combobox.
- **Averaging a defect away.** A dimension at 2 blocks ship even if the total clears 28. Report the low dimension explicitly; don't hide it in the mean.
- **Scoring a flow you never ran.** Feedback/status, Recoverability, and Mobile-parity can only be scored by **driving the flow** — reading the code under-detects them. Pair with `empirical-responsive-audit` for the mobile row.
- **Color-only status.** Fails WCAG 1.4.1 and vanishes in a monochrome palette. Add icon + text + weight.

## Sources
The rubrics are defensible because each rule traces to published guidance:
- **NN/g** — *Toggle-Switch Guidelines* (the toggle-vs-checkbox test), *Complex-Application Design* (control density / visibility ladder), *10 Usability Heuristics* (visibility of system status → Feedback; user control & error recovery → Recoverability), *Bottom Sheets*.
- **Baymard** — *Form Design* (inline validation, error prevention; **never use inline/placeholder labels**).
- **Refactoring UI** — hierarchy and spacing carried by weight/size/space, **not color alone**.
- **WCAG 2.2** — **2.5.5** Target Size (Enhanced, AAA) is the 44px figure we adopt (**2.5.8** Target Size (Minimum), AA, requires only ≥24px); **1.4.4**/**1.4.10** resize & reflow (keep pinch-zoom); **1.4.1** use of color (status ≠ color alone). The **≥16px input** rule is **iOS auto-zoom prevention** — WCAG-adjacent, not a criterion.
- **shadcn/ui + Radix** — the accessible primitive layer these controls should be built on.

## Combining with other skills
- `shadcn-tailwind-v4-primitives` — once Rubric A picks the control, scaffold it correctly (accessible Radix primitive, semantic tokens, focus ring, 44px targets). Rubric decides *which*; that skill builds *it*.
- `empirical-responsive-audit` — verify the **Mobile-parity** dimension and the mobile acceptance criteria **mechanically by rendering**, instead of scoring by eye.
- `ui-ux-audit` — the companion hand-checklist; run it alongside Rubric B for the qualitative pass on a specific dashboard.
- `dark-mode-token-migration` — when a flow scores low on Feedback/status because it leans on color, the semantic token layer is where you fix status semantics (icon + text + token, not raw color).
- `parallel-agent-refactor` — when Rubric B flags many flows for redesign, fan the per-flow fixes out across parallel write-agents (one disjoint slice each).
- `production-agent-audit` — the same "objective, evidence-bound, defensible-to-a-stakeholder" philosophy applied to a live agent platform instead of a UI; reach for it when the thing under review is agent behavior, not screens.
