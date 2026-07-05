---
name: everjust-website-blog
description: Author and publish BLOG POSTS on a live everjust.app tenant's public website — write a post's rich content + teaser + cover image + tags + SEO/OpenGraph meta, then publish it (now, back-dated, or scheduled) so it appears at /blog. Use when the task is to draft, edit, publish/unpublish, back-date, tag, or SEO-tune an everjust.app blog article, set up the blog, or manage the blog taxonomy. This is STOCK Odoo 19 website_blog (blog.blog / blog.post / blog.tag) driven through the everjust_agent_mcp generic ORM tools. Critical: a blog POST is a blog.post RECORD, NOT a website.page — you publish it with is_published (+ a past post_date), NOT with the website_publish WEBSITE TOOL; the website_* tools only touch static QWeb pages (the /blog index chrome, marketing pages), never an article. Cross-references [[everjust-platform]] (the QWeb site-chrome path) and [[everjust-agent-mcp]]; event pages are [[everjust-events]], and the publish-notification email is stock mail.thread, NOT [[everjust-mail-ops]].
---

# EVERJUST Website Blog — Agent Skill

Author and publish **blog articles** on a live everjust.app tenant's public website: write a
post's HTML content, teaser, cover image, tags and SEO/OpenGraph meta, then publish it (now,
back-dated, or scheduled) so it renders at `/blog` on the site — all through the Odoo MCP / ORM
(`search`, `get`, `create`, `update`, `call`, `describe_model`; see [[everjust-agent-mcp]] for
opening the session against the right tenant DB).

The crucial everjust fact: **this is STOCK Odoo 19 `website_blog`** — there is no custom everjust
blog addon. The models are vanilla `blog.blog` / `blog.post` / `blog.tag` / `blog.tag.category`.
So read fields from the live model (`describe_model` / `fields_get`), not from memory of an older
Odoo. What you must know that is everjust/version-specific:

- **A blog POST is a `blog.post` RECORD, not a `website.page`.** The MCP's WEBSITE TOOLS
  (`website_pages` / `website_new_page` / `website_edit_page` / `website_publish` / `website_menu`)
  operate on static QWeb pages (`ir.ui.view` / `website.page`). A `blog.post` is rendered by the
  `website_blog` controller at `/blog/<blog>/<post>`, so **you author it with `create`/`update` on
  `blog.post` and publish it with `is_published` — NOT with `website_publish`.** Using
  `website_publish` on a blog article is a category error (recipe 0, Pitfall 1).
- **Publishing is `is_published` + a `post_date` that is in the PAST.** A post shows on the public
  `/blog` only when `website_published` is True AND `post_date <= now`. A *future* `post_date` is how
  you SCHEDULE a post (it stays hidden to the public until that time even while published). **This
  build has NO `date_publish`, NO `website_indexed`, NO `visibility` field on `blog.post`** — do not
  reach for those; the two levers are `is_published` and `post_date`.
- **Publishing EMAILS the blog's followers.** Setting `is_published=True` fires the stock
  `website_blog` "Published Post" notification (subtype `website_blog.mt_blog_blog_published`,
  template `website_blog.blog_post_template_new_post`) to everyone following the parent `blog.blog`.
  This is **stock `mail.thread` chatter over the tenant's outgoing `ir.mail_server`** — NOT the
  [[everjust-mail-ops]] webmail stack. Know who follows the blog before you publish (recipe 5).
- **Cover image lives in `cover_properties` (a JSON text blob), not a plain field.** The cover is
  the `background-image` key inside that JSON, plus color/opacity/height keys.
- **Requires website-designer rights.** Creating/publishing posts and (especially) editing the site
  chrome needs the connected user in `website.group_website_designer` (a.k.a. `can_publish` on the
  post). A plain user can draft but often can't publish. Check `your_access` / `can_publish` first.

You reach the ORM through the platform's Odoo MCP tools — see [[everjust-agent-mcp]] for opening the
session against the right tenant DB. Every recipe below is expressed through that toolset.

## When to use this skill

- **Author a blog post** — create a `blog.post` with title, subtitle, rich HTML `content`, a teaser,
  a cover image, tags, and SEO/OpenGraph meta.
- **Publish / unpublish / schedule** a post — flip `is_published`, back-date its `post_date` so it
  looks like it went out earlier, or set a *future* `post_date` to schedule it.
- **Edit an existing post** — rewrite its content, swap its cover, retag it, tune its meta.
- **Manage the blog taxonomy** — create/rename `blog.tag`s (and optional `blog.tag.category`
  groupings) and attach them to posts so the `/blog` tag filter works.
- **Set up the blog itself** — create the `blog.blog` container (name, subtitle, cover), and ensure a
  `/blog` menu item exists so visitors can reach it.
- **Diagnose** — a post that won't appear on `/blog` (unpublished, future `post_date`, wrong
  `website_id`, wrong blog), or a taxonomy that isn't filtering.

**Do NOT use this skill for**, and stop if the task is really:

- **Editing the STATIC `/blog` index chrome, the marketing pages, or any non-blog page.** Those are
  QWeb `ir.ui.view` / `website.page` — the everjust marketing pages (`website_connectdomain`,
  `website_tcsw`) are verbatim Tailwind-utility QWeb wrapped in `<t t-call="website.layout">`. Edit
  those with the WEBSITE TOOLS (`website_edit_page`, COW-into-a-site-view) keeping the existing
  Tailwind idiom — that's the site-chrome path in [[everjust-platform]], NOT this skill. This skill
  is the *content model* (`blog.post`), not the page template.
- **Sending the "new post" announcement as marketing email / a newsletter blast.** The publish
  notification is stock chatter to *blog followers*; it is not the [[everjust-mail-ops]] webmail
  product and not a mass-mailing. To email a broad audience about a post, that's a different job
  (mass_mailing is gated; see [[everjust-platform]]).
- **Event pages / agendas** — those are `event.event` / `website_event`; see [[everjust-events]].
  A blog post is not an event.
- **Comments moderation / the discussion under a post** — those are `mail.message`
  (`message_type='comment'`) on the post's chatter; managing them is native Odoo chatter, not part of
  authoring.

## Architecture (the model map)

Everything is per-tenant DB and per-`website_id` (a post can be scoped to one site, or left global).
Real fields below are from `fields_get` on the live `connectdomain` DB (Odoo 19). **Note the
build-specific gaps** — this build has NO `blog.post.date_publish`, NO `website_indexed`, NO
`visibility`/`visibility_password` on the post; publishing is `is_published` + `post_date` only.

| Model | Role | Key fields (real, confirmed live) |
|---|---|---|
| `blog.blog` | **The blog container** — one section of the site holding many posts, with its own landing cover. | `name`* (Blog Name), `subtitle`, `content` (Html — the blog's own intro copy), `active`, `website_id` (**→`website`; `False` = show on ALL sites** — the default here), `cover_properties` (JSON cover, same shape as post), `blog_post_ids` (→`blog.post`), `blog_post_count` (computed). Inherits SEO meta (`website_meta_*`). |
| `blog.post` | **One article.** What you author + publish. | `name`* (**Title**, required), `subtitle` (Sub Title — also the default SEO/OG description), `blog_id`* (**→`blog.blog`, required** — which blog it lives in; defaults to the first blog), `content` (**Html — the article body; `sanitize=False`, `translate=html_translate`**), `teaser` (computed preview) / `teaser_manual` (**the field you WRITE to override the auto teaser**), `tag_ids` (→`blog.tag` m2m), `author_id` (→`res.partner`, default = you), `author_name` (stored, from author), `cover_properties` (**JSON text — the cover image + styling**), `is_published` (**bool, stored — the publish flag you set**), `website_published` (bool, **computed/non-stored mirror** — read it, don't write it), `post_date` (**Datetime — the public "publishing date"; a FUTURE value hides the post = scheduling**), `published_date` (Datetime — when it was actually first published), `can_publish` (**bool computed — may YOU publish?**), `website_id` (**related from `blog_id.website_id`, read-only** — set it via the blog, not the post), `website_url` (computed slug URL `/blog/<blog>/<post>`), `visits` (view count, readonly), `active`, `website_meta_title` / `website_meta_description` / `website_meta_keywords` / `website_meta_og_img` / `seo_name` (**SEO/OpenGraph overrides**). |
| `blog.tag` | **A taxonomy tag** for filtering `/blog`. | `name`* (**required, UNIQUE** across the tenant), `category_id` (→`blog.tag.category`, optional grouping), `color` (int, kanban color), `post_ids` (→`blog.post` m2m). Inherits SEO meta. |
| `blog.tag.category` | Optional grouping of tags (e.g. "Topic", "Product"). | `name`* (**required, UNIQUE**), `tag_ids` (→`blog.tag`). |

### The publish gate — read the codes, not the labels

A post is **publicly visible on `/blog`** only when BOTH hold:

1. **`website_published` is True** — which you set by writing **`is_published=True`** (`is_published`
   is the stored source; `website_published` is the non-stored mirror the front-end reads). AND
2. **`post_date <= now`** — the public `_search_get_detail` domain filters
   `("post_date","<=",now)` for non-designers. A **future `post_date` on a published post keeps it
   hidden from the public until that datetime** — this is exactly how you *schedule* a post. (A
   logged-in website-designer can preview unpublished/future posts; the public cannot.)

So the two levers are `is_published` (bool) and `post_date` (Datetime). There is **no separate
"schedule" field** in this build — set `post_date` to the future to schedule, to the past to
back-date. `published_date` records when it *first* went live and is generally managed for you (the
model stamps it on first publish); don't fight it — control visibility via `is_published` +
`post_date`.

### What `is_published=True` triggers (it emails followers)

`blog.post.write`/`create` call `_check_for_publication`: on transition to published it posts the
`website_blog.blog_post_template_new_post` message with subtype
`website_blog.mt_blog_blog_published` **on the parent `blog.blog`** — which notifies the blog's
followers (`blog.message_partner_ids`) by email through the tenant's stock outgoing `ir.mail_server`.
**This is NOT silent and NOT the [[everjust-mail-ops]] webmail stack.** Before publishing, know who
follows the blog (recipe 5) so you don't spray an unexpected announcement — or unpublish-then-set the
followers first. Repeated re-publish (already published → write `is_published=True` again) does not
re-fire the "new post" message for the same transition.

### The cover image is JSON in `cover_properties`

`cover_properties` is a **text field holding a JSON object**, e.g.
`{"background-image": "url('/web/image/blog.post/12/cover_image')", "background_color_class": "o_cc3", "opacity": "0.2", "resize_class": "o_half_screen_height"}`.
The cover picture is the **`background-image`** key (value `none` = no cover, or `url('…')`). To set a
cover you (a) upload the image as an `ir.attachment` / `image` and reference its URL, then (b) write
the whole JSON blob back into `cover_properties`. `resize_class` controls banner height
(`o_half_screen_height` / `o_full_screen_height` / `cover_mid_height` / `o_record_has_cover`),
`background_color_class` the overlay color, `opacity` the dim. Don't write a bare URL into
`cover_properties` — it must be valid JSON with the `background-image` key.

### SEO / OpenGraph

`subtitle` is the DEFAULT OG/Twitter description and meta description if you set nothing else. To
override: `website_meta_title` (page `<title>` / `og:title`), `website_meta_description`
(`og:description`), `website_meta_keywords`, `website_meta_og_img` (explicit OG image URL — else the
cover's `background-image` is used), `seo_name` (the URL slug override). OG `article:published_time`
= `post_date`, `article:tag` = the tag names — so **tag and date drive OG automatically**; you mostly
just set title/description/og-image.

## Recipes

Route each call through the Odoo MCP against the tenant DB (open the session per
[[everjust-agent-mcp]]; pick the DB, e.g. `connectdomain`). Recipes use the MCP toolset
(`search`, `get`, `create`, `update`, `call`, `describe_model`); ORM `env[...]` forms are shown where
clearer. On `connectdomain` at last check: one blog **"Connect Domain Blog" (id 2, `website_id=False`
⇒ all sites)**, 4 posts (all `is_published=False`), a `/blog` menu already present, and **0 tags**.

### 0. First: confirm this is the blog CONTENT path, not the page path — and that you can publish

The single most important orientation. A blog article is a `blog.post` record; the WEBSITE TOOLS are
for static pages. Do NOT reach for `website_new_page`/`website_publish` to make an article.

```
describe_model('blog.post')     # confirm your_access.{create,write}; note fields
# The blog(s) that exist on this tenant (which website each is bound to):
search('blog.blog', [], ['name','subtitle','website_id','blog_post_count'])
# Can YOU actually publish (vs only draft)?  can_publish needs website-designer rights:
get('blog.post', [<existing_post_id>], ['can_publish','is_published','website_published'])
```
If `can_publish` is False / `your_access.write` is False, you are not in
`website.group_website_designer` — you can draft but not publish; **do not** retry with
`confirm:true` (it's an ACL limit, not a confirm gate — see [[everjust-agent-mcp]]). To reach the
static `/blog` index chrome or a marketing page instead, that's `website_pages` / `website_edit_page`
(the QWeb path in [[everjust-platform]]), NOT this recipe.

### 1. Author a draft post (content + teaser + subtitle), unpublished

Create it **unpublished first** (`is_published=False`) so you don't email followers before it's
ready. `content` is HTML (`sanitize=False`) — write real article markup.

```
pid = create('blog.post', {
    'blog_id': 2,                                  # -> the target blog.blog (resolve via recipe 0)
    'name': 'Bring Your Own Domain, Automatically',   # Title (required)
    'subtitle': 'DNS auto-config + automatic SSL, without the support tickets.',  # also default OG desc
    'content': '<p>Custom domains used to mean a support queue…</p>'
               '<h2>How it works</h2><p>…</p>'
               '<figure><img src="/web/image/…" alt="…"/></figure>',
    'teaser_manual': 'A 1–2 sentence hook shown on the /blog listing card.',   # override auto teaser
    'is_published': False,                         # draft — no follower email yet
})
get('blog.post', [pid], ['name','website_url','is_published','post_date','teaser'])
```
Leave `teaser_manual` empty to auto-derive the teaser from the first ~200 chars of `content`. The
`website_url` returned is the slug path (`/blog/<blog-slug>/<post-slug>-<id>`). `author_id` defaults
to your partner; set it explicitly if the byline should differ. **Don't** set `website_id` on the
post — it's related from `blog_id.website_id`; choose the site by choosing the blog.

### 2. Give it a cover image (the `cover_properties` JSON)

The cover is the `background-image` key inside `cover_properties`. Upload the image, then write the
whole JSON back.

```
# a) stage the image (an attachment you can serve):
att = create('ir.attachment', {
    'name': 'byod-cover.png',
    'datas': '<base64>',                 # the PNG/JPG bytes, base64
    'res_model': 'blog.post', 'res_id': pid,
    'mimetype': 'image/png', 'public': True,
})
url = '/web/image/%s' % att            # servable URL for that attachment

# b) write the cover JSON (background-image + banner styling):
import json
update('blog.post', [pid], {'cover_properties': json.dumps({
    'background-image': "url('%s')" % url,
    'background_color_class': 'o_cc3',
    'opacity': '0.2',
    'resize_class': 'o_half_screen_height',   # banner height
})})
```
`background-image: "none"` = no cover. Keep it valid JSON — a bare URL string breaks the template.
The cover doubles as the OG image unless you set `website_meta_og_img` explicitly (recipe 4).

### 3. Tag the post (create the taxonomy if it's missing)

`blog.tag.name` is **unique** — reuse an existing tag id, don't create a duplicate name. On
`connectdomain` there are currently **0 tags**, so you'll create them.

```
# find-or-create tags (name is unique):
def tag(name):
    hit = search('blog.tag', [['name','=',name]], ['id'], 1)
    return hit[0]['id'] if hit else create('blog.tag', {'name': name})
tids = [tag('Product'), tag('DNS'), tag('Announcements')]
# optional: group tags under a category
cat = create('blog.tag.category', {'name': 'Topic'})     # name unique
update('blog.tag', tids, {'category_id': cat})
# attach to the post (m2m command tuple: 6,0 = replace set):
update('blog.post', [pid], {'tag_ids': [[6, 0, tids]]})
```
Tags power the `/blog` tag filter and feed OG `article:tag` automatically. Use `[[4, id]]` to *add* a
tag without replacing the set, `[[3, id]]` to remove one.

### 4. Set SEO / OpenGraph meta

If you set nothing, `subtitle` becomes the meta/OG description and the cover becomes the OG image —
often good enough. Override when you want a distinct search title/snippet:

```
update('blog.post', [pid], {
    'website_meta_title': 'Bring Your Own Domain for SaaS | Connect Domain',
    'website_meta_description': 'Let users connect a custom domain with automatic DNS + SSL. '
                               'Here is how Connect Domain does it in one click.',
    'website_meta_keywords': 'custom domains, BYOD, SaaS, DNS, SSL',
    'website_meta_og_img': url,          # explicit OG image (else the cover is used)
    'seo_name': 'bring-your-own-domain',  # URL slug override
})
```
`og:type='article'`, `article:published_time` (=`post_date`), `article:modified_time`, and
`article:tag` (=tag names) are filled by the model — you don't set them. Keep the meta title ≲60 chars
and description ≲155.

### 5. Publish — now, back-dated, or scheduled — after checking who gets emailed

Publishing emails the blog's followers (see Architecture). **Look before you publish.**

```
# Who follows the blog (they get the "Published Post" email)?
get('blog.blog', [2], ['message_partner_ids'])       # -> partner ids following the blog
search('mail.followers', [['res_model','=','blog.blog'],['res_id','=',2]], ['partner_id'])

# a) PUBLISH NOW (visible immediately; fires the follower email):
update('blog.post', [pid], {'is_published': True, 'post_date': '2026-07-05 14:00:00'})  # <= now

# b) BACK-DATE (looks like it went out earlier; still visible now since past<=now):
update('blog.post', [pid], {'is_published': True, 'post_date': '2026-06-20 09:00:00'})

# c) SCHEDULE (published flag set, but hidden from public until a FUTURE post_date):
update('blog.post', [pid], {'is_published': True, 'post_date': '2026-08-01 08:00:00'})
#    -> public cannot see it until 2026-08-01 08:00 UTC; designers can preview it.

# UNPUBLISH (pull it from the site; does not delete):
update('blog.post', [pid], {'is_published': False})
```
`post_date` is a **Datetime, UTC-naive** (like the rest of Odoo) — a future value is the schedule.
`is_published` is what you write; `website_published` is the computed mirror you *read* to confirm.
If you must publish quietly, note there is no per-write "skip notification" flag on this path — remove
unwanted followers from the `blog.blog` first, or publish while the post is already the current state.
Prefer this over the WEBSITE TOOLS: **`website_publish` publishes a `website.page`, not a
`blog.post`** — it will not make your article live (Pitfall 1).

### 6. Set up the blog container and its /blog menu (only if missing)

Usually the blog + `/blog` menu already exist (they do on `connectdomain`). Create only if a tenant
has none.

```
# a blog exists?
search('blog.blog', [], ['name','website_id'])
# create one (website_id=False shows it on all sites; set an id to scope to one site):
bid = create('blog.blog', {
    'name': 'Connect Domain Blog',
    'subtitle': 'Custom domains, done automatically.',
    'content': '<p>Notes from the team building open-source custom-domain onboarding.</p>',
    # 'website_id': 1,          # optional: scope to a single site
})
# ensure a nav menu points at /blog (the WEBSITE TOOL is right here — it's site chrome, not content):
website_menu(list=True)                        # is there already a /blog item?
website_menu(name='Blog', url='/blog', sequence=30)   # add one if not
```
The `/blog` **listing page and menu are site CHROME** — that's the one place the WEBSITE TOOLS
(`website_menu`, and `website_edit_page` if you want to restyle the index) legitimately apply. The
individual article pages are rendered from `blog.post` records by the `website_blog` controller — you
never create a `website.page` per article.

## Pitfalls (everjust-specific)

1. **A blog POST is a `blog.post` record, NOT a `website.page` — publish with `is_published`, not
   `website_publish`.** The MCP WEBSITE TOOLS (`website_pages`/`website_new_page`/`website_edit_page`/
   `website_publish`/`website_menu`) act on static QWeb pages (`ir.ui.view`/`website.page`). A blog
   article is content rendered by the `website_blog` controller at `/blog/<blog>/<post>`. Calling
   `website_publish` on an article does nothing to make it live. **Author with `create`/`update` on
   `blog.post`; publish with `is_published=True` + a past `post_date`.** The WEBSITE TOOLS are only for
   the `/blog` index chrome, the menu, and marketing pages (site-chrome path in [[everjust-platform]]).

2. **Publishing (`is_published=True`) EMAILS the blog's followers.** It fires the stock
   `website_blog` "Published Post" notification (subtype `mt_blog_blog_published`) on the parent
   `blog.blog` to its followers, over the tenant's outgoing `ir.mail_server`. It is not silent and it
   is **not** the [[everjust-mail-ops]] webmail product. Check `blog.message_partner_ids` /
   `mail.followers` before publishing; author as a draft (`is_published=False`) first and only flip it
   when the piece is final.

3. **Publish gate = `is_published` AND `post_date <= now`. A future `post_date` HIDES the post.**
   This build has **no `date_publish`/`website_indexed`/`visibility`** field on `blog.post`. Scheduling
   is a *future* `post_date` on a published post (public sees nothing until then; designers can
   preview). Back-dating is a *past* `post_date`. Don't hunt for a "schedule" or "sitemap" field — set
   `post_date`.

4. **`is_published` is the stored flag you WRITE; `website_published` is the computed mirror you
   READ.** Write `is_published`; read `website_published`/`can_publish` to confirm state and rights.
   Don't try to write `website_published` (non-stored) or `website_id` (related, read-only — choose the
   site by choosing the `blog_id`).

5. **The cover image is JSON in `cover_properties`, not a plain image field.** The picture is the
   `background-image` key inside that JSON blob (`url('…')` or `none`). Upload the image, then write the
   *whole* valid-JSON object back (with `background_color_class`/`opacity`/`resize_class`). A bare URL
   string in `cover_properties` breaks rendering.

6. **`blog.tag.name` and `blog.tag.category.name` are UNIQUE — find-or-create, don't duplicate.**
   Search for the tag by name and reuse its id; a duplicate name raises the uniqueness constraint. Use
   m2m command tuples on `tag_ids` (`[[6,0,ids]]` replace, `[[4,id]]` add, `[[3,id]]` remove) — never a
   bare id list.

7. **`content` is trusted HTML (`sanitize=False`) — you own what you inject.** The article body is not
   sanitized, so malformed or unsafe markup goes straight in. Write clean, well-formed HTML; don't paste
   untrusted markup. `teaser_manual` overrides the auto teaser; leave it blank to auto-derive from
   `content`.

8. **`can_publish` / website-designer rights gate publishing.** Creating a draft may be allowed while
   publishing is not — publishing (and any `website_edit_page` on chrome) needs
   `website.group_website_designer`. If `can_publish`/`your_access.write` is False, that's an ACL limit;
   don't retry with `confirm:true`. Get a key from a user with designer rights (see
   [[everjust-agent-mcp]]).

9. **`website_id=False` on the blog means "all sites"; a set id scopes it.** On multi-site tenants,
   confirm which site a blog/post belongs to before creating — a post inherits `website_id` from its
   `blog_id`. On `connectdomain` the one blog is global (`website_id=False`), so its posts show on the
   single site. Everything is per-tenant DB and per-`website_id` — verify you're on the right DB (see
   [[everjust-platform]]).

10. **Don't confuse the article's chatter comments with authoring.** Reader comments are
    `mail.message` (`message_type='comment'`) on the post's chatter; moderating them is native Odoo
    chatter, separate from writing/publishing the article. And the publish notification going to
    followers is chatter too — it does not go through mass_mailing or [[everjust-mail-ops]].

## See also

- [[everjust-platform]] — tenancy model, `/odoo` debrand, the `everjust.public_website` gate, per-tenant
  website/theme installs, and the QWeb **site-chrome / marketing-page path** (WEBSITE TOOLS,
  Tailwind-utility QWeb under `<t t-call="website.layout">`, COW-into-a-site-view). Read it for editing
  the `/blog` index or a marketing page — this skill is the blog CONTENT model, not the page template.
- [[everjust-agent-mcp]] — how to connect to the tenant MCP and the generic
  `search`/`get`/`create`/`update`/`call`/`describe_model` toolset every recipe above uses, plus the
  WEBSITE TOOLS' signatures and the `confirm`/ACL gates.
- [[everjust-events]] — the sibling public-website content type (`event.event`/`website_event`). Events
  and blog posts both publish to the site but are different models with different publish gates
  (`is_published`+`post_date` here vs `is_published`+`website_menu` there) — don't cross them.
- [[everjust-mail-ops]] — the SEPARATE everjust webmail product (`everjust.mail.*`). The blog's
  publish-notification email is stock `mail.thread` chatter to blog followers, NOT this stack — use that
  skill only if you're operating the webmail product itself, never to send the post announcement.
