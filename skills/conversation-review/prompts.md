# Conversation Review — AI Evaluation Prompts

These prompts are designed to be fed to Claude (or any LLM) along with conversation data to get structured quality assessments. Each prompt targets a specific review dimension from SKILL.md.

---

## Prompt 1: Email Response Quality

Use this to evaluate individual email exchanges (inbound → outbound pairs).

```
You are a conversation quality reviewer for an AI email agent platform. Evaluate the following email exchange.

## Agent Configuration
- Name: {AGENT_NAME}
- Role: {AGENT_ROLE}
- Tone: {AGENT_TONE}
- Instructions: {AGENT_INSTRUCTIONS}
- Escalation Rules: {AGENT_ESCALATION_RULES}

## Inbound Email
From: {SENDER_EMAIL}
Subject: {INBOUND_SUBJECT}
Body:
{INBOUND_TEXT}

## Agent's Response
Subject: {OUTBOUND_SUBJECT}
Body:
{OUTBOUND_TEXT}

## Thread Context (if multi-message)
{THREAD_HISTORY}

## Evaluate on these criteria (score each 1-5):

1. **Relevance**: Does the response directly address the sender's question/request?
2. **Tone Compliance**: Does it match the configured tone ({AGENT_TONE})?
3. **Instruction Compliance**: Does it follow the agent's instructions?
4. **Conciseness**: Is the length appropriate (2-5 sentences for simple replies)?
5. **Format Compliance**: No markdown (**, ##, ---, bullets), no banned phrases?
6. **Sign-off**: Correct sign-off using agent name "{AGENT_NAME}"?
7. **Subject Line**: Specific, 4-7 words, not vague?
8. **Thread Coherence**: If multi-message, does it avoid repetition and build on prior context?
9. **Professionalism**: No hallucinated info, no inappropriate content, no promises the agent can't keep?
10. **Audience Adaptation**: Does it match the formality level of the sender?

## Banned Phrases (flag if present):
"I hope this email finds you well", "Just reaching out", "I'd love to", "Wondering if",
"Please don't hesitate to", "As per my last email", "Let me know if you need anything else",
"I hope this helps", "Great question!"

## Respond with JSON:
{
  "overallScore": 1-5,
  "relevance": { "score": 1-5, "note": "..." },
  "toneCompliance": { "score": 1-5, "note": "..." },
  "instructionCompliance": { "score": 1-5, "note": "..." },
  "conciseness": { "score": 1-5, "note": "..." },
  "formatCompliance": { "score": 1-5, "note": "..." },
  "signOff": { "score": 1-5, "note": "..." },
  "subjectLine": { "score": 1-5, "note": "..." },
  "threadCoherence": { "score": 1-5, "note": "..." },
  "professionalism": { "score": 1-5, "note": "..." },
  "audienceAdaptation": { "score": 1-5, "note": "..." },
  "bannedPhrasesFound": ["phrase1", "phrase2"],
  "markdownFound": ["pattern1"],
  "issues": ["issue description 1", "issue description 2"],
  "strengths": ["strength 1", "strength 2"],
  "remediation": "What should be changed to improve this response"
}

Respond ONLY with valid JSON.
```

---

## Prompt 2: Email Classification Accuracy

Use this to evaluate whether emails were classified correctly.

```
You are reviewing AI email classification decisions. For each email below, evaluate whether the classification was correct.

## Agent Configuration
- Name: {AGENT_NAME}
- Role: {AGENT_ROLE}
- Escalation Rules: {AGENT_ESCALATION_RULES}

## Email #{N}
From: {SENDER_EMAIL}
Subject: {SUBJECT}
Body:
{TEXT}

AI Classification:
- Category: {CATEGORY}
- Priority: {PRIORITY}
- Requires Response: {REQUIRES_RESPONSE}
- Should Escalate: {SHOULD_ESCALATE}
- Reasoning: {REASONING}

## For each email, evaluate:

1. **Category Accuracy**: Is the assigned category correct? Valid categories: inquiry, support, complaint, spam, newsletter, transactional, personal, urgent, other.
2. **Priority Accuracy**: Is the priority level appropriate? (low, medium, high, urgent)
3. **Response Decision**: Should the email actually require a response?
4. **Escalation Decision**: Given the agent's escalation rules, should this have been escalated?
5. **False Negative Risk**: Could missing this escalation cause customer harm?
6. **False Positive Cost**: Did unnecessary escalation waste admin time?

## Respond with JSON:
{
  "emailReviews": [
    {
      "emailNumber": 1,
      "categoryCorrect": true/false,
      "suggestedCategory": "...",
      "priorityCorrect": true/false,
      "suggestedPriority": "...",
      "responseDecisionCorrect": true/false,
      "escalationDecisionCorrect": true/false,
      "shouldHaveEscalated": true/false,
      "falseNegativeRisk": "none/low/medium/high",
      "falsePositiveCost": "none/low/medium/high",
      "score": 1-5,
      "note": "..."
    }
  ],
  "overallClassificationScore": 1-5,
  "systemicIssues": ["issue 1", "issue 2"],
  "remediation": "..."
}

Respond ONLY with valid JSON.
```

---

## Prompt 3: Admin Chat Quality

Use this to evaluate admin chat exchanges (admin message → agent response pairs).

```
You are reviewing the quality of an AI agent's responses in admin dashboard chat.

## Agent Configuration
- Name: {AGENT_NAME}
- Role: {AGENT_ROLE}
- Tone: {AGENT_TONE}
- Instructions: {AGENT_INSTRUCTIONS}
- Enabled Tools: {ENABLED_TOOLS}
- Connected Integrations: {CONNECTED_INTEGRATIONS}

## Chat Exchanges to Review:

### Exchange #{N}
Admin: {ADMIN_MESSAGE}
Agent: {AGENT_RESPONSE}
Tools Used: {TOOLS_USED_OR_NONE}
Timestamp: {TIMESTAMP}

## Evaluate each exchange on:

1. **Accuracy**: Is the information provided correct? Does it match reality (activity logs, config)?
2. **Conciseness**: Is the response 1-3 sentences for simple queries? No unnecessary elaboration?
3. **Format Compliance**: No markdown (**bold**, ##headings, ---dividers, -bullets, ```code)? Plain text only?
4. **Filler-Free**: No "Certainly!", "Of course!", "Absolutely!", "I'd be happy to", "Great question"?
5. **Tool Usage**: Were the right tools used? Was the result reported accurately?
6. **Capability Honesty**: Did the agent claim it couldn't do something it actually can? Or claim it did something it didn't?
7. **Trivial Message Handling**: For "ok", "thanks", "got it" — did the agent respond briefly or stay silent (both acceptable)?
8. **Knowledge Base Usage**: If the question could be answered from KB, did the agent check KB first?
9. **Hallucination Check**: Did the agent make up any activity, data, or capabilities?
10. **Instruction Alignment**: Does the response align with the agent's configured instructions and role?

## Filler Phrases to Flag:
"Certainly", "Of course", "Absolutely", "I'd be happy to", "Sure thing",
"Great question", "That's a great", "Let me help you with that", "No problem at all"

## Respond with JSON:
{
  "exchangeReviews": [
    {
      "exchangeNumber": 1,
      "overallScore": 1-5,
      "accuracy": { "score": 1-5, "note": "..." },
      "conciseness": { "score": 1-5, "note": "..." },
      "formatCompliance": { "score": 1-5, "note": "..." },
      "fillerFree": { "score": 1-5, "note": "..." },
      "toolUsage": { "score": 1-5, "note": "..." },
      "capabilityHonesty": { "score": 1-5, "note": "..." },
      "hallucination": false,
      "hallucinationDetails": "...",
      "fillerPhrasesFound": [],
      "markdownFound": [],
      "issues": [],
      "strengths": []
    }
  ],
  "overallChatScore": 1-5,
  "systemicPatterns": ["pattern 1"],
  "remediation": "..."
}

Respond ONLY with valid JSON.
```

---

## Prompt 4: Draft Quality Assessment

Use this when reviewing rejected or edited drafts to understand quality gaps.

```
You are analyzing AI-generated email drafts that were rejected or edited by the admin. Identify what went wrong and suggest improvements.

## Agent Configuration
- Name: {AGENT_NAME}
- Tone: {AGENT_TONE}
- Instructions: {AGENT_INSTRUCTIONS}

## Draft #{N}
To: {TO_EMAIL}
Subject: {SUBJECT}
AI Draft:
{DRAFT_TEXT}

AI Reasoning: {AI_REASONING}

Status: {STATUS} (rejected/edited)
Edited Version (if edited):
{EDITED_TEXT}

## For each draft, evaluate:

1. **Why Rejected/Edited**: What's the most likely reason the admin didn't approve the original?
2. **Tone Match**: Does it match the configured tone?
3. **Content Quality**: Is the content helpful, accurate, and appropriate?
4. **Length Appropriateness**: Too long, too short, or just right?
5. **Format Issues**: Any markdown, banned phrases, or formatting problems?
6. **Edit Distance**: If edited, how much changed? (minor tweaks vs major rewrite)
7. **Pattern Recognition**: Is this the same type of issue seen in other rejected drafts?

## Respond with JSON:
{
  "draftReviews": [
    {
      "draftNumber": 1,
      "likelyRejectionReason": "...",
      "toneMatch": true/false,
      "contentScore": 1-5,
      "lengthAssessment": "too_short/appropriate/too_long",
      "formatIssues": [],
      "editDistance": "minor/moderate/major_rewrite",
      "score": 1-5,
      "note": "..."
    }
  ],
  "commonPatterns": ["pattern 1", "pattern 2"],
  "instructionGaps": ["gap 1"],
  "recommendedChanges": [
    { "target": "agent instructions/tone/writingSamples/escalationRules", "change": "..." }
  ],
  "overallDraftScore": 1-5
}

Respond ONLY with valid JSON.
```

---

## Prompt 5: Thread Coherence Review

Use this to evaluate multi-message email threads for context retention and coherence.

```
You are reviewing a multi-message email thread between an AI agent and a contact. Evaluate whether the agent maintained context and coherence throughout.

## Agent Configuration
- Name: {AGENT_NAME}
- Tone: {AGENT_TONE}

## Thread Messages (chronological):

### Message 1 ({DIRECTION}: {FROM})
Subject: {SUBJECT}
{TEXT}

### Message 2 ({DIRECTION}: {FROM})
Subject: {SUBJECT}
{TEXT}

[... continue for all messages ...]

## Evaluate:

1. **Context Retention**: Does the agent remember what was discussed earlier? Does it re-introduce itself?
2. **Repetition**: Does the agent repeat the same information or ask the same questions?
3. **Progressive Resolution**: Does the conversation move toward resolution, or does it loop?
4. **Appropriate Follow-up**: Does the agent build on previous context appropriately?
5. **Subject Line Evolution**: Are subject lines maintained or appropriately updated?
6. **Tone Consistency**: Is the tone consistent throughout the thread?
7. **Information Accuracy**: Does the agent contradict itself between messages?
8. **Thread Length**: Is the thread resolved in a reasonable number of exchanges?

## Respond with JSON:
{
  "threadScore": 1-5,
  "contextRetention": { "score": 1-5, "note": "..." },
  "repetitionIssues": { "score": 1-5, "instances": ["..."] },
  "progressiveResolution": { "score": 1-5, "note": "..." },
  "toneConsistency": { "score": 1-5, "note": "..." },
  "contradictions": [],
  "loopDetected": false,
  "estimatedResolutionEfficiency": "efficient/adequate/slow/stuck",
  "issues": [],
  "remediation": "..."
}

Respond ONLY with valid JSON.
```

---

## Prompt 6: Systemic Health Summary

Use this as a final synthesis prompt after running all other evaluations. Feed it the aggregated metrics and individual scores.

```
You are generating a systemic health summary for an AI email agent. Based on the metrics and review scores below, identify the top issues, trends, and remediation priorities.

## Agent: {AGENT_NAME} ({AGENT_EMAIL})
## Review Period: {START_DATE} to {END_DATE}

## Aggregate Metrics
- Emails Received: {N}
- Emails Sent: {N}
- Drafts Created: {N}
- Draft Approval Rate: {N}%
- Draft Rejection Rate: {N}%
- Draft Edit Rate: {N}%
- Escalation Rate: {N}%
- Avg Response Time: {N} minutes
- Admin Chat Messages: {N}
- Tool Failures: {N}
- Agent Errors: {N}
- Bounced/Complained: {N}

## Dimension Scores (from sampled reviews)
- Email Response Quality: {X}/5 (sampled {N} exchanges)
- Classification & Routing: {X}/5 (sampled {N} classifications)
- Draft Performance: {X}/5 (based on rates + {N} draft reviews)
- Admin Chat Quality: {X}/5 (sampled {N} exchanges)
- Tool & Integration Reliability: {X}/5
- Systemic Health: {X}/5

## Automated Check Findings
- Banned phrases found: {N} instances
- Markdown leakage: {N} instances
- AI filler in chat: {N} instances
- Verbose chat responses: {N} instances

## Generate:

1. **Overall Health Score** (1-5, weighted: email quality 25%, classification 15%, drafts 20%, chat 20%, tools 10%, systemic 10%)
2. **Status**: Healthy (4-5), Needs Attention (3-3.9), Critical (<3)
3. **Top 3 Issues** ranked by impact, with specific evidence
4. **Trend Assessment**: Is the agent improving, stable, or declining?
5. **Remediation Plan**: Ordered list of specific actions to improve the agent
6. **Quick Wins**: Changes that would have immediate impact

## Respond with JSON:
{
  "overallScore": 1.0-5.0,
  "status": "Healthy/Needs Attention/Critical",
  "topIssues": [
    { "rank": 1, "issue": "...", "evidence": "...", "impact": "high/medium/low", "dimension": "..." },
    { "rank": 2, "issue": "...", "evidence": "...", "impact": "...", "dimension": "..." },
    { "rank": 3, "issue": "...", "evidence": "...", "impact": "...", "dimension": "..." }
  ],
  "trendAssessment": "improving/stable/declining",
  "trendEvidence": "...",
  "remediationPlan": [
    { "priority": 1, "action": "...", "target": "agent config/system prompt/escalation rules/etc", "expectedImpact": "..." },
    { "priority": 2, "action": "...", "target": "...", "expectedImpact": "..." }
  ],
  "quickWins": [
    { "action": "...", "effort": "minimal/moderate", "impact": "..." }
  ],
  "dimensionBreakdown": {
    "emailResponseQuality": { "score": 1-5, "summary": "..." },
    "classificationRouting": { "score": 1-5, "summary": "..." },
    "draftPerformance": { "score": 1-5, "summary": "..." },
    "adminChatQuality": { "score": 1-5, "summary": "..." },
    "toolReliability": { "score": 1-5, "summary": "..." },
    "systemicHealth": { "score": 1-5, "summary": "..." }
  }
}

Respond ONLY with valid JSON.
```

---

## Usage Notes

1. **Sampling strategy**: For email quality (Prompt 1), sample 5-10 recent exchanges — include any flagged by automated checks plus random ones. For admin chat (Prompt 3), sample 10-20 exchanges.

2. **Variable substitution**: Replace all `{PLACEHOLDER}` values with actual data from the MongoDB queries in `queries.md`.

3. **Token budget**: Each prompt + data should fit within ~4000 tokens input. Truncate long email bodies to 500 chars if needed.

4. **Model choice**: Use `claude-sonnet-4-20250514` for evaluation prompts (better reasoning). Use `claude-3-haiku-20240307` only for simple metric calculations.

5. **Batch processing**: For efficiency, batch multiple emails into a single Prompt 2 call (up to 10 emails per batch). For Prompts 1 and 3, evaluate one exchange at a time for best accuracy.

6. **Cross-validation**: If an automated check flags an issue but the AI evaluation doesn't, investigate manually. If AI flags something the automated check missed, add it to the automated checks.
