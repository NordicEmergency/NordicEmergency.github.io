(function () {
  "use strict";

  function renderSections(dict, site) {
    var wrap = document.getElementById("privacy-sections");
    if (!wrap) return;
    var privacy = dict.privacy || {};
    var sections = privacy.sections || [];
    var html = sections
      .map(function (section) {
        var paragraphs = (section.paragraphs || [])
          .map(function (p) { return "<p>" + p + "</p>"; })
          .join("");
        var items = section.items && section.items.length
          ? "<ul>" + section.items.map(function (i) { return "<li>" + i + "</li>"; }).join("") + "</ul>"
          : "";
        return (
          '<div class="legal-section"><h2>' + section.heading + "</h2>" + paragraphs + items + "</div>"
        );
      })
      .join("");

    if (privacy.contact_heading && site && site.privacyEmail) {
      var email = site.privacyEmail;
      var emailLink =
        ' <a id="privacy-contact-email" href="mailto:' + email + '">' + email + "</a>";
      html +=
        '<div class="legal-section"><h2>' + privacy.contact_heading + "</h2><p>" +
        (privacy.contact_text || "") + emailLink + "</p></div>";
    }

    wrap.innerHTML = html;
  }

  function applySiteData(site) {
    var linkedinEl = document.getElementById("footer-linkedin");
    if (linkedinEl && site.linkedin) linkedinEl.href = site.linkedin;

    var discordEl = document.getElementById("footer-discord");
    if (discordEl && site.discord) discordEl.href = site.discord;

    var companyEl = document.getElementById("footer-company");
    if (companyEl && site.company) companyEl.textContent = site.company;

    var metaEl = document.getElementById("footer-meta");
    if (metaEl) {
      var parts = [];
      if (site.CVR) parts.push("CVR " + site.CVR);
      if (site.address) parts.push(site.address);
      metaEl.textContent = parts.join(" · ");
    }
  }

  function loadLang(lang, config, site) {
    NE.fetchJSON("../locales/" + lang + ".json", {}).then(function (dict) {
      document.documentElement.lang = lang;
      NE.applyTranslations(dict);
      renderSections(dict, site);
      NE.renderLangSwitcher(config, lang, "../assets/flags/", function (newLang) {
        NE.storeLang(newLang);
        NE.setLangInUrl(newLang);
        loadLang(newLang, config, site);
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    NE.initThemeToggle();

    Promise.all([
      NE.fetchJSON("../locales/config.json", { default: "en", languages: [{ code: "en", flag: "gb", label: "English" }] }),
      NE.fetchJSON("../data/site.json", {})
    ]).then(function (results) {
      var config = results[0];
      var siteData = results[1];
      applySiteData(siteData);
      var lang = NE.detectLang(config);
      loadLang(lang, config, siteData);
    });
  });
})();
