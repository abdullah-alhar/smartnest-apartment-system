# SmartNest — DESIGN.md

A single source of truth for how SmartNest should look and feel. SmartNest is a university group project: a web-based apartment sales and reservation platform used by five roles (Customer, Sales Staff, CRO, Operations Manager, Admin) to manage listings, promotions, inquiries, appointments, and reservations. This document exists so any AI coding agent (or teammate) can make consistent visual decisions without re-asking every time.

---

## 1. Visual Theme & Atmosphere

SmartNest should feel like a **real, trustworthy property platform** — not a generic internal tool, not a dark "hacker" dashboard, not a flashy consumer app. The tone is **warm but professional**: approachable enough that a customer browsing apartments feels comfortable, precise enough that staff reviewing a promotion or a reservation trusts the numbers on screen.

Two registers, one system:
- **Public-facing pages** (browsing promotions, apartment listings, registration) lean warm, photography/card-driven, generous whitespace — closer to a modern property-listing site.
- **Internal/admin pages** (Users management, promotion review queue, staff creation) lean precise and minimal — closer to a clean operations dashboard. Same color tokens and type scale throughout; the *density* and *emphasis* shift, not the palette.

Overall mood: calm, confident, uncluttered. Never neon, never heavy dark-mode-by-default, never cramped.

---

## 2. Color Palette & Roles

Base surface is **light**, not dark. One confident accent color carries all primary actions and brand moments. Status colors are used **only** for status, never decoratively.

| Token | Hex | Role |
|---|---|---|
| `--color-bg` | `#FAFAF9` | App background (warm off-white, not stark white) |
| `--color-surface` | `#FFFFFF` | Card / panel background |
| `--color-surface-alt` | `#F5F4F2` | Secondary surface (table stripes, subtle panels) |
| `--color-border` | `#E7E5E2` | Default hairline border |
| `--color-text-primary` | `#1C1917` | Headings, primary body text |
| `--color-text-secondary` | `#6B6560` | Labels, captions, muted text |
| `--color-text-tertiary` | `#A8A29A` | Placeholder text, disabled text |
| `--color-accent` | `#E4572E` | Primary brand accent — warm terracotta/coral. Primary buttons, active nav state, links, focus rings |
| `--color-accent-hover` | `#C94A24` | Accent hover/pressed state |
| `--color-accent-soft` | `#FCE9E1` | Accent tint — badges, subtle highlight backgrounds |
| `--color-success` | `#2E7D4F` | Approved status, success toasts |
| `--color-success-soft` | `#E5F3EA` | Approved badge background |
| `--color-warning` | `#B7791F` | Pending status |
| `--color-warning-soft` | `#FBF0DD` | Pending badge background |
| `--color-danger` | `#C0392B` | Rejected status, destructive actions (delete, deactivate) |
| `--color-danger-soft` | `#FBE8E5` | Rejected badge background |

**Rules:**
- Never use `--color-danger` for anything that isn't destructive or an error/rejected state.
- Never use more than one saturated color in the same component besides the accent + one status color.
- Dark mode is out of scope for this project — do not build a dark theme.

---

## 3. Typography Rules

One typeface family, two weights doing most of the work. Headings should feel confident but not shout.

- **Font:** `Inter` (Google Fonts) as the base for everything — UI text, body, labels. If a warmer display feel is wanted for large marketing-style headings only (e.g. the Promotions page hero), `Fraunces` (Google Fonts, a warm serif) may be used sparingly for H1-level moments only — never for body text, never for buttons, never for more than one heading per page.
- **Weights used:** 400 (body), 500 (labels, secondary emphasis), 600 (headings, button text), 700 (rare, large hero numbers only — e.g. a discount percentage).

| Style | Size | Weight | Use |
|---|---|---|---|
| Display | 2.5rem / 40px | 600–700 | Page hero titles only (e.g. "Active Promotions") |
| H1 | 1.75rem / 28px | 600 | Page section titles |
| H2 | 1.25rem / 20px | 600 | Card titles, modal titles |
| Body | 1rem / 16px | 400 | Default text |
| Body Small | 0.875rem / 14px | 400 | Secondary text, table cells |
| Label | 0.75rem / 12px | 500 | Form labels — uppercase, letter-spacing 0.03em |
| Caption | 0.75rem / 12px | 400 | Timestamps, helper text |

Line height: 1.5 for body text, 1.2 for headings. Never justify text. Left-align everything except numeric table columns, which right-align.

---

## 4. Component Stylings

**Buttons**
- Primary: solid `--color-accent` fill, white text, 8px corner radius, medium padding (10px 20px). Hover darkens to `--color-accent-hover`. Disabled: 40% opacity, no pointer.
- Secondary: white/transparent fill, 1px `--color-border`, `--color-text-primary` text. Hover: `--color-surface-alt` fill.
- Destructive: solid `--color-danger` fill, white text — reserved for Delete/Deactivate/Reject confirmations only, never a primary action.
- Icon-only buttons: 36px square, centered icon, ghost background until hover.
- Every button shows a loading state (small spinner replacing icon/text) while a request is in flight, and becomes disabled during that time — never allow a double-submit.

**Inputs**
- White background, 1px `--color-border`, 8px radius, 10px vertical padding. Focus state: 2px `--color-accent` ring, border color shifts to accent.
- Label always above the input, using the Label type style.
- Inline validation error: red text below the field (Body Small, `--color-danger`), plus the input border shifts to `--color-danger`. Never rely on color alone — always pair with text.
- A fixed, non-editable prefix (like "+94") renders as a separate, slightly recessed segment to the left of the editable input, visually part of the same field.

**Cards**
- White surface, 12px corner radius, subtle shadow (`0 1px 3px rgba(28,25,23,0.06)`), 1px `--color-border` only if shadow alone reads too flat on a given background. Padding 20–24px.
- A card representing a real "thing" (a promotion, a user row in card form) always has a clear content hierarchy: title first, key metric/status prominent, secondary details below a hairline divider, actions at the bottom — actions are never the first thing the eye hits.

**Status badges**
- Pill shape, 999px radius, small icon + label, background is the `-soft` variant of the status color, text is the solid variant. Pending = clock icon, Approved = check-circle icon, Rejected = x-circle icon.

**Tables** (internal/admin pages — Users list, promotion review queue)
- Used for dense, scannable staff-facing data — not for the public promotion browsing grid, which uses cards.
- Header row: `--color-surface-alt` background, Label-style text, no vertical borders. Row hover: `--color-surface-alt`. Row divider: 1px `--color-border`, horizontal only.
- Action buttons in the last column, right-aligned, icon-only where space is tight.

**Modals**
- Centered overlay, `--color-surface` panel, 16px radius, max-width ~480–560px depending on form complexity. Dimmed backdrop (`rgba(28,25,23,0.4)`). Close (X) top-right, title top-left, using H2 style. Footer actions right-aligned: Cancel (secondary) then primary action, in that order left-to-right.

**Empty states**
- Centered icon (muted, `--color-text-tertiary`), a short bold message, a shorter muted caption below it, and — only where genuinely actionable — a single primary button.

**Toasts**
- Bottom-right or top-right (pick one, stay consistent), auto-dismiss after ~4s, colored left border matching success/danger, white background, icon + message.

---

## 5. Layout Principles

- **Spacing scale:** 4px base unit — use 4, 8, 12, 16, 24, 32, 48, 64. Never arbitrary values like 13px or 27px.
- **Page container:** max-width ~1200–1280px, centered, with 24px horizontal padding on smaller viewports.
- **Public promotion grid:** responsive card grid, 3 columns on desktop, 2 on tablet, 1 on mobile. Consistent gutter (24px).
- **Admin tables:** full-width within the container, horizontally scrollable on narrow viewports rather than breaking the layout.
- **Vertical rhythm:** generous section spacing (48–64px between major page sections), tighter spacing within a single card or form (12–16px between fields).
- **Navbar:** fixed height (~64px), horizontal, never a sidebar. Logo + wordmark left, nav links center-left, account menu far right.

---

## 6. Depth & Elevation

Three elevation levels only — do not invent more.

| Level | Shadow | Use |
|---|---|---|
| 0 (flat) | none, border only | Page background, table rows |
| 1 (raised) | `0 1px 3px rgba(28,25,23,0.06), 0 1px 2px rgba(28,25,23,0.04)` | Cards, the navbar |
| 2 (overlay) | `0 8px 24px rgba(28,25,23,0.12)` | Modals, dropdown menus, toasts |

Never stack shadows beyond level 2. Never use shadow to fake a border — use `--color-border` for that.

---

## 7. Do's and Don'ts

**Do:**
- Use the accent color sparingly and intentionally — primary CTAs, active states, the logo mark. If more than ~10% of a screen is accent-colored, pull back.
- Keep icon usage consistent — Lucide icons only, same stroke width throughout, never mix icon styles.
- Always show a loading skeleton (not a spinner-only blank screen) for content that takes a moment to fetch — card-shaped grey placeholders matching the eventual content's layout.
- Write empty states with a helpful, human tone ("No promotions yet — check back soon"), never a bare "No data."

**Don't:**
- Don't use emoji as icons anywhere in the product UI.
- Don't introduce a second accent color "just for variety" — status colors are the only other colors allowed, and only for status.
- Don't build a dark theme or a theme toggle — out of scope.
- Don't use a sidebar navigation — this system uses a horizontal top navbar only.
- Don't nest more than one level of dropdown/submenu in navigation — if a role's related actions don't fit as flat, prominent controls on the relevant page itself, that's a page-structure problem, not a "add a dropdown" problem.
- Don't let a card or table row's primary content compete visually with its action buttons — actions are secondary to content.

---

## 8. Responsive Behavior

- **Breakpoints:** mobile `<640px`, tablet `640–1024px`, desktop `>1024px`.
- Navbar collapses non-essential links into a hamburger/menu icon below tablet width; the logo and account menu always remain visible.
- Card grids reflow (3 → 2 → 1 columns) rather than shrinking cards illegibly.
- Tables become horizontally scrollable within their container on mobile rather than breaking off-screen or stacking awkwardly.
- Minimum touch target size: 40x40px for any interactive element on touch viewports.
- Modals go full-screen (not centered floating panel) below ~480px width.

---

## 9. Agent Prompt Guide

When asked to build a new screen for SmartNest, apply this system by default without needing to be told each token again:

> Build this screen using SmartNest's established design system: warm off-white background (`#FAFAF9`), white cards with 12px radius and subtle shadow, one terracotta accent color (`#E4572E`) for primary actions only, Inter typeface, 4px-based spacing scale, Lucide icons, status badges in the established pill style (amber=pending, green=approved, red=rejected). Public-facing content uses cards in a responsive grid; internal/admin data uses clean tables. No sidebar — horizontal top navbar only. No dark mode. No emoji icons. Always include loading skeletons and empty states matching the established patterns.

For any new page, prioritize:
1. Content hierarchy first (what's the one thing this screen needs to communicate clearly)
2. Reuse of existing components (buttons, cards, badges, tables, modals) over inventing new patterns
3. Consistency with whichever "register" fits — warm/card-driven for anything a customer sees, precise/table-driven for anything only staff sees

---

*This is an original design system created for the SmartNest student project — not affiliated with or copied from any commercial brand's official design system.*
