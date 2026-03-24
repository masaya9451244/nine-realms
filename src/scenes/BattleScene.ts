import Phaser from 'phaser';
import { GAME_CONFIG } from '../config';
import { SudokuGrid } from '../ui/SudokuGrid';
import { ItemSlot, ITEM_CONFIGS } from '../ui/ItemSlot';

export class BattleScene extends Phaser.Scene {
  private _grid!: SudokuGrid;
  private _hpBarFill!: Phaser.GameObjects.Graphics;
  private _selectedNum = 0;
  private _numButtons: Phaser.GameObjects.Container[] = [];

  private _currentHp = 100;
  private _maxHp = 100;

  constructor() {
    super({ key: 'BattleScene' });
  }

  create(): void {
    const { WIDTH, HEIGHT } = GAME_CONFIG;

    // ── 背景
    this._drawBackground();

    // ── 左パネル（敵表示）
    this._drawEnemyPanel();

    // ── 数独グリッド（中央右寄り）
    const gridX = WIDTH / 2 - SudokuGrid.prototype.gridSize / 2 + 60;
    const gridY = HEIGHT / 2 - SudokuGrid.prototype.gridSize / 2 - 10;
    this._grid = new SudokuGrid(this, gridX, gridY);

    // デモ用のサンプルグリッドを表示
    const demo = [
      [5,3,0, 0,7,0, 0,0,0],
      [6,0,0, 1,9,5, 0,0,0],
      [0,9,8, 0,0,0, 0,6,0],
      [8,0,0, 0,6,0, 0,0,3],
      [4,0,0, 8,0,3, 0,0,1],
      [7,0,0, 0,2,0, 0,0,6],
      [0,6,0, 0,0,0, 2,8,0],
      [0,0,0, 4,1,9, 0,0,5],
      [0,0,0, 0,8,0, 0,7,9],
    ];
    const sol = [
      [5,3,4,6,7,8,9,1,2],
      [6,7,2,1,9,5,3,4,8],
      [1,9,8,3,4,2,5,6,7],
      [8,5,9,7,6,1,4,2,3],
      [4,2,6,8,5,3,7,9,1],
      [7,1,3,9,2,4,8,5,6],
      [9,6,1,5,3,7,2,8,4],
      [2,8,7,4,1,9,6,3,5],
      [3,4,5,2,8,6,1,7,9],
    ];
    this._grid.loadGrid(demo, sol);
    this._grid.setOnCellSelect((r, c) => {
      if (this._selectedNum > 0) {
        this._grid.setCell(r, c, this._selectedNum);
      }
    });

    // ── 数字入力ボタン（グリッド下）
    this._drawNumberButtons(gridX, gridY + 486 + 14);

    // ── HPバー（上部左）
    this._drawHpBar();

    // ── タイマー（上部中央）
    this.add.text(WIDTH / 2 + 60, 22, '05:00', {
      fontFamily: 'Georgia, serif',
      fontSize: 22,
      color: '#f4d03f',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // ── アイテムスロット（右パネル）
    this._drawItemSlots();

    // ── 戻るボタン（デバッグ用）
    const backBtn = this.add.text(60, HEIGHT - 24, '← マップへ', {
      fontFamily: 'Georgia, serif',
      fontSize: 14,
      color: '#aabbcc',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setInteractive();
    backBtn.on('pointerover', () => { this.input.setDefaultCursor('pointer'); backBtn.setColor('#ffffff'); });
    backBtn.on('pointerout', () => { this.input.setDefaultCursor('default'); backBtn.setColor('#aabbcc'); });
    backBtn.on('pointerdown', () => this.scene.start('WorldMapScene'));
  }

  // ─── 背景 ────────────────────────────────────────────────────

  private _drawBackground(): void {
    const { WIDTH, HEIGHT } = GAME_CONFIG;
    const g = this.add.graphics();

    // 暗いダンジョン背景
    g.fillGradientStyle(0x0a0a18, 0x0a0a18, 0x12121e, 0x12121e, 1);
    g.fillRect(0, 0, WIDTH, HEIGHT);

    // 石畳風のパターン
    g.lineStyle(1, 0x2a2a3a, 0.4);
    for (let y = 0; y < HEIGHT; y += 40) {
      g.lineBetween(0, y, WIDTH, y);
    }
    for (let x = 0; x < WIDTH; x += 60) {
      g.lineBetween(x, 0, x, HEIGHT);
    }

    // 上部帯
    g.fillStyle(0x0d0d1a, 0.9);
    g.fillRect(0, 0, WIDTH, 50);
    g.lineStyle(1, 0x3a3a5a, 0.6);
    g.lineBetween(0, 50, WIDTH, 50);

    // 下部帯
    g.fillStyle(0x0d0d1a, 0.9);
    g.fillRect(0, HEIGHT - 50, WIDTH, 50);
    g.lineStyle(1, 0x3a3a5a, 0.6);
    g.lineBetween(0, HEIGHT - 50, WIDTH, HEIGHT - 50);
  }

  // ─── 敵パネル ────────────────────────────────────────────────

  private _drawEnemyPanel(): void {
    const { HEIGHT } = GAME_CONFIG;
    const panelX = 20;
    const panelW = 180;
    const panelH = HEIGHT - 100;
    const panelY = 60;

    const g = this.add.graphics();
    g.fillStyle(0x0a0a18, 0.7);
    g.fillRoundedRect(panelX, panelY, panelW, panelH, 10);
    g.lineStyle(1, 0x3a3a6a, 0.7);
    g.strokeRoundedRect(panelX, panelY, panelW, panelH, 10);

    // 敵名
    this.add.text(panelX + panelW / 2, panelY + 18, 'グリーン卿', {
      fontFamily: 'Georgia, serif',
      fontSize: 16,
      color: '#dd4444',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // 敵のシルエット（仮）
    const mg = this.add.graphics();
    const ex = panelX + panelW / 2;
    const ey = panelY + 130;
    mg.fillStyle(0x3a2a4a, 0.8);
    mg.fillEllipse(ex, ey + 60, 120, 30); // 影
    mg.fillStyle(0x5a3a7a, 1);
    // 体
    mg.fillRect(ex - 25, ey - 40, 50, 70);
    // 頭
    mg.fillCircle(ex, ey - 55, 28);
    // 角
    mg.fillTriangle(ex - 20, ey - 70, ex - 10, ey - 70, ex - 15, ey - 95);
    mg.fillTriangle(ex + 10, ey - 70, ex + 20, ey - 70, ex + 15, ey - 95);
    // 目
    mg.fillStyle(0xff4444, 1);
    mg.fillCircle(ex - 9, ey - 57, 5);
    mg.fillCircle(ex + 9, ey - 57, 5);
    // 腕
    mg.fillStyle(0x5a3a7a, 1);
    mg.fillRect(ex - 45, ey - 35, 18, 50);
    mg.fillRect(ex + 27, ey - 35, 18, 50);
    // 足
    mg.fillRect(ex - 22, ey + 30, 18, 35);
    mg.fillRect(ex + 4, ey + 30, 18, 35);

    // 敵HP（演出用）
    const enemyHpBg = this.add.graphics();
    enemyHpBg.fillStyle(0x111111, 0.8);
    enemyHpBg.fillRoundedRect(panelX + 10, panelY + 220, panelW - 20, 16, 4);
    enemyHpBg.lineStyle(1, 0x445544, 0.7);
    enemyHpBg.strokeRoundedRect(panelX + 10, panelY + 220, panelW - 20, 16, 4);

    const enemyHpFill = this.add.graphics();
    enemyHpFill.fillStyle(0x44cc44, 1);
    enemyHpFill.fillRoundedRect(panelX + 12, panelY + 222, panelW - 24, 12, 3);

    this.add.text(panelX + panelW / 2, panelY + 244, '???', {
      fontFamily: 'Georgia, serif',
      fontSize: 12,
      color: '#aaaaaa',
    }).setOrigin(0.5);

    // 戦闘テキスト
    this.add.text(panelX + panelW / 2, panelY + panelH - 40, '数の謎を\n解き明かせ！', {
      fontFamily: 'Georgia, serif',
      fontSize: 12,
      color: '#ccaaaa',
      align: 'center',
      lineSpacing: 4,
    }).setOrigin(0.5);
  }

  // ─── HPバー ──────────────────────────────────────────────────

  private _drawHpBar(): void {
    const barX = 220, barY = 12, barW = 260, barH = 26;

    this.add.text(barX, barY + barH / 2, '勇者', {
      fontFamily: 'Georgia, serif',
      fontSize: 14,
      color: '#f4d03f',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 3,
    }).setOrigin(0, 0.5);

    const bg = this.add.graphics();
    bg.fillStyle(0x111111, 0.85);
    bg.fillRoundedRect(barX + 44, barY, barW, barH, 5);
    bg.lineStyle(1, 0x445544, 0.7);
    bg.strokeRoundedRect(barX + 44, barY, barW, barH, 5);

    this._hpBarFill = this.add.graphics();
    this._updateHpBar(barX + 44, barY, barW, barH);

    this.add.text(barX + 44 + barW / 2, barY + barH / 2, `HP  ${this._currentHp} / ${this._maxHp}`, {
      fontFamily: 'Georgia, serif',
      fontSize: 13,
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(1);
  }

  private _updateHpBar(x: number, y: number, w: number, h: number): void {
    const ratio = this._currentHp / this._maxHp;
    const fillW = (w - 4) * ratio;
    const color = ratio > 0.5 ? 0x44cc44 : ratio > 0.25 ? 0xddaa22 : 0xdd2222;
    this._hpBarFill.clear();
    this._hpBarFill.fillStyle(color, 1);
    this._hpBarFill.fillRoundedRect(x + 2, y + 2, fillW, h - 4, 3);
    this._hpBarFill.fillStyle(0xffffff, 0.15);
    this._hpBarFill.fillRoundedRect(x + 2, y + 2, fillW, (h - 4) / 2, 2);
  }

  // ─── 数字ボタン ──────────────────────────────────────────────

  private _drawNumberButtons(startX: number, startY: number): void {
    const size = 48;
    const gap = 6;
    const totalW = 9 * size + 8 * gap;
    const offsetX = startX + (486 - totalW) / 2;

    for (let n = 1; n <= 9; n++) {
      const bx = offsetX + (n - 1) * (size + gap) + size / 2;
      const container = this.add.container(bx, startY + size / 2);

      const bg = this.add.graphics();
      const drawBg = (selected: boolean) => {
        bg.clear();
        bg.fillStyle(selected ? 0x4488ff : 0x1e1e32, 1);
        bg.fillRoundedRect(-size / 2, -size / 2, size, size, 6);
        bg.lineStyle(1.5, selected ? 0xaaccff : 0x3a3a5a, 1);
        bg.strokeRoundedRect(-size / 2, -size / 2, size, size, 6);
      };
      drawBg(false);

      const txt = this.add.text(0, 0, String(n), {
        fontFamily: 'Georgia, serif',
        fontSize: 22,
        color: '#ddddee',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      container.add([bg, txt]);
      container.setInteractive(
        new Phaser.Geom.Rectangle(-size / 2, -size / 2, size, size),
        Phaser.Geom.Rectangle.Contains
      );
      container.on('pointerover', () => { this.input.setDefaultCursor('pointer'); });
      container.on('pointerout', () => { this.input.setDefaultCursor('default'); });
      container.on('pointerdown', () => {
        this._selectedNum = this._selectedNum === n ? 0 : n;
        this._numButtons.forEach((btn, i) => {
          const b = btn.getAt(0) as Phaser.GameObjects.Graphics;
          b.clear();
          const sel = i + 1 === this._selectedNum;
          b.fillStyle(sel ? 0x4488ff : 0x1e1e32, 1);
          b.fillRoundedRect(-size / 2, -size / 2, size, size, 6);
          b.lineStyle(1.5, sel ? 0xaaccff : 0x3a3a5a, 1);
          b.strokeRoundedRect(-size / 2, -size / 2, size, size, 6);
        });
      });

      this._numButtons.push(container);
    }

    // 消去ボタン
    const delX = offsetX + totalW + gap + size / 2;
    const delContainer = this.add.container(delX, startY + size / 2);
    const delBg = this.add.graphics();
    delBg.fillStyle(0x2a1a1a, 1);
    delBg.fillRoundedRect(-size / 2, -size / 2, size, size, 6);
    delBg.lineStyle(1.5, 0x5a3a3a, 1);
    delBg.strokeRoundedRect(-size / 2, -size / 2, size, size, 6);
    const delTxt = this.add.text(0, 0, '✕', {
      fontFamily: 'Arial', fontSize: 20, color: '#cc6666', fontStyle: 'bold',
    }).setOrigin(0.5);
    delContainer.add([delBg, delTxt]);
    delContainer.setInteractive(
      new Phaser.Geom.Rectangle(-size / 2, -size / 2, size, size),
      Phaser.Geom.Rectangle.Contains
    );
    delContainer.on('pointerdown', () => {
      const sel = this._grid['_selectedRow'];
      const selC = this._grid['_selectedCol'];
      if (sel >= 0) this._grid.setCell(sel, selC, 0);
    });
  }

  // ─── アイテムスロット ─────────────────────────────────────────

  private _drawItemSlots(): void {
    const { WIDTH, HEIGHT } = GAME_CONFIG;
    const panelX = WIDTH - 140;
    const panelY = 60;
    const panelW = 120;
    const panelH = HEIGHT - 100;

    const g = this.add.graphics();
    g.fillStyle(0x0a0a18, 0.7);
    g.fillRoundedRect(panelX, panelY, panelW, panelH, 10);
    g.lineStyle(1, 0x3a3a6a, 0.7);
    g.strokeRoundedRect(panelX, panelY, panelW, panelH, 10);

    this.add.text(panelX + panelW / 2, panelY + 18, 'アイテム', {
      fontFamily: 'Georgia, serif',
      fontSize: 13,
      color: '#aabbcc',
      fontStyle: 'italic',
    }).setOrigin(0.5);

    ITEM_CONFIGS.forEach((config, i) => {
      const slot = new ItemSlot(
        this,
        panelX + panelW / 2,
        panelY + 60 + i * 90,
        config
      );
      slot.setCount(i === 0 ? 3 : i === 1 ? 1 : 0); // デモ用
    });
  }
}
