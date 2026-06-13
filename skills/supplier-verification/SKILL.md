# Supplier Verification and Deep Dive

## Overview

Transform a company's unverified partner logo wall into a confirmed, evidence-ranked supplier relationship map with specific products, manufacturing origins, and tariff exposure. This skill covers tier classification, multi-source evidence chains, manufacturer website verification, manufacturing origin investigation, tariff exposure analysis, and product-to-supplier mapping. Validated during the BROGAV Solutions dossier project (June 2026), verifying 25+ claimed supplier partnerships and upgrading 5 suppliers from "inferred" to "confirmed."

## When to Use

- A target company claims multiple supplier/partner relationships on its website but you need to verify which are real
- You need to assess the depth of each supplier relationship (authorized reseller vs. occasional purchaser)
- You need to identify single-source dependencies and supply chain risks
- You need to determine manufacturing origin for tariff exposure analysis
- You are building a competitive intelligence dossier and need the supplier/product layer
- You are conducting due diligence where overstated supplier relationships are a red flag

## Prerequisites

- **Web search access** for cross-referencing claims
- **Web fetch access** for checking manufacturer partner directories
- **LinkedIn access** (optional but valuable for founder background investigation and post evidence)
- **ImportGenius or similar customs database** (optional, for import records)
- **Knowledge of HTS codes** or access to USTR tariff schedules for tariff analysis
- **Target company's website** with partner/supplier logos or partner page

## Method

### Step 1: Catalog All Claimed Partnerships

Start by documenting every supplier/partner the target company claims:

1. Screenshot or list all logos from the partner wall / partners page
2. Check the "Products" or "Solutions" pages for additional brand mentions
3. Search LinkedIn posts for supplier mentions (use the LinkedIn Activity Intelligence skill)
4. Check press releases for partnership announcements
5. Search for co-branded content, case studies, or webinars

Create the initial catalog:

```
| # | Supplier Name | Where Claimed | Logo on Site | Products Page | LinkedIn Mention | Other Evidence |
|---|---|---|---|---|---|---|
| 1 | Gateview | Partner wall | Yes | Yes | Yes (12 posts) | Case study |
| 2 | Chatsworth | Partner wall | Yes | No | Yes (3 posts) | None |
| 3 | Panduit | Partner wall | Yes | Yes | No | Event co-sponsor |
```

### Step 2: Classify into Tiers

Sort every supplier into four tiers based on evidence strength:

**Tier 1 -- Anchor Partners** (3+ independent evidence sources)
- Listed on supplier's own partner/reseller directory
- Multiple product references on target company's website
- LinkedIn posts showing installations, training, or joint events
- Co-branded marketing materials or case studies
- Evidence of stocking inventory (not just drop-ship)

**Tier 2 -- Specialty Partners** (2 evidence sources)
- Listed on partner wall with some corroborating evidence
- At least one product reference or LinkedIn mention
- May be authorized but relationship depth unclear

**Tier 3 -- Project-Spec'd** (1 evidence source)
- Listed on partner wall but no other evidence found
- Likely ordered per-project rather than stocked
- May be a past relationship that is no longer active

**Tier 4 -- Inferred** (contextual evidence only)
- Not claimed by the company at all
- Inferred from founder's prior employer, industry norms, or product similarities
- Example: "Founder worked at Emcor for 8 years, likely maintains Emcor supplier contacts"

**Tier classification template:**

```markdown
### Tier 1: Anchor Partners
| Supplier | Evidence Count | Key Evidence | Products |
|---|---|---|---|
| Gateview | 5 | Partner directory listing, 12 LinkedIn posts, case study, product page, event co-branding | Racks, cabinets, containment |

### Tier 2: Specialty Partners
| Supplier | Evidence Count | Key Evidence | Products |
|---|---|---|---|

### Tier 3: Project-Spec'd
| Supplier | Evidence Count | Key Evidence | Products |
|---|---|---|---|

### Tier 4: Inferred
| Supplier | Evidence Basis | Confidence | Products |
|---|---|---|---|
```

### Step 3: Build Evidence Chains

For each supplier, systematically check these sources in order (most authoritative first):

```
Evidence Chain Checklist:
[ ] 1. Manufacturer's partner/reseller directory (GOLD STANDARD)
[ ] 2. Manufacturer case studies mentioning the target company
[ ] 3. Target company's product pages listing specific models/SKUs
[ ] 4. LinkedIn posts mentioning or tagging the supplier
[ ] 5. LinkedIn images showing supplier products installed or at events
[ ] 6. Co-sponsored events or trade show booth appearances
[ ] 7. Case studies or project references on either website
[ ] 8. Web search: "[target company] + [supplier name]"
[ ] 9. Web search: "[target company] authorized reseller [supplier]"
[ ] 10. Press releases from either company
[ ] 11. Team member employment history at the supplier
[ ] 12. ImportGenius customs records (for import relationships)
```

**Evidence scoring:**

| Source | Points | Rationale |
|---|---|---|
| Manufacturer partner directory | 3 | Official confirmation from the supplier side |
| Manufacturer case study | 2 | Published endorsement |
| Product page with specific models | 2 | Shows active selling relationship |
| LinkedIn post with product photos | 2 | Visual confirmation of handling/installing |
| E-commerce listing with SKUs | 2 | Active commercial relationship |
| Co-sponsored event | 1 | Business relationship exists |
| Logo on partner wall only | 1 | Self-reported, unverified |
| Web search mention | 1 | May be stale |
| Team member prior employment | 1 | Relationship pathway |
| Inferred from background | 0.5 | Educated guess |

**Tier assignment:** Tier 1 = 5+ points, Tier 2 = 3-4 points, Tier 3 = 1-2 points, Tier 4 = <1 point

### Step 4: Verify via Manufacturer Websites

The single most authoritative verification method. For each claimed supplier:

1. Navigate to the supplier/manufacturer's website
2. Look for: "Where to Buy," "Find a Partner," "Authorized Resellers," "Channel Partners," "Dealer Locator"
3. Search for the target company by name or geographic location
4. Document: Is the target company listed? What tier/level? What geography? What certifications?

**Search pattern:**
```
WebSearch: "[Manufacturer] where to buy authorized reseller partner locator"
WebFetch: [the partner locator page]
Search for: target company name in the results
```

**Common manufacturer directory URL patterns:**
```
/partners
/where-to-buy
/find-a-partner
/resellers
/authorized-dealers
/channel-partners
/dealer-locator
/partner-directory
```

**Example from BROGAV project:** Gateview.com/where/ listed BROGAV as 1 of 9 National Certified Partners, with Celina Berglund as the named contact. This single finding elevated Gateview from Tier 4 (inferred) to Tier 1 (confirmed anchor).

### Step 5: Investigate Manufacturing Origins

For each supplier, determine where products are manufactured. This is critical for tariff and compliance analysis.

**Investigation methods:**

1. **Company "About" page:** Many manufacturers state "Made in USA" or "Manufactured in [location]"
2. **Product datasheets:** May list manufacturing facility or country of origin
3. **SEC filings (10-K):** Large manufacturers disclose manufacturing locations in property schedules
4. **ImportGenius:** Search for customs import records by company name
5. **LinkedIn:** Manufacturing facility photos, job postings for factory roles with location
6. **Google Maps satellite imagery:** Is there a warehouse/factory attached to the headquarters?

**For private-label/white-label products:**

This requires deeper investigation:

1. **Founder's employment history:** What companies did the founders work for? Those companies are the most likely white-label sources. An 8-year tenure at Emcor means the founder knows Emcor's suppliers, pricing, and product specs intimately.
2. **Product spec comparison:** Compare the target company's product specifications to known manufacturers. Identical configurable dimensions, weight ratings, and options suggest white-labeling.
3. **Geographic proximity:** Is there a manufacturer within shipping distance that makes similar products?
4. **Visual inspection:** Do product photos show the same cabinet/rack design with a different logo badge?
5. **"We build in [city]" claims:** Verify WHO builds there. The company may use inclusive "we" to describe a supplier's factory.

**Example from BROGAV project:** Celina Berglund's 8-year Emcor background + BROGAV cabinet specs matching Emcor's configurable cabinet philosophy -> probable white-label relationship with an Emcor-adjacent manufacturer. BROGAV-branded cabinets visible in LinkedIn photos appeared to be generic configurable cabinets with BROGAV logo plates.

### Step 6: Build the Tariff Exposure Matrix

For each supplier and product category, assess tariff exposure:

```markdown
## Tariff Exposure Matrix

| Supplier | Product | Mfg Location | HTS Code | Base Tariff | Sec 301 | Total Rate | BAA/TAA | Risk |
|---|---|---|---|---|---|---|---|---|
| Gateview | Racks, cabinets | Jacksonville, FL (USA) | 9403.20 | 0% | N/A | 0% | Compliant | Low |
| Unknown Mfr | Cabinets | China (suspected) | 9403.20 | 0% | 25-35% | 25-35% | Non-compliant | High |
| Chatsworth | Cable mgmt | Westlake Village, CA (USA) | 8538.90 | 0% | N/A | 0% | Compliant | Low |
| APC/Schneider | UPS, PDU | Multiple (US, China, Philippines) | 8504.40 | 0-2.5% | Varies | 0-27.5% | Varies | Medium |
```

**Key tariff considerations:**
- **Section 301 tariffs:** 25-100%+ on Chinese-manufactured goods depending on product category (check current USTR list)
- **Section 232 tariffs:** 25-50% on steel and aluminum products
- **BAA/TAA compliance:** Required for federal government contracts. Products must be manufactured in the US or a TAA-designated country.
- **Country of origin rules:** "Substantial transformation" rules mean assembly location may differ from component origin
- **De minimis:** Some tariff exemptions apply below certain value thresholds

### Step 7: Create Product-to-Supplier Mapping

Build a comprehensive table mapping every product category to its supplier(s):

```markdown
## Product-to-Supplier Map

| Product Category | Primary Supplier | Secondary | Stocking Status | Est. Margin | Notes |
|---|---|---|---|---|---|
| Server racks (42U) | Gateview | Great Lakes/Vertiv | Stocked | 20-30% | National Certified Partner |
| Cable management | Chatsworth (CPI) | Panduit | Per-project | 25-35% | |
| PDUs | ServerTech/Legrand | APC/Schneider | Per-project | 15-25% | |
| UPS | APC/Schneider | Eaton | Per-project | 10-20% | |
| Containment | Gateview | Upsite | Stocked | 30-40% | Hot/cold aisle |
| Private-label cabinets | Unknown (probable Emcor adj.) | -- | Stocked | 35-50% | White-label, highest margin |
| Monitoring/DCIM | Sunbird | -- | Resold | 20-30% | Software |
```

### Step 8: Build the Supplier Risk Register

Identify and document supply chain risks:

```markdown
## Supplier Risk Register

| Risk | Supplier(s) | Severity | Probability | Impact | Mitigation |
|---|---|---|---|---|---|
| Acquisition changes channel access | Great Lakes (acquired by Vertiv) | High | Confirmed | May lose preferred pricing | Diversify rack suppliers |
| Single-source dependency | Gateview (primary rack partner) | Medium | Ongoing | 40%+ of product revenue tied to one supplier | Qualify secondary rack supplier |
| Tariff exposure on Chinese mfg | Unknown cabinet manufacturer | High | Current | 25-35% cost increase on key product | Verify origin, source US alternatives |
| Authorization tier unknown | 8 of 25 claimed partners | Medium | Unknown | May not be authorized to resell | Verify with each manufacturer |
| White-label source disruption | Probable Emcor-adjacent mfr | High | Low | Lose proprietary product line | Identify and qualify backup mfr |
```

### Step 9: Validate Eras on LinkedIn Evidence

If any evidence comes from LinkedIn posts, apply era validation before using it:

- Confirm the post falls within the current company era (not a prior employer)
- Check that product/brand names match the current company's portfolio
- "Protector Cabinets" in a LinkedIn post from 2019 = Emcor product, NOT the current company
- Flag any finding from posts near career-transition boundaries for manual review
- Look for current company branding (logo, URL, phone number) in images

See the LinkedIn Activity Intelligence skill for full era separation methodology.

## Code Snippets

### Evidence chain tracker

```python
def build_evidence_chain(company_name, supplier_name, checks):
    """
    Build and score an evidence chain for a supplier relationship.
    
    Args:
        company_name: Target company
        supplier_name: Supplier being verified
        checks: Dict of evidence source -> result (True, or descriptive string)
            Keys: "partner_directory", "case_study_by_mfr", "product_page",
                  "linkedin_posts", "linkedin_images", "co_sponsored_event",
                  "ecommerce_listing", "logo_wall", "web_search",
                  "press_release", "team_prior_employment", "import_records",
                  "inferred_background"
    
    Returns:
        Dict with tier, score, and evidence summary
    """
    scoring = {
        "partner_directory": 3,
        "case_study_by_mfr": 2,
        "product_page": 2,
        "linkedin_posts": 2,
        "linkedin_images": 2,
        "ecommerce_listing": 2,
        "co_sponsored_event": 1,
        "logo_wall": 1,
        "web_search": 1,
        "press_release": 1,
        "team_prior_employment": 1,
        "import_records": 1,
        "inferred_background": 0.5,
    }
    
    total_score = 0
    evidence = []
    
    for source, result in checks.items():
        if result:
            points = scoring.get(source, 0)
            total_score += points
            detail = f"{source}: {result}" if isinstance(result, str) else source
            evidence.append(detail)
    
    if total_score >= 5:
        tier, tier_label = 1, "Anchor Partner"
    elif total_score >= 3:
        tier, tier_label = 2, "Specialty Partner"
    elif total_score >= 1:
        tier, tier_label = 3, "Project-Spec'd"
    else:
        tier, tier_label = 4, "Inferred"
    
    return {
        "company": company_name,
        "supplier": supplier_name,
        "tier": tier,
        "tier_label": tier_label,
        "score": total_score,
        "evidence_count": len(evidence),
        "evidence": evidence,
    }

# Usage:
# result = build_evidence_chain("BROGAV Solutions", "Gateview", {
#     "partner_directory": "Listed as 1 of 9 National Certified Partners",
#     "product_page": True,
#     "linkedin_posts": "12 posts with product photos",
#     "co_sponsored_event": "Data Center World 2024 booth co-branding",
#     "case_study_by_mfr": True,
#     "logo_wall": True,
# })
# -> Tier 1 (Anchor Partner), Score: 11
```

### Tariff exposure calculator

```python
def calculate_tariff_exposure(products):
    """
    Calculate total tariff exposure for a product portfolio.
    
    Args:
        products: List of dicts with keys:
            name, supplier, mfg_country, hts_code, base_rate (decimal),
            sec301_rate (decimal), annual_volume_usd, baa_compliant (bool)
    
    Returns:
        Dict with total exposure, weighted average rate, and risk summary
    """
    total_volume = sum(p["annual_volume_usd"] for p in products)
    total_tariff_cost = 0
    non_compliant_volume = 0
    
    for p in products:
        effective_rate = p["base_rate"] + p.get("sec301_rate", 0)
        tariff_cost = p["annual_volume_usd"] * effective_rate
        total_tariff_cost += tariff_cost
        if not p.get("baa_compliant", True):
            non_compliant_volume += p["annual_volume_usd"]
    
    weighted_avg_rate = total_tariff_cost / total_volume if total_volume > 0 else 0
    
    return {
        "total_annual_volume": total_volume,
        "total_tariff_cost": round(total_tariff_cost, 2),
        "weighted_avg_tariff_rate_pct": round(weighted_avg_rate * 100, 2),
        "non_compliant_volume": non_compliant_volume,
        "non_compliant_pct": round(
            non_compliant_volume / total_volume * 100, 1
        ) if total_volume > 0 else 0,
        "risk_level": (
            "High" if weighted_avg_rate > 0.10
            else "Medium" if weighted_avg_rate > 0.03
            else "Low"
        ),
    }
```

## Performance

| Metric | Value |
|---|---|
| Suppliers evaluated | 25+ claimed partnerships |
| Tier 1 confirmed | 4 (Gateview, Chatsworth, Panduit, APC/Schneider) |
| Tier 2 confirmed | 6 |
| Tier 3 (weak evidence) | 10 |
| Tier 4 (inferred only) | 5+ |
| Manufacturer directories checked | 18 |
| LinkedIn posts scanned for evidence | 181 |
| Suppliers upgraded during verification | 5 (moved up at least one tier) |
| New suppliers discovered (not on logo wall) | 3 (PDI Powerwave, OptiCool via LinkedIn) |
| Total research time | ~5 hours |
| Evidence sources per Tier 1 supplier | 4-6 |

## Pitfalls

1. **Logo wall inflation:** Companies routinely list suppliers they have purchased from once as "partners." A logo wall with 25 logos may represent only 3-5 deep relationships. Never take logo walls at face value.

2. **Stale partnerships:** A company may have been an authorized reseller 3 years ago but lost authorization after an acquisition (e.g., Great Lakes acquired by Vertiv). Always check current manufacturer directories, not cached results.

3. **Authorization vs. purchase:** Being able to buy a product is different from being an authorized reseller. Anyone can buy APC UPS units from distribution. Being listed on APC's partner directory means something qualitatively different.

4. **White-label attribution:** Private-label products are intentionally hard to trace. The company wants you to think they manufacture it. Look for: identical specs to a known manufacturer, founder's prior employer connections, and lack of any manufacturing facility at the company's address.

5. **Era contamination from LinkedIn:** A founder's LinkedIn post from 2019 showing "Protector Cabinets" is from their Emcor career, not the current company. Always apply era validation before attributing LinkedIn evidence to the current company.

6. **Tariff schedule changes:** Tariff rates change with each administration and trade negotiation. Always cite the date of the tariff schedule used and note that rates may have changed.

7. **Distributor vs. manufacturer confusion:** Some "suppliers" on a partner wall are actually distributors (e.g., Anixter, WESCO), not manufacturers. Distinguish between manufacturer relationships (product-specific) and distributor relationships (logistics/fulfillment).

8. **Inclusive "we" language:** "We build in Jacksonville, FL" may mean "our supplier partner builds there," not the company itself. Verify who actually manufactures at each claimed location.

## Real-World Example

**Target:** BROGAV Solutions (Maple Grove, MN)
**Industry:** Data center physical infrastructure VAR
**Partner wall:** 25+ supplier logos claimed

**Key verification findings:**
- **Gateview Technologies:** Upgraded Tier 4 -> Tier 1 after discovering BROGAV listed on Gateview.com/where/ as 1 of 9 National Certified Partners, with Celina Berglund as named contact.
- **Vertiv:** Upgraded from "surplus only" -> confirmed partner after LinkedIn post: "Did you know BROGAV Solutions is a partner of VERTIV?"
- **OptiCool:** Upgraded from "possible" -> confirmed after LinkedIn image showed BROGAV listed as "Featured Partner" on OptiCool's booth at a trade show.
- **PDI Powerwave:** Discovered as NEW stocking supplier from LinkedIn post showing "100s of end feeds" in inventory -- not on the logo wall at all.
- **Chatsworth (CPI):** Confirmed Tier 2 via product page references and 3 LinkedIn posts, but not found on CPI's partner directory.
- **Eaton/Schneider:** Remain Tier 2 -- on the logo wall and "Trusted Manufacturer Partners" card, but no manufacturer-side confirmation found.
- **Private-label cabinets:** Identified as probable white-label via Celina's Emcor background + spec matching. Manufacturing origin unknown -- flagged as tariff risk.

**Tariff finding:** Gateview's Jacksonville, FL manufacturing = 0% tariff + BAA compliant. Unknown cabinet manufacturer (if Chinese origin) = 25-35% tariff + BAA non-compliant. This tariff delta is a material competitive factor for government contract bids.

## Output Template

```
# Supplier Verification Report: [Target Company]

## Summary
- Total claimed partnerships: [N]
- Tier 1 (Anchor): [N] suppliers
- Tier 2 (Specialty): [N] suppliers
- Tier 3 (Project-Spec'd): [N] suppliers
- Tier 4 (Inferred): [N] suppliers
- Verification rate: [X]% of claims verified with 2+ sources
- Suppliers upgraded during verification: [N]
- New suppliers discovered (not on logo wall): [N]

## Tier Classification

### Tier 1: Anchor Partners
| Supplier | Score | Evidence Summary | Products | Mfg Origin |
|---|---|---|---|---|

### Tier 2: Specialty Partners
| Supplier | Score | Evidence Summary | Products | Mfg Origin |
|---|---|---|---|---|

### Tier 3: Project-Spec'd
| Supplier | Score | Evidence Summary | Products | Mfg Origin |
|---|---|---|---|---|

### Tier 4: Inferred
| Supplier | Basis | Confidence | Products | Mfg Origin |
|---|---|---|---|---|

## Product-to-Supplier Map
| Product Category | Primary Supplier | Secondary | Stocking Status | Est. Margin |
|---|---|---|---|---|

## Tariff Exposure Matrix
| Supplier | Product | Mfg Location | HTS Code | Total Rate | BAA/TAA | Risk |
|---|---|---|---|---|---|---|

## Supplier Risk Register
| Risk | Supplier(s) | Severity | Probability | Impact | Mitigation |
|---|---|---|---|---|---|

## Evidence Gaps
- [ ] Suppliers with unverified authorization status
- [ ] Manufacturing origins not confirmed
- [ ] Products without clear supplier attribution

## Methodology
- Manufacturer directories checked: [N]
- LinkedIn posts reviewed: [N]
- Web searches executed: [N]
- Date of tariff schedule used: [YYYY-MM-DD]
```
