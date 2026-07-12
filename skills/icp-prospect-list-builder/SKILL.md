---
name: icp-prospect-list-builder
description: End-to-end methodology for building a large, source-cited B2B prospect dataset from public data — define an ICP in searchable terms, discover matching companies across ranked sources (source-code/technographic search, competitor customer bases, software + AI-tool directories, the Product Hunt API, accelerator portfolios), then categorize, ICP-score, dedupe, and pull size-routed decision-maker contacts. Use when asked to find "companies like our customers", build a GTM/sales target list, enumerate a market segment, score prospects for fit, or turn a raw company list into a prioritized, contactable pipeline. Public sources only.
---

# ICP Prospect List Builder

## Overview

How to build a **prioritized, source-cited prospect dataset** — hundreds of
companies with decision-maker contacts — entirely from public data. The output is
two cross-linked tables (companies + contacts) where every company is categorized,
scored for ideal-customer-profile (ICP) fit, and every claim is attributed and
confidence-tagged.

Use this skill when you need to:
- Find "companies like our existing customers" and turn them into a ranked target list
- Enumerate a market segment (e.g. "all website/app builders") across many sources
- Score a raw company list for fit against a specific product's ICP
- Attach the right contacts to each company (execs for small cos, functional leaders for large)
- Produce a CRM-importable dataset, not a one-off report

Developed and validated July 2026 building a **621-company / 900+-contact** GTM
dataset for a custom-domain-onboarding product (Connect Domain, an Entri
alternative), spanning disclosed-customer research, 10 accelerator portfolios + Y
Combinator, a Minnesota regional ecosystem, and a Product Hunt API sweep — run with
the **`parallel-agent-fanout`** skill.

> **Ethics (non-negotiable):** public sources only; professional/business contacts
> in their professional capacity only (no personal/home data); never fabricate — a
> blank field beats a guess; every row carries a `source_url` + `confidence`.

---

## Step 1 — Define the ICP in *searchable* terms

A fit definition you can't query is useless. Convert the ICP into (a) a one-sentence
buyer description, (b) priority **sub-segments**, and (c) a **keyword lexicon** that
appears on a matching company's site.

Worked example (custom-domain onboarding product):

- **Buyer:** multi-tenant SaaS platforms whose end-users connect their own custom
  domain during onboarding ("bring-your-own-domain").
- **Sub-segments:** website/site builders · AI website/app builders · e-commerce
  builders · newsletter/email + deliverability · link-in-bio/landing/funnel ·
  publishing/CMS · course/community/membership · forms/booking/portfolio ·
  white-label/agency/PaaS.
- **Lexicon (recognize fit on-page):** `custom domain`, `connect your domain`,
  `bring your own domain`, `add a custom domain`, `custom sending domain`,
  `white-label domain`, `vanity domain`, `map your domain`, `SSL for SaaS`.
- **Anti-signals (exclude):** hardware, robotics, biotech, deep tech, pure data/AI
  infra, consumer mobile apps, logistics, single-tenant internal tools.

The lexicon is what every downstream search and every ICP-fit judgment keys on.

---

## Step 2 — Discover companies (sources ranked by signal)

Sweep sources in roughly this order; higher tiers give cleaner ICP density.

### Tier 1 — highest signal
- **Source-code / technographic search** — the single best move. Search page HTML
  for a competitor's embed string to get their *live customer list*: `PublicWWW`
  (`publicwww.com`), `NerdyData`, `BuiltWith` relationships. E.g. searching for a
  rival's widget script returns every platform that embeds it — literally your ICP.
  *(These bulk-index tools are usually paywalled; a paid seat is the highest-ROI data buy. Log the cap when gated.)*
- **Competitor customer bases** — scrape case studies / logo walls / testimonials
  from adjacent vendors. Their customers *are* your ICP. Also mine any relevant
  open adopter list (protocol adopter pages, "customers of X" pages).

### Tier 2 — high volume, well-categorized
- **Software directories** — G2, Capterra, GetApp, TrustRadius. Category pages map
  1:1 to sub-segments; pull the *vendor* list, not reviewers. (G2 often 403s bots;
  fall back to category listicles / search snippets.)
- **Product Hunt (API)** — best for newly launched tools. Use the GraphQL API, not
  scraping. See `scripts/producthunt_pull.py`. Query the **root `posts(topic:)`**
  field (the `Topic` type has no `posts` connection), order by `VOTES`, drop nested
  `topics` from the node (it inflates query complexity). Rate limit ~6250 complexity
  / 15 min — self-throttle on the `x-rate-limit-remaining` header. Note: the `website`
  field is a tracked `producthunt.com/r/...` redirect that 403s to bots, so resolve
  real domains later (during the contact pull) rather than from the API.
- **AI-tool directories** — There's An AI For That, Futurepedia, Toolify. Best for
  the AI-builder wave the other sources lag on.

### Tier 3 — supplementary
- Crunchbase industry filters · AlternativeTo (enter a known ICP tool → get its
  cluster) · app marketplaces / partner directories · Indie Hackers / BetaList /
  "Show HN" · GitHub awesome-lists.
- **Accelerator portfolios** — filter each portfolio to ICP only. Reality check:
  ICP density is *low* in most accelerators (they fund biotech/hardware/fintech);
  a broad-thesis program (e.g. Y Combinator) is the exception. Filtering the full
  portfolio beats sampling it — but directories are often JS/Crunchbase-gated, so
  log coverage honestly.

---

## Step 3 — The data model (two grains, cross-linked)

Maximum utility comes from two tables joined by a stable `company_id`:

**`companies.csv`** — one row per organization:
```
company_id, dataset, segment, organization, domain, description, category,
tags, icp_fit, icp_rationale, size_or_stage, location, num_contacts,
source_url, confidence
```

**`contacts.csv`** — one row per person (carries `company_id` + joined
`category`/`icp_fit` so people are filterable by company attributes):
```
company_id, dataset, segment, organization, contact_name, title,
linkedin_url, email, email_status, source_url, confidence
```

`dataset` = the source pass (e.g. `entri-customers`, `accelerator-icp`,
`producthunt-icp`) so pipeline slices stay separable. `email_status` ∈
`public | inferred-pattern | none`.

---

## Step 4 — Categorize + ICP-score

Assign every company **exactly one** `category` from a *controlled vocabulary*
(normalize messy free-text sectors into it) plus free multi-value `tags`. Rule:
pick the real vertical, not a surface trait — an AI drug-discovery startup is
`Healthcare & Life Sciences`, not `AI/ML`.

Then the prioritization layer — **`icp_fit`** (High / Medium / Low / n-a) + a
one-line `icp_rationale`:
- **High** — the product clearly exhibits the ICP behavior (e.g. end-users attach
  their own domain). Existing customers of a direct competitor = High.
- **Medium** — plausibly could, but doesn't obviously center on it.
- **Low** — no ICP surface.
- **n-a** — not a buyer (investors/accelerators; relevant as channel only).

A deterministic keyword pass gives a fast backbone; a review pass (human or agent)
corrects it and writes the rationale. This is what converts a directory into a
*ranked* target list.

---

## Step 5 — Dedupe

- Prefer **domain** as the dedup key (normalize: strip scheme, `www.`, path,
  query). Fall back to a normalized company **name** when no domain (e.g. Product
  Hunt launches) — strip version/suffix tokens (`2.0`, `v3`, `by <maker>`, trailing
  `AI`/`App`) so relaunches don't read as net-new.
- Always dedupe **against the existing master** before adding a new pass; tag each
  candidate `net-new` vs `already-in-dataset`. Report the split — it is the honest
  signal of how much a source actually added.

---

## Step 6 — Pull contacts (routed by company size)

- **Small (<50):** the executive team — founders / CEO / CTO / C-suite.
- **Mid / large:** the **operations, financial, product, and technical** leaders
  (CPO/VP Product, CTO/VP Eng, COO/VP Ops, CFO) — and for very large orgs, only the
  leaders of the *relevant* org (e.g. the websites/domains product line), not the
  global CEO.
- Per contact: name, title, `linkedin_url` (only if confidently the right person),
  `email` (public if published; a clear corporate pattern may be filled and marked
  `inferred-pattern`; else blank), `source_url`, `confidence`.
- **Do not pad.** A tiny tool with one public founder gets one row.

> **Email reality:** verified public emails are rare (often <2% for small/indie
> tools). True deliverability verification needs SMTP tooling + clean IPs. So mark
> inferred patterns honestly and tell the user to validate before outreach —
> LinkedIn + a named founder is usually the reliable channel.

---

## Step 7 — Synthesize

- A normalized **master CSV** per grain (single import).
- A short **README/index** with headline counts, per-dataset breakdown, method, and
  the caveats above.
- Optional: a self-contained, filterable **HTML dashboard** (search + category +
  `icp_fit` filters + distribution bars) — see the `dataviz`/`artifact-design`
  guidance if available.
- A **Tier-1 shortlist**: `icp_fit = High` + has a named decision-maker + LinkedIn,
  sorted by fit strength → the ready-to-work outreach list.

`scripts/rollup.py` normalizes many per-source CSVs (different schemas) into the two
master grains and prints integrity stats.

---

## Pitfalls

| Pitfall | Fix |
|---|---|
| "AI" keyword over-matches every company | Categorize by the real vertical, not surface tech |
| Product Hunt `website` field is a redirect (403s to bots) | Resolve real domains during the contact pull, dedupe by name meanwhile |
| Name-based dedup misses relaunches ("Framer 3.0") | Strip version/`by`/suffix tokens before comparing |
| Accelerator/directory portfolios are JS/paywall-gated | Log coverage honestly; note a paid Crunchbase/PublicWWW seat as the unlock |
| Treating a big candidate count as "prospects" | Item-level ICP density is often low — score fit, don't equate volume with value |
| Inflating `icp_fit` from a topic label | Confirm the BYO/ICP surface on the company's own site before scoring High |
| Fabricated emails to look complete | Never mark inferred as public; blank beats a guess |

---

## Combining with other skills

- **`parallel-agent-fanout`** — run every discovery + contact-pull wave concurrently; this skill is the *what*, that skill is the *how at scale*.
- **`deep-research`** — deeper multi-source verification of a specific high-value target.
- **`company-legal-reputation-research`** — vet a shortlisted prospect before outreach.
- **`domain-email-enumeration`** — upgrade `inferred-pattern` emails toward verified for the Tier-1 shortlist.
- **`competitor-identification`** — seed Tier-1 source-code search with the right competitor embed strings.
- **`intelligence-dossier`** — promote a top prospect into a full standing dossier.
- **`linkedin-activity-intelligence`** / **`era-validated-linkedin-analysis`** — enrich the decision-maker contacts.
