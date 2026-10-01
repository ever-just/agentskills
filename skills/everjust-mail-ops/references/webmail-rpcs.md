# EVERJUST webmail RPC catalogue (54 public methods)

The webmail client talks to the server through public model methods. Every one is also reachable through
the MCP `call` tool (old route, see the fallback in [../SKILL.md](../SKILL.md)) and through Odoo's own JSON
API. This page says what each does, who may use it, which flag gates it, and which MCP tool covers it.
Load it when you need to know whether a webmail action has an agent route.

How to read the last column:

- A tool name means a mail tool covers it on a server that has that tool (`platform_info` lists the tools).
- `none` means it is a person's action in the webmail. Hand it to the person; do not route it through `call`.
- `never` means do not do it by any route. Newer servers refuse it inside `call`; on an older server the
  refusal is yours to make.

Methods live on `everjust.mail.account` unless the heading says otherwise. "Owner or member" means the
mailbox owner, a member of a shared mailbox, or a mail administrator. A mail administrator can reach every
mailbox, so the record rules are what keep a normal user inside their own.

The Flag column lists the feature flags a method consults. For labels and moves, blocking, rules and the
auto reply, import and export, and the domain wizard, a flag that is off makes the call answer
`{"ok": false, "error": "... not enabled."}`. For the others a flag only changes the shape of the answer.
Ask `mail_features` before offering any of them.

## Reading

| Method | Who | Flag | Effect | Agent route |
|---|---|---|---|---|
| `get_systray_state()` | owner or member | none | Unread count for the navbar badge | none |
| `get_mailbox_state()` | any mail user | `mail.shared`, `mail.unified_inbox` | Mailboxes, folders, labels, unread counts | `mailbox_list` |
| `get_entries(folder_id, search, offset, limit, label_id, all_folders)` | owner or member | `mail.delivery_meta`, `mail.search` | Message rows of a folder; `all_folders` widens to All mail | `inbox_read` |
| `get_unified_entries(search, offset, limit, label_id, source_account_id, all_folders)` | owner or member | `mail.search` | The All inboxes view across the user's mailboxes | `inbox_read`, one mailbox at a time |
| `get_entry_detail(entry_id)` | owner or member | `mail.delivery_meta` | Full message. Sets `is_read` | `inbox_message` (does not mark read). Never this one |
| `get_thread(entry_id)` | owner or member | `mail.thread_subject_break` | Conversation. Sets `is_read` on the anchor | `inbox_thread` (does not mark read). Never this one |
| `suggest_recipients(account_id, query, limit)` | owner or member | none | Address suggestions from contacts and past mail | none |
| `sender_info(account_id, email)` | owner or member | `mail.blocklist` | Sender card data: contact, blocked, own address | none |
| `list_blocked(account_id)` | owner or member | `mail.blocklist` | Blocked senders of a mailbox, newest first, up to 500 | `mail_blocked_list` |
| `get_features()` on `everjust.mail.feature` | any internal user | none | Map of flag key to on or off for the company | `mail_features` |

## Organising

| Method | Who | Flag | Effect | Agent route |
|---|---|---|---|---|
| `set_flags(entry_ids, vals)` | owner or member | none | `is_read`, `is_starred`, `trash`, `untrash`, `archive`, `unarchive`. A foreign id is a quiet no-op | `mail_organize` |
| `set_labels(entry_ids, add_label_ids, remove_label_ids)` | owner or member | none | Add or remove labels. Labels of another mailbox are skipped | `mail_organize` |
| `move_entries(entry_ids, folder_id)` | owner or member | `mail.organize` | Move to a folder of the same mailbox. Into Trash sets `is_trashed`; out of it clears it | `mail_organize` |
| `create_label(account_id, name, color)` | owner or member | `mail.organize` | New label. A duplicate name returns the existing label | `mail_label` |
| `update_label(label_id, name, color)` | owner or member | `mail.organize` | Rename or recolour. A name another label already has is refused | `mail_label` |
| `delete_label(label_id)` | owner or member | `mail.organize` | Removes the label from messages. Never deletes a message | `mail_label` |
| `block_sender(account_id, email)` | owner or member | `mail.blocklist` | Future mail from that address is filed to Spam. Not your own address | `mail_sender_block` |
| `unblock_sender(account_id, email)` | owner or member | none, on purpose | Undo a block. Works even if the flag is later switched off | `mail_sender_block` |
| `add_contact(email, name)` | any user who may create contacts | none | Creates a contact with the caller's own rights; idempotent | none |

## Drafts and sending

| Method | Who | Flag | Effect | Agent route |
|---|---|---|---|---|
| `draft_save(account_id, vals, draft_id)` | owner or member | none | Create or update a private draft. Long text is cut, never an error | `mail_draft_save` |
| `draft_list(account_id, search)` | owner or member | none | The caller's drafts in that mailbox | `inbox_read` with `folder_type: drafts` |
| `draft_get(draft_id)` | owner or member | none | One draft | `inbox_read` with `folder_type: drafts` |
| `draft_delete(draft_id)` | owner or member | none | Discard a draft | none |
| `compose_send(account_id, to, subject, body, in_reply_to, cc, bcc, draft_id, attachment_ids, body_html)` | owner or member | `mail.honest_send` | Sends and files the Sent copy through the gated transport | `mail_send`. Never through `call` |
| `compose_attach(account_id, filename, data_b64)` | owner or member | `mail.composer2` | Stages an attachment (25 MB cap) | none. Agents cannot attach files |
| `compose_attach_discard(attachment_id)` | owner or member | none | Drops a staged attachment | none |

## Identity and preferences

| Method | Who | Flag | Effect | Agent route |
|---|---|---|---|---|
| `save_profile(account_id, name, avatar)` | owner (a shared or agent mailbox name belongs to an administrator) | none | The From display name and the user's own photo | none |
| `save_signature(account_id, signature)` | owner or member | none | The mailbox signature (HTML, sanitised). It is appended to every message sent from the mailbox | none |
| `save_prefs(vals)` | the user, for themselves | none | Own preferences: sound, remote images, undo send seconds, notify trigger, signature policy and placement | none |

## Rules and auto reply (flag `mail.rules`, module `everjust_mail_rules`)

| Method | Who | Effect | Agent route |
|---|---|---|---|
| `rules_list(account_id)` | owner or member | Rules in run order, with `editable`, plus the folders and labels a rule may use | `mail_rules_get` |
| `rule_preview(account_id, rule)` | owner or member | How many of the newest 200 Inbox messages the rule would match, with five samples. Read only | `mail_rule` (preview) |
| `rule_save(account_id, rule)` | owner or member | Create or replace a rule. The validator forbids forwarding and regular expressions | `mail_rule` (save) |
| `rule_set_active(account_id, rule_id, active)` | owner or member | Switch a rule on or off | `mail_rule` |
| `rule_delete(account_id, rule_id)` | owner or member | Delete a rule | `mail_rule` |
| `rules_reorder(account_id, ids)` | owner or member | Set the run order | `mail_rule` |
| `autoreply_get(account_id)` | owner or member | The auto reply state, whether it is running now, how many people it answered in the last day | `mail_rules_get` |
| `autoreply_save(account_id, data)` | owner or member | Turn the auto reply on or off and set its text and dates. It writes to strangers | `mail_autoreply_set` |

Full guidance: [[everjust-mail-rules]].

## Import and export (flag `mail.import_export`)

| Method | Who | Effect | Agent route |
|---|---|---|---|
| `export_info(account_id)` | owner or member | Folders with message counts for export | none |
| `import_messages(account_id, folder_id, messages)` | owner or member | Files base64 messages into a folder, read and silent: no unread count, no notification, no rule, no auto reply. Sender and date are whatever the file says | never |

The export itself is a browser download of one folder as an mbox file (up to 3000 messages per part). It
needs the person's browser session, so an MCP token cannot fetch it. Import takes `.eml` and `.mbox` files
(50 messages per call, 25 MB per message, 100 MB per file in the client) and files the same Message-Id
once. Both are the person's own actions: Settings, Import and export.

## Mail apps (flag `mail.imap`, off until the gateway is live)

| Method | Who | Effect | Agent route |
|---|---|---|---|
| `list_app_passwords()` | the user | Labels, dates and last use of their app passwords. No secrets | none |
| `generate_app_password(label)` | any user with a mailbox | Creates a long lived IMAP and SMTP credential and shows it once. It outlives the connection that made it | never |
| `revoke_app_password(pw_id)` | the user | Revokes one. Only reduces access | none: the person does it in Settings |

## Shared mailboxes and addresses (administrators)

| Method | Who | Flag | Effect | Agent route |
|---|---|---|---|---|
| `create_shared_mailbox(local, name, domain_id, member_user_ids, manager_user_id)` | mail administrator | `mail.shared` | Claims an address on a verified domain | none: ask the administrator to do it, or do it only when they ask you to |
| `set_shared_members(account_id, member_user_ids)` | owner or administrator | `mail.shared` | Grants or removes access to a shared mailbox | same |
| `get_shared_manage_state(account_id)` | any member | `mail.shared` | Members and candidates | none |
| `rename_address(new_email)` on a mailbox record | mail administrator | none | Changes the address; the old one stays as an alias | same |

## Domains (model `everjust.mail.domain`, administrators)

| Method | Flag | Effect | Agent route |
|---|---|---|---|
| `domain_connect_preview(name)` | `mail.domain_connect` | The records a domain would need. Writes nothing | `mail_domain_status` covers reading |
| `domain_connect_start(name)` | `mail.domain_connect` | Creates the domain row and its records | none |
| `domain_connect_state(domain_id)` | `mail.domain_connect` | State and records of one domain | `mail_domain_status` |
| `domain_connect_verify(domain_id)` | `mail.domain_connect` | Re-checks. Never sets `verified` unless the backend confirms | none |
| `domain_connect_list()` | `mail.domain_connect` | All domains with records | `mail_domain_status` |
| `domain_zone_export(domain_id)` | `mail.domain_connect` | A zone file text of the records | none |
| `domain_test_send(domain_id)` | `mail.domain_connect` | One test mail from a mailbox on the domain to itself. Administrators, three a minute | none |
| `domain_test_poll(domain_id, token)` | `mail.domain_connect` | Whether the test mail arrived; files it in Trash | none |

Full guidance: [[everjust-mail-domain-connect]]. `mail_domain_status` reads the domain tables directly,
so it works while the wizard flag is off.

## Not RPCs, not for agents

The inbound, bounce and IMAP bridge routes are signed server to server routes. The folder export is a
browser download. An agent has no business with either.
