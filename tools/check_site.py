#!/usr/bin/env python3
"""Check kailicao.github.io before publishing (no dependencies; Python 3.8+).

  python tools/check_site.py             # internal links, anchors, images, footers, sitemap
  python tools/check_site.py --external  # also ask every external link whether it still works (slow)

Run from the repository root. Prints problems; exits with status 1 if any are found.
"""
import html.parser, os, re, sys, urllib.request, urllib.error
from urllib.parse import urlsplit, unquote

ROOT = os.getcwd()
SITE = 'https://kailicao.github.io/'
SKIP_DIRS = {'.git', 'node_modules', 'previews'}
PROJECT_SITES = ('maphub-public/',)  # other repositories served under the same domain


class Page(html.parser.HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids, self.links, self.imgs, self.footer = set(), [], [], ''
        self._in_footer = False

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if 'id' in a: self.ids.add(a['id'])
        if tag == 'a' and 'name' in a: self.ids.add(a['name'])
        if tag == 'a' and 'href' in a: self.links.append(a['href'])
        if tag == 'img': self.imgs.append(a)
        if tag == 'footer': self._in_footer = True

    def handle_endtag(self, tag):
        if tag == 'footer': self._in_footer = False

    def handle_data(self, data):
        if self._in_footer: self.footer += data


def html_files():
    for d, dirs, files in os.walk(ROOT):
        dirs[:] = [x for x in dirs if x not in SKIP_DIRS]
        for f in files:
            if f.endswith('.html'):
                yield os.path.relpath(os.path.join(d, f), ROOT).replace(os.sep, '/')


def main(external=False):
    pages = {}
    for p in html_files():
        parser = Page(); parser.feed(open(os.path.join(ROOT, p), encoding='utf-8').read()); pages[p] = parser
    problems, ext = [], set()
    for p, pg in pages.items():
        base = os.path.dirname(p)
        for href in pg.links:
            if href.startswith(('mailto:', 'tel:', 'javascript:')): continue
            if href.startswith(('http://', 'https://')):
                if href.startswith(SITE):  # absolute link to this site: treat as internal
                    if href[len(SITE):].startswith(PROJECT_SITES): continue
                    href = '/' + href[len(SITE):]
                else:
                    ext.add(href); continue
            parts = urlsplit(href)
            target = p if not parts.path else (parts.path.lstrip('/') if parts.path.startswith('/')
                                               else os.path.normpath(os.path.join(base, unquote(parts.path))).replace(os.sep, '/'))
            if target.endswith('/') or target in ('', '.'): target = (target.rstrip('/') + '/index.html').lstrip('/')
            if not os.path.exists(os.path.join(ROOT, target)):
                problems.append(f'{p}: broken link {href}')
            elif parts.fragment and target.endswith('.html') and target in pages and parts.fragment not in pages[target].ids:
                problems.append(f'{p}: missing anchor #{parts.fragment} in {target}')
        for img in pg.imgs:
            if not img.get('alt') and img.get('alt') != '':
                problems.append(f'{p}: image without alt text: {img.get("src")}')
    footers = {re.sub(r'\s+', ' ', pg.footer).strip() for p, pg in pages.items() if pg.footer}
    versions = {m for f in footers for m in re.findall(r'Version [\d.]+[^.]*', f)}
    if len(versions) > 1: problems.append(f'footers disagree: {sorted(versions)}')
    if os.path.exists('sitemap.xml'):
        locs = re.findall(r'<loc>(.*?)</loc>', open('sitemap.xml', encoding='utf-8').read())
        for u in locs:
            path = u[len(SITE):] or 'index.html'
            if not os.path.exists(os.path.join(ROOT, path)): problems.append(f'sitemap.xml lists a missing file: {u}')
    if external:
        for u in sorted(ext):
            try:
                req = urllib.request.Request(u, method='HEAD', headers={'User-Agent': 'Mozilla/5.0 (site link check)'})
                urllib.request.urlopen(req, timeout=15)
            except urllib.error.HTTPError as e:
                if e.code not in (403, 405, 429): problems.append(f'external link returns {e.code}: {u}')
            except Exception as e:
                problems.append(f'external link failed ({type(e).__name__}): {u}')
    print(f'{len(pages)} pages, {len(ext)} external links' + (' checked' if external else ' (not checked; use --external)'))
    for x in problems: print(' -', x)
    print('OK' if not problems else f'{len(problems)} problem(s)')
    return 1 if problems else 0


if __name__ == '__main__':
    sys.exit(main('--external' in sys.argv))
