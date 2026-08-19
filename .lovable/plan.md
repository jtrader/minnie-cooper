# Rebrand: Minnie Cooper — Money Keeper Risk Management

A full brand system inspired by two border collies: **Minnie** (black/white, smaller, quick) and **Cooper** (brown/white, larger, steady). Delivered as a style guide + logo + light/dark themes, with rendered layout prototypes for review **before** any code integration.

## Brand concept

Border collies are working dogs: they watch, herd, and keep the flock safe. That is exactly what a risk-management dashboard does — it watches positions and keeps capital safe. The two dogs map to two roles in the product:

- **Minnie** — black & white, fast, alert. Signals, alerts, stop-loss triggers. Sharp monochrome + a cool accent.
- **Cooper** — brown & white, larger, steady. Balances, holdings, long-run posture. Warm tan/copper accent.

Colour cues taken from the supplied photos: collie black, cream/white ruff, chestnut/copper coat, sun-bleached grass, weathered timber, cool galvanised-steel grey.

## Deliverables

1. **Style guide document** (`/mnt/documents/`, PDF + markdown)
   - Logo system and clear-space/minimum-size rules
   - Colour palette: full light theme + adapted dark theme, all as oklch tokens
   - Typography scale (display, UI, monospace numerals for financial data)
   - Component notes: cards, tables, badges, gain/loss states, buttons
2. **Logo package**
   - Primary lockup: collie-head mark + "Minnie Cooper" wordmark + "Money Keeper Risk Management" descriptor
   - Icon-only mark (a minimal two-collie / collie-silhouette form that reads at 16px for the favicon)
   - Horizontal, stacked, and mono variants
3. **Layout prototypes for review** — rendered previews of the landing page and dashboard in the new brand, at least three directions varying composition/density, all using the same locked palette + type. You pick one before anything is integrated.

## Proposed palettes (you'll see these as swatches to choose from)

- **Collie Cream (light, primary proposal)** — warm cream page, ink-black text, chestnut/copper accent, sage-green positive, brick-red negative.
- **Steel & Tan (light, cooler)** — galvanised grey-white surfaces, tan accent, higher-contrast tables.
- **Night Watch (dark, adapted)** — the existing dark data-dense feel re-tinted from teal to copper/cream so light and dark share one brand.

Light theme becomes selectable alongside dark; the app is not forced into light-only.

## Sequence

1. Ask you to pick palette, typography pair, and layout direction.
2. Generate the logo mark set and review it with you.
3. Generate three rendered layout prototypes (landing + dashboard) and get your pick.
4. Only then integrate: tokens into `src/styles.css`, new logo component replacing `optimal-logo.tsx`, favicon, and all metadata/titles/og tags across `__root.tsx`, `index.tsx`, `dashboard.tsx`, `stop-loss.tsx`.
5. Publish the style guide PDF to the project files.

## Technical notes

- All colour is defined as oklch design tokens in `src/styles.css` under `:root` (light) and `.dark`, mapped through `@theme inline`. No hardcoded colour utilities in components — the existing `#4ECDC4` teal literals in `optimal-logo.tsx` and `kraken-account-button.tsx` get replaced with tokens.
- New tokens added for brand roles: `--brand-minnie`, `--brand-cooper`, plus existing `--gain`/`--loss` retuned to the new palette.
- A light/dark toggle needs a theme provider; currently the app is dark-by-default with no `.dark` class applied. I'll add a small class-based toggle persisted to localStorage.
- Logo shipped as an inline SVG React component (no CDN asset) so it inherits theme tokens; favicon written as a real square PNG in `public/`.
- Trading/bridge/Kraken logic, auth, and stop-loss behaviour are untouched — this is presentation only.

## Out of scope

- No changes to Kraken credentials, bridge settings, tool discovery, or stop-loss functionality.
- No domain/URL change (canonical URLs will be updated to the current published domain only if you confirm the domain).
