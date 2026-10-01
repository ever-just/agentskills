---
name: everjust-mail-domain-connect
description: Explain, check and troubleshoot connecting a custom sending domain to an everjust.app tenant's mail: the connect a domain wizard and its states, the DNS records (SPF, DKIM, DMARC, MX, mail from) and how to read observed_value, the honest status rule (a domain is verified only when the platform says so), the backend availability switch, the test message, the mail.domain_connect flag, and handing record writes to the registrar skills. Use when an administrator asks why a domain will not verify or send, which DNS records to publish, what pending or mismatch means, whether the wizard is on, or how to test a new domain. Read only through mail_domain_status. An agent never sets verification_state and never publishes DNS unless asked, through the registrar skill. Cross-references [[everjust-mail-ops]], [[custom-domain-email-dns-diagnosis]] and [[godaddy-api]].
---

# EVERJUST Mail Domain Connect

A mailbox can send only from a domain that is verified for the workspace. The **connect a domain wizard** (in the
webmail, for mail administrators) shows the DNS records a domain needs, lets the administrator publish them, and
re-checks them. This skill explains the wizard, how to read what it reports, and what to tell the administrator.
It is a reading and explaining skill. You read domain state with `mail_domain_status` and you never set it.

Not this skill: the Domain Connect protocol or the CustomDomain™ product (nothing in this wizard writes DNS for
anyone), sending and reading mail ([[everjust-mail-ops]]), bulk campaigns ([[everjust-mass-mailing]]), or writing
records at a registrar (hand off, below).

## The rule that matters: honest status

1. Only `verification_state = "verified"` can send. `pending`, `verifying`, `failed` and `suspended` all block, and
   a blocked send answers `delivery: blocked`.
2. The wizard sets `verified` only when the platform's own check confirms the sending identity **and** every
   required record was seen. With no backend wired it records the attempt, keeps the state at `pending` and says
   "Verification pending: DNS can take up to 48h to propagate; EVERJUST is finalizing your sending identity."
   It never claims more.
3. A table of records is not verification. A row status means "seen in DNS", nothing more. `connect_step` is wizard
   progress, not a send gate. Never say "verified" or "ready to send" from green rows.
4. Never set `verification_state`, `connect_step` or a record `status` with `create` or `update`, and never switch
   the wizard flag. Newer servers refuse the first write. On an older server the rule is yours. Report the state
   the platform reports.
5. A domain set up by the platform operator's own runbook, which is the usual way today, is `verified` with
   `connect_step: draft` and often no record rows at all. That is normal, not broken.

## Is the wizard on, and can it verify?

Two separate switches. Do not mix them up.

| Switch | What it is | Default | Who changes it |
|---|---|---|---|
| Flag `mail.domain_connect` | Shows Connect a domain (sidebar, and Settings, Mailboxes) to mail administrators and turns the wizard's methods on. Off, they answer "Domain connect is not enabled." | Off, on purpose | The platform operator |
| The verification backend | Whether this platform can verify a domain at all. It is a platform setting (`everjust_mail.domain_backend_url`) that an agent can neither read nor set. With none, the wizard can publish and check records but never marks a domain verified | None | The platform operator |

`mail_domain_status` reads the domain tables directly, so it works while the flag is off. Its `verification`
block says whether the backend is connected (`backend_connected`: true, false, or null when the platform could not
say) and whether the wizard is on (`setup_guide_enabled`, the flag). Read it before you promise anything. If the
backend is not connected, tell the administrator: the records can be published and read, but the domain stays
pending until the platform finalizes it. Do not say it will verify itself. Even with a backend connected, believe
only the `verification_state` the platform reports.

## The wizard, step by step

Three steps: **Domain**, **DNS records**, **Verify**.

1. **Domain.** Enter the name (acme.com). Names under everjust.app or everjust.org are managed by EVERJUST and are
   refused, and the name must be a valid domain. **Show records** is a dry run that writes nothing. Domains already
   connected are listed.
2. **DNS records.** A table of Type, Host, Value and Status, each cell with a Copy button, and **Download zone
   file**, a BIND fragment built from the same rows for DNS hosts that can import one. **I've published these
   records** saves the domain and its records. Pressing it early is harmless.
3. **Verify.** **Check now** re-checks. The page also re-checks by itself, backing off, for up to 15 minutes and
   then says to use Verify again. Once verified, **Send a test message** appears.

Fields on the domain: `verification_state` (`pending`, `verifying`, `verified`, `failed`, `suspended`),
`connect_step` (`draft`, `records`, `verifying`, `verified`, `failed`; `draft` is also what a domain that was not made
by the wizard has), `connect_last_checked` and `connect_error` (the last message). The per record `last_checked` is
never written, so ignore it.

## The records

For a domain `acme.com`. The mail region in the MX values is `us-east-2` unless the platform sets another.

| Purpose | Type | Host | Value | Required |
|---|---|---|---|---|
| SPF | TXT | `acme.com` | `v=spf1 include:amazonses.com ~all` | Yes |
| DKIM (three rows) | CNAME | `<token>._domainkey.acme.com` | `<token>.dkim.amazonses.com` | Yes |
| DMARC | TXT | `_dmarc.acme.com` | `v=DMARC1; p=none; sp=none; adkim=r; aspf=r; pct=100; rua=mailto:dmarc@everjust.app` | Yes |
| MX (inbound) | MX, priority 10 | `acme.com` | `inbound-smtp.<region>.amazonaws.com` | Yes |
| Mail from | MX, priority 10 | `bounce.acme.com` | `feedback-smtp.<region>.amazonaws.com` | No |
| Mail from | TXT | `bounce.acme.com` | `v=spf1 include:amazonses.com -all` | No |

In plain words. **SPF** says which servers may send for the domain; here that is the platform's mail provider.
**DKIM** signs each message, and the three CNAMEs point at keys issued for the domain's sending identity.
**DMARC** tells receivers what to do when SPF and DKIM fail and where to send reports; here it is monitor only.
**MX** says where mail for the domain is delivered. **Mail from** is optional and lines the bounce address up with
the domain.

Tell the administrator these four things **before** they publish anything. They come from the blueprint, not from
general DNS advice.

1. **The MX row takes over incoming mail for the whole domain.** If the domain already receives mail elsewhere
   (Google Workspace, Microsoft 365, a host), publishing it sends that mail here, and mail splits between
   providers until the old MX records are removed. Confirm where the domain's mail goes today. If it must stay
   where it is, ask the owner about connecting a subdomain instead: the wizard accepts any valid name that is not
   under everjust.app or everjust.org, and that leaves the apex records alone (the mailboxes then live at addresses
   on that subdomain).
2. **SPF: one record per name.** A second `v=spf1` record breaks SPF. If the domain already has SPF, merge into one
   record (`v=spf1 include:amazonses.com include:_spf.google.com ~all`). The wizard's check compares text, not SPF
   meaning: a correctly merged record can show `mismatch`, and two separate SPF records can show `ok`. Judge SPF by
   reading `observed_value` yourself.
3. **DMARC is required here, and it replaces theirs.** Only one DMARC record per name is valid. The blueprint's
   record sets the policy to none and sends aggregate reports to an EVERJUST address. A domain that already has a
   DMARC record will show `mismatch` on this row. Say what publishing the blueprint's version changes, and let the
   owner decide.
4. **DKIM placeholders.** Until the sending identity exists, the three DKIM rows carry placeholder names
   (`ej-pending-1`, `ej-pending-2`, `ej-pending-3`). They are not real keys and point at nothing. The downloaded
   zone file lists them like real records. Do not publish them. Real tokens replace them only when the platform has
   issued them, and without a backend that never happens in the wizard.

## Reading `observed_value`

`observed_value` (called `observed` in the tool's answer) is what the platform last saw published at the row's host.
Compare it with `value`, what the row wants.

| `status` | `observed_value` | Meaning | Do |
|---|---|---|---|
| `pending` | Empty | Not seen: not published, not propagated, or never checked | Wait, check the host spelling, run `dig` |
| `ok` | Present | Matches | Nothing |
| `mismatch` | Present | Something is published at the host, but not what the row wants | Read the two side by side |

- The comparison is DNS aware. For CNAME and MX the case and a trailing dot are ignored, and an MX priority is
  ignored. For TXT quotes, case and spacing are ignored, and a match is one string containing the other. Extra
  tokens do not break a TXT match, but a merged SPF that does not contain the whole expected string is a mismatch.
- A host can carry several records (the apex has both SPF and MX), so `observed_value` can be a comma separated
  list. Compare the one of the same type.
- It shows the last check. `connect_last_checked` says when.
- Usual causes of `mismatch` or `pending`: the panel appended the zone name twice, a proxied CNAME, two SPF records,
  a DMARC of their own, a truncated value, or the right record at the wrong host.

## Publishing the records (hand off)

You do not write DNS. Give the administrator the table (type, host, value, priority) or the zone file, and:

- Hosts are shown fully qualified (`_dmarc.acme.com`). Most DNS panels want the name relative to the zone: type
  `_dmarc`, and `@` for the apex. Pasting the full name into a panel that appends the zone makes
  `_dmarc.acme.com.acme.com`. After saving, read what the panel displays: the full name is what has to match.
- TXT values may or may not be wrapped in quotes. Either is fine.
- On Cloudflare set the DKIM CNAMEs to DNS only (grey cloud), or the lookup does not follow them.
- Find out who hosts the DNS before anyone edits anything. The registrar is not always the DNS host
  (`dig NS acme.com`). See [[custom-domain-email-dns-diagnosis]].
- If the zone is on GoDaddy and the administrator asks you to write the records, use [[godaddy-api]], show the list
  first, and go one record at a time. Mind its write semantics: `PATCH` appends, so it would add a **second** SPF
  record, and `PUT` on a type and name replaces every record there, so it would delete other TXT values. Read the
  existing apex TXT records, keep the ones that are not SPF, and write the merged SPF with them. For any other DNS
  host the administrator publishes the records.
- Check independently: `dig +short TXT acme.com`, `dig +short TXT _dmarc.acme.com`,
  `dig +short CNAME <token>._domainkey.acme.com`, `dig +short MX acme.com`. If `dig` cannot see a record it is not
  published, and the problem is at the DNS host, not in the platform. DNS changes can take up to 48 hours.

## The test message

Once a domain is verified, an administrator can press **Send a test message** in the wizard. The platform sends one
uniquely tagged message from a mailbox on the domain to itself and waits for it to come back, which proves the
domain sends **and** receives (the MX path).

- Administrators only. The domain must be verified. There must be a mailbox on it (the caller's own, else any), an
  outgoing mail server must match, and at most three tests a minute are allowed per domain.
- It reports honestly. **Arrived:** sending and receiving both work, and the test message is filed in that
  mailbox's Trash. **Sent but not arrived yet:** receiving depends on the MX record, which can spread more slowly
  than the others, so try again in a few minutes. Or an error that says why.
- It is a button, not a tool. Do not run it through `call`. If your user wants a test and cannot press the button,
  send one `mail_send` between two mailboxes on that domain with their yes, read `queued` and `delivery`
  ([[everjust-mail-ops]]), and look in the receiving Inbox only if they asked.

## After it verifies

- Mailboxes on the domain are created by an administrator. The shared mailbox picker lists only verified domains.
  With the flag `mail.autoprovision` on, a new user gets a mailbox automatically (it needs a verified domain).
- With the flag `mail.block_unverified_send` on, any send from one of our domains that is not verified is cancelled
  on every path, not only the composer.
- If mail is blocked later, run `mail_domain_status` again. Do not assume the domain is still verified.

## Troubleshooting

| Symptom | Cause | Do |
|---|---|---|
| A send returns `blocked` | The domain is not verified | `mail_domain_status`. Stop. Do not retry |
| "Domain connect is not enabled." | The flag is off (the default) | The platform operator turns it on. Read state with `mail_domain_status` meanwhile |
| Records published, still `pending`, "Verification pending..." | No backend wired, or DNS not propagated | Check with `dig`. Do not promise verification |
| `observed_value` empty | Not seen yet | Wait, check the host spelling, `dig` |
| SPF `mismatch` after merging | Text comparison, not SPF aware | Check there is one `v=spf1` record containing `include:amazonses.com`. The platform operator decides |
| DMARC `mismatch` | The domain's own DMARC differs | The owner decides whether to replace it |
| DKIM hosts start with `ej-pending` | Placeholders | Do not publish them. Wait for real tokens |
| Verified, with no record rows and `connect_step: draft` | Set up by the operator runbook | Normal |
| Test message "sent but has not arrived" | MX slower, or not pointing here | `dig +short MX`, wait a few minutes, try again |
| "Enter a valid domain" or "is managed by EVERJUST" | The name was refused | Use a domain the person owns |
| "Verify the domain before sending a test." | Not verified yet | Verify first |
| "Add a mailbox on ... first." | No mailbox on the domain | An administrator creates one |
| "No outgoing mail server is configured for this domain" | No transport | An operator problem. Report it |
| "A few tests were just sent. Wait a minute" | The per minute limit | Wait |

## Read it with `mail_domain_status`

```text
mail_domain_status()                      # every domain of the workspace
mail_domain_status(domain="acme.com")     # one
```

Mail administrators only, and it works whether or not the wizard flag is on. `domain` matches part of a name. The
answer has `domains` (50 at most), each with `name`, `domain_type`, `verification_state`, a derived `is_sendable`,
`setup_step` (the wizard's `connect_step`), `last_checked`, `last_error`, and `records` (30 at most, with
`records_truncated`): `purpose`, `type`, `host`, `value`, `priority`, `required`, `status` and `observed`. Beside
it, `verification` carries `backend_connected`, `setup_guide_enabled` and a `note` to repeat to the administrator.
Use it before you answer any "why can't I send from this domain" question. A plain mail user is refused with
"Domain status is for mail administrators", so say so and ask an administrator.

## If the server is older than 2.3.0

There is no `mail_domain_status`. An administrator's connection can read the tables:

```text
search(model="everjust.mail.domain",
       fields=["name","verification_state","connect_step","connect_last_checked","connect_error","domain_type"])
search(model="everjust.mail.domain.record", domain=[["domain_id","=",3]],
       fields=["purpose","record_type","host","value","priority","required","status","observed_value"])
```

`is_sendable` is not a field, so do not ask for it. The wizard's own methods (`domain_connect_start`,
`domain_connect_verify`) can be reached through `call`. That is the old route. They are administrator actions
behind the flag: use them only when the administrator asked, with `confirm: true` after their yes. The test message
stays a button.

## Never

- Write `verification_state`, `connect_step`, a record `status`, a domain row or its records with `create` or
  `update`, and never touch a feature flag. They bypass the wizard's checks.
- Read or set platform configuration such as the verification backend. It is refused anyway.
- Publish DNS records unprompted, or touch the apex MX of a domain whose mail lives elsewhere without the owner's
  explicit yes.
- Send test mail to strangers to check a domain. A test goes to the domain's own mailbox.

## See also

- [[everjust-mail-ops]]: sending, the `blocked` answer, and the flags.
- [[custom-domain-email-dns-diagnosis]]: registrar versus DNS host, and working out where records must go.
- [[godaddy-api]]: writing records at GoDaddy, with its replace semantics.
- [[everjust-tenant-domain-migration]]: moving a whole tenant to another public domain.
