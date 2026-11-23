# nordicemergency.dk

Website for Nordic Emergency Solutions ApS — training platforms in VR and with AI: disaster/emergency response, first aid/CPR, and difficult conversations (vis-à-vis).

Static site on GitHub Pages, content-driven via JSON. Every page exists once per language (DA, EN, DE, NO, SV), so search engines and AI assistants read the text without running JavaScript. The flags in the header link between the languages.

**Live:** https://nordicemergency.dk

## Sections
- Solutions — the three platforms: disaster & emergency response (VR), first aid & CPR (VR) and vis-à-vis – difficult conversations (AI, beta)
- Academy — training to become a gamemaster/CPR instructor
- Labs — internal R&D environment
- Team — core team and board
- In the Media / Customers — shown only when there's content
- Contact
- Privacy policy and terms — separate pages under `privacy/` and `terms/` (rendered in the browser, noindex)

## Pages and URLs
| Page | Danish (default) | Other languages |
|---|---|---|
| Front page | `/` | `/en/`, `/de/`, `/no/`, `/sv/` |
| vis-à-vis | `/vis-a-vis/` | `/en/vis-a-vis/`, … |
| System status | `/status/` | `/en/status/`, … |

Each page has its own title, description, canonical, hreflang alternates, Open Graph tags and JSON-LD (Organization; on vis-à-vis also SoftwareApplication and FAQPage). `sitemap.xml` and `robots.txt` are generated too. Old `?lang=xx` links and a flag chosen on an earlier visit send the visitor to that language's page; search engines keep no choice, so they stay on the page they asked for.

## Structure
```
tools/build.mjs              Generator: writes every page below from locales + data (no dependencies)
docs/index.html, docs/*/     Generated pages: do not edit by hand
docs/privacy/, docs/terms/   Legal pages
docs/assets/css/styles.css   Styling
docs/assets/js/common.js     Shared helpers: i18n, theme toggle, language switcher, scroll reveal
docs/assets/js/main.js       Behaviour on the generated pages: tabs, contact form, language choice
docs/locales/*.json          All text per language (da/en/de/no/sv) + config.json (language list)
docs/data/team.json          Team and board members
docs/data/article.json       Press coverage
docs/data/customer.json      Customer list
docs/data/site.json          Company details (email, LinkedIn, CVR, address)
docs/data/status.json        Services on the status page and the URLs they are checked on
worker/                      Status worker (Cloudflare): checks the services, serves status.json
docs/assets/images/          Portraits and photos (promo_004.jpg is the hero photo)
docs/assets/files/           Brochures (PDF) linked from the solution cards
docs/assets/customers/       Customer logos (SVG, or PNG with transparent background trimmed to the logo)
docs/assets/flags/           SVG flags for the language switcher
```

GitHub Pages serves from the `docs/` folder on `main`, at the domain in `docs/CNAME`.

## System status
`/status/` shows whether vis-à-vis, sign-in, NES Online and this site are up, Apple System Status style, with 90 days of history and the latest incidents. The services and the URLs they are checked on are in `docs/data/status.json`; their names and descriptions are `status.services` in each locale.

The checks run in a Cloudflare Worker, `worker/` (`nes-status` on the account that holds nordicemergency.dk, on its own custom domain status-api.nordicemergency.dk; workers.dev is off), on a cron trigger every 5 minutes. GitHub's scheduled workflows were tried first and dropped: in this organisation they start 7–9 hours late or not at all. A probe passes on a 2xx answer within 10 s and a failed probe is retried once; a service is ok when all its probes pass, down when none does, degraded otherwise or when slower than 5 s. A worse state is only shown when two checks in a row agree (about 10 minutes), since cron runs on whichever Cloudflare machine is free, sometimes far away; a recovery shows at once, and an incident starts at the first failed check. The result, `status.json` with the current state, a count per day for 90 days and the latest incidents, is kept in the Worker's KV namespace and served at `https://status-api.nordicemergency.dk/status.json`. `docs/assets/js/status.js` fetches it and refreshes every minute; the footer dot on every page reads it too. If the data is more than 30 minutes old, the page says so instead of showing green.

The Worker imports `docs/data/status.json`, so a change to the services needs a deploy as well as a Pages build:

```
cd worker
CLOUDFLARE_API_TOKEN=$(cat ~/.config/cloudflare-token) npx wrangler deploy
```

Logs: `npx wrangler tail` from `worker/`, or Workers & Pages → nes-status → Logs in the Cloudflare dashboard.

To add a service: add it to `docs/data/status.json` and to `status.services` in all five locales, run `node tools/build.mjs`, and deploy the Worker.

## Editing content
All text lives in `docs/locales/*.json` — no text is hardcoded in the generator. After any change to `docs/locales/` or `docs/data/`, run

```
node tools/build.mjs
```

and commit the generated pages with it; CI fails a pull request whose pages are out of date. The vis-à-vis page's texts are `visavis` in each locale, and each page's title and description are `meta` (front page) and `visavis.meta_title` / `visavis.meta_description`. A card `link` that starts with `/` is a page on this site and gets the language's prefix. Team, articles and customers are edited in their respective JSON files under `docs/data/`. A customer with `logo` set is shown as its logo on a light tile (also in dark mode, since logos are drawn for light backgrounds), with the name as alt text and tooltip; without `logo` the name is shown as text.

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
