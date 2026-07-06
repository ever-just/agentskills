# Domain Components

A modern extension to Garrett's Skeleton plane. Domain components are reusable, business-meaningful UI components — things like `ListingCard`, `OrderSummary`, `UserProfileBadge`, `BidRow`. They are *compositions* built from layout primitives, form elements, and design tokens, named in the vocabulary of the product's domain. They are simultaneously the most visible part of a design system (because they are what users see) and the layer most coupled to upstream planes (because their existence and naming reflect Strategy and Structure).

## What this layer is

A domain component is a UI component whose name corresponds to an entity, relationship, or action in the product's domain rather than to a generic interface element. `Button` is generic. `PrimaryActionButton` is generic. `PlaceBidButton` is a domain component — it exists because the product is an auction marketplace where placing bids is a primitive action.

Domain components encapsulate:

- **Composition** — they're built from layout primitives, Interface Design elements, and tokens.
- **Domain semantics** — their props correspond to domain entities (`<ListingCard listing={listing} />`).
- **Behavior** — they may include domain-specific interactions (a `BidRow` knows what a bid is and may include the place-counter-bid action).
- **States** — domain components have states that map to domain conditions (a listing can be "active," "reserve not met," "ended," "sold").

## Where it sits

Bottom of the Skeleton plane, above Surface. Domain components depend on:

- **Layout primitives** for spatial structure.
- **Interface Design elements** (buttons, inputs) for interaction.
- **Information Design conventions** for data presentation.
- **Design tokens** (Surface) for visual consistency.

And they express:

- **Strategy decisions** (the entities that exist).
- **Scope decisions** (the features they implement).
- **Structure decisions** (the IA they navigate, the IxD flows they participate in).

Because they're at the convergence point of the entire stack, domain components are the canonical place where misalignment between layers becomes visible. A messy domain component layer is usually a symptom of upstream incoherence.

## What to evaluate

**Naming:**
- Do component names use the product's domain vocabulary, or generic UI terms? (`ListingCard` vs. `Card`.)
- Does the team and the design file agree on names? Naming drift between Figma and code is a common source of friction.
- Is naming consistent? `Listing`, `Auction`, `Lot`, `Item` for the same concept signals upstream IA inconsistency.

**Composition vs. duplication:**
- Are similar UI patterns expressed as one component with variants, or as multiple near-copies? (Three different `ProductCard` implementations is a signal.)
- Do domain components compose layout primitives, or do they reimplement layout from scratch each time?
- When new screens need similar UI, is it built from existing components or freshly authored?

**Props as domain contracts:**
- Do component props correspond to domain attributes? (`<ListingCard listing={listing} />` rather than `<ListingCard title="..." subtitle="..." imageUrl="..." />`.)
- Are required vs. optional props clear? Are they typed?
- Does the component handle missing or partial data gracefully? (Loading states, empty states, error states.)

**State coverage:**
- Does the component handle all the domain states the entity can be in? (For a listing: draft, active, ended, sold, withdrawn, etc.)
- Is each state visually distinct? (Color, badge, layout difference.)
- Are illegal state combinations prevented? (You can't be both "draft" and "sold.")

**Slot architecture:**
- Does the component allow composition through slots/children, or is it monolithic?
- Are slots documented? Are sensible defaults provided?
- Can the component be extended for new variants without breaking existing usages?

**Coupling:**
- Are domain components tightly coupled to specific data sources? (Direct API calls inside the component is usually a smell.)
- Or are they pure presentation, taking data as props and emitting events?
- Does each component have a single responsibility, or does it accumulate features over time?

## Common failure modes

- **Generic naming, lost domain.** Every component called `Card`, `List`, `Item`. The design system is generic but the product loses domain expression. Maintenance becomes harder because no name signals what something does.
- **Bespoke per-screen components.** No reuse. Each screen reinvents components with slight variations. Total surface area grows linearly with screen count.
- **God components.** One component handling every variant via a flag soup. `<Card variant="listing" mode="grid" size="compact" hasActions={true} showImage={false} ... />`. The complexity moves from screen to component but doesn't decrease.
- **Vocabulary drift.** Code uses `listing`; Figma uses `lot`; PMs use `item`. Same thing, three names. Translation overhead grows.
- **Domain components built before primitives.** The team starts with `ListingCard` and discovers they need to refactor when they realize different cards need different layouts. Should have built primitives first.
- **State coverage gaps.** Components handle the "happy" states the designer thought of; production reveals 5+ more (loading, error, empty, partially-loaded, network-failed, permission-denied).
- **Tight coupling to backend shape.** Component props mirror API response shape. When the API changes, every component using it has to change.
- **No catalog or storybook.** Components exist in code but aren't browseable. Developers don't know what exists, so they build new instead of reusing.

## What gets confused with domain components

- **Layout primitives** are the substrate. Stack, Grid, Sidebar are primitives. ListingCard is a domain component built from primitives.
- **Interface Design elements** (Button, Input, Select) are generic UI components, sometimes called "atoms" in atomic design vocabulary. Domain components compose these into domain-meaningful units.
- **Pages or templates** (ListingDetailPage, CheckoutFlow) are higher-level compositions of domain components. Sometimes worth treating as their own layer; sometimes just considered the "molecule/organism" levels in atomic design.
- **Design system components** is the broadest term — includes both generic UI components and domain components. The distinction matters because their evaluation criteria differ.

## Atomic Design and the broader vocabulary

Brad Frost's *Atomic Design* (2016) is the most cited modern framework for thinking about UI component hierarchy. Frost proposes five levels:

1. **Atoms** — basic HTML elements (button, input, label).
2. **Molecules** — simple groups of atoms (search form: label + input + button).
3. **Organisms** — complex compositions (header, product grid).
4. **Templates** — page-level layouts with placeholder content.
5. **Pages** — templates with real content.

Domain components in this vocabulary span molecules, organisms, and sometimes templates. Atoms and templates are mostly concerned with structure, not domain meaning; domain components are where the product's vocabulary lives.

The distinction between "domain component" and "organism" is not standardized — different teams draw the line differently. What matters is consistency within a project.

## Canonical sources

- Brad Frost, *Atomic Design* (2016) — the canonical text for component hierarchy. Free online at https://atomicdesign.bradfrost.com/.
- *Refactoring UI* (Wathan & Schoger, 2018) — applied component composition.
- The published design system documentation of mature systems is itself canonical reference material:
  - *Material Design* (Google).
  - *Human Interface Guidelines* (Apple).
  - *Polaris* (Shopify) — particularly clear in its component vocabulary.
  - *Lightning Design System* (Salesforce) — an early popularizer of "design tokens" terminology.
  - *Carbon* (IBM) — extensive enterprise-oriented component documentation.
- Alla Kholmatova, *Design Systems* (Smashing Magazine, 2017) — covers domain language and component vocabulary in design systems.
- Diana Mounter and others at GitHub, Asana, Stripe, Linear — public talks and blog posts on building production design systems. No single canonical source; the literature is distributed across conference talks and engineering blogs.

## Diagnostic prompt

When evaluating a product at the domain component layer, list every reusable UI component in the system. Then ask: *do these names tell me what the product is about? Could a new team member infer the domain from the component names alone?* If the components are all generic (Card, List, Item), the product's domain is invisible in the system. Then check: *for each domain entity, is there a canonical component? For each component, is there a single source of truth?* If similar components are duplicated across the product, the system is failing to reuse, which means upstream layers (Strategy/IA) likely lack the consistency that makes reuse possible.
