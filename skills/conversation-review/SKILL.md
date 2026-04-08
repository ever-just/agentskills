# Conversation Review Skill for CustomAgents.io

## Purpose
This skill enables systematic auditing of AI agent conversations — both **external** (email in/out with contacts) and **internal** (admin chat via dashboard). It detects quality issues, compliance violations, systemic patterns, and provides actionable remediation steps.

---

## Scope

### External (Email Pipeline)
- Inbound email classification accuracy
- Outbound response quality, tone, and instruction compliance
- Escalation decision correctness
- Draft approval/rejection patterns
- Thread coherence across multi-message conversations
- Response timing and throughput

### Internal (Admin Chat)
- Agent response quality and conciseness
- Tool execution accuracy and reporting
- Hallucinated activity or capabilities
- Markdown/format rule compliance
- Knowledge base utilization
- Instruction drift over time

---

## Data Model Reference

| Collection | Key Fields | Purpose |
|------------|-----------|---------|
| `messages` | from, to, cc, subject, text, html, status, threadId, inboxId, timestamps | Email messages (inbound + outbound) |
| `adminmessages` | agentId, role (admin/agent), content, metadata, timestamps | Dashboard chat messages |
| `threads` | inboxId, messages[] (ObjectId refs), timestamps | Email thread groupings |
| `agentconversations` | agentId, contactId, threadId, summary, context, messageCount | Conversation state per contact |
| `emaildrafts` | agentId, to, subject, text, html, status, aiReasoning, editedText, reviewedAt | AI-generated draft responses |
| `agentactivities` | agentId, type (enum), summary, details, messageId, contactId, threadId | Activity log entries |
| `agents` | name, email, role, instructions, tone, autonomyMode, escalationRules, writingSamples, enabledTools | Agent configuration |
| `contacts` | name, email, company, notes, agentNotes, tags, relationship | Contact records |

### Activity Types (from AgentActivity schema)
```
email_received, email_classified, email_drafted, email_sent, email_escalated,
contact_created, contact_updated, follow_up_scheduled, follow_up_sent,
agent_paused, agent_resumed, agent_error, draft_approved, draft_rejected,
draft_edited, admin_chat, integration_connected, integration_disconnected
```

### Draft Statuses
```
pending_review, approved, rejected, sent, expired
```

### Message Statuses
```
sent, received, delivered, bounced, complained, rejected
```

---

## Review Dimensions

### Dimension 1: Email Response Quality (External)

**What to check:**
- Does the agent's reply actually answer the sender's question?
- Is the response on-topic and relevant to the email content?
- Does it follow the configured tone (professional, friendly, casual, formal, empathetic)?
- Does it respect length guidelines (2-5 sentences for most replies)?
- Is the sign-off correct (agent name)?
- Is the subject line specific (4-7 words, not vague)?

**Banned phrases to detect:**
```
"I hope this email finds you well"
"Just reaching out"
"I'd love to"
"Wondering if"
"Please don't hesitate to"
"As per my last email"
"Let me know if you need anything else"
"I hope this helps"
"Great question!"
```

**Markdown leakage patterns:**
```
**bold text**
## headings
--- dividers
- bullet points (at line start)
```markdown code blocks
1. numbered lists (at line start with period)
```

**Automated checks:**
1. Scan outbound message `text` for banned phrases (case-insensitive)
2. Scan outbound message `text` and `html` for markdown patterns
3. Check subject lines for vague words: "Update", "Question", "FYI", "Info", "Hello"
4. Check sign-off: last line should contain agent name
5. Compare response length to inbound length (flag if >3x longer or <0.1x)
6. Detect fallback responses: "unable to generate a proper response"

**AI evaluation prompt:** See `prompts.md` → Prompt 1

**Scoring:**
- 5 = Perfect: on-topic, correct tone, concise, no violations
- 4 = Good: minor tone drift or slightly verbose
- 3 = Acceptable: answers the question but with format/tone issues
- 2 = Poor: off-topic, wrong tone, or contains banned phrases/markdown
- 1 = Failed: fallback response, completely wrong, or harmful

---

### Dimension 2: Email Classification & Routing (External)

**What to check:**
- Was the email classified into the correct category?
- Was the priority level appropriate?
- Was the `requiresResponse` decision correct?
- Was the `shouldEscalate` decision correct per the agent's escalation rules?
- Are there false negatives (should have escalated but didn't)?
- Are there false positives (escalated unnecessarily)?

**Data sources:**
- `agentactivities` where type = `email_classified` → details contains full classification
- `agentactivities` where type = `email_escalated` → escalation decisions
- `messages` where status = `received` → the original emails
- `agents.escalationRules` → what the rules say

**Automated checks:**
1. Count escalation rate per agent (escalated / total received)
2. Flag agents with >50% escalation rate (likely over-escalating)
3. Flag agents with 0% escalation rate over 20+ emails (likely under-escalating)
4. Check for `email_classified` activities where category = "unclassified" (AI parse failures)
5. Check for `agent_error` activities (classification crashes)

**AI evaluation prompt:** See `prompts.md` → Prompt 2

**Scoring:**
- 5 = All classifications correct, appropriate escalations
- 4 = 1-2 minor misclassifications (e.g., "inquiry" vs "support"), no routing errors
- 3 = Some priority misjudgments but correct routing
- 2 = Missed escalation or unnecessary escalation
- 1 = Systematic misclassification or routing failures

---

### Dimension 3: Draft Performance (External)

**What to check:**
- What percentage of drafts are approved vs rejected vs edited?
- What are common reasons for rejection (infer from patterns)?
- How often are drafts edited before sending (indicates quality gap)?
- Average time from draft creation to review
- Are expired drafts accumulating (admin not reviewing)?

**Key metrics:**
```
Approval Rate    = approved / (approved + rejected + edited)
Rejection Rate   = rejected / (approved + rejected + edited)
Edit Rate        = edited / (approved + rejected + edited)
Expiration Rate  = expired / total drafts
Review Latency   = avg(reviewedAt - createdAt)
```

**Automated checks:**
1. Calculate approval/rejection/edit rates per agent
2. Flag agents with rejection rate > 30%
3. Flag agents with edit rate > 50% (drafts need too much tweaking)
4. Check for expired drafts (admin not engaging)
5. Compare `editedText` to original `text` — high diff = low quality
6. Check `aiReasoning` field — is the agent's reasoning coherent?

**Scoring:**
- 5 = >90% approval rate, <5% edit rate
- 4 = 75-90% approval, <15% edit rate
- 3 = 60-75% approval, moderate edits
- 2 = <60% approval or >40% edit rate
- 1 = <40% approval or majority rejected

---

### Dimension 4: Admin Chat Quality (Internal)

**What to check:**
- Does the agent respond concisely (1-3 sentences for simple queries)?
- Does the agent use markdown in chat (violation)?
- Does the agent hallucinate activity or capabilities?
- Does the agent handle trivial messages ("ok", "thanks") appropriately?
- Does the agent correctly report tool execution results?
- Does the agent answer from knowledge base before web search?

**Automated checks:**
1. Scan agent messages for markdown patterns: `**`, `##`, `---`, `- ` (bullet), ``` code blocks
2. Measure average agent response length in characters
3. Flag responses > 500 characters for simple queries
4. Check for "I don't have access to" or "I can't" when the tool IS available
5. Check for poison phrases (integration not connected, permission denied, etc.)
6. Scan for AI filler: "Certainly!", "Of course!", "Absolutely!", "I'd be happy to"

**AI filler phrases to detect:**
```
"Certainly"
"Of course"
"Absolutely"
"I'd be happy to"
"Sure thing"
"Great question"
"That's a great"
"Let me help you with that"
"I understand"
"No problem at all"
```

**AI evaluation prompt:** See `prompts.md` → Prompt 3

**Scoring:**
- 5 = Concise, accurate, no format violations, good tool usage
- 4 = Mostly good, occasional verbosity
- 3 = Some markdown leakage or filler, but functionally correct
- 2 = Hallucinated capabilities, wrong tool results, or excessive verbosity
- 1 = Systematically wrong, unusable, or harmful responses

---

### Dimension 5: Tool & Integration Reliability (Both)

**What to check:**
- Tool execution success rate
- Integration connection health
- Failed tool calls and their error messages
- Tools called but never available (misconfigured)
- Web search usage patterns (over-relying on search vs KB)

**Data sources:**
- `adminmessages` with metadata containing tool actions
- `agentactivities` with type containing "integration_"
- `agentactivities` with type = "agent_error"
- Admin chat messages where agent mentions tool failures

**Automated checks:**
1. Count tool call frequency per tool name from activity logs
2. Count `agent_error` activities per agent
3. Grep admin chat for "tool failed", "execution failed", "connection may need"
4. Check for integration_disconnected without subsequent integration_connected
5. Count web_search usage vs knowledge base hits

**Scoring:**
- 5 = All tools working, integrations stable, appropriate tool selection
- 4 = Rare tool failures, quick recovery
- 3 = Occasional failures, some misconfigured tools
- 2 = Frequent tool failures affecting user experience
- 1 = Critical tools broken, integrations down

---

### Dimension 6: Systemic Health Metrics (Both)

**What to check:**
- Overall message volume trends (growing, stable, declining)
- Response time distribution (p50, p90, p99)
- Error rate trends
- Contact satisfaction signals (do contacts reply? do threads resolve?)
- Agent utilization (active vs paused time)
- Token usage trends

**Key metrics to calculate:**
```
Messages/Day         = count messages grouped by date
Avg Response Time    = avg(outbound.createdAt - inbound.createdAt) per thread
Error Rate           = agent_error activities / total activities
Thread Resolution    = threads with no new inbound in 48h / total threads
Escalation Trend     = escalation rate per week (increasing = problem)
Draft Turnaround     = avg(draft review time)
```

**Automated checks:**
1. Calculate daily message volume for last 30 days
2. Calculate response time per thread (time between last inbound and next outbound)
3. Trend analysis: is error rate increasing week-over-week?
4. Flag threads with >10 messages (potentially stuck in loop)
5. Flag contacts who stopped replying after agent response (possible bad experience)

**Scoring:**
- 5 = Healthy metrics, improving trends, good throughput
- 4 = Stable metrics, no concerning trends
- 3 = Some concerning trends (rising errors, slow response times)
- 2 = Declining health, rising error rates, stale drafts
- 1 = Critical: high error rates, long response times, contact drop-off

---

## Step-by-Step Audit Process

### Phase 1: Data Collection (5 min)
1. Pick the target agent (or audit all agents)
2. Choose time window (last 7 days, 30 days, or custom)
3. Run the data extraction queries from `queries.md`
4. Export results for analysis

### Phase 2: Automated Pattern Checks (10 min)
1. Run banned phrase detection on all outbound emails
2. Run markdown leakage detection on emails + admin chat
3. Run AI filler phrase detection on admin chat
4. Calculate draft approval/rejection/edit rates
5. Calculate escalation rates
6. Calculate response time metrics
7. Flag any anomalies (rates outside normal bounds)

### Phase 3: AI-Assisted Quality Evaluation (15 min)
1. Sample 5-10 email threads (random + any flagged in Phase 2)
2. Sample 10-20 admin chat exchanges (random + any flagged)
3. Run the evaluation prompts from `prompts.md` against each sample
4. Record scores per dimension

### Phase 4: Scoring & Report (10 min)
1. Average scores per dimension
2. Calculate overall agent health score (weighted average)
3. Identify top 3 issues by severity
4. Write remediation recommendations
5. Output in the report template (below)

---

## Report Template

```
# Conversation Review Report
Date: [DATE]
Agent: [AGENT_NAME] ([AGENT_EMAIL])
Period: [START] to [END]
Reviewer: Cascade

## Summary
Overall Score: [X.X / 5.0]
Status: [Healthy / Needs Attention / Critical]

## Metrics Overview
| Metric | Value | Status |
|--------|-------|--------|
| Emails Received | [N] | — |
| Emails Sent | [N] | — |
| Drafts Created | [N] | — |
| Draft Approval Rate | [N%] | [OK/WARN/CRIT] |
| Draft Rejection Rate | [N%] | [OK/WARN/CRIT] |
| Escalation Rate | [N%] | [OK/WARN/CRIT] |
| Avg Response Time | [Xm] | [OK/WARN/CRIT] |
| Admin Chat Messages | [N] | — |
| Tool Failures | [N] | [OK/WARN/CRIT] |
| Agent Errors | [N] | [OK/WARN/CRIT] |

## Dimension Scores
| Dimension | Score | Key Finding |
|-----------|-------|-------------|
| Email Response Quality | [X/5] | [one-liner] |
| Classification & Routing | [X/5] | [one-liner] |
| Draft Performance | [X/5] | [one-liner] |
| Admin Chat Quality | [X/5] | [one-liner] |
| Tool & Integration Reliability | [X/5] | [one-liner] |
| Systemic Health | [X/5] | [one-liner] |

## Issues Found
### Critical
- [issue description + evidence + remediation]

### High
- [issue description + evidence + remediation]

### Medium
- [issue description + evidence + remediation]

### Low
- [issue description + evidence + remediation]

## Remediation Plan
1. [action item with specific file/config change needed]
2. [action item]
3. [action item]

## Sample Conversations Reviewed
### Email Thread: [subject]
- Inbound: [summary]
- Agent Response: [summary]
- Score: [X/5]
- Issues: [list]

### Admin Chat Exchange
- Admin: [summary of request]
- Agent: [summary of response]
- Score: [X/5]
- Issues: [list]
```

---

## Common Issues & Remediation

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| Markdown in emails | System prompt not enforced | Check `buildAgentSystemPrompt()` in AIEngine.ts — ensure anti-markdown rules are present |
| Banned phrases appearing | Writing samples override tone rules | Update writingSamples or add explicit negative examples |
| Over-escalation | Escalation rules too broad | Narrow escalationRules in agent config, add negative examples |
| Under-escalation | Escalation rules missing edge cases | Add specific escalation triggers to agent config |
| High draft rejection rate | Agent instructions misaligned with admin expectations | Review and update agent instructions, add more writingSamples |
| Slow response times | AI model overloaded (529 errors) | Check API logs for fallback triggers, consider token budget |
| Tool failures in chat | Integration disconnected or expired | Reconnect via Integrations tab, check NangoConnection collection |
| Hallucinated activity | Agent not using get_recent_activity tool | Verify tool is in enabledTools array, check admin chat system prompt |
| Context loss in threads | Thread history truncated or unpopulated | Check getThreadById population, verify threadHistory construction in EmailProcessor |
| AI filler phrases | Model tendency | Add explicit anti-filler rules to system prompt or post-process |
| Agent not using KB | Low keyword match scores | Improve KB content, add more chunks, check getKnowledgeContext logic |
| Duplicate emails sent | Redis duplicate check failing | Verify redis connectivity, check duplicateKey TTL (300s) |

---

## Weight Configuration for Overall Score

Default weights (can be adjusted per use case):

```
Email Response Quality:        25%
Classification & Routing:      15%
Draft Performance:             20%
Admin Chat Quality:            20%
Tool & Integration Reliability: 10%
Systemic Health:               10%
```

Overall Score = sum(dimension_score * weight)

---

## Related Files
- `queries.md` — MongoDB queries for data extraction
- `prompts.md` — AI evaluation prompts for quality assessment
- `/api/services/AIEngine.ts` — AI engine with prompts and tool handling
- `/api/services/EmailProcessor.ts` — Email processing pipeline
- `/api/services/Orchestrator.ts` — Intent classification for admin chat
- `/api/db/mongo/schemas/` — All Mongoose schemas
