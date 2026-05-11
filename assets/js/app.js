// ──────────────────────────────────────────────────────────────
// Nobiji Pro — site-wide JavaScript
// Theme toggle + mode toggle (public/reader vs academic/review).
// ──────────────────────────────────────────────────────────────

(function () {
  "use strict";

  var THEME_KEY = "nobiji-theme";
  var MODE_KEY = "nobiji-mode";

  // ── Theme management ────────────────────────────────────────
  function applyTheme(theme) {
    if (theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }
  function getStoredTheme() {
    try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
  }
  function storeTheme(theme) {
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
  }
  function preferredTheme() {
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
    return "light";
  }
  applyTheme(getStoredTheme() || preferredTheme());

  function toggleTheme() {
    var current = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    var next = current === "dark" ? "light" : "dark";
    applyTheme(next);
    storeTheme(next);
    var btn = document.querySelector(".theme-toggle");
    if (btn) btn.textContent = next === "dark" ? "☀ Light" : "☾ Dark";
  }

  // ── Mode management ────────────────────────────────────────
  // Public mode  (default): reader-facing manuscript — no review tags,
  //                          no draft banners, no verification records.
  // Academic mode (opt-in):  full review interface — all tags visible.
  function applyMode(mode) {
    document.documentElement.setAttribute("data-mode", mode === "academic" ? "academic" : "public");
  }
  function getCurrentMode() {
    return document.documentElement.getAttribute("data-mode") === "academic" ? "academic" : "public";
  }
  function getInitialMode() {
    try {
      var p = new URLSearchParams(window.location.search);
      var urlMode = p.get("mode");
      if (urlMode === "academic" || urlMode === "review") {
        localStorage.setItem(MODE_KEY, "academic");
        return "academic";
      }
      if (urlMode === "public" || urlMode === "reader") {
        localStorage.setItem(MODE_KEY, "public");
        return "public";
      }
      var stored = localStorage.getItem(MODE_KEY);
      if (stored === "academic") return "academic";
    } catch (e) {}
    return "public";
  }
  applyMode(getInitialMode());

  function toggleMode() {
    var next = getCurrentMode() === "academic" ? "public" : "academic";
    applyMode(next);
    try { localStorage.setItem(MODE_KEY, next); } catch (e) {}
    // Reload so chapter content re-renders under the new mode
    window.location.reload();
  }

  // ── Init on DOM ready ──────────────────────────────────────
  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  ready(function () {
    var btn = document.querySelector(".theme-toggle");
    if (btn) {
      var current = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
      btn.textContent = current === "dark" ? "☀ Light" : "☾ Dark";
      btn.addEventListener("click", toggleTheme);
    }

    var navToggle = document.querySelector(".nav-mobile-toggle");
    var navLinks = document.querySelector(".site-nav-links");
    if (navToggle && navLinks) {
      navToggle.addEventListener("click", function () {
        navLinks.classList.toggle("open");
      });
    }

    // Mode toggle in footer (small text link)
    var modeToggle = document.querySelector(".mode-toggle");
    if (modeToggle) {
      var current = getCurrentMode();
      modeToggle.textContent = current === "academic" ? "Reader mode" : "Editorial mode";
      modeToggle.addEventListener("click", function (e) {
        e.preventDefault();
        toggleMode();
      });
    }

    var path = window.location.pathname.replace(/\/+$/, "") || "/";
    document.querySelectorAll(".site-nav-links a").forEach(function (a) {
      var href = a.getAttribute("href").replace(/\/+$/, "") || "/";
      if (href === path || (href !== "/" && path.indexOf(href) === 0)) {
        a.setAttribute("aria-current", "page");
      }
    });
  });

  // ── Continue-reading helper (Phase D) ──────────────────────
  // Reads the last-visited chapter from localStorage and renders a
  // small "Continue reading" card on the home page if present.
  function renderContinueReading() {
    var host = document.querySelector("[data-continue-reading]");
    if (!host) return;
    var raw;
    try { raw = localStorage.getItem("nobiji-last-read"); } catch (e) { return; }
    if (!raw) return;
    var data;
    try { data = JSON.parse(raw); } catch (e) { return; }
    if (!data || !data.ch) return;

    var chapters = window.NOBIJI_CHAPTERS || [];
    var ch = null;
    for (var i = 0; i < chapters.length; i++) {
      if (chapters[i].num === data.ch) { ch = chapters[i]; break; }
    }
    if (!ch || !ch.languages || ch.languages.indexOf(data.lang) === -1) return;

    var title = data.lang === "bn" ? ch.titleBn : ch.titleEn;
    var langLabel = data.lang === "bn" ? "বাংলা" : "English";
    var pctText = (data.pct && data.pct > 5)
      ? (data.lang === "bn" ? ("পঠিত " + data.pct + "%") : (data.pct + "% read"))
      : (data.lang === "bn" ? "শুরু থেকে" : "Just opened");
    var cta = data.lang === "bn" ? "পড়া চালিয়ে যান" : "Continue reading";

    host.innerHTML =
      '<a class="continue-card" href="chapter.html?ch=' + ch.num + '&lang=' + data.lang + '">' +
        '<div class="continue-label">' + cta + ' &nbsp;<span class="continue-pct">' + pctText + '</span></div>' +
        '<div class="continue-title">Ch. ' + ch.num + ' · ' + title + ' <span class="continue-lang">(' + langLabel + ')</span></div>' +
      '</a>';
    host.removeAttribute("hidden");
  }

  ready(renderContinueReading);

  window.NobijiApp = {
    applyTheme: applyTheme,
    toggleTheme: toggleTheme,
    getCurrentMode: getCurrentMode,
    toggleMode: toggleMode,
    renderContinueReading: renderContinueReading
  };
})();
