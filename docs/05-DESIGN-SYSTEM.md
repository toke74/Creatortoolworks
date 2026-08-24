# Design System

## Status
**Design System v1 — locked 2026-08-20, reconfirmed 2026-08-21 at Tool #1 product/design review.** This is the mandatory, reusable visual/interaction language for every current and future CreatorToolWorks page — the violet brand identity, logo/brand mark, typography, header/footer, homepage hero, card system, tool-page layout, upload workspace, status colors, stat cards, trust indicators, guideline cards, source component, and responsive conventions documented below are not proposals; they are the system.

**Coding agents building Tool #2 and beyond MUST reuse these tokens and components rather than inventing new colors, spacing, radii, or one-off layouts.** Extend additively (a new `ToolCategory` icon, a new stat-card field, a new tool-page section) — do not restyle existing components. A genuine visual overhaul is a v2 decision record, proposed and approved explicitly, never applied piecemeal inside a feature task.

## UX personality
Practical, modern, creator-focused, friendly, fast, trustworthy, slightly playful. Not corporate, not childish, not an AI/neon aesthetic. The tool is the visual focus; monetization never competes with the primary action.

## Design tokens
All tokens are CSS custom properties defined once in `src/app/globals.css`. Components consume them via Tailwind arbitrary-value classes (e.g. `bg-[var(--accent)]`) — never raw hex values in component code.

### Color
| Token | Value | Use |
|---|---|---|
| `--background` | `#f8f8fc` | Page background |
| `--surface` | `#ffffff` | Cards, header, footer |
| `--surface-muted` | derived (`color-mix`, ~`#f7f6ff`) | Dropzone idle state, stat tiles |
| `--text` | `#17171b` | Primary text |
| `--text-muted` | `#60606b` | Secondary/supporting text |
| `--border` | `#e7e5ef` | Card and input borders |
| `--accent` | `#6d4aff` | Primary brand violet — buttons, links, active states |
| `--accent-dark` / `--accent-hover` | `#5535e8` | Hover/active state for accent surfaces |
| `--accent-soft` | `#eeeafe` | Tinted backgrounds (badges, drag-over state, icon chips) |
| `--accent-contrast` | `#ffffff` | Text/icons on accent backgrounds |
| `--warm` | `#ffb84d` | Secondary accent — decorative only, not used for primary actions |
| `--warm-soft` | `#fff4de` | Reserved for future warm-tinted badges/pills (`.pill` utility in `globals.css`); no badge is currently shown publicly — see `ToolCard` note below |
| `--success` / `-soft` / `-border` | `#16a36a` + pale tints | Pass status |
| `--warning` / `-soft` / `-border` | `#d97706` + pale tints | Warning status |
| `--danger` / `-soft` / `-border` | `#dc3f45` + pale tints | Fail status |
| `--focus-ring` | `= --accent` | Keyboard focus outline |

Pale status backgrounds/borders are derived with `color-mix(in srgb, <color> N%, white)` rather than hand-picked hex values, so a future token change stays consistent automatically. Status banner/check-item text uses slightly darkened hand-picked hex (`#0d5b3f`, `#7a4a05`, `#8f232a`) chosen specifically to clear 4.5:1 contrast on their pale backgrounds — verified computationally during the 2026-08-20 QA pass (all ≥6.5:1).

**Verified contrast (2026-08-20):** primary button (white on `--accent`) 5.15:1; hover state 6.86:1; body text 16.87:1; muted text 5.86:1; all pass/warning/fail banner text ≥6.5:1. All pass WCAG AA (4.5:1) for normal text. The one non-text element under 4.5:1 is the decorative success checkmark icon stroke (3.06:1), which meets the applicable non-text/graphical-object threshold (3:1 per WCAG 1.4.11) since it's a reinforcing icon beside already-compliant text, not a text glyph itself.

### Typography
Font: Inter (`next/font/google`, self-hosted, variable `--font-inter` → `--font-sans`). No other typeface is loaded.

| Role | Classes | Size |
|---|---|---|
| Hero heading | `text-4xl sm:text-6xl font-bold tracking-tight` | 36px → 60px |
| Page title (h1) | `text-4xl font-bold tracking-tight` | 36px |
| Section heading (h2) | `text-2xl font-semibold tracking-tight` | 24px |
| Card title (h3) | `font-semibold` (inherits body size) | 16px |
| Body | default | 16px |
| Secondary/caption | `text-sm` | 14px |
| Eyebrow/label | `text-xs font-semibold uppercase tracking-[0.14em]` | 12px |

Heading levels are structural, not stylistic: h1 once per page → h2 for top-level sections → h3 for card titles nested inside a section. Pages with a grid of cards but no visible section heading (e.g. the catalog page) get a `sr-only` h2 so the outline stays valid without changing the page visually.

### Spacing & layout
- Content is constrained by `.site-container` (`--content-width: 1180px`, `min(100% - 2rem, var(--content-width))`).
- Spacing scale follows Tailwind defaults; sections typically use `py-10`–`py-16` (desktop `sm:` steps up one notch). Avoid stacking a section's own bottom padding directly against the footer's top margin — that compounds into dead space (fixed on the homepage 2026-08-20: `pb-20 sm:pb-24` → `pb-12 sm:pb-14`).
- Grids: `grid-cols-1` on mobile → `md:grid-cols-2` → `lg:grid-cols-3` for tool cards; the two-column tool workspace (`lg:grid-cols-[1.1fr_1fr]`) collapses to one column below `lg` (1024px).

### Radii
| Token | Value | Use |
|---|---|---|
| `--radius-sm` | 10px | Small controls, nav hover chips |
| `--radius-md` | 14px | Buttons, stat tiles, secondary cards |
| `--radius-lg` | 20px | Primary cards, workspace card, dropzone, image preview |
| `--radius` | alias of `--radius-md` | Legacy shorthand, kept for compatibility |

## Core components
| Component | File | Notes |
|---|---|---|
| `LogoMark` | `src/components/brand/logo-mark.tsx` | Inline SVG brand mark (gradient tile + slider glyph). Also exported statically as `public/favicon.svg`. |
| `SiteHeader` | `src/components/layout/site-header.tsx` | Sticky, blurred background, logo + wordmark + primary nav. |
| `SiteFooter` | `src/components/layout/site-footer.tsx` | Brand blurb + data-driven `footerSections` (only real routes — never invented links). |
| `Breadcrumbs` | `src/components/layout/breadcrumbs.tsx` | `aria-label="Breadcrumb"`, last item is `aria-current="page"` and not a link. |
| `ToolIcon` | `src/components/tool/tool-icon.tsx` | Category → glyph mapping covering all `ToolCategory` values, ready for tools 2–300+. |
| `ToolCard` | `src/components/tool/tool-card.tsx` | Icon + `<h3>` title + summary + "Open tool" affordance. Whole card is one link; hover lifts + tints border. **No "Beta"/status badge is shown publicly** (removed 2026-08-21) — internal `status` (`draft`/`live`/`deprecated`) stays a data field for indexing/routing decisions only, never surfaced as UI copy. |
| `MetricCard` | `src/components/tool/metric-card.tsx` | `dt`/`dd` stat tile (dimensions, aspect ratio, file size, format). |
| Status banner | inline in `thumbnail-size-checker.tsx` (`STATUS_BANNER_CLASSES`) | Pale background + icon + human headline (e.g. "2 recommendations") + explanatory sentence. Status is never color-only: icon + text label (visually and via `sr-only`) always accompany it. |
| Check item | inline (`STATUS_CHECK_CLASSES`) | Left-border accent by status + icon + label + message. |
| Source note | inline in `[slug]/page.tsx` "Source" section | Source name, external-link icon, `target="_blank" rel="noreferrer"`, verification date pulled from the platform-facts registry. |
| `HeroIllustration` | `src/components/marketing/hero-illustration.tsx` | Homepage-only decorative SVG, no external assets. |
| `PageHeader` | `src/components/layout/page-header.tsx` | Eyebrow label + `<h1>` + optional intro paragraph. Extracted 2026-08-21 from the catalog page; reuse for any simple content page (catalog, about, contact, privacy, terms) instead of hand-rolling the same three elements again. |

### Static content pages (about/contact/privacy/terms)
Layout: `<main className="site-container py-14 sm:py-16">` → `<PageHeader>` → `<section className="mt-12 max-w-3xl space-y-10">` of `h2`/`p` blocks, matching the tool page's content-section typography exactly (`text-2xl font-semibold tracking-tight` headings, `leading-7 text-[var(--text-muted)]` body). Legal pages (`privacy`, `terms`) read as finalized policy copy — as of 2026-08-21 they carry no "template"/"draft"/"not legal advice" hedging visible to visitors; keep it that way when editing this copy. These pages carry their own `alternates.canonical` metadata like every other page. The contact email (`siteConfig.contactEmail`) is always rendered as a `mailto:` link wherever it appears.

### Buttons
- **Primary**: `bg-[var(--accent)] text-[var(--accent-contrast)]`, `rounded-[var(--radius-md)]`, `min-h-11`/`min-h-12` (≥44px touch target), hover → `--accent-hover`.
- **Secondary**: bordered, `bg-[var(--surface)]` or transparent, hover → accent border/text. Visually subordinate to primary; reset/cancel actions always use this style, never primary.

### Trust signals
A small `✓ label` row (checkmark SVG stroked `--success` + `text-sm font-medium text-[var(--text-muted)]`) used identically on the homepage hero ("Free tools", "No signup", "Privacy-friendly") and the tool page hero ("Free", "No upload", "Runs in your browser"). Keep this pattern — icon + short label, never a paragraph — for any future tool's trust row.

## Tool page layout (template for tools 2+)
1. Breadcrumbs (`Home / <Category> / <Tool name>`).
2. Small category label + `ToolIcon` + h1 + one-sentence value proposition + trust-signal row.
3. Workspace card (`.card`, elevated shadow, `aria-labelledby`) containing the interactive tool.
4. "How to use" (numbered steps).
5. Platform-guidance section sourced from the centralized `platform-facts` registry — never hardcode numbers here.
6. "What the results mean" (status semantics, if the tool produces pass/warning/fail-style output).
7. "Methodology and limitations".
8. "FAQ" (only real, non-filler questions).
9. "Source" note.
10. "Related tools" (only rendered when at least one related tool is `implemented`; omitted entirely otherwise — never a broken/placeholder link).

## State model
Every interactive tool designs explicitly for: empty; valid input; invalid input; processing (only if genuinely asynchronous); result; copy/download success; unexpected error.

## Accessibility baseline
- Visible labels; placeholders are not labels.
- Logical heading order, verified per-page (see Typography above).
- All interactive elements keyboard-reachable in a sensible DOM order; verified via scripted Tab-order QA 2026-08-20.
- Visible focus indicators (`:focus-visible` → 2px solid `--focus-ring`) on every interactive element, confirmed present on links, buttons, and the file input's label.
- Errors identified in text (`role="alert"`), not color alone.
- Touch targets ≥44px on primary actions.
- Uploaded image preview has a descriptive `alt` derived from the filename.
- Status is always icon + text, never color alone.

## Ad-safe visual rule
No product card, CTA, download control, or related-tool card should imitate common ad creative. Conversely, ads must be visually distinguishable from site controls. (No ad slots exist yet — this rule is forward-looking.)

## Responsive conventions
Breakpoints follow Tailwind defaults: `sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px. QA is run at 360px and 390px (phone), ~768px (tablet), 1280px, and 1440px+ (desktop) for every tool page. No horizontal overflow is permitted at any of these widths; the two-column tool workspace pattern must collapse to one column below `lg`.
