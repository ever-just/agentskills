---
name: agent-quality-grading
description: Grade AI-agent performance qualitatively — every user↔agent conversation on four axes (did it do the task / respond fast / use the right tools / message quality), plus the generated assets (PDFs, images, videos) and the prompts/configs — using writing-quality skills as the message-quality rubric. Produces per-channel grades, per-agent report cards, asset grades, and prompt grades, each with verbatim evidence.
---

# Agent Conversation & Asset Quality Grading

## Overview
The reliability audit tells you what's *broken*; this tells you how *well* the agents actually perform. You reconstruct each real conversation and grade the agent's turns, then grade what it produced (documents/images) and the prompts/configs it ran on. The recurring insight this surfaces: **an agent can write A-grade prose and act D-grade** — quality and reliability are different axes.

## When to use
- "Review the chats between user and agent — did it do what was asked, how well, did it respond right away, did it use the tools correctly, was the message high quality?"
- "Grade the generated assets (images/PDFs/videos)."
- "Grade the agent system prompt and the per-agent instructions/configs."

## The four axes (grade each A–F, with a verbatim quote)
1. **TASK** — did it actually do what was asked? fully / partially / no / **fabricated** (claimed done with no matching tool call — an automatic F; verify by checking the tool-call log for that turn).
2. **SPEED** — reply latency = `reply.ts − prior_inbound.ts`. Thresholds (tune per product): SMS "right away" ≲15s, chat ≲20s, email ≲a few min; flag the long tail (>60s) and any multi-minute hangs.
3. **TOOLS** — right tool, correct args, right moment? (right / wrong-tool / missing-tool / unnecessary / malformed-args).
4. **MESSAGE QUALITY** — clear, channel-appropriate length/format, accurate, human, no AI-clichés/fluff, **no markdown leaking into plain-text channels** (SMS/voice/plain email).

## Build the message-quality rubric from writing skills
Load and apply these repo skills' criteria so "quality" is concrete, not vibes:
- `clear-writing-and-formatting` — active voice, banned phrases, structure.
- `white-paper-writing/humanizer` and `.../ai-marketing-skills/de-ai-ify` — the AI-tell list (boldface abuse, "I hope this finds you well", "I wanted to reach out", inline-header lists, emoji spray).
- `white-paper-writing/marketing-copy-editing` — subject lines, single CTA, openers, sign-offs.
Deduct for each tell; reward warm, tailored, concise, plain-text replies.

## Reconstruct conversations
Group the activity log by contact/thread, order by `createdAt`. Content lives in `details` (SMS `details.content`, voice `details.transcript`/`.response`). Cross-reference the tool-call log to verify TASK claims ("Sent!" must have a matching successful send in the same turn). Grade **every** thread — these datasets are small.

## Grade the generated assets
1. From the tool-call results + a KB/asset collection, extract each asset URL and the **request that produced it** (so you can grade content-match).
2. Fetch them — **follow redirects** (`curl -sL`); media proxies 302 to presigned S3. A tiny identical-size "file" is the redirect body (missing `-L`).
3. **Open and inspect**: render images, read PDFs page-by-page. Grade content-match to the request, correctness (invoice math, table integrity), and production quality (layout/typography/pagination).
4. Compute the **generation success rate** — a missing asset is often a generation *failure*, not a persistence bug (check the tool result: a sub-second "Failed to generate" = API moderation/rejection, and a blind-retry loop is its own finding).

## Grade prompts & configs
- **Per-agent configs**: instructions/role/tone/writing-samples. Flag unfilled wizard placeholders shipped live (`[your company]`/`[your brand]`), vague/empty instructions, missing writing-samples, ungoverned length, and "dead" personalization fields (declared HIGHEST-PRIORITY in the prompt but populated 0/N in production).
- **Platform prompt**: read the prompt-assembly code; grade clarity, ordering, conflicting rules, and whether its best rules (e.g. no-false-confirmation, no-markdown) are enforced at **generation time** or only post-hoc (post-hoc rewrites are a net, not a fix).

## Output
- **Channel grade table** (SMS / Admin-chat / Email / Voice), each A–F + one-line verdict.
- **Per-agent report cards** for active agents: an A–F response-quality grade + a **best and a worst verbatim quote** (with UTC ts).
- **Asset grades**: per-asset table (asset · request · grade · issue) + overall generation grade + the success-rate and layout-bug findings.
- **Prompt/config grades**: per-agent distribution + platform-prompt grade + skill-cited improvements.
- A **best/worst moments** highlight reel and a prioritized quality-improvement list (distinct from the reliability backlog).

## Pitfalls
- **Vibes without evidence** — every grade carries a verbatim quote + ts + agent name.
- **Conflating prose with reliability** — score them separately; say so when they diverge.
- **Mis-weighting dogfood** — internal-test traffic shouldn't drag a customer-facing grade, but defects that *reached real recipients* still count.
- **Assuming "missing asset = lost"** — confirm whether it failed to generate vs failed to persist; they have different fixes.

## Combining with other skills
- `production-agent-audit` — the reliability counterpart; run both for a full picture.
- `clear-writing-and-formatting`, `white-paper-writing/humanizer`, `.../de-ai-ify`, `.../marketing-copy-editing` — the rubric sources.
- `ui-ux-audit` — adjacent quality-grading skill for UI surfaces.
