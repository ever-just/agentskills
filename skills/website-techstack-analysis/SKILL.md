# Website Tech Stack Analysis

> Uncover the full technology stack powering any website using open-source tools. Returns frameworks, CMS, CDN, analytics, hosting, server software, and security headers.

---

## Prerequisites

### Required tools (install once)

```bash
# ProjectDiscovery httpx — the primary scanner
go install -v github.com/projectdiscovery/httpx/cmd/httpx@latest

# webanalyze — Wappalyzer port for Go (backup/cross-validation)
go install github.com/rverton/webanalyze/cmd/webanalyze@latest
```

### Optional tools

```bash
# web-check — comprehensive all-in-one OSINT (Node.js)
# https://github.com/lissy93/web-check
git clone https://github.com/lissy93/web-check.git && cd web-check && npm install

# py-wappalyzer — Python implementation
pip install py-wappalyzer
```

### MCP servers (for Claude Code integration)

```json
// Add to ~/.claude/settings.json or mcp_config.json
{
  "domain-data-mcp": {
    "command": "npx",
    "args": ["domain-data-mcp"]
  }
}
```

---

## Workflow

### Phase 1: Primary scan with httpx

Run ProjectDiscovery's httpx with tech detection enabled:

```bash
# Single domain
~/go/bin/httpx -u https://TARGET.com -tech-detect -status-code -title -server -cdn -json -follow-redirects

# Multiple domains (batch)
echo -e "https://domain1.com\nhttps://domain2.com" | ~/go/bin/httpx -tech-detect -status-code -title -server -cdn -json -follow-redirects

# Full probe (includes TLS, headers, hashes)
~/go/bin/httpx -u https://TARGET.com -tech-detect -status-code -title -server -cdn -tls-probe -hash md5 -jarm -json -follow-redirects
```

**Output fields to extract:**
- `tech` — array of detected technologies (frameworks, CMS, analytics, etc.)
- `webserver` — server software
- `cdn` — CDN provider if detected
- `status_code` — HTTP status
- `title` — page title
- `chain_status_codes` — redirect chain
- `final_url` — where the domain ultimately resolves
- `a` — IP addresses
- `cpe` — Common Platform Enumeration entries (software versions)

### Phase 2: DNS infrastructure analysis

```bash
# MX records — reveals email provider
dig TARGET.com MX +short

# TXT records — reveals SPF, verification tokens
dig TARGET.com TXT +short

# DMARC policy
dig _dmarc.TARGET.com TXT +short

# DKIM selectors (Microsoft 365)
dig selector1._domainkey.TARGET.com CNAME +short
dig selector2._domainkey.TARGET.com CNAME +short

# DKIM selectors (Google Workspace)
dig google._domainkey.TARGET.com TXT +short

# Autodiscover (Microsoft 365)
dig autodiscover.TARGET.com CNAME +short

# NS records
dig TARGET.com NS +short

# CNAME for www
dig www.TARGET.com CNAME +short
```

### Phase 3: Certificate transparency

```bash
# Find all subdomains via crt.sh
curl -s "https://crt.sh/?q=%25.TARGET.com&output=json" | python3 -c "
import json, sys
data = json.load(sys.stdin)
subs = set()
for entry in data:
    for name in entry.get('name_value','').split('\n'):
        name = name.strip().lstrip('*.')
        if name: subs.add(name)
for s in sorted(subs):
    print(s)
"
```

This reveals:
- Subdomains (staging, dev, api, mail, notify, etc.)
- Certificate issuers (Let's Encrypt = automated; Sectigo/DigiCert = enterprise)
- Certificate history (how long the domain has been active)

### Phase 4: Sitemap and page discovery

```bash
# Fetch sitemap index
curl -s "https://www.TARGET.com/sitemap.xml"

# Robots.txt (may reveal hidden paths)
curl -s "https://www.TARGET.com/robots.txt"
```

### Phase 5: Cross-validate with webanalyze (optional)

```bash
# Update fingerprint database
webanalyze -update

# Scan
webanalyze -host https://TARGET.com -output json
```

---

## Output template

```markdown
# Tech Stack Report: [DOMAIN]

**Scan date:** YYYY-MM-DD
**Final URL:** [where domain resolves after redirects]

## Website platform
- **CMS/Builder:** [e.g., Wix, WordPress, Shopify, custom]
- **Frontend framework:** [e.g., React, Vue, Angular, vanilla]
- **Server:** [e.g., Nginx, Apache, Pepyaka (Wix), Cloudflare]
- **CDN:** [e.g., Cloudflare, Google Cloud CDN, Fastly]
- **Hosting:** [e.g., AWS, GCP, Wix Cloud, DigitalOcean]

## Analytics and tracking
- **Analytics:** [e.g., Google Analytics G-XXXXXXX]
- **Tag management:** [e.g., GTM-XXXXXXX]
- **Advertising pixels:** [e.g., theTradeDesk, TikTok, Meta]

## Email infrastructure
- **MX provider:** [e.g., Microsoft 365, Google Workspace, no MX]
- **SPF:** [record]
- **DMARC:** [policy]
- **DKIM:** [selectors found]

## Subdomains discovered
- [list from crt.sh]

## Security
- **HSTS:** [yes/no]
- **HTTP/3:** [yes/no]
- **TLS version:** [e.g., TLS 1.3]
- **Certificate issuer:** [e.g., Let's Encrypt, Sectigo]

## Libraries and dependencies
- [list from tech array and CPE entries]

## IP addresses
- [list]

## ASN
- [ASN number and owner]
```

---

## Key open-source repos

| Tool | Stars | Language | URL |
|------|-------|----------|-----|
| lissy93/web-check | 33,613 | Node.js | https://github.com/lissy93/web-check |
| projectdiscovery/httpx | — | Go | https://github.com/projectdiscovery/httpx |
| rverton/webanalyze | 1,144 | Go | https://github.com/rverton/webanalyze |
| projectdiscovery/wappalyzergo | 1,051 | Go | https://github.com/projectdiscovery/wappalyzergo |
| enthec/webappanalyzer | 522 | JS | https://github.com/enthec/webappanalyzer |
| lissy93/wapalyzer | 315 | JS | https://github.com/lissy93/wapalyzer |

## MCP servers

| Server | URL |
|--------|-----|
| domain-data-mcp | https://github.com/Rumblingb/domain-data-mcp |
| mcp-shodan | https://github.com/w0h1v/mcp-shodan |
| mcp-security-hub | https://github.com/FuzzingLabs/mcp-security-hub |

---

## Integration with other skills

- **intelligence-dossier** — feed tech stack data into `01_Company_Profile/`
- **open-source-traffic-analysis** — combine with traffic estimates for full web presence picture
- **domain-email-enumeration** — DNS/MX findings feed directly into email discovery
- **competitor-identification** — compare tech stacks across competitors
