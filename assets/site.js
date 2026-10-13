// Site-wide behaviour, added to every page (progressive enhancement: pages work without it).

// 1. Link addresses on hover: each link shows its full address in a tooltip, so readers can
//    check where it leads before clicking. Links that already have a title keep it; glossary
//    terms (which have their own pop-ups) and links whose text is already the address are skipped.
document.querySelectorAll('a[href]').forEach(function (a) {
  if (a.title || a.classList.contains('term') || a.classList.contains('lang')) return;
  var url = a.href.replace(/^mailto:/, '');
  if (a.textContent.trim() === url) return;
  a.title = url;
});

// 2. Contents, as on Wikipedia: a list of the page's sections (h2, with h3 beneath), beside the
//    text on wide screens and at the top of the page on narrow ones. "Hide" collapses it; the
//    choice is remembered in this browser. Pages with fewer than two headings get none.
(function () {
  var main = document.querySelector('main');
  if (!main) return;
  var heads = Array.prototype.filter.call(main.querySelectorAll('h2, h3'), function (h) {
    return !h.closest('.terms-box, figure, .hl, nav');
  });
  if (heads.length < 2) return;
  var zh = (document.documentElement.lang || '').indexOf('zh') === 0;
  var T = zh ? { title: '目录', hide: '隐藏', show: '显示', top: '（页首）' }
             : { title: 'Contents', hide: 'hide', show: 'show', top: '(Top)' };
  var used = {};
  document.querySelectorAll('[id]').forEach(function (e) { used[e.id] = true; });
  function slug(t) {
    var s = t.toLowerCase().replace(/[^\w一-鿿]+/g, '-').replace(/^-+|-+$/g, '') || 'section';
    var k = s, n = 2;
    while (used[k]) k = s + '-' + n++;
    used[k] = true;
    return k;
  }
  var nav = document.createElement('nav');
  nav.className = 'toc';
  nav.setAttribute('aria-label', T.title);
  var head = document.createElement('div');
  head.className = 'toc-head';
  var label = document.createElement('span');
  label.className = 'toc-title';
  label.textContent = T.title;
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'toc-toggle';
  head.appendChild(label);
  head.appendChild(btn);
  nav.appendChild(head);
  var list = document.createElement('ol');
  list.id = 'toc-list';
  btn.setAttribute('aria-controls', 'toc-list');
  var links = [], sub = null;
  function item(text, href) {
    var li = document.createElement('li');
    var a = document.createElement('a');
    a.href = href;
    a.textContent = text;
    li.appendChild(a);
    return li;
  }
  list.appendChild(item(T.top, '#'));
  list.firstChild.firstChild.addEventListener('click', function (e) {
    e.preventDefault(); window.scrollTo(0, 0); history.replaceState(null, '', location.pathname + location.search);
  });
  heads.forEach(function (h) {
    // Link to the heading's own id, else to its section's (when it heads the section), else a new one.
    var sec = h.parentNode, id = h.id;
    if (!id && sec.tagName === 'SECTION' && sec.id && sec.querySelector('h2, h3') === h) id = sec.id;
    if (!id) id = h.id = slug(h.textContent);
    var li = item(h.textContent.trim(), '#' + id);
    links.push([h, li.firstChild]);
    if (h.tagName === 'H3' && list.lastChild) {
      if (!sub || sub.parentNode !== list.lastChild) { sub = document.createElement('ol'); list.lastChild.appendChild(sub); }
      sub.appendChild(li);
    } else {
      list.appendChild(li);
      sub = null;
    }
  });
  nav.appendChild(list);
  var start = main.querySelector('h1');
  if (start && start.nextElementSibling && start.nextElementSibling.classList.contains('lead')) start = start.nextElementSibling;
  // After the title and lead; on pages where they sit in a section (Home), after that section.
  if (!start) main.prepend(nav);
  else { while (start.parentNode !== main) start = start.parentNode; start.after(nav); }

  var wide = window.matchMedia('(min-width: 1180px)');
  function stored() { try { return localStorage.getItem('toc'); } catch (e) { return null; } }
  function store(v) { try { localStorage.setItem('toc', v); } catch (e) {} }
  function apply(hidden) {
    nav.classList.toggle('toc-hidden', hidden);
    list.hidden = hidden;
    btn.textContent = hidden ? T.show : T.hide;
    btn.setAttribute('aria-expanded', String(!hidden));
  }
  // Default: shown beside the text on wide screens, folded at the top on narrow ones.
  apply(stored() ? stored() === 'hidden' : !wide.matches);
  btn.addEventListener('click', function () {
    var hidden = !nav.classList.contains('toc-hidden');
    apply(hidden);
    store(hidden ? 'hidden' : 'shown');
  });
  wide.addEventListener('change', function (e) { if (!stored()) apply(!e.matches); });

  // Place the sidebar below the sticky site header, and mark the section being read.
  var header = document.querySelector('header.site');
  function place() { nav.style.setProperty('--toc-top', ((header ? header.offsetHeight : 0) + 16) + 'px'); }
  place();
  window.addEventListener('resize', place);
  var ticking = false;
  function mark() {
    ticking = false;
    var y = (header ? header.offsetHeight : 0) + 24, cur = null;
    links.forEach(function (p) { if (p[0].getBoundingClientRect().top <= y) cur = p[1]; });
    links.forEach(function (p) { p[1].classList.toggle('toc-current', p[1] === cur); });
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(mark); } }, { passive: true });
  mark();
})();

// 3. Copy buttons on code blocks: copies the code exactly as shown.
document.querySelectorAll('main pre').forEach(function (pre) {
  if (!navigator.clipboard) return;
  var zh = (document.documentElement.lang || '').indexOf('zh') === 0;
  var label = zh ? '复制' : 'Copy', done = zh ? '已复制' : 'Copied';
  var b = document.createElement('button');
  b.type = 'button';
  b.className = 'copy-code';
  b.textContent = label;
  b.setAttribute('aria-label', zh ? '复制代码' : 'Copy code');
  b.addEventListener('click', function () {
    var code = (pre.querySelector('code') || pre).innerText.replace(/\n$/, '');
    // An interactive session (>>> prompts): copy only what was typed, without prompts or output.
    if (/^>>> /m.test(code)) {
      code = code.split('\n').filter(function (l) { return /^(>>>|\.\.\.)( |$)/.test(l); })
                 .map(function (l) { return l.slice(4); }).join('\n');
    }
    navigator.clipboard.writeText(code).then(function () {
      b.textContent = done;
      setTimeout(function () { b.textContent = label; }, 1500);
    });
  });
  pre.appendChild(b);
});

// 4. Hideable blocks (data-hideable, e.g. Highlights): a [hide]/[show] button after the heading
//    before them; shown by default, and the choice is remembered in this browser.
document.querySelectorAll('[data-hideable]').forEach(function (box) {
  var h = box.previousElementSibling;
  while (h && !/^H[23]$/.test(h.tagName)) h = h.previousElementSibling;
  if (!h) return;
  var zh = (document.documentElement.lang || '').indexOf('zh') === 0;
  var T = zh ? { hide: '隐藏', show: '显示' } : { hide: 'hide', show: 'show' };
  var keyName = 'hide:' + location.pathname + '#' + (box.id || '');
  var b = document.createElement('button');
  b.type = 'button';
  b.className = 'toc-toggle hide-toggle';
  b.setAttribute('aria-controls', box.id || '');
  var intro = box.previousElementSibling && box.previousElementSibling.tagName === 'P' ? box.previousElementSibling : null;
  function apply(hidden) {
    box.hidden = hidden;
    if (intro) intro.hidden = hidden;
    b.textContent = hidden ? T.show : T.hide;
    b.setAttribute('aria-expanded', String(!hidden));
  }
  var stored = null;
  try { stored = localStorage.getItem(keyName); } catch (e) {}
  apply(stored === 'hidden');
  b.addEventListener('click', function () {
    var hidden = !box.hidden;
    apply(hidden);
    try { localStorage.setItem(keyName, hidden ? 'hidden' : 'shown'); } catch (e) {}
  });
  h.appendChild(document.createTextNode(' '));
  h.appendChild(b);
});
