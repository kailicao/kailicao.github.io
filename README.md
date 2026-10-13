# kailicao.github.io

The source of Kaili Cao's personal website, published by GitHub Pages at <https://kailicao.github.io/>. Kaili Cao is an Eric and Wendy Schmidt AI in Science Postdoctoral Fellow at the Michigan Institute for Data and AI in Society (MIDAS), University of Michigan.

Version 0.6 (October 2026) has a home page with an "At a glance" summary; About (with publications, presentations, software, a personal page and a colophon); AI in science; research on images (including extragalactic astronomy), cosmology and stars, with one page per topic, a glossary and a Research Directions page; and opinions on teaching, research ethics, careers and Python. MapHub, the MIDAS arXiv Preprint Hub, is at <https://kailicao.github.io/maphub-public/>.

The site is plain HTML and CSS, with no build step: edit the pages directly.

The folders mirror the site's menus.

| Path | Contents |
| --- | --- |
| `index.html`, `about.html`, `ai.html`, `images.html`, `cosmology.html`, `stars.html`, `opinions.html` | The main pages: home, about, AI in science, the three research areas, opinions |
| `research-directions.html`, `glossary.html` | Research Directions across the three areas, and the glossary the science pages link to |
| `about/` | Under About: publications, presentations (with `about/presentations/`: slides as PDF files, third-party images blurred and described), software, personal, colophon |
| `images/`, `cosmology/`, `stars/` | One page per research topic: image reconstruction, image analysis and extragalactic astronomy; cosmological inference and simulations; stellar modeling and asteroseismology |
| `opinions/` | Teaching, Python, research ethics and career notes, and the Huarongdao puzzle |
| `assets/` | The stylesheet, scripts, icons and figures |
| `cv/` | The CV: LaTeX source (moderncv) and `Kaili_Cao_CV.pdf`, the copy the site links to; run `latexmk` in `cv/` to rebuild it |
| `tools/` | `check_site.py` (links, anchors, footers, sitemap) and `terms.py` (the "Terms on this page" boxes); see `MAINTAINING.md` |
| `404.html`, `sitemap.xml`, `robots.txt`, `llms.txt` | The not-found page and files for search engines and AI tools |

Contact: <kailicao@umich.edu>
