# NordicEmergency.com

Hjemmeside for Nordic Emergency ApS — VR-platforme til katastrofe-/beredskabstræning og førstehjælp/HLR-simulation.

Enkeltsides site, hostet på GitHub Pages, datastyret via JSON. Understøtter fem sprog (DA, EN, DE, NO, SV) via små flag i headeren.

**Live:** https://nordicemergency.github.io/

## Sektioner
- Solutions — de to VR-platforme
- Academy — uddannelse til gamemaster/HLR-instruktør
- Labs — internt udviklingsmiljø
- Team — kerneteam og bestyrelse
- I medierne / Kunder — vises kun når der er indhold
- Contact

## Struktur
```
index.html            Sideskelet
assets/css/            Styling
assets/js/main.js      i18n-loader, rendering af team/artikler/kunder, sprogvælger
locales/*.json         Al tekst pr. sprog (da/en/de/no/sv) + config.json (sprogliste)
data/team.json         Team- og bestyrelsesmedlemmer
data/article.json      Presseomtale
data/customer.json     Kundeliste
data/site.json         Firmaoplysninger (email, LinkedIn, CVR, adresse)
assets/images/         Portrætter mv.
assets/flags/          SVG-flag til sprogvælger
```

## Redigering af indhold
Al tekst ligger i `locales/*.json` — ingen tekst er hardkodet i HTML'en. Team, artikler og kunder redigeres i de tilhørende JSON-filer i `data/`.
