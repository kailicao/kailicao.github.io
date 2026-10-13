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
  const NAMES = { C: 'Cao Cao', H: 'a horizontal general', V: 'a vertical general', S: 'a soldier' };
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
    group.label = level;
    PUZZLES.forEach((p, i) => {
      if (p.level !== level) return;
      const option = document.createElement('option');
      option.value = i;
      option.textContent = `${p.name} (${p.moves} moves)`;
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
        description = `${NAMES[type]} moves ${direction(gone[i], added[i])}`;
      }
    }
    current = coords;
    return description;
  }

  function direction(from, to) {
    const [c0, r0] = board.getColRow(from), [c1, r1] = board.getColRow(to);
    const parts = [];
    const say = (n, word) => parts.push(Math.abs(n) === 2 ? `${word} two cells` : word);
    if (c1 !== c0) say(c1 - c0, c1 > c0 ? 'right' : 'left');
    if (r1 !== r0) say(r1 - r0, r1 > r0 ? 'up' : 'down');
    return parts.join(' and ');
  }

  // --- controls --------------------------------------------------------------
  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
    buttons.play.textContent = 'Play';
    buttons.play.setAttribute('aria-label', 'Play the solution');
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
      update(target === 0 ? `Start: ${path.length - 1} moves to go.`
                          : target === path.length - 1 ? `Move ${step} of ${path.length - 1}: Cao Cao escapes!`
                          : `Move ${step} of ${path.length - 1}.`);
      return;
    }
    const forward = target > step;
    const what = moveTo(path[target]);
    step = target;
    const total = path.length - 1;
    if (!forward) {
      update(step === 0 ? 'Back at the start.' : `Back to move ${step} of ${total}.`);
    } else {
      update(`Move ${step} of ${total}: ${what}${step === total ? '. Cao Cao escapes!' : '.'}`);
    }
  }

  function load() {
    stop();
    const puzzle = PUZZLES[+select.value];
    path = null; step = 0;
    drawFresh(puzzle.coords);
    root.classList.toggle('animate', !reducedMotion);
    update(`${puzzle.name}: Cao Cao, the large block, must reach the exit at the bottom. ` +
           'Press Solve to search for the shortest solution.');
  }

  function solve() {
    status.textContent = 'Solving…';
    buttons.solve.disabled = true;
    setTimeout(() => {  // let the message appear before the search runs
      const solution = new Solution(board, current);
      const t0 = performance.now();
      const found = solution.findPath();
      const ms = Math.round(performance.now() - t0);
      const searched = solution.nsearched.toLocaleString('en-US');
      if (!found) {
        update(`No solution: Cao Cao cannot escape from this layout (searched ${searched} positions).`);
        return;
      }
      path = found; step = 0;
      update(`Solved in ${path.length - 1} moves, the fewest possible, after searching ` +
             `${searched} positions in ${ms} ms. Use the buttons to step through it.`);
    }, 30);
  }

  function play() {
    if (timer) { stop(); return; }
    if (!path || step === path.length - 1) return;
    buttons.play.textContent = 'Pause';
    buttons.play.setAttribute('aria-label', 'Pause');
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
