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

> More templates, tooling, official guidance, academic sources, and real-world example corpuses: **§6 Resource catalog** below.

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

---

## 5. ADR vs design doc vs RFC — pick the right artifact

Three overlapping practices capture decisions at different granularities. Don't conflate them:

- **ADR** — captures *one* decision. Small, immutable once accepted, never edited but *superseded* by a later ADR; records what was decided and why, usually after the fact.
- **Design doc** — describes a *whole* system or feature: the problem, proposed design, alternatives, trade-offs. A living document reviewed before/during building; it may spawn several ADRs. (See `examples/worked-design-doc.md`.)
- **RFC / RFD** — a *proposal seeking discussion and consensus*. It front-loads debate to reach a decision; the process (open comment period, states) matters as much as the artifact.

Rule of thumb: reach for an **ADR to record** a settled choice, a **design doc to work out** a feature's design, and an **RFC to socialize and ratify** a change across a group.

| Source | What it is | Use it for |
|---|---|---|
| [Design Docs at Google — Malte Ubl](https://www.industrialempathy.com/posts/design-docs-at-google/) · [template](https://www.industrialempathy.com/posts/design-doc-a-design-doc/) | The canonical writeup of Google's design-doc culture + a ready-to-fill skeleton | The design-doc end: whole-feature design + rationale before building |
| [Oxide RFD — Requests for Discussion](https://oxide.computer/blog/rfd-1-requests-for-discussion) · [RFD 0001](https://rfd.shared.oxide.computer/rfd/0001) | Numbered docs with states (prediscussion → discussion → published → committed), branch/PR-driven | A company-wide, durable proposal + decision process spanning technical and org topics |
| [rust-lang/rfcs](https://github.com/rust-lang/rfcs) · [Rust RFC process](https://rust-lang.github.io/rfcs/) | Fork, copy template, open PR, build consensus, team accepts/rejects | Consensus-driven, PR-based RFCs for "substantial" changes |
| [ThoughtWorks Radar — Lightweight RFCs](https://www.thoughtworks.com/radar/techniques/lightweight-approach-to-rfcs) · [IETF RFC 7322](https://www.rfc-editor.org/info/rfc7322/) | Running RFCs as a lightweight in-repo practice; the original RFC lineage | Contrast with ADRs when choosing a team practice |

---

## 6. Resource catalog — templates, tooling, guidance, examples

The §1 table lists the four essentials; this is the full map. All links verified.

### 6.1 Origin & canon
| Source | What it is |
|---|---|
| [Documenting Architecture Decisions — Michael Nygard (2011)](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) | The founding essay; introduces the ADR concept + minimal format. Read first. |
| [ThoughtWorks Radar — Lightweight ADRs ("Adopt")](https://www.thoughtworks.com/en-us/radar/techniques/lightweight-architecture-decision-records) | Industry "Adopt" endorsement; cite when justifying the practice to stakeholders. |
| [adr.github.io](https://adr.github.io/) | The community hub: definitions, template index, tooling catalog. |
| [joelparkerhenderson/architecture-decision-record](https://github.com/joelparkerhenderson/architecture-decision-record) (~16k★) | The most comprehensive open collection of ADR templates + examples. |

### 6.2 Template variants (pick by weight)
| Template | Shape | Use when |
|---|---|---|
| [Nygard](https://github.com/joelparkerhenderson/architecture-decision-record/blob/main/locales/en/templates/decision-record-template-by-michael-nygard/index.md) | Title/Status/Context/Decision/Consequences | Default; smallest useful record. |
| [MADR](https://adr.github.io/madr/) ([repo](https://github.com/adr/madr), ~2.3k★) | Decision drivers + considered options + pros/cons + outcome | Richer, comparable option analysis, markdown-native. **v3.x** merges consequences; **v4.0** adds minimal/bare variants. |
| [MADR Template Primer — Zimmermann](https://ozimmer.ch/practices/2022/11/22/MADRTemplatePrimer.html) | Field-by-field guidance | When adopting MADR and want help filling each field. |
| [Y-Statements — Zimmermann](https://medium.com/olzzio/y-statements-10eb07b5a177) | One sentence: *In context of X, facing Y, we decided Z, neglecting alternatives, to achieve W, accepting V.* | Leanest possible capture; whiteboards, agile teams. |
| [Tyree & Akerman](https://github.com/joelparkerhenderson/architecture-decision-record/blob/main/locales/en/templates/decision-record-template-by-jeff-tyree-and-art-akerman/index.md) | Heavyweight: Issue/Assumptions/Constraints/Positions/Argument/Implications | High-stakes enterprise decisions needing full traceability. |
| [arc42 §9 Architecture Decisions](https://docs.arc42.org/section-9/) ([Tip 9-5](https://docs.arc42.org/tips/9-5/), [Tip 9-9](https://docs.arc42.org/tips/9-9/), [example](https://docs.arc42.org/examples/decision-use-adrs/)) | ADRs slotted into a full architecture-doc template | When your docs already use arc42. |
| [Business-case decision record](https://github.com/joelparkerhenderson/architecture-decision-record/blob/main/locales/en/templates/decision-record-template-for-business-case/index.md) · [Any Decision Records — Zimmermann](https://ozimmer.ch/practices/2021/04/23/AnyDecisionRecords.html) | Criteria/candidates/costs for non-technical decisions | Organizational/product rather than purely technical choices. |

### 6.3 Academic / standards
| Source | Why it matters |
|---|---|
| [Tyree & Akerman, "Architecture Decisions: Demystifying Architecture" (IEEE Software 2005) — PDF](https://personal.utdallas.edu/~chung/SA/zz-Impreso-architecture_decisions-tyree-05.pdf) · [ACM/DOI](https://dl.acm.org/doi/10.1109/MS.2005.27) | The foundational paper; decisions as first-class artifacts + the rigorous template. |
| [Zimmermann — "Architectural Decisions: The Making Of"](https://ozimmer.ch/practices/2020/04/27/ArchitectureDecisionMaking.html) | Synthesis of the decision *process*, not just format. |
| [Zimmermann — "Sustainable Architectural Design Decisions" (InfoQ)](https://www.infoq.com/articles/sustainable-architectural-design-decisions/) | Criteria for decisions that endure through evolution. |
| [Zimmermann — "AD Guidance across Projects" (WICSA 2015, PDF)](https://www.ost.ch/fileadmin/dateiliste/3_forschung_dienstleistung/institute/ifs/cloud-application-lab/zio-admentor-wicsapresentationps2v10p.pdf) · [IFS-HSR/ADMentor](https://github.com/IFS-HSR/ADMentor) | Reusing decision knowledge across projects. |
| [ISO/IEC/IEEE 42010:2022 — Architecture description](https://www.iso.org/standard/50508.html) ([conceptual model](http://www.iso-architecture.org/42010/cm/)) | The standard treating decisions + rationale as first-class. |
| [SEI — Documenting Software Architectures: Views and Beyond (2nd ed.)](https://www.sei.cmu.edu/library/documenting-software-architectures-views-and-beyond-second-edition/) | Where decision/rationale docs fit in full architecture documentation. |

### 6.4 Tooling
| Tool | What it is | For |
|---|---|---|
| [ADR Tools Directory](https://adr.github.io/adr-tooling/) · [ADR Templates](https://adr.github.io/adr-templates/) | Maintained ecosystem index grouped by template; rewrites in C#/Go/Java/Node/PHP/PowerShell/Python/Rust | The "which tool do I pick" page. |
| [npryce/adr-tools](https://github.com/npryce/adr-tools) (~5.5k★) | The original Bash CLI (`adr new/link/generate`), Nygard format | De-facto reference; zero-dependency shell workflow (now lightly maintained). |
| [endjin/dotnet-adr](https://github.com/endjin/dotnet-adr) · [opinionated-digital-center/pyadr](https://github.com/opinionated-digital-center/pyadr) · [joshrotenberg/adrs](https://github.com/joshrotenberg/adrs) (Rust) · [adoble/adr-j](https://github.com/adoble/adr-j) (Java) · [marouni/adr](https://github.com/marouni/adr) (Go) | Language-native CLIs; pyadr adds lifecycle/status transitions + git | Match your stack; pyadr when you want enforced propose→accept→supersede. |
| [thomvaill/log4brains](https://github.com/thomvaill/log4brains) (~1.5k★) | ADR manager + static-site generator ([demo](https://thomvaill.github.io/log4brains/adr/)) | Author in-IDE *and* auto-publish a searchable web knowledge base via CI. |
| [adr/adr-manager](https://github.com/adr/adr-manager) ([app](https://adr.github.io/adr-manager/)) · [vscode-adr-manager](https://github.com/adr/vscode-adr-manager) | Form-driven MADR editor (web + VS Code) | Non-CLI authoring; keep it inside the editor. |
| [mrwilson/adr-viewer](https://github.com/mrwilson/adr-viewer) · [adr/adr-log](https://github.com/adr/adr-log) | Render a folder to HTML; auto-generate a decision-log TOC | Quick static view / repo index of an ADR set. |
| [Structurizr](https://www.structurizr.com/) · [docToolchain](https://doctoolchain.github.io/docToolchain/) · [Backstage ADR plugin](https://github.com/backstage/community-plugins) | ADRs alongside C4 diagrams / arc42 docs / dev-portal catalog | When ADRs should live next to diagrams or in a developer portal. |

### 6.5 Official / big-org guidance
| Source | What it is |
|---|---|
| [AWS Prescriptive Guidance — ADR process](https://docs.aws.amazon.com/prescriptive-guidance/latest/architectural-decision-records/adr-process.html) ([best practices](https://docs.aws.amazon.com/prescriptive-guidance/latest/architectural-decision-records/best-practices.html), [example](https://docs.aws.amazon.com/prescriptive-guidance/latest/architectural-decision-records/appendix.html)) | The most complete vendor treatment of ADR states/lifecycle + decision log. |
| [AWS Architecture Blog — Master ADRs](https://aws.amazon.com/blogs/architecture/master-architecture-decision-records-adrs-best-practices-for-effective-decision-making/) | Shorter, opinionated best-practices read. |
| [Microsoft — Maintain an ADR (Azure Well-Architected)](https://learn.microsoft.com/en-us/azure/well-architected/architect-role/architecture-decision-record) | Append-only log, confidence levels, Proposed/Accepted/Superseded. |
| [Spotify — "When Should I Write an ADR?"](https://engineering.atspotify.com/2020/04/when-should-i-write-an-architecture-decision-record) | The widely cited "almost always" adoption argument. |
| [GOV.UK — ADR Framework](https://www.gov.uk/government/publications/architectural-decision-record-framework/architectural-decision-record-framework) · [GDS Way](https://gds-way.digital.cabinet-office.gov.uk/standards/architecture-decisions.html) · [MoJ Tech Radar](https://tech-radar.justice.gov.uk/methods-and-patterns/adr-architecture-decision-records/) | Government/enterprise-scale ADR governance (team → programme → cross-gov). |

### 6.6 Real-world example corpuses (read these as worked examples)
| Corpus | Why |
|---|---|
| [joelparkerhenderson/architecture-decision-record](https://github.com/joelparkerhenderson/architecture-decision-record) | Every template + example prose; most-starred ADR resource. |
| [Backstage ADRs](https://backstage.io/docs/architecture-decisions/) · [home-assistant/architecture](https://github.com/home-assistant/architecture) · [arachne-framework/architecture](https://github.com/arachne-framework/architecture) | Real, living ADR logs from major OSS projects. |
| [cloudfoundry/cloud_controller_ng `decisions/`](https://github.com/cloudfoundry/cloud_controller_ng/blob/main/decisions/0001-record-architecture-decisions.md) · [usnistgov/OSCAL `decisions/`](https://github.com/usnistgov/OSCAL/blob/main/decisions/0001-record-architecture-decisions.md) | Enterprise/standards-body corpuses colocated with code. |
| [alphagov/govuk_publishing_components `docs/adr/`](https://github.com/alphagov/govuk_publishing_components/blob/main/docs/adr/0001-record-architecture-decisions.md) · [department-of-veterans-affairs/va.gov-team](https://github.com/department-of-veterans-affairs/va.gov-team) | Production public-sector corpuses matching the GDS/gov standards. |
| [AWS worked example ADR](https://docs.aws.amazon.com/prescriptive-guidance/latest/architectural-decision-records/appendix.html) | A clean, authoritative single-record example to model against. |

> **Discovery tip:** GitHub code search for `filename:0001-record-architecture-decisions.md` surfaces 2,300+ real public ADR sets on demand — the reusable way (per the `github-search` skill) to find fresh examples.
