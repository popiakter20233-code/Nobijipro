# Web Manuscript — Roadmap

The current site is a **read-only manuscript review interface**. This roadmap describes future capabilities the site can grow into as the project matures past scholar review and toward public reading and KDP export.

Items are roughly ordered by likely sequence, but each is independently scopeable.

---

## Phase A — Scholar approval workflow

**Goal:** turn the site from "read-only review" into a structured scholar-feedback collector.

- **Per-chapter scholar response form.** A small form on each chapter page (gated behind a passphrase or invitation token) where the assigned scholar can:
  - Tick approval verdicts per claim.
  - Suggest replacement wordings.
  - Specify a published translator family.
  - Lock canonical names.
- **Submission backend.** Two options:
  - Netlify Forms (simplest; spam-resistant; no custom code).
  - Static-form-to-Git-issue adapter (e.g., Formspree → GitHub issue).
  - Backend service if richer flow needed (Supabase, Firebase) — only if needed.
- **Scholar identity.** Lightweight: scholar enters a name + affiliation; a token validates them. No accounts needed.
- **Submission audit trail.** Every submission generates a `scholar_review/feedback/<chapter>.feedback.md` entry committed to the repo (or held in Netlify Forms with periodic export).

---

## Phase B — Verified chapter state

**Goal:** visually distinguish chapters that have completed scholar approval from chapters still in draft.

- **Status states surfaced in UI.** `draft` / `pending-feedback` / `approved-with-edits` / `verified` / `export-ready` — each with distinct visual treatment.
- **Verified-chapter badge.** A small green seal next to the chapter title and on the home/index pages.
- **Tag suppression on verified chapters.** Cleared `[NEEDS SCHOLAR REVIEW]` and `[HUMAN REVIEW RECOMMENDED]` tags drop from rendered output (the source records still hold them, but the verified state suppresses display).
- **Confidence promotion display.** HIDs that have advanced to HIGH confidence shown without the `[NEEDS SCHOLAR REVIEW]` chip.

---

## Phase C — Public preview mode

**Goal:** a separate, polished preview path suitable for non-scholar early readers.

- **Two modes:** `?mode=review` (current default — all flags visible) and `?mode=preview` (public-friendly — flags hidden where verified).
- **Preview-mode visual restraint:** book-like serif typography, dropped first letter, justified text, expanded margins.
- **Selective chapter publication.** Only chapters at `verified/` advance to preview mode; drafts stay in review mode only.
- **Robots:** robots.txt + meta robots `noindex` swapped to `index, follow` for the preview subset.
- **Optional landing page** marketing the upcoming KDP edition with a "read first three chapters" preview gate.

---

## Phase D — EPUB export

**Goal:** generate a clean EPUB from the verified chapters, suitable for Kindle/iBooks/etc.

- **Build script** (`tools/build_epub.ps1` or Node) that:
  - Reads only `verified/` chapter files.
  - Strips remaining tags appropriate for general reading.
  - Generates EPUB 3 with proper Bangla + Arabic font embedding.
  - Adds front matter (preface, table of contents) and back matter (glossary appendix, hadith index, narrator index, bibliography).
- **Cover image** generated or supplied separately.
- **Export to `exports/kdp_ebook/`.**
- **Validation step** — `epubcheck` run before considering the file shippable.

---

## Phase E — KDP integration

**Goal:** smooth the path from the manuscript into Amazon KDP listings.

- **KDP-paperback build path.** Generate print-ready PDF with:
  - 6×9 trim size.
  - KDP-compliant margins and gutter.
  - Embedded fonts.
  - Pre-flight check via `10_kdp_manuscript_guard` (project skill).
- **KDP-ebook upload assets.** EPUB + cover JPEG + metadata JSON.
- **Bilingual edition strategy.** Single-volume (parallel pages) vs two-volume (English + Bangla as separate KDP listings) — decision deferred per `BOOK_STRUCTURE_V2.md`.
- **ISBN management.** Notes on KDP-issued vs publisher-issued ISBN.
- **Pricing strategy** (informational only — KDP handles).

---

## Phase F — Narrator index

**Goal:** a browsable index of every Sahabi/wife/scholar named in the manuscript.

- **Per-narrator page** with:
  - Canonical English / Bangla / Arabic names.
  - Brief sourced biography (sources cited).
  - List of all HIDs in which the narrator appears.
  - Links to chapters that cite each HID.
- **Generated from `glossary/canonical_names.md`** at build time.
- **Cross-link** chapter mentions of a narrator to their index page (`<a href="/narrator/abu-hurayrah">Abu Hurayrah رضي الله عنه</a>`).

---

## Phase G — Advanced search

**Goal:** in-page and cross-page search across the manuscript.

- **Client-side search index** built from `content/` — likely using lunr.js or minisearch (lightweight).
- **Searchable fields:** chapter text, HID Arabic text, HID English/Bangla translations, narrator names, glossary entries.
- **Filter by:** language, chapter, scholar flag presence, source (Bukhari, Muslim, etc.).
- **Search UI:** keyboard shortcut (`/`) opens overlay; results show snippet + chapter + HID context.

---

## Phase H — Audio recitation integration

**Goal:** bring the Arabic text to ear as well as eye.

- **Per-HID audio link** to a sourced recitation of the Arabic text.
  - Could use existing recitations from sunnah.com or a project-specific recording.
  - Audio metadata in HID record: `audio_url`, `reciter`, `licence`.
- **Inline play button** next to each Arabic block in chapter view.
- **Optional whole-chapter narration** (English / Bangla) for accessibility.
- **Performance considerations:** lazy-load audio elements; do not autoplay; respect prefers-reduced-motion.

---

## Phase I — Reader accounts (defer; consider only if needed)

**Goal:** bookmarks, reading progress sync, highlights — *if* the project decides to host a reader-facing site post-publication.

This is a significant scope expansion (auth, database, privacy considerations). Recommend deferring until KDP publication is complete and reader demand is observed.

---

## Cross-cutting work (whenever done benefits all phases)

- **Print stylesheet** for those who want to print a chapter for offline review.
- **Accessibility audit:** ARIA labels, keyboard navigation, focus rings, contrast checks (already at AA; verify AAA where feasible).
- **Performance pass:** font subsetting (load only Bangla glyphs actually used), lazy-load below-fold sections.
- **Internationalization:** UI strings extracted to a small JSON file so site UI itself can be translated to Bangla.
- **PWA features:** service worker for offline reading of cached chapters; install prompt.

---

## Out of scope (intentionally)

- Public comment threads (out of editorial control).
- Social-media sharing widgets (clutter; not the audience this manuscript is for).
- Multi-tenancy / multi-book support (this is one project).
- Real-time collaborative editing (drafts/ + git is the source of truth).

---

## Trigger conditions for moving phases forward

| Phase | Trigger |
|---|---|
| A — Scholar approval workflow | At least one chapter has returned approved Batch 1; pattern of feedback observed; volume justifies a form |
| B — Verified chapter state | First chapter reaches `verified/` |
| C — Public preview mode | At least 3 verified chapters; pre-publication interest |
| D — EPUB export | All target chapters verified; back-matter generation ready |
| E — KDP integration | EPUB export validated; cover ready; ISBN decision made |
| F — Narrator index | Wave 3+ adds enough narrators to make an index valuable (~30+) |
| G — Advanced search | Verified chapter count > 5 (otherwise search returns mostly tags) |
| H — Audio recitation | Audio sources curated and licensed |
| I — Reader accounts | Real reader demand post-publication |

---

*The website grows with the manuscript. Nothing here is committed; everything here is reachable from where the project sits today.*
