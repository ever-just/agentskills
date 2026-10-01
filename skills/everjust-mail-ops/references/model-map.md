# EVERJUST mail: model map, send gates and feature flags

Load this when you need to reason about the data under the mail tools: reading rows with the generic
tools, diagnosing why a send was refused, or checking what a feature flag switches. Everything is per
company and bounded by the connected user's Odoo role. The task-level guidance is in
[../SKILL.md](../SKILL.md).

## Models

Mail is layered on top of native Odoo `mail.message` (the stored body), `mail.mail` (the outgoing queue)
and `mail.blacklist`. It does not replace them. A message belongs to a mailbox through
`mail.message.model = "everjust.mail.account"` and `res_id = <account id>`, and the webmail reads
`everjust.mail.entry` rows, not `mail.message`.

| Model | What it is | Key fields |
|---|---|---|
| `everjust.mail.account` | A mailbox: the identity a person, a role or an agent sends and receives as | `name`, `email` (unique per company), `account_type` (`human`, `shared`, `agent`), `user_id` (owner), `member_ids` (shared mailboxes), `domain_id` (required, the sending identity), `signature`, `is_default`, `folder_ids`, `alias_ids` |
| `everjust.mail.folder` | System folders created per mailbox, plus custom ones | `folder_type` (`inbox`, `sent`, `drafts`, `spam`, `archive`, `trash`, `custom`), `name`, `sequence` |
| `everjust.mail.entry` | Per mailbox state of one message. This is what the webmail lists | `account_id`, `folder_id`, `message_id` (to `mail.message`), `thread_root` (the conversation key, not `parent_id`), `header_to`, `header_cc`, `is_read`, `is_starred`, `is_trashed`, `received_at`, `delivery_state`, `label_ids` |
| `everjust.mail.draft` | A draft. Not an entry, not a `mail.mail`: nothing is queued | `account_id`, `user_id` (the author), `to`, `cc`, `bcc`, `subject`, `body` (plain text), `in_reply_to` (an entry), `mode` (`new`, `reply`), `from_account_id` |
| `everjust.mail.label` | A label of one mailbox | `account_id`, `name` (40 characters at most), `color` (an index, 0 to 11) |
| `everjust.mail.blocked_sender` | One blocked address of one mailbox. Its mail is filed to Spam, never dropped | `account_id`, `email` (normalised), `active` |
| `everjust.mail.suppression` | Addresses the platform must not send to (bounces and complaints from SES) | `email`, `reason` (`permanent_bounce`, `complaint`, `manual`), `diagnostic_code`, `scope`, `active` |
| `everjust.mail.alias` | Extra receiving addresses of a mailbox. A renamed mailbox keeps its old address here | `account_id`, `email`, `active` |
| `everjust.mail.domain` | A sending and receiving identity (a domain). Gates the whole send path | `name`, `domain_type` (`platform_default`, `customer`), `provider`, `verification_state` (`pending`, `verifying`, `verified`, `failed`, `suspended`), `connect_step`, `connect_last_checked`, `connect_error`, `record_ids` |
| `everjust.mail.domain.record` | One DNS record a domain needs, with what was last observed | `purpose` (`spf`, `dkim`, `dmarc`, `mx`, `mailfrom`), `record_type`, `host`, `value`, `priority`, `required`, `status` (`pending`, `ok`, `mismatch`), `observed_value` |
| `everjust.mail.feature` | A feature flag, one row per key and company | `key`, `enabled`, `description` |
| `everjust.mail.filter`, `.filter.condition`, `.filter.action` | Inbound rules (module `everjust_mail_rules`) | see [[everjust-mail-rules]] |
| `everjust.mail.autoreply.log` | One row per mailbox and sender: when the auto reply last answered them | `account_id`, `sender_email`, `last_sent_at` |
| `everjust.mail.app_password` | IMAP and SMTP app passwords. A credential. Never touch it | not for agents |
| `everjust.mail.inbound.seen` | Dedupe ledger of the inbound bridge. Internal | not for agents |
| `everjust.mail.deadletter` | Header only trace of inbound mail that matched no mailbox, kept 30 days | `recipient`, `email_from`, `subject`, `reason` |

`is_sendable` on a domain is a Python property, not a field. `search` and `get` cannot read it. Read
`verification_state`: only `verified` can send. (The `mail_domain_status` tool's answer carries a derived
`is_sendable` for convenience.)

A domain verified by the platform operator's runbook has `connect_step = "draft"` and may have no record
rows at all. That is normal. `connect_step` and the record table belong to the connect wizard; they are
not the send gate.

Three mailbox types: `human` (one owner), `shared` (a role mailbox with members; drafts stay personal to
each member) and `agent` (bound to a bot user). Changing a mailbox's address is an administrator action;
the old address is kept as an alias so mail to it still arrives.

## Who can read what

| Role | Sees |
|---|---|
| Mail User | Own mailboxes (owner or member) and their folders, entries, labels, blocked senders and rules. Drafts: only the ones they wrote. Flags: read only. Aliases: own mailboxes only |
| Mail Administrator | Every mailbox, folder, entry, draft and rule in the company, plus domains, domain records, suppression, dead letters and the flag table (write) |

An administrator's connection can open every mailbox in the workspace. That is a reason for care, not
permission. Read only the mailbox your user asked about.

## The send path and its gates, in order

`mail_send` wraps the mailbox method `compose_send`, which hands off to the transport. In order:

1. Input checks before anything is stored: at least one valid recipient; at most 100 recipients across To,
   Cc and Bcc together (duplicates removed, To wins over Cc, To and Cc win over Bcc); subject at most 998
   characters; body at most 512 KB of text. A failure is `{"ok": false, "error": "..."}` and nothing is saved.
2. Verified identity: the mailbox's domain must have `verification_state = "verified"`. Otherwise
   `delivery: "blocked"` ("This sending address is not verified yet.").
3. Hourly cap: 300 sends per mailbox, counted as Sent entries in the last hour. Over it:
   `delivery: "rate_limited"`.
4. Suppression: each recipient is checked against `everjust.mail.suppression` (this company) and the
   active `mail.blacklist`. Suppressed recipients are dropped and counted in `suppressed`. If none are left:
   `delivery: "suppressed"`.
5. Transport: the outgoing mail server whose `from_filter` matches the sender address. None:
   `delivery: "no_transport"`.
6. Hand off: one `mail.mail` for To and Cc, one separate copy for each Bcc recipient (nobody sees the other
   Bcc addresses). The send is attempted without raising, so a rejection leaves the mail in state
   `exception`. `queued` is false when any copy is in `exception`.

The answer is `{ok, entry_id, message_id, queued, delivery, recipients, suppressed?, error?}`.

- `delivery` is `blocked`, `rate_limited`, `suppressed`, `no_transport`, or the mail state after the attempt
  (`sent`, `outgoing`, `exception`).
- With the flag `mail.honest_send` on (the default), `ok` equals `queued`, and a refused send files no Sent
  copy and leaves nothing behind. With it off, `ok` is always true and a Sent copy is filed even when the
  send was refused. Read `queued` and `delivery`, never `ok` alone.
- A filed Sent entry proves only that a copy was kept. Delivery is the transport result, and later the
  entry's `delivery_state`.
- The mailbox signature is appended by the server, according to the sending user's own policy (every
  message, new messages only, replies only, never). Do not add a signature to the body yourself.
- Reply headers: a reply carries In-Reply-To and References built from the entry you replied to.
  `in_reply_to` is an `everjust.mail.entry` id of the same mailbox. A stale or foreign id does not fail:
  the mail goes out unthreaded.
- Two flags widen the gates beyond the webmail: `mail.block_unverified_send` cancels any send from one of
  our domains that is not verified, on every path; `mail.suppress_all_sends` enforces the suppression list
  on every outgoing mail (invites, resets, templates), not just webmail sends.

`delivery_state` on a Sent entry: `queued`, `sent`, `delivered`, `failed`, `bounced`, `complained`. It is
filled from SES events after the send. A terminal failure (`bounced`, `complained`, `failed`) is not
overwritten by a later `delivered`. A permanent bounce or a complaint also adds the address to the
suppression list.

## Inbound is a signed bridge (do not touch)

Mail arrives through `MX, SES receipt rule, SNS, the everjust-mail backend, a signed POST to the tenant`,
which files one message and one Inbox entry per matching mailbox (it matches To, Cc, Delivered-To and
similar headers against mailbox addresses and aliases). With `mail.blocklist` on, a sender on a mailbox's
blocklist is filed to Spam instead. Mail that matches no mailbox leaves a dead letter trace.

Read the entries it produced. Do not call its internals and do not fabricate inbound rows. To test the loop,
send a real mail to the address and let the bridge file it. Inbound rules and the auto reply run after
filing and never block delivery: [[everjust-mail-rules]].

## Feature flags

One row per key and company in `everjust.mail.feature`. Unknown keys read as off. `mail_features` returns
what is on in this workspace. Flags are changed by administrators in the platform UI, never by an agent.

| Flag | Seed | What it switches |
|---|---|---|
| `mail.honest_send` | on | `ok` mirrors `queued`; refused sends file nothing |
| `mail.composer2` | on | Full composer: Cc, Bcc, attachments, rich text, reply all, forward |
| `mail.threading` | on | Conversation threading in the reader |
| `mail.delivery_meta` | on | Per message delivery status on Sent mail |
| `mail.drafts` | on | Composer autosave to the drafts model, delete on send |
| `mail.organize` | on | Labels, archive, mark unread, restore, move, bulk actions and Undo |
| `mail.search` | on | Search operators in the webmail |
| `mail.shared` | on | Shared mailbox creation and member management |
| `mail.unified_inbox` | on | One All inboxes view across the user's mailboxes |
| `mail.inbound_attachments` | on | Inbound attachments kept as files, inline images shown |
| `mail.import_export` | on | Webmail import and export (module `everjust_mail_ui`) |
| `mail.rules` | on | Rules and the auto reply (module `everjust_mail_rules`) |
| `mail.blocklist` | seed off, switched on by a release migration | Block a sender; their mail goes to Spam |
| `mail.paging`, `mail.mobile`, `mail.saferender`, `mail.vault` | mixed | Retained for compatibility. Toggling has no effect |
| `mail.autoprovision` | off | A new user gets a mailbox automatically (needs a verified domain) |
| `mail.domain_connect` | off | The connect a domain wizard: [[everjust-mail-domain-connect]] |
| `mail.imap` | off | Connect a mail app (IMAP and SMTP app passwords). Off until the gateway is live |
| `mail.suppress_all_sends` | off | See the send path above |
| `mail.block_unverified_send` | off | See the send path above |
| `mail.catchall_routing` | off | Replies to Odoo notifications routed onto their record's thread; unroutable mail leaves a dead letter |
| `mail.thread_subject_break` | off | Start a new conversation when a reply changes the subject |
| `mail.inline_cid_images` | off | Send inline images as related parts instead of attachments |

Seeds differ per tenant after operators have made choices. Always ask `mail_features`.

## Reading rows with the generic tools

Use a mail tool when one fits. For questions the tools do not cover, the generic read tools work on these
models within the user's role:

```text
count(model="everjust.mail.entry", domain=[["folder_id.folder_type","=","inbox"],["is_read","=",false]])
aggregate(model="everjust.mail.entry", group_by=["folder_id"])
search(model="everjust.mail.suppression", domain=[["email","=","bounced@example.com"]],
       fields=["email","reason","diagnostic_code","scope","active"])
```

Count and aggregate are the polite way to measure a mailbox: they return numbers, not mail. Do not read
bodies with `get` on `mail.message`: use `inbox_message`, which returns capped plain text and marks nothing
read. `create` and `update` on `everjust.mail.*` are for administrators doing configuration. Newer servers
refuse some of them outright (feature flags, app passwords, rule rows, the auto reply fields, the domain
`verification_state`); an older server stops nothing, so the rule is yours to keep. If a write is refused,
do not look for another route to the same result.
