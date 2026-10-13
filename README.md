# kailicao.github.io

The source of Kaili Cao's personal website, published by GitHub Pages at <https://kailicao.github.io/>. Kaili Cao is an Eric and Wendy Schmidt AI in Science Postdoctoral Fellow at the Michigan Institute for Data and AI in Society (MIDAS), University of Michigan.

Version 0.7 (October 2026) adds images to the site: a research map and other diagrams drawn in HTML and inline SVG (so they follow light and dark mode and read as text), figures from my papers, NASA and ESA/Webb images, a portrait, slide thumbnails and highlights of five talks, and small icons beside section headings on the text-heavy pages. Most talks now have their slides or posters as PDF files, with third-party images of commercial or unclear rights blurred and described. The CV has a full and a short version in a one-column layout that automatic parsers read, alongside a one-page résumé. MapHub, the MIDAS arXiv Preprint Hub, is at <https://kailicao.github.io/maphub-public/>.

The site is plain HTML and CSS, with no build step: edit the pages directly.

The folders mirror the site's menus: each section's page is the `index.html` of its folder (`about/index.html` is served at `/about/`), and the root holds only the home page and the not-found page.

| Path | Contents |
| --- | --- |
| `index.html` | The home page |
| `ai/`, `research-directions/`, `glossary/` | AI in science; Research Directions across the three areas; the glossary the science pages link to |
| `about/` | About, and under it: publications, presentations (with `about/presentations/`: slides as PDF files, third-party images blurred and described), software, personal, colophon |
| `images/`, `cosmology/`, `stars/` | Each research area's page, and one page per topic: image reconstruction, image analysis and extragalactic astronomy; cosmological inference and simulations; stellar modeling and asteroseismology |
| `opinions/` | Opinions, and under it: learning Python (with the Huarongdao puzzle), Python philosophy, research ethics, teaching and career notes |
| `assets/` | The stylesheets, the scripts (`site.js` on every page: link addresses, Contents, Copy buttons; `terms.js`: glossary pop-ups), icons and figures |
| `cv/` | The CV in two versions, `Kaili_Cao_CV.pdf` (full, the copy the site links to) and `Kaili_Cao_CV_short.pdf` (first-author papers and selected talks), and a one-page résumé for data science and software roles, `Kaili_Cao_Resume.pdf` (from `Kaili_Cao_Resume.tex`); the CVs are built from one source: `cv.tex`, with the publication lists in `bib-*.tex` and a one-column style in `kccv.sty` that automatic parsers read; run `latexmk` in `cv/` to rebuild all three |
| `tools/` | `check_site.py` (links, anchors, footers, sitemap, scripts) and `terms.py` (the "Terms on this page" boxes); see `MAINTAINING.md` |
| `404.html`, `sitemap.xml`, `robots.txt`, `llms.txt` | The not-found page and files for search engines and AI tools |

Contact: <kailicao@umich.edu>
