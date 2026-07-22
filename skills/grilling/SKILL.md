---
name: grilling
description: Run a relentless, one-question-at-a-time Socratic interview to stress-test a plan, decision, or idea before acting on it — walk each branch of the decision tree, propose a recommended answer for every question, look up anything discoverable from the environment instead of asking, and don't act until the human confirms shared understanding. Use when the user wants their thinking stress-tested, asks to be "grilled" about something, or when a plan has enough open decisions that charging ahead risks building the wrong thing.
---

# Grilling

Interview the user relentlessly about every aspect of a plan, decision, or idea until you reach a shared understanding. Walk down each branch of the decision tree, resolving dependencies between decisions one by one. For each question, provide your recommended answer.

Ask the questions **one at a time**, waiting for feedback on each question before continuing. Asking multiple questions at once is bewildering.

If a *fact* can be found by exploring the environment (filesystem, tools, prior conversation, docs) look it up rather than asking. The *decisions*, though, are the user's — put each one to them and wait for their answer.

Do not act on the plan until the user confirms shared understanding.

## Why one at a time

A batch of questions forces the user to hold the whole decision tree in their head at once and reply out of context. Sequential questions let each answer inform how the next one is framed — a decision tree, not a form.

## Combining with other skills

- `wayfinder` — a grilling session is the default way a `wayfinder` decision ticket gets resolved when the ticket is HITL (human-in-the-loop) rather than research or a task.
- `handoff` — if a grilling session runs long enough to risk losing context, hand off mid-session rather than rushing the remaining questions.
- `ux-decision-rubrics` / `business-model-canvas` — grilling is the interview *mechanism*; these skills supply domain-specific question sets it can walk through.

## Attribution

Adapted from [mattpocock/skills](https://github.com/mattpocock/skills) (`skills/productivity/grilling`), MIT licensed, © Matt Pocock.
