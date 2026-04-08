# UI/UX Audit for app.customagents.io Dashboard

## Purpose
This skill covers how to audit the UI/UX of the Custom Agents dashboard (Next.js 15, TailwindCSS 4, Phosphor Icons, React 19). It captures known patterns, anti-patterns, standards, and how to evaluate and improve the interface across web/desktop, mobile, and PWA contexts.

---

## Stack Context
- **Framework:** Next.js 15.1 App Router, React 19
- **Styling:** TailwindCSS 4 with custom CSS variables (`@theme` block in `globals.css`)
- **Icons:** Phosphor Icons (`@phosphor-icons/react`)
- **Auth:** NextAuth v5 (beta 25)
- **PWA:** Manual `sw.js` in `/public` — no next-pwa plugin, no `manifest.json`
- **Theming:** Custom ThemeProvider with `light`/`dark`/`system` modes via CSS variables
- **Layout:** Fixed sidebar (w-64) + sticky header (h-16) + `<main className="p-4 sm:p-6">`

---

## Audit Areas & Checklists

### 1. Layout & Navigation
- [ ] Sidebar collapse state is NOT persisted (localStorage) — resets on every page load
- [ ] No logo/icon in sidebar — text "CUSTOM AGENTS" only; no visual identity
- [ ] Header hamburger toggles sidebar but has no `aria-label`
- [ ] No breadcrumb navigation for deep pages (e.g., `/agents/[id]`)
- [ ] Settings sub-navigation on mobile overflows horizontally — relies on scroll, no visual hint
- [ ] No active page title in mobile header — user can't confirm context on small screens
- [ ] Missing keyboard navigation (no skip-to-content link, no focus traps in modals/menus)

### 2. Dashboard / Home Page
- [ ] Stats cards use "..." as loading state — should use skeleton placeholders
- [ ] "Emails Today" stat fetches ALL activities (up to 500) just to count — performance issue
- [ ] Dashboard duplicates the Agents list — `/` and `/agents` show the same card grid
- [ ] No date/time context on stats (e.g., "today" is ambiguous without timestamp)
- [ ] No empty-state onboarding flow for brand-new users (just a "No agents yet" card)

### 3. Agents List & Cards
- [ ] Agent cards are entire `<Link>` wrappers — the mailto icon inside causes nested interactive elements (accessibility violation)
- [ ] No search/filter on agents list — becomes unusable at 10+ agents
- [ ] No sort capability (by name, status, last activity)
- [ ] Card grid goes 1→2→3 col but never shows more context per agent (message count, last activity time)

### 4. Agent Detail Page (Tabs)
- [ ] Tab bar overflows on mobile (5 tabs: Activity, Chat, Config, Knowledge, Integrations) — no scroll indicator
- [ ] Tab state is lost on page navigation (not stored in URL query param)
- [ ] Loading state is plain text "Loading agent..." — no skeleton
- [ ] Agent deletion uses `window.confirm()` — browser dialog, not a proper modal confirmation
- [ ] `DotsThree` more menu only has Pause/Resume — feels incomplete

#### Activity Tab
- [ ] Group mode buttons (Timeline/Thread/Contact) have no minimum touch target on mobile (`px-3 py-1.5 text-xs`)
- [ ] Activity items are clickable cards but expand inline — on mobile expanded content can be very long with no scroll management
- [ ] `console.log` left in production code (lines 142-143, 147)
- [ ] Activity loading shows centered text, not a skeleton list

#### Chat Tab
- [ ] Chat height is `calc(100vh-280px)` — hardcoded magic number that breaks at different viewports
- [ ] Input is a single-line `<Input>` — multi-line messages have no way to be entered (no Shift+Enter textarea)
- [ ] Config changes diff displayed as raw JSON — should be human-readable
- [ ] No chat clear/reset capability
- [ ] No character limit indicator on the input

#### Config Tab
- [ ] No unsaved changes indicator — user can navigate away and lose edits without warning
- [ ] Form is not inside a `<form>` tag (no native browser form benefits, no Enter-to-submit)
- [ ] Escalation rules character counter (`0/2000`) is inconsistently shown only in Config tab, not in New Agent form

### 5. New Agent Form
- [ ] Multi-step wizard flow would be better UX than one long scrollable card stack
- [ ] No progress indicator for the form (user doesn't know how long it is)
- [ ] Role and Instructions fields have no character limits/counters shown
- [ ] Form validation errors only surface on submit — no inline validation
- [ ] `select` for domain dropdown uses raw HTML `<select>` — inconsistent with the rest of the design system

### 6. Drafts Page
- [ ] Filter buttons wrap to new lines on small mobile (< 360px)
- [ ] Approve/Reject buttons are in top-right corner — very small hit targets (`h-7`)
- [ ] No confirmation before rejection — easy to accidentally reject
- [ ] "Preview & Edit" textarea has no max height + overflow-y — can grow infinitely tall
- [ ] Approved/rejected drafts stay visible with no way to permanently clear/archive them

### 7. Activity Page (Global)
- [ ] No refresh button — stale on long-lived sessions
- [ ] No filtering by agent, date range, or activity type
- [ ] No pagination — loads 100 items with no "load more"
- [ ] Activity items are not clickable/expandable (unlike the per-agent view)

### 8. Settings Pages
- [ ] `settings/page.tsx` does a client-side redirect — causes flash before navigating
- [ ] General settings page shows subscription status but has no "Upgrade" CTA
- [ ] Notifications page likely stub/empty (not verified but pattern suggests it)
- [ ] Team page likely stub (no invite flow visible in codebase)
- [ ] No success/error toast system — feedback is ad-hoc per-component (e.g., Check icon for 2s)

### 9. Auth Pages
- [ ] Sign-in logo uses `<img>` not `<Image>` (no Next.js optimization)
- [ ] No "Forgot password" link
- [ ] No "Show password" toggle
- [ ] Google OAuth is disabled but commented code is visible in codebase (messy)
- [ ] No loading skeleton — shows plain text "Loading..." in Suspense fallback

### 10. Design System / Consistency
- [ ] No global toast/notification system — each page handles its own feedback
- [ ] No modal/dialog component — uses `window.confirm()` for destructive actions
- [ ] No skeleton/loading placeholder components — loading states are inconsistent (text, "...", spinners)
- [ ] `select` elements (domain picker in new agent) use raw HTML, not a custom component matching design system
- [ ] Button sizes inconsistently mixed (`h-7`, `size="sm"`, `size="icon"`)
- [ ] Only 6 UI components in `/components/ui/` — very minimal component library

### 11. Mobile Responsiveness
- [ ] Sidebar on mobile: no swipe-to-open gesture
- [ ] Settings subnav: horizontal scroll without visible scrollbar or pills indicator
- [ ] Agent detail tabs: 5 tabs overflow on screens < 375px
- [ ] Drafts approve/reject buttons stack oddly on < 320px
- [ ] Chat input area fixed at bottom but not accounting for iOS keyboard (no `env(safe-area-inset-bottom)`)
- [ ] `userScalable: false` in viewport disables pinch-zoom — accessibility concern (WCAG 1.4.4)

### 12. PWA
- [ ] **No `manifest.json`** — not installable as PWA
- [ ] `sw.js` exists in `/public` but is not registered anywhere in the codebase
- [ ] No `next-pwa` or equivalent configured in `next.config.ts`
- [ ] No offline page/fallback
- [ ] No push notification infrastructure
- [ ] No app icons set (only `favicon.ico`) — PWA needs 192x192 + 512x512 icons
- [ ] `theme-color` meta tag missing from `layout.tsx`
- [ ] `apple-mobile-web-app-capable` meta tag missing
- [ ] `apple-touch-icon` missing from `/public`

### 13. Performance & Optimization
- [ ] Dashboard fetches agents, activities (500), and drafts sequentially on load
- [ ] Activity page fetches all agents then all activities — N+1 pattern
- [ ] No React `Suspense` boundaries for data-fetching components
- [ ] No optimistic UI on toggle/pause/resume — waits for API round-trip
- [ ] Images: logo uses unoptimized `<img>` tags with no lazy loading
- [ ] No route prefetching hints beyond Next.js defaults
- [ ] No error boundaries — a single component crash can blank the entire page

### 14. Accessibility
- [ ] Missing `aria-label` on icon-only buttons (hamburger menu, theme toggle, more menu)
- [ ] `userScalable: false` violates WCAG 1.4.4 (Resize Text)
- [ ] Color-only status indicators (green/yellow/red badges) with no text alternative
- [ ] Focus management not handled after modal/menu open
- [ ] Activity items use `div onClick` without `role="button"` or `tabIndex`
- [ ] No skip-to-content link

---

## How to Run an Audit Session

1. **Code audit:** Read all files in `dashboard/src/app/` and `dashboard/src/components/`
2. **Visual audit:** Use Playwright or browser_preview tool; test at 375px, 768px, 1280px widths
3. **PWA audit:** Check `document.querySelector('link[rel="manifest"]')` → should return manifest URL
4. **A11y audit:** Run axe-core or Lighthouse accessibility scan
5. **Performance:** Run Lighthouse at https://app.customagents.io
6. **Mobile:** Use browser DevTools device emulation (iPhone 14, Pixel 7)

---

## Improvement Priority Tiers

### P0 — Critical (fix immediately)
1. Add `manifest.json` + register service worker → PWA installability
2. Remove `userScalable: false` → WCAG compliance
3. Add `aria-label` to all icon-only buttons
4. Replace `window.confirm()` with modal dialogs
5. Add global toast/notification system

### P1 — High Impact UX
1. Persist sidebar state in localStorage
2. Skeleton loading states everywhere
3. Tab bar URL persistence (`?tab=chat`)
4. Add search/filter to agents list
5. Mobile: swipe-to-open sidebar
6. iOS keyboard safe area on chat input
7. Unsaved changes warning on Config tab

### P2 — Polish & Delight
1. Add logo/icon to sidebar
2. Multi-step wizard for new agent form
3. Human-readable config change diffs in chat
4. Drafts: confirmation before reject
5. Activity: filter by type/agent/date
6. "Forgot password" on sign-in
7. Replace raw `<select>` with design system component

### P3 — Nice to Have
1. Push notifications for escalations (requires PWA infra)
2. Agent avatar/color customization
3. Keyboard shortcuts (⌘K command palette)
4. Bulk draft approve/reject
5. Dark mode OLED optimization (#000000 background)
