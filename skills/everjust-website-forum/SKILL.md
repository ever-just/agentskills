---
name: everjust-website-forum
description: Operate the Q&A Forum (website_forum) app of a live everjust.app tenant via the Odoo MCP/ORM — the full ask→answer→accept→close/validate lifecycle plus votes, tags, the karma economy, and moderation. Use when the task is to create/configure a forum.forum, post a question or an answer (answers are forum.post rows with a parent_id, NOT comments), accept the correct answer (is_correct), up/downvote a post, add/retag tags, moderate (validate a pending post, close/reopen, flag, mark offensive), grant a user forum karma, or read forum state. This is STOCK Odoo website_forum + gamification (karma is res.users.karma, a STORED field driven by gamification.karma.tracking) — NO custom everjust forum addon; every write is karma-gated by the forum's karma_* fields and you act as one Odoo user. The public /forum pages are QWeb edited via the website_* tools, NOT this ORM. Cross-references [[everjust-platform]], [[everjust-agent-mcp]], and siblings [[everjust-events]], [[everjust-mail-ops]].
---

# EVERJUST Website Forum — Agent Skill

Operate the **Q&A Forum** of a live everjust.app tenant as an agent: create and configure a
forum, ask questions and post answers, accept the correct answer, vote, tag, and moderate — all
through the Odoo MCP / ORM (`search`, `get`, `create`, `update`, `call`, `describe_model`; see
[[everjust-agent-mcp]] for opening the session against the right tenant DB). The public
`/forum/...` pages are stock QWeb; edit those with the **website_\*** tools (see the last
recipe), not this model layer.

The crucial everjust fact: **there is NO custom everjust forum addon.** This is **stock Odoo
`website_forum`** riding on **`gamification`**. Read the field set from the live model
(`describe_model` / `fields_get`), not from an everjust addon. What you must internalize is
everything else on this page: the lifecycle is expressed as `forum.post` rows (a **question** is
a root post; an **answer** is a `forum.post` with `parent_id` set — an answer is NOT a
`mail.message` comment), the "accept" is a boolean `is_correct`, and **every mutation is
karma-gated** by the owning `forum.forum`'s `karma_*` fields against the acting user's
`res.users.karma`. `website_forum` is optional per tenant — it is installed on `connectdomain`
(one live forum, *Connect Domain Community*), but on a tenant without it `forum.forum` is a
`KeyError`; check first (see Pitfalls).

## When to use this skill

- **Configure a forum** — create a `forum.forum`, set `mode` (questions vs discussions),
  `privacy`, default sort, welcome/FAQ, and (importantly) tune the `karma_*` economy.
- **Ask a question** — create a root `forum.post` (`parent_id` unset).
- **Answer a question** — create a child `forum.post` with `parent_id = <question id>`.
- **Accept the correct answer** — set the answer's `is_correct = True` (awards karma).
- **Vote** — up/downvote a post via its `vote()` method (never write `forum.post.vote` raw).
- **Tag / retag** — create `forum.tag` rows and attach them to a question's `tag_ids`.
- **Moderate** — validate a `pending` question, close/reopen with a reason, flag, or
  mark offensive; read the moderation queues (`count_posts_waiting_validation`,
  `count_flagged_posts`).
- **Grant karma** — bootstrap a user so they clear the `karma_*` gates (`_add_karma` /
  writing `res.users.karma`).
- **Edit the public forum pages / layout** — QWeb, via the **website_\*** MCP tools.

**Do NOT use this skill for**, and stop if the task is really:
- **Odoo Discuss / chatter / general `message_post`** — forum *comments* are `mail.message`
  on a post, but the Q&A objects (question/answer) are `forum.post`. Don't model an answer as a
  chatter comment (see Pitfalls) and don't reach for [[everjust-mail-ops]] (that's the separate
  webmail stack).
- **The `/forum` page HTML/design** — that's stock QWeb served by the `website_forum`
  controllers; rewrite it with `website_edit_page` (COW-safe), not by writing `ir.ui.view`.
- **A tenant without `website_forum` installed** — installing a module is platform-ops; see
  [[everjust-platform]].

## Architecture (the model map)

`website_forum` layers on `mail.thread` + `website.*` mixins + `gamification`. Everything below
is stock Odoo 19 (verified live on `connectdomain`).

| Model | Role | Key fields |
|---|---|---|
| `forum.forum` | A forum container. **Holds the entire karma economy** — the `karma_gen_*` (earnings) and `karma_*` (action thresholds) fields the whole app reads. | `name`, `mode` (`questions`=1 answer\|`discussions`=multiple), `privacy` (`public`\|`connected`\|`private` + `authorized_group_id`), `default_order`, `faq`, `welcome_message`, `tag_ids`, `post_ids`, `can_moderate` (computed: `user.karma >= karma_moderate`), `count_posts_waiting_validation`, `count_flagged_posts`, plus the karma fields below. |
| `forum.post` | **The Q&A object — both questions AND answers.** A question is a root post (`parent_id` unset); an answer is a post with `parent_id` = the question. | `name` (title; answers usually blank/`Re:`), `content` (Html), `forum_id` (required), `parent_id` (→ question; set = this is an answer), `state` (`active`\|`pending`\|`close`\|`offensive`\|`flagged`), `is_correct` (**the "accepted answer" flag**), `active`, `tag_ids`, `vote_count` (store), `child_count`, `has_validated_answer`, `closed_reason_id/uid/date`, `moderator_id`, `flag_user_id`, and a large family of `can_*`/`karma_*` computed rights (`can_answer`, `can_accept`, `can_close`, `can_moderate`, `karma_accept`, …). |
| `forum.post.vote` | One user's vote on a post. **Written only via `forum.post.vote()`** — the karma side-effects live in its own create/write. | `post_id`, `user_id` (default = caller; can't set another's), `vote` (`'1'`\|`'-1'`\|`'0'`), `forum_id`/`recipient_id` (related, stored). Unique `(post_id, user_id)`. |
| `forum.tag` | A tag scoped to one forum. Creating one costs `karma_tag_create`. | `name`, `forum_id` (required), `color`, `post_ids` (m2m via `forum_tag_rel`, domain state=active), `posts_count`. Unique `(name, forum_id)`. |
| `forum.post.reason` | Close/offensive reason picklist (seed data). | `name`, `reason_type` (`basic`\|`offensive`). Key xmlids: `website_forum.reason_7` (offensive) and `website_forum.reason_8` (spam) trigger the karma-penalty branch in `close()`. |
| `res.users` | Carries **`karma`** — a **STORED computed integer** recomputed from `gamification.karma.tracking` history (`_compute_karma`). Every earn/spend is a tracking row. | `karma`, `karma_tracking_ids` (grouped `base.group_system`), `rank_id`, `*_badge`. |
| `gamification.karma.tracking` | Immutable ledger of karma changes (`old_value`→`new_value`, `reason`, `origin_ref`). The source of truth `karma` derives from. | Don't hand-edit; use `_add_karma`. |

Forum URL shape (all computed): forum `/forum/<slug>-<id>`, question
`/forum/<forum-slug>/<post-slug>`, answer adds `#answer_<id>`, tag
`/forum/<forum-slug>/tag/<tag-slug>/questions`.

### The karma economy (this is the whole app)

Two families of Integer fields on **`forum.forum`** (defaults shown; **live `connectdomain`
values differ** — e.g. that forum runs `karma_ask=3, karma_answer=3, karma_upvote=5,
karma_downvote=50, karma_tag_create=30, karma_moderate=1000, karma_answer_accept_own=20,
karma_answer_accept_all=500` — always read the real forum, never assume defaults):

- **Earnings — `karma_gen_*`** (added to a user's `karma` when an event fires):
  `karma_gen_question_new` (+2 ask), `karma_gen_question_upvote` (+5), `karma_gen_question_downvote`
  (−2), `karma_gen_answer_upvote` (+10), `karma_gen_answer_downvote` (−2),
  `karma_gen_answer_accept` (+2 to the *accepter*), `karma_gen_answer_accepted` (+15 to the *answer
  author* when their answer is accepted), `karma_gen_answer_flagged` (−100, spam/offensive
  penalty).
- **Action thresholds — `karma_*`** (min karma the acting user needs, else `AccessError`):
  `karma_ask` (3), `karma_answer` (3), `karma_upvote` (5), `karma_downvote` (50),
  `karma_answer_accept_own` (20) / `karma_answer_accept_all` (500), `karma_edit_own` (1) /
  `karma_edit_all` (300), `karma_edit_retag` (75), `karma_close_own` (100) / `karma_close_all`
  (500), `karma_unlink_own` (500) / `karma_unlink_all` (1000), `karma_tag_create` (30),
  `karma_flag` (500), `karma_moderate` (1000), `karma_post` (100 — below it, a new question lands
  `pending` and needs moderation), `karma_editor` (30 — below it you can't post images/links),
  `karma_dofollow` (500 — below it your links get `rel=nofollow`), `karma_comment_*`,
  `karma_comment_convert_*`, `karma_comment_unlink_*`.

The **own-vs-all pattern is everywhere**: acting on *your own* post needs the `_own` threshold;
acting on *anyone's* needs the (higher) `_all` threshold. The post exposes the resolved value as
computed fields — `post.karma_accept`, `post.karma_close`, `post.karma_edit`, `post.karma_unlink`
— and the boolean gate as `post.can_accept`, `post.can_close`, `post.can_edit`, etc. **Read those
`can_*` booleans before you attempt the write** — they already fold in own/all AND admin bypass
(`env.is_admin()` skips all karma gates).

## Recipes

Route each through the Odoo MCP (open an `env` on the tenant DB — see [[everjust-agent-mcp]]).
Prefer the generic `search`/`get`/`create`/`update` tools; use `call` for the model methods
(`vote`, `close`, `validate`, `reopen`). Non-read `call` and `update` on structural things need
`confirm:true`. **Because writes are karma-gated, the agent's own `res.users.karma` matters** —
if you're acting as a low-karma service user, either bootstrap its karma (last recipe) or act as
an admin user (admin bypasses every gate).

### 0. Confirm the app + read the forum's live karma settings (do this first)

```python
"forum.forum" in env                       # False on tenants without website_forum → stop
forum = env["forum.forum"].search([], limit=1)   # e.g. "Connect Domain Community", id 2
forum.read(["name", "mode", "privacy", "default_order",
            "karma_ask", "karma_answer", "karma_upvote", "karma_downvote",
            "karma_tag_create", "karma_post", "karma_moderate",
            "karma_answer_accept_own", "karma_answer_accept_all",
            "karma_gen_question_new", "karma_gen_answer_accepted", "karma_gen_answer_flagged"])
env.user.karma          # the acting user's spendable karma — every gate compares to this
forum.can_moderate      # True iff env.user.karma >= forum.karma_moderate
```
Never assume the module defaults — this forum may have been re-tuned. `mode='questions'`
enforces **one** answer per question in the UI flow; `discussions` allows many.

### 1. Ask a question (root post) and answer it (child post)

```python
# QUESTION = a root forum.post (no parent_id). Requires env.user.karma >= forum.karma_ask.
qid = env["forum.post"].create({
    "forum_id": forum.id,
    "name": "How does Connect Domain auto-provision SSL?",
    "content": "<p>What issues the cert, and when does it renew?</p>",
    "tag_ids": [(6, 0, [])],        # optional; see tag recipe
}).id
# Note the auto-gates baked into create():
#   • karma < karma_ask  → AccessError; karma < karma_post → the question is saved state='pending'
#     (needs a moderator to validate() before it's publicly 'active').
#   • karma < karma_editor and content has <img>/<a> → AccessError ("karma required to post image/link").
#   • asking a question (when it lands 'active') auto-awards karma_gen_question_new.

# ANSWER = a forum.post WITH parent_id = the question. Requires karma >= forum.karma_answer.
aid = env["forum.post"].create({
    "forum_id": forum.id,
    "parent_id": qid,               # <-- THIS is what makes it an answer, not a question
    "content": "<p>ACM issues it via DNS-01; it renews ~30 days before expiry.</p>",
}).id
# Answering a closed/deleted question raises UserError. In 'questions' mode the UI allows
# only one answer per author; the ORM lets you create more, so respect mode yourself.
```
An answer's `name` is typically empty or `Re: <question>`; the body is `content`. Do **not**
create an answer as a chatter comment — an answer is a first-class `forum.post` and only rows
with a `parent_id` count as answers (`child_count`, `has_validated_answer`, the QAPage schema).

### 2. Accept the correct answer (`is_correct`) — the karma-bearing "solve"

```python
answer = env["forum.post"].browse(aid)
answer.can_accept          # gate: fold(own/all) — accepting on YOUR OWN question needs
                           # karma_answer_accept_own, on anyone's needs karma_answer_accept_all
# Accept = set is_correct True on the ANSWER (write() enforces can_accept and moves karma):
env["forum.post"].write([aid], {"is_correct": True})   # MCP update tool
#   → answer author gains karma_gen_answer_accepted (+15 default);
#     the accepter gains karma_gen_answer_accept (+2 default) — UNLESS accepter == author
#     (self-acceptance grants no karma). Un-accepting (is_correct=False) reverses both.
# Read back the "solved" rollup on the question:
env["forum.post"].browse(qid).read(["has_validated_answer", "child_count"])
```
`is_correct` is the accepted-answer flag; the question's `_order` floats correct answers to the
top (`is_correct DESC, vote_count DESC, ...`). In `questions` mode there is conceptually one
accepted answer.

### 3. Vote — always via the `vote()` method (never write `forum.post.vote` directly)

```python
# Toggle semantics: calling vote(upvote=True) again removes the upvote; opposite vote flips it.
env["forum.post"].call(qid, "vote", kwargs={"upvote": True})    # → {"vote_count", "user_vote"}
env["forum.post"].call(aid, "vote", kwargs={"upvote": False})   # downvote
```
Gates the method enforces for you: you **cannot vote on your own post** (`UserError`);
upvoting needs `karma_upvote`, downvoting needs the (much higher) `karma_downvote` — unless you're
toggling off an existing opposite vote. Voting moves karma to the **post's author**
(`recipient_id`) per the forum's `karma_gen_*_upvote/downvote`. Writing a `forum.post.vote` row by
hand bypasses the own-post check, the karma gate, AND the karma award — don't.

### 4. Tags: create + attach + retag

```python
# Create a forum-scoped tag (costs karma_tag_create; unique per forum). Admin bypasses.
tag = env["forum.tag"].create({"name": "ssl", "forum_id": forum.id})
# Attach tags to a QUESTION (only questions carry tags). Retagging an existing post's tags
# needs karma_edit_retag if you're changing the set:
env["forum.post"].write([qid], {"tag_ids": [(6, 0, [tag.id])]})     # replace set
env["forum.post"].write([qid], {"tag_ids": [(4, tag.id)]})          # add one
# Read a forum's tags + usage:
env["forum.tag"].search_read([("forum_id", "=", forum.id)], ["name", "posts_count"])
```
`posts_count` only counts `state='active'` posts (it's in the m2m domain). The forum also
exposes `tag_most_used_ids` / `tag_unused_ids`.

### 5. Moderate: validate a pending question, close/reopen, flag, mark offensive

```python
# The moderation queues on the forum:
forum.read(["count_posts_waiting_validation", "count_flagged_posts"])
pending = env["forum.post"].search([("forum_id","=",forum.id), ("state","=","pending")])
flagged = env["forum.post"].search([("forum_id","=",forum.id), ("state","=","flagged")])

# VALIDATE a pending question (approve it) — needs karma_moderate; awards the ask-karma that
# was withheld while pending, sets state='active', moderator_id=you:
env["forum.post"].call(pending.ids, "validate")

# CLOSE a question with a reason (pass the reason RECORD id). Closing spam/offensive
# (reason_8 / reason_7) also DOCKS the author's karma (karma_gen_answer_flagged, ×10 on a
# first post). Only questions (parent_id unset) can be closed.
reason_off  = env.ref("website_forum.reason_7").id   # "offensive"  (id 6 on connectdomain)
reason_spam = env.ref("website_forum.reason_8").id   # "spam"       (id 7)
reason_dupe = env.ref("website_forum.reason_1").id   # "Duplicate post" (no karma penalty)
env["forum.post"].call(qid, "close", args=[reason_dupe])       # gate: can_close (own/all)
env["forum.post"].call(qid, "reopen")                          # reverses; refunds spam/offensive dock

# FLAG a post as offensive (needs karma_flag) → state='flagged' for a moderator to review:
env["forum.post"].call(aid, "_flag")
# MARK OFFENSIVE (moderator, needs karma_moderate): archives + docks author karma:
env["forum.post"].call(aid, "_mark_as_offensive", args=[reason_off])
```
`close`/`reopen`/`validate`/`_flag`/`_mark_as_offensive` are model methods (use the `call` tool
with `confirm:true`). They each re-check the karma gate server-side and raise `AccessError` if the
acting user is short — so if you're a low-karma service user, moderate as an admin or grant
`karma_moderate` first.

### 6. Grant a user forum karma (so they clear the gates)

`res.users.karma` is a **stored computed** field backed by the karma ledger — writing it directly
works (it logs a tracking row via `res.users.write`), but the idiomatic path is `_add_karma`:

```python
u = env["res.users"].browse(uid)
u.read(["login", "karma"])
# Idiomatic: append a ledger entry (also updates the stored karma):
env["res.users"].call([uid], "_add_karma", args=[1000], kwargs={"reason": "Forum bootstrap"})
# Or set an absolute value (write() diffs and logs the delta to gamification.karma.tracking):
env["res.users"].write([uid], {"karma": 1000})
```
Karma is **per-user, tenant-wide** (not per-forum) — it's a `res.users` field, so a user's karma
applies across every forum on that tenant. Grant enough to clear the specific `karma_*` gate the
task needs (e.g. `karma_moderate` to run recipe 5). Do **not** hand-edit
`gamification.karma.tracking` rows.

### 7. Edit the PUBLIC forum pages (QWeb) — website_\* tools, not this ORM

The `/forum` list, question, and tag pages are stock `website_forum` QWeb served by its
controllers. To restyle/copy-tweak them, go through the **website tools** (COW-safe — Odoo forks
the module view into a site-specific `ir.ui.view` so upgrades never clobber your edit):

```
website_pages                          # find the /forum-related pages + their view ids
website_edit_page(url="/forum", arch=<full QWeb XML>)   # read current arch FIRST; keep the idiom
website_publish(url="/forum", published=True, indexed=True)
website_menu(name="Community", url="/forum")            # add a nav entry (there's already one)
```
On everjust the marketing pages are Tailwind-utility QWeb wrapped in
`<t t-call="website.layout">`; the forum templates are stock Bootstrap QWeb — either way, **read
the current arch before rewriting** and reuse the existing classes. Editing forum pages needs the
`website.group_website_designer` role (the everjust Administrator role includes it —
see [[everjust-platform]]). Never hand-write the `ir.ui.view` directly; use `website_edit_page`.

## Pitfalls

1. **An answer is a `forum.post` with `parent_id`, NOT a chatter comment.** The Q&A hierarchy is
   parent (question) → children (answers), all `forum.post`. `mail.message` comments exist on a
   post too, but they are *comments*, and only real answers count toward `child_count`,
   `has_validated_answer`, acceptance, and the QAPage schema. Don't model "answer" as
   `message_post` — and don't confuse this with the [[everjust-mail-ops]] webmail stack.

2. **`is_correct` is the "accept," and self-acceptance grants no karma.** Setting
   `is_correct=True` on an answer awards `karma_gen_answer_accepted` to the author and
   `karma_gen_answer_accept` to the accepter — *unless the accepter is the author*, in which case
   no karma moves. Flipping it back reverses the award. Deleting an already-accepted answer also
   claws back the karma.

3. **Every write is karma-gated against `env.user.karma` — read `can_*` first.** `create` on a
   post checks `can_ask`/`can_answer`; `write` checks `can_edit`/`can_close`/`can_accept`/
   `can_unlink`/retag; `vote`/`close`/`validate`/`_flag`/`_mark_as_offensive` each re-check. A
   low-karma service user gets `AccessError`. Either act as an admin (bypasses all gates via
   `env.is_admin()`) or grant the user the needed karma (recipe 6) — don't try to force the write.

4. **Never write `forum.post.vote` directly — call `vote()`.** The own-post ban, the
   up/downvote karma gate, and the karma award to the author all live in the vote model's
   create/write and in the toggle logic. A raw row skips all three and corrupts the karma ledger.

5. **`karma_post` decides pending vs active on a NEW question.** Below `karma_post` (default 100),
   a newly asked question is saved `state='pending'` and is invisible publicly until a moderator
   `validate()`s it (which then awards the withheld ask-karma). So "I created it but it's not on
   the site" usually means it's pending, not failed.

6. **`close`/`reopen`/`mark offensive` take a reason RECORD id and can move karma.** Pass the
   `forum.post.reason` id (resolve via `env.ref("website_forum.reason_N")`). Closing with the
   spam (`reason_8`) or offensive (`reason_7`) reason **docks the author's karma**
   (`karma_gen_answer_flagged`, ×10 for a first post); `reopen` refunds it. Only root questions
   (`parent_id` unset) can be closed/reopened.

7. **`res.users.karma` is a stored computed field over `gamification.karma.tracking`.** Writing
   `karma` works (it diffs and logs a tracking row) but never edit tracking rows by hand and never
   assume karma is a plain writable integer with no side-effects. Karma is **tenant-wide per
   user**, not per-forum.

8. **`website_forum` is optional per tenant.** It's installed on `connectdomain`; on a tenant
   without it, `forum.forum`/`forum.post` raise `KeyError`. Check `"forum.forum" in env` (or
   `list_installed_modules`) before acting, and remember you're bounded by *your* Odoo user's
   permissions and karma on *this one* tenant DB (see [[everjust-agent-mcp]]).

9. **`mode` is advisory at the ORM layer.** `questions` mode means "one answer" in the guided UI,
   but the ORM will let you create multiple child posts. If the task implies single-answer
   semantics, enforce it yourself (check existing `child_ids` before adding an answer).

10. **Don't restyle the forum by writing `ir.ui.view`.** Use `website_edit_page` (COW-safe) so a
    module upgrade never clobbers the edit; read the page's current arch first and keep the
    existing QWeb/class idiom (recipe 7).
