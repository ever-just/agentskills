# Domain Email Enumeration

> Discover all email addresses, mail infrastructure, and contact patterns associated with a target domain using open-source OSINT tools.

---

## Prerequisites

### Required tools

```bash
# theHarvester — gold standard email/subdomain harvester (16K+ stars)
pipx install git+https://github.com/laramies/theHarvester.git

# holehe — checks email against 120+ sites via "forgot password" endpoint
pip install holehe  # (use a venv: python3.12 -m venv /tmp/osint-venv)
```

### Email verification (SMTP RCPT TO)

```bash
# AfterShip email-verifier — Go library with SMTP check + catch-all detection
# Build from source:
mkdir -p /tmp/email-verify-run && cd /tmp/email-verify-run
# See verify_emails.go template in this skill for usage
# Repo: https://github.com/AfterShip/email-verifier (1,576 stars, MIT license)

# Alternative: reacherhq/check-if-email-exists (Rust, 8,789 stars, AGPL)
# Has M365 B2B/B2C-specific verification modes
# Install: download binary from GitHub releases or build with cargo
```

### Optional tools

```bash
# mosint — modern email OSINT in Go
go install github.com/alpkeskin/mosint@latest

# linkedin2username — generate email lists from LinkedIn company pages
pip install linkedin2username

# h8mail — email breach hunting
pip install h8mail
```

### MCP servers

```bash
# OpenOSINT — 9 OSINT tools including email enumeration (holehe-based)
pip install openosint
claude mcp add openosint -- python3 -m openosint.mcp_server

# theHarvester MCP wrapper
# https://github.com/schwarztim/sec-theharvester-mcp
```

---

## Workflow

### Phase 1: DNS reconnaissance (email infrastructure)

Before hunting for individual emails, understand the domain's mail setup:

```bash
# MX records — who handles email
dig TARGET.com MX +short

# SPF record — authorized mail servers
dig TARGET.com TXT +short | grep spf

# DMARC policy
dig _dmarc.TARGET.com TXT +short

# Microsoft 365 indicators
dig autodiscover.TARGET.com CNAME +short
dig selector1._domainkey.TARGET.com CNAME +short
dig selector2._domainkey.TARGET.com CNAME +short

# Google Workspace indicators
dig google._domainkey.TARGET.com TXT +short
dig _dmarc.TARGET.com TXT +short  # look for rua/ruf mailto addresses
```

**What this tells you:**
- **MX → outlook.com / protection.outlook.com** = Microsoft 365
- **MX → google.com / googlemail.com** = Google Workspace
- **MX → mimecast / proofpoint** = enterprise email security gateway
- **SPF includes** reveal additional email services (marketing platforms, CRMs)
- **DMARC rua/ruf** mailto addresses can reveal monitoring emails or third-party services

### Phase 2: theHarvester (bulk email discovery)

```bash
# Run with free sources (no API keys needed)
theHarvester -d TARGET.com -b crtsh,dnsdumpster,duckduckgo,hackertarget,rapiddns,urlscan -l 500

# With API keys configured (~/.theHarvester/api-keys.yaml)
theHarvester -d TARGET.com -b all -l 500

# Output to file
theHarvester -d TARGET.com -b crtsh,duckduckgo,rapiddns,urlscan -l 500 -f /tmp/harvest_results
```

**Extracts:** emails, subdomains, hosts, IPs, ASNs, interesting URLs

### Phase 3: Website scraping (contact pages)

For Wix/SPA sites where WebFetch can't see rendered content, use alternative approaches:

```bash
# Google cache / cached version
# Search: "site:TARGET.com email" OR "site:TARGET.com contact"
# Search: "TARGET.com" "@TARGET.com"

# Wayback Machine for historical email addresses
curl -s "http://web.archive.org/cdx/search/cdx?url=TARGET.com/contact*&output=json&fl=timestamp,original&limit=20"

# PDF metadata (emails often in author/creator fields)
# Download PDFs from site, then: exiftool *.pdf | grep -i email
```

### Phase 4: Email pattern inference

Most companies follow predictable patterns. Once you know one real email, you can infer others:

| Pattern | Example | Prevalence |
|---------|---------|------------|
| first@domain.com | celina@brogavsolutions.com | Very common (small companies) |
| first.last@domain.com | celina.berglund@domain.com | Most common (enterprises) |
| flast@domain.com | cberglund@domain.com | Common |
| firstl@domain.com | celinab@domain.com | Less common |
| first_last@domain.com | celina_berglund@domain.com | Rare |

**To validate inferred emails:**

```bash
# holehe — check if email is registered on 120+ sites
holehe TARGET_EMAIL@domain.com --only-used

# SMTP verification (careful — can trigger alerts)
# Use a verification service or check MX + RCPT TO manually
```

### Phase 5: People-sourced enumeration

Cross-reference known employees with email patterns:

1. **LinkedIn company page** — list all employees
2. **RocketReach / Prospeo / Hunter.io** — email lookup by name + company
3. **Press releases** — often include contact emails
4. **PDF metadata** — author fields contain emails
5. **WHOIS history** — registrant email (often redacted now)
6. **Job postings** — application emails, HR contacts
7. **Event registrations** — speaker bios, sponsor contacts
8. **GitHub / open source** — commit emails

### Phase 6: Breach and exposure check

```bash
# h8mail — check for breached credentials
h8mail -t email@TARGET.com

# holehe — check account registrations
holehe email@TARGET.com --only-used --csv
```

### Phase 7: Functional/role-based emails

Always check these common functional addresses:

```
sales@TARGET.com
info@TARGET.com
support@TARGET.com
admin@TARGET.com
contact@TARGET.com
careers@TARGET.com
hr@TARGET.com
press@TARGET.com
media@TARGET.com
marketing@TARGET.com
billing@TARGET.com
abuse@TARGET.com
postmaster@TARGET.com
webmaster@TARGET.com
```

---

## Output template

```markdown
# Email Enumeration Report: [DOMAIN]

**Scan date:** YYYY-MM-DD
**Tools used:** theHarvester, holehe, DNS analysis, web scraping

## Email infrastructure
- **MX provider:** [Microsoft 365 / Google Workspace / other]
- **SPF record:** [full record]
- **DMARC policy:** [none/quarantine/reject]
- **DKIM:** [selectors found]
- **Inferred email platform:** [based on MX + autodiscover + DKIM]

## Discovered emails

| Email | Person / Role | Source | Confidence |
|-------|--------------|--------|------------|
| ... | ... | ... | High/Med/Low |

## Email pattern
- **Detected pattern:** [e.g., first@domain.com]
- **Based on:** [confirmed emails]

## Inferred emails (unverified)

| Email | Person | Basis |
|-------|--------|-------|
| ... | ... | Pattern inference from [known email] |

## Functional emails tested

| Email | Status |
|-------|--------|
| sales@ | Active |
| info@ | Unknown |
| ... | ... |

## Breach exposure
- [results from h8mail / holehe if run]

## Notes
- [any observations about email security posture, SPF strictness, etc.]
```

---

## Key open-source repos

| Tool | Stars | What it does | URL |
|------|-------|-------------|-----|
| laramies/theHarvester | 16,463 | Emails, subdomains, hosts from 20+ sources | https://github.com/laramies/theHarvester |
| megadose/holehe | — | Check email registration across 120+ sites | https://github.com/megadose/holehe |
| alpkeskin/mosint | 5,867 | Automated email OSINT (Go) | https://github.com/alpkeskin/mosint |
| khast3x/h8mail | 5,041 | Email breach hunting | https://github.com/khast3x/h8mail |
| initstring/linkedin2username | 1,731 | Generate emails from LinkedIn | https://github.com/initstring/linkedin2username |
| p1ngul1n0/blackbird | 6,135 | Username/email search across platforms | https://github.com/p1ngul1n0/blackbird |

## MCP servers

| Server | URL |
|--------|-----|
| OpenOSINT | https://github.com/OpenOSINT/OpenOSINT |
| sec-theharvester-mcp | https://github.com/schwarztim/sec-theharvester-mcp |
| osint-mcp-server | https://github.com/badchars/osint-mcp-server |
| mcp-osint-server | https://github.com/himanshusanecha/mcp-osint-server |

---

## Integration with other skills

- **website-techstack-analysis** — DNS/MX findings shared between both skills
- **intelligence-dossier** — populate `01_Company_Profile/email_contacts.md` and `02_People_and_Organization/`
- **company-legal-reputation-research** — registrant emails from WHOIS history
- **deep-research** — Phase 3 (SEARCH) can find emails in press releases, PDFs, event pages
