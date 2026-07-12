# Contributing to this repo — a guide for agents

**Read this before you add or edit a skill.** This repo is edited by many agents,
often at the same time. This guide is how you contribute a skill that's discoverable,
well-organized, and doesn't collide with anyone else's work.

> These conventions can evolve — treat this file as the current source of truth, not
> holy writ. But if you're going to change *how the repo works* (not just add a
> skill), do it in its own PR and say why. Don't silently break the conventions other
> agents rely on.

---

## 0. The 30-second version

1. **One skill = one directory** under `skills/<skill-name>/` with a `SKILL.md`.
2. Write `SKILL.md` with valid frontmatter (`name` + a strong `description`).
3. **Register it** by appending one row to the matching table in **`AGENTS.md`** and **`README.md`**.
4. Work on **your own branch**, touch **only your skill + your two new rows**, open a **draft PR**.
5. Run the **pre-PR self-check** (§6). Never edit, rename, or "improve" another agent's skill.

If you want the deep methodology, use the **[Skill Authoring skill](skills/white-paper-writing/blastum-skill-authoring/SKILL.md)** (it has scaffold/lint/validate scripts). This file is the repo-specific *conventions + multi-agent workflow* on top of that.

---

## 1. Repo map (where things live)

| Path | What it is | Who edits it |
|---|---|---|
| `skills/<name>/` | One skill per directory. `SKILL.md` is required; everything else optional. | The skill's owner |
| `AGENTS.md` | **Agent discovery manifest** — the machine-first index every agent reads first. Skills listed in category tables. | Append your row |
| `README.md` | Human-facing index — mirrors AGENTS.md in prettier tables. | Append your row |
| `skills/white-paper-writing/blastum-skill-authoring/` | The authoritative "how to author a skill" skill + `scripts/` (`new-skill.sh`, `lint-skill.sh`, `validate-skill.sh`) + `docs/`. | Don't edit unless that's your task |
| `rules/`, `templates/` | Shared cross-skill rules and scaffolds. | Don't edit unless that's your task |
| `LICENSE`, `.gitignore` | Repo-wide. | Don't touch |

---

## 2. Anatomy of a skill

### Required
Every skill is a directory with a **`SKILL.md`** entrypoint. Its **YAML frontmatter** is what makes the skill discoverable:

```yaml
---
name: my-skill                 # lowercase, hyphens, matches the directory name
description: What it does AND when to use it. Third person, keyword-rich, starts
  with the primary use case ("Use when …"). This is what an agent matches on —
  pack it with the trigger words a user would actually say. Keep it under ~1024 chars.
---
```

The **description is the single most important line** — it's how another agent (or the harness) decides to load your skill. State *what it does* and *when to use it*, in the words a user would use.

### Single-file vs. multi-file (progressive disclosure)
- **Default: a single `SKILL.md`.** Most skills here are one file. Keep the body focused and reasonably sized (aim < ~500 lines) — its content stays in context whenever the skill loads, so every line is a recurring token cost.
- **Large skills: split with progressive disclosure.** If the material is big, keep `SKILL.md` lean (method + navigation) and move depth into sub-files that load only on demand. Conventional folders:

  ```
  skills/<name>/
  ├── SKILL.md          # required — the agent entrypoint
  ├── README.md         # optional — human outline (for a big multi-file skill)
  ├── references/       # optional — on-demand deep docs (INDEX.md as the map)
  ├── checklists/       # optional — review/verification gates
  ├── examples/         # optional — worked examples
  ├── scripts/          # optional — runnable helpers
  └── assets/           # optional — templates, static files
  ```

  For a large skill, the winning pattern is **three non-duplicating entry points**: `SKILL.md` (agent instructions) → `references/INDEX.md` (on-demand "load the file for problem X" map) → `README.md` (human outline). See `skills/system-design-architecture/` for a worked example of this shape.

---

## 3. Conventions (so the repo stays navigable)

- **Naming:** skill directory and `name` are `kebab-case` and match. Sub-files are kebab-case. For ordered reference sets, prefix `NN-` (`01-…`, `02-…`) so they sort.
- **One responsibility per skill.** Don't bolt an unrelated capability onto an existing skill; make a new one. Before adding, check the manifest — if a skill already covers it, improve *nothing of theirs*; propose a complementary skill and say how it differs (see how `system-design-architecture` positions itself vs. `ui-ux-audit`).
- **Cross-reference, don't duplicate.** Point to sibling skills/files by relative link instead of copying content. Every internal link must resolve.
- **Cite your sources.** If your skill asserts external facts or links out, link the **primary source** and verify it resolves. Don't ship invented URLs or unverifiable claims.
- **No secrets, ever.** No API keys, tokens, internal hostnames, or credentials in any committed file.
- **Keep it self-contained & portable.** A skill should work when copied into any agent's skills directory.

---

## 4. Register your skill (make it discoverable)

A skill nobody can find doesn't exist. After creating it:

1. **`AGENTS.md`** — append one row to the table under the **best-matching category** (`### CATEGORY`): `| **Skill Name** | \`skills/<name>/SKILL.md\` | Use When … |`. If no category fits, add a new `### CATEGORY` heading at the end of the list.
2. **`README.md`** — append the matching row to its category table.
3. Keep the two **in sync** (same skill, same path, consistent one-liner).

> **Append — don't reorder.** Add your row at the **end** of the category's table. Don't re-sort, reformat, or rewrap other rows: that turns a clean 1-line diff into a whole-table conflict for every other agent editing the manifest right now.

---

## 5. Working alongside other agents (the important part)

Multiple agents edit this repo concurrently. Stay in your lane:

- **Own only your directory + your two new manifest rows.** Never edit, rename, move, or "clean up" another agent's skill, another agent's rows, or shared files (`LICENSE`, `.gitignore`, `rules/`, `templates/`, unrelated skills).
- **One skill per branch / per PR.** Use your own branch name; open the PR as a **draft**. Small, single-purpose PRs merge cleanly; sweeping ones collide.
- **Minimize edits to hot shared files.** `AGENTS.md` and `README.md` are edited by everyone — touch only the rows you're adding, in append position (§4). Don't reflow the file.
- **If you hit a merge conflict**, rebase onto the latest `main` and re-apply **only your additions** — never resolve a conflict by discarding another agent's row.
- **Don't merge your own PR** unless a human told you to. Leave it as a draft for review.

---

## 6. Pre-PR self-check (the gate)

Run through this before opening the PR. (The Skill Authoring skill's `scripts/validate-skill.sh` / `lint-skill.sh` automate much of it.)

- [ ] `skills/<name>/SKILL.md` exists; frontmatter has `name` (matches dir) + a strong, keyword-rich `description` under ~1024 chars.
- [ ] `SKILL.md` body is focused (< ~500 lines); heavy material moved to on-demand sub-files if large.
- [ ] **Every internal link resolves** (no dangling `references/…`, `../sibling/…`, or checklist/example links).
- [ ] Registered in **both** `AGENTS.md` and `README.md`, in the right category, appended (not reordered).
- [ ] No secrets; no stray files (`.DS_Store`, `tmp*`, `*.orig`, editor swap files); external links verified.
- [ ] The diff touches **only** your skill directory and your two new manifest rows.
- [ ] Committed with a clear message; pushed to your branch; PR opened as a **draft**.

---

## 7. Anti-patterns (don't)

- ❌ One giant `SKILL.md` that dumps everything — split it (progressive disclosure).
- ❌ Editing, renaming, or "improving" another agent's skill or rows.
- ❌ Reordering/reformatting the AGENTS.md or README tables (conflict grenade).
- ❌ Duplicating an existing skill instead of cross-referencing it.
- ❌ Broken internal links, invented source URLs, or unverifiable claims.
- ❌ Secrets in any file. Committing `node_modules/`, build output, or temp dirs.
- ❌ Merging your own PR without a human's go-ahead.

---

## 8. Authoritative references

- **[Skill Authoring skill](skills/white-paper-writing/blastum-skill-authoring/SKILL.md)** — deep methodology + `scripts/` (scaffold, lint, validate) + `docs/` (frontmatter, structure, principles, anti-patterns, validation). Use it to author.
- **[`AGENTS.md`](AGENTS.md)** — the discovery manifest (start here to see what already exists).
- **[Claude Code — Agent Skills docs](https://code.claude.com/docs/en/skills)** and the **[Agent Skills open standard](https://agentskills.io)** — the cross-tool spec `SKILL.md` follows.

*This is a living document. Improve it in its own PR when the conventions genuinely need to change — and keep it something every agent can follow without friction.*
