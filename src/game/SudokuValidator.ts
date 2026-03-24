import type { Grid, CellPosition } from '../types/sudoku';

export function isComplete(grid: Grid): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === 0) return false;
    }
  }
  return true;
}

export function isCorrect(grid: Grid, solution: Grid): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] !== solution[row][col]) return false;
    }
  }
  return true;
}

export function isMistake(grid: Grid, solution: Grid, pos: CellPosition): boolean {
  const { row, col } = pos;
  const value = grid[row][col];
  return value !== 0 && value !== solution[row][col];
}

export function getMistakeCells(grid: Grid, solution: Grid): CellPosition[] {
  const mistakes: CellPosition[] = [];
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (isMistake(grid, solution, { row, col })) {
        mistakes.push({ row, col });
      }
    }
  }
  return mistakes;
}

export function getCandidates(grid: Grid, pos: CellPosition): number[] {
  const { row, col } = pos;
  if (grid[row][col] !== 0) return [];

  const used = new Set<number>();

  // 行
  for (let c = 0; c < 9; c++) {
    if (grid[row][c] !== 0) used.add(grid[row][c]);
  }
  // 列
  for (let r = 0; r < 9; r++) {
    if (grid[r][col] !== 0) used.add(grid[r][col]);
  }
  // 3x3ボックス
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (grid[r][c] !== 0) used.add(grid[r][c]);
    }
  }

  return [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(n => !used.has(n));
}
