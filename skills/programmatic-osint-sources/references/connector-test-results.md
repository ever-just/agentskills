# Connector test results (live-verified)

Empirical probe of the personnel/enrichment connectors, run **2026-07-30** from a Claude
session. Test subjects: a small private company (the operator's own, ~1 employee) and a large
public company (Stripe) as a breadth check. **No personal data is recorded here** — only which
connector works, what field *types* come back, and credit cost. Re-verify tiers/costs before
relying on them; they change.

## Scorecard

| Connector | Verified | What it returned | Credit cost observed |
|-----------|:--------:|------------------|----------------------|
| **Lusha** | ✅ | `account_usage`: balance + per-action pricing (no charge). `companies_search` (preview): firmographics, employee count, revenue range, LinkedIn, IT-spend, `canReveal` fields. `prospecting_contact_search`: **84 decision-makers** at the test company — name, title, seniority, department, location, LinkedIn URL returned **free**; email/phone gated behind reveal. | search = **1 cr / page**; email reveal **1 cr**; phone reveal **5 cr** |
| **Phoenix by HG Insights** | ✅ | `company_firmographic`: revenue, employees, NAICS/SIC, HQ, IT-spend, hierarchy. `company_technographic`: full **tech stack** with per-product intensity scores + first/last-verified dates. | free on plan (no per-call credit observed) |
| **Sprouts Data Intelligence** | ✅ | `sprouts_credit_balance` (free). `sprouts_lookup_accounts`: resolved **both** test companies → name, industry, location, employee count. | account lookup did not decrement balance |
| **Vibe Prospecting** | ✅ | `autocomplete` (free). `fetch-entities` (businesses): **12,449 matches** for a firmographic filter; sample rows with name, domain, city, description, NAICS/SIC, logo (size/revenue masked until export). | exploration **free**; export ≈ **1 cr/row** (estimate only, not charged) |

Already-verified in earlier sessions and unchanged: **Apollo**, **Clay**, **G2**, **Twilio**.

## Key gotchas learned

- **Free preview vs paid reveal (Lusha):** names, titles, seniority, department, location, and
  LinkedIn URLs come back **without credits**; only email (1 cr) and phone (5 cr) reveals cost.
  You can build a full org map for near-zero cost, then reveal only the contacts you need.
- **`decision_makers_search` by bare domain returned 0** — use `prospecting_contact_search`
  with `companyDomains` (+ title/seniority filters) instead, or resolve the Lusha company id first.
- **Enterprise-skewed datasets miss small companies:** Phoenix returned `found:true` but **empty**
  for the ~1-employee test company, and Lusha found 0 contacts there. Only **Sprouts** resolved it.
  → For small/SMB targets, the keyless OSINT recipes ([developer-identity](developer-identity.md),
  [infrastructure-recon](infrastructure-recon.md), [public-records](public-records.md)) out-perform
  these B2B databases.
- **Vibe is exploration-free:** run `fetch-entities` / `autocomplete` freely to size a segment;
  credits are only spent on `export-to-csv` / enrichment.

## Best-tool-per-job (from the test)

- **People at a company** → Lusha `prospecting_contact_search` (free preview) → reveal selectively. (Apollo/Clay overlap.)
- **Company firmographics + tech stack** → Phoenix HG (free on plan).
- **Bulk list-building by filter** → Vibe (free exploration, pay per exported row).
- **"Is this company/domain known?"** → Sprouts (only one that resolved the small target).
