// ──────────────────────────────────────────────────────────────
// Nobiji Pro — chapter reader
// Loads a chapter Markdown file at runtime and renders it
// with citation styling, scholar tags, HID links, and Arabic text
// rendered RTL with the Amiri font.
// ──────────────────────────────────────────────────────────────

(function () {
  "use strict";

  // ── URL parameters ─────────────────────────────────────────
  function getParams() {
    var p = new URLSearchParams(window.location.search);
    return {
      ch: p.get("ch") || "02",
      lang: (p.get("lang") || "en").toLowerCase()
    };
  }

  function isPublicMode() {
    return document.documentElement.getAttribute("data-mode") !== "academic";
  }

  // ── Public-mode content filter ─────────────────────────────
  // Drops internal review-only content from the rendered output:
  //   • The "Draft status" banner at the top of every chapter.
  //   • The "Open questions for scholar review" section.
  //   • The "Verification Record (DRAFT)" section at the end.
  //   • Inline workflow tags ([NEEDS SCHOLAR REVIEW] etc.).
  // Then appends a calm reader-facing "Source & Compilation Note."
  // Source markdown in drafts/ is UNCHANGED — this only filters the
  // copy used for rendering.
  function filterForPublicMode(md, lang) {
    // 1. Strip the first blockquote in the file if it looks like a status banner.
    var lines = md.split("\n");
    var bqStart = -1;
    for (var i = 0; i < Math.min(lines.length, 30); i++) {
      if (/^>/.test(lines[i])) { bqStart = i; break; }
      if (/^##\s/.test(lines[i])) break;
    }
    if (bqStart !== -1) {
      var bqEnd = bqStart;
      while (bqEnd < lines.length && /^>/.test(lines[bqEnd])) bqEnd++;
      var bqText = lines.slice(bqStart, bqEnd).join("\n");
      if (/draft status|MEDIUM|NEEDS SCHOLAR REVIEW|HUMAN REVIEW|PILOT DRAFT|কনফিডেন্স|ড্রাফট/i.test(bqText)) {
        lines.splice(bqStart, bqEnd - bqStart);
        while (bqStart < lines.length && lines[bqStart] === "") lines.splice(bqStart, 1);
      }
    }
    md = lines.join("\n");

    // 2. Strip "## Open questions for scholar review" section (until next ## / # or EOF)
    md = md.replace(/\n##\s+Open questions for scholar[\s\S]*?(?=\n##\s|\n#\s|$)/i, "\n");
    md = md.replace(/\n##\s+আলিমের পর্যালোচনার[\s\S]*?(?=\n##\s|\n#\s|$)/u, "\n");

    // 3. Strip "## Verification Record" section to end of file
    md = md.replace(/\n##\s+Verification Record[\s\S]*$/i, "");
    md = md.replace(/\n##\s+যাচাইকরণ রেকর্ড[\s\S]*$/u, "");

    // 4. Strip internal workflow tags
    var tagPatterns = [
      /\[NEEDS SCHOLAR REVIEW\]/g,
      /\[HUMAN REVIEW RECOMMENDED\]/g,
      /\[TRANSLATION REVIEW\]/g,
      /\[AUTHENTICITY REVIEW\]/g,
      /\[FIQH REVIEW\]/g,
      /\[HISTORICAL REVIEW\]/g,
      /\[CONTEXT REVIEW REQUIRED\]/g,
      /\[NAME PROVISIONAL[^\]]*\]/g,
      /\[TERM PROVISIONAL[^\]]*\]/g,
      /\[GRADE DISPUTED\]/g,
      /\[TRANSLATION DEFERRED[^\]]*\]/g,
      /\[AQIDAH REVIEW\]/g,
      /\[REVIEW_NOTE\]/g
    ];
    tagPatterns.forEach(function (p) { md = md.replace(p, ""); });

    // 5. Clean up residue from tag removal
    md = md.replace(/[ \t]{2,}/g, " ");
    md = md.replace(/[ \t]+\n/g, "\n");
    md = md.replace(/\n{3,}/g, "\n\n");
    md = md.replace(/\.\s+\*$/gm, ".*");
    md = md.replace(/\s+\*$/gm, "*");

    // 6. Append a calm reader-facing closing note
    var note;
    if (lang === "bn") {
      note = "\n\n---\n\n## সূত্র ও সংকলন নোট\n\nএই অধ্যায়ে সহিহ ও গ্রহণযোগ্য হাদিসের ভিত্তিতে নবী ﷺ-এর দৈনন্দিন জীবনের বর্ণনা সংকলিত হয়েছে। পূর্ণ প্রকাশনার আগে মুদ্রিত সংস্করণ আলাদাভাবে পর্যালোচনা করা হবে।\n";
    } else {
      note = "\n\n---\n\n## Source & Compilation Note\n\nThis chapter is compiled from authentic and accepted narrations describing the daily life of the Prophet ﷺ. A final print review will take place before publication.\n";
    }
    md = md.replace(/\s+$/, "") + note;

    return md;
  }

  function findChapter(num) {
    var chapters = window.NOBIJI_CHAPTERS || [];
    for (var i = 0; i < chapters.length; i++) {
      if (chapters[i].num === num) return chapters[i];
    }
    return null;
  }

  function adjacentChapters(num) {
    var chapters = (window.NOBIJI_CHAPTERS || []).filter(function (c) {
      return c.languages && c.languages.length > 0;
    });
    var idx = -1;
    for (var i = 0; i < chapters.length; i++) {
      if (chapters[i].num === num) { idx = i; break; }
    }
    return {
      prev: idx > 0 ? chapters[idx - 1] : null,
      next: idx >= 0 && idx < chapters.length - 1 ? chapters[idx + 1] : null
    };
  }

  // ── Markdown rendering ─────────────────────────────────────
  // Minimal converter: handles the subset of Markdown the drafts use.
  // Covers: headings, paragraphs, blockquotes, lists, hr, *em*, **strong**, links.
  function renderMarkdown(md) {
    // Normalize line endings
    md = md.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

    var lines = md.split("\n");
    var html = [];
    var inBlockquote = false;
    var bqBuffer = [];
    var inList = false;
    var listType = null;
    var listBuffer = [];
    var paraBuffer = [];

    function flushPara() {
      if (paraBuffer.length) {
        html.push("<p>" + inline(paraBuffer.join(" ")) + "</p>");
        paraBuffer = [];
      }
    }
    function flushList() {
      if (inList) {
        html.push("<" + listType + ">");
        listBuffer.forEach(function (item) {
          html.push("<li>" + inline(item) + "</li>");
        });
        html.push("</" + listType + ">");
        listBuffer = [];
        inList = false;
        listType = null;
      }
    }
    function flushBlockquote() {
      if (inBlockquote) {
        // Render the inner buffer as paragraphs separated by blank lines
        var inner = bqBuffer.join("\n").trim();
        var paras = inner.split(/\n\s*\n/);
        var bqHtml = paras.map(function (p) {
          return "<p>" + inline(p.replace(/\n/g, " ")) + "</p>";
        }).join("\n");
        html.push("<blockquote>" + bqHtml + "</blockquote>");
        bqBuffer = [];
        inBlockquote = false;
      }
    }

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];

      // Frontmatter / horizontal rule
      if (/^---\s*$/.test(line)) {
        flushPara(); flushList(); flushBlockquote();
        html.push("<hr>");
        continue;
      }

      // Headings
      var hMatch = line.match(/^(#{1,6})\s+(.*)$/);
      if (hMatch) {
        flushPara(); flushList(); flushBlockquote();
        var level = hMatch[1].length;
        html.push("<h" + level + ">" + inline(hMatch[2]) + "</h" + level + ">");
        continue;
      }

      // Blockquote line
      if (/^>\s?/.test(line)) {
        flushPara(); flushList();
        inBlockquote = true;
        bqBuffer.push(line.replace(/^>\s?/, ""));
        continue;
      } else if (inBlockquote) {
        // Blockquote ended on a non-> line
        flushBlockquote();
      }

      // Unordered list
      var ulMatch = line.match(/^[-*]\s+(.*)$/);
      if (ulMatch) {
        flushPara();
        if (!inList || listType !== "ul") { flushList(); inList = true; listType = "ul"; }
        listBuffer.push(ulMatch[1]);
        continue;
      }

      // Ordered list
      var olMatch = line.match(/^\d+\.\s+(.*)$/);
      if (olMatch) {
        flushPara();
        if (!inList || listType !== "ol") { flushList(); inList = true; listType = "ol"; }
        listBuffer.push(olMatch[1]);
        continue;
      }

      // Blank line
      if (/^\s*$/.test(line)) {
        flushPara(); flushList();
        continue;
      }

      // Continuation of paragraph
      if (inList) flushList();
      paraBuffer.push(line);
    }

    flushPara();
    flushList();
    flushBlockquote();

    return html.join("\n");
  }

  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // Inline formatting: **bold**, *italic*, [text](url), `code`, with Arabic detection
  function inline(text) {
    text = escapeHtml(text);
    // Inline code first (so its contents aren't formatted further)
    text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
    // Links [text](url)
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    // Bold **text**
    text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    // Italic *text*
    text = text.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
    return text;
  }

  // ── Post-processing: tags, HIDs, Arabic detection ──────────
  var TAG_PATTERNS = [
    { re: /\[NEEDS SCHOLAR REVIEW\]/g,           cls: "tag tag-scholar",     label: "NEEDS SCHOLAR REVIEW" },
    { re: /\[HUMAN REVIEW RECOMMENDED\]/g,       cls: "tag tag-human",       label: "HUMAN REVIEW RECOMMENDED" },
    { re: /\[TRANSLATION REVIEW\]/g,             cls: "tag tag-translation", label: "TRANSLATION REVIEW" },
    { re: /\[TRANSLATION DEFERRED[^\]]*\]/g,     cls: "tag tag-deferred",    label: null },
    { re: /\[FIQH REVIEW\]/g,                    cls: "tag tag-fiqh",        label: "FIQH REVIEW" },
    { re: /\[HISTORICAL REVIEW\]/g,              cls: "tag tag-historical",  label: "HISTORICAL REVIEW" },
    { re: /\[GRADE DISPUTED\]/g,                 cls: "tag tag-grade",       label: "GRADE DISPUTED" },
    { re: /\[NAME PROVISIONAL[^\]]*\]/g,         cls: "tag tag-name",        label: null },
    { re: /\[TERM PROVISIONAL[^\]]*\]/g,         cls: "tag tag-term",        label: null },
    { re: /\[CONTEXT REVIEW REQUIRED\]/g,        cls: "tag tag-context",     label: "CONTEXT REVIEW REQUIRED" },
    { re: /\[AUTHENTICITY REVIEW\]/g,            cls: "tag tag-scholar",     label: "AUTHENTICITY REVIEW" },
    { re: /\[AQIDAH REVIEW\]/g,                  cls: "tag tag-fiqh",        label: "AQIDAH REVIEW" }
  ];

  function applyTagsAndHids(html) {
    // Don't replace inside attribute values — operate only on text nodes.
    // We'll replace within text spans: rendered html has them as raw text.
    TAG_PATTERNS.forEach(function (t) {
      html = html.replace(t.re, function (match) {
        var label = t.label || match.replace(/[\[\]]/g, "");
        return '<span class="' + t.cls + '">' + label + "</span>";
      });
    });
    // HID-NNNN — anywhere
    html = html.replace(/\bHID-\d{4}\b/g, function (m) {
      return '<span class="hid">' + m + "</span>";
    });
    return html;
  }

  // Wrap Arabic-script runs with <span class="ar"> for RTL + Amiri.
  // Heuristic: any line whose text is mostly Arabic chars, or any contiguous
  // run of Arabic chars, gets wrapped. We avoid wrapping inside attribute values.
  // Arabic block: U+0600–U+06FF, U+0750–U+077F, U+08A0–U+08FF, U+FB50–U+FDFF, U+FE70–U+FEFF
  var ARABIC_LINE_RE = /(<p>(?:<strong>[^<]+:<\/strong>\s*)?)([^<]*[؀-ۿݐ-ݿࡰ-࢟ࢠ-ࣿﭐ-﷿ﹰ-﻿][^<]*)(<\/p>)/g;

  function wrapArabic(html) {
    // For citation blockquotes, the Arabic line typically has a leading
    // "<strong>Arabic:</strong>" or "<strong>আরবি:</strong>" prefix
    // followed by the Arabic text. Wrap the whole paragraph as RTL+Amiri.
    return html.replace(ARABIC_LINE_RE, function (m, pre, content, post) {
      // Only wrap if content contains a substantial run of Arabic
      var arabicChars = (content.match(/[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/g) || []).length;
      if (arabicChars < 6) return m;
      return pre + '<span class="ar">' + content + "</span>" + post;
    });
  }

  // ── DOM building ───────────────────────────────────────────
  function buildSidebar(currentNum, lang) {
    var chapters = window.NOBIJI_CHAPTERS || [];
    var html = [
      '<button class="sidebar-mobile-toggle" aria-expanded="true">CHAPTERS</button>',
      '<div class="lang-switcher">',
      '<a href="?ch=' + currentNum + '&lang=en"' + (lang === "en" ? ' class="active"' : "") + '>English</a>',
      '<a href="?ch=' + currentNum + '&lang=bn"' + (lang === "bn" ? ' class="active"' : "") + '>বাংলা</a>',
      '</div>',
      '<h4>CHAPTERS</h4>',
      '<ul class="sidebar-list">'
    ];
    chapters.forEach(function (c) {
      var available = c.languages && c.languages.indexOf(lang) !== -1;
      var isCurrent = c.num === currentNum;
      var cls = isCurrent ? "active" : "";
      var title = lang === "bn" ? c.titleBn : c.titleEn;
      if (available) {
        html.push('<li><a class="' + cls + '" href="?ch=' + c.num + '&lang=' + lang + '"><span class="ch-num">' + c.num + '</span>' + title + "</a></li>");
      } else {
        html.push('<li><a class="' + cls + '" style="opacity:0.5;cursor:default" onclick="event.preventDefault()"><span class="ch-num">' + c.num + '</span>' + title + " <em style=\"font-size:11px;color:var(--ink-muted)\">(empty)</em></a></li>");
      }
    });
    html.push("</ul>");
    return html.join("");
  }

  function buildChapterNav(currentNum, lang) {
    var adj = adjacentChapters(currentNum);
    var prevHtml, nextHtml;
    if (adj.prev) {
      prevHtml = '<a href="?ch=' + adj.prev.num + '&lang=' + lang + '" class="prev">' +
        '<span class="nav-direction">← Previous</span>' +
        '<span class="nav-title">' + (lang === "bn" ? adj.prev.titleBn : adj.prev.titleEn) + "</span>" +
        "</a>";
    } else {
      prevHtml = '<a class="prev disabled"><span class="nav-direction">— Start —</span><span class="nav-title">First chapter</span></a>';
    }
    if (adj.next) {
      nextHtml = '<a href="?ch=' + adj.next.num + '&lang=' + lang + '" class="next">' +
        '<span class="nav-direction">Next →</span>' +
        '<span class="nav-title">' + (lang === "bn" ? adj.next.titleBn : adj.next.titleEn) + "</span>" +
        "</a>";
    } else {
      nextHtml = '<a class="next disabled"><span class="nav-direction">— End —</span><span class="nav-title">Last chapter</span></a>';
    }
    return prevHtml + nextHtml;
  }

  // ── Reading progress ───────────────────────────────────────
  var LAST_READ_KEY = "nobiji-last-read";

  function saveLastRead(ch, lang, pct) {
    try {
      localStorage.setItem(LAST_READ_KEY, JSON.stringify({
        ch: ch,
        lang: lang,
        pct: Math.round(pct),
        ts: Date.now()
      }));
    } catch (e) {}
  }

  function setupReadingProgress(currentNum, lang) {
    var bar = document.querySelector(".reading-progress");
    var lastSave = 0;
    function update() {
      var doc = document.documentElement;
      var scrollTop = window.scrollY || doc.scrollTop;
      var max = (doc.scrollHeight - doc.clientHeight) || 1;
      var pct = Math.max(0, Math.min(100, (scrollTop / max) * 100));
      if (bar) bar.style.width = pct + "%";
      // Throttle localStorage writes to once per ~1.5s while scrolling
      var now = Date.now();
      if (now - lastSave > 1500) {
        saveLastRead(currentNum, lang, pct);
        lastSave = now;
      }
    }
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    // Always record the visit at 0% on initial load
    saveLastRead(currentNum, lang, 0);
    update();
  }

  // ── Main load ─────────────────────────────────────────────
  function loadChapter() {
    var params = getParams();
    var ch = findChapter(params.ch);
    var lang = params.lang === "bn" ? "bn" : "en";

    // Update document language attribute
    document.documentElement.lang = lang === "bn" ? "bn" : "en";
    var titleEl = document.querySelector(".reader-content");
    if (titleEl) titleEl.setAttribute("lang", lang);

    // Sidebar
    var sidebar = document.querySelector(".reader-sidebar");
    if (sidebar) {
      sidebar.innerHTML = buildSidebar(params.ch, lang);
      // Mobile toggle
      var toggle = sidebar.querySelector(".sidebar-mobile-toggle");
      if (toggle) {
        toggle.addEventListener("click", function () {
          sidebar.classList.toggle("collapsed");
          toggle.setAttribute("aria-expanded", String(!sidebar.classList.contains("collapsed")));
        });
        // Default to collapsed on small screens
        if (window.innerWidth <= 960) sidebar.classList.add("collapsed");
      }
    }

    // Title
    var titleHolder = document.querySelector(".reader-title-holder");
    if (titleHolder && ch) {
      titleHolder.textContent = (lang === "bn" ? ch.titleBn : ch.titleEn);
    }
    if (ch) {
      document.title = (lang === "bn" ? ch.titleBn : ch.titleEn) + " — Nobiji Pro";
    }

    // Footer nav
    var navFooter = document.querySelector(".chapter-nav");
    if (navFooter) navFooter.innerHTML = buildChapterNav(params.ch, lang);

    // Content
    var content = document.querySelector(".reader-content");
    if (!content) return;

    if (!ch) {
      content.innerHTML = '<div class="load-error">Chapter <code>' + escapeHtml(params.ch) + "</code> not found.</div>";
      return;
    }

    if (ch.languages.indexOf(lang) === -1) {
      content.innerHTML = '<div class="load-error">This chapter is not yet available in ' +
        (lang === "bn" ? "Bangla" : "English") +
        '. Try the other language using the switcher in the sidebar.</div>';
      return;
    }

    var url = "content/" + lang + "/" + ch.slug + ".md";
    content.innerHTML = '<div class="loader">Loading chapter</div>';

    fetch(url, { cache: "no-cache" })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.text();
      })
      .then(function (md) {
        if (isPublicMode()) {
          md = filterForPublicMode(md, lang);
        }
        var html = renderMarkdown(md);
        html = applyTagsAndHids(html);
        html = wrapArabic(html);
        content.innerHTML = html;
        setupReadingProgress(params.ch, lang);
        // Scroll to top after content swap
        window.scrollTo(0, 0);
      })
      .catch(function (err) {
        content.innerHTML = '<div class="load-error">Failed to load chapter: ' + escapeHtml(err.message) +
          '. Make sure you are running this site via a local server (not <code>file://</code>) — see README.md for details.</div>';
      });
  }

  // Boot
  if (document.readyState !== "loading") loadChapter();
  else document.addEventListener("DOMContentLoaded", loadChapter);

  // Re-load when query params change (back/forward)
  window.addEventListener("popstate", loadChapter);

})();
