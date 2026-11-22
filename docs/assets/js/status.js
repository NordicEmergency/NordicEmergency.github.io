// Fills in the status page from status.json served by the status worker (worker/, Cloudflare)
// and refreshes it every minute.
(function () {
  "use strict";

  var cfgEl = document.getElementById("status-i18n");
  if (!cfgEl) return;
  var T = JSON.parse(cfgEl.textContent);
  var DAYS = 90;
  var STALE_MS = 30 * 60 * 1000;
  var RANK = { unknown: -1, ok: 0, degraded: 1, down: 2 };

  var timeFmt = new Intl.DateTimeFormat(T.locale, { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Copenhagen" });
  var dateFmt = new Intl.DateTimeFormat(T.locale, { day: "numeric", month: "long", timeZone: "Europe/Copenhagen" });
  var dateTimeFmt = new Intl.DateTimeFormat(T.locale, { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Copenhagen" });
  var dayKeyFmt = new Intl.DateTimeFormat("sv-SE", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Europe/Copenhagen" });

  function when(iso) {
    var d = new Date(iso);
    return dayKeyFmt.format(d) === dayKeyFmt.format(new Date()) ? timeFmt.format(d) : dateTimeFmt.format(d);
  }

  function setDot(el, status) {
    el.className = "status-dot status-" + status;
  }

  /** The last 90 Danish days, oldest first, as YYYY-MM-DD with a noon Date for labels. */
  function lastDays() {
    var out = [];
    var now = Date.now();
    for (var i = DAYS - 1; i >= 0; i--) {
      var d = new Date(now - i * 86400000);
      out.push({ key: dayKeyFmt.format(d), date: d });
    }
    return out;
  }

  function dayStatus(count) {
    if (!count || !count[0]) return "unknown";
    if (count[2] > 0) return "down";
    if (count[1] > 0) return "degraded";
    return "ok";
  }

  function renderRow(row, id, data, days) {
    var svc = data.services[id];
    var status = svc ? svc.status : "unknown";
    setDot(row.querySelector(".status-dot"), status);
    row.querySelector(".status-label").textContent = T.legend[status];
    row.setAttribute("data-status", status);

    var bars = row.querySelector(".status-bars");
    bars.textContent = "";
    var total = 0, good = 0;
    days.forEach(function (day) {
      var count = (data.days[day.key] || {})[id];
      var s = dayStatus(count);
      if (count) { total += count[0]; good += count[0] - count[2]; }
      var bar = document.createElement("span");
      bar.className = "status-bar status-" + s;
      bar.title = dateFmt.format(day.date) + ": " + T.legend[s];
      bars.appendChild(bar);
    });
    var pct = total ? Math.floor((good / total) * 10000) / 100 : null;
    row.querySelector(".status-uptime").textContent =
      pct === null ? "" : T.uptime.replace("{pct}", pct.toLocaleString(T.locale, { maximumFractionDigits: 2 }));
    return status;
  }

  function renderIncidents(data) {
    var list = document.getElementById("status-incidents");
    list.textContent = "";
    var items = (data.incidents || []).filter(function (x) { return T.names[x.id]; });
    if (!items.length) {
      var empty = document.createElement("li");
      empty.className = "status-incident-empty";
      empty.textContent = T.no_incidents;
      list.appendChild(empty);
      return;
    }
    items.forEach(function (x) {
      var li = document.createElement("li");
      li.className = "status-incident";
      var dot = document.createElement("span");
      setDot(dot, x.status);
      var name = document.createElement("strong");
      name.textContent = T.names[x.id] + " · " + T.legend[x.status];
      var time = document.createElement("span");
      time.className = "status-incident-time";
      time.textContent = when(x.start) + " – " + (x.end ? when(x.end) : T.ongoing);
      li.appendChild(dot);
      li.appendChild(name);
      li.appendChild(time);
      list.appendChild(li);
    });
  }

  function setBanner(kind, title, meta) {
    document.getElementById("status-banner").className = "status-banner status-banner-" + kind;
    document.getElementById("status-banner-title").textContent = title;
    document.getElementById("status-banner-meta").textContent = meta || "";
  }

  function render(data) {
    var days = lastDays();
    var worst = "unknown";
    document.querySelectorAll(".status-row[data-service]").forEach(function (row) {
      var s = renderRow(row, row.getAttribute("data-service"), data, days);
      if (RANK[s] > RANK[worst]) worst = s;
    });
    renderIncidents(data);

    var checked = new Date(data.checkedAt);
    if (Date.now() - checked.getTime() > STALE_MS) {
      setBanner("unknown", T.stale.replace("{time}", when(data.checkedAt)));
      return;
    }
    var title = worst === "down" ? T.some_down : worst === "degraded" ? T.some_degraded : worst === "ok" ? T.all_ok : T.unavailable;
    setBanner(worst === "unknown" ? "unknown" : worst, title, T.checked.replace("{time}", when(data.checkedAt)));
  }

  function load() {
    // The worker allows a minute of caching; a new query string every minute gets a fresh copy.
    var url = T.dataUrl + "?t=" + Math.floor(Date.now() / 60000);
    fetch(url, { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error(res.status);
        return res.json();
      })
      .then(render)
      .catch(function () {
        setBanner("unknown", T.unavailable);
      });
  }

  load();
  setInterval(load, 60 * 1000);
})();
