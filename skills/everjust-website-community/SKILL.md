---
name: everjust-website-community
description: Operate the reputation / gamification / public-profile layer of an everjust.app (Odoo 19) tenant over the agent MCP — award karma (res.users via _add_karma + the karma-tracking ledger), grant/create/publish badges (gamification.badge(.user) → /profile/ranks_badges), configure/recompute challenges + goals (gamification.challenge), tune karma ranks, and expose/edit public member profiles (website_profile: /profile/users, /profile/user/<id>). Use to reward/penalize a member, hand out or design a badge, set up a leaderboard/challenge, retune rank thresholds, or make a profile public. STOCK Odoo gamification + website_profile + website_forum + rating under the everjust white-label (no custom addon): karma is a computed sum of an append-only ledger (never write karma directly); public visibility needs website_published on the partner AND everjust.public_website. Cross-refs [[everjust-platform]], [[everjust-agent-mcp]], [[everjust-website]]; notifications ride Odoo chatter, NOT [[everjust-mail-ops]].
---

# EVERJUST Website & Community — Agent Skill

Operate the **reputation + gamification + public-profile** layer of a live everjust.app
tenant as a running agent: award/track karma, grant and publish badges, run challenges
and leaderboards, tune karma ranks, and expose or edit members' public profile pages —
all through the Odoo MCP / ORM (`env["…"]`, `search`, `read`, `call` an exposed method)
plus the MCP **website tools** for the QWeb pages.

This is **stock Odoo 19**: `gamification` (karma, badges, challenges, goals, ranks),
`website_profile` (public `/profile/*` pages), plus `website_forum` and `rating` on this
tenant. There is **no custom everjust community addon** — everjust only rebrands the
chrome (`everjust_theme` / `everjust_brand_website`) and gates the public site with the
`everjust.public_website` config parameter. So you drive the vanilla models and methods,
and you edit the QWeb the vanilla way (COW into a website-specific view).

## When to use this skill

- **Award or dock reputation** — give a member karma for a contribution, or reason about
  why their karma/rank is what it is (read the tracking ledger).
- **Grant or design a badge** — hand an existing badge to a user, create a new
  `gamification.badge` with grant rules, or publish/unpublish a badge on the public
  `/profile/ranks_badges` page.
- **Set up or recompute a challenge / leaderboard** — define a goal + challenge, start it,
  or force a recompute so the numbers on the public leaderboard update *now*.
- **Tune karma ranks** — add/adjust a `gamification.karma.rank` threshold so members level
  up (Newbie → … → Doctor) at the karma values you want.
- **Make a member's profile public (or private)**, list who's public, or **edit the
  `/profile/*` web pages** (ranks & badges page, the members directory, a profile layout).

**Do NOT use this skill for**, and stop if the task is really:
- **The marketing pages** (`website_connectdomain`, `website_tcsw`) or generic site
  layout/snippets/menus/redirects — that's page-building, see [[everjust-website]].
  This skill only owns the `website_profile.*` QWeb (ranks/badges/members/profile) and the
  community data models.
- **Forum posts / Q&A moderation** as a content workflow — `website_forum` is installed and
  its karma hooks feed this layer, but authoring/moderating forum content is its own job.
  This skill covers the *karma/badge/rank* side that the forum drives.
- **Sending a real email** to a member — badge/challenge notifications go through **Odoo
  chatter** (`message_notify` / `message_post`), NOT the everjust webmail stack. If you need
  to actually email someone as a tenant mailbox, that's [[everjust-mail-ops]].
- **Business-record reputation** (CRM lead scoring, ratings on tasks) — `rating.rating` is a
  different mechanism; this skill is member/user karma.

You reach the ORM and the website tools through the platform's Odoo MCP — see
[[everjust-agent-mcp]] for opening a session against the right tenant DB, and note the
platform invariants in [[everjust-platform]]. **Website edits need admin / website-designer
role** on your API-key user; plain karma/badge writes need at least an internal user with
the gamification manager group.

## Architecture (the model map)

Everything hangs off `res.users` (the actor whose reputation this is) and its
`partner_id` (which carries the *public* visibility flag). One tenant DB per customer.

| Model | Role | Key real fields |
|---|---|---|
| `res.users` | **The reputation subject.** Carries karma + current/next rank + earned badges. | `karma` (int, **stored but COMPUTED** `@api.depends('karma_tracking_ids.new_value')` — the sum of the ledger; do NOT write it), `rank_id`→`gamification.karma.rank`, `next_rank_id`, `badge_ids`→`gamification.badge.user`, `gold_badge`/`silver_badge`/`bronze_badge` (computed counts), `karma_tracking_ids`→`gamification.karma.tracking` (group `base.group_system`), `website_published`/`website_url` (**related to `partner_id`**) |
| `gamification.karma.tracking` | **Append-only karma ledger.** One row per karma change; `res.users.karma` is derived from it. | `user_id`, `old_value`, `new_value` (req), `gain` (computed), `reason` (text), `origin_ref` (who/what caused it), `consolidated`, `tracking_date` |
| `gamification.badge` | A badge definition + its **grant rules** + public visibility. | `name` (req), `description` (html), `level` (`bronze`\|`silver`\|`gold`), `rule_auth` (req: `everyone`\|`users`\|`having`\|`nobody`), `rule_auth_user_ids` (who may grant, for `users`), `rule_auth_badge_ids` (for `having`), `rule_max`+`rule_max_number` (cap per grantor/month), `challenge_ids`, `owner_ids`→badge.user, `website_published` (**publishes it on `/profile/ranks_badges`**), `image_1920`, `stat_this_month` |
| `gamification.badge.user` | **One awarded badge** (badge ↔ user). Creating a row *is* awarding it. | `badge_id` (req), `user_id` (req), `sender_id` (who granted), `challenge_id` (if auto-earned), `comment`, `level` |
| `gamification.challenge` | A campaign that turns goals into a leaderboard + auto-badges. | `name`, `state` (`draft`\|`inprogress`\|`done`), `user_domain` (char, a domain string selecting participants), `user_ids`, `line_ids`→challenge.line (req), `period` (`once`\|`daily`\|`weekly`\|`monthly`\|`yearly`), `reward_id`/`reward_first_id` (badges), `challenge_category` (`hr`\|`other`\|`forum`), `visibility_mode` (`personal`\|`ranking`), `report_message_frequency` |
| `gamification.challenge.line` | A target inside a challenge. | `challenge_id`, `definition_id`→goal.definition, `target_goal` (float), `condition` |
| `gamification.goal.definition` | *What* is measured (a metric). | `name`, `computation_mode`, `model_id`+`field_id`+`domain` (count/sum from a model), `condition`, `batch_mode` |
| `gamification.goal` | *One user's progress* toward a definition (auto-generated by the challenge). | `user_id`, `definition_id`, `challenge_id`, `current`, `target_goal`, `state` (`inprogress`\|`reached`\|`failed`) |
| `gamification.karma.rank` | A named level unlocked at a karma threshold. | `name` (text, req), `karma_min` (int, req), `description` (html), `image_1920`, `user_ids` (who's currently at this rank) |

`website_profile` layers the public pages on top: it makes `gamification.badge` inherit
`website.published.mixin` (so a badge only shows publicly when `website_published=True`),
adds the profile-editable fields to `res.users` (`website_description`, `country_id`,
`city`, …), and ships the `/profile/*` controllers + `website_profile.*` QWeb views.

### Karma is a ledger sum — the ONE rule that matters

`res.users.karma` is a **computed, stored** field that sums `karma_tracking_ids.new_value`.
You change karma by **appending to the ledger**, which the framework does for you inside
`_add_karma(gain, source=None, reason=None)` → `_add_karma_batch`:

```
_add_karma(gain) → creates a gamification.karma.tracking row
                   {old_value: user.karma, new_value: user.karma + gain,
                    origin_ref, reason} → karma recomputes → rank recomputes (_rank_changed)
```

Writing `res.users.karma = N` directly is wrong: there's no ledger entry, the audit trail
lies, and on the next recompute the computed field overwrites your value from the ledger.
**Always `_add_karma`** (positive to reward, negative to dock).

### The public visibility gates (two of them, both must pass)

A member's public profile at `/profile/user/<id>` is reachable only when:
1. **`partner_id.website_published == True`** — the per-user gate. `res.users.website_published`
   is *related* to the partner, so publishing the user publishes the partner and vice-versa.
2. **the whole public site is on** — everjust gates `/` behind
   `ir.config_parameter('everjust.public_website') == '1'`. If that's `0`, no public page
   (profile, ranks, or marketing) renders at all for anonymous visitors.

A **badge** shows on `/profile/ranks_badges` only when its own `website_published` is True.
Ranks are always listed there (no per-rank publish flag).

## Recipes

Route each through the Odoo MCP (open an `env` on the tenant DB, then run the call). Use
the generic `search`/`get`/`create`/`update`/`call` tools for data; use the **website
tools** (`website_pages`, `website_edit_page`, `website_publish`) only for the QWeb pages.
Non-read `call` and structural writes need `confirm:true`.

### Award (or dock) karma — via the ledger, never a raw write

```python
u = env["res.users"].search([("login", "=", "jane@connectdomain.app")], limit=1)
# Reward:
u._add_karma(15, reason="Answered a support question")
# Dock (negative gain is fine):
u._add_karma(-5, reason="Removed spam post")
# Verify — karma is the ledger sum; rank auto-advances:
u.read(["karma", "rank_id", "next_rank_id"])
# Audit trail (why the karma is what it is):
env["gamification.karma.tracking"].search_read(
    [("user_id", "=", u.id)],
    ["old_value", "new_value", "reason", "origin_ref", "tracking_date"],
    order="tracking_date desc", limit=20)
```
`_add_karma` runs `_rank_changed`, so `rank_id`/`next_rank_id` update automatically when a
threshold is crossed. Do **not** `update` the `karma` field — it will be recomputed away and
leaves no tracking row (see Pitfalls).

### Grant an existing badge to a user (and notify them)

```python
badge = env["gamification.badge"].search([("name", "=", "Great Question")], limit=1)
u = env["res.users"].search([("login", "=", "jane@connectdomain.app")], limit=1)
# Creating the badge.user row IS the award. create() calls badge.check_granting(),
# which enforces rule_auth / rule_max — so a disallowed grant raises, it isn't silent.
bu = env["gamification.badge.user"].create({
    "badge_id": badge.id,
    "user_id": u.id,
    "sender_id": env.user.id,
    "comment": "For a genuinely useful question",
})
bu._send_badge()   # posts the "🎉 You earned …" chatter notification to the user's partner
```
`_send_badge()` operates on the recordset (no args) and notifies via **Odoo chatter**, not
the webmail stack. If `check_granting` refuses (e.g. `rule_auth='having'` and the user lacks
the prerequisite badge, or `rule_max` is exhausted), the `create` raises — read the error
rather than retrying.

### Create a new badge and publish it on the public ranks & badges page

```python
badge = env["gamification.badge"].create({
    "name": "Founding Member",
    "description": "<p>Joined in the first cohort.</p>",
    "level": "gold",
    "rule_auth": "nobody",          # only admins/challenges grant it; users can't self-award
    # for a peer-grantable badge instead: rule_auth="users", rule_max=True, rule_max_number=2
})
# Publish it so it appears on /profile/ranks_badges (website.published.mixin):
badge.website_published = True      # or: env["gamification.badge"].browse(badge.id).write({"website_published": True})
```
`rule_auth`: `everyone` (any logged-in user may grant), `users` (only
`rule_auth_user_ids`), `having` (only holders of `rule_auth_badge_ids`), `nobody` (system
/ challenge only). Publishing does nothing visible until the site gate
(`everjust.public_website=1`) is on.

### Add / adjust a karma rank threshold

```python
# List current ladder:
env["gamification.karma.rank"].search_read([], ["name", "karma_min"], order="karma_min")
# Insert a new tier (users auto-fall into it on next karma recompute / _rank_changed):
env["gamification.karma.rank"].create({"name": "Trusted Contributor", "karma_min": 500})
# Retune an existing threshold:
r = env["gamification.karma.rank"].search([("name", "=", "Student")], limit=1)
r.write({"karma_min": 250})
```
Ranks are evaluated by `karma_min` against each user's `karma`. A user's `rank_id` is the
highest rank whose `karma_min ≤ karma`; `next_rank_id` is the one above. Changing thresholds
re-sorts users on their next karma event; to reflect it immediately, touch each user's karma
(`_add_karma(0, reason="rank retune")`) or run `_recompute_rank` if you need a bulk sweep.

### Stand up a challenge / leaderboard and force it to compute NOW

```python
# Reuse or create the metric (goal definition), then the challenge + line:
defn = env["gamification.goal.definition"].search([("name", "=", "Forum Posts")], limit=1)
ch = env["gamification.challenge"].create({
    "name": "July Contributors",
    "challenge_category": "forum",
    "period": "monthly",
    "visibility_mode": "ranking",              # ranking => public leaderboard, not personal cards
    "user_domain": "[('karma', '>', 0)]",      # who competes (a domain STRING)
    "reward_id": env["gamification.badge"].search([("name","=","Contributor")],limit=1).id or False,
    "line_ids": [(0, 0, {"definition_id": defn.id, "target_goal": 10})],
})
ch.action_start()          # state -> 'inprogress' (draft challenges compute nothing)
# Recompute leaderboard numbers immediately:
ch.action_check()          # unlinks in-progress goals + regenerates + recomputes (bypasses the presence gate)
```
**`_update_all()` (what the daily cron `_cron_update` calls) only recomputes goals for users
who've been *present in the webclient* since the last update** — a public/API-driven member
may never trigger it. For an on-demand, deterministic recompute use **`action_check()`**
(it deletes in-progress goals then calls `_update_all`, so numbers reflect current data). A
`draft` challenge is inert; `action_start()` first.

### Publish (or hide) a member's public profile, and list who's public

```python
u = env["res.users"].search([("login", "=", "jane@connectdomain.app")], limit=1)
u.website_published = True          # related field -> flips partner_id.website_published too
print(u.website_url)                # e.g. /profile/user/42  (only live if everjust.public_website=1)
# Who is currently public:
env["res.users"].search_read(
    [("website_published", "=", True), ("share", "=", False)],
    ["name", "login", "karma", "rank_id", "website_url"])
# Confirm the site-wide public gate is actually on:
env["ir.config_parameter"].sudo().get_param("everjust.public_website")   # '1' => public site live
```
Setting `website_published=False` (or leaving it False) makes `/profile/user/<id>` return the
`website_profile.profile_access_denied` page for anonymous visitors. The members directory is
`/profile/users` and the ranks/badges page is `/profile/ranks_badges`.

### Edit a `website_profile` page (ranks/badges, members directory, profile layout)

```python
# Inspect the public community pages:
website_pages(search="profile")     # find /profile/ranks_badges, /profile/users, …
# The QWeb keys are website_profile.* (e.g. rank_badge_main, users_page_content,
# user_profile_main). Rewrite the FULL arch — the tool COPY-ON-WRITEs into a
# website-specific ir.ui.view so a module upgrade never clobbers your edit:
website_edit_page(url="/profile/ranks_badges", arch="<t t-name=…> …full QWeb… </t>")
```
These pages are **QWeb templates wrapped in `website.layout`**, styled by the everjust theme
(monochrome, Space Grotesk/Geist) — NOT `s_*` builder snippets, so you edit the arch and
reuse the theme's classes rather than dropping snippets. Always `website_pages` first to get
the exact current arch before rewriting; `website_edit_page` replaces the whole template.
Only touch the `website_profile.*` views here; the marketing pages are
[[everjust-website]] territory.

## Pitfalls

1. **NEVER write `res.users.karma` directly.** It's a computed field summing the
   `gamification.karma.tracking` ledger. A raw write leaves no audit row, breaks the rank
   recompute, and is overwritten by the compute on the next karma event. Use
   `user._add_karma(gain, reason=…)` — positive to reward, negative to dock. It appends the
   ledger row *and* triggers `_rank_changed` for you.

2. **Creating a `gamification.badge.user` row IS the award, and it enforces rules.** `create`
   calls `badge.check_granting()` (`rule_auth` / `rule_max`), so a disallowed grant *raises* —
   don't assume it silently succeeded. Set `sender_id` and call `_send_badge()` afterward to
   notify. Don't hand-fabricate the notification; `_send_badge()` posts the correct chatter.

3. **`_update_all()` is presence-gated; use `action_check()` for a real recompute.** The cron
   path only updates goals for users active in the webclient recently (`mail_presence`), so
   API-only / public members can look stale forever. `action_check()` unlinks in-progress
   goals and regenerates them from current data — that's your deterministic "recompute the
   leaderboard now." And a `draft` challenge computes nothing until `action_start()`.

4. **Two independent publish gates for public visibility.** Per-user:
   `partner_id.website_published` (via the related `res.users.website_published`). Site-wide:
   `ir.config_parameter('everjust.public_website') == '1'`. Publishing a user does nothing for
   anonymous visitors if the site gate is `0`; and toggling the site gate is a platform-level
   decision (see [[everjust-platform]]), not a per-member action. Badges have their *own*
   `website_published` for `/profile/ranks_badges`.

5. **Badge/challenge/rank notifications are Odoo chatter, not everjust webmail.** `_send_badge`
   and challenge reports go through `message_notify`/`message_post` to the user's partner. Do
   NOT reach for the `everjust.mail.*` stack ([[everjust-mail-ops]]) here, and don't expect a
   row in a mailbox's Sent folder — it's an internal notification.

6. **`user_domain` on a challenge is a domain STRING, not a list.** It's stored as a char and
   `ast.literal_eval`'d (`"[('karma','>',0)]"`). A malformed string silently selects nobody.
   After editing it, run `action_check()` and confirm `user_ids` repopulated.

7. **Edit only `website_profile.*` views here, and always read before you write.**
   `website_edit_page` rewrites the *entire* template arch and COW-forks it into a
   website-specific view — fetch the current arch with `website_pages` first so you don't drop
   sections. The marketing pages (`website_connectdomain`, `website_tcsw`) and generic
   snippets/menus/redirects are [[everjust-website]], not this skill.

8. **Everything is per-tenant; website edits need the right role.** One DB per customer; karma,
   badges, ranks and profiles are all in that tenant's DB. Data writes need the gamification
   manager group; **page edits (`website_edit_page`) need admin / website-designer** on your
   API-key user. Confirm you're on the correct tenant DB before mutating (see
   [[everjust-agent-mcp]]).
