// Pop-up definitions for glossary terms (progressive enhancement).
// Definitions come from this page's own "Terms on this page" box (built from the glossary by tools/terms.py),
// so nothing is fetched. Mouse: hover or focus a term to see its definition; clicking still opens the glossary.
// Touch: the first tap shows the definition, with a link to the glossary entry; tapping elsewhere closes it.
// Esc closes it. Readers can turn pop-ups off (from a pop-up, or the checkbox in the box); the choice lasts
// for the visit (sessionStorage, this tab). Without JavaScript, term links simply lead to the glossary.
(function () {
  'use strict';
  var box = document.getElementById('terms');
  if (!box) return;
  var zh = (document.documentElement.lang || '').indexOf('zh') === 0;
  var T = zh ? { more: '在术语表中查看', off: '关闭弹出释义', toggle: '指向术语时显示释义（本次浏览有效）' }
             : { more: 'Open in the glossary', off: 'Turn off pop-ups', toggle: 'Show definitions when pointing at a term (for this visit)' };
  var KEY = 'kc-term-popups';
  function getOn() { try { return sessionStorage.getItem(KEY) !== 'off'; } catch (e) { return true; } }
  function saveOn(v) { try { sessionStorage.setItem(KEY, v ? 'on' : 'off'); } catch (e) { /* storage blocked: lasts for this page */ } }
  var on = getOn();

  var defs = {};
  box.querySelectorAll('dt[id^="term-"]').forEach(function (dt) {
    var dd = dt.nextElementSibling;
    if (dd && dd.tagName === 'DD') defs[dt.id.slice(5)] = { term: dt.innerHTML, def: dd.innerHTML };
  });

  var main = document.querySelector('main') || document.body;
  var pop = document.createElement('div');
  pop.className = 'term-pop';
  pop.id = 'term-pop';
  pop.setAttribute('role', 'tooltip');
  pop.hidden = true;
  main.appendChild(pop);  // inside <main>, so it stays in a landmark
  var current = null, hideTimer = null;

  // the on/off checkbox, at the top of the box
  var p = document.createElement('p');
  p.className = 'term-toggle';
  p.innerHTML = '<label><input type="checkbox"> ' + T.toggle + '</label>';
  var cb = p.querySelector('input');
  box.insertBefore(p, box.querySelector('dl'));

  function setOn(v) {
    on = v; saveOn(v); cb.checked = v;
    document.documentElement.classList.toggle('term-popups', v);
    if (!v) hide();
  }
  cb.addEventListener('change', function () { setOn(cb.checked); });

  function idOf(a) {
    var h = a.getAttribute('href') || '';
    var i = h.indexOf('#');
    return i < 0 ? null : h.slice(i + 1);
  }
  function show(a, withLink) {
    var d = on && defs[idOf(a)];
    if (!d) return false;
    clearTimeout(hideTimer);
    pop.innerHTML = '<strong>' + d.term + '</strong><br>' + d.def +
      '<span class="term-pop-actions">' +
      (withLink ? '<a class="term-pop-more" href="' + a.getAttribute('href') + '">' + T.more + '</a>' : '') +
      '<button type="button" class="term-pop-off">' + T.off + '</button></span>';
    pop.querySelector('.term-pop-off').addEventListener('click', function () {
      var a0 = current; setOn(false); if (a0) a0.focus();
    });
    pop.hidden = false;
    var r = a.getBoundingClientRect();
    var w = Math.min(448, window.innerWidth - 32);
    pop.style.width = w + 'px';
    var left = Math.max(16, Math.min(r.left + window.scrollX, window.scrollX + window.innerWidth - w - 16));
    pop.style.left = left + 'px';
    pop.style.top = (r.bottom + window.scrollY + 6) + 'px';
    var pr = pop.getBoundingClientRect();
    if (pr.bottom > window.innerHeight && r.top > pr.height + 12) {
      pop.style.top = (r.top + window.scrollY - pr.height - 6) + 'px';
    }
    if (current && current !== a) current.removeAttribute('aria-describedby');
    a.setAttribute('aria-describedby', 'term-pop');
    current = a;
    return true;
  }
  function hide() {
    pop.hidden = true;
    if (current) current.removeAttribute('aria-describedby');
    current = null;
  }
  function hideSoon() { clearTimeout(hideTimer); hideTimer = setTimeout(hide, 150); }

  var touch = false;
  main.querySelectorAll('a.term').forEach(function (a) {
    if (box.contains(a)) return;
    a.addEventListener('touchstart', function () { touch = true; }, { passive: true });
    a.addEventListener('mouseenter', function () { if (!touch) show(a, false); });
    a.addEventListener('mouseleave', hideSoon);
    a.addEventListener('focus', function () { if (!touch) show(a, false); });
    a.addEventListener('blur', function () { if (!pop.contains(document.activeElement)) hideSoon(); });
    a.addEventListener('click', function (e) {
      if (touch && on && current !== a && show(a, true)) e.preventDefault();  // first tap: show; second tap: follow
    });
  });
  pop.addEventListener('mouseenter', function () { clearTimeout(hideTimer); });
  pop.addEventListener('mouseleave', hideSoon);
  pop.addEventListener('focusin', function () { clearTimeout(hideTimer); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') hide(); });
  document.addEventListener('click', function (e) {
    if (!pop.hidden && !pop.contains(e.target) && !(current && current.contains(e.target))) hide();
  });
  window.addEventListener('resize', hide);
  setOn(on);
})();
