# Kaili Cao's Personal Website

The source of Kaili Cao's personal website, published by GitHub Pages at <https://kailicao.github.io/>. Kaili Cao is an Eric and Wendy Schmidt AI in Science Postdoctoral Fellow at the Michigan Institute for Data and AI in Society (MIDAS), University of Michigan.

The site is in English and Chinese (under `zh/`, page for page, with a 中文 / English button that keeps the reader on the same page and anchor). Its diagrams are drawn in HTML and inline SVG, so they follow light and dark mode and read as text; talks have their slides or posters as PDF files, with third-party images of commercial or unclear rights blurred and described; the CV comes in a full and a short version that automatic parsers read, alongside a one-page résumé. The current version is in every page's footer. MapHub, the MIDAS arXiv Preprint Hub, is a separate repository served at <https://kailicao.github.io/maphub-public/>.

The site is plain HTML and CSS, with no build step: edit the pages directly. How to edit, check and release it is in `MAINTAINING.md`.

The folders mirror the site's menus: each section's page is the `index.html` of its folder (`about/index.html` is served at `/about/`), and the root holds only the home page and the not-found page (and Search Console's verification file). In the order VS Code's Explorer shows them:

```text
about/                    About, and under it: research directions across the
                          areas (research.html), publications, presentations,
                          software, personal, colophon
  presentations/          the slides and posters as PDF files
assets/                   stylesheets, scripts (site.js on every page; terms.js
                          for glossary pop-ups), icons, figures
cv/                       the full CV (Kaili_Cao_CV.pdf, the copy the site
                          links to), the short one (first-author papers and
                          selected talks) and the one-page résumé, with their
                          LaTeX sources (cv.tex with its two wrappers,
                          Kaili_Cao_CV.tex and Kaili_Cao_CV_short.tex;
                          bib-*.tex, kccv.sty, Kaili_Cao_Resume.tex); run
                          latexmk here to rebuild all three (latexmkrc)
opinions/                 Opinions: learning Python (with the Huarongdao
                          puzzle), Python philosophy, my Python style, research
                          ethics, teaching and career notes
research-ai/              AI in science: AI-Ready Data, Working with AI,
                          MapHub, and the glossary the science pages link to
research-cosmology/       cosmological inference and simulations
research-images/          image reconstruction, image analysis and
                          extragalactic astronomy
research-stars/           stellar modeling and asteroseismology
tools/                    the checker, the term boxes and the slide builders
                          (MAINTAINING.md), and fonts/ (open fonts the slide
                          builders use)
zh/                       the Chinese version: the same folders and file names
.gitignore
.nojekyll                 tells GitHub Pages to serve the files as they are
404.html                  the not-found page; sends addresses under zh/ to
                          zh/404.html
google1ed45f418e6f562c.html  Google Search Console's verification file (below)
index.html                the home page
llms.txt                  for AI tools
MAINTAINING.md            how to maintain the site
README.md                 this file
robots.txt                for search engines
sitemap.xml               for search engines; it also lists the MapHub viewer,
                          served from maphub-public on the same host
```

Keep `google1ed45f418e6f562c.html` and the `google-site-verification` meta tag in `index.html` (a second verification method) unchanged, or the site loses its verification in Google Search Console.

Contact: <kailicao@umich.edu>
