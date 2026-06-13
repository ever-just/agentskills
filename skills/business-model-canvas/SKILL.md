# Business Model Canvas Builder

## Overview

How to build a comprehensive, analytically rigorous Business Model Canvas (BMC) for a company using structured intelligence data. Covers the 9 Osterwalder blocks, data requirements for each, formatting for markdown delivery, writing style enforcement, and the feedback loops that connect blocks into a coherent model narrative.

Developed and validated on a full BMC for BROGAV Solutions LLC (data center equipment VAR, ~$4.5M revenue, June 2026). Three iterations: v1 (table dump, rejected), v2 (narrative but AI-sounding), v3 (cold_steel register, de-AI-ified, accepted).

Use this skill when you need to:
- Build a BMC from an existing intelligence dossier, competitive analysis, or research dataset
- Translate raw company data into the 9-block Osterwalder framework
- Produce a document that reads as analysis, not a spreadsheet

---

## Prerequisites

Before starting a BMC, you need data across these categories. Map what you have vs. what's missing before writing anything.

| BMC Block | Minimum Data Required | Ideal Data |
|-----------|----------------------|------------|
| Customer Segments | At least 1 named client, industry vertical, geographic scope | Full client registry with tiers, revenue concentration, ICP scoring |
| Value Propositions | Company tagline/positioning, at least 1 testimonial | Competitive differentiation evidence, customer-validated claims |
| Channels | Sales model (direct/channel/e-commerce), marketing presence | Channel attribution, conversion rates, event strategy |
| Customer Relationships | Relationship model (founder-led, self-service, etc.) | Retention rate, NPS, CRM system, upsell strategy |
| Revenue Streams | Total revenue (even estimated), primary revenue model | Stream-level breakdown, pricing data, recurring vs. one-time split |
| Key Resources | Founder background, team size, certifications, facilities | Full roster with single-point-of-failure analysis, IP portfolio |
| Key Activities | Core operations description | Activity-to-value-proposition mapping |
| Key Partnerships | Supplier/manufacturer list | Partnership terms, dependency analysis, co-marketing evidence |
| Cost Structure | Headcount, facility footprint | Actual P&L, COGS ratio, margin estimates |

---

## Process

### Phase 1: Data Audit (30 min)

Read every available source file. For a dossier, this means every section. Map each data point to its BMC block. Build a coverage scorecard:

```
Block              | Data Quality | Key Strength           | Critical Gap
Customer Segments  | Moderate     | 3,568 ICP prospects    | Only 1 named client
Value Propositions | Strong       | Validated testimonial  | No quantified ROI
...
```

Do not start writing until you know where your data is strong and where it's thin. The gaps shape the document as much as the findings.

### Phase 2: Fill Order (Right to Left)

Fill blocks in Osterwalder's recommended order: Customer Segments first, then Value Propositions, then Channels/Relationships/Revenue, then Resources/Activities/Partnerships, then Cost Structure. This ensures customer-centricity. Each block should reference the blocks before it.

### Phase 3: Write

**Structure:** Open with a plain-language summary ("How This Business Works") that explains the model in 4 paragraphs before any block detail. Then an ASCII canvas grid for visual reference. Then 9 detailed block sections. Close with "How the Model Reinforces Itself" (feedback loops) and "What the Canvas Reveals" (strategic implications).

**Writing rules (validated through 3 iterations):**
- Zero em dashes. Use periods, colons, semicolons, or restructured sentences.
- No "not X, it's Y" patterns. State what it is, not what it isn't.
- No monotonous bold-lead structure. Vary paragraph openings.
- No symmetry padding (three-part lists for decoration).
- No hedging unless genuine uncertainty. "BROGAV likely retains..." is fine if you show the math. "This seems to suggest..." is not.
- Every claim needs a source or confidence marker.
- Concrete nouns over abstractions. Strong verbs over adverbs.
- Open with substance, not a hook. Close cleanly without summary.
- For business intelligence documents, use `cold_steel` or `journalistic` register from the beautiful-prose skill, and `--preserve-formal` mode from de-ai-ify.

### Phase 4: Feedback Loops

After writing all 9 blocks, write a section mapping how they reinforce each other. Name each loop and trace it across blocks. Example:

```
The referral loop: Celina's relationships (Key Resource) generate project deals
(Revenue Stream) through referrals (Channel). She delivers fast (Value Proposition),
the customer tells a peer (Customer Relationship), the peer becomes the next deal.
```

Always include at least one vulnerability loop showing where the model breaks.

### Phase 5: Strategic Synthesis

Write 4-5 observations that emerge from the canvas as a whole. These should be things not visible from any single block. Examples:
- "The model works at $5M. Whether it works at $15M is an open question."
- "The product is commoditized. The differentiation is in who sells it."

---

## ASCII Canvas Grid Template

```
+---------------------+---------------------+---------------------+
|                     |                     |                     |
|   KEY PARTNERS      |  VALUE PROPOSITIONS |  CUSTOMER           |
|                     |                     |  RELATIONSHIPS      |
|  [4-6 items]        |  [4-6 items]        |  [3-5 items]        |
|                     |                     |                     |
+---------------------+                     +---------------------+
|                     |                     |                     |
|   KEY ACTIVITIES    |                     |  CHANNELS           |
|                     |                     |                     |
|  [4-6 items]        |                     |  [4-6 items]        |
|                     |                     |                     |
+---------------------+                     +---------------------+
|                     |                     |                     |
|   KEY RESOURCES     |                     |  CUSTOMER SEGMENTS  |
|                     |                     |                     |
|  [4-6 items]        |                     |  [4-6 items]        |
|                     |                     |                     |
+---------------------+---------------------+---------------------+
+----------------------------------+------------------------------+
|                                  |                              |
|   COST STRUCTURE                 |  REVENUE STREAMS             |
|                                  |                              |
|  [4-6 items]                     |  [4-6 items]                 |
|                                  |                              |
+----------------------------------+------------------------------+
```

---

## Anti-Patterns (What Failed)

These were rejected in the BROGAV BMC iteration process:

1. **Table dumps with confidence tags.** Every section was a table with [Confirmed] / [Estimated] / [Assumed] tags. Read like a spreadsheet, not analysis. Fix: narrative prose with evidence woven in.

2. **Every paragraph opening with bold lead.** `**Speed is the lead differentiator.** In an industry where...` repeated 40 times. Robotic. Fix: vary paragraph openings. Start some with names, some with short sentences, some with context.

3. **Three-column overview tables.** Cramming all 9 blocks into a markdown table destroys readability. Fix: ASCII canvas grid for visual reference, then full prose sections.

4. **"Gaps" subsection after every block.** Repetitive structure. Fix: mention gaps inline where they matter to the analysis, not as a separate list.

5. **Restating the previous sentence.** "This is the highest-margin product. The margins on this product are the highest." Fix: say it once, move on.

---

## Quality Checklist

Before delivering:
- [ ] "How This Business Works" section explains the model to someone who knows nothing about the company
- [ ] Canvas grid is present and readable
- [ ] All 9 blocks have analytical prose, not just data lists
- [ ] Feedback loops section connects at least 4 cross-block relationships
- [ ] At least 1 vulnerability loop is identified
- [ ] Strategic synthesis section has 4-5 observations not visible from single blocks
- [ ] Zero em dashes in the document
- [ ] No monotonous structural patterns
- [ ] Every factual claim has an evidence basis (named source, testimonial, data point)
- [ ] Confidence levels are stated for estimates, not hidden

---

## Companion Skills

- `intelligence-dossier` -- provides the data structure this skill consumes
- `beautiful-prose` -- writing style contract (use `cold_steel` or `journalistic` register)
- `de-ai-ify` -- pattern removal (use `--preserve-formal` mode for business docs)
- `client-discovery-osint` -- fills the Customer Segments block with real client data
