# Contact & people/company enrichment

B2B email finders, email validation, firmographic resolvers, knowledge graphs, and academic
identity. Ranked by free-tier value + reverse-lookup capability.

> Free-tier credit numbers change constantly — treat every quota below as "last-checked,
> re-verify." The durable facts are *which direction each tool works* and *whether it needs a key*.

## B2B email finders / people databases

### Apollo.io API  [free-key]
- **Input → output:** name+company/domain, email, or LinkedIn URL → **People Match** (verified work
  email, title, dept, LinkedIn, employment history); **Org Enrich** (firmographics/tech/funding);
  **People Search** (credit-free enumeration by title/dept).
- **Call:** `curl -s -X POST "https://api.apollo.io/api/v1/people/match" -H "X-Api-Key: $APOLLO_KEY" -H "Content-Type: application/json" -d '{"first_name":"Jane","last_name":"Doe","domain":"acme.com"}'`
- **Use:** 270M+ contacts; forward **and** reverse (email→person). People Search enumerates a
  company's staff for free. (An Apollo MCP server is also available in this environment.)
- **Caveats:** Email reveal + personal-email/mobile may cost credits or be gated to paid. The
  credit-free primitive is People **Search**.

### People Data Labs (PDL)  [free-key]
- **Input → output:** any mix of name/company/email/phone/LinkedIn URL → merged profile (emails
  work+personal, phones, full job history, education, skills, socials, match likelihood). Company
  enrich + search.
- **Call:** `curl -sG 'https://api.peopledatalabs.com/v5/person/enrich' -H 'X-Api-Key: $PDL_KEY' --data-urlencode 'profile=linkedin.com/in/seanthorne'`
- **Use:** Deep single-call enrichment; email→person and name+company→email both work.
- **Caveats:** Emails may be SHA-256 hashed on lower tiers; search needs paid volume.

### Enrich.so  [free-key]
- **Input → output:** headline is **email → full identity** (reverse email lookup: name, title,
  seniority, dept, employment history, education, location, skills, socials). Also forward finder +
  company enrich.
- **Call:** `curl -s -X POST 'https://api.enrich.so/v1/person' -H 'Authorization: Bearer $ENRICH_KEY' -H 'Content-Type: application/json' -d '{"email":"sarah@techcorp.io"}'`
- **Use:** The "identifier → rich record" pattern starting from an email.
- **Caveats:** Free 100 credits ≈ 10 deep lookups; phone finder is expensive.

### LeadMagic  [free-key]
- **Input → output:** name+domain → verified email; **LinkedIn/profile URL ↔ email+phone** (genuine
  reverse); mobile finder; company enrich; visitor ID. Official MCP server.
- **Call:** `curl -s -X POST 'https://api.leadmagic.io/email-finder' -H 'X-API-Key: $LEADMAGIC_KEY' -H 'Content-Type: application/json' -d '{"first_name":"Jane","last_name":"Doe","domain":"acme.com"}'`
- **Use:** GTM/agent-first; profile-URL→email+mobile reverse is the differentiator. Billed on hits only.

### More waterfall members  [free-key]
- **Tomba.io** — domain→emails + name+domain→verified email + email→company. `X-Tomba-Key`+`X-Tomba-Secret`; verification free on all plans.
- **Snov.io** — domain search + finder + 7-tier verifier. OAuth2 token + async task pattern; **perpetual ~50 credits/mo** free — good always-on secondary.
- **Prospeo** — name+company→verified email, LinkedIn-URL→email/mobile, domain search (`X-KEY`). (Also in `domain-email-enumeration`.)
- **CUFinder** — 15+ narrow identifier→identifier converters (name→domain, domain→LinkedIn, email→phone) — good for chains.
- **Enrow.io** — hosted waterfall that fans out across sub-providers, charges on success.
- **Skrapp.io** — name+domain→email; often "catch-all"-flagged.
- **Dropcontact** — GDPR-first, no stored DB (generates + SMTP-verifies live); async batch; strong FR/EU.
- **Datagma** `[shaky]` — bundles person+company per credit, strong on mobiles; free amount undocumented.

### Paid-only (no real free tier)  [paid]
- **RocketReach** (700M profiles, strong personal-email/mobile + true reverse; API = Pro plan) ·
  **Findymail** (bounce guarantee) · **Anymail Finder** (trial needs a card, 7-day expiry) ·
  **Kaspr** (API is paid; strong EU mobiles + LinkedIn→contact).

## Email verification / attribute enrichment

### Abstract API — Email Validation  [free-key]
- **Input → output:** one email → deliverability, `is_format_valid`/`is_mx_valid`/`is_smtp_valid`/
  `is_catchall`/`is_disposable`/`is_role`/`is_free_email`, `quality_score`, `suggested_correction`.
- **Call:** `curl -s 'https://emailvalidation.abstractapi.com/v1/?api_key=$ABSTRACT_KEY&email=johnsmith@gmail.com'`
- **Use:** The closest "Gravatar-style" primitive here — hand it an address, get structured JSON;
  validate pattern-inferred guesses without running your own SMTP handshake.
- **Caveats:** Annotates, doesn't discover. Free ~100/mo. Catch-all domains stay indeterminate.

## Company-name → domain / firmographics

### Clearbit Company Autocomplete  [keyless]
- **Input → output:** partial company name → `[{name, domain, logo}, …]` best-guess canonical domain.
- **Call:** `curl -s 'https://autocomplete.clearbit.com/v1/companies/suggest?query=stripe'`
- **Use:** The classic **name → domain** first hop that feeds every domain-keyed lookup. Still live
  post-HubSpot acquisition.
- **Caveats:** Only this endpoint remains free (full Clearbit = paid HubSpot Breeze). The Clearbit
  Logo API was retired 2025-12-08 — the `logo` field may be null; use Brandfetch for logos. No auth →
  could vanish; treat as a convenience.

### Brandfetch  [free-tier]
- **Input → output:** domain → logo, colors, fonts, description, and **social handles**.
- **Call:** `curl -s 'https://api.brandfetch.io/v2/brands/example.com' -H 'Authorization: Bearer $BRANDFETCH_KEY'`
- **Use:** Post-Clearbit-Logo replacement + a domain→social-handles pivot.

### Hunter.io `email-count`  [keyless]
- **Input → output:** domain → total known emails **by department** (exec/it/finance/sales/hr…) +
  seniority — no key, no credits.
- **Call:** `curl -s 'https://api.hunter.io/v2/email-count?domain=stripe.com'`
- **Use:** Instantly sizes a target's mail footprint + org shape before spending Hunter credits.

## Knowledge graphs (the universal cross-ecosystem pivot)

### Wikidata — SPARQL + EntityData JSON  [keyless]
- **Input → output:** company/person entity → dozens of cross-linked external IDs: LinkedIn company
  (P4264), Twitter/X (P2002), GitHub (P2037), ORCID (P496), Crunchbase (P2088), SEC CIK (P5531),
  VIAF, official website, ticker, parent/subsidiary (P355/P749), founders, key people (P169/P3320).
- **Call:** `curl -s 'https://www.wikidata.org/wiki/Special:EntityData/Q478214.json'` · SPARQL at
  `https://query.wikidata.org/sparql`
- **Use:** The best keyless "one entity → everything and its IDs" hub — resolve an entity once, then
  fan out to every ID-keyed source above. Pairs with GLEIF/Clearbit.
- Quick blurb: **Wikipedia REST** `https://en.wikipedia.org/api/rest_v1/page/summary/{title}`.

## Academic / researcher identity

For R&D-heavy, biotech, ML, university, and deep-tech targets — the academic analogue of the
developer-identity cluster.

### ORCID — Public API  [keyless]
- **Input → output:** person → name, employment/affiliation history, education, works, linked
  external IDs, sometimes public email. Searchable **by email**.
- **Call:** `curl -s -H 'Accept: application/json' 'https://pub.orcid.org/v3.0/expanded-search/?q=email:jane@uni.edu'` ·
  record: `https://pub.orcid.org/v3.0/{orcid}/record`
- **Use:** A true **email→identity** and **name→affiliation** oracle for researchers.

### OpenAlex  [keyless]
- **Input → output:** author name → institution, ORCID, works, co-author graph (250M+ works).
- **Call:** `curl -s 'https://api.openalex.org/authors?search=Jane+Doe&mailto=you@example.com'`
- **Caveats:** Use the polite pool via `?mailto=`.

### Supporting  [keyless / free-key]
- **Crossref** — `https://api.crossref.org/works?query.author=...` (authors, affiliations, sometimes
  ORCID/emails). · **ROR** — `https://api.ror.org/organizations?query=...` (org resolver). ·
  **Semantic Scholar** (free key).
