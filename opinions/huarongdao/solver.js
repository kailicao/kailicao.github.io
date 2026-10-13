// Huarongdao solver: a JavaScript port of Kaili Cao's Python program
// (huarongdao_v22.11.16.py), ported with AI assistance (Claude).
//
// The port keeps the original's classes (Board, Config, Solution), methods and
// move rules, so the two can be read side by side. It leaves out the drawing
// (matplotlib, OpenCV), which the web page does instead, and it changes two
// things: Solution.findPath returns null when no solution exists, and the
// queue is a plain array with a moving head instead of queue.Queue.
//
// Coordinates follow the original: the board is 4 columns by 5 rows, a cell's
// coordinate is row * 4 + col, and row 0 is the bottom row. A piece's
// coordinate is its upper-left cell. A configuration ("coords") is
//   [caocao, hGenerals, vGenerals, soldiers, vacancies]
// with every list sorted, e.g. the classic 横刀立马:
//   [17, [9], [8, 11, 16, 19], [0, 3, 5, 6], [1, 2]]
// Cao Cao escapes when his coordinate is 5 (bottom center).

'use strict';

class Board {
  constructor(width = 4, height = 5) {
    this.width = width;
    this.height = height;
  }

  getColRow(coord) {
    return [coord % this.width, Math.floor(coord / this.width)];
  }

  // The cell shifted by (hshift, vshift) from coord, or -1 if off the board.
  getNeighbor(coord, hshift = 0, vshift = 0) {
    let [col, row] = this.getColRow(coord);
    col += hshift; row += vshift;
    if (!(col >= 0 && col < this.width)) return -1;
    if (!(row >= 0 && row < this.height)) return -1;
    return row * this.width + col;
  }

  // Cells up to two steps away from coord in each direction,
  // keyed by "hshift,vshift".
  getVicinity(coord) {
    const vicinity = {};
    for (const hshift of [-2, -1, 1, 2]) {
      vicinity[`${hshift},0`] = this.getNeighbor(coord, hshift, 0);
    }
    for (const vshift of [-2, -1, 1, 2]) {
      vicinity[`0,${vshift}`] = this.getNeighbor(coord, 0, vshift);
    }
    return vicinity;
  }

  // The vicinity of both vacancies, keyed by "v,hshift,vshift" (v = 1 or 2),
  // and whether the vacancies are adjacent horizontally ('H') or
  // vertically ('V'). Cells that are the other vacancy, or lie beyond it,
  // are masked with -1.
  getVicinity2(coords) {
    const [coord1, coord2] = coords;
    let adjacent = '';
    if (coord1 === this.getNeighbor(coord2, -1, 0)) {
      adjacent = 'H';
    } else if (coord1 === this.getNeighbor(coord2, 0, -1)) {
      adjacent = 'V';
    }

    const vicinity = {};
    for (const [shift, coord] of Object.entries(this.getVicinity(coord1))) {
      vicinity[`1,${shift}`] = coord;
    }
    for (const [shift, coord] of Object.entries(this.getVicinity(coord2))) {
      vicinity[`2,${shift}`] = coord;
    }

    if (adjacent === 'H') {
      for (const key of ['2,-2,0', '2,-1,0', '1,1,0', '1,2,0']) vicinity[key] = -1;
    } else if (adjacent === 'V') {
      for (const key of ['2,0,-2', '2,0,-1', '1,0,1', '1,0,2']) vicinity[key] = -1;
    }
    return { adjacent, vicinity };
  }
}

const numeric = (a, b) => a - b;

class Config {
  constructor(board, coords) {
    this.board = board;
    this.caocao = coords[0];
    this.hGenerals = [...coords[1]];
    this.vGenerals = [...coords[2]];
    this.soldiers = [...coords[3]];
    this.vacancies = [...coords[4]];
    this.neighbors = null;
  }

  static listReplace(array, oldValue, newValue) {
    array[array.indexOf(oldValue)] = newValue;
    array.sort(numeric);
  }

  moveCaocao(shift) {
    const b = this.board, c = this.caocao;
    const newCaocao = b.getNeighbor(c, ...shift);
    let newVacancies;
    if (shift[0] === 1 && shift[1] === 0) {
      newVacancies = [b.getNeighbor(c, 0, -1), c];
    } else if (shift[0] === -1 && shift[1] === 0) {
      newVacancies = [b.getNeighbor(c, 1, -1), b.getNeighbor(c, 1, 0)];
    } else if (shift[0] === 0 && shift[1] === -1) {
      newVacancies = [c, b.getNeighbor(c, 1, 0)];
    } else {  // (0, 1)
      newVacancies = [b.getNeighbor(c, 0, -1), b.getNeighbor(c, 1, -1)];
    }
    this.neighbors.push([newCaocao, [...this.hGenerals], [...this.vGenerals],
                         [...this.soldiers], newVacancies]);
  }

  moveHGeneral(oldCoord, shift) {
    const b = this.board;
    const newHGenerals = [...this.hGenerals];
    Config.listReplace(newHGenerals, oldCoord, b.getNeighbor(oldCoord, ...shift));

    let newVacancies;
    if (shift[0] === 1 && shift[1] === 0) {
      newVacancies = [...this.vacancies];
      Config.listReplace(newVacancies, b.getNeighbor(oldCoord, 2, 0), oldCoord);
    } else if (shift[0] === -1 && shift[1] === 0) {
      newVacancies = [...this.vacancies];
      Config.listReplace(newVacancies, b.getNeighbor(oldCoord, -1, 0),
                         b.getNeighbor(oldCoord, 1, 0));
    } else {  // vertical moves, and horizontal moves by two cells
      newVacancies = [oldCoord, b.getNeighbor(oldCoord, 1, 0)];
    }
    this.neighbors.push([this.caocao, newHGenerals, [...this.vGenerals],
                         [...this.soldiers], newVacancies.sort(numeric)]);
  }

  moveVGeneral(oldCoord, shift) {
    const b = this.board;
    const newVGenerals = [...this.vGenerals];
    Config.listReplace(newVGenerals, oldCoord, b.getNeighbor(oldCoord, ...shift));

    let newVacancies;
    if (shift[0] === 0 && shift[1] === 1) {
      newVacancies = [...this.vacancies];
      Config.listReplace(newVacancies, b.getNeighbor(oldCoord, 0, 1),
                         b.getNeighbor(oldCoord, 0, -1));
    } else if (shift[0] === 0 && shift[1] === -1) {
      newVacancies = [...this.vacancies];
      Config.listReplace(newVacancies, b.getNeighbor(oldCoord, 0, -2), oldCoord);
    } else {  // horizontal moves, and vertical moves by two cells
      newVacancies = [oldCoord, b.getNeighbor(oldCoord, 0, -1)].sort(numeric);
    }
    this.neighbors.push([this.caocao, [...this.hGenerals], newVGenerals,
                         [...this.soldiers], newVacancies]);
  }

  moveSoldier(oldCoord, newCoord) {
    const newSoldiers = [...this.soldiers];
    Config.listReplace(newSoldiers, oldCoord, newCoord);
    const newVacancies = [...this.vacancies];
    Config.listReplace(newVacancies, newCoord, oldCoord);
    this.neighbors.push([this.caocao, [...this.hGenerals], [...this.vGenerals],
                         newSoldiers, newVacancies]);
  }

  // All configurations reachable in one move. With allowTwice, a piece may
  // also move two cells in a straight line, or a soldier may turn a corner,
  // which still counts as one move.
  getNeighbors(allowTwice = true) {
    if (this.neighbors !== null) return this.neighbors;
    this.neighbors = [];
    const { adjacent, vicinity: vic } = this.board.getVicinity2(this.vacancies);
    const H = this.hGenerals, V = this.vGenerals;

    // try to move Caocao
    if (adjacent === 'V') {
      if (vic['2,-2,0'] === this.caocao) this.moveCaocao([1, 0]);
      else if (vic['2,1,0'] === this.caocao) this.moveCaocao([-1, 0]);
    } else if (adjacent === 'H') {
      if (vic['1,0,2'] === this.caocao) this.moveCaocao([0, -1]);
      else if (vic['1,0,-1'] === this.caocao) this.moveCaocao([0, 1]);
    }

    // try to move an HGeneral
    for (const v of [1, 2]) {
      if (H.includes(vic[`${v},-2,0`])) this.moveHGeneral(vic[`${v},-2,0`], [1, 0]);
      if (H.includes(vic[`${v},1,0`])) this.moveHGeneral(vic[`${v},1,0`], [-1, 0]);
    }
    if (adjacent === 'H') {
      if (H.includes(vic['1,0,1'])) this.moveHGeneral(vic['1,0,1'], [0, -1]);
      if (H.includes(vic['1,0,-1'])) this.moveHGeneral(vic['1,0,-1'], [0, 1]);
      if (allowTwice) {
        if (H.includes(vic['1,-2,0'])) this.moveHGeneral(vic['1,-2,0'], [2, 0]);
        if (H.includes(vic['2,1,0'])) this.moveHGeneral(vic['2,1,0'], [-2, 0]);
      }
    }

    // try to move a VGeneral
    for (const v of [1, 2]) {
      if (V.includes(vic[`${v},0,-1`])) this.moveVGeneral(vic[`${v},0,-1`], [0, 1]);
      if (V.includes(vic[`${v},0,2`])) this.moveVGeneral(vic[`${v},0,2`], [0, -1]);
    }
    if (adjacent === 'V') {
      if (V.includes(vic['2,-1,0'])) this.moveVGeneral(vic['2,-1,0'], [1, 0]);
      if (V.includes(vic['2,1,0'])) this.moveVGeneral(vic['2,1,0'], [-1, 0]);
      if (allowTwice) {
        if (V.includes(vic['1,0,-1'])) this.moveVGeneral(vic['1,0,-1'], [0, 2]);
        if (V.includes(vic['2,0,2'])) this.moveVGeneral(vic['2,0,2'], [0, -2]);
      }
    }

    // try to move a Soldier
    const vacancySum = this.vacancies[0] + this.vacancies[1];
    this.vacancies.forEach((vacancy, i) => {
      const v = i + 1;
      for (const [h, vs] of [[1, 0], [-1, 0], [0, -1], [0, 1]]) {
        const oldCoord = vic[`${v},${h},${vs}`];
        if (this.soldiers.includes(oldCoord)) {
          this.moveSoldier(oldCoord, vacancy);
          if (allowTwice && adjacent) this.moveSoldier(oldCoord, vacancySum - vacancy);
        }
      }
    });

    return this.neighbors;
  }
}

class Solution {
  constructor(board, initCoords, { maxNsteps = 100000, allowTwice = true } = {}) {
    this.board = board;
    this.initCoords = initCoords;
    this.maxNsteps = maxNsteps;
    this.allowTwice = allowTwice;
    this.path = null;
    this.nsearched = 0;
  }

  // True if the pieces cover the board exactly once.
  isValid() {
    const b = this.board, c = this.initCoords;
    const cells = [[0, 0], [1, 0], [0, -1], [1, -1]].map(s => b.getNeighbor(c[0], ...s));
    for (let i = 1; i < 5; i++) {
      for (const coord of c[i]) {
        cells.push(coord);
        if (i === 1) cells.push(b.getNeighbor(coord, 1, 0));
        if (i === 2) cells.push(b.getNeighbor(coord, 0, -1));
      }
    }
    cells.sort(numeric);
    return cells.length === b.width * b.height && cells.every((x, i) => x === i);
  }

  // Breadth-first search: the first configuration found with Cao Cao at the
  // exit is reached in the fewest moves. Returns the list of configurations
  // from start to finish, or null if Cao Cao cannot escape.
  findPath() {
    // a configuration as a short string, e.g. '17|9|8,11,16,19|0,3,5,6|1,2'
    const key = coords => coords.join('|');
    const parents = new Map([[key(this.initCoords), null]]);
    const queue = [this.initCoords];
    let head = 0, finalCoords = null;

    for (let i = 0; i < this.maxNsteps && head < queue.length; i++) {
      const coords = queue[head++];
      if (coords[0] === 5) { finalCoords = coords; break; }

      const config = new Config(this.board, coords);
      for (const neighbor of config.getNeighbors(this.allowTwice)) {
        const k = key(neighbor);
        if (parents.has(k)) continue;
        parents.set(k, coords);
        queue.push(neighbor);
      }
    }
    this.nsearched = parents.size;

    if (finalCoords === null) { this.path = null; return null; }
    const path = [];
    for (let coords = finalCoords; coords !== null; coords = parents.get(key(coords))) {
      path.push(coords);
    }
    this.path = path.reverse();
    return this.path;
  }
}

if (typeof module !== 'undefined') module.exports = { Board, Config, Solution };
