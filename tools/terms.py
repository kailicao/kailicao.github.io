#!/usr/bin/env python3
"""Add a "Terms on this page" box to each science page, built from the central glossary.

The glossary (glossary/index.html, and zh/glossary/index.html for Chinese pages) stays the single
source: definitions are written and corrected there only. This script copies the definitions of the terms a
page links to (links with class="term") into a collapsible box at the end of the page's <main>. The small
script assets/terms.js then shows the same definitions in a pop-up when a reader hovers, focuses or taps a
term. Without JavaScript, the box still works and term links still lead to the glossary.

Run from the site root after editing the glossary or a page:   python3 tools/terms.py
It is idempotent: the box sits between <!-- terms:start --> and <!-- terms:end --> and is rebuilt each run.
"""
import html, os, posixpath, re, sys

PAGES = ['stars/asteroseismology.html', 'stars/stellar-modeling.html', 'images/image-reconstruction.html',
         'images/image-analysis.html', 'cosmology/cosmological-inference.html',
         'cosmology/cosmological-simulations.html', 'research-directions/index.html', 'ai/index.html']
LABELS = {'en': ('Terms on this page', 'Full glossary'), 'zh': ('本页术语', '查看完整术语表')}
START, END = '<!-- terms:start -->', '<!-- terms:end -->'

def load_glossary(path):
    s = open(path, encoding='utf-8').read()
    out = {}
    for tid, dt, dd in re.findall(r'<dt id="([^"]+)">(.*?)</dt>\s*<dd>(.*?)</dd>', s, re.S):
        dd = re.sub(r'\s*<span class="seen">.*?</span>', '', dd, flags=re.S).strip()
        out[tid] = (dt.strip(), dd)
    return out

def link(target, page_dir):
    """Relative link from page_dir to target; a section's index.html is linked as its folder."""
    if target.endswith('/index.html'):
        return posixpath.relpath(posixpath.dirname(target), page_dir or '.') + '/'
    return posixpath.relpath(target, page_dir or '.')

def rebase(fragment, page_dir):
    """Rewrite relative links in a glossary definition (written relative to glossary/) for page_dir."""
    def fix(m):
        url = m.group(2)
        if re.match(r'[a-z]+:|#|/', url): return m.group(0)
        path, frag = (url.split('#', 1) + [''])[:2]
        target = posixpath.normpath(posixpath.join('glossary', path)) if path else 'glossary/index.html'
        if posixpath.basename(target) and '.' not in posixpath.basename(target): target += '/index.html'
        return f'{m.group(1)}"{link(target, page_dir)}{"#" + frag if frag else ""}"'
    return re.sub(r'(href=)"([^"]+)"', fix, fragment)

def build(root, lang, page):
    path = os.path.join(root, page)
    if not os.path.exists(path): return 0
    s = open(path, encoding='utf-8').read()
    s = re.sub(re.escape(START) + r'.*?' + re.escape(END) + r'\n?', '', s, flags=re.S)
    page_dir = posixpath.dirname(page[3:] if lang == 'zh' else page)
    gloss_rel = link('glossary/index.html', page_dir)
    ids = []
    for href in re.findall(r'<a class="term" href="([^"]+)"', s):
        tid = href.split('#', 1)[1] if '#' in href else None
        if tid and tid not in ids: ids.append(tid)
    G = GLOSS[lang]
    missing = [t for t in ids if t not in G]
    if missing: print(f'  {lang}/{page}: no glossary entry for {missing}', file=sys.stderr)
    ids = [t for t in ids if t in G]
    if not ids:
        open(path, 'w', encoding='utf-8').write(s); return 0
    title, more = LABELS[lang]
    items = '\n'.join(f'  <dt id="term-{t}">{G[t][0]}</dt>\n  <dd>{rebase(G[t][1], page_dir)}</dd>' for t in ids)
    box = (f'{START}\n<details class="terms-box" id="terms">\n<summary>{title}（{len(ids)}）</summary>\n' if lang == 'zh' else
           f'{START}\n<details class="terms-box" id="terms">\n<summary>{title} ({len(ids)})</summary>\n')
    box += f'<dl class="glossary">\n{items}\n</dl>\n<p><a href="{gloss_rel}">{more}</a></p>\n</details>\n{END}\n'
    s = s.replace('</main>', box + '</main>', 1)
    js = posixpath.relpath('assets/terms.js', posixpath.dirname(page) or '.')
    if 'assets/terms.js' not in s:
        s = s.replace('</body>', f'<script src="{js}" defer></script>\n</body>', 1)
    open(path, 'w', encoding='utf-8').write(s)
    return len(ids)

if __name__ == '__main__':
    root = sys.argv[1] if len(sys.argv) > 1 else '.'
    GLOSS = {'en': load_glossary(os.path.join(root, 'glossary/index.html'))}
    if os.path.exists(os.path.join(root, 'zh/glossary/index.html')):
        GLOSS['zh'] = load_glossary(os.path.join(root, 'zh/glossary/index.html'))
    for lang in GLOSS:
        for page in PAGES:
            p = page if lang == 'en' else 'zh/' + page
            n = build(root, lang, p)
            print(f'{p}: {n} terms')
