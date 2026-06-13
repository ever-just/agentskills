# Verification Audit

> Systematically cross-verify every major finding in an intelligence dossier against independent sources. Downgrades confidence, retracts unverifiable claims, and documents source reliability. Ensures the dossier is trustworthy enough to inform real decisions.

---

## When to use

- After completing a major intelligence gathering round
- Before delivering a dossier to a decision-maker
- When findings from data aggregators (ZoomInfo, RocketReach, Prospeo, SignalHire) need validation
- When a critical finding seems too good (or too bad) to be true
- After an agent reports entity registrations, corporate relationships, or financial data

---

## The problem

Intelligence dossiers built from OSINT sources accumulate claims from data aggregators, people-intelligence platforms, and AI research agents. These sources have different reliability levels:

| Source type | Reliability | Common failure modes |
|-------------|-----------|---------------------|
| **Direct observation** (DNS query, SMTP test, HTTP response) | Highest | Transient network issues |
| **Archival sources** (Wayback Machine, crt.sh, SEC EDGAR) | High | Stale data, incomplete captures |
| **Official registries** (MN SOS, IRS, USPTO, SAM.gov) | High | Requires manual portal access; blocks automation |
| **People-intelligence aggregators** (ZoomInfo, RocketReach, Prospeo, SignalHire) | Medium | Inferred data, stale associations, hallucinated entities |
| **AI research agents** | Medium-Low | Can fabricate entities, misread sources, conflate similar names |
| **Single anonymous reports** (Indeed salary, Glassdoor reviews) | Low | Self-reported, small sample, possibly misattributed |

**The biggest risk:** Aggregator claims treated as facts without independent verification.

---

## Workflow

### Phase 1: Inventory all major findings

Create a table of every finding that was integrated into the dossier, noting:
- The finding itself
- The original source(s)
- Whether it was verified against a second independent source
- Current confidence level

### Phase 2: Verify against independent sources

For each finding type, use the appropriate verification method:

| Finding type | Verification method |
|-------------|-------------------|
| Entity registrations (LLCs, nonprofits) | Check issuing authority (Secretary of State portal, IRS EOS) |
| Email addresses | SMTP RCPT TO verification (authoritative on non-catch-all domains) |
| Employee associations | Cross-reference 2+ aggregators OR find on company website/LinkedIn |
| Partnership claims | Check manufacturer's own partner directory (see oem-partner-verification skill) |
| Financial data (revenue, valuation) | Cross-reference D&B, Prospeo, Indeed salary data; note sample sizes |
| Property records | County assessor records (not just Zillow/Redfin estimates) |
| Tech stack detections | Require 2+ tools to agree (e.g., httpx + Prospeo + page source) |
| Salary data | Note sample size and self-report bias (Indeed = single anonymous reports) |
| Event/membership claims | Find archival evidence (Wayback, LinkedIn posts, event pages) |

### Phase 3: Confidence tiering

Assign every finding a confidence level:

| Level | Criteria | Action |
|-------|---------|--------|
| **Confirmed** | 2+ independent sources agree, or direct observation (DNS, SMTP, HTTP) | Integrate as fact |
| **High** | Primary source is authoritative (official registry, archival record) | Integrate with source citation |
| **Medium** | Single credible source OR 2+ aggregators agree | Integrate with "per [source]" qualifier |
| **Low-Medium** | Single aggregator report, small sample, or reasonable inference | Flag in text, note uncertainty |
| **Retracted** | Could not be independently verified after active search | Remove from analysis; document retraction with explanation |

### Phase 4: Document retractions

When retracting a finding:
1. Strike through the original text (don't delete — preserve the audit trail)
2. Add "RETRACTED (date)" with the reason
3. Note what verification was attempted and what failed
4. Update every file where the retracted finding was placed

### Phase 5: Methodology note

Document the systemic patterns discovered during verification:
- Which source types proved reliable vs. unreliable
- Which aggregators fabricated data
- What verification methods were most effective
- Recommendations for future research rounds

---

## Output template

```markdown
# Verification Audit

## RETRACTED FINDINGS
| Finding | Source | Verification attempt | Result |
|---------|--------|---------------------|--------|
| ... | ... | ... | RETRACTED — [reason] |

## VERIFIED FINDINGS (high confidence)
| Finding | Sources | Confidence |
|---------|---------|------------|
| ... | ... | Confirmed/High |

## CONFIDENCE DOWNGRADES
| Finding | Was | Now | Reason |
|---------|-----|-----|--------|
| ... | High | Medium | [reason] |

## METHODOLOGY NOTE
[Systemic observations about source reliability]
```

---

## Real-world example

In a June 2026 dossier audit:
- **4 entity registrations retracted** (Brogav Properties LLC, Brogav Books LLC, Break The Ice LLC, BROGAV AI Builders Foundation) — reported by a research agent, zero results on IRS EOS, ProPublica, or any public database. Likely data-aggregator hallucinations.
- **1 finding partially rehabilitated** — Brogav Books LLC was later discovered to be plausible when a real published book ("Technoville Adventures") was found on Amazon with BROGAV Solutions LLC as publisher. The retraction was updated to note this.
- **Salary data downgraded** from "new intelligence" to "low-medium confidence" — Indeed reported a $154K "Strategic Project Manager" role from a single anonymous self-report with no corroboration.

The audit caught the AI research agent's tendency to treat aggregator output as confirmed fact — the same error that put 4 fictional entities into 4 separate dossier files before correction.

---

## Integration with other skills

- **intelligence-dossier** — verification audit is the QA step before delivery
- **conversation-review** — complementary; conversation-review checks completeness, verification-audit checks accuracy
- **oem-partner-verification** — specific application of this methodology to supplier claims
