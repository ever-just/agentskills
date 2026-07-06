# Strategy

The most abstract plane in Garrett's framework. Decisions here govern every layer below — and skipping this layer is the most common reason products fail despite being well-built.

## What this layer is

Garrett defines the Strategy plane as having two components:

- **User Needs** — externally derived goals for the site; identified through user research, ethno/techno/psychographics, etc.
- **Site Objectives** — business, creative, or other internally derived goals for the site.

In modern practice, this layer also implicitly includes **domain reality** (the structure of the world the product operates in — what entities exist, what real-world processes constrain the product) and **business model** (how money flows, which shapes what's first-class).

## Where it sits

Top of the stack. Nothing is upstream of Strategy *within* the framework. What's upstream of Strategy is the world: real users, real businesses, real markets, real domains. Everything below Strategy — Scope, Structure, Skeleton, Surface — is downstream and should express Strategy decisions.

## What to evaluate

**User Needs:**
- Who are the actual users? Are they identified specifically, or is "users" treated as a homogeneous group?
- What jobs are users hiring this product to do? (See Christensen's Jobs-to-Be-Done framing.)
- Is there evidence for the stated needs, or are they assumed? What user research has been done?
- Are there distinct user segments with different needs? Is the product trying to serve too many at once?
- What's the user's mental model of the domain? Does the product match it or fight it?

**Site Objectives:**
- What is the business model? Subscription, transaction fees, advertising, marketplace take rate, freemium?
- What does the business need to be true for the product to succeed? (Activation? Retention? Conversion at a specific step?)
- Are objectives measurable, and are they being measured?
- Are user needs and business objectives aligned, or in tension? (Tension is normal; unacknowledged tension is dangerous.)

**Domain reality:**
- What entities exist in the real world this product operates in, regardless of whether the product models them?
- What constraints does the domain impose? (Regulatory, physical, economic, temporal.)
- Where does the product's model of the domain diverge from reality, and is the divergence intentional?

## Common failure modes

- **Skipping Strategy entirely.** Teams jump from "we have an idea" to "let's build features." The result is feature-rich products that don't cohere because there's no spine.
- **Strategy that exists only in someone's head.** The founder knows it; nobody else does. Decisions at lower planes are made without access to the upstream rationale and end up incoherent.
- **Confusing Strategy with vision.** A vision is aspirational ("we want to transform commerce"). A strategy is operational ("we win by being the lowest-friction onboarding experience for buyers earning $X/year"). Vision without strategy doesn't constrain decisions.
- **User needs derived from user research that confirms what the team already believed.** Bias dressed as evidence. Real research surfaces things you didn't expect.
- **Treating users as homogeneous.** "Our users want fast checkout." Which users? Power users want different things than first-time users; B2B buyers different than consumer buyers.
- **Optimizing site objectives at the expense of user needs.** Dark patterns, growth-hacked flows. Often produces short-term metric wins and long-term churn.

## What gets confused with Strategy

- **Feature lists** are Scope, not Strategy. "We need a referral program" is a feature; the question of whether referral is a viable acquisition channel for this user segment is Strategy.
- **Roadmaps** live at the Scope level; they implement Strategy.
- **Brand positioning** statements feel like Strategy but often describe Surface (how the product looks/feels) without addressing what it's *for*.
- **Mission statements** are usually too abstract to function as Strategy. They don't constrain decisions.

## Canonical sources

- Jesse James Garrett, *The Elements of User Experience* (2000/2002).
- Clayton Christensen, *The Innovator's Dilemma* (1997) and *Competing Against Luck* (2016) — the Jobs-to-Be-Done framework.
- Marty Cagan, *Inspired: How to Create Tech Products Customers Love* (2008/2017) — modern product strategy.
- Teresa Torres, *Continuous Discovery Habits* (2021) — connecting user research to product decisions.
- Eric Ries, *The Lean Startup* (2011) — validating strategy through experimentation.
- Rob Fitzpatrick, *The Mom Test* (2013) — how to do user research that surfaces real signal.
- Roger Martin, *Playing to Win* (2013) — strategy as a set of choices, not a plan.

## Diagnostic prompt

When evaluating a product at the Strategy layer, ask: *if every decision below this layer was perfect, would the product succeed?* If no, the problem is at Strategy, and no amount of redesign will fix it. If yes, you can move down the stack.
