# Timedify

Welcome to Timedify
Timedify provides time-controlled content scheduling for Shopify stores. Schedule when content appears and disappears on your product pages, collection pages, and throughout your store with precise timing control.

---

## Key Features

- **Time-controlled visibility** - Schedule content to appear and disappear at specific times
- **No content flash** - Seamless transitions without jarring content changes
- **Universal compatibility** - Works across all Shopify themes
- **Easy setup** - Simple block-based configuration in the theme editor
- **Privacy-focused** - No data collection or external tracking

---

## Project Overview

Timedify: Content Scheduler consists of two parts:

- Admin app (Remix) embedded in Shopify Admin for setup and guidance
- Theme App Extension with two blocks: "1. Timed Content: Start" and "2. Timed Content: End"

Key capabilities:

- Time-controlled visibility without content flash
- Works across Shopify themes
- Session token authentication and latest App Bridge usage

For setup and development details, see `EXTENSION_INTEGRATION.md` and the official Shopify docs.

---

## Theme App Extension: Controller Behavior (Current)

The Theme App Extension ships a controller script that pairs Start/End blocks and toggles visibility without FOUC.

### Marker pairing
- Prefers pairing inside the same `.shopify-section` with DOM-order (the End must follow the Start).
- Optional explicit pairing via `data-range-key` on both Start and End blocks.
- Fallback: pairs with the first End marker in subsequent sections when no same-section match exists.

### Target detection
- Single-section setup: collects all `.shopify-block` elements between Start and End within the same section.
- Cross-section setup: collects all `.shopify-section` elements strictly between Start and End sections.

### FOUC prevention and states
- Immediately sets `data-timedify-pending` and `data-timedify-range` on targets and hides them to prevent flashes.
- After timing evaluation, sets/removes `data-timedify-hidden` and `aria-hidden` accordingly, then marks ready via `data-timedify-ready`.

### Accessibility
- Visible targets: `aria-hidden` is removed.
- Hidden targets: `aria-hidden="true"` is set. No reliance on `aria-hidden="false"`.

### Stability
- Script initializes once per page via an init guard (`window.__timedifyInited`).
- Optional debug logs controlled via `window.__timedifyDebug = true`.
- Late-loaded sections are observed and controlled using DOM position comparisons, not index scans.

---

## Using the Blocks

1. Add "1. Timed Content: Start" and optionally set:
   - `data-start-datetime` (format: `DD.MM.YYYY HH:MM`)
   - optional `data-range-key` to explicitly pair with a matching End
2. Add "2. Timed Content: End" after your timed content in the same section, or in a later section for cross-section ranges. Optionally set `data-range-key` to match the Start.
3. Content between Start and End is hidden or shown based on the current time.

Notes:
- In Shopify Theme Editor (`window.Shopify.designMode`), content is always visible for a better authoring experience.
- For production, ensure a CSS rule hides pending targets early, e.g.: `[data-timedify-pending][data-timedify-range] { display:none !important; }`.

---

## Development Notes

- Controller source: `extensions/timed-content-app/assets/timedify-controller.js`
- Key functions:
  - `findNextEndMarker(startEl)` – same-section first (range-key aware), then cross-section fallback
  - `collectBlocksBetween(startEl, endEl)` – single-section block collection
  - `collectSectionsBetween(startEl, endEl)` – cross-section section collection
  - `computeActive(startEl, endEl)` – evaluates `data-start-datetime`/`data-end-datetime`
  - `applyVisibility(elements, isActive)` – toggles dataset and ARIA states

---

## Changelog Highlights

- Fixed single-section pairing by scanning the same section first and using `compareDocumentPosition`.
- Added optional `data-range-key` pairing; fully backward compatible.
- Added init guard (single initialization) and debug logging flag.
- Improved accessibility: avoid `aria-hidden="false"`; remove attribute instead when visible.
- More efficient late-load handling using DOM position checks.
