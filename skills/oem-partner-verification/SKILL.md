# OEM Partner Verification

> Systematically verify whether a company's claimed OEM/manufacturer partnerships are reciprocally confirmed on the manufacturer's own website. Distinguishes between authorized partnerships, purchasing relationships, and aspirational logo placement.

---

## When to use

- Evaluating a VAR/reseller/distributor's partner page claims during due diligence
- Assessing competitive positioning (are competitors verified on the same OEM directories?)
- Validating supplier relationships before procurement decisions
- Screening acquisition targets for inflated capability claims

---

## The problem

Small and mid-size VARs commonly display 20-50+ manufacturer logos on their "Partners" page. These logos can represent four very different relationship levels:

| Level | What it means | How to verify |
|-------|-------------|---------------|
| **Authorized/Registered Partner** | Formal agreement, partner portal access, negotiated pricing, visible on OEM's partner locator | Check OEM partner directory |
| **Purchasing relationship** | Can order through distribution (Ingram Micro, ScanSource, WESCO) without direct OEM agreement | Cannot be externally verified |
| **Project-based** | Ordered a product once for a specific project | Cannot be externally verified |
| **Aspirational** | Logo downloaded from internet, no actual relationship | Check OEM directory — absence is the signal |

Only Level 1 (Authorized) is externally verifiable. The absence of a company from an OEM's partner directory does NOT prove the relationship is fake — it may be Level 2 or 3. But the presence of competitors on the same directory while the target is absent is a strong negative signal.

---

## Workflow

### Phase 1: Inventory the claimed partners

1. Scrape the target company's partner/supplier page (use Wayback Machine for historical versions)
2. Identify all brand logos — use OCR on logo images if alt-text is missing
3. Create a master list of claimed partners with the date each was first observed

### Phase 2: Check OEM partner directories

For each major OEM, search their official partner locator:

```
1. Visit the OEM's partner finder / dealer locator page
2. Search for the target company name
3. If searchable by location, also try the target's city/state
4. Record: Found / Not Found / Directory doesn't exist
5. If found, note partner tier (Silver, Gold, Platinum, etc.)
```

**Common OEM partner locator URLs (data center industry):**
- Eaton: eaton.com → Company → Partners → Find a Partner
- Schneider Electric: se.com → Partner Solutions → Find a Partner
- Vertiv: vertiv.com → Partners → Channel Partner Locator
- Starline: starlinepower.com → Find a Rep
- Generac: generac.com → Dealer Locator
- Chatsworth Products: chatsworth.com → Find a Distributor
- Panduit: panduit.com → Find a Partner
- CommScope: commscope.com → Partner Locator

**Also search:** `site:oem-domain.com "target company name"` to find any press releases, case studies, or blog posts mentioning the target.

### Phase 3: Cross-reference with event participation

Check if OEM personnel appeared at the target's events (speaker lists, sponsor pages). A manufacturer sending a Regional Manager to speak at a small company's event is stronger evidence than a logo on a website.

### Phase 4: Check for manufacturer-side endorsements

Search for social media posts by OEM employees mentioning the target:
- LinkedIn: `"target company" site:linkedin.com "partner" OR "authorized" OR "our partner"`
- OEM blogs/news: `site:oem-domain.com "target company"`

A manufacturer employee publicly calling the target "our partner" is strong confirmation.

### Phase 5: Check competitor presence

Search the same OEM directories for the target's known competitors. If competitors appear but the target doesn't, that's a significant gap.

---

## Output template

```markdown
# OEM Partnership Verification: [TARGET COMPANY]

## Verification scorecard

| OEM | On OEM directory? | Bidirectional evidence? | Confidence | Notes |
|-----|-------------------|------------------------|------------|-------|
| ... | Yes/No/N/A | Yes/No/Partial | High/Med/Low | ... |

## Summary

| Category | Count | Examples |
|----------|-------|---------|
| Confirmed by OEM | X | ... |
| Self-claimed with some evidence | X | ... |
| Self-claimed, no OEM confirmation | X | ... |

## Risk assessment

[Analysis of what the verification gap means for the target's claims]
```

---

## Key insight from real-world application

In a verification of ~40 claimed partnerships for a data center VAR (June 2026), only **2 were confirmed through the manufacturer's own website** (RLE Technologies and Packet Power). The target's direct competitors WERE confirmed on a major OEM's "Find a Rep" directory, but the target was not. This fundamentally changed the assessment of the company's supplier depth.

The gap between "we can source this product" (true — anyone can order through distribution) and "we are an authorized partner" (requires formal agreement) is material for procurement decisions, RFP responses, and acquisition due diligence.

---

## Tools

- WebFetch / web search for OEM partner directories
- Wayback Machine for historical partner page versions (track when logos were added/removed)
- OCR tools for identifying logos without alt-text
- LinkedIn search for manufacturer employee endorsements

## Integration with other skills

- **intelligence-dossier** — feeds into `03_Products_and_Suppliers/` supplier verification
- **website-techstack-analysis** — partner page HTML provides the input data
- **competitor-identification** — competitor presence on OEM directories is a comparison vector
