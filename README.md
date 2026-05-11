# Nobiji Pro — Manuscript Review Website

A lightweight static site that turns the bilingual `drafts/` manuscript into a clean, mobile-friendly reading experience for personal review and scholar feedback. Netlify-ready, no backend, no build pipeline required beyond a one-shot copy of the latest drafts.

> **This is not a publication.** The site is a controlled review interface. Every cited narration sits at MEDIUM confidence; translations are AI-assisted; chapters carry visible scholar tags. The site does not edit or modify the original manuscript files in `drafts/`.

---

## What this is

- A static HTML/CSS/JavaScript website in `web_manuscript/`.
- Reads markdown chapter files from `web_manuscript/content/` (which is a **copy** of `drafts/english/` and `drafts/bangla/`).
- Renders chapters in the browser at runtime — no server-side build, no SSG framework.
- Supports light ("paper") and dark themes, mobile-first, RTL Arabic rendering, scholar-tag highlighting, HID references, footnote-style citation blocks, sidebar navigation, reading progress, prev/next chapter nav.

---

## Folder structure

```
web_manuscript/
├── index.html              Home page
├── read-en.html            English chapter index
├── read-bn.html            Bangla chapter index
├── chapter.html            Universal chapter reader (uses ?ch=NN&lang=en|bn)
├── scholar.html            Scholar review information
├── glossary.html           Glossary (names + terms + sources)
├── status.html             Live manuscript status
├── netlify.toml            Netlify configuration
├── build.ps1               PowerShell script: copies latest drafts/ into content/
├── README.md               This file
├── ROADMAP.md              Future feature plan
├── assets/
│   ├── css/
│   │   ├── main.css        Theme, layout, navigation, typography base
│   │   └── reader.css      Chapter rendering, citations, scholar tags
│   └── js/
│       ├── chapters-data.js   Chapter manifest (title, status, HID range)
│       ├── app.js             Theme toggle, mobile nav, shared helpers
│       └── reader.js          Markdown rendering + tag/HID/Arabic post-processing
└── content/
    ├── en/                 English chapter Markdown (copied from drafts/english/)
    └── bn/                 Bangla chapter Markdown (copied from drafts/bangla/)
```

---

## How chapters are loaded

1. The browser opens `chapter.html?ch=02&lang=en`.
2. `reader.js` reads the URL parameters, finds the matching chapter in `chapters-data.js`, and constructs the path `content/en/02_miswak_and_cleanliness.md`.
3. The Markdown is fetched via `fetch()` and converted to HTML with a small built-in renderer — no external library, no CDN needed for the conversion itself.
4. Post-processing wraps:
   - Scholar flags (`[NEEDS SCHOLAR REVIEW]`, `[FIQH REVIEW]`, `[TRANSLATION DEFERRED]`, etc.) into colored pills.
   - HID references (`HID-0001`) into highlighted spans.
   - Arabic-script paragraphs into RTL spans rendered with the Amiri font.
5. Sidebar, prev/next nav, and reading-progress bar are populated from `chapters-data.js`.

---

## Local preview

The website uses `fetch()` to load Markdown files, which means it **cannot** be opened directly via `file://` (the browser blocks `fetch` from local files). Use a tiny local server.

### Option A — Python (simplest)
```powershell
cd web_manuscript
python -m http.server 8080
# open http://localhost:8080
```

### Option B — Node.js
```powershell
cd web_manuscript
npx serve .
# or: npx http-server .
```

### Option C — Any static-file server
The folder is fully self-contained. Anything that can serve static HTML over HTTP will work.

---

## Updating content from the manuscript

The site reads `content/en/` and `content/bn/`, which are *copies* of the master drafts. When the manuscript drafts in `drafts/english/` or `drafts/bangla/` change, refresh the website's content with the build script:

```powershell
powershell -File web_manuscript/build.ps1
```

The script copies all numerically-prefixed chapter `.md` files from `drafts/{english,bangla}/` into `web_manuscript/content/{en,bn}/`. It does **not** modify the originals in `drafts/`.

---

## Deploying to Netlify

The site is fully Netlify-ready. Three deployment paths:

### Path 1 — Connect Git repository
1. Push your repository to GitHub / GitLab / Bitbucket.
2. In Netlify, "Add new site" → "Import an existing project" → select your repo.
3. Set **Base directory:** `web_manuscript`.
4. Set **Publish directory:** `web_manuscript`.
5. Build command: leave empty (the `content/` folder is committed alongside).
6. Deploy.

### Path 2 — Manual drop
1. Run `powershell -File web_manuscript/build.ps1` to refresh `content/`.
2. Drag the `web_manuscript/` folder onto Netlify's "Sites" page.
3. Done.

### Path 3 — Netlify CLI
```powershell
cd web_manuscript
npx netlify deploy --dir=. --prod
```

The included `netlify.toml` sets sensible cache headers, security headers, and clean-URL redirects (e.g., `/scholar` → `/scholar.html`).

---

## Build structure explanation

The site follows a "no-build, no-framework" philosophy intentionally. It has:

- **No bundler** (no webpack, vite, rollup).
- **No package.json** required for running.
- **No npm dependencies** to install.
- **No external JavaScript at runtime** — fonts come from Google Fonts via `<link>`, but the page works offline (just without the custom fonts).

The only "build step" is running `build.ps1` to copy the latest drafts into `content/`. That's a `Copy-Item` command — nothing more.

This keeps the website maintenance-free for years, even as JavaScript ecosystems churn around it.

---

## What the site does NOT do (intentionally)

- It does not edit the source manuscript. `drafts/english/` and `drafts/bangla/` are read-only with respect to the website. The website's `content/` folder is a one-way copy.
- It does not write to localStorage beyond the dark/light theme preference.
- It does not call any third-party API.
- It does not collect analytics or telemetry.
- It does not allow public scholar feedback submission yet (see `ROADMAP.md`).
- It does not export to EPUB or KDP yet (see `ROADMAP.md`).

---

## Browser support

Tested concept against modern evergreen browsers (Chromium, Firefox, Safari) and mobile webviews. The site uses:
- CSS custom properties (modern only — no IE11).
- `fetch()` for Markdown loading.
- `URLSearchParams` for query parsing.
- Standard CSS Grid + Flexbox layout.

If you need IE11 support, you do not need this manuscript yet — finish the scholar review first.

---

## File integrity

After running `build.ps1`, `web_manuscript/content/` should contain:

- `en/02_miswak_and_cleanliness.md` through `en/10_evening_and_sleep.md` (9 files).
- `bn/02_miswak_and_cleanliness.md` through `bn/10_evening_and_sleep.md` (9 files).

The `01_*` and `11_*` chapters are intentionally absent — those chapters are empty placeholders in the manuscript and will appear in the chapter index as "(empty)".

---

## License & sourcing notes

This site is part of the **Nobiji Pro** project — a serious bilingual Islamic manuscript in preparation for Amazon KDP publication. All chapter content originates from the project's `drafts/` folder, which itself draws from authentic Islamic sources (Sahihayn, Sunan, Shamail) cited in full inside each chapter.

Honorifics (ﷺ, ﷻ, رضي الله عنه, etc.), Arabic text, and citation references must remain intact in any redistribution. See `SOURCE_RULES.md` and `STYLE_GUIDE.md` at the project root.

---

## Contact / further reading

- Manuscript identity: `MANUSCRIPT_IDENTITY.md` (project root)
- Style guide: `STYLE_CONSISTENCY_GUIDE.md`
- Scholar review process: `SCHOLAR_REVIEW_GUIDE.md`
- Translation policy: `config/preferred_reference_translations.md`

---

*Nobiji ❦ Pro — Manuscript review interface — Draft state, not for publication.*
