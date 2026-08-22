# NordicEmergency.com

Website for Nordic Emergency ApS — VR platforms for disaster/emergency response training and first aid/CPR simulation.

Single-page site, hosted on GitHub Pages, content-driven via JSON. Supports five languages (DA, EN, DE, NO, SV) via small flags in the header.

**Live:** https://nordicemergency.github.io/

## Sections
- Solutions — the two VR platforms
- Academy — training to become a gamemaster/CPR instructor
- Labs — internal R&D environment
- Team — core team and board
- In the Media / Customers — shown only when there's content
- Contact

## Structure
```
docs/index.html             Page shell
docs/assets/css/             Styling
docs/assets/js/main.js       i18n loader, rendering of team/articles/customers, language switcher
docs/locales/*.json          All text per language (da/en/de/no/sv) + config.json (language list)
docs/data/team.json          Team and board members
docs/data/article.json       Press coverage
docs/data/customer.json      Customer list
docs/data/site.json          Company details (email, LinkedIn, CVR, address)
docs/assets/images/          Portraits etc.
docs/assets/flags/           SVG flags for the language switcher
```

GitHub Pages serves from the `docs/` folder on `main`.

## Editing content
All text lives in `docs/locales/*.json` — no text is hardcoded in the HTML. Team, articles and customers are edited in their respective JSON files under `docs/data/`.
