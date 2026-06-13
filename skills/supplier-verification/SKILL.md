# Supplier Verification and Deep Dive

## Overview

How to go from a company's partner logo wall (unverified marketing claims) to confirmed, evidence-ranked supplier relationships with specific products, manufacturing origins, and tariff exposure. Validated on BROGAV Solutions: upgraded 5 suppliers from "inferred" to "confirmed" and discovered 3 previously unknown suppliers by cross-referencing LinkedIn images, manufacturer partner pages, and import records.

## When to Use

- A company claims 25+ supplier partnerships on their website but you need to verify which are real
- You need to determine what products a company actually carries from each supplier
- You need to assess tariff/trade exposure by determining manufacturing country of origin
- You're conducting due diligence where overstated supplier relationships are a red flag

## Method

### Step 1: Tier Classification

Sort all claimed suppliers into 4 evidence-based tiers:

| Tier | Definition | Evidence Required |
|---|---|---|
| **Tier 1 — Anchor** | Confirmed stocking or deep partnership | 3+ independent evidence sources |
| **Tier 2 — Specialty** | Listed on partner wall with corroborating evidence | Logo + 1 additional source |
| **Tier 3 — Project-spec'd** | Listed but likely ordered per-project | Logo only, or logo + category match |
| **Tier 4 — Inferred** | Contextual evidence only | Founder's prior employer, event co-appearance |

### Step 2: Build Evidence Chains

For each supplier, search for evidence across these 8 channels (in priority order):

1. **Manufacturer's partner directory** — The gold standard. Search: `site:[manufacturer].com "where to buy" OR "find a partner" OR "authorized resellers"`. If the company is listed, relationship is CONFIRMED.

2. **Manufacturer case studies** — Search: `site:[manufacturer].com "[company name]"`. Example: RLE Technologies published a BROGAV case study PDF.

3. **LinkedIn co-mentions** — Search: `"[company]" "[supplier]" site:linkedin.com`. Look for: joint event posts, "we're excited to partner with," product announcements.

4. **LinkedIn image analysis** — Event photos showing: supplier rep at company's booth, joint golf hole sponsorship, supplier presentation at company event.

5. **E-commerce product listings** — Check if the company sells the supplier's products on their website/store with specific SKUs and pricing.

6. **Event co-sponsorship** — Both company and supplier sponsor the same event. Indicates commercial relationship.

7. **Team member backgrounds** — Did anyone on the team previously work at the supplier? (Example: Anita Johnson's Schneider Electric background.)

8. **Import/customs records** — ImportGenius, Panjiva, or similar databases. Shows actual shipments between manufacturer and company.

### Step 3: Manufacturer Website Verification

This is the highest-value single check. For each claimed supplier:

```
WebSearch: "[Manufacturer] where to buy authorized reseller partner locator"
WebFetch: [the partner locator page]
Search for: company name on the results page
```

**Example finding:** Gateview Technologies' "Where to Buy" page listed BROGAV Solutions as 1 of 9 National Certified Partners, with Celina Berglund as the contact — upgrading from Tier 4 (inferred) to Tier 1 (confirmed).

### Step 4: Manufacturing Origin Investigation

For private-label or white-label products:

1. **Founder's prior employers** — The most likely white-label source is where the founder previously worked in the same product category
2. **ImportGenius customs records** — Search for the company name; check what they import and from whom
3. **Product spec comparison** — Compare the company's product specs against potential manufacturers' catalogs
4. **Geographic proximity** — Same-state manufacturer = likely supply relationship (lower shipping, local relationships)
5. **"We build in [city]" claims** — Verify WHO builds there. The company may use inclusive "we" to describe a supplier's factory.

### Step 5: Tariff Exposure Matrix

For each confirmed supplier:

| Supplier | Product | Manufacturing Location | HTS Code | Tariff Rate | BAA/TAA? |
|---|---|---|---|---|---|
| [Name] | [Product] | [City, Country] | [Code] | [%] | [Yes/No] |

Key tariff layers (as of 2026):
- Section 301 (China): 25-100%+ depending on product
- Section 232 (steel/aluminum): 25-50%
- MFN base rate: varies by HTS code
- TAA compliance: final assembly in designated country

### Step 6: Product-to-Supplier Mapping

Create a master table: every product category the company sells → which supplier provides it → stocking status → margin estimate.

### Step 7: Era Validation

If evidence comes from LinkedIn or photos, verify it's from the CURRENT company era:
- Check post dates against company founding date
- Look for current company branding (logo, URL, phone number) in images
- "Protector Cabinets" ≠ current company's product if it's a prior employer's brand

## Pitfalls

1. **Inclusive "we" language** — "We build in Jacksonville, FL" may mean "our supplier partner builds there," not the company itself.
2. **Logo wall inflation** — Companies routinely list manufacturers they CAN quote, not just ones they actively sell. Having Eaton on your logo wall doesn't mean Eaton recognizes you as a partner.
3. **Emcor era vs. current era** — A founder who worked at Emcor may still have Emcor product photos on LinkedIn. Don't attribute these to the current company.
4. **Acquired suppliers** — Great Lakes Data Racks was acquired by Vertiv in 2025. The supply relationship may be disrupted or reclassified. Always check for recent M&A.

## Real-World Example

BROGAV Solutions claimed ~25 manufacturer brands on their partner logo wall. After verification:
- **Gateview Technologies**: Upgraded from Tier 4 → Tier 1 after finding BROGAV listed on Gateview's "Where to Buy" page as 1 of 9 National Certified Partners
- **Vertiv**: Upgraded from "surplus only" → confirmed partner after LinkedIn post: "Did you know BROGAV Solutions is a partner of VERTIV?"
- **OptiCool**: Upgraded from "possible" → confirmed after LinkedIn image showed BROGAV listed as "Featured Partner" on OptiCool's booth
- **PDI Powerwave**: Discovered as NEW stocking supplier from LinkedIn post showing "100s of end feeds" in inventory
- **Eaton/Schneider**: Remain Tier 2 — on the logo wall and "Trusted Manufacturer Partners" card, but no manufacturer-side confirmation found

## Output Template

```markdown
# Supplier Verification Report

## Verification Summary
| Supplier | Claimed | Verified Tier | Evidence Sources | Key Finding |

## Tier 1: Confirmed Partners (3+ sources)
[Full profiles with evidence chains]

## Tier 2: Probable Partners (logo + 1 source)
[Profiles with evidence]

## Tier 3: Listed Only (logo wall only)
[List with notes]

## Tier 4: Inferred (no direct evidence)
[Contextual relationships]

## Manufacturing Origin Matrix
| Product | Supplier | Country | Tariff | BAA/TAA |

## Supplier Risk Register
| Risk | Supplier | Severity | Mitigation |

## Research Gaps
| Gap | How to Close |
```
