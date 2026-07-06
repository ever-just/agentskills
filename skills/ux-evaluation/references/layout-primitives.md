# Layout Primitives

A modern extension to Garrett's Skeleton plane, established by Heydon Pickering and Andy Bell's *Every Layout* (2020). Layout primitives are a small set of composable, axiomatic components that handle the spatial relationships in interface layout. They sit at the bottom of the Skeleton plane, beneath Interface Design, Navigation Design, and Information Design — they're the spatial substrate all three compile down to.

## What this layer is

A layout primitive is a component that expresses a single, irreducible spatial relationship. It does not represent any specific content; it represents *how content is arranged*. The canonical set, from *Every Layout*:

- **Stack** — vertical rhythm. Children stacked with consistent space between them.
- **Cluster** — horizontal grouping that wraps. For tags, button groups, breadcrumbs.
- **Sidebar** — two elements where one has a fixed/intrinsic width and the other takes the rest.
- **Switcher** — children sit horizontally until they'd be too narrow, then switch to vertical. All-or-nothing.
- **Cover** — vertically centered content with optional header/footer, fills available height.
- **Grid** — auto-fit/minmax CSS grid, so children flow into as many columns as fit.
- **Frame** — aspect-ratio container.
- **Center** — horizontally centered with max-width.
- **Box** — padding, background, border (sometimes considered too primitive to count).

The principle behind the set: there are only so many fundamental spatial relationships in 2D space with flow content. Most interface layouts are compositions of these primitives, applied recursively. A page is a Stack of Sidebars containing Stacks of Clusters.

## Where it sits

Skeleton plane, beneath the three Garrett-named sub-disciplines. Layout primitives don't appear in Garrett's 2000 framework because the discipline didn't exist yet — in 2000, layout was done per-page using HTML tables or float-based CSS, and the idea of a reusable, named layout system hadn't crystallized. CSS Flexbox arrived in 2009, CSS Grid in 2017, and *Every Layout* synthesized the practice in 2020.

Layout primitives serve all three Skeleton sub-disciplines:
- A form layout (Interface Design) is typically a Stack of fields, each a Sidebar of label-and-input.
- A nav bar (Navigation Design) is typically a Cluster of links.
- A data dashboard (Information Design) is typically a Grid of metric cards or a Stack of tables.

## What to evaluate

**Identification:**
- Is there an explicit, named set of layout primitives in the design system? Or is layout done ad-hoc per screen?
- If primitives exist, how many are there? Five to seven is typical; thirty suggests over-decomposition.
- Are the primitives axiomatic — irreducible spatial relationships — or are they actually domain components in disguise? ("ProductCardLayout" isn't a primitive; "Stack" is.)

**Composition:**
- Are layouts built by composing primitives, or by writing bespoke CSS per screen?
- Can you describe any screen's layout as a tree of primitives?
- Is there consistent primitive usage across the product, or do similar layouts use different mechanisms?

**Token integration:**
- Do primitives accept design tokens for spacing, not raw values? (`<Stack space="4">` not `<Stack space="16px">`.)
- Is the spacing scale consistent across primitives?
- Can a token change ripple through the entire layout system?

**Responsive behavior:**
- Do primitives adapt to context using container queries or intrinsic sizing, or do they rely on viewport media queries?
- Is responsive behavior baked into the primitive (Switcher, Grid, Sidebar all do this), or layered on as a separate concern?

**Accessibility:**
- Do primitives respect logical reading order (DOM order matches visual order)?
- Are primitives compatible with semantic HTML? (A Stack should accept `<article>`, `<section>`, `<ul>` as children.)
- Do primitives avoid breaking focus order or assistive technology navigation?

## Common failure modes

- **No primitives, just bespoke CSS.** Every screen has its own layout written from scratch. Spacing is inconsistent because it's encoded in 47 different places. Refactoring is expensive.
- **Too many primitives.** A "primitive" library that includes specific page templates, hero sections, card grids. These are compositions, not primitives. The library bloats and primitives lose their generic power.
- **Primitives with hardcoded values.** `<Stack>` with a fixed 16px gap. Loses the connection to the spacing scale. Can't be themed or rescaled.
- **Primitives that are actually wrappers around media queries.** Defeating the purpose — the primitive should encode the spatial relationship intrinsically, not delegate to viewport-width logic.
- **Primitives that don't compose.** Wrapping one primitive in another breaks. Children have to be specific elements. The system is rigid where it should be flexible.
- **Primitive set built top-down without use cases.** Library inspired by another design system, applied without checking whether the project's actual layouts need them.
- **Domain-specific primitives.** "ListingLayout" or "DashboardLayout" exist as primitives. These should be domain components built *out of* primitives.

## What gets confused with layout primitives

- **Domain components** (ProductCard, ListingRow, OrderSummary) are compositions of primitives, not primitives themselves. The test: can this be used in three completely unrelated contexts? Stack passes; ListingCard fails.
- **Page templates** (TwoColumnPage, DashboardLayout) are higher-level compositions, sometimes worth standardizing but not primitives.
- **Design tokens** (spacing, color, type) are inputs to primitives, not primitives themselves.
- **CSS frameworks** (Tailwind, Bootstrap) provide raw utilities and patterns; primitives are a layer above utilities.

## Canonical sources

- Heydon Pickering and Andy Bell, *Every Layout* (2020) — the canonical book and website. Establishes the primitive set and the underlying principles. Available at https://every-layout.dev/.
- Heydon Pickering, *Inclusive Components* (2017) — predecessor; covers component patterns with strong accessibility focus.
- *Refactoring UI* (Wathan & Schoger, 2018) — covers layout principles in an applied, engineer-oriented register; complementary to Every Layout.
- *CSS for JavaScript Developers* (Josh Comeau) — modern CSS layout treatment.
- *A Complete Guide to CSS Grid* and *A Complete Guide to Flexbox* (CSS-Tricks) — reference material for the underlying CSS primitives.

The W3C specs themselves (CSS Flexbox, CSS Grid Layout) are the technical substrate. Reading them is occasionally useful for deep questions but not necessary for applied use.

## Diagnostic prompt

When evaluating a product at the layout primitive layer, pick a representative screen and ask: *can I describe this layout as a tree of named, generic spatial relationships?* If yes, primitives are working. If you find yourself reaching for "the listing-detail page header layout" as a label, the layout is bespoke at that point. Then ask: *if I wanted to change the spacing scale, how many places would I have to touch?* If the answer isn't "one," the primitive system isn't yet doing its job.
