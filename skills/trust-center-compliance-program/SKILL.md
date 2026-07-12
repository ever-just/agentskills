---
name: trust-center-compliance-program
description: Stand up a self-hosted trust center and author a real, coherent compliance program (SOC 2, ISO 27001, GDPR) for a startup or SaaS — using the open-source Probo platform instead of a paid tool like Vanta or Drata. Use when a company needs a credible public security posture fast: a branded public trust center plus the underlying artifacts (frameworks + controls, core policies, a risk register, asset/data/RoPA inventories, a vendor/sub-processor list, a DPA) that are internally consistent and mapped to each other. Covers deploying and branding Probo, the real gotchas (ProseMirror PDF export, dark-mode theme locking, custom-domain wiring), and how to author the program so controls, policies, and measures line up. Use when the user says "set up a trust center", "we need SOC 2 / ISO 27001 / GDPR", "self-host Probo", "write our security policies", or "build our compliance program".
---

# Trust Center + Compliance Program (self-hosted Probo)

Give a company a **credible security posture** quickly: a branded **public trust
center** plus the **program behind it** — frameworks, controls, policies, a risk
register, inventories, a vendor/sub-processor list, and a DPA that are internally
consistent. Built on **Probo** (open-source compliance/trust platform), self-hosted,
so there is no per-seat SaaS bill.

This produces the **artifacts and public page**, not an audit. An actual SOC 2 /
ISO 27001 attestation still requires an independent auditor; this gets the company
audit-ready and publicly credible.

## When to use

- A startup/SaaS needs to *show* security maturity to customers/partners now.
- You want the underlying program (controls, policies, risk register, RoPA,
  sub-processors, DPA) authored coherently, not as disconnected templates.
- Self-hosting is preferred over Vanta/Drata/SafeBase pricing.

## When NOT to use

- The company needs a signed attestation → engage an auditor (this is prerequisite
  work, not a substitute).
- A fully managed platform is genuinely wanted and budget exists.

---

## Part 1 — Deploy + brand Probo

Probo runs as containers behind a reverse proxy on a small box (see
[[ec2-instance-connect-data-pull]] for keyless prod shell access).

1. **Deploy** the Probo stack via its docker-compose; put it behind nginx on a
   dedicated subdomain (e.g. `trust.<domain>`).
2. **TLS** — issue/renew the cert via ACME. If issuance breaks, check the ACME
   http-01 path routing through nginx before blaming the CA.
3. **Branding without forking the app**: use nginx **`sub_filter`** to rewrite
   the served HTML (product name, logo) at the proxy. Enable it on the right
   `Content-Type` and disable gzip on those responses so `sub_filter` can match.
4. **Backups + secrets**: confirm DB backups run and the app's secret/vault store
   is populated before authoring — losing the program later is worse than a slow start.

### Gotchas that will bite

- **PDF export dumps raw JSON** if ProseMirror rich-text (esp. **table cells**)
  lacks required node attributes. When authoring policies via the API/DB, produce
  well-formed ProseMirror (valid `attrs` on table/cell nodes) or exported PDFs
  show raw document JSON instead of formatted text.
- **Dark mode breaks branding**: light-lock the theme (pin the theme CSS variables
  to light values) unless dark is fully styled, or the trust center renders
  half-branded for dark-mode visitors.
- **Custom domain / www**: set the website's canonical/host field to the exact
  public host (with/without `www`) so links and canonical URLs resolve.

Verify the public trust center renders correctly (light + dark, mobile) with
[[cdp-render-verification]].

## Part 2 — Author the program (coherent, not templated)

Build it so **controls ⇄ policies ⇄ measures** line up. Order that works:

1. **Frameworks + controls** — enable SOC 2, ISO 27001, and GDPR; import their
   control sets in Probo.
2. **Core policy set** — author the standard policies (Information Security,
   Access Control, Acceptable Use, Data Protection/Privacy, Incident Response,
   Business Continuity, Vendor/Third-Party, Change Management, Data Retention,
   Encryption/Key Management, etc.). Write them **specific to the company** (its
   real stack and data flows), not generic boilerplate — strip any "template"
   notices.
3. **Risk register + inventories** — a risk register, plus asset, data, and
   **RoPA** (GDPR Records of Processing Activities) inventories, plus a **vendor /
   sub-processor** list. Ground each in the company's actual providers.
4. **Map it together** — link controls → the policies that satisfy them → the
   measures/evidence. Unmapped controls are the tell of a fake program.
5. **Public content** — publish frameworks, policy summaries, a **DPA**, the
   **sub-processor** list, and an **Updates timeline** so the trust center reads
   as a living program, not a snapshot. Consolidate contact to a single address
   (e.g. `legal@` / `security@`).

### Writing quality

Policies and privacy content are read by real prospects and lawyers — apply
[[beautiful-prose]] / [[humanizer]]: plain, specific, no filler, no invented
certifications or dates. Cite the framework clause where relevant. Never claim an
attestation the company does not hold.

## Deliverables checklist

- [ ] Public trust center live on `trust.<domain>` (TLS valid, branded, light+dark, mobile-verified)
- [ ] SOC 2 / ISO 27001 / GDPR frameworks + controls loaded
- [ ] Core policy set authored (company-specific, no template notices)
- [ ] Risk register + asset/data/RoPA inventories + vendor/sub-processor list
- [ ] Controls mapped to policies + measures (no orphan controls)
- [ ] Public DPA + sub-processor list + Updates timeline published
- [ ] Single canonical contact address

## Related

- [[ec2-instance-connect-data-pull]] — keyless prod shell to the Probo box.
- [[cdp-render-verification]] — verify the public trust center renders.
- [[beautiful-prose]] / [[humanizer]] — policy/privacy writing quality.
- [[company-legal-reputation-research]] — external due-diligence counterpart.
