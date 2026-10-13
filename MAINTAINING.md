# Maintaining the site

The site is hand-written HTML with no build step. A few things are repeated across pages or
summarized elsewhere, so they need updating together. Run the checker before every push:

    python tools/terms.py                  # rebuild the "Terms on this page" boxes from the glossary (after editing the glossary or a science page)
    python tools/check_site.py             # internal links, anchors, alt text, footers, sitemap, scripts
    python tools/check_site.py --external  # also checks external links (slow; do it before releases)

## When something happens (news, talk, paper)
- **News:** add a dated line on Home (`index.html`, News).
- **Talk:**
  - add it to `about/presentations.html`, newest first, with slides as PDF if possible;
  - add it to the CV if it is a selected talk.
- **New paper:**
  - `about/publications.html`: add the entry with your position and contribution; update the counts line
    and, if it is a highlight, the Highlights cards;
  - the research page it belongs to;
  - the CV (`cv/`, then rebuild with `latexmk`);
  - `publications-by-year` in the figure package, if used.
- **Paper status changes** (submitted → accepted → published): update the publication list, the
  research page and the CV together. The fact-check found these drifting apart.

## The Chinese version (`zh/`)
Every English page has a Chinese page at the same path under `zh/`; the English is the reference.
- **Changing a page:** make the same change on the Chinese page in the same commit, or note it as
  pending. Translate in plain written Chinese; keep names, paper and talk titles, event names and code
  in English; use the same terms as the rest of the Chinese site.
- **Shared parts:** the menus, the footer and the 中文 / English button appear on every page in both
  languages; a new page needs its Chinese twin, with `hreflang` links both ways, and both in `sitemap.xml`.
- **Footers:** 版本 and the date in Chinese footers follow the English (the checker compares the version numbers).
- `python tools/terms.py` rebuilds the term boxes in both languages from the two glossaries.

## At each release (several times a year)
1. Footer of every page: version and "last updated" date (all pages share one line; the checker
   warns if they disagree).
2. `sitemap.xml`: add or remove pages; update `<lastmod>` for changed pages.
3. `llms.txt`: add or remove pages; update your position if it changed.
4. `index.html` structured data (JSON-LD): position, affiliation, `sameAs` links.
5. If a page's meta description changed, change its `og:description` to match.
6. `README.md`: version and contents.
7. Run `python tools/check_site.py --external` and fix what it reports.

## Once a year (the periodic overhaul in the Website Philosophy)
- Reread every research page against your papers; revise the "What comes next" parts.
- Check every software status label (active or archived) and "Where to start" entry.
- Reread About, Personal and "Working with me": position, teams, students, reply time.
- Remove anything that has gone stale ("incoming", "submitted", "planned").
- Ask one or two people to read the home page and tell you what they think you do.

## Conventions
- American English, including its punctuation: commas and periods go inside closing quotation marks
  ("star seismology,"), but not inside the site's structured data (JSON); plain words; claims only as
  strong as the papers.
- Label your role in every paper and project; label AI assistance and illustrations.
- New pages: copy the head, the footer and the scripts before `</body>` (`assets/site.js`, which
  shows each link's address on hover and adds the Contents box) of an existing page at the same depth, then fix the title,
  description, canonical link and Open Graph tags.
