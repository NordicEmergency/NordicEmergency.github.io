# nordicemergency.dk

Website for Nordic Emergency Solutions ApS — training platforms in VR and with AI: disaster/emergency response, first aid/CPR, and difficult conversations (vis-à-vis).

Single-page site, hosted on GitHub Pages, content-driven via JSON. Supports five languages (DA, EN, DE, NO, SV) via small flags in the header.

**Live:** https://nordicemergency.dk

## Sections
- Solutions — the three platforms: disaster & emergency response (VR), first aid & CPR (VR) and vis-à-vis – difficult conversations (AI, beta)
- Academy — training to become a gamemaster/CPR instructor
- Labs — internal R&D environment
- Team — core team and board
- In the Media / Customers — shown only when there's content
- Contact
- Privacy policy and terms — separate pages under `privacy/` and `terms/`

## Structure
```
docs/index.html              Page shell
docs/privacy/, docs/terms/   Legal pages
docs/assets/css/styles.css   Styling
docs/assets/js/common.js     Shared helpers: i18n, theme toggle, language switcher, scroll reveal
docs/assets/js/main.js       Rendering of solutions/team/articles/customers, contact form
docs/locales/*.json          All text per language (da/en/de/no/sv) + config.json (language list)
docs/data/team.json          Team and board members
docs/data/article.json       Press coverage
docs/data/customer.json      Customer list
docs/data/site.json          Company details (email, LinkedIn, CVR, address)
docs/assets/images/          Portraits and photos (promo_004.jpg is the hero photo)
docs/assets/files/           Brochures (PDF) linked from the solution cards
docs/assets/flags/           SVG flags for the language switcher
```

GitHub Pages serves from the `docs/` folder on `main`, at the domain in `docs/CNAME`.

## Editing content
All text lives in `docs/locales/*.json` — no text is hardcoded in the HTML. Team, articles and customers are edited in their respective JSON files under `docs/data/`.

Solution cards are `solutions.items` in each locale file, in the order shown. Besides `title`, `description`, `highlights` and `icon` (`speaking`, `heartbeat` or `video`), a card can have:
- `badge` — a small pill after the title, e.g. "Beta"
- `brochure` — a PDF under `assets/files/`, shown as a download link
- `link` and `link_label` — an external link instead of a brochure
- `visibility: "hidden"` — keeps the card out of the page (also works for team members and customers)

Keep the cards alike: a three-sentence description (what it is, how it runs, what it focuses on) and four short highlights.

## Layout
- The hero puts the text beside a portrait photo. From tablet width each section's title takes the left third and its intro the right two thirds (`--split` in `styles.css`), so text spans the container like the cards below it. Phones get one column.
- Solution cards stand one under the other and fly in from alternating sides as they scroll into view (`NE.reveal` in `common.js`; skipped with reduced motion).

## Deploying
A merge to `main` deploys in about a minute. The CDN caches files for up to 10 minutes (`max-age=600`), and the CSS and JS have no version in their URLs, so a change can take that long to reach every visitor, even with a hard reload.
