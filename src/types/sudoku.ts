export type Grid = number[][];

export interface SudokuPuzzle {
  grid: Grid;       // 9x9の初期盤面（0=空白）
  solution: Grid;   // 解答
  difficulty: number; // 空白数
}

export interface CellPosition {
  row: number;
  col: number;
}
