# Information Architecture

The information-oriented side of Garrett's Structure plane. Information Architecture (IA) is the discipline of organizing the content and conceptual structure of a product so that users can find, understand, and act on it. IA decisions are usually invisible when right and unmissably wrong when wrong — users don't praise IA, they only complain about its absence.

## What this layer is

Garrett defines Information Architecture as: *structural design of the information space to facilitate intuitive access to content.*

The discipline is older than the web. Modern IA traces to library science and information science traditions, with the foundational text being *Information Architecture for the World Wide Web* by Rosenfeld, Morville, and (later) Arango — informally "the polar bear book." The Information Architecture Institute and the IA Summit (now World IA Day) have served as the discipline's organizing forums.

IA covers four interlocking systems, per Rosenfeld/Morville:

1. **Organization systems** — how content is grouped (by topic, audience, task, chronology, alphabet, etc.).
2. **Labeling systems** — what we call things (terminology, taxonomy, vocabulary).
3. **Navigation systems** — how users move through the structure (covered separately in `navigation-design.md`).
4. **Searching systems** — how users locate specific items.

## Where it sits

Structure plane, information-oriented column. Above it: Scope (what content the product needs). Below it: Skeleton's Navigation Design (how the IA renders as menus and nav). To its left (task-oriented sibling): Interaction Design.

IA is upstream of every page in the product. The sitemap, the URL structure, the relationship between entities — all expressions of IA decisions.

## What to evaluate

**Object model (the conceptual layer):**
- What are the major entities in the system? (e.g., for a marketplace: listings, buyers, sellers, transactions, reviews.)
- For each entity, what attributes does it have? What relationships does it have to other entities?
- Does the object model correspond to the user's mental model, or does it impose the database's structure on the user?

**Organization:**
- How is content grouped at the top level? By type, audience, task, time, status?
- Is there one organizing principle, or several layered? Layered is normal; conflicting is a problem.
- Does the structure scale? What happens when there are 10x more items?
- Are there orphaned items (content that doesn't belong to any clear category)?

**Labeling and taxonomy:**
- Are labels consistent across the product? ("Sign in" vs "Log in" used interchangeably is a smell.)
- Do labels match user vocabulary, or are they internal jargon?
- Is the taxonomy explicit and documented, or implicit and inconsistent?
- For each label, is it specific enough to be unambiguous, but not so specific that it excludes valid items?

**Findability:**
- For any piece of content, how many paths lead to it? (Browse, search, direct link, related items.)
- Can a user predict where to find something they haven't seen before?
- Are there dead ends — content the user can't get back to once they leave?
- Does the URL structure reflect the IA? Clean URLs are IA documentation.

**Multi-role and multi-context:**
- If different user types see different content, is the partitioning clear and consistent?
- Are role-specific labels appropriate for each role?
- For shared content visible to multiple roles, does the IA accommodate role-specific framing?

## Common failure modes

- **IA derived from the database schema.** The structure of storage gets exposed as the structure of navigation. Users see "Customer Master Records" because that's what the table is called.
- **Department-driven IA.** The organization chart of the company becomes the navigation of the product. Sales-related things in the Sales section regardless of what users want to do.
- **Inconsistent vocabulary.** Listing, lot, item, vehicle, asset — all referring to the same thing in different parts of the product. Confuses users; bloats search; breaks mental models.
- **Over-categorization.** Too many top-level sections, too deep a hierarchy, "Other" or "Misc" categories. Hick's Law applies: more options means slower decisions.
- **Under-categorization.** Everything in one flat list. Works for a small product, fails as the product grows.
- **Unstable IA.** Categories and labels change frequently. Users (and search engines) lose their bearings. URL changes that break bookmarks.
- **No object model.** The product has pages and views but no explicit conception of what entities exist. Resulting structure is reactive — features bolt on wherever convenient.
- **IA invisible to the team.** Lives in someone's head, in a Figma file, in URL conventions, but nowhere as a single canonical artifact. Decisions about structure get made without reference to a coherent model.

## What gets confused with Information Architecture

- **Navigation menus** are Navigation Design (Skeleton). IA decides what categories exist; Navigation Design decides whether they appear in a sidebar, a top bar, a hamburger menu.
- **Search functionality** can be considered IA-adjacent (the searching system per Rosenfeld/Morville) but the search UI itself is Interface Design.
- **Visual hierarchy** is a Skeleton/Surface concern, not IA. IA answers *what's where*; visual hierarchy answers *what catches the eye first*.
- **Database design** is the technical sibling of the object model but is concerned with storage and integrity, not user-facing structure. The two should agree but are different artifacts.

## IA artifacts (where IA gets documented)

- **Sitemap** — tree of all sections and pages.
- **Object model / domain model** — entities and relationships in the system.
- **User flows** — paths through the IA for specific tasks (also IxD).
- **Wireframes** — IA expressed spatially per screen.
- **Content matrix** — spreadsheet of every content type with attributes, source, lifecycle, ownership.
- **Taxonomy / glossary** — authoritative vocabulary.
- **URL structure** — IA encoded in routes.

These can live in any tool: Figma, Whimsical, plain Markdown. The artifact matters less than the discipline of having a single source of truth.

## Canonical sources

- Jesse James Garrett, *The Elements of User Experience* (2000/2002).
- Louis Rosenfeld, Peter Morville, Jorge Arango, *Information Architecture: For the Web and Beyond* (4th ed., 2015) — the polar bear book; the canonical IA text.
- Abby Covert, *How to Make Sense of Any Mess* (2014) — accessible introduction to IA as a way of thinking, not just a web discipline.
- Dan Brown, *Communicating Design* (2nd ed., 2010) — IA documentation and deliverables.
- Donna Spencer, *A Practical Guide to Information Architecture* (2010) — methods (card sorting, tree testing).
- Peter Morville, *Ambient Findability* (2005) — findability as the ground truth of IA quality.

## Diagnostic prompt

When evaluating a product at the IA layer, ask a user (or yourself, fresh) to find five specific things without using search. If three or more take more than two clicks or require backtracking, the IA is misaligned with how users think about the content. Then ask: *given the entity types in this system, can I draw the object model on a single page?* If not, the IA isn't legible — to users or to the team building it.
