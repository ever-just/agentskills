# Scope

The second plane in Garrett's framework, between Strategy and Structure. Scope translates strategic intent into the concrete features and content the product must contain. It is the most commonly skipped layer in small-team work — teams move directly from Strategy to Structure or even to Skeleton, and the gap shows up later as feature scope creep, redundant pages, or features without users.

## What this layer is

Garrett defines the Scope plane as having two components:

- **Functional Specifications** — "feature set": detailed descriptions of functionality the site must include in order to meet user needs.
- **Content Requirements** — definition of content elements required in the site in order to meet user needs.

This is Garrett's first explicit application of the task / information duality: Functional Specifications describe what the product *does* (task-oriented); Content Requirements describe what it *contains* (information-oriented). Most modern products require both.

## Where it sits

Below Strategy, above Structure. Scope is the layer where strategic decisions become concrete enough to build against. It does not yet describe how features are organized (that's Structure) or how they're laid out (that's Skeleton) — it answers only: *what does this product need to include?*

## What to evaluate

**Functional Specifications:**
- For each feature on the roadmap, does it directly serve a strategic goal? Can you trace it upward to a User Need or Site Objective?
- Are functional specifications written from the user's perspective (what they can do) or from the system's perspective (what it does)? User-perspective specs are generally clearer.
- Are edge cases, error states, and exceptional flows specified, or only the happy path?
- Are non-functional requirements (performance, accessibility, security, scale) included, or treated as implementation details?
- Is the feature set internally consistent? Do features compete with or duplicate each other?
- What's explicitly *out* of scope? Naming what's excluded prevents scope creep.

**Content Requirements:**
- What content types exist? (Articles, listings, profiles, products, reports, posts.)
- For each content type, what attributes are required? Optional?
- Where does content come from? User-generated, editorial, automated, third-party?
- How is content kept current? Who owns updating it?
- What is the volume and lifecycle of each content type? (One-time vs. ongoing, archived vs. deleted.)
- Is content localized, translated, or culturally adapted?

## Common failure modes

- **Feature inflation without strategic anchoring.** Features get added because someone asked for them, not because they serve User Needs or Site Objectives. The product becomes capability-rich but purpose-poor.
- **Specifications written too early or too late.** Too early: locked-in details that don't survive contact with implementation. Too late: developers and designers making scope decisions implicitly during build.
- **Content treated as filler.** Wireframes show "lorem ipsum" forever. Content Requirements never get specified, so when real content arrives it doesn't fit the layout.
- **Confusing scope with backlog.** A backlog is a working list of tasks; scope is the boundary of the product. Scope answers what's in/out; the backlog answers what to do next.
- **No definition of "done."** Without acceptance criteria at the Scope layer, every feature ships in some interpretive form of "complete."
- **Over-scoping the MVP.** Feature lists labeled "minimum" that contain everything anyone might want. The strategic question — what's the minimum that validates the strategic hypothesis? — gets lost.

## What gets confused with Scope

- **Implementation tasks** live below Scope. "Add Stripe integration" is an implementation task; "the product must support paid transactions" is Scope.
- **Design specifications** are Skeleton, not Scope. The functional spec says "users can upload a profile photo"; the design spec says "the upload control is a drag-and-drop zone with a 5MB limit and shows a circular crop preview."
- **Architecture decisions** about how features are organized into pages or sections are Structure, not Scope.

## Canonical sources

- Jesse James Garrett, *The Elements of User Experience* (2000/2002).
- Karl Wiegers and Joy Beatty, *Software Requirements* (3rd ed., 2013) — the canonical text on requirements engineering.
- Mike Cohn, *User Stories Applied* (2004) — translating scope into user stories.
- Marty Cagan, *Inspired* (2008/2017) — covers modern product specs and the role of the PM in defining scope.
- Karen McGrane, *Content Strategy for Mobile* (2012) — content as a Scope-layer concern.
- Erika Hall, *Just Enough Research* (2013) — research methods that produce scope-relevant evidence.

## Diagnostic prompt

When evaluating a product at the Scope layer, ask: *for every feature in the product, can I trace why it exists back to a Strategy-layer decision?* Features that can't be traced are either Strategy gaps (the strategy doesn't actually justify them) or Scope debris (features kept around past their purpose). And in reverse: *for every Strategy goal, is there a Scope item that addresses it?* Goals without scope are unimplemented strategy.
