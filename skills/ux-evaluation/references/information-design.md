# Information Design

The "Tuftean" plane in Garrett's framework — Information Design in the sense established by Edward Tufte's body of work: the design of the *presentation* of information to facilitate understanding. It is distinct from Information *Architecture* (Structure plane), which organizes information so it can be found. Information Design takes information that has already been found and renders it so it can be understood, compared, and acted on.

## What this layer is

Garrett defines Information Design as: *in the Tuftean sense: designing the presentation of information to facilitate understanding.*

The "Tuftean" reference points to Edward Tufte's series of books — *The Visual Display of Quantitative Information*, *Envisioning Information*, *Visual Explanations*, *Beautiful Evidence* — which established the modern discipline. Tufte's central principle: *show the data*. Maximize the data-ink ratio. Eliminate non-data elements (chartjunk). Use small multiples. Layer information so the user can read at multiple levels of detail.

In practice, Information Design at the system level produces:

- **Tables and lists** — for tabular data, the dominant Information Design surface in business software.
- **Charts and visualizations** — for quantitative comparison and trend recognition.
- **Dashboards** — composite views combining multiple visualizations.
- **Hierarchy and emphasis** — typographic and spatial conventions that guide the eye through complex information.
- **Density management** — handling large amounts of information without overwhelming the user.

## Where it sits

Skeleton plane. Garrett places Information Design serving *both* the task-oriented and information-oriented columns — it is the only Skeleton sub-discipline that bridges the duality. Above it: Structure plane decisions about what information needs to be presented. Below it: Visual Design (Surface) for the typographic and color rendering.

For data-heavy products (B2B applications, dashboards, marketplaces, analytics tools), Information Design is often the highest-leverage Skeleton sub-discipline — more than Interface Design, because the product's job is largely to *present information* so users can act.

## What to evaluate

**Tables and lists:**
- Does each table column have a clear, scannable header?
- Are columns ordered by importance? Most-important left for left-to-right reading.
- Is row density appropriate? Too tight is hard to read; too loose wastes space.
- Are numbers right-aligned (for column comparison) and text left-aligned?
- Are units in the column header, not repeated in every cell?
- Is sorting available where comparison matters? Default sort meaningful?
- Are empty states designed? (No results, filtered to nothing, first-time use.)

**Charts and visualizations:**
- Is the right chart type used? (Line for trends over time, bar for category comparison, scatter for correlation, etc.)
- Are axes labeled, scaled honestly, and starting from zero where appropriate? (Truncated y-axes mislead.)
- Is the data the focus, or do the chart's decorative elements (gridlines, borders, 3D effects, gradients) compete for attention? (Tufte: chartjunk.)
- Are comparisons made easy? (Direct adjacency, consistent scales, small multiples.)
- For dashboards, do multiple visualizations share a coherent grid and visual language?

**Hierarchy:**
- Can the eye find the most important number, fact, or status within one second?
- Does typographic hierarchy reflect informational hierarchy? (The most important thing is largest/heaviest, not just the headline.)
- Is contrast used to separate primary from secondary information?
- Does the layout's reading order match the user's information-seeking order?

**Density and progressive disclosure:**
- Is all the information visible at once, or layered? (Tufte advocates layering — overview at first glance, details on demand.)
- Are summaries available alongside details? (Sparklines in tables, totals at the foot, rollups at the top.)
- Can the user filter, sort, or search to manage volume?
- For very dense screens (admin panels, trading interfaces), is the density justified by the user's task and expertise?

**Honesty:**
- Does the presentation accurately represent the data? (No misleading scales, cherry-picked time ranges, manipulated comparisons.)
- Are uncertainty and missing data shown? (Confidence intervals, "no data" markers, distinct from zero.)
- Are derived metrics defined? (What does "engagement score" mean? Is the formula visible?)

## Common failure modes

- **Chartjunk (Tufte's term).** Decorative elements that don't carry data: 3D effects on bar charts, gradient fills, drop shadows, rainbow colors used to distinguish categories that have no inherent ordering.
- **Wrong chart type.** Pie charts with too many slices. Line charts for non-temporal data. 3D charts that distort comparison.
- **Misleading scales.** Truncated y-axes that exaggerate small changes. Inconsistent scales across small multiples that look comparable but aren't.
- **Tables as paragraphs.** All columns left-aligned regardless of content. No visual rhythm to support row scanning.
- **Dashboard sprawl.** Every metric anyone has ever asked for, all on one screen, none prioritized. The user has to do their own information design.
- **Missing empty/loading/error states.** The table works for the demo data; on first use it's a blank rectangle.
- **No information hierarchy on the screen.** Every element treated as equally important. The eye has nowhere to start.
- **Density without legibility.** Cramped layouts that look "professional" because they fit a lot of information, but require effort to read.
- **Information design owned by no one.** In small teams especially, dashboards and tables get built by whoever needs them, with no consistent system. Each one reinvents conventions.

## What gets confused with Information Design

- **Information Architecture** is the Structure-plane sibling. IA organizes content for findability; Information Design presents content for understanding. A well-organized site with poorly designed tables fails at Information Design; a beautifully designed dashboard with no clear IA hierarchy fails at IA.
- **Visualization aesthetics** are Surface concerns. Information Design decides what to show and how to structure it; Visual Design decides the colors, type, and finish.
- **Data engineering** (how data is collected, transformed, stored) is upstream of Information Design and out of scope here.
- **Generic "information graphics" or infographics** as a marketing genre often violate Information Design principles (Tufte is harsh on most infographics). Don't conflate.

## Canonical sources

- Edward Tufte:
  - *The Visual Display of Quantitative Information* (1983/2001) — the foundational text. Most cited.
  - *Envisioning Information* (1990).
  - *Visual Explanations* (1997).
  - *Beautiful Evidence* (2006).
  Tufte's books are themselves examples of Information Design and worth studying as artifacts.
- Stephen Few:
  - *Show Me the Numbers* (2nd ed., 2012) — practical table and chart design.
  - *Information Dashboard Design* (2nd ed., 2013) — dashboards specifically.
- William Cleveland, *The Elements of Graphing Data* (1985) — empirical foundations of perception in chart design.
- Alberto Cairo, *The Functional Art* (2012) and *The Truthful Art* (2016) — modern, accessible information design treatment.
- Cole Nussbaumer Knaflic, *Storytelling with Data* (2015) — applied information design for business contexts.
- Giorgia Lupi and Stefanie Posavec, *Dear Data* (2016) — information design as personal expression; useful as a counterpoint to Tufte's austerity.

## Diagnostic prompt

When evaluating a product at the Information Design layer, look at the most data-dense screen and ask: *what is the user supposed to learn or do with this information? Can I find the relevant fact within three seconds? Is the comparison the data implies easy to make?* If the answer to any of these is no, the screen is presenting information rather than facilitating understanding — the Tuftean failure mode.
