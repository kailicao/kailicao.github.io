// The Huarongdao page: lets visitors pick a starting layout, solves it with
// solver.js and steps through the solution. Written with AI assistance (Claude).
'use strict';

(function () {
  const SVG = 'http://www.w3.org/2000/svg';
  const board = new Board();
  const root = document.getElementById('hrd');
  const select = root.querySelector('#hrd-puzzle');
  const svg = root.querySelector('#hrd-board');
  const status = root.querySelector('#hrd-status');
  const buttons = {};
  for (const b of root.querySelectorAll('button[data-action]')) buttons[b.dataset.action] = b;

  const SIZES = { C: [2, 2], H: [2, 1], V: [1, 2], S: [1, 1] };
  // Interface text in English or Chinese, following the page's lang attribute.
  const ZH = document.documentElement.lang.toLowerCase().startsWith('zh');
  const NAMES = ZH ? { C: '曹操', H: '一位横放的将军', V: '一位竖放的将军', S: '一名小兵' }
                   : { C: 'Cao Cao', H: 'a horizontal general', V: 'a vertical general', S: 'a soldier' };
  const LEVELS_ZH = { 'Easy': '简单', 'Medium': '中等', 'Hard': '困难', 'Very hard': '极难' };
  const NAMES_ZH = {
    'Five generals standing': '五将皆竖', 'Open gate': '大开城门', 'Five generals lying': '五将皆横',
    'Five lying, tangled': '五将皆横（纠缠）', 'Side by side': '并肩而立', 'Three across': '三将横陈',
    '横刀立马 (the classic)': '横刀立马（经典开局）', 'Soldiers at the back': '兵在后方',
    'Hardest with one horizontal': '一横将中最难', 'Hardest with four horizontals': '四横将中最难',
    'Two across, Cao Cao on top': '二将横陈，曹操在上', 'Three across, symmetric': '三将横陈（对称）',
    'Hardest with three horizontals': '三横将中最难', 'The hardest of all': '所有开局中最难' };
  const nameOf = p => ZH ? (NAMES_ZH[p.name] || p.name) : p.name;
  const T = ZH ? {
    option: (p) => `${nameOf(p)}（${p.moves}步）`,
    two: (word) => `${word}两格`, join: '，再', right: '向右移', left: '向左移', up: '向上移', down: '向下移',
    play: '播放', playLabel: '播放解法', pause: '暂停',
    start: (n) => `开局：还需${n}步。`, escaped: (s, n) => `第${s}步，共${n}步：曹操逃脱！`, at: (s, n) => `第${s}步，共${n}步。`,
    backStart: '回到开局。', back: (s, n) => `退回第${s}步，共${n}步。`,
    moved: (s, n, what, last) => `第${s}步，共${n}步：${what}${last ? '。曹操逃脱！' : '。'}`,
    loaded: (name) => `${name}：大块的曹操要从底部的出口逃出。按“求解”搜索最短解法。`,
    solving: '求解中……', locale: 'zh-CN',
    none: (k) => `无解：曹操无法从这个布局中逃脱（共搜索了${k}个局面）。`,
    solved: (m, k, ms) => `求解完成：共${m}步，这是最少步数；共搜索了${k}个局面，用时${ms}毫秒。可用下方按钮逐步查看。`,
    moves: (who, dir) => `${who}${dir}`,
  } : {
    option: (p) => `${p.name} (${p.moves} moves)`,
    two: (word) => `${word} two cells`, join: ' and ', right: 'right', left: 'left', up: 'up', down: 'down',
    play: 'Play', playLabel: 'Play the solution', pause: 'Pause',
    start: (n) => `Start: ${n} moves to go.`, escaped: (s, n) => `Move ${s} of ${n}: Cao Cao escapes!`, at: (s, n) => `Move ${s} of ${n}.`,
    backStart: 'Back at the start.', back: (s, n) => `Back to move ${s} of ${n}.`,
    moved: (s, n, what, last) => `Move ${s} of ${n}: ${what}${last ? '. Cao Cao escapes!' : '.'}`,
    loaded: (name) => `${name}: Cao Cao, the large block, must reach the exit at the bottom. ` + 'Press Solve to search for the shortest solution.',
    solving: 'Solving…', locale: 'en-US',
    none: (k) => `No solution: Cao Cao cannot escape from this layout (searched ${k} positions).`,
    solved: (m, k, ms) => `Solved in ${m} moves, the fewest possible, after searching ` + `${k} positions in ${ms} ms. Use the buttons to step through it.`,
    moves: (who, dir) => `${who} moves ${dir}`,
  };
  const TYPES = ['C', 'H', 'V', 'S'];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let current = null;   // the configuration on the board
  let path = null;      // the solution, once solved
  let step = 0;         // position in the solution
  let timer = null;     // autoplay
  let pieces = {};      // type -> Map(coord -> <g> element)

  // --- the puzzle list -------------------------------------------------------
  const levels = [...new Set(PUZZLES.map(p => p.level))];
  for (const level of levels) {
    const group = document.createElement('optgroup');
    group.label = ZH ? (LEVELS_ZH[level] || level) : level;
    PUZZLES.forEach((p, i) => {
      if (p.level !== level) return;
      const option = document.createElement('option');
      option.value = i;
      option.textContent = T.option(p);
      group.appendChild(option);
    });
    select.appendChild(group);
  }
  const classic = PUZZLES.findIndex(p => p.name.startsWith('横刀立马'));
  select.value = String(classic >= 0 ? classic : 0);

  // --- drawing ---------------------------------------------------------------
  const lists = coords => ({ C: [coords[0]], H: coords[1], V: coords[2], S: coords[3] });

  function position(coord) {
    const [col, row] = board.getColRow(coord);
    return [col, board.height - 1 - row];  // row 0 is the bottom row
  }

  function place(g, coord) {
    const [x, y] = position(coord);
    g.style.transform = `translate(${x}px, ${y}px)`;
  }

  function makePiece(type, coord) {
    const g = document.createElementNS(SVG, 'g');
    g.setAttribute('class', `piece piece-${type}`);
    const [w, h] = SIZES[type];
    const rect = document.createElementNS(SVG, 'rect');
    rect.setAttribute('x', 0.06); rect.setAttribute('y', 0.06);
    rect.setAttribute('width', w - 0.12); rect.setAttribute('height', h - 0.12);
    rect.setAttribute('rx', 0.12);
    g.appendChild(rect);
    if (type === 'C') {
      const text = document.createElementNS(SVG, 'text');
      text.setAttribute('x', 1); text.setAttribute('y', 1.17);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('lang', 'zh');
      text.setAttribute('font-size', 0.5);
      text.textContent = '曹操';
      g.appendChild(text);
    }
    place(g, coord);
    svg.querySelector('.pieces').appendChild(g);
    return g;
  }

  function drawFresh(coords) {
    svg.querySelector('.pieces').replaceChildren();
    pieces = {};
    const l = lists(coords);
    for (const type of TYPES) {
      pieces[type] = new Map(l[type].map(c => [c, makePiece(type, c)]));
    }
    current = coords;
  }

  // Move the one piece that differs between the current and the next
  // configuration, and describe the move.
  function moveTo(coords) {
    const before = lists(current), after = lists(coords);
    let description = '';
    for (const type of TYPES) {
      const gone = before[type].filter(c => !after[type].includes(c));
      const added = after[type].filter(c => !before[type].includes(c));
      for (let i = 0; i < gone.length; i++) {
        const g = pieces[type].get(gone[i]);
        pieces[type].delete(gone[i]);
        pieces[type].set(added[i], g);
        place(g, added[i]);
        description = T.moves(NAMES[type], direction(gone[i], added[i]));
      }
    }
    current = coords;
    return description;
  }

  function direction(from, to) {
    const [c0, r0] = board.getColRow(from), [c1, r1] = board.getColRow(to);
    const parts = [];
    const say = (n, word) => parts.push(Math.abs(n) === 2 ? T.two(word) : word);
    if (c1 !== c0) say(c1 - c0, c1 > c0 ? T.right : T.left);
    if (r1 !== r0) say(r1 - r0, r1 > r0 ? T.up : T.down);
    return parts.join(T.join);
  }

  // --- controls --------------------------------------------------------------
  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
    buttons.play.textContent = T.play;
    buttons.play.setAttribute('aria-label', T.playLabel);
  }

  function update(message) {
    const solved = path !== null;
    buttons.solve.disabled = solved;
    buttons.start.disabled = !solved || step === 0;
    buttons.back.disabled = !solved || step === 0;
    buttons.forward.disabled = !solved || step === path.length - 1;
    buttons.end.disabled = !solved || step === path.length - 1;
    buttons.play.disabled = !solved || step === path.length - 1;
    if (message) status.textContent = message;
  }

  function goTo(target) {
    if (!path) return;
    target = Math.max(0, Math.min(path.length - 1, target));
    if (Math.abs(target - step) !== 1) {
      drawFresh(path[target]);
      step = target;
      update(target === 0 ? T.start(path.length - 1)
                          : target === path.length - 1 ? T.escaped(step, path.length - 1)
                          : T.at(step, path.length - 1));
      return;
    }
    const forward = target > step;
    const what = moveTo(path[target]);
    step = target;
    const total = path.length - 1;
    if (!forward) {
      update(step === 0 ? T.backStart : T.back(step, total));
    } else {
      update(T.moved(step, total, what, step === total));
    }
  }

  function load() {
    stop();
    const puzzle = PUZZLES[+select.value];
    path = null; step = 0;
    drawFresh(puzzle.coords);
    root.classList.toggle('animate', !reducedMotion);
    update(T.loaded(nameOf(puzzle)));
  }

  function solve() {
    status.textContent = T.solving;
    buttons.solve.disabled = true;
    setTimeout(() => {  // let the message appear before the search runs
      const solution = new Solution(board, current);
      const t0 = performance.now();
      const found = solution.findPath();
      const ms = Math.round(performance.now() - t0);
      const searched = solution.nsearched.toLocaleString(T.locale);
      if (!found) {
        update(T.none(searched));
        return;
      }
      path = found; step = 0;
      update(T.solved(path.length - 1, searched, ms));
    }, 30);
  }

  function play() {
    if (timer) { stop(); return; }
    if (!path || step === path.length - 1) return;
    buttons.play.textContent = T.pause;
    buttons.play.setAttribute('aria-label', T.pause);
    timer = setInterval(() => {
      goTo(step + 1);
      if (step === path.length - 1) { stop(); update(); }
    }, reducedMotion ? 700 : 450);
  }

  select.addEventListener('change', load);
  buttons.solve.addEventListener('click', solve);
  buttons.start.addEventListener('click', () => { stop(); goTo(0); });
  buttons.back.addEventListener('click', () => { stop(); goTo(step - 1); });
  buttons.forward.addEventListener('click', () => { stop(); goTo(step + 1); });
  buttons.end.addEventListener('click', () => { stop(); goTo(path.length - 1); });
  buttons.play.addEventListener('click', play);

  load();
})();
