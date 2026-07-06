# Interaction Design

The task-oriented side of Garrett's Structure plane. Interaction Design (IxD) is the discipline that defines *how the user interacts with the product over time* — the flows, behaviors, feedback, and dynamic relationships between user actions and system responses. It is distinct from Interface Design (which lives on Skeleton, one plane below) — IxD specifies *what should happen*; Interface Design specifies *what controls render that*.

## What this layer is

Garrett defines Interaction Design as: *development of application flows to facilitate user tasks, defining how the user interacts with site functionality.*

The discipline as a whole is broader than Garrett's definition. The term "interaction design" was coined by Bill Moggridge in the late 1980s to describe the design of the behavior of digital products. Alan Cooper's *About Face* later codified much of the modern practice. The core idea: digital products are not static artifacts; they are *behavioral systems*, and that behavior is itself the thing being designed.

## Where it sits

Structure plane, task-oriented column. Above it: Scope (what features the product must have). Below it: Skeleton's Interface Design (what controls the user touches). To its right (information-oriented sibling): Information Architecture.

IxD owns *behavior over time*. Information Architecture owns *organization in space*. Both are Structure-plane decisions, but they answer different questions.

## What to evaluate

**Flows:**
- For each major user task, is there a defined flow (start to finish)? Are alternative paths and exceptional flows defined?
- Do flows have clear entry points (how does the user get into this flow?) and exit points (how do they leave, succeed, or abandon)?
- Are decision points (branches) made explicit? What conditions cause the user to take each branch?
- Are loops and re-entries handled? (Edit, retry, undo, abandon and resume.)

**Behavior over time:**
- For every action the user takes, what is the system's response? Immediate, delayed, asynchronous, partial?
- Is there feedback for every action? (See Norman's affordances/feedback/mapping/constraints.)
- For long-running operations, is progress communicated? Can the user cancel? Resume?
- Are state transitions explicit and reversible where reversibility matters?

**Feedback (the "when" half):**
- When does feedback fire? On hover, click, submission, completion, error?
- What level of feedback is appropriate? (Inline microcopy, toast, modal, page-level alert.)
- Is feedback consistent across similar actions, or invented per-screen?
- For destructive actions, is there confirmation? For irreversible actions, is the irreversibility communicated?

**Error states and recovery:**
- What can go wrong? Network failure, validation errors, permission errors, conflicts, timeouts.
- For each, what does the user see? Can they recover, or are they dead-ended?
- Do error messages explain what happened and what to do about it? Or just blame the user?

**Affordances and signifiers (Norman):**
- Do interactive elements look interactive? (Affordances — what actions are possible.)
- Are the actions communicated, not just available? (Signifiers — visual cues.)
- Does the system status remain visible? (Nielsen's first heuristic: visibility of system status.)

## Common failure modes

- **Happy-path-only design.** Flows are designed assuming everything succeeds. Real users encounter validation errors, permission failures, network issues, conflicts — none of which were specified.
- **Inconsistent feedback patterns.** Submitting one form shows a toast; submitting another reloads the page; a third shows an inline message. Users have no consistent mental model of what to expect.
- **Silent failures.** Actions appear to succeed but didn't, or fail without feedback. The user submits and sees nothing change. Worst case: they submit twice, three times.
- **Modal abuse.** Modals used for tasks that should be inline, or for purposes (confirmation, form input) that don't justify interruption.
- **Unrecoverable destructive actions.** Delete with no undo; permanent operations that one click can trigger.
- **Loading states as afterthought.** Flows designed for instant response, then deployed with real network latency. The user spends half the time staring at loading spinners that weren't part of the design.
- **Optimistic UI without conflict resolution.** Optimistic updates that show immediate success, then silently revert when the server rejects. The user thinks they did the thing; the system disagrees.

## What gets confused with Interaction Design

- **Visual treatment of interactions** is Interface Design (Skeleton) or Visual Design (Surface). The decision that "saving shows a confirmation" is IxD; the decision that "the confirmation is a green toast at top-right" is Interface Design.
- **Information hierarchy** is Information Architecture, not IxD. IxD answers *what happens when the user does X*; IA answers *where things live*.
- **Microinteractions and animation** are sometimes considered a sub-discipline of IxD (Dan Saffer wrote a whole book on it), but the *animation craft* itself is closer to Visual Design. The decision that an action *should* have a transition is IxD; the curve and duration are Visual Design.
- **Microcopy** is content design, not IxD — though IxD specifies *what* needs to be said and *when*; content design specifies *how* it's said.

## Canonical sources

- Jesse James Garrett, *The Elements of User Experience* (2000/2002).
- Bill Moggridge, *Designing Interactions* (2007) — the discipline's origin story, told by the person who coined the term.
- Alan Cooper, Robert Reimann, David Cronin, Christopher Noessel, *About Face: The Essentials of Interaction Design* (4th ed., 2014) — the canonical IxD textbook.
- Don Norman, *The Design of Everyday Things* (1988/2013) — foundational concepts (affordances, signifiers, feedback, mapping, constraints, conceptual models). The single most cited source in the field.
- Jakob Nielsen, "10 Usability Heuristics for User Interface Design" (1994, updated since) — a short, durable evaluation framework. Heuristic #1 (visibility of system status) is essentially the core concern of IxD feedback.
- Dan Saffer, *Microinteractions: Designing with Details* (2013) — the granular layer of IxD.
- Steve Krug, *Don't Make Me Think* (2000/2014) — accessible introduction to interaction usability principles.

## Diagnostic prompt

When evaluating a product at the Interaction Design layer, walk a user through their primary task without using the product yourself. Ask: *for every step, is the system's response specified? Is there feedback? What happens if it fails? What happens if the user changes their mind?* If any of these are unanswered, the IxD work isn't complete — even if the screens look finished.
