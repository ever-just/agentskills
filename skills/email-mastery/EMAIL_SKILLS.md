# AI Agent Email Mastery Skills

> Comprehensive guide for Custom Agents email writing, compiled from deep research across forums (Reddit r/PromptEngineering, r/ChatGPTPromptGenius), official docs (Anthropic, Mailchimp, Grammarly), and GitHub (xixu-me/prompt-library, Ionio-io/AI-agent-for-cold-emails, theagentarchitect.substack.com).

---

## 1. TONE DRAFTING

### Tone Spectrum (match to agent's configured `tone` field)

| Tone Setting | Voice Characteristics | Example Phrasing |
|---|---|---|
| `professional` | Clear, respectful, structured. No jargon unless audience expects it. | "I've reviewed the details and here's what I recommend." |
| `friendly` | Warm, approachable, uses contractions. Like a helpful colleague. | "Hey! I looked into this and here's the deal." |
| `casual` | Relaxed, brief, conversational. Mirrors texting cadence. | "Got it, sending that over now." |
| `formal` | Precise, no contractions, structured paragraphs. Deferential. | "Dear Mr. Chen, Please find enclosed the requested documentation." |
| `empathetic` | Supportive, acknowledges feelings, solution-oriented. | "I completely understand how frustrating that must be. Let me fix this right away." |

### Tone Calibration Rules
- **Mirror the sender's formality** — if they write "hey", don't respond with "Dear Sir"
- **The "3rd email of the day" rule** (source: Reddit r/ChatGPTPromptGenius, 120+ upvotes) — write as if this is the 3rd email you've sent today, not the first. Kills the desperate, overly formal default AI tone.
- **Never stack contradictions** — don't be "professional but friendly, authoritative but approachable, detailed but concise." Pick a primary trait and a secondary modifier.
- **Confidence without arrogance** — assume mutual respect. Position as a peer, not a supplicant.

### Anti-Patterns (NEVER DO)
- No "I hope this email finds you well"
- No "Just reaching out to..."
- No "I'd love to..." (sounds needy)
- No "Wondering if..." (sounds hesitant)
- No "Please don't hesitate to..." (filler)
- No excessive exclamation points (max 1 per email, if any)
- No "As per my last email" (passive-aggressive)

---

## 2. EMAIL LAYOUT & STRUCTURE

### The Universal Structure
```
1. Subject Line (4-7 words, specific)
2. Greeting (personalized, matches tone)
3. Opening Line (context or purpose — 1 sentence)
4. Body (the substance — 2-4 short paragraphs max)
5. Call to Action (clear, single, specific)
6. Closing (matches tone warmth level)
7. Sign-off (agent name)
```

### Layout Rules
- **One topic per email** — if you need to cover multiple topics, consider separate emails
- **Short paragraphs** — max 2-3 sentences each. Break after every idea change.
- **Scannable on mobile** — 80%+ of emails are read on phones. No walls of text.
- **White space is your friend** — single blank line between paragraphs
- **Bold sparingly** — only for dates, deadlines, or the single most important point. Overuse kills emphasis.
- **Bullet points for 3+ items** — but never for the core message. Bullets = supporting details only.

### Length Guidelines by Scenario
| Scenario | Target Length | Why |
|---|---|---|
| Quick reply/acknowledgment | 1-2 sentences | Respect their inbox |
| Standard response | 3-5 sentences | Get to the point |
| Detailed answer | 2-3 short paragraphs | Break into scannable chunks |
| Research/report summary | 3-5 paragraphs with sections | Use headers and bullets |
| Cold outreach | Under 100 words | Nobody reads long cold emails |

---

## 3. SYNTAX BY SCENARIO

### Customer Support Response
```
Greeting + Name,

[Acknowledge the issue in 1 sentence — show you understood]

[Solution/answer in 1-2 sentences]

[Next steps or what to expect — 1 sentence]

[Warm closing],
[Agent Name]
```

### Follow-Up Email
```
Hi [Name],

[Reference previous interaction specifically — date, topic]

[New information or gentle nudge — 1-2 sentences]

[Specific, low-friction ask]

[Sign-off]
```

### Information Delivery (research results, reports)
```
Hi [Name],

[1-sentence context: what they asked for]

[Key Finding / TL;DR — the answer in 1 sentence]

Supporting details:
- [Point 1 with source/link]
- [Point 2 with source/link]  
- [Point 3 with source/link]

[Offer to elaborate or next steps]

[Sign-off]
```

### Escalation / Handoff Email
```
Hi [Name],

[Explain the situation briefly]

[What's been done so far]

[What needs to happen next and who's handling it]

[Timeline if available]

[Sign-off]
```

### Cold Outreach (agent-initiated)
```
[First line MUST reference something specific about recipient/company]

[1-sentence value proposition — what you can do for THEM]

[Concrete, low-commitment ask: specific question, resource to review, or brief call with defined scope]

[Sign-off — no more than this]
```

---

## 4. PERSONALITY EMBODIMENT

### How to Stay in Character
The agent's personality should feel **consistent across every email**. This requires:

1. **Vocabulary anchors** — each personality has words it gravitates to:
   - Professional: "recommend", "outline", "regarding", "facilitate"
   - Friendly: "awesome", "happy to", "sounds great", "totally"
   - Casual: "cool", "got it", "no worries", "heads up"
   - Formal: "kindly", "enclosed", "pursuant to", "at your earliest convenience"
   - Empathetic: "understand", "appreciate", "must be", "here for you"

2. **Sentence structure patterns**:
   - Professional: Medium sentences, active voice, clear structure
   - Friendly: Mix of short and medium, occasional questions to reader
   - Casual: Short punchy sentences. Fragments OK. 
   - Formal: Longer, complete sentences. Passive voice acceptable. Subordinate clauses.
   - Empathetic: Start with feeling acknowledgment, then pivot to solution

3. **What each personality AVOIDS**:
   - Professional → slang, emojis, exclamation marks
   - Friendly → cold distance, passive voice, jargon
   - Casual → long paragraphs, formal greetings, over-explaining
   - Formal → contractions, first-name-only greetings, abbreviations
   - Empathetic → dismissiveness, "just", minimizing language

### Writing Samples Are King
(Source: Reddit r/PromptEngineering — top-voted technique)
- If the agent has `writingSamples`, these override generic tone rules
- Analyze the samples for: sentence length, vocabulary level, greeting style, sign-off style, use of humor, formality level
- **Match the cadence and rhythm**, not just the vocabulary

---

## 5. HYPERLINKS & ATTACHMENTS

### When to Include Hyperlinks
- **DO link**: when referencing a specific resource, article, tool, or webpage the recipient should visit
- **DO link**: for call-to-action buttons (meeting scheduler, payment link, form)
- **DO link**: when citing sources for research or data
- **DON'T link**: for common knowledge or obvious URLs (e.g., "visit google.com")
- **DON'T link**: more than 2-3 links per email — causes decision fatigue and spam flags

### Hyperlink Formatting Rules
- **Never raw URLs** — always use descriptive anchor text
  - ❌ `Check out https://docs.customagents.io/api/v2/endpoints`
  - ✅ `Check out our API documentation for the full endpoint reference`
- **Describe what they'll find** — "Download the Q4 report" not "Click here"
- **Limit to 1-2 links maximum** per email (data shows highest click-through)

### When to Use Attachments
- PDFs, invoices, contracts — things recipients need to save/print
- Images only when they're the content (product photos, diagrams), not decoration
- **Always mention attachments in the body** — "I've attached the report" before the sign-off
- Keep file sizes reasonable — large attachments slow email delivery

### When to Use Inline Images (HTML format only)
- Product photos when discussing a specific product
- Charts/graphs when presenting data findings
- Screenshots for support (showing where to click)
- **Never for decoration** — no stock photos, no logos in body text

---

## 6. GREETINGS & SUBJECT LINES

### Greeting Selection Matrix

| Relationship | Formal | Professional | Friendly | Casual |
|---|---|---|---|---|
| First contact (unknown) | "Dear [Full Name]," | "Hello [First Name]," | "Hi [First Name]," | "Hi [First Name]," |
| Existing contact | "Dear [Title] [Last]," | "Hello [First Name]," | "Hi [First Name]!" | "Hey [First Name]," |
| Ongoing thread | "Dear [First Name]," | "[First Name]," | "Hi again," | "Hey," |
| Group email | "Dear Team," | "Hello everyone," | "Hi all," | "Hey everyone," |
| Unknown recipient | "Dear Sir/Madam," | "Hello," | "Hi there," | "Hi," |

### Greetings to NEVER Use
- "To Whom It May Concern" (feels like a form letter)
- "Dear Customer" (impersonal)
- "Hey there!" in first contact (too familiar)
- "Greetings" (robotic)
- "Good [morning/afternoon]" (you don't know when they'll read it — unless timezone is known)

### Subject Line Rules
- **4-7 words** — specific, not vague
- **Lead with the action or topic** — "Meeting reschedule: Thursday 3pm" not "About our meeting"
- **For replies**: keep the thread subject, prefix with "Re:"
- **For new threads**: be specific — "Q4 Sales Report Attached" not "Report"
- **Never all caps** — triggers spam filters and feels aggressive
- **Questions work** — "Can we reschedule to Friday?" gets higher open rates
- **Emojis in subject**: only for casual/friendly tone, max 1, at the start

### Subject Line Examples by Scenario
| Scenario | Good | Bad |
|---|---|---|
| Meeting request | "Quick sync this week — 15 min" | "Meeting" |
| Sending a report | "Q4 Revenue Report — highlights inside" | "Report attached" |
| Follow-up | "Following up on the demo — next steps" | "Checking in" |
| Support reply | "Re: Login issue — resolved" | "Your ticket" |
| Introduction | "Intro: [Name] ↔ [Name] re: [topic]" | "Introduction" |

---

## 7. EMOJIS & VISUAL ASSETS

### When Emojis Are Appropriate
(Source: Grammarly research, Mailchimp best practices)

| Context | Use Emojis? | Example |
|---|---|---|
| Internal/team communication | ✅ Yes | "Great job on the launch! 🎉" |
| Casual/friendly tone setting | ✅ Yes, sparingly | "Hey! 👋 Quick update on the project." |
| Subject lines (casual) | ✅ 1 max | "📊 Your weekly analytics summary" |
| B2C marketing/promotional | ✅ Yes | "Don't miss out! 🔥" |
| Formal business communication | ❌ No | — |
| First cold email to unknown | ❌ No | — |
| Legal/financial/sensitive | ❌ No | — |
| Executive-level communication | ❌ No (unless culture allows) | — |

### Emoji Placement Guide
- **Subject line**: 1 emoji at the start to catch attention (📊, ❗, 👋, 🎉)
- **Greeting**: wave emoji for warm opener (👋)
- **Lists**: emojis as visual bullet markers (👉, ⭐, ✔️, 🎯)
- **Closing**: to set a warm tone (🙂, 🙏, 🚀)
- **Sign-off**: for personality (✨, 🌟)
- **NEVER**: multiple emojis in a row, emojis replacing words, or emojis in serious content

### Safe Universal Emojis for Business
```
👋 Wave (greeting)        ✅ Checkmark (done/confirmed)
📊 Chart (data/reports)   📎 Paperclip (attachments)
🎉 Party (celebrations)   💡 Lightbulb (ideas/tips)
⭐ Star (highlights)      🔗 Link (resources)
📅 Calendar (scheduling)  🚀 Rocket (launches/updates)
🎯 Target (goals)        ⏰ Clock (deadlines/urgent)
👉 Pointer (action items) 📝 Note (documentation)
🙏 Thanks                ✨ Sparkle (new/exciting)
```

### Recommended npm Packages for Emoji Support
```
node-emoji (v2.x) — Primary: shortcode-based emoji (`:smile:` → 😄)
  - 1800+ emojis, keyword search, ESM support
  - Usage: emoji.emojify(':wave: Hello!') → '👋 Hello!'

unicode-emoji (v3.x) — Full Unicode 16.0 emoji dataset
  - Complete metadata, skin tone variants, groups
  - Usage: getAllEmojis(), getEmojisByGroup('Smileys & Emotion')
```

---

## 8. AUDIENCE-TYPE ADAPTATION

### Audience Detection Signals
The agent should infer audience type from:
- Email domain (`.edu` = academic, `.gov` = government, corporate domains = B2B)
- Writing style of incoming email (formal = respond formal, casual = match)
- Contact CRM notes and history
- Subject matter (legal/financial = more formal, creative/marketing = more casual)

### Audience-Specific Rules

#### **Executives / C-Suite**
- Ultra-concise: TL;DR first, details below if needed
- Lead with the decision or recommendation
- Numbers > adjectives
- No fluff, no preamble
- Respect their time above all

#### **Technical / Developers**
- Precise language, technical terms OK
- Include relevant specs, versions, links to docs
- Code snippets in monospace if relevant
- Skip the niceties, get to the technical substance
- Link to GitHub issues, PRs, or documentation

#### **Small Business Owners**
- Friendly and personal
- Emphasize practical value and ROI
- Avoid jargon — explain in plain language
- Show you understand their business challenges
- Be responsive and available

#### **Enterprise / Corporate**
- Professional, structured, measured
- Reference account history and prior communications
- Clear next steps with timelines
- CC awareness — assume multiple stakeholders reading
- Formal greetings for first interactions

#### **Creative / Marketing**
- More personality in writing
- Emojis and casual language OK
- Show enthusiasm for their projects
- Visual language and metaphors welcome
- Match their energy level

#### **International / Cross-Cultural**
- Avoid idioms and cultural references
- Use clear, simple English
- Be aware of timezone differences
- No humor that could be misinterpreted
- Use full dates (March 15, 2026 — not 3/15/26)

#### **Gen Z / Young Professionals**
- Concise, no corporate speak
- Casual and authentic tone
- Emojis welcome but don't overdo
- Visual content appreciated
- Direct and genuine

#### **Baby Boomers / Senior Professionals**
- More formal, respectful
- Complete sentences, proper grammar
- Detailed explanations welcome
- Traditional email structure
- "Dear" greetings, "Best regards" closings

---

## 9. FORMATTING RESEARCH & TOOL-CALLING RESULTS

### When the agent uses web_search, integration tools, or knowledge base:

#### Research Results Format
```
Hi [Name],

I looked into [topic] and here's what I found:

[KEY FINDING — 1 sentence summary, the direct answer]

Details:
- [Finding 1]: [brief explanation] (source: [link or tool])
- [Finding 2]: [brief explanation] (source: [link or tool])
- [Finding 3]: [brief explanation] (source: [link or tool])

[Caveat or confidence note if applicable: "This data is from [date/source] and may have changed."]

[Next step or offer to dig deeper]

[Sign-off]
```

#### Tool Results Format (calendar, contacts, integrations)
```
Hi [Name],

Done — [action completed in 1 sentence].

Details:
[Relevant specifics: time, date, confirmation number, link]

[Any follow-up needed]

[Sign-off]
```

#### Data/Analytics Summary Format
```
[Name],

Here's the [report/analysis] you asked about:

Summary: [1-2 sentence TL;DR with the key number/insight]

Breakdown:
- [Metric 1]: [value] ([trend: up/down/flat] from [comparison period])
- [Metric 2]: [value] ([context])
- [Metric 3]: [value] ([context])

[Interpretation: what this means / recommended action]

[Sign-off]
```

#### When Presenting Multiple Sources
- Always attribute: "According to [source]..."
- If sources conflict, note it: "Source A says X, while Source B suggests Y."
- Include links when available — hyperlinked descriptive text, not raw URLs
- If data is time-sensitive, include when it was retrieved
- Confidence framing: "Based on the available data..." or "From what I could find..."

### Formatting Rules for Tool Output in Emails
1. **Never dump raw JSON or data** — always summarize in natural language
2. **Lead with the answer**, details below
3. **Use tables for comparisons** (HTML emails only), bullets for lists
4. **Round numbers** for readability ($1,247.83 → ~$1,250)
5. **Translate technical output** — "Status 200 OK" → "Everything looks good"
6. **Link to full resources** when summarizing: "Full report here: [link]"

---

## Sources & References

### Forums
- Reddit r/PromptEngineering: "AI Email draft replies — how to improve the prompt" (2025)
- Reddit r/ChatGPTPromptGenius: "The cold email prompt that actually gets replies" (120+ upvotes)
- Reddit r/PromptEngineering: "How I finally got ChatGPT to actually sound like me"
- Reddit r/automation: "Can You Trust AI to Write Your Emails fully?"

### Documentation & Guides
- Mailchimp: "Finding the Right Email Tone for Your Audience"
- Grammarly: "Emoji in Work Email: Dos and Don'ts"
- Jotform: "How to Format an Email: Professional Solutions with AI"
- PoliteMail: "Best Practices for Email Links and Attachments"
- Chamaileon: "How to Use the AIDA Model to Write Better Emails"

### GitHub & Engineering
- xixu-me/prompt-library: Email Templates Generator prompt
- The Agent Architect: "4 Tips for Writing System Prompts That Make Your AI Agents Work"
- MindStudio: "How to Write Effective Prompts for AI Agents"
- omnidan/node-emoji: npm emoji library (v2.x, 1800+ emojis)
- Julien-Marcou/Unicode-Emoji: Full Unicode 16.0 dataset

### Copywriting Frameworks Referenced
- AIDA (Attention → Interest → Desire → Action)
- PAS (Problem → Agitate → Solution)
- "3rd email of the day" technique (kills AI formality defaults)
