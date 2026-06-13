# Industry Context Research

## Overview

Build a comprehensive industry context layer for a competitive intelligence dossier by systematically researching six dimensions: Economics, History, Legal/Regulatory, Political, Sociological/Workforce, and Technology. This method was validated on the data center equipment VAR (Value-Added Reseller) industry during the BROGAV Solutions dossier project (June 2026), producing 32 files totaling 12,081 lines across 7 subdirectories.

## When to Use

- You are building a competitive intelligence dossier and need industry context beyond the target company itself
- You need to understand the macro environment that shapes a company's strategy, risks, and opportunities
- You want to identify tailwinds and headwinds that affect the target company's growth trajectory
- You need to brief someone who is unfamiliar with the industry (e.g., investor, acquirer, board member)

## Prerequisites

- **Web search access** (WebSearch or equivalent tool)
- **Web fetch access** (WebFetch for downloading pages, PDFs, filings)
- **Target company dossier** already started (company profile, products, financials exist)
- **Industry identified** with enough specificity to search effectively (not "tech" but "data center physical infrastructure value-added resellers")
- **Time budget:** 4-8 hours depending on industry complexity

## Method

### Step 1: Create the Directory Structure

Set up the six-dimension folder hierarchy:

```
07_Industry_Context/
  README.md                          # Overview and navigation
  economics_and_financial/
    market_sizing.md                 # TAM/SAM/SOM estimates
    channel_economics.md             # How money flows (margins, splits)
    investment_trends.md             # VC/PE/public market activity
    pricing_dynamics.md              # How pricing works in this industry
  historical/
    industry_timeline.md             # How we got here (decades of evolution)
    key_inflection_points.md         # Pivotal moments that shaped the industry
    consolidation_history.md         # M&A waves and their effects
  legal_and_regulatory/
    licensing_requirements.md        # State/federal licensing
    compliance_frameworks.md         # Industry-specific regulations
    trade_and_tariffs.md             # Import/export rules affecting supply chain
    procurement_rules.md             # Government procurement (BAA/TAA, GSA)
  political/
    policy_landscape.md              # Current legislation and executive orders
    incentives_and_subsidies.md      # Tax breaks, grants, economic zones
    energy_policy.md                 # If relevant to industry
    geopolitical_factors.md          # Trade wars, sanctions, supply chain shifts
  sociological_and_workforce/
    workforce_demographics.md        # Who works in this industry
    talent_pipeline.md               # Where talent comes from, training paths
    diversity_metrics.md             # Industry diversity data
    labor_market_dynamics.md         # Hiring trends, compensation, shortages
  technology/
    current_technology_stack.md      # What technologies are deployed today
    emerging_technologies.md         # What is coming in 1-3 years
    technology_adoption_curves.md    # Adoption rates and timelines
    standards_and_certifications.md  # Industry standards bodies
  synthesis/
    positioning_analysis.md          # Where target company fits in the landscape
    opportunity_map.md               # Top 15 tailwinds ranked by impact
    threat_map.md                    # Top 15 headwinds ranked by impact
    confidence_matrix.md             # All data points rated by confidence level
```

### Step 2: Design Research Questions (Three Tiers)

For each dimension, write questions at three levels of depth:

**Tier 1: Insider Questions** -- Things only someone working in the industry would think to ask.

Examples from the data center VAR industry:
- "What percentage of DC equipment flows through VARs vs. OEM-direct channels?"
- "Do VARs carry inventory or is it all drop-ship / configure-to-order?"
- "What is a typical gross margin split between hardware resale and services?"
- "Which OEMs actively protect their channel vs. going direct?"

**Tier 2: Strategic Context** -- Questions about where the industry is headed.

Examples:
- "What is the realistic liquid cooling adoption timeline and how does it affect VARs?"
- "Are hyperscalers pulling spend away from colocation, and what does that mean for VAR customers?"
- "How does the AI infrastructure boom change the product mix for DC equipment sellers?"

**Tier 3: Macro Context** -- Big-picture questions that frame the industry for outsiders.

Examples:
- "How did we get from mainframe rooms to $300B+ in global data center investment?"
- "What role does US energy policy play in determining where data centers get built?"
- "How do tariffs on Chinese-manufactured equipment affect US data center buildout costs?"

**Question volume:** Aim for 5-8 questions per dimension, 30-50 total.

### Step 3: Map Sources to Dimensions

Each dimension has specific high-value source types. Do not search generically -- target the right source for each question.

| Dimension | Primary Sources | What to Look For |
|---|---|---|
| Economics | SEC filings (10-K, 20-F, URD); market research executive summaries; investor presentations | Channel vs. direct revenue splits; gross margin disclosures; TAM estimates |
| History | Trade press archives; Wikipedia industry articles; manufacturer corporate timelines | Founding dates, M&A events, technology transitions, industry crises |
| Legal | State licensing authority websites; SBA.gov; USTR tariff schedules; FCC/EPA regulations | Licensing requirements by state; tariff rates by HTS code; compliance mandates |
| Political | Congress.gov; state economic development agencies; White House fact sheets; ISO/RTO maps | Legislation affecting the industry; tax incentives; energy policy changes |
| Sociological | USASpending.gov; BLS Occupational Outlook; Uptime Institute surveys; WBENC certification database | Federal contract spending; workforce demographics; diversity certification data |
| Technology | Uptime Institute reports; Dell'Oro Group summaries; OCP Foundation roadmaps; vendor whitepapers | Adoption curves; emerging standards; technology transition timelines |

### Step 4: Execute Research in Parallel Phases

Run 5-6 research threads in parallel per phase. Each thread targets a specific file.

**Phase 1:** Economics + History (foundational context)
**Phase 2:** Legal + Political (regulatory environment)
**Phase 3:** Sociological + Technology (workforce and tech landscape)
**Phase 4:** Synthesis (requires all prior phases complete)

For each file:
1. Search for 3-5 high-quality sources
2. Extract specific data points with citations
3. Rate each data point's confidence level
4. Write the BROGAV Implications section (see Step 5)
5. Flag data gaps for follow-up

### Step 5: Write the Implications Section

Every research file MUST end with a structured implications table that connects industry findings back to the target company:

```markdown
## Implications for [Target Company]

| Finding | Impact on [Company] | Type | Magnitude | Timeline |
|---|---|---|---|---|
| DC market growing at 20% CAGR through 2028 | Expands addressable market for all product lines | Opportunity | High | 2024-2028 |
| Liquid cooling adoption reaching 30% of new builds by 2027 | Must add liquid cooling competency or lose relevance | Threat | High | 2025-2027 |
| Section 301 tariffs add 25-35% to Chinese-manufactured equipment | Advantages US-manufactured partners (Gateview) | Opportunity | Medium | Immediate |
| Federal CHIPS Act driving $52B in new fab construction | Adjacent market opportunity for cleanroom infrastructure | Opportunity | Medium | 2025-2030 |
```

**Type:** Opportunity, Threat, or Neutral
**Magnitude:** High (existential/transformative), Medium (significant), Low (incremental)
**Timeline:** Immediate, 1-2 years, 3-5 years, 5+ years

### Step 6: Apply the Confidence Framework

Rate every data point using five confidence levels:

| Level | Definition | Example Sources |
|---|---|---|
| Definitive | Government data, audited financials, court records | SEC 10-K filings, BLS data, PACER records |
| High | 3+ independent sources agree on the same figure | Multiple trade press articles citing same stat |
| Moderate | 1 authoritative source, not independently verified | Gartner/IDC estimate cited in one report |
| Low | Extrapolated from partial data or adjacent markets | "If the broader IT VAR market is X, then DC VARs are ~Y" |
| Speculative | Analyst projection or logical inference without data | "Liquid cooling will likely reach Z% by 2028" |

Tag every quantitative claim: `[Confidence: High]` or `[Confidence: Speculative]`

### Step 7: Build the Synthesis Layer

After all dimension files are complete, write four synthesis documents:

**Positioning Analysis (positioning_analysis.md):**
- TAM/SAM/SOM estimates with methodology
- Where the target company sits in the value chain
- Competitive position relative to industry dynamics

**Opportunity Map (opportunity_map.md):**
- Top 15 tailwinds ranked by impact and timeline
- Each with: description, evidence sources, confidence level, recommended action

**Threat Map (threat_map.md):**
- Top 15 headwinds ranked by severity and probability
- Each with: description, evidence sources, confidence level, mitigation options

**Confidence Matrix (confidence_matrix.md):**
- Every quantitative data point in the dossier rated
- Organized by section, showing gaps where confidence is Low or Speculative
- Prioritized list of data gaps to fill in future research

## Code Snippets

### File template generator

```python
from pathlib import Path

def create_industry_context_structure(base_dir, company_name, industry_name):
    """Generate the full directory structure with template files."""
    base = Path(base_dir) / "07_Industry_Context"
    
    subdirs = [
        "economics_and_financial",
        "historical",
        "legal_and_regulatory",
        "political",
        "sociological_and_workforce",
        "technology",
        "synthesis",
    ]
    
    for subdir in subdirs:
        (base / subdir).mkdir(parents=True, exist_ok=True)
    
    # Write README
    readme = f"""# Industry Context: {industry_name}

## Purpose
Provide the macro environment context for the {company_name} intelligence dossier.

## Dimensions
1. **Economics & Financial** — Market sizing, channel economics, investment trends
2. **Historical** — How the industry evolved, key inflection points
3. **Legal & Regulatory** — Licensing, compliance, tariffs, procurement rules
4. **Political** — Policy landscape, incentives, energy policy, geopolitics
5. **Sociological & Workforce** — Demographics, talent pipeline, diversity
6. **Technology** — Current stack, emerging tech, adoption curves, standards

## Confidence Levels
- Definitive: Government/audited source
- High: 3+ independent sources agree
- Moderate: 1 authoritative source
- Low: Extrapolated from partial data
- Speculative: Analyst projection

## File Count Target
28-35 files across all subdirectories.
"""
    (base / "README.md").write_text(readme)
    
    # Write file template
    template = f"""# [Title]

> **Confidence Level:** [Definitive/High/Moderate/Low/Speculative]
> **Last Updated:** [Date]
> **Sources:** [Count]

## Key Findings

[Content here]

## Data Points

| Data Point | Value | Source | Confidence | Date |
|---|---|---|---|---|

## Implications for {company_name}

| Finding | Impact on {company_name} | Type | Magnitude | Timeline |
|---|---|---|---|---|

## Sources

1. [Full citation with URL and access date]

## Data Gaps

- [What we could not determine and where to look next]
"""
    # Write template to each subdir
    for subdir in subdirs:
        if subdir != "synthesis":
            (base / subdir / "_TEMPLATE.md").write_text(template)
    
    return base

# Usage:
# create_industry_context_structure(
#     "/path/to/dossier",
#     "BROGAV Solutions",
#     "Data Center Physical Infrastructure VAR"
# )
```

### Implications table generator

```python
def format_implications_table(findings):
    """
    Format a list of findings into a markdown implications table.
    findings: list of dicts with keys: finding, impact, type, magnitude, timeline
    """
    header = "| Finding | Impact | Type | Magnitude | Timeline |\n"
    header += "|---|---|---|---|---|\n"
    rows = []
    for f in findings:
        rows.append(
            f"| {f['finding']} | {f['impact']} | {f['type']} | {f['magnitude']} | {f['timeline']} |"
        )
    return header + "\n".join(rows)
```

## Performance

| Metric | Value |
|---|---|
| Files produced | 32 |
| Total lines written | 12,081 |
| Subdirectories | 7 |
| Research phases | 4 (parallelized) |
| Agents per phase | 5-6 |
| Total research time | ~6 hours |
| Unique sources cited | 80+ |
| Implications tables | 28 (one per file) |

## Pitfalls

1. **Generic research:** Searching "data center market size" returns surface-level results. Use insider terminology: "DC physical infrastructure VAR channel economics gross margin" gets you to real data faster.

2. **Source recency:** Industry data older than 18 months is often obsolete in fast-moving sectors. Always note the publication date and flag anything pre-2024 as potentially stale.

3. **Circular citations:** Market research firms cite each other. If Gartner says "$X billion" and IDC says "$X billion," check whether they independently arrived at that figure or one is citing the other. True independent agreement = High confidence. Echo chamber = Moderate at best.

4. **Missing the implications:** Raw industry data without a "so what does this mean for the target company" section is useless for decision-makers. Every file must have the implications table.

5. **Dimension silos:** The most valuable insights come from cross-dimension connections (e.g., tariff policy + supply chain geography + technology adoption = specific competitive advantage). The synthesis layer must connect dots across dimensions.

6. **Parallelization conflicts:** When running 5-6 agents in parallel, ensure they are writing to different files. Two agents writing to the same file will cause data loss.

7. **Over-scoping:** 28-35 files is the target range. Going beyond 40 files creates maintenance burden without proportional insight gain. If a dimension seems thin, merge files rather than padding.

## Real-World Example

**Industry:** Data Center Physical Infrastructure Value-Added Resellers
**Target Company:** BROGAV Solutions (Maple Grove, MN)

**Structure produced:**
```
07_Industry_Context/
  README.md
  economics_and_financial/
    market_sizing.md (585 lines)
    channel_economics.md (412 lines)
    investment_trends.md (380 lines)
    pricing_dynamics.md (295 lines)
  historical/
    industry_timeline.md (620 lines)
    key_inflection_points.md (340 lines)
    consolidation_history.md (410 lines)
  legal_and_regulatory/
    licensing_requirements.md (280 lines)
    compliance_frameworks.md (350 lines)
    trade_and_tariffs.md (520 lines)
    procurement_rules.md (310 lines)
  ... (32 files total)
```

**Highest-impact findings:**
- DC market growing at 20% CAGR through 2028 (Definitive: multiple 10-K filings)
- VARs capture 15-25% gross margin on hardware, 40-60% on services (High: 3 distributor reports)
- Section 301 tariffs add 25-35% to Chinese-manufactured cabinets, advantaging US manufacturers (Definitive: USTR schedule)
- Liquid cooling reaching 30% of new enterprise builds by 2027 (Moderate: Uptime Institute survey)
- Only 3 states require specific contractor licensing for DC infrastructure installation (Definitive: state licensing authority websites)

## Output Template

```
# [Dimension]: [Topic Title]

> **Confidence Level:** [Level]
> **Last Updated:** YYYY-MM-DD
> **Sources:** [N]

## Executive Summary
[2-3 sentences capturing the key insight]

## Key Findings

### [Finding 1 Title]
[Detailed explanation with inline citations]

### [Finding 2 Title]
[Detailed explanation with inline citations]

## Data Points

| Data Point | Value | Source | Confidence | Date |
|---|---|---|---|---|
| US DC market size | $XX.XB | [Source] | Definitive | 2025 |
| VAR channel share | XX% | [Source] | High | 2024 |

## Implications for [Target Company]

| Finding | Impact | Type | Magnitude | Timeline |
|---|---|---|---|---|
| [Finding] | [How it affects target] | Opportunity/Threat | High/Med/Low | [When] |

## Sources

1. [Author/Org]. "[Title]." [Publication], [Date]. [URL]. Accessed [Date].
2. ...

## Data Gaps

- [ ] [Specific data point needed]
- [ ] [Where to look for it]
```
