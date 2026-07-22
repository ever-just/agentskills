---
name: handoff
description: Compact the current conversation into a standalone handoff document so a fresh agent session can pick up the work with full context — what's done, what's outstanding, decisions made and why, and which skills the next session should invoke. Use when a session is ending, running low on context, or the user explicitly wants to continue this work in a new session (including a different machine or agent).
---

# Handoff

Write a handoff document summarizing the current conversation so a fresh agent can continue the work. Save it outside the repo — the OS temp directory, or wherever the user's workflow keeps scratch notes — never into tracked project files unless the user asks for that explicitly.

## What to include

- **State**: what's done, what's in progress, what's explicitly outstanding.
- **Decisions and why**: not just what was decided, but the reasoning and any rejected alternatives — a fresh session that only sees the "what" will re-litigate decisions that were already settled.
- **A "suggested skills" section** — name the skills the next session should invoke and why (this skill's own catalog, or the project's, if either has one).
- **References, not copies.** Do not duplicate content already captured in other artifacts (specs, plans, ADRs, issues, commits, diffs). Point at them by path, issue number, or URL instead — a handoff doc that re-explains a PR description drifts out of sync with it immediately.

## Hygiene

- **Redact sensitive information** — API keys, passwords, tokens, personally identifiable information — before writing anything to disk.
- **If the user specified what the next session will focus on**, tailor the document to that instead of a generic full recap.
- Keep it a **handoff**, not a transcript — a new session should be able to read it in under a minute and know exactly where to resume, not replay the whole conversation.

## When to reach for this unprompted

A session running long, hitting a natural stopping point mid-task, or approaching a context limit is itself a signal to consider a handoff — proactively suggest one rather than waiting to be asked, especially before context gets compacted or the session is about to end.

## Combining with other skills

- `grilling` — if a grilling session runs long, hand off with the resolved-so-far decisions listed explicitly so the next session doesn't re-ask settled questions.
- `wayfinder` — for work already tracked as a map of decision tickets, point the handoff at the map instead of restating its state; a handoff is for the untracked, in-conversation context a tracker doesn't capture.
- `unmerged-work-census` — before writing a handoff for work spanning multiple sessions/branches, a quick census avoids handing off a stale picture of what's actually landed.

## Attribution

Adapted from [mattpocock/skills](https://github.com/mattpocock/skills) (`skills/productivity/handoff`), MIT licensed, © Matt Pocock.
