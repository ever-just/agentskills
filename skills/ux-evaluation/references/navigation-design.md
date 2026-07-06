# Navigation Design

The information-oriented side of Garrett's Skeleton plane. Navigation Design renders the Information Architecture into the controls users actually interact with to move through the product — menus, tabs, breadcrumbs, links, buttons that route. It is the bridge between IA (which defines what categories exist and how they relate) and the user's lived experience of moving through the product.

## What this layer is

Garrett defines Navigation Design as: *design of interface elements to facilitate the user's movement through the information architecture.*

Navigation Design is sometimes treated as a sub-discipline of IA and sometimes as a sub-discipline of Interface Design. Garrett places it explicitly on the Skeleton plane, paired with Interface Design (task side) and Information Design (Tuftean), all serving the IA decisions made one plane up.

In practice, Navigation Design produces:

- **Primary navigation** — the persistent system that exposes top-level sections.
- **Secondary navigation** — sub-section navigation, often contextual to where the user is.
- **Utility navigation** — account, settings, help, sign out — system-level rather than content-level.
- **Contextual navigation** — links and entry points within content (related items, "see also", inline links).
- **Wayfinding** — breadcrumbs, page titles, current-section indication, back-button behavior.

Rosenfeld and Morville categorize navigation systems as **embedded** (part of the page itself: global, local, contextual nav) and **supplemental** (sitemap, index, search, guides). Navigation Design covers both.

## Where it sits

Skeleton plane, information-oriented column. Above it: Information Architecture (Structure) — which it directly expresses. To its left (task-oriented sibling): Interface Design. Below it: Visual Design (Surface).

A common misconception is that "navigation" is a single component. In practice, every product has multiple navigation systems operating simultaneously, and Navigation Design covers their orchestration.

## What to evaluate

**Primary navigation:**
- Are top-level destinations identifiable from labels alone, without context?
- Is the number of top-level items reasonable? (5-7 is a frequently cited heuristic; more becomes a scanability problem.)
- Is there a clear current-state indicator? (Which section am I in?)
- Does the primary nav stay consistent across the product, or change unpredictably?

**Wayfinding:**
- Can the user always answer "where am I?" from the page itself?
- Are breadcrumbs present where hierarchy is deep? Do they reflect actual hierarchy, or just visit history?
- Does the page title correspond to the navigation label?
- Is the current section visually marked in the navigation?

**Information scent (Pirolli/Card):**
- Do navigation labels give enough information to predict what's behind them?
- Will users understand the category from the label, or do they have to click and check?
- Are categories distinct enough that the user can confidently choose?

**Multiple paths:**
- Can the user reach a given destination from more than one place?
- Are related items linked from one another, or is each piece of content an island?
- For deep content, is there a path back? (Sometimes the most-used navigation is the back button — design with that in mind.)

**Mobile / responsive:**
- How does the primary navigation collapse on small screens? (Hamburger, tab bar, drawer, accordion.)
- Are critical actions still reachable, or buried?
- Does the mobile pattern match user expectations on the platform?

**Search as navigation:**
- For products with large content volumes, is search treated as a primary navigation path or an afterthought?
- Are search results well-organized and scannable?
- Does search support the user's actual mental model? (Synonyms, fuzzy match, scoped search?)

**Multi-role navigation:**
- If different user types see different navigation, are role boundaries clear?
- For users who occupy multiple roles, can they switch contexts cleanly?

## Common failure modes

- **Navigation that doesn't match the IA.** The IA has 12 sections; the nav shows 6 with the others buried. Or the IA hierarchy is 3 levels deep but the nav is flat.
- **Inconsistent navigation across screens.** The primary nav appears differently in different parts of the product, or disappears entirely on some pages.
- **No current-state indication.** The user can't tell from the navigation which section they're in. They navigate by guess.
- **Hamburger menus hiding everything.** Mobile navigation that buries primary destinations behind a single icon. Click-to-discover is slower than visible labels.
- **Navigation as marketing.** Labels chosen for branding ("Discover," "Inspire," "Grow") instead of clarity. Users can't predict what's behind them.
- **Too many navigation systems.** Primary nav, secondary nav, tabs, sub-tabs, breadcrumbs, contextual links — all visible at once. Overwhelms the user and dilutes information scent.
- **Dead-end pages.** Content reachable only via direct link, with no path back into the main IA.
- **Search as the only path.** Forcing users to search because the IA isn't browsable. Works for sites with stable, named content; fails for exploratory contexts.
- **Mobile and desktop nav as parallel inventions.** Two unrelated systems instead of one system that adapts. Maintenance and consistency both suffer.

## What gets confused with Navigation Design

- **The IA itself** is one plane up (Structure). IA decides categories; Navigation Design decides how they're rendered as controls.
- **The visual styling of nav components** is Visual Design (Surface). Navigation Design covers structure and behavior; Visual Design covers appearance.
- **Routing and URL structure** are technical expressions of IA, not Navigation Design — though clean URL structure supports navigation by giving users predictable, shareable, hackable paths.
- **Search functionality** is sometimes considered separately. Garrett treats it as Information Architecture-adjacent. The search interface is Interface Design; the search results presentation is Information Design.

## Canonical sources

- Jesse James Garrett, *The Elements of User Experience* (2000/2002).
- Louis Rosenfeld, Peter Morville, Jorge Arango, *Information Architecture: For the Web and Beyond* (4th ed., 2015) — extensive coverage of navigation systems and patterns.
- Steve Krug, *Don't Make Me Think* (2000/2014) — chapters on navigation are foundational and accessible.
- James Kalbach, *Designing Web Navigation* (2007) — the canonical book-length treatment of the discipline.
- Peter Morville and Jeffery Callender, *Search Patterns* (2010) — search-as-navigation in depth.
- Peter Pirolli and Stuart Card, *Information Foraging Theory* (2007) — academic foundation for the "information scent" concept.

## Diagnostic prompt

When evaluating a product at the Navigation Design layer, drop yourself onto a random page and answer three questions without scrolling: *Where am I? What can I do here? Where can I go next?* If any answer is unclear, navigation is failing at that location. Then trace the path from the home/landing page to a piece of deep content. If it requires more than three clicks for a primary task, the navigation hierarchy is probably misaligned with use frequency.
