---
name: session-status
description: Keep the owner able to read a session's state at a glance, using a granular task list, a plain English "What happened" summary at the end of every working turn, and a live status dashboard Artifact for long or cloud work. Use whenever the work involves "status", "dashboard", "what happened", "progress update", a status report, or a long multi-step or cloud session where the owner cannot follow a long transcript.
---

# Session status

The owner cannot follow long transcripts. Every session must make its state readable at a glance without scrolling. These rules apply to local, cloud and subagent-led sessions, in addition to all other rules.

## 1. Keep the task list granular and current

- Use the app's task list (`update_plan` in the desktop app; `TodoWrite` or the Task tools elsewhere) for every request that does more than answer one question.
- Break work into small, concrete steps (5 to 12 typical), written in words a non-engineer understands. "Fix the signup button", not "Patch onSubmit handler".
- Update it the moment a step starts or finishes. Add steps as you discover work. Never leave it stale.

## 2. End every working turn with "What happened"

When a turn ends after doing any work (not a one-line answer), the last thing in the reply is a short section titled **What happened**, written for a non-technical reader:

- 3 to 6 plain bullets, or a small table with columns `Item | Status | What it means`.
- Say what changed, what is done, what is not done, and what (if anything) the owner must do.
- No code, no file paths unless essential, no jargon, no dashes.

Example:

```
**What happened**
- The signup button now works on phones. It was hidden behind the footer.
- I checked it on a small screen and a large one. Both look right.
- The change is merged and live.
- Not done: the password reset page has the same problem. I did not touch it.
- Nothing needed from you.
```

## 3. Long or cloud work: publish a status dashboard Artifact

Every cloud session, and any local session doing multi-step work longer than a few minutes, keeps a status dashboard Artifact.

1. Copy the template `.claude/templates/session-dashboard.html` from the repo (fallback: `~/.claude/templates/session-dashboard.html`) into your scratchpad.
2. Edit only its JSON block (`<script type="application/json" id="data">`). Leave the HTML, CSS and rendering script alone. Fields: `title`, `goal`, `status`, `now`, `steps`, `timeline`, `needs_you`, `results` (plus `updated`, a timestamp the template shows).
3. Publish it with the Artifact tool on the first turn.
4. Republish with the same file path (same URL) every time a step changes, and at the end of every turn.
5. Put the dashboard link in the **What happened** section.

If the Artifact tool is not available, put the same content as a markdown table at the top of each end of turn summary instead.

Field rules:

- `status` and each step `status` are one of `todo | doing | done | blocked | failed`.
- `now` is one sentence about what is happening at this moment.
- `needs_you` is a list of questions or approvals for the owner. Empty list when nothing is needed.
- `results` holds links (pull request, live page, report) with a `url`.
- All text is plain English, no jargon, no dashes.

Worked example of the JSON block:

```json
{
  "title": "Fix the signup button on phones",
  "goal": "Make the signup button visible and tappable on small screens so new customers can join.",
  "status": "doing",
  "updated": "2026-11-16 14:20",
  "now": "Checking the fix on a small phone screen before merging.",
  "steps": [
    {"text": "Find why the button is hidden", "status": "done", "note": "It sat behind the footer"},
    {"text": "Change the layout", "status": "done", "note": ""},
    {"text": "Check on small and large screens", "status": "doing", "note": ""},
    {"text": "Merge the change", "status": "todo", "note": ""}
  ],
  "timeline": [
    {"time": "14:02", "text": "Started. Read the request and found the signup page."},
    {"time": "14:15", "text": "Found the cause and changed the layout."}
  ],
  "needs_you": [],
  "results": [
    {"text": "Pull request with the fix", "url": "https://example.com/pull/1"}
  ]
}
```

## 4. Writing rules

- Never use em dashes or en dashes in any writing (chat, docs, dashboards, commit messages). Use a period, comma, colon, semicolon or parentheses. Write ranges as "7 to 15". Keep a plain hyphen only inside real compound words.
- Before delivering, scan the text for dash characters and rewrite them out.
- Plain words over jargon. If a non-engineer would stumble on a term, explain it or drop it.

## Checklist before ending a turn

- Task list matches reality (nothing stale, finished steps marked done).
- Dashboard republished if one exists, link included.
- **What happened** section is last, 3 to 6 plain bullets, says what the owner must do.
- No dash characters in the text.
