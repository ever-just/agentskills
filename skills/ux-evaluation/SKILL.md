---
name: ux-evaluation
description: Evaluate user experience by locating decisions on a layered framework drawn from Jesse James Garrett's Elements of User Experience and modern frontend practice. Use this skill when reviewing or auditing any product interface, when diagnosing a UX problem (where does it actually live?), when designing or systematizing a frontend, when discussing information architecture, interaction design, layout, design tokens, or design systems, when asked questions like "is this a UI problem or a deeper problem", "what should we systematize", "where should this decision be made", or any request to evaluate, critique, or improve a digital product holistically. Trigger this skill whenever a question touches the structure of a product rather than just its surface — even if the user doesn't say "UX" explicitly.
---

# UX Evaluation: A Layered Index

This skill is an index for evaluating user experience decisions. It is grounded in Jesse James Garrett's *The Elements of User Experience* (2000/2002), extended with modern frontend practice. The framework gives you a place to put any UX question — and a way to tell whether the problem you're seeing is the problem you should be solving.

## Core principle

A product is a stack of decisions. Each layer constrains the layers below it. **Symptoms appear at the bottom; causes usually live higher up.** Most "UX problems" are misdiagnosed as Surface or Skeleton problems when they actually originate at Strategy or Structure. The job of this skill is to help locate any given decision on the correct layer before recommending changes.

## The layered picture

```
Strategy           ─────  why this product, for whom
   │                       (User Needs + Site Objectives)
   ▼
Scope              ─────  what features and content are needed
   │                       (Functional Specs + Content Requirements)
   ▼
Structure          ─────  how it's organized and how users interact
   ├─ Interaction Design  (task-oriented: flows, behavior over time)
   └─ Information Architecture  (info-oriented: structure of the space)
   │
   ▼
Skeleton           ─────  the wireframe layer
   ├─ Interface Design     (controls, forms, state vocabulary)
   ├─ Navigation Design    (wayfinding, menus, links)
   ├─ Information Design   (Tuftean: data presentation)
   ├─ Layout primitives    (Stack, Cluster, Sidebar, Grid — modern)
   └─ Domain components    (composition layer — modern)
   │
   ▼
Surface            ─────  visual treatment
                            (typography, color, design tokens)
```

## Garrett's task / information duality

Garrett's central insight is that the web operates as both a software interface (task-oriented) and a hypertext system (information-oriented). Most UX vocabulary confusion comes from mixing these contexts. The Scope, Structure, and Skeleton planes have different sub-disciplines on each side:

| Plane | Task-oriented (software) | Information-oriented (hypertext) |
|---|---|---|
| Scope | Functional Specifications | Content Requirements |
| Structure | Interaction Design | Information Architecture |
| Skeleton | Interface Design | Navigation Design |

Information Design (Tuftean) sits on Skeleton and applies to both columns. Strategy and Surface are unified across both.

## How to use this skill

When asked to evaluate or reason about a UX, do not jump to surface-level fixes. Work top-down:

1. **Locate the question.** Use the routing table below to identify which layer(s) the question touches. Many real questions cross layers — that's normal, name them all.
2. **Read the relevant reference(s).** Each layer has a dedicated reference file in `references/` with definitions, evaluation questions, common failure modes, and canonical sources.
3. **Diagnose at the right level.** If the symptom is at Surface but the cause is at Structure, say so explicitly. Do not propose a Surface fix for a Structure problem.
4. **Check for misalignment between layers.** Coherence problems are the most common UX issue and often the hardest to name. Use multiple references when reasoning about how two layers do or don't agree.

## Routing table

| If the question is about... | Read |
|---|---|
| Who uses the product, why it exists, business goals, target users, jobs-to-be-done | `references/strategy.md` |
| Which features are needed, what content is required, feature prioritization | `references/scope.md` |
| User flows, task completion, behavior over time, feedback timing, error recovery, "what happens when" | `references/interaction-design.md` |
| Sitemaps, content organization, taxonomies, labeling, findability, navigation hierarchy, "where does X live" | `references/information-architecture.md` |
| Buttons, forms, inputs, controls, state vocabulary (hover/focus/disabled), feedback rendering | `references/interface-design.md` |
| Menus, breadcrumbs, tabs, wayfinding, "how do users move between sections" | `references/navigation-design.md` |
| Tables, charts, dashboards, data presentation, visual hierarchy of information | `references/information-design.md` |
| Layout, spacing, page structure, Stack/Cluster/Sidebar/Grid, responsive composition | `references/layout-primitives.md` |
| Reusable business-meaningful components, design system architecture, atomic design | `references/domain-components.md` |
| Color, typography, spacing values, design tokens, brand expression, "look and feel" | `references/visual-design.md` |

Multi-layer questions are common. "Why is conversion low at the bid step?" might require reading Strategy (is the product positioned to serve the buyer's actual need?), Interaction Design (is the flow clear?), Interface Design (is the action clear?), and Visual Design (does hierarchy point to the action?). When in doubt, read more references rather than fewer.

## Talking about features

"Feature" is the most overloaded word in software, and the overload causes real damage to product conversations. Depending on who's speaking, "a new feature" can mean a strategic move into a new market, a new functional capability, a new section of the IA, a new flow, a new screen, a new component, or a new button. These are different in scope, cost, and risk by orders of magnitude — but the word flattens them, and teams routinely have meetings where speakers are at different altitudes without realizing it.

The framework's resolution is direct: **a feature is a vertical slice through the layers.** A coherent feature has expressions at multiple layers simultaneously. The legible way to talk about a feature is to name what it is at each layer it touches:

- *Strategy* — what user need or business objective does this serve?
- *Scope* — what is the functional capability, in user terms?
- *Structure* — what entities, relationships, states, and flows does it require? (IA: what changes in the information space? IxD: what flow is enabled?)
- *Skeleton* — what controls, screens, layouts, and components express it?
- *Surface* — any new visual treatment, tokens, or motion?

A feature brief structured this way is legible to everyone because every reader can locate the parts of it relevant to their work, and the relationships between layers are explicit. For each layer mentioned in a brief, the corresponding reference file in this skill describes what to evaluate.

**Example.** A generic feature, "users can save items to a personal list":

- *Strategy*: Increases retention by giving users a reason to return; supports re-engagement via reminders. Serves users with multi-session decision processes.
- *Scope*: Users can add items to a saved list, view their list, remove items, and be notified about state changes on saved items.
- *Structure (IA)*: New entity, "saved list," with a one-to-many relationship to items. New top-level navigation entry under the user's account.
- *Structure (IxD)*: New flow: tap save → see confirmation → optional list-naming step. New flow: notification arrives → tap → land on list.
- *Skeleton*: New components: `SaveButton` (Interface Design, with saved/unsaved states), `SavedListPage` layout, `EmptyListState`. Notification rendering uses existing toast pattern.
- *Surface*: No new tokens. Reuses existing icon style and color treatment for active/inactive states.

**Diagnostic uses.**

- *Altitude mismatch.* When a feature conversation is going wrong, check whether the participants are at the same layer. Strategy disagreements masquerade as visual debates; component-level decisions get justified with strategic claims. Naming the layer makes the altitude visible.
- *Gap detection.* A feature with thin coverage at any layer is a feature with a gap. Strategy left blank means the feature isn't anchored in user or business value. Scope left blank means the capability isn't specified. Structure left blank means the IA and flows haven't been thought through. Skeleton left blank means the design isn't done. Surface left blank usually means the existing system absorbs it (often fine).
- *Surface area cascade honesty.* A feature that touches Structure cascades into more Skeleton and Surface than a feature that only touches Skeleton, even when the visible area is the same. More components, more states, more cross-references, more invariants that must stay coherent as the product evolves. Layered briefs make the cascade visible up front rather than letting it surprise you later — when the cost shows up as drift, broken edge cases, or features that quietly contradict each other.
- *Coherence checks.* Features that have clean expressions at every layer they touch tend to feel inevitable when shipped. Features with gaps or contradictions between layers tend to feel awkward or arbitrary. Reading a brief layer by layer surfaces these problems before users do.

**Not every feature touches every layer, and naming that is useful.** A pure rebrand touches Surface, sometimes Skeleton, but rarely Strategy or Scope — calling it a feature can be misleading. A pure strategic pivot may not have immediate Skeleton consequences. A "feature" that only touches Skeleton might actually be a refactor wearing a feature label. The brief's value is partly that empty layers are visible — they invite the question *should this layer be touched, or is it correctly out of scope?*

**The connection back to systematization.** The lower layers (layout primitives, domain components, design tokens) are infrastructure that makes feature slicing cheaper. A team without good Skeleton infrastructure has to reinvent components and layouts for every feature, so the bottom of every slice is expensive. A team with good infrastructure can spend its feature work on the upper layers — Strategy, Scope, Structure — because the bottom is mostly composition. This is why systematizing the lower layers, even when they feel less visible than feature work, has compounding returns: every future feature gets cheaper.

## Cross-cutting concerns

These do not sit on a single plane but apply across the stack. They are not (yet) covered by dedicated references in this skill, but should be considered alongside the layered evaluation:

- **Accessibility (a11y)** — semantic structure, keyboard navigation, screen reader support, color contrast, WCAG conformance. Cuts across Skeleton (semantic markup) and Surface (contrast).
- **Content design / UX writing** — labels, microcopy, error messages, empty states. Cuts across Interaction Design (what to say when), Interface Design (where to say it), and Visual Design (how to render it).
- **Performance** — perceived and actual latency. Cuts across Interaction Design (loading states) and Skeleton (above-the-fold content).

## What this skill is not

- Not a process or methodology — it doesn't tell you when to do user research or how to run a design sprint.
- Not opinionated about specific design systems (Material, Apple HIG, etc.) — those are implementations of the layers, not the layers themselves.
- Not a substitute for actually reading the canonical sources cited in each reference. The references are starting points and evaluation aids, not summaries that replace the originals.
- Not specific to any framework, platform, or tech stack. The framework applies to any digital interface.

## Sources for this skill

- Jesse James Garrett, *The Elements of User Experience*, 30 March 2000 (PDF) and *The Elements of User Experience: User-Centered Design for the Web and Beyond*, New Riders, 2002 / 2010.
- Heydon Pickering and Andy Bell, *Every Layout*, 2020.
- Per-layer canonical sources are listed in each reference file under "Canonical sources."

The framework is Garrett's. The extensions (layout primitives, domain components, design tokens as a system) reflect 25 years of modern practice and are noted as such where they appear.
