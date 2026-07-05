---
name: everjust-sign
description: Operate the "Sign" e-signature app of an everjust.app tenant (create a signable PDF request, add typed signers by role, send it out for signature, track who has signed, download the finished signed PDF, and read the tamper-evidence log) via the Odoo MCP/ORM. Use when the task is to send a document out for signature from an everjust.app workspace, check a signature request's status, find pending signers, generate a request from a reusable template, or verify a signed document's integrity hash. This is the OCA sign_oca stack (sign.oca.request / .signer / .template) — NOT Odoo Enterprise "Sign" (sign.request/sign.item) and NOT DocuSign. Signers sign in a public portal via a tokenized link; invite emails go out through Odoo chatter (message_notify), so they ride the everjust mail send-gates — see [[everjust-mail-ops]]. Cross-references [[everjust-platform]] and [[everjust-agent-mcp]]; sibling of [[everjust-sms]] and [[everjust-mail-ops]].
---

# EVERJUST Sign — Agent Skill

Operate the **Sign** app of an everjust.app tenant as a running agent: turn a PDF into
a signature request, attach signers by role, send it, track signing progress, pull the
finished signed PDF, and read the audit/integrity trail — all through the Odoo MCP / ORM
(`search`, `get`, `create`, `update`, `call` a method). See [[everjust-agent-mcp]] for how
to open a session against the right tenant (`https://<tenant>.everjust.app/mcp`, Bearer =
Odoo API key, runs AS that user, every call audited).

**This is `sign_oca`** — the community **OCA "Sign Oca"** addon (author Dixmit/OCA,
`19.0.1.0.0`, AGPL-3), rebranded only in strings to "EVERJUST.APP". It is a **different
product** from Odoo Enterprise Sign. There is **no `sign.request` / `sign.item`** here;
the models are `sign.oca.*`. Stock OCA behavior, no everjust fork of the module itself
(see Pitfalls for the platform-level gotchas that DO apply).

## When to use this skill

- **Send a document out for signature** — from a one-off PDF or from a reusable template.
- **Check a request's status** — who has signed, who is pending, is it fully signed / cancelled.
- **Find pending signers** — the queue of signatures a partner (or the tenant) still owes.
- **Generate requests from a template** — one, or in bulk over a set of business records
  (each request linked back to its record via `record_ref`).
- **Download the finished signed PDF** and **verify its tamper-evidence** (per-signer
  inalterable hash chain).

**Do NOT use this skill for**, and stop if the task is really:
- **Odoo Enterprise Sign** (`sign.request`, `sign.item`, `sign.template`) or **DocuSign /
  external e-sign** — this tenant runs `sign_oca` only; those models do not exist here.
- **Making the invite email actually deliver** — the invite is an Odoo `message_notify`
  (chatter notification). Whether it lands is a mail-transport question owned by
  [[everjust-mail-ops]] (verified sending identity, suppression, rate-gate). This skill
  fires the invite; that skill tells you if it went out.
- **SMS / OTP signer authentication** — `sign_oca` has **no SMS and no OTP** (OTP is on the
  module ROADMAP, unbuilt). Do not expect a text to the signer; see [[everjust-sms]] if you
  separately want to text them a heads-up.
- **Registrar / DNS / product work on connectdomain** — unrelated; that is [[godaddy-api]].

## Where it's installed

Live introspected on the shared everjust box (one Postgres DB per tenant). `sign_oca` is
**installed** on: `connectdomain`, `burekraft-llc`, `headsup`, `riftline-labs`,
`tcstartupweek`, `trust-works-company`, `weldon`. **Not present** on `control`. Confirm the
tenant before operating; everything is per-`company_id` (see Pitfalls). On a fresh tenant
the seed data ships 6 fields (Name, Email, Phone, Text, Signature, Check) and 2 roles
(Customer, Employee, both `partner_selection_policy='empty'`) — verified on `connectdomain`.

---

## The model map

Three core models plus a field-catalog, a role catalog, a template-item child, and an
append-only log. All the request/signer models inherit `mail.thread` + `mail.activity.mixin`
(so they have chatter and activities — usable, but the *signing* audit trail is the
dedicated `sign.oca.request.log`, not chatter).

| Model | Role | Key fields (real, from source + live `fields_get`) |
|---|---|---|
| `sign.oca.template` | **Reusable blueprint**: a PDF + placed fields + roles. Optionally bound to a business model. | `name` (req), `data` (binary PDF, req, `attachment=True`), `filename`, `item_ids` (→ `sign.oca.template.item`), `model_id` (→ `ir.model`) / `model` (computed char), `ask_location`, `active`, `request_count`, `request_ids` |
| `sign.oca.template.item` | One **placed field** on a template page (position is % of page, 0–100). | `template_id` (req), `field_id` (→ `sign.oca.field`), `role_id` (→ `sign.oca.role`, default = Customer), `required`, `page` (req, default 1), `position_x`/`position_y` (req, %), `width`/`height` (%), `placeholder` |
| `sign.oca.request` | **A live signature request** over one PDF. This is the thing you send and track. | `name` (req), `data` (binary PDF, req — mutated in place as signers sign), `template_id`, `state` (req: `1_draft`→`0_sent`→`2_signed`/`3_cancel`), `signed` (bool), `signer_ids` (→ signer), `signer_id` (computed: the signer matching the current user), `signatory_data` (**JSON** — the placed fields), `to_sign`/`signed_count`/`signer_count` (computed), `current_hash`, `record_ref` (Reference → the linked business record), `user_id` (Responsible, req), `company_id` (req), `ask_location` |
| `sign.oca.request.signer` | **One signer's slot** on a request: who, in what role, with token + signed state + integrity hash. | `request_id` (req), `partner_id` (→ res.partner, req), `role_id` (→ sign.oca.role, req), `signed_on` (datetime — **None until they sign**), `signature_hash`, `access_token`/`access_url` (portal link, from `portal.mixin`), `is_allow_signature` (computed: can the current user sign this now), `secure_sequence_number` + `inalterable_hash` + `altered_hash` (the tamper chain), `latitude`/`longitude`, `data` (related → request PDF), `model`/`res_id` (mirror of the linked record) |
| `sign.oca.field` | **Catalog of field TYPES** you can place. Seeded, tenant-wide (no company scope). | `name`, `field_type` (`text`\|`signature`\|`check`), `default_value` (a partner attr name like `name`/`email`/`phone`, or False) |
| `sign.oca.role` | **Catalog of signer roles** + how to auto-resolve the partner when generating from a template. | `name` (req), `partner_selection_policy` (`empty`\|`default`\|`expression`, req), `default_partner_id`, `expression_partner` (e.g. `{{object.partner_id.id}}`), `domain` (req) |
| `sign.oca.request.log` | **Append-only audit trail** (`_log_access=False`). Every view/configure/sign/cancel with actor IP. This is the legal trail, not chatter. | `request_id`, `signer_id`, `action` (`create`/`validate`/`view`/`sign`/`add_field`/`edit_field`/`delete_field`/`cancel`/`configure`), `uid`, `partner_id`, `date`, `ip`, `access_token` |

### The lifecycle (state machine)

```
create (1_draft) ──action_send()──▶ 0_sent ──all signers signed──▶ 2_signed
                                       │                              (auto, via _check_signed)
                                       └──cancel()──▶ 3_cancel
```

- **`1_draft`** — created, fields placeable/editable (`add_item`/`set_item_data`/`delete_item`
  only work in draft, and require ≥1 signer). Not yet visible to signers.
- **`0_sent`** — `action_send()` was called: it stamps a `validate` log, sets state, mints a
  portal token per signer, and fires the invite `message_notify` to each signer's partner.
  Signers can now sign at their `access_url`.
- **`2_signed`** — reached **automatically** when the last signer signs (`_check_signed`
  flips it once every `signer_ids.signed_on` is set). Do not set it by hand.
- **`3_cancel`** — via `cancel()`.

### How signing actually mutates the PDF (don't fake it)

`signer.action_sign(items, ...)` (called by the public portal controller, not you) re-renders
the `request.data` PDF in place — burning each field's value (text / signature image /
check-cross) at its `position_x/y` (% of page), recomputes `current_hash` (SHA-1 of the new
PDF), sets the signer's `signed_on` + `signature_hash`, then extends the **inalterable hash
chain** (`secure_sequence_number` + `inalterable_hash`, chained off the previous signer via a
no-gap `ir.sequence`). This is why you never write `data`/`signed_on`/`signatory_data` by
hand — see Pitfalls.

---

## Recipes

Route each through the Odoo MCP (`call`/`create`/`update`/`search`/`get` on the tenant).
`env[...]` shown for clarity; over MCP these are the generic tools operating on the model.

### 1. Create a one-off request from a raw PDF and send it

```python
import base64
pdf_b64 = base64.b64encode(open("nda.pdf","rb").read()).decode()

# a partner to sign as (must exist; create/find via res.partner)
partner = env["res.partner"].search([("email","=","alice@example.com")], limit=1)
customer_role = env["sign.oca.role"].search([("name","=","Customer")], limit=1)

req = env["sign.oca.request"].create({
    "name": "NDA — Alice",
    "data": pdf_b64,                 # required; base64 PDF
    "filename": "nda.pdf",
    "signer_ids": [(0, 0, {
        "partner_id": partner.id,
        "role_id": customer_role.id,
    })],
})
# req.state == "1_draft" now. Place fields if needed (recipe 3), then send:
req.action_send(message="Please sign the attached NDA.")
# -> state="0_sent", tokens minted, invite message_notify fired to each signer.
```
`action_send` returns nothing meaningful; **verify by re-reading** `state` and the signer's
`access_url`. The invite is a chatter notification — its *delivery* is a mail-transport
concern ([[everjust-mail-ops]]): a request can be `0_sent` while the email never left (blocked
sending identity, suppression, rate-gate). If a signer says they got no email, hand them the
`access_url` directly.

### 2. Track status — who has signed, who is pending

```python
req = env["sign.oca.request"].browse(req_id)
req.read(["name","state","signed","signer_count","signed_count"])
# Per-signer detail: signed_on is None until they sign.
env["sign.oca.request.signer"].search_read(
    [("request_id","=",req.id)],
    ["partner_name","role_id","signed_on","access_url","secure_sequence_number"])
```
`state == "2_signed"` (or `signed == True`) is the only reliable "done" signal — it flips
automatically when the last signer signs. `signed_count == signer_count` says the same.
A signer with `signed_on == False` is still pending.

### 3. Find everyone's pending signatures (the queue)

```python
# Pending signatures owed by a specific partner (across all requests):
env["sign.oca.request.signer"].search_read(
    [("request_id.state","=","0_sent"),
     ("partner_id","=",partner.id),
     ("signed_on","=",False)],
    ["request_id","role_id","access_url"])

# Tenant-wide "what's out for signature but not done":
env["sign.oca.request"].search_read(
    [("state","=","0_sent")],
    ["name","signer_count","signed_count","user_id"], order="create_date desc")
```
The web systray count comes from `res.users.sign_oca_request_user_count()` — you can `call`
it, but for an agent the explicit `search_read` above is clearer.

### 4. Generate a request from a template, resolving signers by role

```python
tmpl = env["sign.oca.template"].search([("name","=","Employee Contract")], limit=1)
tmpl.read(["name","model","request_count"])
# Which roles the template needs and how each resolves its partner:
env["sign.oca.role"].browse(tmpl.item_ids.mapped("role_id").ids).read(
    ["name","partner_selection_policy","default_partner_id","expression_partner"])

# Preferred path — the wizard builds signatory_data + signers correctly:
wiz = env["sign.oca.template.generate"].with_context(default_template_id=tmpl.id).create({
    "template_id": tmpl.id,
    "signer_ids": [(0, 0, {"role_id": role_id, "partner_id": partner_id})
                   for (role_id, partner_id) in signer_pairs],
    "message": "<p>Please sign.</p>",
})
wiz.generate()   # creates the sign.oca.request, action_send()s it, returns the sign action

# Bulk over N business records (each request linked via record_ref):
env["sign.oca.template.generate.multi"].with_context(
    model="res.partner", active_ids=[p1,p2,p3]
).create({"template_id": tmpl.id, "message": "<p>Sign</p>"}).generate()
```
Prefer the **wizards** (`sign.oca.template.generate` / `.multi`) over hand-building a request:
they call `template._get_signatory_data()` to snapshot the placed fields into the request's
`signatory_data` JSON and set signers from roles. Hand-building means you must replicate that
JSON yourself (see Pitfall 4). For a template bound to a `model_id`, the multi wizard is the
"Sign from template" server action; each resulting request carries `record_ref` back to its
source record.

### 5. Download the finished signed PDF + verify integrity

```python
req = env["sign.oca.request"].browse(req_id)
assert req.state == "2_signed"
pdf_bytes = base64.b64decode(req.data)          # the burned-in, fully-signed PDF
open("signed.pdf","wb").write(pdf_bytes)

# Tamper-evidence: every signed signer has a chained hash; altered_hash must be False.
env["sign.oca.request.signer"].search_read(
    [("request_id","=",req.id), ("signed_on","!=",False)],
    ["partner_name","signed_on","signature_hash",
     "secure_sequence_number","inalterable_hash","altered_hash","latitude","longitude"])

# Full legal audit trail (who did what, from which IP):
env["sign.oca.request.log"].search_read(
    [("request_id","=",req.id)],
    ["date","action","uid","partner_id","ip","signer_id"], order="date")
```
`altered_hash == True` on any signer means the chained hash no longer matches — treat the
document as tampered. The `sign.oca.request.log` is the append-only trail (`_log_access=False`,
IP-stamped); it is the evidence record, not the chatter on the request.

### 6. Cancel a request

```python
env["sign.oca.request"].browse(req_id).cancel()   # -> state "3_cancel", logs "cancel"
```
There is no un-cancel and no built-in re-send of a cancelled request; generate a fresh one.

---

## Pitfalls

1. **This is OCA `sign_oca`, NOT Odoo Enterprise Sign.** Reach for `sign.oca.request` /
   `sign.oca.request.signer` / `sign.oca.template` — `sign.request`, `sign.item`,
   `sign.template` do not exist on these tenants. Don't import Enterprise-Sign assumptions
   (roles, tags, send-request wizard) — the API is the one documented here.

2. **The invite email is chatter, and it can silently not deliver.** `action_send` fires
   `mail.thread.message_notify` per signer — an Odoo *notification*, subject to this
   platform's mail send-gates (verified sending identity, suppression, hourly cap — see
   [[everjust-mail-ops]]). A request sitting in `0_sent` is **not** proof the signer was
   emailed. If in doubt, read the signer's `access_url` and deliver the link yourself.
   There is **no SMS/OTP** path (unbuilt — ROADMAP); don't promise the signer a text.

3. **Never hand-mutate `data`, `signed_on`, `signatory_data`, `state='2_signed'`, or the
   hash fields.** Signing goes through `signer.action_sign()` (driven by the public portal
   controller `/sign_oca/sign/<id>/<token>`), which burns fields into the PDF, recomputes
   `current_hash`, sets `signed_on`/`signature_hash`, and extends the no-gap inalterable hash
   chain. Writing these by hand produces a document whose `altered_hash` flips True (or a
   broken sequence) — i.e. you manufacture a "tampered" record. To *test* signing end-to-end,
   open the signer's `access_url` in the portal, don't fake the fields.

4. **A request needs its `signatory_data` JSON, and creating raw skips it.** The placeable
   fields live in `request.signatory_data` (a JSON dict keyed by item id). The template
   wizards populate it via `template._get_signatory_data()`; a raw `create` gives you an
   *empty* form with nothing to sign. Either go through `sign.oca.template.generate[.multi]`
   (recipe 4), or place fields in draft with `add_item({...})` (draft-only, needs ≥1 signer
   first) — never leave a sent request with empty `signatory_data`.

5. **Field placement is percent-of-page (0–100), origin top-left, and role-scoped.** Each
   item's `position_x/y/width/height` are percentages of the page box; `role_id` decides
   *which signer* fills it. A field's `page` is 1-indexed. `action_sign` only writes items
   whose `role_id` matches the signing signer — a field on the wrong role is never filled.

6. **`state='2_signed'` is automatic; don't set it, and mind partial signing.** `_check_signed`
   flips a `0_sent` request to `2_signed` only when **all** `signer_ids` have `signed_on`.
   With multiple signers, order isn't enforced by the module (each signs via their own token);
   the request is "done" only when the last one signs. Judge completion from
   `state`/`signed`/`signed_count==signer_count`, never from "one person signed."

7. **Everything meaningful is per-`company_id` — except the field/role catalogs.**
   `sign.oca.request` carries `company_id` (req); requests, signers, and logs are tenant/company
   scoped. But `sign.oca.field` and `sign.oca.role` have **no company field** — they're shared
   catalogs seeded per DB. Confirm you're on the intended tenant DB before operating (see
   [[everjust-platform]] / [[everjust-agent-mcp]]); the same "Customer" role id means different
   things on different tenants.

8. **`partner_id` on a signer is `ondelete='restrict'`, `role_id` too.** You can't create a
   signer for a non-existent partner, and you can't delete a partner/role still referenced by a
   signer. Resolve/create the `res.partner` first. When generating from a template, the role's
   `partner_selection_policy` decides auto-resolution: `empty` → you must supply the partner,
   `default` → `default_partner_id`, `expression` → evaluates `expression_partner` against the
   linked `record_ref` (e.g. `{{object.partner_id.id}}`).

9. **`record_ref` is a Reference field (`"model,id"` string), and it excludes `sign.oca.*`.**
   The link back to the originating business record is `record_ref` — write it as
   `"res.partner,42"`, not an int. The field domain deliberately hides `sign.oca` models, so
   you can't point a request at another sign request. The signer's `model`/`res_id` are
   read-only mirrors computed from it.
