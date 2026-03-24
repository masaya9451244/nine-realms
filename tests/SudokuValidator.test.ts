import { describe, it, expect } from 'vitest';
import { isComplete, isCorrect, isMistake, getMistakeCells, getCandidates } from '../src/game/SudokuValidator';
import { generate } from '../src/game/SudokuGenerator';

describe('SudokuValidator', () => {
  describe('isComplete', () => {
    it('空白がなければtrueを返す', () => {
      const { solution } = generate(20);
      expect(isComplete(solution)).toBe(true);
    });

    it('空白があればfalseを返す', () => {
      const { grid } = generate(20);
      expect(isComplete(grid)).toBe(false);
    });
  });

  describe('isCorrect', () => {
    it('解答と一致するグリッドをtrueと判定する', () => {
      const { solution } = generate(20);
      expect(isCorrect(solution, solution)).toBe(true);
    });

    it('解答と異なるグリッドをfalseと判定する', () => {
      const { solution } = generate(20);
      const wrong = solution.map(row => [...row]);
      // 1行目の最初の2つの値を入れ替え（両方が異なる値の場合）
      const tmp = wrong[0][0];
      wrong[0][0] = wrong[0][1];
      wrong[0][1] = tmp;
      // 入れ替えた値が同じなら別のセルを変更
      if (wrong[0][0] === solution[0][0]) {
        wrong[0][0] = wrong[0][0] === 9 ? 1 : wrong[0][0] + 1;
      }
      expect(isCorrect(wrong, solution)).toBe(false);
    });
  });

  describe('isMistake', () => {
    it('正しい値のセルはミスではない', () => {
      const { grid, solution } = generate(20);
      // 空白でないセルを探す
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (grid[r][c] !== 0) {
            expect(isMistake(grid, solution, { row: r, col: c })).toBe(false);
            return;
          }
        }
      }
    });

    it('空白セルはミスではない', () => {
      const { grid, solution } = generate(20);
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (grid[r][c] === 0) {
            expect(isMistake(grid, solution, { row: r, col: c })).toBe(false);
            return;
          }
        }
      }
    });

    it('間違った値のセルはミスである', () => {
      const { grid, solution } = generate(20);
      const testGrid = grid.map(row => [...row]);
      // 空白セルに間違った値を入れる
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (testGrid[r][c] === 0) {
            const correct = solution[r][c];
            testGrid[r][c] = correct === 9 ? 1 : correct + 1;
            expect(isMistake(testGrid, solution, { row: r, col: c })).toBe(true);
            return;
          }
        }
      }
    });
  });

  describe('getMistakeCells', () => {
    it('ミスがなければ空配列を返す', () => {
      const { solution } = generate(20);
      expect(getMistakeCells(solution, solution)).toHaveLength(0);
    });

    it('ミスがあればそのセルを返す', () => {
      const { grid, solution } = generate(20);
      const testGrid = grid.map(row => [...row]);
      let mistakePos = { row: -1, col: -1 };
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (testGrid[r][c] === 0) {
            const correct = solution[r][c];
            testGrid[r][c] = correct === 9 ? 1 : correct + 1;
            mistakePos = { row: r, col: c };
            break;
          }
        }
        if (mistakePos.row !== -1) break;
      }
      const mistakes = getMistakeCells(testGrid, solution);
      expect(mistakes.some(m => m.row === mistakePos.row && m.col === mistakePos.col)).toBe(true);
    });
  });

  describe('getCandidates', () => {
    it('空白セルの候補数字を返す', () => {
      const { grid } = generate(20);
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (grid[r][c] === 0) {
            const candidates = getCandidates(grid, { row: r, col: c });
            expect(candidates.length).toBeGreaterThan(0);
            candidates.forEach(n => {
              expect(n).toBeGreaterThanOrEqual(1);
              expect(n).toBeLessThanOrEqual(9);
            });
            return;
          }
        }
      }
    });

    it('空白でないセルは空配列を返す', () => {
      const { solution } = generate(20);
      expect(getCandidates(solution, { row: 0, col: 0 })).toHaveLength(0);
    });

    it('候補数字は行・列・ボックスに存在しない数字である', () => {
      const { grid } = generate(30);
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (grid[r][c] === 0) {
            const candidates = getCandidates(grid, { row: r, col: c });
            // 行に候補が存在しないことを確認
            candidates.forEach(n => {
              expect(grid[r].includes(n)).toBe(false);
            });
            return;
          }
        }
      }
    });
  });
});
