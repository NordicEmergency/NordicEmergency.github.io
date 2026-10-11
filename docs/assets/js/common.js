window.NE = (function () {
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
    document.querySelectorAll("[data-i18n-label]").forEach(function (el) {
      var value = getByPath(dict, el.getAttribute("data-i18n-label"));
      if (typeof value === "string") {
        el.setAttribute("aria-label", value);
        el.setAttribute("title", value);
      }
    });
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

  function renderLangSwitcher(config, currentLang, flagsPath, onSelect) {
    var el = document.getElementById("lang-switcher");
    if (!el) return;
    el.innerHTML = config.languages
      .map(function (lang) {
        return (
          '<button data-lang="' + lang.code + '" class="' + (lang.code === currentLang ? "active" : "") + '" title="' + lang.label + '">' +
          '<img src="' + flagsPath + lang.flag + '.svg" alt="' + lang.label + '">' +
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

    var stored = null;
    try {
      stored = localStorage.getItem(LANG_STORAGE_KEY);
    } catch (e) {}
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

  function storeLang(lang) {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch (e) {}
  }

  // Apple-style reveal: items slide up 30px and fade in once, the first time they
  // scroll into view; items entering together are staggered by 0.15s. Nothing is
  // hidden unless this runs, so without JS (or with reduced motion) all is shown.
  var REVEAL_GROUPS = [
    [".section > .container", ":scope > h2, :scope > p, :scope > .tabs, :scope > .contact-form"],
    [".cards", ":scope > .card"],
    [".people", ":scope > .person"],
    [".article-list", ":scope > *"],
    [".customer-list", ":scope > *"],
    [".gallery-grid", ":scope > .gallery-item"]
  ];
  var REVEAL_STAGGER_MS = 150;
  var REVEAL_STAGGER_MAX = 3;
  var revealObserver = null;

  function finishReveal(el) {
    el.removeAttribute("data-reveal");
    el.classList.remove("is-in");
    el.style.transitionDelay = "";
  }

  function onReveal(entries) {
    entries
      .filter(function (entry) { return entry.isIntersecting; })
      .map(function (entry) { return entry.target; })
      .sort(function (a, b) {
        return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
      })
      .forEach(function (el, index) {
        var i = Math.min(index, REVEAL_STAGGER_MAX);
        revealObserver.unobserve(el);
        el.style.transitionDelay = i * REVEAL_STAGGER_MS + "ms";
        el.classList.add("is-in");
        if (el.classList.contains("gallery-item")) el.classList.add("is-zoomed");
        // Hand the element back to its own styles once it has settled.
        setTimeout(function () { finishReveal(el); }, 900 + i * REVEAL_STAGGER_MS + 100);
      });
  }

  function reveal() {
    if (!("IntersectionObserver" in window)) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!revealObserver) {
      revealObserver = new IntersectionObserver(onReveal, { rootMargin: "0px 0px -10% 0px" });
    }
    REVEAL_GROUPS.forEach(function (group) {
      document.querySelectorAll(group[0]).forEach(function (container) {
        // Content re-rendered on a language switch should not animate again.
        if (container.hasAttribute("data-revealed")) return;
        var items = container.querySelectorAll(group[1]);
        if (!items.length) return;
        container.setAttribute("data-revealed", "");
        items.forEach(function (el) {
          el.setAttribute("data-reveal", "");
          revealObserver.observe(el);
        });
      });
    });
  }

  return {
    LANG_STORAGE_KEY: LANG_STORAGE_KEY,
    THEME_STORAGE_KEY: THEME_STORAGE_KEY,
    fetchJSON: fetchJSON,
    getByPath: getByPath,
    applyTranslations: applyTranslations,
    initThemeToggle: initThemeToggle,
    renderLangSwitcher: renderLangSwitcher,
    detectLang: detectLang,
    setLangInUrl: setLangInUrl,
    storeLang: storeLang,
    reveal: reveal
  };
})();
