// Starting layouts for the Huarongdao solver, all solvable.
// Chosen by Claude from every possible layout, using the original Python
// program's move rules; 'moves' is the fewest moves to free Cao Cao.
// Coordinates: [caocao, hGenerals, vGenerals, soldiers, vacancies] (see solver.js).
'use strict';
const PUZZLES = [
  { name: "Five generals standing", level: 'Easy', moves: 19,
    coords: [8, [], [6, 14, 15, 16, 17], [1, 7, 18, 19], [0, 3]] },
  { name: "Open gate", level: 'Easy', moves: 29,
    coords: [17, [1], [4, 7, 12, 15], [5, 6, 16, 19], [9, 10]] },
  { name: "Five generals lying", level: 'Easy', moves: 34,
    coords: [17, [0, 2, 4, 6, 9], [], [8, 11, 12, 15], [16, 19]] },
  { name: "Five lying, tangled", level: 'Medium', moves: 55,
    coords: [17, [1, 4, 6, 8, 10], [], [0, 3, 12, 16], [15, 19]] },
  { name: "Side by side", level: 'Medium', moves: 60,
    coords: [17, [1], [4, 7, 12, 15], [5, 6, 9, 10], [16, 19]] },
  { name: "Three across", level: 'Medium', moves: 69,
    coords: [17, [1, 5, 9], [11, 19], [4, 8, 12, 16], [0, 3]] },
  { name: "横刀立马 (the classic)", level: 'Hard', moves: 81,
    coords: [17, [9], [8, 11, 16, 19], [0, 3, 5, 6], [1, 2]] },
  { name: "Soldiers at the back", level: 'Hard', moves: 82,
    coords: [17, [5], [8, 11, 16, 19], [0, 1, 2, 3], [9, 10]] },
  { name: "Hardest with one horizontal", level: 'Hard', moves: 93,
    coords: [17, [9], [5, 8, 11, 19], [0, 2, 3, 12], [6, 16]] },
  { name: "Hardest with four horizontals", level: 'Hard', moves: 97,
    coords: [16, [2, 6, 8, 14], [5], [0, 10, 18, 19], [4, 11]] },
  { name: "Two across, Cao Cao on top", level: 'Very hard', moves: 110,
    coords: [17, [1, 8], [7, 10, 15], [0, 4, 12, 19], [5, 16]] },
  { name: "Three across, symmetric", level: 'Very hard', moves: 123,
    coords: [17, [1, 5, 9], [8, 11], [0, 3, 12, 15], [16, 19]] },
  { name: "Hardest with three horizontals", level: 'Very hard', moves: 135,
    coords: [16, [2, 6, 10], [9, 19], [0, 1, 4, 14], [8, 18]] },
  { name: "The hardest of all", level: 'Very hard', moves: 138,
    coords: [12, [0, 5], [11, 14, 19], [4, 16, 17, 18], [2, 3]] },
];
if (typeof module !== 'undefined') module.exports = { PUZZLES };
