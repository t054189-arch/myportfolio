# Bloom — specialty coffee, Kuwait

A static, bilingual (English / Arabic) site for Bloom, a specialty coffee shop
in Salmiya, Kuwait. Filter and espresso in the café; beans by origin, brewing
tools and machines online.

Plain HTML, CSS and vanilla JavaScript — no framework, no build step, no npm.

## Running it

Open `index.html` in a browser. That is all it needs; there is nothing to
install and nothing to compile. Deploying to GitHub Pages or Netlify means
serving this directory as-is.

### GitHub Pages

Repository → Settings → Pages → Source "Deploy from a branch", pick this
branch and the `/ (root)` folder. Every path in the site is relative, so it
works from a project subpath such as `/myportfolio/` without changes, and
`.nojekyll` keeps Jekyll from touching the static files.

## Layout

| Path | What it is |
| --- | --- |
| `index.html` | home — hero, bloom timer, featured beans, café teaser |
| `beans.html` `tools.html` `machines.html` | filterable product listings |
| `product.html?id=…` | one product, driven by the query string |
| `brew-guides.html` | V60, French press and espresso recipes |
| `cafe.html` | address, hours, what is on the bar |
| `cart.html` | the full cart (a slide-in drawer is on every page) |
| `css/tokens.css` | every colour, typeface, space and radius in the design |
| `css/base.css` | reset, typography, layout primitives |
| `css/components.css` | header, cards, buttons, tags, brew block, footer |
| `js/data.js` | the catalogue, menus, recipes and café details |
| `js/i18n.js` | language switching |
| `js/cart.js` | cart state in `localStorage` |
| `js/main.js` | header, theme, cart drawer, page rendering |
| `assets/` | flat SVG illustrations, drawn in the palette |
| `portfolio/` | an unrelated earlier site, kept out of the way |

## Notes for whoever picks this up

- **Colour lives in one file.** `css/tokens.css` holds every literal; no other
  stylesheet contains a hex value. Dark theme redefines the tokens only.
- **The header and footer are built once** in `js/main.js` and injected on
  every page, so they cannot drift apart.
- **Static copy is translated through `data-en` / `data-ar` attributes**;
  product copy through `{ en, ar }` pairs in `js/data.js`. Adding a language
  string means adding both halves.
- **Arabic mirrors the whole page** (`dir="rtl"` on `<html>`), so styles use
  logical properties — `margin-inline-start`, `inset-inline-end`, `text-align:
  start`. The two exceptions are measurements and time ranges, which are
  pinned left-to-right on purpose so `0:00–0:30` never reverses.
- **Theme and language choices** are stored in `localStorage` (`bloom.theme`,
  `bloom.lang`) and restored by a small inline script in each `<head>` before
  the first paint. Every read and write is wrapped in `try` / `catch`.
- The bloom timer is the only animation on the site, and it stops swelling
  under `prefers-reduced-motion: reduce`.
