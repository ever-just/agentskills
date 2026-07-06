# Visual Design

The Surface plane in Garrett's framework — the most concrete layer, where every decision above becomes visible. Visual Design is what laypeople usually mean by "design," but in Garrett's framework it is one stratum among many. A beautifully styled product with broken Strategy is still broken. A homely product with sound everything-else is functional. That said, Visual Design is not optional — it carries enormous weight for trust, brand, and emotional response.

## What this layer is

Garrett gives Visual Design two definitions, one for each side of the task / information duality:

- On the task-oriented side: *graphic treatment of interface elements (the "look" in "look-and-feel").*
- On the information-oriented side: *visual treatment of text, graphic page elements and navigational components.*

In practice, Visual Design at the system level produces:

- **Color system** — palette, semantic mapping (success, warning, error, info), contrast pairs.
- **Typography system** — typeface(s), scale, weight, line height, letter spacing.
- **Spacing system** — the modular scale of distances (typically 4px or 8px based, geometric or linear progression).
- **Iconography** — icon set, sizing rules, optical alignment conventions.
- **Elevation, depth, surfaces** — shadow rules, border conventions, layer hierarchy.
- **Motion** — easing curves, durations, transition conventions.
- **Imagery treatment** — photography style, illustration style, aspect ratio conventions.
- **Design tokens** — the systematized encoding of all of the above as named, referenceable values.

## Where it sits

Bottom of the framework. Above it: Skeleton (which it gives visual form to). Below it: implementation.

Design tokens deserve special attention because they are not purely Surface — they are the *system* by which Surface decisions are propagated through Skeleton. The token *values* are Surface decisions; the token *system* is Skeleton infrastructure. Tokens are the bridge.

The term "design tokens" was popularized by Salesforce around 2014-2016 (notably Jina Anne's work on the Lightning Design System). The concept extends earlier ideas from the Sass community (variables) and predates that in graphic design (style guides).

## What to evaluate

**Color:**
- Is there a defined palette? How many colors total? (More than 12 in primary use is usually too many.)
- Are colors mapped to semantic meaning (primary, secondary, success, warning, error, info), not just to hue?
- Do all foreground/background pairings meet WCAG contrast minimums (4.5:1 for body text, 3:1 for large text)? AAA (7:1) is stricter and not always required.
- Is color used as the *only* signal for any meaning? (Should not be — color blindness, mode switching, monochrome printing all break this.)
- Does the palette work in dark mode if dark mode is supported?

**Typography:**
- Are typefaces chosen with intent, or defaulted to system fonts?
- Is there a defined type scale (e.g., 12, 14, 16, 18, 20, 24, 32, 48px)? Is it followed?
- Are font weights consistent? (Most products need 2-3 weights; using 6 is usually accidental.)
- Is line-height appropriate for body text (typically 1.5-1.7) and tighter for headings (1.1-1.3)?
- Is type used as a hierarchy tool, or do all sizes feel similar?

**Spacing:**
- Is there a defined spacing scale? (4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px is a common modular scale.)
- Is the scale used consistently, or do bespoke values appear (`margin-top: 13px`)?
- Does the spacing scale relate to the type scale? (Vertical rhythm — line height and spacing should harmonize.)

**Tokens:**
- Are design decisions encoded as named tokens (`color-primary`, `space-4`, `radius-md`), or as raw values?
- Are tokens referenced by name throughout the codebase, or are values inlined?
- Is there a single source of truth for token values, accessible to both design (Figma) and code?
- When a token changes, does the change propagate consistently?
- Are semantic tokens distinguished from primitive tokens? (`color-text-primary` references `color-gray-900`, not the other way around.)

**Brand expression:**
- Does the visual design have a distinct character, or does it default to generic "AI-design" or "SaaS template" aesthetics?
- Is the brand expressed consistently across screens, or only on the marketing site?
- Does the visual treatment match the product's tone? (A serious financial tool shouldn't look like a consumer app, and vice versa.)

**Consistency:**
- Are similar elements treated visually similarly? (Buttons of the same kind look the same everywhere.)
- Are there visual outliers — screens or components that don't fit the system?
- Is dark mode (if supported) a reskin of light mode, or its own coherent system?

**Accessibility:**
- WCAG color contrast on all text and meaningful UI elements.
- No color-only signals.
- Sufficient text sizing and zoom support.
- Motion reduced or disabled for users with `prefers-reduced-motion`.

## Common failure modes

- **No system, just decisions.** Every screen has its own color and spacing choices. The product looks "designed" individually but inconsistent in aggregate.
- **Tokens that don't actually drive anything.** The token document exists but components hardcode values anyway. Changing the token has no effect.
- **Too many colors and weights.** "Branding palette" with 30 colors, 6 font weights. Decision fatigue for designers; visual noise for users.
- **Bespoke values everywhere.** `padding: 13px`, `margin: 17px`, `font-size: 15px`. The presence of off-scale values is a fast signal that the system isn't being followed.
- **Spacing that doesn't reinforce hierarchy.** Equal spacing between unrelated and related elements. The eye can't see groupings.
- **Generic-AI aesthetic.** Inter, gray text on white, purple gradients, identical to ten thousand SaaS landing pages. Visually invisible; nothing distinct to remember.
- **Type hierarchy lost.** Most text is the same size and weight, so nothing draws the eye, or everything draws the eye equally.
- **Dark mode added late.** Hardcoded colors break, contrast issues appear, the system shows its bones.
- **Brand and product diverge.** The marketing site is bold and expressive; the product is bland and templated. Users feel a disconnect.
- **Decorative motion.** Animations that delay user actions or distract from primary tasks. Motion should serve interaction, not adorn it.

## What gets confused with Visual Design

- **Layout** is Skeleton, not Surface. Visual Design colors and types the layout, but doesn't decide whether it's a Stack or a Grid.
- **Interaction behavior** is IxD or Interface Design. Visual Design renders the states; it doesn't decide what states exist.
- **Content** is content design. Visual Design renders text; it doesn't write it.
- **Brand identity** in the broader sense (logo, voice, story) is upstream of Visual Design. Visual Design is one expression of brand identity inside the product.
- **Animation as choreography** is a design discipline of its own; Visual Design covers the conventions (durations, easing) but specific animated sequences are a separate craft.

## Canonical sources

- Jesse James Garrett, *The Elements of User Experience* (2000/2002).
- Robert Bringhurst, *The Elements of Typographic Style* (4th ed., 2012) — foundational typography text. Detailed and opinionated.
- Ellen Lupton, *Thinking with Type* (2nd ed., 2010) — accessible typography for screen and print.
- Josef Müller-Brockmann, *Grid Systems in Graphic Design* (1981) — Swiss-style grid theory; predates the web but applicable.
- Adam Wathan and Steve Schoger, *Refactoring UI* (2018) — modern, applied visual design rules for engineers. High leverage for non-designers.
- Karen Kao and Aubrey Lewis, *Design Tokens W3C Community Group* — emerging standards for token interchange.
- Jina Anne's writing and talks on design tokens and design systems (search for "design tokens" + "Jina Anne").
- *Material Design* (Google) and *Human Interface Guidelines* (Apple) — large reference systems with detailed Visual Design rationale.
- Massimo Vignelli, *The Vignelli Canon* (2010) — concise principles from a 20th-century design master.
- *Practical Typography* by Matthew Butterick (online) — opinionated and practical.

## Diagnostic prompt

When evaluating a product at the Visual Design layer, take a screenshot of three different screens and put them side by side. Ask: *do these clearly belong to the same product? Is the visual hierarchy guiding my eye consistently? Could I extract a coherent token set from these screens, or are values arbitrary?* Then ask: *if I covered the brand mark, could I recognize this as a particular product, or could it be any SaaS app?* Generic answers signal a Surface that isn't doing its job — failing both as system and as expression.
