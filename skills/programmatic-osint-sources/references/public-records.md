# Public records & registries — company/person → officers, owners, filings, donors

Authoritative, mostly-free government/legal/financial data. Yields **people** (officers, agents,
attorneys, signatories, donors) with names and often addresses. Several are referenced elsewhere in
the repo (`verification-audit`, `company-legal-reputation-research`); the entries below add the
distinct **API-first** primitive.

### UK Companies House API  [free-key]
- **Input → output:** company name/number → profile, full **officer list** (name, role, partial DOB,
  nationality, occupation, correspondence address), **PSC / beneficial owners**, filings, charges.
  Pivot officer → all their UK directorships.
- **Call:** `curl -u $CH_API_KEY: 'https://api.company-information.service.gov.uk/company/00000006/officers'` (key = HTTP Basic username, blank password)
- **Caveats:** **No anonymous access** (401 without a key). Residential addresses redacted. ~600 req/5min.

### GLEIF — LEI API  [keyless]
- **Input → output:** entity name/LEI/BIC/ISIN → legal name, addresses, legal form, registering
  authority, status + **Level-2 who-owns-whom** (direct/ultimate parent, children).
- **Call:** `curl -s 'https://api.gleif.org/api/v1/lei-records?filter%5Bentity.legalName%5D=Apple%20Inc.'`
- **Use:** The free corporate **ownership tree**. Bulk "Golden Copy" 3×/day.
- **Caveats:** Entities only (no natural persons); ownership edges appear only where both parties hold LEIs.

### OpenCorporates API  [free-tier / shaky]
- **Input → output:** cross-jurisdiction (140+) companies + officers/directors/agents.
- **Call:** `curl -s 'https://api.opencorporates.com/v0.4/companies/search?q=acme&api_token=$OC_TOKEN'`
- **Use:** Best **cross-border** company + officer lookup.
- **Caveats:** **No anonymous access** ("Invalid Api Token"). Self-serve free key exists but is
  limited/gated post-acquisition; the reliably-free path is the open-data/journalist license (which
  is share-alike). Commercial/bulk is paid.

### OpenFEC API  [free-key]
- **Input → output:** contributor name/employer → itemized individual contributions with donor
  **NAME + full address + EMPLOYER + OCCUPATION** + amount/date. Pivot employer → its donating employees.
- **Call:** `curl -s 'https://api.open.fec.gov/v1/schedules/schedule_a/?api_key=DEMO_KEY&contributor_name=cook&two_year_transaction_period=2024&per_page=20'`
- **Use:** One of the richest **free US people-enrichment** sources — self-reported employer/occupation
  ties a person to a company + a home address. `DEMO_KEY` works (get an api.data.gov key for 1,000/hr).
- **Caveats:** Correct path is `/v1/schedules/schedule_a/` (not `/v1/schedule_a/` → 404). Only >$200
  aggregate is itemized; employer/occupation self-reported.

### NPPES NPI Registry  [keyless]
- **Input → output:** US healthcare provider/org name/NPI/specialty → name, credentials, practice +
  mailing address, phone, taxonomy; org records surface an authorized-official name.
- **Call:** `curl -s 'https://npiregistry.cms.hhs.gov/api/?version=2.1&first_name=john&last_name=smith&state=CA&limit=5'`
- **Caveats:** US healthcare only; `version=2.1` required; practice (not home) addresses; 200/query cap.

### CourtListener / RECAP — API v4  [free-key]
- **Input → output:** party/company/attorney/judge/docket → dockets, parties, **attorneys (name +
  firm)**, judges, ~8M opinions; RECAP mirrors PACER.
- **Call:** `curl -s 'https://www.courtlistener.com/api/rest/v4/search/?q=acme+corp&type=r' -H 'Authorization: Token $CL_TOKEN'`
- **Caveats:** Free but low limits (~5/min, 50/hr, 125/day). (Referenced in `company-legal-reputation-research`.)

### SEC EDGAR — full-text search + submissions  [keyless]
- **Input → output:** `efts.sec.gov` full-text search (any person/email string across 25 yrs of
  filings) + `data.sec.gov/submissions` (addresses, EIN, Form 3/4/5 **insiders**, DEF 14A officers).
  **Form D** = private raises → named execs/promoters.
- **Call:** `curl -s 'https://efts.sec.gov/LATEST/search-index?q=%22john.doe@acme.com%22' -H 'User-Agent: research you@example.com'` ·
  `curl -s 'https://data.sec.gov/submissions/CIK0000320193.json' -H 'User-Agent: research you@example.com'`
- **Caveats:** **Must send a descriptive User-Agent with an email or you're blocked;** 10 req/s cap.
  (EDGAR generally is in `verification-audit`; the full-text endpoint is the distinct add.)

### USAspending API  [keyless]
- **Input → output:** federal awards, recipient company profiles (UEI, address), and **executive
  compensation** (people data).
- **Call:** `curl -s -X POST 'https://api.usaspending.gov/api/v2/recipient/' -H 'Content-Type: application/json' -d '{"order":"desc","sort":"amount","page":1}'`
- **Use:** Company → federal money + named executives + compensation. (Repo cites USAspending; the
  keyless recipient/exec-comp endpoints are the surface to use.)

### GovInfo API  [free-key]
- Federal docs full-text; Federal Register rules' "For Further Information Contact" = a named agency
  person + phone/email. `api.data.gov` key (`DEMO_KEY`). Document-centric; lower structured yield but
  a genuine people/email source.

### Registries beyond the US/UK
- **France — recherche-entreprises** `[keyless]`: `curl -s 'https://recherche-entreprises.api.gouv.fr/search?q=acme'` → SIREN/SIRET, dirigeants (officers), addresses. Also **INSEE SIRENE** (free key).
- **Germany** — Handelsregister / OffeneRegister.de open dataset.
- **US State Secretary-of-State** (Socrata open-data): e.g. `data.colorado.gov` returns
  registered-agent first/last name + address; NY returns process-service name. No single national
  API; Socrata 4×4 dataset IDs drift. (Repo lists `sos.[state].gov` generally.)

### Sanctions / adverse media
- **OpenSanctions** — `https://api.opensanctions.org` (entity screening; free tier). (Referenced in
  `verification-audit`.)

### Shaky
- **USPTO** `[shaky]`: legacy `api.patentsview.org` retired (410); `search.patentsview.org` needs a
  key with intermittently-paused issuance; the stable path is `data.uspto.gov` (free key). **USPTO
  TSDR** → trademark owner + attorney + correspondent email (free key).
