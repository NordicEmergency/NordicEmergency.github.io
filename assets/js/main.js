(function () {
  "use strict";

  var LANG_STORAGE_KEY = "ne_lang";

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

  function renderSolutions(dict) {
    var list = document.getElementById("solutions-list");
    if (!list) return;
    var items = (dict.solutions && dict.solutions.items) || [];
    list.innerHTML = items
      .map(function (item) {
        return (
          '<div class="card"><h3>' +
          item.title +
          "</h3><p>" +
          item.description +
          "</p></div>"
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

  function renderPerson(person, title) {
    var linkHtml = person.linkedin
      ? '<a href="' + person.linkedin + '" target="_blank" rel="noopener">LinkedIn</a>'
      : "";
    return (
      '<div class="person">' +
      '<div class="avatar">' + initials(person.name) + "</div>" +
      "<h3>" + person.name + "</h3>" +
      (title ? "<p>" + title + "</p>" : "") +
      linkHtml +
      "</div>"
    );
  }

  function renderTeam(dict, teamData) {
    var coreEl = document.getElementById("team-core");
    var boardEl = document.getElementById("team-board");
    if (!coreEl || !boardEl || !teamData) return;

    var coreTitles = (dict.team && dict.team.core) || {};
    coreEl.innerHTML = teamData.core
      .map(function (person) {
        var title = coreTitles[person.id] ? coreTitles[person.id].title : "";
        return renderPerson(person, title);
      })
      .join("");

    var boardTitle = dict.team && dict.team.board ? dict.team.board.placeholder_title : "";
    boardEl.innerHTML = teamData.board
      .map(function (person) { return renderPerson(person, boardTitle); })
      .join("");
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
    var stored = localStorage.getItem(LANG_STORAGE_KEY);
    var available = config.languages.map(function (l) { return l.code; });
    if (stored && available.indexOf(stored) !== -1) return stored;

    var browserLang = (navigator.language || "").slice(0, 2).toLowerCase();
    if (available.indexOf(browserLang) !== -1) return browserLang;

    return config.default;
  }

  function loadLang(lang, config, teamData) {
    fetch("locales/" + lang + ".json")
      .then(function (res) { return res.json(); })
      .then(function (dict) {
        document.documentElement.lang = lang;
        applyTranslations(dict);
        renderSolutions(dict);
        renderTeam(dict, teamData);
        renderLangSwitcher(config, lang, function (newLang) {
          localStorage.setItem(LANG_STORAGE_KEY, newLang);
          loadLang(newLang, config, teamData);
        });
      });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    initTabs();

    Promise.all([
      fetch("locales/config.json").then(function (res) { return res.json(); }),
      fetch("data/team.json").then(function (res) { return res.json(); })
    ]).then(function (results) {
      var config = results[0];
      var teamData = results[1];
      var lang = detectLang(config);
      loadLang(lang, config, teamData);
    });
  });
})();
