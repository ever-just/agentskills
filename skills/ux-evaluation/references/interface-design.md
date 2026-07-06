# Interface Design

The task-oriented side of Garrett's Skeleton plane. Interface Design is the design of the controls users manipulate to do things in the product — buttons, inputs, selects, toggles, sliders, modals, menus. It is distinct from Interaction Design (Structure plane), which specifies *what should happen*; Interface Design specifies *what controls render that*. It is also distinct from Visual Design (Surface), which specifies *how those controls look*.

## What this layer is

Garrett defines Interface Design as: *as in traditional HCI: design of interface elements to facilitate user interaction with functionality.*

The "traditional HCI" reference points to a long tradition of human-computer interaction research — Don Norman, Ben Shneiderman, Jakob Nielsen, Bruce Tognazzini, and others — that established the principles of how controls should be designed for predictable, efficient, error-resistant use. Modern Interface Design inherits this tradition and applies it through component-based systems.

In practice, Interface Design at the system level produces:

- A **form system** (input, label, error, help text, validation patterns).
- A **state vocabulary** (default, hover, focus, focus-visible, active, disabled, loading, error — applied consistently across all controls).
- **Feedback rendering patterns** (the "how" half — toast, inline alert, modal, banner — paired with IxD's "when" half).
- **Control patterns** for the standard interactions (selection, toggling, sorting, filtering, sliding).

## Where it sits

Skeleton plane, task-oriented column. Above it: Interaction Design (Structure) — which specifies what behaviors the interface needs to support. Below it: Visual Design (Surface) — which specifies how the controls look. To its right (information-oriented sibling): Navigation Design and Information Design.

The form system is probably the single most load-bearing piece of Interface Design infrastructure for B2B applications. Most B2B work is forms.

## What to evaluate

**Form system:**
- Are all form elements consistent? (Same label placement, same error treatment, same help-text pattern, same required-field marking.)
- Is validation client-side, server-side, or both? Is feedback shown inline as the user types, on blur, on submit?
- Are error messages specific and actionable? ("Email is required" beats "Invalid input.")
- Is field grouping visually communicated? (Fieldsets, legends, spacing.)
- Are inputs sized appropriately for the data they accept? (A zip code field shouldn't be as wide as a name field.)
- For complex inputs (date pickers, autocomplete, multi-select), is the pattern consistent across the product?

**State vocabulary:**
- Are states named and styled consistently? (Hover means the same thing on every interactive element.)
- Is `:focus-visible` used appropriately for keyboard navigation, distinct from mouse hover?
- Are disabled states explained? (Why is this button disabled? What unblocks it?)
- Are loading states distinguishable from disabled states? (Loading is temporary; disabled has a reason.)
- Are error states recoverable? (Can the user fix the error inline, or do they have to start over?)

**Feedback rendering:**
- For each feedback type defined by IxD (success, warning, error, info), is there a single rendering pattern?
- Is the pattern appropriate to the message? (Toasts auto-dismiss; errors that require action should not.)
- Is feedback positioned predictably? (Always top-right, always inline above the field, etc.)
- Does feedback announce itself to assistive technology? (ARIA live regions, role="alert".)

**Affordances:**
- Do interactive elements look interactive without requiring discovery? (Buttons look like buttons; links look like links.)
- Are clickable targets large enough? (Fitts's Law: smaller targets are slower and more error-prone. WCAG 2.1 recommends 44×44px minimum.)
- Is there sufficient contrast between active and inactive states?

**Consistency across the product:**
- The same action triggered from different screens should feel the same. Inconsistent controls signal a system that wasn't systematized.
- The same input pattern (date selection, currency entry, address) should use the same component everywhere.

## Common failure modes

- **Per-screen inventions.** Every form is its own bespoke design. No shared form system, so spacing, validation, and error treatment vary by who built which screen when.
- **States only specified for the happy path.** Default and hover are designed; focus, disabled, loading, error, empty are afterthoughts or missing.
- **Disabled buttons without explanation.** The button is grayed out and the user can't proceed. No indication of why or what unblocks it.
- **Loading states shown but not designed.** A spinner appears, sometimes for unbounded duration, with no skeleton, no progress indication, no cancel option.
- **Inconsistent feedback patterns.** Toast for one action, modal for another, page reload for a third. No coherent vocabulary.
- **Validation that fires too eagerly or too late.** Inline errors before the user has finished typing. Or no validation until submit, then a wall of errors at the top.
- **Click targets too small.** Especially on mobile. Especially for primary actions. Especially when the action is destructive.
- **Custom controls that don't behave like standard ones.** A "select" component that doesn't support keyboard navigation. A "modal" that doesn't trap focus. Reinventing native behavior usually reinvents it incorrectly.
- **No focus visibility.** Keyboard users see no indication of which element is focused. (Removing `outline: none` without a replacement is a common offender.)

## What gets confused with Interface Design

- **The decision that an action exists** is Scope or IxD. The decision of *what control renders the action* is Interface Design.
- **Color and typography** of controls are Visual Design (Surface). Interface Design defines the structure (a button has a label and may have an icon); Visual Design defines what the button looks like.
- **Layout of controls on a screen** is Skeleton-adjacent but more in the layout primitive / Information Design domain. Interface Design designs the controls themselves; layout decides how they're arranged.
- **Microcopy on controls** is content design. Interface Design specifies that a button has a label; content design specifies the label text.

## Canonical sources

- Jesse James Garrett, *The Elements of User Experience* (2000/2002).
- Don Norman, *The Design of Everyday Things* (1988/2013) — affordances, signifiers, mapping, feedback. Essential foundation.
- Ben Shneiderman et al., *Designing the User Interface* (6th ed., 2016) — comprehensive HCI textbook.
- Alan Cooper, Robert Reimann, et al., *About Face* (4th ed., 2014) — heavy coverage of Interface Design alongside IxD.
- Jakob Nielsen, "10 Usability Heuristics for User Interface Design" (1994) — durable evaluation framework. Many heuristics apply directly to Interface Design (consistency and standards, error prevention, recognition rather than recall).
- Bruce Tognazzini, "First Principles of Interaction Design" (1978/updated) — short list of foundational rules.
- Steve Krug, *Don't Make Me Think* (2000/2014) — practical usability for interfaces.
- Adam Wathan and Steve Schoger, *Refactoring UI* (2018) — modern, engineer-oriented Interface Design rules.
- *Material Design Guidelines* (Google) and *Human Interface Guidelines* (Apple) — large reference systems with substantive Interface Design rationale.
- *Inclusive Components* by Heydon Pickering (book and blog) — accessible Interface Design patterns.

## Diagnostic prompt

When evaluating a product at the Interface Design layer, audit one form end-to-end. Ask: *what does every state look like? What happens on validation failure? On network failure? On success? Can a keyboard-only user complete the form? Can a screen reader user understand the structure?* If any answer is "I don't know" or "we didn't think about it," the Interface Design system is incomplete — even if the form looks fine on the happy path.
