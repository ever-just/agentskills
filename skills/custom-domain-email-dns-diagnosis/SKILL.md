---
name: custom-domain-email-dns-diagnosis
description: Diagnose and architect email on a CUSTOM DOMAIN when a registrar-vs-DNS-host split, delegated nameservers, or missing infra is blocking a working setup. Use when a domain's DNS/email 'won't configure', when a registrar API returns 'no zone' / cannot write records, or when deciding how to stand up mailboxes on a domain. Core insights it teaches: registrar != DNS host (a domain REGISTERED at GoDaddy can have its nameservers DELEGATED to Vercel/Netlify/Cloudflare, so the registrar is NOT authoritative and its DNS API returns 'no zone' — you must check where the nameservers actually point via dig NS BEFORE assuming the registrar can manage DNS, then write records at the real DNS host); email records (MX + TXT for SPF/DKIM/DMARC) are INDEPENDENT of the site's A/CNAME, so adding them CANNOT break a live website (they live in a different namespace than the records serving the site); matching the email architecture to the available infra (native platform mailboxes vs forwarding-to-Gmail vs full Google Workspace); and giving an honest 'you cannot do X without Y' explanation rather than leaving a broken half-setup. NOT for OSINT fingerprinting of an existing provider (use [[domain-email-enumeration]]), NOT for GoDaddy-specific record-write syntax once GoDaddy IS authoritative (use [[godaddy-api]]), and NOT for writing email copy (use [[email-mastery]]). Cross-references [[domain-email-enumeration]], [[godaddy-api]].
---

# Custom-Domain Email / DNS Diagnosis — Agent Skill

Figure out **who actually controls a custom domain's DNS**, why an email setup is failing, and how to architect email correctly for the infra that exists — then either do it or give an honest limitation. The heart of this skill is the **registrar-vs-DNS-host split**: the failure mode where a domain is registered one place but its DNS is served somewhere else, so the registrar's API can't write records at all.

The neighbors cover adjacent mechanics: [[domain-email-enumeration]] READS an existing setup for OSINT; [[godaddy-api]] WRITES records once GoDaddy is authoritative; [[email-mastery]] writes copy. None of them does the diagnosis this skill owns.

## When to use this skill

- Setting up email on a custom domain and records 'won't save' / the registrar API errors.
- A registrar DNS API returns **'no zone'** / 'domain not found' for a domain you know is registered there.
- Deciding HOW to give a domain email (mailboxes vs forwarding vs Workspace) given the platform in use.
- A user asks for an email setup the infra can't support and you need to explain the constraint honestly.

**Do NOT use this skill for**:
- **Fingerprinting an existing provider** for OSINT → [[domain-email-enumeration]].
- **GoDaddy record-write syntax** once GoDaddy IS the authoritative DNS host → [[godaddy-api]].
- **Writing email copy** → [[email-mastery]].

## Core insight 1 — registrar != DNS host (check nameservers FIRST)

A domain has TWO independent roles: the **registrar** (who you bought/renew it from) and the **DNS host** (whose nameservers actually answer for the zone). They are often the SAME, but not always: a domain **registered at GoDaddy** can have its **nameservers delegated to Vercel** (or Netlify/Cloudflare/Route 53). When that's the case, **GoDaddy is not authoritative**, so the **GoDaddy DNS record API returns 'no zone'** and cannot write records — the zone lives at Vercel. So before assuming the registrar's API can manage DNS, **check where the nameservers point**:

```bash
dig +short NS example.com          # who is AUTHORITATIVE (the DNS host)
whois example.com | grep -i 'registrar:'   # who is the REGISTRAR (may differ)
```
If `dig NS` returns `ns1.vercel-dns.com` (etc.) but the registrar is GoDaddy, you MUST write DNS records at **Vercel**, not GoDaddy — and a GoDaddy-API 'no zone' error is EXPECTED, not a bug. Manage DNS at whoever `dig NS` names; use the registrar only to change registration or re-delegate nameservers.

## Core insight 2 — email records can't break the live site

Email records — **MX**, and **TXT** for SPF/DKIM/DMARC — live in a **different namespace** than the **A/CNAME** records that serve the website. Adding MX/TXT does **not** touch the A/CNAME, so **adding email DNS cannot take the site down**. Reassure accordingly: you can add SPF/DKIM/DMARC/MX to a domain with a live site with zero risk to the site, as long as you ADD records (not replace the whole zone — see Pitfalls).

- **MX** → where mail is delivered (e.g. Google Workspace, native platform, a forwarder).
- **SPF** (`TXT @ v=spf1 include:... ~all`) → who may send as the domain.
- **DKIM** (`TXT selector._domainkey ...`) → signing key from the mail provider.
- **DMARC** (`TXT _dmarc v=DMARC1; p=...`) → policy + reporting.

## Core insight 3 — match architecture to infra

Pick the email approach the available infra actually supports:

| Situation | Fit |
|---|---|
| Platform offers native mailboxes (some hosts/registrars) | Use native mailboxes — simplest, one place. |
| Just need to RECEIVE at the domain, forward to an existing inbox | Domain forwarding → Gmail (MX to the forwarder; no new mailbox). Cheap, but SENDING as the domain still needs SPF/DKIM set up at the sending service. |
| Need real mailboxes + sending + calendar | Google Workspace (or M365): set MX + SPF + DKIM + DMARC at the DNS host. |

## Core insight 4 — honest 'you can't do X without Y'

If the infra can't support what's asked, say so plainly rather than leaving a half-working setup. Examples: 'You can't send as name@domain from Gmail without adding this domain to a sending service and publishing its SPF/DKIM'; 'GoDaddy's API can't write these records because your nameservers are Vercel's — set them at Vercel, or move the nameservers back to GoDaddy first.' A clear limitation beats a broken partial config.

## Recipe — diagnose then act

1. **Locate control**: `dig +short NS domain` (DNS host) and `whois` (registrar). If they differ, DNS is written at the DNS host.
2. **Read current mail state**: `dig +short MX domain`, `dig +short TXT domain`, `dig +short TXT _dmarc.domain` (fingerprint per [[domain-email-enumeration]] if useful).
3. **Explain the split** if registrar != DNS host, and where records must go.
4. **Choose architecture** (Core insight 3) for the goal + infra.
5. **Write records at the DNS HOST** (ADD MX/TXT — safe for the site). If that host is GoDaddy, [[godaddy-api]] has the syntax; if Vercel/Cloudflare/etc., use that host's DNS.
6. **Verify** with `dig` after propagation; for sending, validate SPF/DKIM/DMARC align.
7. **Or state the limitation** honestly if the goal isn't reachable with current infra.

## Pitfalls

1. **Assuming the registrar controls DNS.** Always `dig NS` first. A registrar API 'no zone' error usually means the nameservers are delegated elsewhere — that's the diagnosis, not a failure to retry.
2. **Fearing email records will break the site.** MX/TXT are independent of A/CNAME; adding them can't take the site down. (But do ADD — a PUT that REPLACES the whole zone can drop the A/CNAME; see [[godaddy-api]] on PUT-replaces-zone.)
3. **Setting SPF/MX but forgetting DKIM/DMARC.** Receiving works with just MX; SENDING as the domain (deliverability) needs SPF + DKIM aligned and a DMARC policy.
4. **Multiple SPF TXT records.** A domain may have only ONE `v=spf1` record — merge includes, don't add a second.
5. **Leaving a broken half-setup.** If you can't complete it (infra gap, delegated NS you don't control), say what's needed instead of shipping something that silently doesn't work.
6. **Changing nameservers when you only meant to add email.** You don't need to move NS to add email at the current DNS host — only re-delegate if you deliberately want to move DNS control.

## Combining with other skills
- [[domain-email-enumeration]] — fingerprint the existing provider from MX/SPF/DKIM/DMARC before changing anything.
- [[godaddy-api]] — the record-write syntax once GoDaddy IS the authoritative DNS host (PATCH-adds vs PUT-replaces-zone, nameserver switch, 2FA-blocks-NS-change).
