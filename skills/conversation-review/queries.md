# Conversation Review — Data Extraction Queries

These queries are designed to be run against the production MongoDB (`sendook` database) either via `mongosh`, a script, or through the API endpoints. Replace `AGENT_ID`, `ORG_ID`, and date ranges as needed.

---

## 1. Get Agent Configuration

```javascript
// Fetch agent config to understand expected behavior
db.agents.findOne(
  { _id: ObjectId("AGENT_ID") },
  { name: 1, email: 1, role: 1, instructions: 1, tone: 1, autonomyMode: 1, escalationRules: 1, writingSamples: 1, enabledTools: 1, status: 1 }
)
```

**Via API:**
```
GET https://api.customagents.io/v1/agents/AGENT_ID
Authorization: Bearer <token>
```

---

## 2. Email Messages — Inbound & Outbound

### All messages for an agent's inbox (last 30 days)
```javascript
const inbox = db.inboxes.findOne({ agentId: ObjectId("AGENT_ID") })
db.messages.find(
  {
    inboxId: inbox._id,
    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
  },
  { from: 1, to: 1, cc: 1, subject: 1, text: 1, status: 1, threadId: 1, createdAt: 1 }
).sort({ createdAt: -1 }).limit(200)
```

### Inbound only (status = "received")
```javascript
db.messages.find(
  {
    inboxId: inbox._id,
    status: "received",
    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
  }
).sort({ createdAt: -1 })
```

### Outbound only (from = agent email)
```javascript
db.messages.find(
  {
    inboxId: inbox._id,
    status: "sent",
    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
  }
).sort({ createdAt: -1 })
```

### Messages per thread (for thread coherence review)
```javascript
db.threads.aggregate([
  { $match: { inboxId: inbox._id } },
  { $lookup: { from: "messages", localField: "messages", foreignField: "_id", as: "msgs" } },
  { $project: { messageCount: { $size: "$msgs" }, msgs: { from: 1, subject: 1, text: 1, status: 1, createdAt: 1 } } },
  { $match: { messageCount: { $gt: 1 } } },
  { $sort: { "msgs.createdAt": -1 } },
  { $limit: 20 }
])
```

---

## 3. Admin Chat Messages

### All admin chat for an agent (last 30 days)
```javascript
db.adminmessages.find(
  {
    agentId: ObjectId("AGENT_ID"),
    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
  },
  { role: 1, content: 1, metadata: 1, createdAt: 1 }
).sort({ createdAt: 1 }).limit(500)
```

### Group into conversation exchanges (admin → agent pairs)
```javascript
// JavaScript post-processing:
// Group consecutive admin+agent messages into exchanges
// Each exchange = { admin: "...", agent: "...", timestamp: ... }
```

**Via API:**
```
GET https://api.customagents.io/v1/agents/AGENT_ID/admin-messages?limit=100
Authorization: Bearer <token>
```

---

## 4. Agent Activities

### All activities for an agent (last 30 days)
```javascript
db.agentactivities.find(
  {
    agentId: ObjectId("AGENT_ID"),
    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
  },
  { type: 1, summary: 1, details: 1, messageId: 1, contactId: 1, threadId: 1, createdAt: 1 }
).sort({ createdAt: -1 }).limit(500)
```

### Activity breakdown by type
```javascript
db.agentactivities.aggregate([
  {
    $match: {
      agentId: ObjectId("AGENT_ID"),
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    }
  },
  { $group: { _id: "$type", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])
```

### Escalation details
```javascript
db.agentactivities.find(
  {
    agentId: ObjectId("AGENT_ID"),
    type: "email_escalated",
    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
  },
  { summary: 1, details: 1, messageId: 1, contactId: 1, createdAt: 1 }
).sort({ createdAt: -1 })
```

### Error activities
```javascript
db.agentactivities.find(
  {
    agentId: ObjectId("AGENT_ID"),
    type: "agent_error",
    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
  }
).sort({ createdAt: -1 })
```

### Classification details (for accuracy review)
```javascript
db.agentactivities.find(
  {
    agentId: ObjectId("AGENT_ID"),
    type: "email_classified",
    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
  },
  { summary: 1, details: 1, messageId: 1, createdAt: 1 }
).sort({ createdAt: -1 })
```

---

## 5. Email Drafts

### All drafts with status breakdown
```javascript
db.emaildrafts.aggregate([
  {
    $match: {
      agentId: ObjectId("AGENT_ID"),
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    }
  },
  { $group: { _id: "$status", count: { $sum: 1 } } }
])
```

### Rejected drafts with reasoning (for quality analysis)
```javascript
db.emaildrafts.find(
  {
    agentId: ObjectId("AGENT_ID"),
    status: "rejected",
    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
  },
  { to: 1, subject: 1, text: 1, aiReasoning: 1, createdAt: 1 }
).sort({ createdAt: -1 })
```

### Edited drafts (compare original vs edited)
```javascript
db.emaildrafts.find(
  {
    agentId: ObjectId("AGENT_ID"),
    status: { $in: ["approved", "sent"] },
    editedText: { $ne: null, $exists: true },
    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
  },
  { to: 1, subject: 1, text: 1, editedText: 1, aiReasoning: 1, createdAt: 1, reviewedAt: 1 }
).sort({ createdAt: -1 })
```

### Draft review latency
```javascript
db.emaildrafts.aggregate([
  {
    $match: {
      agentId: ObjectId("AGENT_ID"),
      reviewedAt: { $exists: true, $ne: null },
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    }
  },
  {
    $project: {
      latencyMs: { $subtract: ["$reviewedAt", "$createdAt"] },
      status: 1
    }
  },
  {
    $group: {
      _id: null,
      avgLatency: { $avg: "$latencyMs" },
      minLatency: { $min: "$latencyMs" },
      maxLatency: { $max: "$latencyMs" },
      count: { $sum: 1 }
    }
  }
])
```

### Expired drafts (never reviewed)
```javascript
db.emaildrafts.find(
  {
    agentId: ObjectId("AGENT_ID"),
    status: "expired"
  },
  { to: 1, subject: 1, createdAt: 1 }
).sort({ createdAt: -1 })
```

---

## 6. Contacts & Conversations

### Contacts per agent
```javascript
db.contacts.find(
  { agentId: ObjectId("AGENT_ID") },
  { name: 1, email: 1, company: 1, relationship: 1, tags: 1, notes: 1, agentNotes: 1, createdAt: 1 }
).sort({ createdAt: -1 })
```

### Conversation summaries (AI-generated context)
```javascript
db.agentconversations.find(
  { agentId: ObjectId("AGENT_ID") },
  { contactId: 1, summary: 1, context: 1, messageCount: 1, lastMessageAt: 1 }
).sort({ lastMessageAt: -1 })
```

---

## 7. Aggregate Metrics Queries

### Daily message volume (last 30 days)
```javascript
db.messages.aggregate([
  {
    $match: {
      inboxId: inbox._id,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    }
  },
  {
    $group: {
      _id: {
        date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        direction: { $cond: [{ $eq: ["$status", "received"] }, "inbound", "outbound"] }
      },
      count: { $sum: 1 }
    }
  },
  { $sort: { "_id.date": 1 } }
])
```

### Response time per thread (outbound timestamp - last inbound timestamp)
```javascript
// This requires post-processing. For each thread:
// 1. Get all messages sorted by createdAt
// 2. For each outbound message, find the most recent inbound before it
// 3. Calculate the time difference
// Best done in a script rather than a single aggregation
```

### Weekly escalation trend
```javascript
db.agentactivities.aggregate([
  {
    $match: {
      agentId: ObjectId("AGENT_ID"),
      type: "email_escalated",
      createdAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
    }
  },
  {
    $group: {
      _id: { $dateToString: { format: "%Y-W%V", date: "$createdAt" } },
      count: { $sum: 1 }
    }
  },
  { $sort: { _id: 1 } }
])
```

### Bounced/complained messages (email delivery issues)
```javascript
db.messages.find(
  {
    inboxId: inbox._id,
    status: { $in: ["bounced", "complained", "rejected"] }
  },
  { from: 1, to: 1, subject: 1, status: 1, createdAt: 1 }
).sort({ createdAt: -1 })
```

---

## 8. Automated Pattern Detection Scripts

### Banned phrase scanner (run in mongosh or Node.js)
```javascript
const bannedPhrases = [
  "I hope this email finds you well",
  "Just reaching out",
  "Please don't hesitate to",
  "As per my last email",
  "Let me know if you need anything else",
  "I hope this helps",
  "Great question!",
  "I'd love to",
  "Wondering if"
];

const outbound = db.messages.find({
  inboxId: inbox._id,
  status: "sent",
  createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
}).toArray();

const violations = [];
for (const msg of outbound) {
  const textLower = (msg.text || "").toLowerCase();
  for (const phrase of bannedPhrases) {
    if (textLower.includes(phrase.toLowerCase())) {
      violations.push({
        messageId: msg._id,
        subject: msg.subject,
        phrase: phrase,
        date: msg.createdAt
      });
    }
  }
}
print(`Found ${violations.length} banned phrase violations`);
printjson(violations);
```

### Markdown leakage scanner
```javascript
const markdownPatterns = [
  /\*\*[^*]+\*\*/,          // **bold**
  /^##?\s/m,                 // ## headings
  /^---$/m,                  // --- dividers
  /^[-*]\s/m,                // - bullet points
  /^```/m,                   // ```code blocks
  /^\d+\.\s/m                // 1. numbered lists
];

const outbound = db.messages.find({
  inboxId: inbox._id,
  status: "sent",
  createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
}).toArray();

const violations = [];
for (const msg of outbound) {
  const text = msg.text || "";
  for (const pattern of markdownPatterns) {
    if (pattern.test(text)) {
      violations.push({
        messageId: msg._id,
        subject: msg.subject,
        pattern: pattern.toString(),
        date: msg.createdAt
      });
    }
  }
}
print(`Found ${violations.length} markdown leakage violations`);
printjson(violations);
```

### Admin chat markdown + filler scanner
```javascript
const fillerPhrases = [
  "Certainly", "Of course", "Absolutely",
  "I'd be happy to", "Sure thing", "Great question",
  "That's a great", "Let me help you with that",
  "No problem at all"
];

const agentMessages = db.adminmessages.find({
  agentId: ObjectId("AGENT_ID"),
  role: "agent",
  createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
}).toArray();

const issues = [];
for (const msg of agentMessages) {
  const content = msg.content || "";
  
  // Check markdown
  for (const pattern of markdownPatterns) {
    if (pattern.test(content)) {
      issues.push({ type: "markdown", messageId: msg._id, pattern: pattern.toString(), date: msg.createdAt });
    }
  }
  
  // Check filler
  for (const phrase of fillerPhrases) {
    if (content.toLowerCase().startsWith(phrase.toLowerCase())) {
      issues.push({ type: "filler", messageId: msg._id, phrase: phrase, date: msg.createdAt });
    }
  }
  
  // Check verbosity (>500 chars)
  if (content.length > 500) {
    issues.push({ type: "verbose", messageId: msg._id, length: content.length, date: msg.createdAt });
  }
}
print(`Found ${issues.length} admin chat quality issues`);
printjson(issues);
```

---

## 9. Cross-Reference Queries

### Match inbound emails to their agent responses (for side-by-side review)
```javascript
// For each thread, pair inbound → outbound messages
db.threads.aggregate([
  { $match: { inboxId: inbox._id } },
  { $lookup: { from: "messages", localField: "messages", foreignField: "_id", as: "msgs" } },
  { $unwind: "$msgs" },
  { $sort: { "msgs.createdAt": 1 } },
  { $group: {
    _id: "$_id",
    messages: { $push: {
      from: "$msgs.from",
      to: "$msgs.to",
      subject: "$msgs.subject",
      text: "$msgs.text",
      status: "$msgs.status",
      createdAt: "$msgs.createdAt"
    }}
  }},
  { $match: { "messages.1": { $exists: true } } }, // Only threads with 2+ messages
  { $sort: { "messages.0.createdAt": -1 } },
  { $limit: 20 }
])
```

### Match classifications to their original emails
```javascript
// Join email_classified activities with their messages
db.agentactivities.aggregate([
  {
    $match: {
      agentId: ObjectId("AGENT_ID"),
      type: "email_classified",
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    }
  },
  {
    $lookup: {
      from: "messages",
      localField: "messageId",
      foreignField: "_id",
      as: "message"
    }
  },
  { $unwind: "$message" },
  {
    $project: {
      classification: "$details",
      email: { from: "$message.from", subject: "$message.subject", text: "$message.text" },
      createdAt: 1
    }
  },
  { $sort: { createdAt: -1 } },
  { $limit: 20 }
])
```

---

## Notes

- All queries use `new Date(Date.now() - N * 24 * 60 * 60 * 1000)` for relative date filtering. Adjust N for your time window.
- For production access via SSH: `ssh root@134.209.221.255 "docker exec customagents-mongo-1 mongosh sendook -u sendook -p sendook_secret_2026 --authenticationDatabase admin --eval '<query>'"`
- For large result sets, add `.limit()` to avoid memory issues.
- The `inbox._id` variable must be resolved first by looking up the inbox for the target agent.
