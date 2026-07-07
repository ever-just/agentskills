# Architecture Decisions — Records & Choosing Between Options

Purpose: how to *make* and *capture* a significant architecture decision — a lightweight record format (ADR) plus a repeatable framework for choosing between candidate technologies or approaches, with an evidence discipline so the choice is defensible instead of asserted.

> A design doc (see `examples/worked-design-doc.md`) describes the *whole* system. An **ADR captures one significant decision** — why you picked this database, this messaging model, this tenancy model — with the alternatives you rejected and the consequences you accepted. Write an ADR whenever a choice is expensive to reverse, affects multiple teams, or someone will later ask "why did we do it this way?"

---

## 1. Architecture Decision Records (ADRs)

An ADR is a short, immutable, numbered markdown file capturing one decision at a point in time. You never edit a decided ADR — you supersede it with a new one. A directory of them (`docs/adr/0001-*.md`, `0002-*.md`, …) becomes the project's decision history.

| Resource | What it is |
|---|---|
| [adr.github.io](https://adr.github.io/) | The community hub — practice overview, template catalog, tooling. |
| [joelparkerhenderson/architecture-decision-record](https://github.com/joelparkerhenderson/architecture-decision-record) | The canonical examples/templates repo; start here. |
| [Michael Nygard's template](https://github.com/joelparkerhenderson/architecture-decision-record/blob/main/locales/en/templates/decision-record-template-by-michael-nygard/index.md) | The original (2011) minimal ADR — the first use of the term. |
| [MADR (Markdown ADR)](https://adr.github.io/madr/) · [templates](https://adr.github.io/adr-templates/) | The richer modern variant with explicit considered-options + pros/cons. |

### The Nygard template (minimal — the default)

```
# NN. <short decision title>

Date: YYYY-MM-DD
Status: proposed | accepted | deprecated | superseded by ADR-NN

## Context
The forces at play: requirements, constraints, the problem that forces a choice.
State the facts (incl. numbers) neutrally — no decision yet.

## Decision
"We will <do X>." One clear, active-voice statement of what was chosen.

## Consequences
What becomes easier AND harder as a result. The costs you are accepting,
the new risks, the follow-up work. Be honest about the downsides.
```

### The MADR template (when the choice was contested)

Add these sections when multiple options were seriously weighed and you want the reasoning on record:

```
## Decision Drivers
- <the criteria that actually decided it: latency SLO, cost, team skill, ...>

## Considered Options
1. <Option A>   2. <Option B>   3. <Option C>

## Decision Outcome
Chosen: "<Option B>", because <the driver(s) it wins on>.

### Pros and Cons of the Options
#### <Option A>
- Good, because ...
- Bad, because ...
(repeat per option)
```

**Status lifecycle:** `proposed` → `accepted` → later `deprecated` or `superseded by ADR-NN`. Superseding, not editing, keeps the history truthful.

---

## 2. Choosing between options — the decision framework

Use this to *produce* the "Considered Options / Decision Outcome" content above for any real fork (which datastore, queue vs stream, monolith vs services, which cloud service). It generalizes the "research the option space, then decide with evidence" method.

### Step 1 — Frame the decision and its drivers
State the decision as a question, then list the **decision drivers** — the 3–6 criteria that will actually decide it, drawn from your quantified requirements (`checklists/design-review.md` §0): latency SLO, throughput, consistency needs, cost/unit, team skill, operational burden, reversibility, compliance. Weight them if some dominate.

### Step 2 — Name 3–5 real candidates (and find precedent)
Enumerate the genuine options — including "do the boring/default thing" and "do nothing." For each, find **how a real system at your scale actually used it** (`references/09-case-studies.md`, awesome-scalability, the Builders' Library). Precedent is evidence; "big companies use X" is not.

### Step 3 — Build an option-space matrix
Rows = candidates, columns = your decision drivers (from Step 1). Fill each cell from evidence, and tag each candidate's overall **evidence depth**:

| Depth | Meaning |
|---|---|
| **thick** | Multiple primary sources / real production reports at your scale |
| **medium** | Docs + one credible case or benchmark |
| **thin** | Vendor claims / blog assertions only — treat as unverified |

### Step 4 — For each candidate, write the reading aid
Don't just score — say when it fits:
- **What the evidence shows** / **what it doesn't** (the gaps).
- **Pick when…** — the conditions under which this is the right call.
- **Avoid when…** — the conditions under which it isn't.
- **Citation(s)** — the primary source(s) backing the above (cite-or-die, §3).

### Step 5 — Adversarial probe
For your leading candidate, **try to refute it**: steelman the strongest objection, name the failure mode that would make you regret it, and check whether a case study shows it breaking at scale. A choice that survives an honest attack is defensible; one that hasn't been attacked is just a preference.

### Step 6 — Record cross-cutting tradeoffs, open questions, and the outcome
- **Cross-cutting tradeoffs:** the axes where every option is a compromise (e.g. consistency vs availability — `references/03-scaling-ladder.md`).
- **Open questions:** what the evidence could not resolve (and what would resolve it — a spike, a load test, a cost model).
- **Decision outcome:** the pick + the driver(s) it wins on, written straight into the ADR's Decision/Consequences.

---

## 3. The cite-or-die rule (evidence discipline)

Every non-obvious claim in a design doc, ADR, or option matrix **must cite a real source** — a primary doc/RFC/paper, a named engineering-blog post, or a concrete `file:line` in the codebase. A claim with no citation, or one backed by an invented path/URL, gets **dropped, not shipped**. This is what separates a defensible architecture decision from confident-sounding fabrication, and it's the discipline behind every reference in this skill.

Practical form:
- Prefer the **primary source** over a summary (the RFC, not a blog about the RFC).
- Tag confidence honestly (evidence depth thick/medium/thin, §3 above).
- If you can't cite it, mark it an **assumption** or an **open question** — never state it as fact.

---

## 4. Apply it — decision checklist

- [ ] Is this decision worth an ADR? (expensive to reverse / cross-team / "why did we…?"). If yes, create `docs/adr/NN-title.md`.
- [ ] **Context** written as neutral facts + numbers, with citations.
- [ ] **Decision drivers** named (the 3–6 criteria that decide it), weighted if needed.
- [ ] **3–5 real candidates** listed, including the boring default and a real-system precedent for each.
- [ ] **Option-space matrix** filled from evidence; each candidate tagged thick/medium/thin.
- [ ] Each candidate has **pick-when / avoid-when** + citations.
- [ ] Leading candidate survived an **adversarial probe** (named failure mode, checked against a case study).
- [ ] **Cross-cutting tradeoffs** and **open questions** recorded.
- [ ] **Decision + Consequences** stated plainly (what got harder, not just easier); status set.
- [ ] Every claim **cites a real source**; uncited claims demoted to assumptions/open questions.

> Related: `checklists/design-review.md` (whole-design gate), `references/09-case-studies.md` (precedent), `references/05-cost-modeling.md` / `references/02-security.md` (drivers that often decide the call).
