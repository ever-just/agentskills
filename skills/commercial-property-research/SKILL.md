# Commercial Property Research

## Overview

How to research commercial properties (offices, warehouses, industrial spaces) associated with a company using public records, commercial real estate databases, county assessor records, and developer marketing materials. Covers property identification, ownership verification, lease analysis, co-tenant mapping, floor plan acquisition, and market rate comparison.

Developed and validated on BROGAV Solutions LLC (4 addresses: warehouse in Ramsey MN, office in Elk River MN, former HQ in Ramsey MN, registered office at residential address, June 2026). Recovered architectural floor plans, identified the landlord (PSD Land Development / BLIP II LLC), mapped 4 co-tenants, and performed lease rate analysis against market comps.

Use this skill when you need to:
- Verify a company's physical footprint and facility costs
- Assess whether a company owns or leases its space
- Find floor plans or building specifications for due diligence
- Map co-tenants for competitive or partnership intelligence
- Estimate facility costs as a percentage of revenue

---

## Step 1: Identify All Addresses

Collect every address associated with the company from:

| Source | What It Shows |
|--------|-------------|
| Secretary of State filing | Registered office (often residential for LLCs) |
| BBB profile | Public-facing business address |
| Website footer / contact page | Marketing address (may differ from registered) |
| Wayback Machine captures | Historical addresses (company may have moved) |
| SAM.gov / federal registration | Address on file for government contracting |
| ConstructConnect / Blue Book | Subcontractor listings with address |
| Procore | Construction procurement registration |
| D&B / Hoovers | Corporate address |
| Job postings | Sometimes list office location |
| Google Maps | Verify each address is real and identify property type |

**Classify each address:** Office, Warehouse, Former location, Residential (registered office), or Remote (field reps working from home).

---

## Step 2: Property Records

For each commercial address, pull:

### County Assessor Records
- Determine the county first (cities can span multiple counties)
- Search by address or parcel ID (APN)
- Extract: owner name, assessed value, year built, square footage, lot size, property type, tax history
- Common systems: Beacon (Schneider Corp), CAMA, county GIS viewers

### Parcel Ownership
- Owner may be an LLC (holding entity) rather than the company itself
- If the company name does not appear as owner, they are a tenant, not an owner
- Search the owner LLC to find the landlord/developer

### Key Question: Own or Lease?
- If the company is the parcel owner: they own the building (balance sheet asset)
- If a different LLC owns the parcel: the company leases from that LLC
- If a related LLC (e.g., "Brogav Properties LLC") owns it: the founder may own the building personally and lease it to the operating company (common tax optimization)

---

## Step 3: Building Intelligence

### Landlord / Developer
- Search the owner LLC name to find the property management company
- Developers often have marketing websites with building specs, brochures, and floor plans
- Example: PSD Land Development published Phase I and Phase II architectural drawings for Bunker Lake Industrial Park on their website

### Co-Tenants
- Multi-tenant buildings have other companies in adjacent suites
- Search "[address] Suite [number]" for each suite
- Check Google Maps business listings at the address
- Check city business license records
- Co-tenant types reveal the building character (CNC shops = light industrial, law firms = professional office)

### Building Specifications
- Total building sq ft vs. suite sq ft
- Ceiling height (clear height for warehouses, typically 16-28 ft)
- Loading doors: drive-in (grade level) vs. dock-height
- Power capacity (relevant for data center equipment companies)
- Climate control (heated, cooled, or shell only)

---

## Step 4: Floor Plans

Floor plans are the hardest to obtain but the most valuable for understanding a company's operations. Search in this order:

1. **Developer marketing materials.** Developers publish floor plans to attract tenants. Check the developer/landlord's website for brochures, PDFs, or spec sheets. These often show the shell building with demising lines but not tenant-specific buildouts.

2. **Commercial real estate listings.** LoopNet, Crexi, CoStar listings sometimes include floor plans. Listings for adjacent suites in the same building may show the building layout.

3. **City building permits.** Tenant improvement permits (TI permits) include interior partition plans submitted for plan review. Contact the city's building department. Conditional Use Permits (CUPs) for other tenants may include site plans showing the entire building. Example: A CUP for D-BAT batting cages in Suite 700 would include a site plan showing all suites including BROGAV's Suite 500.

4. **Anoka/county GIS.** County GIS viewers sometimes include building footprint data and aerial imagery with parcel overlays.

5. **Google Earth / satellite.** Measure building footprint dimensions. Compare to stated sq ft to verify.

6. **Direct contact.** Call the landlord or property management company and request a floor plan for leasing inquiries.

---

## Step 5: Lease Rate Analysis

If the monthly rent is known:

```
Annual rent = monthly * 12
Rate per sq ft = annual / sq ft
```

Compare against market:
- **County average:** CommercialCafe, LoopNet market reports
- **Metro average:** CBRE, Cushman & Wakefield, WareCRE quarterly reports
- **Submarket average:** Most granular; use the city/corridor name

Typical industrial rates (2026):
- Rural/exurban: $5-$8/sq ft NNN
- Suburban: $8-$12/sq ft NNN
- Urban/infill: $12-$18/sq ft NNN
- Flex/office-warehouse: $10-$16/sq ft NNN

"NNN" (triple net) means the tenant pays base rent plus property taxes, insurance, and common area maintenance (CAM). If the quoted rent includes NNN, the base rent is lower.

### Facility Cost as % of Revenue

```
Facility cost % = total_annual_facility_cost / annual_revenue * 100
```

For small companies ($3-10M revenue), typical range is 2-5% of revenue.

---

## Step 6: Unresolved Ownership

If evidence suggests the company may own a property (e.g., a related LLC appears as owner, or a real estate transaction is referenced), but you cannot confirm:

1. **County deed records.** Search the county recorder's office for deed transfers involving the company name or founder name. Many counties have online deed search.
2. **Secretary of State.** Search for the property-holding LLC (e.g., "Brogav Properties LLC") to confirm its officers match the company's principals.
3. **Property tax records.** The taxpayer name may differ from the deed holder if taxes are paid by a management company.

Flag unresolved ownership as an open question in the deliverable. A company that owns commercial real estate through a related LLC has different financial characteristics than one that leases.

---

## Output Structure

Create a facilities section in the company dossier (`01_Company_Profile/facilities/`) with:

1. **README.md** -- Summary table of all locations, property type, size, cost, status
2. **Floor plan images** -- Saved to the facilities folder with source attribution
3. **Per-location detail sections** covering: address, county, parcel ID, owner, type, size, year built, assessed value, co-tenants, lease rate, market comparison
4. **Open questions** -- Unresolved ownership, missing data, next steps

---

## Companion Skills

- `intelligence-dossier` -- the dossier framework that houses facility data
- `client-discovery-osint` -- co-tenants and facility photos may reveal client relationships
