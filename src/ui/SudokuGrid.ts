import Phaser from 'phaser';

export interface GridCell {
  row: number;
  col: number;
  value: number;
  fixed: boolean;
  mistake: boolean;
  highlighted: boolean;
  candidates: number[];
}

const CELL = 54;        // セルサイズ
const GRID = CELL * 9;  // グリッド全体サイズ

// カラー定数
const C = {
  BG:         0x1a1a2a,
  CELL_NORMAL:0xfafaf8,   // ほぼ白
  CELL_FIXED: 0xe8e4d8,   // やや黄みがかった白
  CELL_SELECT:0x4db8ff,   // 鮮やかな水色
  CELL_HL:    0xc8e4ff,   // 薄い青（行/列/ボックス）
  CELL_SAME:  0x90ccff,   // 中程度の青（同じ数字）
  CELL_ERROR: 0xff8888,   // はっきりした赤
  LINE_THIN:  0x999999,
  LINE_BOLD:  0x222222,
  TEXT_FIXED: 0x111122,   // ほぼ黒
  TEXT_INPUT: 0x1155cc,   // 青
  TEXT_ERROR: 0xdd0000,
  TEXT_CAND:  0x6688aa,
};

export class SudokuGrid {
  private _scene: Phaser.Scene;
  private _x: number;
  private _y: number;
  private _cells: GridCell[][];
  private _selectedRow = -1;
  private _selectedCol = -1;

  private _bgGraphics!: Phaser.GameObjects.Graphics;
  private _cellGraphics!: Phaser.GameObjects.Graphics;
  private _lineGraphics!: Phaser.GameObjects.Graphics;
  private _textObjects: Phaser.GameObjects.Text[][] = [];
  private _candObjects: Phaser.GameObjects.Text[][][] = [];

  private _onCellSelect?: (row: number, col: number) => void;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this._scene = scene;
    this._x = x;
    this._y = y;
    this._cells = this._createEmptyCells();
    this._build();
  }

  get gridSize(): number { return GRID; }

  setOnCellSelect(cb: (row: number, col: number) => void): void {
    this._onCellSelect = cb;
  }

  loadGrid(grid: number[][], _solution: number[][]): void {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        this._cells[r][c].value = grid[r][c];
        this._cells[r][c].fixed = grid[r][c] !== 0;
        this._cells[r][c].mistake = false;
      }
    }
    this._redraw();
  }

  setCell(row: number, col: number, value: number): void {
    if (this._cells[row][col].fixed) return;
    this._cells[row][col].value = value;
    this._redraw();
  }

  setMistakes(positions: { row: number; col: number }[]): void {
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++)
        this._cells[r][c].mistake = false;
    positions.forEach(({ row, col }) => { this._cells[row][col].mistake = true; });
    this._redraw();
  }

  selectCell(row: number, col: number): void {
    this._selectedRow = row;
    this._selectedCol = col;
    this._redraw();
  }

  private _createEmptyCells(): GridCell[][] {
    return Array.from({ length: 9 }, (_, r) =>
      Array.from({ length: 9 }, (_, c) => ({
        row: r, col: c,
        value: 0, fixed: false,
        mistake: false, highlighted: false, candidates: [],
      }))
    );
  }

  private _build(): void {
    this._bgGraphics = this._scene.add.graphics();
    this._cellGraphics = this._scene.add.graphics();
    this._lineGraphics = this._scene.add.graphics();

    // テキストオブジェクト初期化
    this._textObjects = Array.from({ length: 9 }, (_, r) =>
      Array.from({ length: 9 }, (_, c) => {
        const cx = this._x + c * CELL + CELL / 2;
        const cy = this._y + r * CELL + CELL / 2;
        return this._scene.add.text(cx, cy, '', {
          fontFamily: 'Georgia, serif',
          fontSize: 34,
          color: '#111122',
          fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(2);
      })
    );

    // 候補数字テキスト（3×3）
    this._candObjects = Array.from({ length: 9 }, (_, r) =>
      Array.from({ length: 9 }, (_, c) =>
        Array.from({ length: 9 }, (_, i) => {
          const cr = Math.floor(i / 3);
          const cc = i % 3;
          const cx = this._x + c * CELL + cc * (CELL / 3) + CELL / 6;
          const cy = this._y + r * CELL + cr * (CELL / 3) + CELL / 6;
          return this._scene.add.text(cx, cy, '', {
            fontFamily: 'Arial',
            fontSize: 11,
            color: '#7a7a9a',
          }).setOrigin(0.5).setDepth(2).setVisible(false);
        })
      )
    );

    // インタラクティブ設定
    const hitArea = new Phaser.Geom.Rectangle(this._x, this._y, GRID, GRID);
    this._bgGraphics.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
    this._bgGraphics.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      const col = Math.floor((ptr.x - this._x) / CELL);
      const row = Math.floor((ptr.y - this._y) / CELL);
      if (row >= 0 && row < 9 && col >= 0 && col < 9) {
        this.selectCell(row, col);
        this._onCellSelect?.(row, col);
      }
    });

    this._redraw();
  }

  private _redraw(): void {
    this._drawCells();
    this._drawLines();
    this._drawTexts();
  }

  private _drawCells(): void {
    const g = this._cellGraphics;
    g.clear();

    const sel = { r: this._selectedRow, c: this._selectedCol };
    const selVal = sel.r >= 0 ? this._cells[sel.r][sel.c].value : 0;

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = this._cells[r][c];
        const px = this._x + c * CELL;
        const py = this._y + r * CELL;

        let color = C.CELL_NORMAL;
        if (cell.fixed) color = C.CELL_FIXED;

        // 同じ行・列・ボックス
        if (sel.r >= 0) {
          const sameBox =
            Math.floor(r / 3) === Math.floor(sel.r / 3) &&
            Math.floor(c / 3) === Math.floor(sel.c / 3);
          if (r === sel.r || c === sel.c || sameBox) color = C.CELL_HL;
        }

        // 同じ数字
        if (selVal > 0 && cell.value === selVal) color = C.CELL_SAME;

        // 選択中
        if (r === sel.r && c === sel.c) color = C.CELL_SELECT;

        // ミス
        if (cell.mistake) color = C.CELL_ERROR;

        g.fillStyle(color, 1);
        g.fillRect(px + 1, py + 1, CELL - 2, CELL - 2);
      }
    }
  }

  private _drawLines(): void {
    const g = this._lineGraphics;
    g.clear();

    // 背景
    g.fillStyle(C.LINE_BOLD, 1);
    g.fillRect(this._x - 2, this._y - 2, GRID + 4, GRID + 4);

    // 細い縦横線
    g.lineStyle(1, C.LINE_THIN, 0.8);
    for (let i = 1; i < 9; i++) {
      if (i % 3 !== 0) {
        g.lineBetween(this._x + i * CELL, this._y, this._x + i * CELL, this._y + GRID);
        g.lineBetween(this._x, this._y + i * CELL, this._x + GRID, this._y + i * CELL);
      }
    }

    // 太いボックス線
    g.lineStyle(4, C.LINE_BOLD, 1);
    for (let i = 0; i <= 9; i += 3) {
      g.lineBetween(this._x + i * CELL, this._y, this._x + i * CELL, this._y + GRID);
      g.lineBetween(this._x, this._y + i * CELL, this._x + GRID, this._y + i * CELL);
    }
  }

  private _drawTexts(): void {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = this._cells[r][c];
        const textObj = this._textObjects[r][c];

        if (cell.value !== 0) {
          textObj.setText(String(cell.value));
          if (cell.fixed) {
            textObj.setColor('#111122').setFontStyle('bold').setFontSize(34);
          } else if (cell.mistake) {
            textObj.setColor('#dd0000').setFontStyle('bold').setFontSize(34);
          } else {
            textObj.setColor('#1155cc').setFontStyle('bold').setFontSize(34);
          }
          // 候補数字を非表示
          this._candObjects[r][c].forEach(t => t.setVisible(false));
        } else {
          textObj.setText('');
          // 候補数字表示
          cell.candidates.forEach((show, i) => {
            const t = this._candObjects[r][c][i];
            if (show) {
              t.setText(String(i + 1)).setVisible(true);
            } else {
              t.setVisible(false);
            }
          });
        }
      }
    }
  }

  showCandidates(row: number, col: number, candidates: number[]): void {
    const arr = Array(9).fill(false);
    candidates.forEach(n => { arr[n - 1] = true; });
    this._cells[row][col].candidates = arr;
    this._drawTexts();
  }
}
