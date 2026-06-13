# Commercial Property Research

## Overview

How to research a company's physical facilities, warehouse operations, and real estate footprint using only public sources. Covers address discovery, property records, ownership verification, lease analysis, facility intelligence, floor plan acquisition, co-tenant mapping, zoning and permit research, and market rate comparison.

Developed and validated on BROGAV Solutions LLC (4 addresses discovered: warehouse in Ramsey MN, office in Elk River MN, former HQ in Ramsey MN, registered office at residential address; recovered architectural floor plans from the developer's marketing site; identified the landlord as PSD Land Development / BLIP II LLC; mapped 4 co-tenants; found Facebook Marketplace rental listing revealing $9,200/month lease cost; June 2026).

Use this skill when you need to:
- Verify a company's physical footprint and facility costs
- Assess whether a company owns or leases its space
- Find floor plans or building specifications for due diligence
- Map co-tenants for competitive or partnership intelligence
- Estimate facility costs as a percentage of revenue
- Identify expansion capacity or constraints at current locations

---

## When to Use

- **Acquisition diligence:** Verify the target's real estate position (owned assets vs. lease liabilities) before making an offer.
- **Competitive intelligence:** Understand a competitor's warehouse capacity, shipping infrastructure, and expansion room.
- **Credit assessment:** Facility costs as a percentage of revenue indicate operational leverage and fixed-cost risk.
- **Supplier qualification:** Verify that a vendor actually has the warehouse space they claim for staging, integration, or inventory.
- **Employment verification:** A company claiming 25 employees but operating from a 1,200 sq ft office may be overstating headcount.

---

## Prerequisites

- Company name and at least one known address (or the state of incorporation to start from)
- Access to web search and county assessor/recorder websites
- Familiarity with commercial real estate terminology (NNN, CAM, TI, etc.)
- Optional: Google Earth Pro for satellite measurement
- Optional: LoopNet/Crexi account for listing data

---

## Method

### Step 1: Identify All Addresses

Collect every address associated with the company from these sources:

| Source | What It Shows | How to Access |
|--------|-------------|--------------|
| Secretary of State filing | Registered office (often residential for LLCs) | State SOS website, search by entity name |
| BBB profile | Public-facing business address | bbb.org search |
| Website footer / contact page | Marketing address (may differ from registered) | Direct website visit |
| Wayback Machine captures | Historical addresses (company may have moved) | web.archive.org CDX API |
| SAM.gov / federal registration | Address on file for government contracting | sam.gov entity search |
| ConstructConnect / Blue Book | Subcontractor listings with address | thebluebook.com |
| Procore | Construction procurement registration | procore.com |
| D&B / Hoovers | Corporate address and branch locations | dnb.com |
| Job postings | Sometimes list office location or "in-person" requirement | Indeed, LinkedIn, Glassdoor |
| Google Maps / Business Profile | Verify each address is real; identifies property type | maps.google.com |
| USPS address validation | Confirms deliverability and classifies as residential/commercial | tools.usps.com/zip-code-lookup |
| LinkedIn company page | "About" section sometimes lists HQ address | linkedin.com |

**Classify each address:**
- **Office:** Professional workspace, typically leased
- **Warehouse/Industrial:** Staging, inventory, shipping operations
- **Former location:** Company has moved but old address persists in databases
- **Residential (registered office):** LLC formation address, not an operational location
- **Remote/Field:** Employees working from home in sales territories
- **Virtual office:** Regus, WeWork, or similar shared-space address (indicates no permanent presence)

**Address timeline:** Companies move. Map when each address was active by cross-referencing Wayback captures, SOS filings (which update addresses), and job postings from different periods.

---

### Step 2: Property Records

For each commercial address, pull records from the county assessor and recorder.

#### County Assessor Records
- Determine the county first (cities can span multiple counties; e.g., Ramsey, MN is in Anoka County, not Ramsey County)
- Search by address or parcel ID (APN)
- Extract: owner name, assessed value, year built, square footage, lot size, property type, zoning classification, tax history
- Common assessment platforms: Beacon (Schneider Corp), CAMA, county GIS viewers, Esri-based portals

#### Parcel Ownership
- Owner may be an LLC (holding entity) rather than the company itself
- If the company name does not appear as owner, they are a tenant, not an owner
- Search the owner LLC name in the state SOS database to find the landlord/developer

#### Key Question: Own or Lease?

| Scenario | What It Means |
|----------|--------------|
| Company is the parcel owner | They own the building (balance sheet asset, no lease liability) |
| A different LLC owns the parcel | The company leases from that LLC (operating expense) |
| A related LLC (e.g., "Brogav Properties LLC") owns it | The founder may own the building personally and lease it to the operating company (common tax optimization — rental income to the founder, lease deduction for the company) |
| A developer/investment LLC owns it | Standard commercial lease arrangement |

**Why this matters:** A company that owns its real estate has different financial characteristics than one that leases. Owned property is a balance sheet asset that can be collateralized. Leased property is a recurring obligation that constrains cash flow.

---

### Step 3: Building Intelligence

#### Landlord / Developer Research
- Search the owner LLC name to find the property management company or developer
- Developers often have marketing websites with building specs, brochures, and floor plans
- Example: PSD Land Development published Phase I and Phase II architectural drawings for Bunker Lake Industrial Park on their website, revealing suite layouts, loading dock configurations, and building specs that BROGAV never disclosed

#### Co-Tenant Mapping
Multi-tenant buildings have other companies in adjacent suites. Co-tenants reveal the building character and sometimes the target company's industry positioning.

How to identify co-tenants:
- Search "[street address] Suite [number]" for each suite in the building
- Check Google Maps business listings at the address
- Check city business license records
- Search the building name or address on LinkedIn (companies listing it as their location)
- Check the landlord's tenant directory if published

**Co-tenant classification:**
| Co-tenant Type | What It Reveals |
|----------------|----------------|
| CNC shops, fabricators | Light industrial building; compatible with warehouse operations |
| Law firms, accountants | Professional office building; unusual for warehouse operations |
| Other distributors/VARs | Industry cluster; may indicate a logistics-friendly corridor |
| Batting cages, gyms | Flex/industrial space rented to non-traditional tenants; may indicate soft market |

#### Building Specifications
- Total building sq ft vs. individual suite sq ft
- Ceiling height (clear height for warehouses: 16-28 ft typical, 32+ ft for modern logistics)
- Loading doors: drive-in (grade level) vs. dock-height (48" for trailer loading)
- Power capacity (relevant for companies handling electrical equipment — 200A vs. 400A vs. higher)
- Climate control: heated, cooled, or shell only
- Sprinkler system: wet vs. dry (matters for electronics storage)
- Parking: count spots as a proxy for employee capacity (1 spot per 250-500 sq ft of office)

---

### Step 4: Floor Plans

Floor plans are the hardest to obtain but the most valuable for understanding a company's operations. Search in this order (most likely to succeed first):

1. **Developer marketing materials.** Developers publish floor plans to attract tenants. Check the developer/landlord's website for brochures, PDFs, or spec sheets. These often show the shell building with demising lines but not tenant-specific buildouts.

2. **Commercial real estate listings.** LoopNet, Crexi, CoStar listings for the building or adjacent suites sometimes include floor plans. Even if the target's suite isn't listed, a listing for a neighboring suite may show the full building layout.

3. **City building permits.** Tenant improvement permits (TI permits) include interior partition plans submitted for plan review. Contact the city's building department or search their online permit portal. Conditional Use Permits (CUPs) for other tenants may include site plans showing the entire building.
   - Example: A CUP application for D-BAT batting cages in Suite 700 of BROGAV's building included a site plan showing all suites, including BROGAV's Suite 500, with dimensions and access points.

4. **County GIS viewers.** County GIS systems sometimes include building footprint data, aerial imagery with parcel overlays, and measured dimensions.

5. **Google Earth Pro.** Measure building footprint dimensions using the ruler tool. Compare calculated area to stated square footage to verify claims. Satellite imagery also shows loading docks, parking layout, and adjacent lot availability.

6. **Wayback Machine.** Historical LoopNet or Crexi listings (cached by Wayback) may show floor plans for suites that are no longer on the market.

7. **Direct contact.** Call the landlord or property management company and request a floor plan for "leasing inquiries." Most will send a PDF of available and recently leased suites.

---

### Step 5: Lease Rate Analysis

#### If Monthly Rent Is Known

```
Annual rent = monthly * 12
Rate per sq ft = annual / sq ft
```

Example (BROGAV):
```
Monthly rent: $9,200 (from Facebook Marketplace listing)
Annual rent: $9,200 * 12 = $110,400
Suite size: ~8,500 sq ft (from floor plan)
Rate: $110,400 / 8,500 = $12.99/sq ft
```

#### Market Comparison Sources
- **County average:** CommercialCafe, LoopNet market reports
- **Metro average:** CBRE, Cushman & Wakefield, JLL, WareCRE quarterly reports
- **Submarket average:** Most granular; use the city/corridor name (e.g., "Anoka County industrial" or "I-94 corridor")

#### Typical Industrial Rates (2026, Upper Midwest)

| Location Type | Rate Range (NNN) | Notes |
|---------------|-----------------|-------|
| Rural/exurban | $5-$8/sq ft | Low demand, older buildings |
| Suburban | $8-$12/sq ft | Standard industrial parks |
| Urban/infill | $12-$18/sq ft | Close to metro core, constrained supply |
| Flex/office-warehouse | $10-$16/sq ft | Hybrid spaces with office buildout |
| Class A logistics | $8-$14/sq ft | Modern, high-clear, dock-height |

**NNN (triple net)** means the tenant pays base rent plus property taxes, insurance, and common area maintenance (CAM). If the quoted rent includes NNN, the base rent component is lower. Always clarify whether a rate is gross or NNN before comparing.

#### Facility Cost as Percentage of Revenue

```
Facility cost % = total_annual_facility_cost / annual_revenue * 100
```

| Company Size | Typical Range | Notes |
|--------------|--------------|-------|
| $1-3M revenue | 3-8% | Small companies; facility is a large fixed cost |
| $3-10M revenue | 2-5% | Growing companies; revenue grows faster than space needs |
| $10-50M revenue | 1-3% | Established companies; economies of scale |

A facility cost above 5% of revenue for a company over $3M suggests either premium space, excess capacity (growth investment), or revenue underperformance relative to the space committed.

---

### Step 6: Unresolved Ownership

If evidence suggests the company may own a property (e.g., a related LLC appears as owner, or a real estate transaction is referenced), but you cannot confirm:

1. **County deed records.** Search the county recorder's office for deed transfers involving the company name or founder name. Many counties have online deed search portals (e.g., Anoka County uses Fidlar/Tapestry).
2. **Secretary of State.** Search for the property-holding LLC (e.g., "Brogav Properties LLC") to confirm its officers match the company's principals.
3. **Property tax records.** The taxpayer name may differ from the deed holder if taxes are paid by a management company.
4. **Mortgage records.** Recorded mortgages show the lender, amount, and date. A recent mortgage on a commercial property owned by a related LLC suggests an active real estate investment.

Flag unresolved ownership as an open question in the deliverable. A company that owns commercial real estate through a related LLC has materially different financial characteristics than one that leases — owned property provides collateral value, rental income to the founder, and potential appreciation.

---

### Step 7: Facebook Marketplace and Unconventional Sources

Commercial real estate information sometimes appears in unexpected places:

- **Facebook Marketplace:** Small landlords post warehouse rental listings on Facebook. This is how the BROGAV lease rate ($9,200/month) was discovered — the landlord posted the listing with photos, square footage, and monthly rent.
- **Craigslist commercial section:** Small and mid-market commercial spaces listed by owners or small brokers.
- **NextDoor:** Neighborhood discussions about commercial construction, zoning changes, or new tenants.
- **City council meeting minutes:** Zoning variance requests, conditional use permits, and tax abatement applications are discussed in public meetings with recorded minutes.
- **Local newspaper archives:** Groundbreaking ceremonies, ribbon cuttings, and "business moves to new location" articles.

---

## Pitfalls

1. **City name != county name.** Ramsey, MN is in Anoka County, not Ramsey County. Always verify the county before searching assessor records.

2. **Multiple addresses for same company.** A company may have a registered office (residential), a mailing address (PO box or virtual office), and an operational address (warehouse). Don't assume they're the same.

3. **Stale addresses.** Databases update slowly. The BBB or D&B address may be 2-3 years old. Always verify with Google Maps Street View (check the image date) and the company's current website.

4. **Owner LLC obfuscation.** Some property owners use trust names, nominee LLCs, or series LLCs that are difficult to trace back to individuals. If the owner LLC has no SOS filing, it may be registered in another state (Delaware, Wyoming, Nevada are common).

5. **Misreading satellite imagery.** A large parking lot doesn't mean a large company — it may be shared with other tenants. Loading docks visible in imagery don't prove active shipping operations.

6. **NNN vs. gross rent confusion.** A $12/sq ft NNN rate and a $12/sq ft gross rate are very different. NNN adds $3-6/sq ft for taxes, insurance, and CAM. Always clarify the basis.

---

## Real-World Example

**Subject:** BROGAV Solutions LLC

**Addresses discovered:**
1. **7936 Spring Lake Park Blvd, Spring Lake Park, MN 55432** — SOS registered office (residential address of a relative/associate; not operational)
2. **7036 143rd Ave NW, Ramsey, MN 55303** — Former operational HQ (warehouse space in Bunker Lake Industrial Park)
3. **18413 Trott Brook Crossing NW, Elk River, MN 55330** — Residential address (Celina Berglund's home; also appears on some business listings)
4. **6764 143rd Ave NW, Suite 500, Ramsey, MN 55303** — Current warehouse/office (Bunker Lake Industrial Park, Phase II)

**Key findings:**
- Landlord identified as PSD Land Development LLC / BLIP II LLC through Anoka County parcel records
- Floor plans recovered from PSD Land Development's website marketing materials
- Lease rate discovered via Facebook Marketplace listing: $9,200/month for ~8,500 sq ft = $12.99/sq ft NNN
- Facility cost: $110,400/year / $4.5M revenue = 2.5% (healthy ratio)
- Co-tenants: CNC machine shop, batting cages, small manufacturer — confirms light industrial building character
- Unresolved: Whether founder owns any commercial property through a related LLC

---

## Output Template

### Facility Profile

```markdown
# [Company Name] — Facility Profile
Generated: [Date]

## Summary Table
| Location | Type | Size (sq ft) | Own/Lease | Monthly Cost | Status |
|----------|------|-------------|-----------|-------------|--------|

## Location 1: [Address]
- **County:** [Name]
- **Parcel ID:** [APN]
- **Owner:** [Entity name]
- **Property type:** [Office / Warehouse / Industrial / Flex]
- **Building size:** [Total sq ft]
- **Suite size:** [Tenant's portion]
- **Year built:** [Year]
- **Assessed value:** [Amount]
- **Lease rate:** [$X/month = $Y/sq ft NNN]
- **Market comparison:** [Above/below/at market]
- **Co-tenants:** [List]
- **Loading docks:** [Count, type]
- **Parking:** [Count]
- **Floor plan:** [Available / Not found]
- **Photos:** [Source]

## Facility Cost Analysis
- Total annual facility cost: $[X]
- Annual revenue: $[X]
- Facility cost as % of revenue: [X]%
- Market benchmark: [X-Y]%

## Open Questions
- [ ] [Unresolved ownership]
- [ ] [Missing data]
```

---

## Companion Skills

- `intelligence-dossier` — the dossier framework that houses facility data
- `client-discovery-osint` — co-tenants and facility photos may reveal client relationships
- `deep-research` — the 7-phase research pipeline for gathering raw data
- `era-validated-linkedin-analysis` — ensures facility references from LinkedIn are from the correct era
