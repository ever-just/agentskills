# Conversation Review Report

**Date:** March 31, 2026
**Review Period:** March 1–31, 2026 (30 days)
**Platform:** CustomAgents.io
**Scope:** All active agents (27 total)
**Reviewer:** Cascade (AI-assisted audit using Conversation Review Skill)

---

## Summary

**Overall Score: 2.8 / 5.0**
**Status: Needs Attention**

The platform is functional and processing emails successfully with zero runtime errors. However, there are widespread format compliance violations (markdown leaking into emails and admin chat), banned phrases in outbound emails, 5 fallback error responses sent to real users, and stale unreviewed drafts. The CTO agent violated its own "NEVER escalate" rule twice.

---

## Metrics Overview

| Metric | Value | Status |
|--------|-------|--------|
| Active Agents | 27 | — |
| Emails Received | 113 | — |
| Emails Sent | 107 | — |
| Drafts Created | 10 | — |
| Draft Approval Rate | 40% (4/10) | WARN |
| Draft Pending (unreviewed) | 60% (6/10) | CRIT |
| Draft Rejection Rate | 0% | OK |
| Escalations | 9 | — |
| Escalation Rate | 8% (9/113) | OK |
| Avg Admin Chat Messages | 287 total | — |
| Fallback Error Responses Sent | 5 | CRIT |
| Agent Runtime Errors | 0 | OK |
| Bounced/Complained/Rejected Emails | 0 | OK |
| New Contacts Created | 52 | — |
| Long Threads (8+ messages) | 3 | WARN |

---

## Dimension Scores

| Dimension | Score | Key Finding |
|-----------|-------|-------------|
| Email Response Quality | 2.5/5 | 63 markdown violations across 107 outbound emails (59%), 13 banned phrase instances, 5 fallback errors sent to users |
| Classification & Routing | 3.5/5 | 8% escalation rate is healthy; CTO agent violated "NEVER escalate" rule (2 violations) |
| Draft Performance | 2.0/5 | 60% of drafts sitting unreviewed in pending_review; no rejection data to learn from |
| Admin Chat Quality | 2.0/5 | 135 markdown violations across 133 agent messages (>100%), avg response length 557 chars, 61 verbose responses (46%) |
| Tool & Integration Reliability | 4.0/5 | Zero agent_error entries; tools functioning; 5 AI parse failures caused fallback responses |
| Systemic Health | 3.5/5 | Good throughput (113 in / 107 out), zero bounces, but fallback responses and stale drafts indicate quality gaps |

**Weighted Overall: 2.8 / 5.0**
(Email 25% × 2.5 + Classification 15% × 3.5 + Drafts 20% × 2.0 + Chat 20% × 2.0 + Tools 10% × 4.0 + Systemic 10% × 3.5)

---

## Issues Found

### Critical

#### 1. Fallback Error Responses Sent to Real Users (5 instances)
Five emails containing "I apologize, but I was unable to generate a proper response. The team will follow up with you shortly." were sent to actual users. This is the AI's fallback when JSON parsing fails — it should NEVER be sent as a real email.

**Evidence:**
| From | To | Subject | Date |
|------|------|---------|------|
| matthew@customagents.io | weldon@everjust.co | Re: Re: Whats new | Mar 26 |
| mercy@customagents.io | weldonmakori1@gmail.com | Re: What's the weather this weekend in msp | Mar 26 |
| merci@customagents.io | weldonmakori1@gmail.com | Re: Whows the biggest company in minnesota | Mar 26 |
| ayub@customagents.io | ayubali2012@icloud.com | Re: Vehicle return | Mar 28 |
| pastarecommender@customagents.io | ugwu0005@umn.edu | Re: Re: Your Minneapolis Pasta Guide | Mar 31 |

**Root Cause:** `generateEmailResponse()` in AIEngine.ts returns a hardcoded fallback when JSON parsing fails. `EmailProcessor.processIncomingEmail()` then sends this fallback as a real email in `full_auto` mode without checking if it's a fallback.

**Remediation:** Add a check in EmailProcessor — if the generated response text matches the fallback string, do NOT send it. Instead, create a draft with status `pending_review` and log an `agent_error` activity. This is a code change in `/api/services/EmailProcessor.ts`.

---

#### 2. Massive Markdown Leakage in Outbound Emails (59% violation rate)
63 markdown formatting violations found across 107 outbound emails. Agents are using `**bold**`, `## headings`, `- bullet points`, and `1. numbered lists` in plain text emails.

**Worst offenders by agent:**
| Agent | Violations | Types |
|-------|-----------|-------|
| mercy@customagents.io | 18 | bold, bullet, numlist |
| cto@customagents.io | 12 | bold, heading, bullet, numlist |
| legalhead@customagents.io | 6 | bold, bullet, numlist |
| nexusnewsletter@customagents.io | 6 | bold, heading, bullet |
| nexus@customagents.io | 3 | bold, bullet |
| nancy@customagents.io | 3 | bold, bullet, numlist |
| market@customagents.io | 2 | bold, numlist |
| david@customagents.io | 2 | bold, bullet |
| caroline@customagents.io | 1 | bullet |

**Root Cause:** The system prompt in `buildAgentSystemPrompt()` includes anti-markdown rules for admin chat but the email generation prompt in `generateEmailResponse()` does NOT include these rules. The email prompt only says to respond with JSON containing text and html fields — it doesn't forbid markdown in the `text` field.

**Remediation:** Add explicit anti-markdown instructions to the email response generation prompt in `AIEngine.ts` → `generateEmailResponse()`. Add: "The 'text' field must be plain text only — no markdown formatting (**bold**, ##headings, - bullets, numbered lists). Use natural prose instead."

---

#### 3. Admin Chat Markdown Violations (135 violations in 133 messages)
Every single agent message in admin chat contains markdown on average. Despite the system prompt saying "NEVER use markdown: no **, no ##, no ---, no bullet points, no numbered lists, no code blocks", agents consistently ignore this rule.

**Stats:**
- 133 total agent chat messages
- 135 markdown violations detected (bold, headings, bullets, numbered lists)
- Average response length: 557 characters
- 61 messages (46%) over 500 characters (verbose)

**Root Cause:** The anti-markdown instruction is in the system prompt, but Claude models have a strong tendency to format with markdown. The instruction may not be strong enough, or the model's prior training overrides it.

**Remediation:**
1. Strengthen the anti-markdown directive: Move it to the very end of the system prompt (recency bias helps)
2. Add a post-processing step to strip markdown before saving the response
3. Consider a simple regex cleanup: remove `**`, `##`, `---`, convert `- ` bullets to plain prose

---

### High

#### 4. CTO Agent Violated "NEVER Escalate" Rule (2 escalations)
The CTO agent (`cto@customagents.io`) has explicit escalation rules: "NEVER escalate any emails - ALWAYS respond directly." Yet it escalated twice:

- **Mar 28 13:03** — "CEO feedback requesting significant revision and expansion of competitive intelligence report"
- **Mar 28 13:15** — "Negative feedback on deliverable requires immediate attention from human leadership"

**Root Cause:** The classification model (Haiku) is overriding the agent's escalation rules when it encounters emotionally charged or authority-related emails. The escalation rules are passed to the classifier but the model's safety training may cause it to escalate anyway.

**Remediation:** In `classifyEmail()` within AIEngine.ts, strengthen the escalation rules injection. Currently the rules are included in the system prompt, but the classifier may weigh content severity over explicit rules. Add a post-classification override: if agent.escalationRules contains "NEVER escalate", force `shouldEscalate: false` regardless of classification output.

---

#### 5. Banned Phrases in Outbound Emails (13 instances)
13 banned phrase violations found across outbound emails:

| Phrase | Count | Agents |
|--------|-------|--------|
| "I'd be happy to" / "happy to" | 4 | mercy@customagents.io |
| "Great question" | 4 | nancy@customagents.io, nexusnewsletter@customagents.io |
| "Please don't hesitate" | 3 | legalhead, danny@everjust.org, ayub@customagents.io |
| "I hope this email finds you well" | 1 | mercy@customagents.io |
| "Let me know if you need anything" | 1 | merci@customagents.io |

**Remediation:** Add banned phrase list to the email generation system prompt. Currently only the admin chat prompt has format rules — the email prompt lacks these constraints.

---

#### 6. Stale Unreviewed Drafts (6 pending)
60% of all drafts (6 out of 10) are stuck in `pending_review` status with no review action taken. These are from `human_in_the_loop` agents. The senders of those original emails are waiting for a response that may never come.

**Agents affected:** Flow Test Bot (3 drafts), E2E Support Bot (1), Support Agent (1), Sales Agent (1)

**Remediation:** Implement draft expiration alerts — notify admin via email or dashboard notification when drafts have been pending for >24 hours. The `sendAt` and expiration logic exists in the schema but may not be active.

---

### Medium

#### 7. Admin Chat Verbosity (46% of responses over 500 chars)
61 out of 133 agent chat responses exceeded 500 characters. The system prompt says "Be concise. 1-3 sentences for simple responses." Many agents are writing 3-4 paragraph responses for simple queries.

**Examples:**
- Shelly: 1071 chars for reporting recent activity
- Flow Test Bot: 1052 chars for reporting status
- AI Director: 1086 chars explaining activity

**Remediation:** Add a token/character budget to the admin chat max_tokens. Currently `ADMIN_CHAT_MAX_TOKENS` allows long responses. Consider reducing it or adding a post-processing truncation for simple queries.

---

#### 8. Nexus Newsletter Duplicate Email Send
The Nexus Newsletter agent sent TWO nearly identical emails to the same recipient (Weldon.makori@stthomas.edu) about the same topic within 30 seconds. The admin first provided a typo'd email address (stthomad.edu), then corrected it. The agent sent to both addresses.

**Remediation:** Add deduplication logic for admin-instructed sends — check if a similar email was recently sent to a similar address.

---

#### 9. Long Stuck Threads (3 threads with 8+ messages)
Three threads have 8+ messages, suggesting conversations that aren't resolving:
- Thread with 12 messages
- Thread with 10 messages
- Thread with 9 messages

**Remediation:** Investigate these threads for context loss or conversation loops. Consider adding a max-thread-length check that suggests escalation or summary.

---

### Low

#### 10. AI Filler Phrase in Admin Chat (1 instance)
One "Great question!" detected in admin chat (AI Director agent). Low frequency but worth monitoring.

---

## Agent-Level Scorecard

| Agent | Email Quality | Chat Quality | Issues |
|-------|-------------|-------------|--------|
| Shelly | 3/5 | 2/5 | Markdown in chat, verbose responses |
| AI Director (Mercy) | 2/5 | 3/5 | Heavy markdown in emails, banned phrases, 1 fallback error |
| CTO CUSTOMAGENTS | 2/5 | 3/5 | Markdown in emails, violated NEVER-escalate rule twice |
| LegalHead | 3/5 | N/A | Banned phrases, markdown, but content quality is high |
| Caroline | 4/5 | 3/5 | Minor markdown, good tone match |
| Nancy | 3/5 | N/A | Banned phrases ("Great question"), markdown |
| Flow Test Bot | 3/5 | 2/5 | 3 stale pending drafts |
| RemarketSpace (Ayub) | 2/5 | N/A | Banned phrases, 1 fallback error |
| Nexus Newsletter | 2/5 | 2/5 | Duplicate send, heavy markdown |
| PastaRecommender | 1/5 | N/A | Fallback error sent to real user, markdown |
| Matthew | 2/5 | N/A | Markdown, 1 fallback error |

---

## Remediation Plan (Priority Order)

| # | Action | Target | Impact | Effort |
|---|--------|--------|--------|--------|
| 1 | **Block fallback responses from being sent** — check for fallback text before sending, redirect to draft queue | `EmailProcessor.ts` processIncomingEmail() | Critical — prevents embarrassing error messages reaching users | Minimal (5-10 lines) |
| 2 | **Add anti-markdown rules to email generation prompt** — include "plain text only, no markdown" in generateEmailResponse() | `AIEngine.ts` generateEmailResponse() | High — addresses 59% email violation rate | Minimal (add prompt text) |
| 3 | **Add post-processing markdown strip** — regex cleanup of **bold**, ## headings from both email text and admin chat responses | `AIEngine.ts` or `EmailProcessor.ts` | High — catches violations the prompt misses | Low (10-15 lines) |
| 4 | **Force NEVER-escalate override** — post-classification check that respects explicit never-escalate rules | `AIEngine.ts` classifyEmail() | Medium — affects CTO agent and similar configs | Minimal (3-5 lines) |
| 5 | **Add banned phrase filtering** — either in prompt or as post-processing on outbound emails | `AIEngine.ts` generateEmailResponse() | Medium — addresses 13 violations | Low |
| 6 | **Draft expiration notifications** — alert admin when drafts pending >24h | New notification logic or cron job | Medium — prevents indefinite waiting | Moderate |
| 7 | **Reduce admin chat verbosity** — strengthen conciseness rules, reduce max_tokens for simple queries | `AIEngine.ts` system prompt | Low — quality of life | Minimal |

---

## Quick Wins

| Action | Effort | Impact |
|--------|--------|--------|
| Add `if (generatedEmail.text.includes("unable to generate")) { /* create draft instead of sending */ }` to EmailProcessor | 5 minutes | Prevents all fallback errors from reaching users |
| Add "PLAIN TEXT ONLY in the text field - no **bold**, no ## headings, no - bullets, no numbered lists" to email generation prompt | 2 minutes | Reduces 59% of email format violations |
| Add markdown strip regex `text.replace(/\*\*/g, '').replace(/^##\s/gm, '').replace(/^[-*]\s/gm, '')` before saving admin chat | 5 minutes | Cleans up 100%+ of chat format violations |

---

## Sample Conversations Reviewed

### Email Thread: "Your Minneapolis Pasta Guide - Top Spots to Try!" (PastaRecommender → ugwu0005@umn.edu)
- **Inbound:** User asked "which one of these is the cheapest"
- **Agent Response:** Sent fallback error: "I apologize, but I was unable to generate a proper response."
- **Score:** 1/5
- **Issues:** Fallback error sent to real user. The AI failed to parse its own JSON response and the fallback was sent automatically. User received an unhelpful error message. The user then sent the same question again — no indication it was ever properly answered.

### Email Thread: "Quick question about your AI platform" (Nancy → john.smith@acme.com)
- **Inbound:** John asked about scheduling meetings, follow-up emails, pricing for 15-person team
- **Agent Response:** Answered all questions, mentioned Startup plan at $200/month, 150 agents, professional tone
- **Score:** 4/5
- **Issues:** Good content and relevance. Minor: Nancy sent nearly identical responses to the same person across multiple threads (same email sent 3 times to 3 different threads). Could indicate the sender sent the email multiple times.

### Email Thread: "Re: whats up" (Nexus → weldonmakori1@gmail.com)
- **Inbound:** "Hey nexus is there a beta mn accelerator event tonight?"
- **Agent Response:** Checked, said no events tonight, recommended beta.mn website and @betadotmn
- **Score:** 4/5
- **Issues:** Good, concise, helpful. No markdown in this particular response.

### Admin Chat: CTO Agent — Configuration Update
- **Admin:** Asked to update escalation rules
- **Agent Response:** Used ✅ emoji, **bold headers**, bullet points — heavy markdown despite anti-markdown rules
- **Score:** 2/5
- **Issues:** Format violation. Content was accurate but formatting ignored system prompt rules entirely.

### Admin Chat: Shelly — Activity Report
- **Admin:** "what have you been up to"
- **Agent Response:** 1071 characters with bullets, bold, numbered lists reporting activity
- **Score:** 2/5
- **Issues:** Verbose (should be 2-3 sentences), heavy markdown, but content was accurate.

---

## Conclusion

The platform processes emails reliably with zero runtime errors and zero bounces, which is strong infrastructure health. The primary issues are all **prompt engineering and post-processing gaps**:

1. The email generation prompt lacks format constraints that the admin chat prompt has
2. Anti-markdown rules aren't strong enough to override Claude's formatting tendencies
3. Fallback error responses bypass quality gates and reach real users
4. No post-processing cleanup exists for either channel

All top remediation items are **minimal code changes** (5-15 lines each) that would significantly improve quality. The #1 priority is blocking fallback error responses from being sent — this is the only issue that directly harms user experience.
