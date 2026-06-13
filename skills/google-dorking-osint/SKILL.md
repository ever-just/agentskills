# Google Dorking for Company OSINT

> Structured approach to finding publicly indexed documents, exposed files, and hidden intelligence about a target company using Google advanced search operators. Goes beyond generic `site:` queries by leveraging known infrastructure identifiers and searching THROUGH organizations that interact with the target.

---

## When to use

- During due diligence or competitive intelligence gathering
- After identifying a company's tech stack (M365, Google Workspace, Wix, etc.)
- When you need to find documents created by OTHER organizations that reference the target
- To assess a company's security posture (exposed docs = poor hygiene)

---

## The key insight

**Don't just search for the company's own exposed documents. Search for documents about the company created by other organizations.** A 13-person company using M365 probably doesn't share documents via SharePoint. But their OEM partners, event organizers, industry associations, and government agencies all create documents that reference them — and THOSE organizations are the ones likely to have misconfigured sharing.

---

## Workflow

### Phase 1: Gather infrastructure identifiers

Before dorking, collect everything you know about the target's digital footprint:

| Identifier type | Example | Where found |
|----------------|---------|-------------|
| Email domain | @brogavsolutions.com | DNS MX records |
| M365 tenant name | brogavsolutions | From email domain |
| Google Analytics ID | G-XYSJ12Z1RR | httpx tech detection |
| GTM container ID | GTM-WCRCV9R | httpx or page source |
| Canva username | jessabrixius | PDF metadata (exiftool) |
| Wix UGD prefix | 5d9b8a | Wix file URLs |
| Employee maiden names | Celina Roberts | People intelligence |
| Prior employer names | Clearfield, Emcor | LinkedIn profiles |
| DMARC report recipients | lovable.dev | DNS TXT records |
| Known client names | Cologix | Case studies, testimonials |
| Event names | "Let's Break the Ice" | Website, LinkedIn |
| Federal identifiers | UEI, CAGE, DUNS | SAM.gov, D&B |

### Phase 2: Cloud storage dorks (target's own exposure)

**Microsoft 365 (if target uses M365):**
```
site:sharepoint.com "company name"
site:onedrive.live.com "company name"
site:1drv.ms "company name"
"companytenant.sharepoint.com"
"companytenant-my.sharepoint.com"
site:sway.office.com "company name"
site:forms.office.com "company name"
"company name" site:app.powerbi.com
```

**Google Workspace (if target uses Google):**
```
site:drive.google.com "company name"
site:docs.google.com "company name"
```

**Other platforms:**
```
"company name" site:notion.so OR site:notion.site
"company name" site:trello.com
"company name" site:canva.com
"company name" site:docsend.com
"canva_username" site:canva.com
```

### Phase 3: Document type dorks
```
filetype:pdf "company name" -site:company.com
filetype:xlsx "company name"
filetype:pptx "company name"
filetype:docx "company name"
"company name" filetype:pdf internal OR memo OR confidential OR draft
"company name" filetype:xlsx budget OR revenue OR forecast
```

### Phase 4: Person-specific dorks
```
"employee name" filetype:pdf -site:company.com -site:linkedin.com
"employee maiden name" "prior employer" filetype:pdf
"employee name" site:drive.google.com
```

### Phase 5: Third-party document dorks (highest yield)

This is where the real intelligence lives — documents ABOUT the target created by others:

```
# Government/procurement
"company name" site:sam.gov OR site:usaspending.gov OR site:govtribe.com
"company name" vendor OR supplier list site:edu OR site:gov OR site:org

# Industry associations
"company name" site:imasons.org OR site:afcom.com OR site:7x24exchange.org

# Certification databases
"company name" site:wbenc.org OR site:sba.gov OR site:certify.sba.gov

# OEM partner pages
"company name" site:oem-domain.com

# Event platforms
"company name" site:sched.com OR site:eventbrite.com OR site:whova.com

# Construction/procurement platforms
"company name" site:constructconnect.com OR site:thebluebook.com OR site:procore.com

# Business directories
"company name" site:buzzfile.com OR site:smartgirlstories.com

# People intelligence
"company name" site:rocketreach.co OR site:zoominfo.com
```

### Phase 6: Infrastructure-specific dorks
```
# Using known tracking IDs
"GA-MEASUREMENT-ID" (finds other sites using same GA property)
"GTM-CONTAINER-ID"

# Using known file paths
"wix_ugd_prefix" site:wixstatic.com

# Using known email infrastructure
"company-domain.com" inurl:login OR inurl:portal OR inurl:webmail

# Pastebin / code paste sites
"company name" site:pastebin.com OR site:justpaste.it OR site:github.com
```

### Phase 7: Business document dorks
```
"company name" "capability statement" OR "line card" OR "W-9"
"company name" proposal OR quote OR invoice OR "purchase order"
"company name" "org chart" OR "employee directory" OR "phone list"
"company name" "certificate of insurance"
```

---

## Interpreting results

**Zero results across all queries is itself intelligence.** It means:
1. The company doesn't use cloud collaboration tools for external sharing
2. Their M365/Google Workspace is properly configured
3. No employees have accidentally published internal documents
4. The company has a small digital footprint (fewer people = fewer exposure opportunities)

This is a **positive security finding** worth documenting in the dossier.

---

## Common pitfalls

1. **Generic `site:` queries return noise** — always combine with quoted company name
2. **Aggregator results aren't "exposed documents"** — ZoomInfo/RocketReach appearing in results is expected, not a leak
3. **Wix/SPA sites don't expose documents** — content goes through the CMS, not as standalone files
4. **Small companies have small attack surfaces** — 13 people generate less indexable content than 13,000
5. **Absence of evidence ≠ evidence of absence** — documents may exist but not be indexed

---

## Tools

- Web search (Google, Bing, DuckDuckGo — each indexes differently)
- WebFetch for direct page access
- GHDB (Google Hacking Database) at exploit-db.com for pre-built dork templates
- httpx for initial tech stack identification
- exiftool for PDF metadata (author names, Canva usernames)
- DNS tools (dig) for infrastructure identification
