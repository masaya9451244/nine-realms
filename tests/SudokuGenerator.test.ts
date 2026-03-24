import { describe, it, expect } from 'vitest';
import { generate } from '../src/game/SudokuGenerator';

function isValidSudoku(grid: number[][]): boolean {
  // 行チェック
  for (let r = 0; r < 9; r++) {
    const nums = grid[r].filter(n => n !== 0);
    if (new Set(nums).size !== nums.length) return false;
  }
  // 列チェック
  for (let c = 0; c < 9; c++) {
    const nums = grid.map(r => r[c]).filter(n => n !== 0);
    if (new Set(nums).size !== nums.length) return false;
  }
  // 3x3ボックスチェック
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      const nums: number[] = [];
      for (let r = br * 3; r < br * 3 + 3; r++) {
        for (let c = bc * 3; c < bc * 3 + 3; c++) {
          if (grid[r][c] !== 0) nums.push(grid[r][c]);
        }
      }
      if (new Set(nums).size !== nums.length) return false;
    }
  }
  return true;
}

describe('SudokuGenerator', () => {
  it('9x9のグリッドを生成する', () => {
    const puzzle = generate(20);
    expect(puzzle.grid.length).toBe(9);
    puzzle.grid.forEach(row => expect(row.length).toBe(9));
  });

  it('解答は1〜9の数字のみを含む完全なグリッドである', () => {
    const puzzle = generate(20);
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        expect(puzzle.solution[r][c]).toBeGreaterThanOrEqual(1);
        expect(puzzle.solution[r][c]).toBeLessThanOrEqual(9);
      }
    }
  });

  it('解答は有効な数独である', () => {
    const puzzle = generate(20);
    expect(isValidSudoku(puzzle.solution)).toBe(true);
  });

  it('問題グリッドは有効な数独である（空白を除く）', () => {
    const puzzle = generate(25);
    expect(isValidSudoku(puzzle.grid)).toBe(true);
  });

  it('問題グリッドの空白数が指定難易度以下である', () => {
    const difficulty = 30;
    const puzzle = generate(difficulty);
    const blanks = puzzle.grid.flat().filter(n => n === 0).length;
    expect(blanks).toBeLessThanOrEqual(difficulty);
  });

  it('問題グリッドの空白セルは解答と一致しない（=0）', () => {
    const puzzle = generate(20);
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (puzzle.grid[r][c] !== 0) {
          expect(puzzle.grid[r][c]).toBe(puzzle.solution[r][c]);
        }
      }
    }
  });
});
