// Behaviour on the generated pages (tools/build.mjs writes the content into the HTML):
// the year, team tabs, theme toggle, avatar fallbacks, the contact form, the language
// choice, the footer status dot and the scroll reveal. Every part skips itself when its elements are missing.
(function () {
  "use strict";

  function attachAvatarFallbacks() {
    document.querySelectorAll(".avatar-photo img").forEach(function (img) {
      function fallback() {
        var wrap = img.parentElement;
        wrap.classList.remove("avatar-photo");
        wrap.textContent = img.getAttribute("data-fallback") || "";
      }
      if (img.complete && img.naturalWidth === 0) fallback();
      else img.addEventListener("error", fallback);
    });
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

  function initContactForm() {
    var form = document.getElementById("contact-form");
    if (!form) return;
    var emailEl = document.getElementById("contact-email");
    var target = (emailEl && emailEl.textContent.trim()) || "hello@nordicemergency.dk";
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("cf-name").value.trim();
      var email = document.getElementById("cf-email").value.trim();
      var subject = document.getElementById("cf-subject").value;
      var message = document.getElementById("cf-message").value.trim();
      var mailSubject = subject + (name ? " – " + name : "");
      var mailBody = message + "\n\n---\n" + name + (email ? " (" + email + ")" : "");
      window.location.href =
        "mailto:" + target +
        "?subject=" + encodeURIComponent(mailSubject) +
        "&body=" + encodeURIComponent(mailBody);
    });
  }

  // A flag is a link to the page in that language; the choice is remembered, so the
  // next visit opens in it (the script in each page's head).
  function initLangLinks() {
    document.querySelectorAll(".lang-switcher a[data-lang]").forEach(function (a) {
      a.addEventListener("click", function () {
        NE.storeLang(a.getAttribute("data-lang"));
      });
    });
  }

  // The dot before Status in the footer: the worst current state from status.json, grey until known.
  function initFooterStatus() {
    var link = document.querySelector(".footer-status[data-status-url]");
    if (!link) return;
    var dot = link.querySelector(".status-dot");
    var url = link.getAttribute("data-status-url") + "?t=" + Math.floor(Date.now() / 60000);
    fetch(url, { cache: "no-store" })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (data) {
        if (!data || Date.now() - new Date(data.checkedAt).getTime() > 60 * 60 * 1000) return;
        var rank = { ok: 0, degraded: 1, down: 2 };
        var worst = "ok";
        Object.keys(data.services || {}).forEach(function (id) {
          var s = data.services[id].status;
          if (rank[s] > rank[worst]) worst = s;
        });
        dot.className = "status-dot status-" + worst;
      })
      .catch(function () {});
  }

  document.addEventListener("DOMContentLoaded", function () {
    var yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    initTabs();
    NE.initThemeToggle();
    attachAvatarFallbacks();
    initContactForm();
    initLangLinks();
    initFooterStatus();
    NE.reveal();
  });
})();
