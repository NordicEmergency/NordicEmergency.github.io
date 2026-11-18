#!/usr/bin/env node
// Builds the site's pages as static HTML, one copy per language, from docs/locales and docs/data:
//   /            /en/  /de/  /no/  /sv/              the front page (Danish at the root, config.json's default)
//   /vis-a-vis/  /en/vis-a-vis/  ...                 the vis-à-vis page
// plus sitemap.xml (with hreflang alternates) and robots.txt. Search engines and AI assistants read
// the text without running JavaScript; main.js only adds behaviour. No dependencies: node tools/build.mjs
// The privacy and terms pages are still rendered in the browser (privacy.js, terms.js) and stay noindex.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DOCS = path.join(ROOT, 'docs')
const read = (p) => JSON.parse(fs.readFileSync(path.join(DOCS, p), 'utf8'))

const config = read('locales/config.json')
const site = read('data/site.json')
const team = read('data/team.json')
const articles = read('data/article.json')
const customers = read('data/customer.json')
const dicts = Object.fromEntries(config.languages.map((l) => [l.code, read(`locales/${l.code}.json`)]))
const BASE = 'https://' + fs.readFileSync(path.join(DOCS, 'CNAME'), 'utf8').trim()
const APP_URL = 'https://vis-a-vis.nordicemergency.dk'
const HERO_IMAGE = '/assets/images/promo_004.jpg'

// Open Graph wants language_TERRITORY.
const OG_LOCALE = { da: 'da_DK', en: 'en_GB', de: 'de_DE', no: 'nb_NO', sv: 'sv_SE' }

const PAGES = { home: '', visavis: 'vis-a-vis/' }

const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const visible = (x) => x.visibility !== 'hidden'
const prefix = (lang) => (lang === config.default ? '/' : `/${lang}/`)
const pageUrl = (lang, page) => prefix(lang) + PAGES[page]
/** A locale link starting with / is a page on this site, in the same language. */
const localLink = (lang, link) => (link.startsWith('/') ? prefix(lang) + link.slice(1) : link)
const isExternal = (link) => /^https?:/.test(link)

// ---------- Icons (as in the old main.js) ----------

const SOLUTION_ICONS = {
  speaking:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="7" r="3"></circle><path d="M2 21v-2a6 6 0 0 1 6-6h0a6 6 0 0 1 4 1.5"></path><path d="M15.5 8.5a3 3 0 0 1 0 4"></path><path d="M18.5 6.5a6 6 0 0 1 0 8"></path></svg>',
  heartbeat:
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-6.7-4.35-9.33-8.2C.87 10.1 1.4 6.6 4.2 5.1c2.3-1.24 5-.5 6.3 1.4l1.5 2.2 1.5-2.2c1.3-1.9 4-2.64 6.3-1.4 2.8 1.5 3.33 5 1.53 7.7C18.7 16.65 12 21 12 21z"></path></svg>',
  video:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="14" height="12" rx="2"></rect><path d="M16 10l6-3v10l-6-3z"></path></svg>',
}
const DOWNLOAD_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>'
const EXTERNAL_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>'
const ARROW_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>'
const DOC_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line></svg>'
const ARTICLE_ARROW =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>'
const LOGIN_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>'
const SUN_MOON =
  '<svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path></svg>\n      <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>'
const LINKEDIN_ICON =
  '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>'
const DISCORD_ICON =
  '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>'

// ---------- Structured data ----------

function postalAddress() {
  // "Banegårdsgade 2, 8700 Horsens"
  const m = /^(.*),\s*(\d{4})\s+(.+)$/.exec(site.address || '')
  return m
    ? { '@type': 'PostalAddress', streetAddress: m[1], postalCode: m[2], addressLocality: m[3], addressCountry: 'DK' }
    : undefined
}

const ORG_ID = `${BASE}/#organization`
const organization = () => ({
  '@type': 'Organization',
  '@id': ORG_ID,
  name: site.company,
  alternateName: 'Nordic Emergency Solutions',
  url: `${BASE}/`,
  logo: `${BASE}/assets/icons/badge.png`,
  email: site.email,
  address: postalAddress(),
  vatID: site.CVR ? 'DK' + site.CVR.replace(/\s+/g, '') : undefined,
  sameAs: [site.linkedin].filter(Boolean),
})

// ---------- Layout ----------

/** Sends a visitor to their language: ?lang=xx from old links, else the flag they chose last. Search engines keep no choice, so they stay. */
function langScript(lang, page) {
  const alternates = Object.fromEntries(config.languages.map((l) => [l.code, pageUrl(l.code, page)]))
  return `(function () {
  try {
    var stored = localStorage.getItem("ne_theme");
    if (stored === "light" || stored === "dark") document.documentElement.setAttribute("data-theme", stored);
  } catch (e) {}
  var pages = ${JSON.stringify(alternates)};
  var want = null;
  try { want = new URLSearchParams(location.search).get("lang"); } catch (e) {}
  if (!want) { try { want = localStorage.getItem("ne_lang"); } catch (e) {} }
  if (want) want = want.toLowerCase();
  if (want && want !== ${JSON.stringify(lang)} && pages[want]) location.replace(pages[want] + location.hash);
})();`
}

function head({ lang, page, title, description, image, jsonLd }) {
  const canonical = BASE + pageUrl(lang, page)
  const alternates = config.languages
    .map((l) => `<link rel="alternate" hreflang="${l.code}" href="${BASE + pageUrl(l.code, page)}">`)
    .concat(`<link rel="alternate" hreflang="x-default" href="${BASE + pageUrl(config.default, page)}">`)
    .join('\n')
  return `<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
${alternates}
<meta property="og:type" content="website">
<meta property="og:site_name" content="Nordic Emergency Solutions">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:locale" content="${OG_LOCALE[lang] || lang}">
<meta property="og:image" content="${esc(image)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/png" href="/assets/icons/badge.png">
<link rel="stylesheet" href="/assets/css/styles.css">
<script>
${langScript(lang, page)}
</script>
<script type="application/ld+json">
${JSON.stringify({ '@context': 'https://schema.org', '@graph': jsonLd }, null, 1)}
</script>
</head>`
}

function header(lang, dict, page) {
  const home = pageUrl(lang, 'home')
  const anchor = (id) => (page === 'home' ? `#${id}` : `${home}#${id}`)
  const nav = ['solutions', 'academy', 'labs', 'team', 'contact']
    .map((id) => `        <li><a href="${anchor(id)}">${esc(dict.nav[id])}</a></li>`)
    .join('\n')
  const flags = config.languages
    .map((l) => {
      const active = l.code === lang
      return `<a href="${pageUrl(l.code, page)}" hreflang="${l.code}" lang="${l.code}" data-lang="${l.code}"${active ? ' class="active" aria-current="true"' : ''} title="${esc(l.label)}"><img src="/assets/flags/${l.flag}.svg" alt="${esc(l.label)}"></a>`
    })
    .join('')
  return `<header class="site-header">
  <div class="container header-inner">
    <a class="brand" href="${home}">
      <img class="brand-mark" src="/assets/icons/badge.png" alt="">
      <span class="brand-name">${esc(dict.hero.title)}</span>
    </a>

    <nav class="site-nav" aria-label="Main">
      <ul>
${nav}
      </ul>
    </nav>

    <div class="lang-switcher" id="lang-switcher" aria-label="Language">${flags}</div>

    <a class="login-link header-icon-btn" href="https://portal.nordicemergency.com/Login" aria-label="${esc(dict.nav.login)}" title="${esc(dict.nav.login)}">
      ${LOGIN_ICON}
    </a>

    <button id="theme-toggle" class="theme-toggle header-icon-btn" type="button" aria-pressed="false" aria-label="Toggle dark mode">
      ${SUN_MOON}
    </button>
  </div>
</header>`
}

function footer(lang, dict) {
  const meta = [site.CVR && `CVR ${site.CVR}`, site.address].filter(Boolean).join(' · ')
  return `<footer class="site-footer">
  <div class="container footer-inner">
    <div>
      <p>&copy; <span id="year"></span> <span id="footer-company">${esc(site.company)}</span></p>
      <p class="footer-meta" id="footer-meta">${esc(meta)}</p>
    </div>
    <div class="footer-links">
      ${site.linkedin ? `<a id="footer-linkedin" class="footer-icon-link" href="${esc(site.linkedin)}" target="_blank" rel="noopener" aria-label="LinkedIn">\n        ${LINKEDIN_ICON}\n      </a>` : ''}
      ${site.discord ? `<a id="footer-discord" class="footer-icon-link" href="${esc(site.discord)}" target="_blank" rel="noopener" aria-label="Discord">\n        ${DISCORD_ICON}\n      </a>` : ''}
      <a href="${pageUrl(lang, 'visavis')}">vis-à-vis</a>
      <a href="/privacy/">${esc(dict.footer.privacy)}</a>
    </div>
  </div>
</footer>`
}

function document_({ lang, dict, page, title, description, image, jsonLd, main }) {
  return `<!DOCTYPE html>
<!-- Generated by tools/build.mjs from docs/locales and docs/data: edit those, then run node tools/build.mjs. -->
<html lang="${lang}">
${head({ lang, page, title, description, image, jsonLd })}
<body>

${header(lang, dict, page)}

<main id="top">
${main}
</main>

${footer(lang, dict)}

<script src="/assets/js/common.js"></script>
<script src="/assets/js/main.js"></script>
</body>
</html>
`
}

// ---------- Front page ----------

function solutionCard(lang, dict, item) {
  const highlights = item.highlights?.length ? '<ul>' + item.highlights.map((h) => `<li>${esc(h)}</li>`).join('') + '</ul>' : ''
  const iconSvg = SOLUTION_ICONS[item.icon]
  const iconClass = 'card-icon' + (item.icon === 'heartbeat' ? ' card-icon-heartbeat' : '')
  const icon = iconSvg ? `<span class="${iconClass}">${iconSvg}</span>` : ''
  const badge = item.badge ? `<span class="card-badge">${esc(item.badge)}</span>` : ''
  let link = ''
  if (item.brochure) {
    link = `<a class="card-brochure" href="/${esc(item.brochure)}" target="_blank" rel="noopener">${DOWNLOAD_ICON}${esc(dict.solutions.brochure_label || 'PDF')}</a>`
  } else if (item.link) {
    const href = localLink(lang, item.link)
    link = isExternal(href)
      ? `<a class="card-brochure" href="${esc(href)}" target="_blank" rel="noopener">${EXTERNAL_ICON}${esc(item.link_label || href)}</a>`
      : `<a class="card-brochure" href="${esc(href)}">${ARROW_ICON}${esc(item.link_label || href)}</a>`
  }
  return `<div class="card"><h3>${icon}${esc(item.title)}${badge}</h3><p>${esc(item.description)}</p>${highlights}${link}</div>`
}

const initials = (name) => name.split(' ').map((p) => p.charAt(0)).join('').slice(0, 2).toUpperCase()

function person(p, title, bio) {
  const links = []
  if (typeof p.mobile === 'string' && /^\+?[0-9\s]{6,}$/.test(p.mobile.trim())) {
    links.push(`<a href="tel:${p.mobile.replace(/\s+/g, '')}">${esc(p.mobile)}</a>`)
  }
  if (p.linkedin) links.push(`<a href="${esc(p.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>`)
  const personClass = p.placeholder ? 'person person-placeholder' : 'person'
  const avatarClass = p.placeholder ? 'avatar avatar-placeholder' : 'avatar'
  const avatar = p.image
    ? `<div class="${avatarClass} avatar-photo"><img src="/${esc(p.image)}" alt="" data-fallback="${initials(p.name)}"></div>`
    : `<div class="${avatarClass}">${initials(p.name)}</div>`
  return (
    `<div class="${personClass}">${avatar}<h3>${esc(p.name)}</h3>` +
    (title ? `<p>${esc(title)}</p>` : '') +
    (bio ? `<p class="person-bio">${esc(bio)}</p>` : '') +
    (links.length ? `<p class="person-links">${links.join(' · ')}</p>` : '') +
    '</div>'
  )
}

function teamSection(dict) {
  const coreTitles = dict.team?.core || {}
  const core = team.core.filter(visible).map((p) => person(p, coreTitles[p.id]?.title, coreTitles[p.id]?.bio)).join('')
  const boardDict = dict.team?.board || {}
  const board = team.board.filter(visible)
  const boardHidden = boardDict.visibility === 'hidden' || board.length === 0
  const boardHtml = board.map((p) => person(p, boardDict[p.id]?.title || boardDict.placeholder_title || '')).join('')
  return `  <section id="team" class="section section-alt">
    <div class="container">
      <h2>${esc(dict.nav.team)}</h2>
      <div class="section-rule"></div>
      <div class="tabs" role="tablist"${boardHidden ? ' hidden' : ''}>
        <button class="tab-btn active" role="tab" aria-selected="true" data-tab="core">${esc(dict.team.tabs.core)}</button>
        <button class="tab-btn" role="tab" aria-selected="false" data-tab="board"${boardHidden ? ' hidden' : ''}>${esc(dict.team.tabs.board)}</button>
      </div>
      <div class="people" id="team-core" role="tabpanel">${core}</div>
      <div class="people" id="team-board" role="tabpanel" hidden>${boardHtml}</div>
    </div>
  </section>`
}

function pressSection(lang, dict) {
  if (!articles.length) return ''
  const fmt = new Intl.DateTimeFormat(lang, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
  const list = articles
    .map((a) => {
      const meta = [a.source, a.date ? fmt.format(new Date(a.date)) : ''].filter(Boolean).join(' · ')
      return (
        `<a class="article-card" href="${esc(a.url)}" target="_blank" rel="noopener">` +
        `<span class="article-ico">${DOC_ICON}</span><span class="article-body">` +
        `<span class="article-title">${esc(a.title)}</span>` +
        (meta ? `<span class="article-meta">${esc(meta)}</span>` : '') +
        `</span><span class="article-arrow">${ARTICLE_ARROW}</span></a>`
      )
    })
    .join('')
  return `  <section id="press" class="section">
    <div class="container">
      <h2>${esc(dict.press.heading)}</h2>
      <div class="section-rule"></div>
      <div class="article-list" id="article-list">${list}</div>
    </div>
  </section>`
}

function customersSection(dict) {
  const shown = customers.filter(visible)
  if (!shown.length) return ''
  const list = shown
    .map((c) => {
      const inner = c.logo ? `<img src="/${esc(c.logo)}" alt="${esc(c.name)}">` : `<span>${esc(c.name)}</span>`
      let cls = 'customer-logo'
      if (c.logo) cls += ' customer-logo-image'
      if (c.placeholder) cls += ' customer-logo-placeholder'
      const title = c.logo ? ` title="${esc(c.name)}"` : ''
      return c.url
        ? `<a class="${cls}"${title} href="${esc(c.url)}" target="_blank" rel="noopener">${inner}</a>`
        : `<div class="${cls}"${title}>${inner}</div>`
    })
    .join('')
  return `  <section id="customers" class="section section-alt">
    <div class="container">
      <h2>${esc(dict.customers.heading)}</h2>
      <div class="section-rule"></div>
      <div class="customer-list" id="customer-list">${list}</div>
    </div>
  </section>`
}

function contactSection(dict) {
  const f = dict.contact.form
  const options = (f.subject_options || []).map((o) => `<option>${esc(o)}</option>`).join('')
  return `  <section id="contact" class="section">
    <div class="container">
      <h2>${esc(dict.nav.contact)}</h2>
      <div class="section-rule"></div>
      <p>${esc(dict.contact.description)}</p>

      <form id="contact-form" class="contact-form" novalidate>
        <div class="form-row">
          <div class="field">
            <label for="cf-name">${esc(f.name_label)}</label>
            <input id="cf-name" name="name" type="text" placeholder="${esc(f.name_placeholder)}" required>
          </div>
          <div class="field">
            <label for="cf-email">${esc(f.email_label)}</label>
            <input id="cf-email" name="email" type="email" placeholder="${esc(f.email_placeholder)}" required>
          </div>
        </div>
        <div class="field">
          <label for="cf-subject">${esc(f.subject_label)}</label>
          <select id="cf-subject" name="subject">${options}</select>
        </div>
        <div class="field">
          <label for="cf-message">${esc(f.message_label)}</label>
          <textarea id="cf-message" name="message" rows="5" placeholder="${esc(f.message_placeholder)}" required></textarea>
        </div>
        <button type="submit" class="btn-primary">${esc(f.submit)}</button>
      </form>

      <p class="contact-email">
        <span>${esc(dict.contact.email_label)}</span>:
        <a id="contact-email" href="mailto:${esc(site.email)}">${esc(site.email)}</a>
      </p>
    </div>
  </section>`
}

function homePage(lang) {
  const dict = dicts[lang]
  const cards = dict.solutions.items.filter(visible).map((i) => solutionCard(lang, dict, i)).join('')
  const main = `
  <section class="hero">
    <div class="container hero-grid">
      <div class="hero-text">
        <h1>${esc(dict.hero.title)}</h1>
        <p class="tagline">${esc(dict.hero.tagline)}</p>
        <p class="hero-lead">${esc(dict.hero.lead)}</p>
        <div class="hero-actions">
          <a class="pill-button" href="#contact">${esc(dict.nav.contact)}</a>
        </div>
      </div>
      <img class="hero-photo" src="${HERO_IMAGE}" alt="">
    </div>
  </section>

  <section id="solutions" class="section">
    <div class="container">
      <h2>${esc(dict.nav.solutions)}</h2>
      <div class="section-rule"></div>
      <p class="section-intro">${esc(dict.solutions.intro)}</p>
      <div class="cards" id="solutions-list">${cards}</div>
    </div>
  </section>

  <section id="gallery" class="section">
    <div class="container">
      <div class="gallery-grid">
        <div class="gallery-item"><img src="/assets/images/promo_001.jpg" alt=""></div>
        <div class="gallery-item"><img src="/assets/images/promo_002.jpg" alt=""></div>
        <div class="gallery-item"><img src="/assets/images/promo_003.jpg" alt=""></div>
      </div>
    </div>
  </section>

  <section id="academy" class="section section-alt">
    <div class="container">
      <h2>${esc(dict.nav.academy)}</h2>
      <div class="section-rule"></div>
      <p>${esc(dict.academy.description)}</p>
    </div>
  </section>

  <section id="labs" class="section">
    <div class="container">
      <h2>${esc(dict.nav.labs)}</h2>
      <div class="section-rule"></div>
      <p>${esc(dict.labs.description)}</p>
    </div>
  </section>

${teamSection(dict)}

${pressSection(lang, dict)}

${customersSection(dict)}

${contactSection(dict)}
`
  const jsonLd = [
    organization(),
    { '@type': 'WebSite', '@id': `${BASE}/#website`, url: `${BASE}/`, name: 'Nordic Emergency Solutions', publisher: { '@id': ORG_ID }, inLanguage: config.languages.map((l) => l.code) },
  ]
  return document_({
    lang, dict, page: 'home', main, jsonLd,
    title: dict.meta.title,
    description: dict.meta.description,
    image: BASE + HERO_IMAGE,
  })
}

// ---------- vis-à-vis ----------

function visavisPage(lang) {
  const dict = dicts[lang]
  const v = dict.visavis
  const contactUrl = `${pageUrl(lang, 'home')}#contact`
  const steps = v.how.steps
    .map((s, i) => `<div class="card"><span class="step-number">${esc(v.how.step_label)} ${i + 1}</span><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></div>`)
    .join('')
  const features = v.features.items.map((f) => `<div class="card"><h3>${esc(f.title)}</h3><p>${esc(f.text)}</p></div>`).join('')
  const faq = v.faq.items.map((f) => `<div class="faq-item"><h3>${esc(f.q)}</h3><p>${esc(f.a)}</p></div>`).join('')
  const main = `
  <section class="hero">
    <div class="container hero-grid hero-grid--text">
      <div class="hero-text">
        <span class="eyebrow">${esc(v.badge)}</span>
        <h1>${esc(v.heading)}</h1>
        <p class="tagline">${esc(v.tagline)}</p>
        <p class="hero-lead">${esc(v.lead)}</p>
        ${v.language_note ? `<p class="hero-note">${esc(v.language_note)}</p>` : ''}
        <div class="hero-actions">
          <a class="pill-button" href="${contactUrl}">${esc(v.cta_contact)}</a>
          <a class="pill-button secondary" href="${APP_URL}">${esc(v.cta_app)}</a>
        </div>
      </div>
    </div>
  </section>

  <section id="how" class="section">
    <div class="container">
      <h2>${esc(v.how.heading)}</h2>
      <p>${esc(v.how.intro)}</p>
      <div class="steps">${steps}</div>
    </div>
  </section>

  <section id="audience" class="section section-alt">
    <div class="container">
      <h2>${esc(v.audience.heading)}</h2>
      <p>${esc(v.audience.text)}</p>
    </div>
  </section>

  <section id="features" class="section">
    <div class="container">
      <h2>${esc(v.features.heading)}</h2>
      <p>${esc(v.features.intro)}</p>
      <div class="steps steps--pairs">${features}</div>
    </div>
  </section>

  <section id="security" class="section section-alt">
    <div class="container">
      <h2>${esc(v.security.heading)}</h2>
      <p>${esc(v.security.text)}</p>
      <p><a href="${APP_URL}/sikkerhed">${esc(v.security.link_label)}</a></p>
    </div>
  </section>

  <section id="faq" class="section">
    <div class="container">
      <h2>${esc(v.faq.heading)}</h2>
      <div class="faq">${faq}</div>
    </div>
  </section>

  <section id="contact" class="section section-alt">
    <div class="container">
      <h2>${esc(v.contact.heading)}</h2>
      <p>${esc(v.contact.text)}</p>
      <p><a class="pill-button" href="${contactUrl}">${esc(v.contact.button)}</a></p>
    </div>
  </section>
`
  const url = BASE + pageUrl(lang, 'visavis')
  const jsonLd = [
    organization(),
    {
      '@type': 'SoftwareApplication',
      '@id': `${BASE}/vis-a-vis/#software`,
      name: 'vis-à-vis',
      url: APP_URL,
      description: v.meta_description,
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Web browser',
      inLanguage: 'da',
      publisher: { '@id': ORG_ID },
    },
    {
      '@type': 'FAQPage',
      '@id': `${url}#faq`,
      url,
      inLanguage: lang,
      mainEntity: v.faq.items.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ]
  return document_({
    lang, dict, page: 'visavis', main, jsonLd,
    title: v.meta_title,
    description: v.meta_description,
    image: `${APP_URL}/og-image.png`,
  })
}

// ---------- Output ----------

function write(rel, content) {
  const file = path.join(DOCS, rel)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, content)
}

for (const { code } of config.languages) {
  write(path.join(pageUrl(code, 'home'), 'index.html'), homePage(code))
  write(path.join(pageUrl(code, 'visavis'), 'index.html'), visavisPage(code))
}

const sitemapEntries = Object.keys(PAGES)
  .flatMap((page) =>
    config.languages.map((l) => {
      const links = config.languages
        .map((a) => `    <xhtml:link rel="alternate" hreflang="${a.code}" href="${BASE + pageUrl(a.code, page)}"/>`)
        .join('\n')
      return `  <url>\n    <loc>${BASE + pageUrl(l.code, page)}</loc>\n${links}\n  </url>`
    }),
  )
  .join('\n')
write(
  'sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${sitemapEntries}
</urlset>
`,
)
write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${BASE}/sitemap.xml\n`)

console.log(`Built ${config.languages.length * Object.keys(PAGES).length} pages, sitemap.xml and robots.txt`)
