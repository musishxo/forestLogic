import { DataPoint } from './types';

export const BASE_DATA: DataPoint[] = [
  // Approve (high income, good score)
  { inc: 95, score: 780, c: 0 }, { inc: 85, score: 750, c: 0 }, { inc: 110, score: 800, c: 0 },
  { inc: 70, score: 720, c: 0 }, { inc: 60, score: 710, c: 0 }, { inc: 50, score: 700, c: 0 },

  // Review (medium income or mid score)
  { inc: 45, score: 640, c: 1 }, { inc: 40, score: 680, c: 1 }, { inc: 55, score: 620, c: 1 },
  { inc: 30, score: 700, c: 1 }, { inc: 65, score: 600, c: 1 }, { inc: 75, score: 650, c: 1 },

  // Deny (low income or poor score)
  { inc: 20, score: 450, c: 2 }, { inc: 15, score: 520, c: 2 }, { inc: 28, score: 490, c: 2 },
  { inc: 25, score: 560, c: 2 }, { inc: 18, score: 420, c: 2 }, { inc: 35, score: 480, c: 2 }
];

export const GRID_CONFIG = {
  rows: 80, // Slightly reduced for React performance responsiveness
  cols: 80,
  padInc: 12,
  padScore: 60
};
