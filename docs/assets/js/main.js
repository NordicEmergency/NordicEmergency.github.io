(function () {
  "use strict";

  var LANG_STORAGE_KEY = "ne_lang";
  var THEME_STORAGE_KEY = "ne_theme";

  function fetchJSON(url, fallback) {
    return fetch(url)
      .then(function (res) { return res.json(); })
      .catch(function (err) {
        console.warn("Failed to load " + url + ", using fallback.", err);
        return fallback;
      });
  }

  function getByPath(obj, path) {
    return path.split(".").reduce(function (acc, key) {
      return acc && acc[key] !== undefined ? acc[key] : undefined;
    }, obj);
  }

  function applyTranslations(dict) {
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var value = getByPath(dict, el.getAttribute("data-i18n"));
      if (typeof value === "string") el.textContent = value;
    });
  }

  var SOLUTION_ICONS = {
    speaking:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="7" r="3"></circle><path d="M2 21v-2a6 6 0 0 1 6-6h0a6 6 0 0 1 4 1.5"></path><path d="M15.5 8.5a3 3 0 0 1 0 4"></path><path d="M18.5 6.5a6 6 0 0 1 0 8"></path></svg>',
    heartbeat:
      '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-6.7-4.35-9.33-8.2C.87 10.1 1.4 6.6 4.2 5.1c2.3-1.24 5-.5 6.3 1.4l1.5 2.2 1.5-2.2c1.3-1.9 4-2.64 6.3-1.4 2.8 1.5 3.33 5 1.53 7.7C18.7 16.65 12 21 12 21z"></path></svg>'
  };

  function renderSolutions(dict) {
    var list = document.getElementById("solutions-list");
    if (!list) return;
    var items = (dict.solutions && dict.solutions.items) || [];
    list.innerHTML = items
      .map(function (item) {
        var highlights = item.highlights && item.highlights.length
          ? "<ul>" + item.highlights.map(function (h) { return "<li>" + h + "</li>"; }).join("") + "</ul>"
          : "";
        var iconSvg = SOLUTION_ICONS[item.icon];
        var iconClass = "card-icon" + (item.icon === "heartbeat" ? " card-icon-heartbeat" : "");
        var icon = iconSvg ? '<span class="' + iconClass + '">' + iconSvg + "</span>" : "";
        return (
          '<div class="card"><h3>' +
          icon +
          item.title +
          "</h3><p>" +
          item.description +
          "</p>" +
          highlights +
          "</div>"
        );
      })
      .join("");
  }

  function initials(name) {
    return name
      .split(" ")
      .map(function (part) { return part.charAt(0); })
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  function renderAvatar(person, avatarClass) {
    if (person.image) {
      return (
        '<div class="' + avatarClass + ' avatar-photo">' +
        '<img src="' + person.image + '" alt="" data-fallback="' + initials(person.name) + '">' +
        "</div>"
      );
    }
    return '<div class="' + avatarClass + '">' + initials(person.name) + "</div>";
  }

  function isValidPhone(value) {
    return typeof value === "string" && /^\+?[0-9\s]{6,}$/.test(value.trim());
  }

  function renderPerson(person, title, bio) {
    var links = [];
    if (isValidPhone(person.mobile)) {
      links.push('<a href="tel:' + person.mobile.replace(/\s+/g, "") + '">' + person.mobile + "</a>");
    }
    if (person.linkedin) {
      links.push('<a href="' + person.linkedin + '" target="_blank" rel="noopener">LinkedIn</a>');
    }
    var personClass = person.placeholder ? "person person-placeholder" : "person";
    var avatarClass = person.placeholder ? "avatar avatar-placeholder" : "avatar";
    return (
      '<div class="' + personClass + '">' +
      renderAvatar(person, avatarClass) +
      "<h3>" + person.name + "</h3>" +
      (title ? "<p>" + title + "</p>" : "") +
      (bio ? '<p class="person-bio">' + bio + "</p>" : "") +
      (links.length ? '<p class="person-links">' + links.join(" · ") + "</p>" : "") +
      "</div>"
    );
  }

  function attachAvatarFallbacks(container) {
    container.querySelectorAll(".avatar-photo img").forEach(function (img) {
      img.addEventListener("error", function () {
        var wrap = img.parentElement;
        wrap.classList.remove("avatar-photo");
        wrap.textContent = img.getAttribute("data-fallback") || "";
      });
    });
  }

  function renderTeam(dict, teamData) {
    var coreEl = document.getElementById("team-core");
    var boardEl = document.getElementById("team-board");
    if (!coreEl || !boardEl || !teamData) return;

    var coreTitles = (dict.team && dict.team.core) || {};
    coreEl.innerHTML = teamData.core
      .map(function (person) {
        var entry = coreTitles[person.id] || {};
        return renderPerson(person, entry.title, entry.bio);
      })
      .join("");

    var boardDict = (dict.team && dict.team.board) || {};
    var boardFallbackTitle = boardDict.placeholder_title || "";
    boardEl.innerHTML = teamData.board
      .map(function (person) {
        var entry = boardDict[person.id];
        var title = entry && entry.title ? entry.title : boardFallbackTitle;
        return renderPerson(person, title);
      })
      .join("");

    attachAvatarFallbacks(coreEl);
    attachAvatarFallbacks(boardEl);

    var boardTabBtn = document.querySelector('.tab-btn[data-tab="board"]');
    var boardHidden = boardDict.visibility === "hidden";
    if (boardTabBtn) boardTabBtn.hidden = boardHidden;
    var tabsBar = document.querySelector(".tabs");
    if (tabsBar) tabsBar.hidden = boardHidden;
    if (boardHidden) {
      boardEl.hidden = true;
      coreEl.hidden = false;
    }
  }

  function renderArticles(lang, articles) {
    var section = document.getElementById("press");
    var list = document.getElementById("article-list");
    if (!section || !list) return;
    if (!articles || !articles.length) {
      section.hidden = true;
      return;
    }
    section.hidden = false;
    var fmt = new Intl.DateTimeFormat(lang, { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
    var docIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line></svg>';
    var arrowIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>';
    list.innerHTML = articles
      .map(function (a) {
        var date = a.date ? fmt.format(new Date(a.date)) : "";
        var meta = [a.source, date].filter(Boolean).join(" · ");
        return (
          '<a class="article-card" href="' + a.url + '" target="_blank" rel="noopener">' +
          '<span class="article-ico">' + docIcon + "</span>" +
          '<span class="article-body">' +
          '<span class="article-title">' + a.title + "</span>" +
          (meta ? '<span class="article-meta">' + meta + "</span>" : "") +
          "</span>" +
          '<span class="article-arrow">' + arrowIcon + "</span>" +
          "</a>"
        );
      })
      .join("");
  }

  function renderCustomers(customers) {
    var section = document.getElementById("customers");
    var list = document.getElementById("customer-list");
    if (!section || !list) return;
    var visible = (customers || []).filter(function (c) { return c.visibility !== "hidden"; });
    if (!visible.length) {
      section.hidden = true;
      return;
    }
    section.hidden = false;
    list.innerHTML = visible
      .map(function (c) {
        var inner = c.logo
          ? '<img src="' + c.logo + '" alt="' + c.name + '">'
          : "<span>" + c.name + "</span>";
        var cls = c.placeholder ? "customer-logo customer-logo-placeholder" : "customer-logo";
        return c.url
          ? '<a class="' + cls + '" href="' + c.url + '" target="_blank" rel="noopener">' + inner + "</a>"
          : '<div class="' + cls + '">' + inner + "</div>";
      })
      .join("");
  }

  function getStoredTheme() {
    try {
      return localStorage.getItem(THEME_STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function systemPrefersDark() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  function currentEffectiveTheme() {
    var stored = getStoredTheme();
    if (stored === "light" || stored === "dark") return stored;
    return systemPrefersDark() ? "dark" : "light";
  }

  function initThemeToggle() {
    var btn = document.getElementById("theme-toggle");
    if (!btn) return;

    function updatePressed() {
      btn.setAttribute("aria-pressed", currentEffectiveTheme() === "dark" ? "true" : "false");
    }
    updatePressed();

    btn.addEventListener("click", function () {
      var next = currentEffectiveTheme() === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch (e) {}
      document.documentElement.setAttribute("data-theme", next);
      updatePressed();
    });

    if (window.matchMedia) {
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
        if (!getStoredTheme()) updatePressed();
      });
    }
  }

  function initTabs() {
    var buttons = document.querySelectorAll(".tab-btn");
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        buttons.forEach(function (b) {
          b.classList.remove("active");
          b.setAttribute("aria-selected", "false");
        });
        btn.classList.add("active");
        btn.setAttribute("aria-selected", "true");

        document.getElementById("team-core").hidden = btn.dataset.tab !== "core";
        document.getElementById("team-board").hidden = btn.dataset.tab !== "board";
      });
    });
  }

  function renderLangSwitcher(config, currentLang, onSelect) {
    var el = document.getElementById("lang-switcher");
    if (!el) return;
    el.innerHTML = config.languages
      .map(function (lang) {
        return (
          '<button data-lang="' + lang.code + '" class="' + (lang.code === currentLang ? "active" : "") + '" title="' + lang.label + '">' +
          '<img src="assets/flags/' + lang.flag + '.svg" alt="' + lang.label + '">' +
          "</button>"
        );
      })
      .join("");

    el.querySelectorAll("button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        onSelect(btn.getAttribute("data-lang"));
      });
    });
  }

  function detectLang(config) {
    var available = config.languages.map(function (l) { return l.code; });

    var urlLang = new URLSearchParams(window.location.search).get("lang");
    if (urlLang) {
      urlLang = urlLang.toLowerCase();
      if (available.indexOf(urlLang) !== -1) return urlLang;
    }

    var stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (stored && available.indexOf(stored) !== -1) return stored;

    var browserLang = (navigator.language || "").slice(0, 2).toLowerCase();
    if (available.indexOf(browserLang) !== -1) return browserLang;

    return config.default;
  }

  function setLangInUrl(lang) {
    var url = new URL(window.location.href);
    url.searchParams.set("lang", lang);
    window.history.replaceState({}, "", url);
  }

  function renderContactForm(dict) {
    var form = dict.contact && dict.contact.form;
    if (!form) return;
    var nameInput = document.getElementById("cf-name");
    var emailInput = document.getElementById("cf-email");
    var messageInput = document.getElementById("cf-message");
    var subjectSelect = document.getElementById("cf-subject");
    if (nameInput) nameInput.placeholder = form.name_placeholder || "";
    if (emailInput) emailInput.placeholder = form.email_placeholder || "";
    if (messageInput) messageInput.placeholder = form.message_placeholder || "";
    if (subjectSelect && form.subject_options) {
      subjectSelect.innerHTML = form.subject_options
        .map(function (opt) { return "<option>" + opt + "</option>"; })
        .join("");
    }
  }

  function loadLang(lang, config, teamData, articleData) {
    fetchJSON("locales/" + lang + ".json", {})
      .then(function (dict) {
        document.documentElement.lang = lang;
        applyTranslations(dict);
        renderSolutions(dict);
        renderTeam(dict, teamData);
        renderArticles(lang, articleData);
        renderContactForm(dict);
        renderLangSwitcher(config, lang, function (newLang) {
          localStorage.setItem(LANG_STORAGE_KEY, newLang);
          setLangInUrl(newLang);
          loadLang(newLang, config, teamData, articleData);
        });
      });
  }

  function initContactForm(site) {
    var form = document.getElementById("contact-form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("cf-name").value.trim();
      var email = document.getElementById("cf-email").value.trim();
      var subject = document.getElementById("cf-subject").value;
      var message = document.getElementById("cf-message").value.trim();
      var target = site.email || "info@nordicemergency.dk";
      var mailSubject = subject + (name ? " – " + name : "");
      var mailBody = message + "\n\n---\n" + name + (email ? " (" + email + ")" : "");
      window.location.href =
        "mailto:" + target +
        "?subject=" + encodeURIComponent(mailSubject) +
        "&body=" + encodeURIComponent(mailBody);
    });
  }

  function applySiteData(site) {
    var emailEl = document.getElementById("contact-email");
    if (emailEl && site.email) {
      emailEl.textContent = site.email;
      emailEl.href = "mailto:" + site.email;
    }
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

  document.addEventListener("DOMContentLoaded", function () {
    var yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    initTabs();
    initThemeToggle();

    Promise.all([
      fetchJSON("locales/config.json", { default: "en", languages: [{ code: "en", flag: "gb", label: "English" }] }),
      fetchJSON("data/team.json", { core: [], board: [] }),
      fetchJSON("data/site.json", {}),
      fetchJSON("data/article.json", []),
      fetchJSON("data/customer.json", [])
    ]).then(function (results) {
      var config = results[0];
      var teamData = results[1];
      var siteData = results[2];
      var articleData = results[3];
      var customerData = results[4];
      applySiteData(siteData);
      renderCustomers(customerData);
      initContactForm(siteData);
      var lang = detectLang(config);
      loadLang(lang, config, teamData, articleData);
    });
  });
})();
