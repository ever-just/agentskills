# System Design & Architecture — Agent Skill

A reference-backed toolkit that lets an AI agent (or a human) **design and review
production-grade software systems end to end** — networking through the full
backend stack: scalability, security, capacity/limits, cost, architecture style,
the layers a product needs, cloud services, real-system precedent, open standards,
and how to record the decisions.

It is built as an **[Agent Skill](https://code.claude.com/docs/en/skills)** using
*progressive disclosure*: a lean [`SKILL.md`](SKILL.md) holds the design method and
heuristics, and the heavy, link-verified material lives in `references/` and loads
only when a sub-problem calls for it — so ~3,100 lines and **800+ verified
primary-source links** cost almost no context until you actually open a file.

> **Three entry points, three audiences.** [`SKILL.md`](SKILL.md) is what the
> *agent* loads (method + navigation). [`references/INDEX.md`](references/INDEX.md)
> is the *agent's* on-demand map ("load the file that matches the sub-problem").
> **This README is the *human* outline** — orientation for anyone browsing the
> repo. They intentionally don't duplicate each other.

---

## What's here

```
system-design-architecture/
├── SKILL.md                       # Agent entrypoint: the 10-step design method + core heuristics + navigation
├── README.md                      # This file — human orientation
├── references/
│   ├── INDEX.md                   # The agent's on-demand map (load-when-you-need-X)
│   ├── 01-core-sources.md         # Learning corpus: curricula, books, courses, papers, people to follow
│   ├── 02-security.md             # Secure-by-design: threat modeling, OWASP, zero-trust, secrets, supply chain, compliance
│   ├── 03-scaling-ladder.md       # Low→high volume: rung-by-rung evolution, each move's trigger and cost
│   ├── 04-capacity-limits.md      # Determining limits: estimation, Little's Law, USE/RED, load testing, SLO thresholds
│   ├── 05-cost-modeling.md        # Projecting cost: unit economics, FinOps, egress traps, cost-per-tenant projection
│   ├── 06-architecture-archetypes.md  # Monolith → microservices → event-driven → serverless → multi-tenant SaaS → multi-agent/LLM → data/real-time/edge
│   ├── 07-product-layers.md       # The full stack: client → edge → gateway → services → async → data → cache → search → observability → infra
│   ├── 08-cloud-providers.md      # AWS/GCP/Azure/Cloudflare capability→service maps with docs links
│   ├── 09-case-studies.md         # 35+ real systems (Netflix, Uber, Discord, Stripe, Figma, Notion…) with primary sources
│   ├── 10-open-standards.md       # OpenAPI/AsyncAPI/gRPC/GraphQL/OAuth/OTel/RFCs/… conformance catalog
│   └── 11-decision-records.md     # ADR templates + option-selection framework + cite-or-die + full ADR resource catalog
├── checklists/
│   ├── design-review.md           # The gate before committing to a design (six Well-Architected pillars + fit)
│   ├── production-readiness.md    # The gate before a service takes real traffic (SRE launch gate)
│   └── security-review.md         # Ship-blocking security gate (OWASP-anchored)
└── examples/
    └── worked-design-doc.md       # The whole method applied end-to-end to a multi-tenant notification service
```

For the "which file do I open for problem X?" mapping, see
[`references/INDEX.md`](references/INDEX.md).

---

## How to use it

**As an agent skill.** Drop the folder into a skills directory (`.claude/skills/`,
a plugin's `skills/`, or `~/.claude/skills/`). The agent loads `SKILL.md`
automatically when a task is about designing, scaling, securing, costing, or
choosing an architecture for a software system, then pulls the matching reference
on demand. It works across Claude Code, Codex, Cursor, and other Agent-Skills-
compatible tools.

**As a human reading list.** Start with the **design method** and **core
heuristics** in [`SKILL.md`](SKILL.md), then use
[`references/INDEX.md`](references/INDEX.md) to jump to the topic you need. Each
reference file is a self-contained, sourced briefing; each checklist is a gate you
can run a real design through; [`examples/worked-design-doc.md`](examples/worked-design-doc.md)
shows the whole thing applied to one system.

---

## Sources & verification discipline

This skill's value is that **every claim is traceable to a primary source**. The
rules it holds itself to (and teaches — see `references/11` §3):

- **Primary sources only.** Links point to the canonical source — the RFC/spec, the
  paper's PDF, the author's site, the official docs, or the company's own
  engineering post — not a blog summary of it.
- **Cite-or-die.** Every non-obvious claim carries a link. A claim that can't be
  backed by a real source is dropped or demoted to an assumption/open question —
  never shipped as fact. All 800+ links were verified to resolve at authoring time.
- **Honest confidence.** Where evidence is thin (vendor claims, drafts, paywalled
  standards), the text says so.

**Refreshing / extending sources.** Links rot and services rename. To re-verify or
add sources, use the sibling **[`github-search`](../github-search/)** skill (the
GitHub-docs-grounded search playbook this corpus was built with) plus web search,
and keep the same cite-or-die bar. A fast way to find fresh real-world ADR examples,
for instance, is the GitHub code search `filename:0001-record-architecture-decisions.md`.

---

## Two layers of guidelines (don't confuse them)

1. **Design guidelines** — *how to design a system well.* These are the content:
   the method in `SKILL.md`, the heuristics, and every reference/checklist.
2. **Authoring guidelines** — *how this skill is written and maintained.* Lean
   `SKILL.md` (<500 lines), progressive disclosure, primary-source + cite-or-die,
   one-level-deep references. Follow these when editing so the skill stays
   token-efficient and trustworthy.

---

## Research provenance

This skill is the productized form of a documented research effort. The research
plans and findings live in the private `ever-just/ww.everjust.app` repo:

- `docs/SYSTEM_DESIGN_ARCHITECTURE_RESEARCH.md` — the eight-track research plan +
  findings that seeded the reference library.
- `docs/ML_SYSTEM_DESIGN_AGENT_RESEARCH.md` — the ML-specific variant (templates +
  corpora for ML system design docs).

Prior-art scan: the closest comparable projects on GitHub are
[beevibe-ai/beevibe-cto](https://github.com/beevibe-ai/beevibe-cto) (live
architecture-decision research + enforcement), [rogue-socket/system-design-tutor](https://github.com/rogue-socket/system-design-tutor)
(a course grounded in the same canon), and [iamurali/system-design-skill](https://github.com/iamurali/system-design-skill)
(interview-prep artifact generator). None is a direct twin — this skill is a
*curated, primary-source reference corpus + decision frameworks* for real design
work, which the ADR/decision-records material (`references/11`) borrows from
beevibe's method.

---

## Related skills

- **[`github-search`](../github-search/)** — the discovery/verification playbook used to build and refresh this corpus.
- **[`everjust-platform`](../everjust-platform/)** — platform-specific invariants when designing *for* everjust.app.
