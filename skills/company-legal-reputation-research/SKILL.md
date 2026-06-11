# Company Legal & Reputation Research

## Overview

Step-by-step workflow for researching any company's legal exposure, court records, liens, regulatory actions, sanctions, and public reputation signals using only free public sources. No API keys required. Produces a structured risk summary table with confidence levels and a list of manual checks still needed.

Use this skill when you need to:
- Vet a potential vendor, partner, or acquisition target
- Check a company before signing a contract
- Research a competitor's legal history
- Perform pre-investment due diligence on a small/mid-size private company
- Confirm a company has no outstanding debarment, exclusions, or sanctions

## Prerequisites

No installations required. Uses web search and URL reading tools only.

Required tools (any of the following work):
- `web_search` — for broad public record queries
- `read_url` / `fetch_url` — for reading public court and sanctions portals

## Quick Start

```
Research the legal and reputation history of [COMPANY NAME], based in [STATE].
Use the company-legal-reputation-research skill.
```

The agent will run all 7 steps and return a risk summary table plus a list of manual portal checks.

## API Reference — The 7 Steps

### Step 1 — Entity Identity Confirmation
Confirm legal name, state of incorporation, and any prior names (critical — companies rename).

```
web_search: "[COMPANY]" site:sos.[state].gov OR registered agent OR articles of organization
web_search: "[COMPANY]" formerly known as OR previously named OR name change
```

### Step 2 — Federal Court Records (automated)
Check all free federal court indexes.

```
web_search: "[COMPANY]" site:courtlistener.com
web_search: "[COMPANY]" site:pacermonitor.com
web_search: "[COMPANY]" federal lawsuit OR bankruptcy OR chapter 11 OR PACER
web_search: "[COMPANY]" site:justia.com
web_search: "[COMPANY]" site:unicourt.com
```

### Step 3 — State Court Records
Automated web search, plus manual portal check for the company's home state.

```
web_search: "[COMPANY]" "[STATE]" district court lawsuit judgment lien civil
web_search: "[COMPANY]" site:unicourt.com "[STATE]"
```

Manual check (required — state portals block automation):
- Minnesota: https://publicaccess.courts.state.mn.us/CaseSearch
- All states: search unicourt.com by party name for state court records

### Step 4 — Liens and UCC Filings
```
web_search: "[COMPANY]" UCC lien filing OR tax lien OR judgment lien "[STATE]"
web_search: "[COMPANY]" IRS lien OR federal tax lien
```

Manual check: State Secretary of State UCC/lien portal (search debtor name).

### Step 5 — Regulatory, Licensing, and Labor Actions
```
web_search: "[COMPANY]" regulatory action OR license suspension OR cease and desist OR fine OR penalty
web_search: "[COMPANY]" OSHA violation OR labor violation OR wage claim OR EEOC
web_search: "[COMPANY]" contractor license violation OR unlicensed
web_search: "[COMPANY]" BBB complaint OR BBB rating
```

### Step 6 — Sanctions and Debarment
```
fetch_url: https://www.opensanctions.org/search/?q=[COMPANY]&dataset=us_sam_exclusions
web_search: "[COMPANY]" OFAC sanctions OR debarment OR excluded parties OR SAM.gov excluded
```

OpenSanctions mirrors SAM.gov exclusions and is bot-accessible. Zero results = not excluded.

### Step 7 — Reputation Signals
```
web_search: "[COMPANY]" review OR complaint OR fraud OR scam OR controversy, last 2 years
web_search: "[COMPANY]" glassdoor OR indeed review OR employee complaint
web_search: site:reddit.com "[COMPANY]"
web_search: "[COMPANY]" negative news -press release -linkedin
```

## Common Patterns

### Risk Summary Table (always output this)

| Risk Category | Level | Evidence | Source |
|---|---|---|---|
| Federal court / PACER | Low / Medium / High | Finding or "None found" | URL or "Manual check needed" |
| State court (civil) | Low / Medium / High | Finding or "None found" | URL or "Manual check needed" |
| UCC / Liens | Low / Medium / High | Finding or "None found" | URL or "Manual check needed" |
| Regulatory / Licensing | Low / Medium / High | Finding or "None found" | URL |
| SAM.gov debarment | Low / Medium / High | Finding or "None found" | URL |
| BBB / Consumer complaints | Low / Medium / High | Finding or "None found" | URL |
| Reputation / Media | Low / Medium / High | Finding or "None found" | URL |

Then produce:
- **Red flags** — any confirmed adverse findings
- **Manual checks still needed** — portals that block automation
- **Overall risk rating**: Low / Moderate / High + one-line rationale

### Prior Name Check (critical for small companies)
Small businesses frequently rename. Always search both the current name and any prior legal names. Example: "BROGAV Solutions LLC" was previously "Hope-filled Hearts LLC" — court records from 2021-2022 would appear under the old name.

```
web_search: "[PRIOR NAME]" lawsuit OR court OR judgment OR lien
```

## Pitfalls

- **State court portals block bots** — MCRO (MN), most state trial court systems. Flag these as "manual check needed" and provide the direct URL; do not skip them.
- **BBB and Glassdoor block automated access** — return Forbidden. Note that the profile exists (or doesn't) and provide the URL for manual review.
- **SAM.gov search UI returns CSS/HTML** — use OpenSanctions instead: `opensanctions.org/search/?q=[COMPANY]&dataset=us_sam_exclusions`. Zero results = not excluded.
- **Published federal opinions ≠ all federal cases** — CourtListener/Justia only index published opinions. An unpublished or pending case won't appear. PACER (login required) is the only complete source.
- **Absence of hits ≠ clean record** — always report what was searched and what couldn't be automated. Never say "no litigation found" without qualifying with the sources actually checked.

## Combining With Other Skills

- **Conversation Review** (`skills/conversation-review/`) — after running this skill, use conversation-review to QA the output for completeness and citation accuracy before sharing with a client.
- **Doc Co-Authoring** (`skills/white-paper-writing/anthropic-doc-coauthoring/`) — wrap this skill's output into a formal due diligence memo using the doc co-authoring workflow.
- **Content Research Writer** (`skills/white-paper-writing/composio-content-research-writer/`) — combine with this skill for a full company profile (market position + legal/reputation).
