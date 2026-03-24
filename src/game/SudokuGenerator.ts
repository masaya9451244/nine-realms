import type { Grid, SudokuPuzzle } from '../types/sudoku';

function createEmptyGrid(): Grid {
  return Array.from({ length: 9 }, () => Array(9).fill(0));
}

function isValid(grid: Grid, row: number, col: number, num: number): boolean {
  // 行チェック
  if (grid[row].includes(num)) return false;

  // 列チェック
  for (let r = 0; r < 9; r++) {
    if (grid[r][col] === num) return false;
  }

  // 3x3ボックスチェック
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (grid[r][c] === num) return false;
    }
  }

  return true;
}

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function fillGrid(grid: Grid): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === 0) {
        const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        for (const num of nums) {
          if (isValid(grid, row, col, num)) {
            grid[row][col] = num;
            if (fillGrid(grid)) return true;
            grid[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function copyGrid(grid: Grid): Grid {
  return grid.map(row => [...row]);
}

function countSolutions(grid: Grid, limit: number): number {
  let count = 0;
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === 0) {
        for (let num = 1; num <= 9; num++) {
          if (isValid(grid, row, col, num)) {
            grid[row][col] = num;
            count += countSolutions(grid, limit);
            grid[row][col] = 0;
            if (count >= limit) return count;
          }
        }
        return count;
      }
    }
  }
  return count + 1;
}

export function generate(difficulty: number): SudokuPuzzle {
  const solution = createEmptyGrid();
  fillGrid(solution);

  const grid = copyGrid(solution);

  // ランダムな順序でセルを空白にしていく
  const cells = shuffle(
    Array.from({ length: 81 }, (_, i) => ({ row: Math.floor(i / 9), col: i % 9 }))
  );

  let removed = 0;
  for (const { row, col } of cells) {
    if (removed >= difficulty) break;

    const backup = grid[row][col];
    grid[row][col] = 0;

    const test = copyGrid(grid);
    if (countSolutions(test, 2) === 1) {
      removed++;
    } else {
      grid[row][col] = backup;
    }
  }

  return { grid, solution, difficulty: removed };
}
