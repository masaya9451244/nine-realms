import Phaser from 'phaser';
import { GAME_CONFIG } from '../config';
import { SudokuGrid } from '../ui/SudokuGrid';
import { ItemSlot, ITEM_CONFIGS } from '../ui/ItemSlot';
import { generate } from '../game/SudokuGenerator';
import { isComplete, isCorrect, getMistakeCells, getCandidates } from '../game/SudokuValidator';
import { BattleManager } from '../game/BattleManager';
import { EquipmentManager } from '../game/EquipmentManager';
import { SaveManager } from '../game/SaveManager';
import { REALMS } from '../data/realms';
import { EQUIPMENT_LIST } from '../data/equipment';
import { BOSS_STORIES } from '../data/story';
import type { GameState } from '../types/game';
import type { Grid } from '../types/sudoku';

const HP_BAR_X = 264;
const HP_BAR_Y = 12;
const HP_BAR_W = 260;
const HP_BAR_H = 26;

export class BattleScene extends Phaser.Scene {
  private _grid!: SudokuGrid;
  private _hpBarFill!: Phaser.GameObjects.Graphics;
  private _hpText!: Phaser.GameObjects.Text;
  private _selectedNum = 0;
  private _numButtons: Phaser.GameObjects.Container[] = [];

  private _currentHp = 100;
  private _maxHp = 100;

  private _realmId = 1;
  private _solution!: Grid;
  private _currentGrid!: Grid;
  private _battleManager = new BattleManager();
  private _equipmentManager = new EquipmentManager();

  private _itemSlots: ItemSlot[] = [];
  private _itemCounts = { numberLight: 0, truthEye: 0, guidingHand: 0 };

  private _timeDamageEvent?: Phaser.Time.TimerEvent;
  private _defeated = false;
  private _won = false;
  private _isBoss = false;

  private _goldReward = 0;

  // セリフ表示用オーバーレイ
  private _dialogOverlay?: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'BattleScene' });
  }

  init(data: { realmId?: number; isBoss?: boolean }): void {
    this._realmId = data?.realmId ?? 1;
    this._isBoss = data?.isBoss ?? true;
    this._defeated = false;
    this._won = false;
  }

  create(): void {
    const { WIDTH, HEIGHT } = GAME_CONFIG;

    // GameState の読み込み
    const state: GameState = this.game.registry.get('gameState');
    const realm = REALMS.find(r => r.id === this._realmId) ?? REALMS[0];
    this._goldReward = this._isBoss ? realm.bossGoldReward : realm.goldReward;

    // 装備効果を計算
    const blankReduction = this._equipmentManager.getBlankReduction(state.equipment.weapon);
    const timeDamageReduction = this._equipmentManager.getTimeDamageReduction(state.equipment.accessory);
    const missDamageReduction = this._equipmentManager.getMissDamageReduction(state.equipment.accessory);
    const maxHp = this._equipmentManager.getMaxHp(state.maxHp, state.equipment.armor);

    // HP の同期
    this._maxHp = maxHp;
    this._currentHp = Math.min(state.hp, maxHp);

    // アイテム所持数の同期
    this._itemCounts = { ...state.items };

    // 数独パズルの生成（ボス戦は高難易度）
    const baseDifficulty = this._isBoss ? realm.bossDifficulty : realm.difficulty;
    const actualBlank = this._battleManager.getActualBlankCount(baseDifficulty, blankReduction);
    const puzzle = generate(actualBlank);
    this._solution = puzzle.solution;
    this._currentGrid = puzzle.grid.map(row => [...row]);

    // ダメージ計算
    const timeDmg = this._battleManager.getTimeDamage(this._realmId, timeDamageReduction);
    const missDmg = this._battleManager.getMissDamage(this._realmId, missDamageReduction);
    const interval = this._battleManager.getDamageInterval(this._realmId);

    // ── 背景
    this._drawBackground();

    // ── 左パネル（敵表示）
    this._drawEnemyPanel(realm.bossName, realm.color);

    // ── 雑魚戦の進捗表示（左パネル下部）
    if (!this._isBoss) {
      const killed = (state.realmProgress?.[this._realmId] ?? 0);
      const total = realm.enemyCount;
      const remaining = total - killed;
      const label = remaining === 1
        ? 'あと1体でボス戦！'
        : `あと${remaining}体でボス戦`;
      this.add.text(110, GAME_CONFIG.HEIGHT - 65, label, {
        fontFamily: 'sans-serif',
        fontSize: 12,
        color: '#ffaa44',
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5);
      this.add.text(110, GAME_CONFIG.HEIGHT - 48, `(${killed + 1}/${total}体目)`, {
        fontFamily: 'sans-serif',
        fontSize: 11,
        color: '#aaaaaa',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5);
    }

    // ── 数独グリッド（中央右寄り）
    const gridX = WIDTH / 2 - SudokuGrid.prototype.gridSize / 2 + 60;
    const gridY = HEIGHT / 2 - SudokuGrid.prototype.gridSize / 2 - 10;
    this._grid = new SudokuGrid(this, gridX, gridY);
    this._grid.loadGrid(puzzle.grid, this._solution);
    this._grid.setOnCellSelect((r, c) => {
      if (this._won || this._defeated) return;
      if (this._selectedNum > 0 && !this._grid.isFixed(r, c)) {
        const prevValue = this._currentGrid[r][c];
        this._grid.setCell(r, c, this._selectedNum);
        this._currentGrid[r][c] = this._selectedNum;

        // ミス判定（入力前は0だった、または別の値だった場合のみ）
        if (prevValue !== this._selectedNum &&
            this._selectedNum !== this._solution[r][c] &&
            this._solution[r][c] !== 0) {
          this._applyDamage(missDmg);
        }

        // 全マス入力チェック
        if (isComplete(this._currentGrid)) {
          if (!isCorrect(this._currentGrid, this._solution)) {
            this._showIncorrectMessage();
          } else {
            this._checkVictory();
          }
        }
      }
    });

    // ── 数字入力ボタン（グリッド下）
    this._drawNumberButtons(gridX, gridY + 486 + 14);

    // ── HPバー（上部左）
    this._drawHpBar();

    // ── ダメージ情報（上部中央）
    this._drawDamageInfo(WIDTH / 2 + 60, 10, interval / 1000, timeDmg);

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

    // ── 時間ダメージタイマー
    this._timeDamageEvent = this.time.addEvent({
      delay: interval,
      callback: () => {
        if (!this._defeated && !this._won) {
          this._applyDamage(timeDmg);
        }
      },
      loop: true,
    });

  }

  // ─── HP ダメージ適用 ──────────────────────────────────────────

  private _applyDamage(amount: number): void {
    if (this._defeated || this._won) return;
    this._currentHp = Math.max(0, this._currentHp - amount);
    this._updateHpBar(HP_BAR_X, HP_BAR_Y, HP_BAR_W, HP_BAR_H);

    // HP テキスト更新
    if (this._hpText) {
      this._hpText.setText(`HP  ${this._currentHp} / ${this._maxHp}`);
    }

    if (this._battleManager.isDefeated(this._currentHp)) {
      this._onDefeat();
    }
  }

  // ─── 全マス埋まったが不正解 ──────────────────────────────────────

  private _showIncorrectMessage(): void {
    const { width, height } = this.scale;
    const bg = this.add.rectangle(width / 2, height / 2, 500, 120, 0x000000, 0.75)
      .setDepth(50);
    const text = this.add.text(width / 2, height / 2, '間違いがあります！\n正しい数字を確認してください', {
      fontFamily: 'sans-serif',
      fontSize: 24,
      color: '#ff6666',
      align: 'center',
    }).setOrigin(0.5).setDepth(51);

    this.time.delayedCall(1800, () => {
      bg.destroy();
      text.destroy();
    });
  }

  // ─── 勝利判定 ──────────────────────────────────────────────────

  private _checkVictory(): void {
    if (this._won || this._defeated) return;
    if (!isCorrect(this._currentGrid, this._solution)) return;

    this._won = true;
    this._timeDamageEvent?.destroy();

    const state: GameState = this.game.registry.get('gameState');
    state.gold += this._goldReward;
    state.hp = this._currentHp;

    if (this._isBoss) {
      // ボス戦勝利処理
      if (!state.clearedRealms.includes(this._realmId)) {
        state.clearedRealms.push(this._realmId);
      }
      state.currentRealmId = Math.min(9, Math.max(state.currentRealmId, this._realmId + 1));

      // 装備ドロップ処理
      const dropEquip = EQUIPMENT_LIST.find(e => e.dropRealmId === this._realmId);
      let dropMessage = '';
      if (dropEquip && !state.inventory.includes(dropEquip.id)) {
        state.inventory.push(dropEquip.id);
        dropMessage = `${dropEquip.name}を手に入れた！`;
      }

      this.game.registry.set('gameState', state);
      SaveManager.save(state);

      // ボス撃破セリフ → RealmClearScene
      const story = BOSS_STORIES.find(s => s.realmId === this._realmId);
      const lines = story ? [...story.defeatLines] : [];
      if (dropMessage) lines.push(dropMessage);

      if (lines.length > 0) {
        this._showDialog(lines, () => {
          this._fadeToRealmClear();
        });
      } else {
        this._fadeToRealmClear();
      }
    } else {
      // 雑魚戦勝利処理
      if (!state.realmProgress) state.realmProgress = {};
      const realm = REALMS.find(r => r.id === this._realmId) ?? REALMS[0];
      const isLastMinion = (state.realmProgress[this._realmId] ?? 0) + 1 >= realm.enemyCount;
      state.realmProgress[this._realmId] = (state.realmProgress[this._realmId] ?? 0) + 1;
      this.game.registry.set('gameState', state);
      SaveManager.save(state);

      const { WIDTH, HEIGHT } = GAME_CONFIG;
      const cx = WIDTH / 2;
      const cy = HEIGHT / 2;

      // 「撃破！」テキスト
      const defeatText = this.add.text(cx, cy - 30, '撃破！', {
        fontFamily: 'Georgia, serif',
        fontSize: 64,
        color: '#ffee00',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 6,
      }).setOrigin(0.5).setDepth(60).setScale(0, 1);

      this.tweens.add({
        targets: defeatText,
        scaleX: 1,
        duration: 300,
        ease: 'Back.easeOut',
      });

      // ゴールド報酬テキスト
      const goldText = this.add.text(cx, cy + 40, `+${this._goldReward}G`, {
        fontFamily: 'Georgia, serif',
        fontSize: 36,
        color: '#ffd700',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 5,
      }).setOrigin(0.5).setDepth(60).setAlpha(0);

      this.tweens.add({
        targets: goldText,
        alpha: 1,
        y: cy + 30,
        duration: 400,
        delay: 150,
        ease: 'Sine.easeOut',
      });

      // ボス出現テキスト（ラストの雑魚の場合）
      if (isLastMinion) {
        const bossText = this.add.text(cx, cy + 100, 'ボスが現れた！', {
          fontFamily: 'Georgia, serif',
          fontSize: 28,
          color: '#ff8800',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 5,
        }).setOrigin(0.5).setDepth(60).setAlpha(0);

        this.tweens.add({
          targets: bossText,
          alpha: 1,
          duration: 400,
          delay: 500,
          ease: 'Sine.easeOut',
        });
      }

      // 1.5秒後にフェードアウト
      this.time.delayedCall(1500, () => {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('WorldMapScene');
        });
      });
    }
  }

  private _fadeToRealmClear(): void {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('RealmClearScene', {
        realmId: this._realmId,
        realmName: REALMS.find(r => r.id === this._realmId)?.name ?? '',
        goldEarned: this._goldReward,
      });
    });
  }

  // ─── 敗北処理 ──────────────────────────────────────────────────

  private _onDefeat(): void {
    if (this._defeated) return;
    this._defeated = true;
    this._timeDamageEvent?.destroy();

    // GameState の HP を更新（0にする。WorldMapScene の init で maxHp に回復する）
    const state: GameState = this.game.registry.get('gameState');
    state.hp = 0;
    this.game.registry.set('gameState', state);

    // ボス戦の場合は敗北セリフ表示
    if (this._isBoss) {
      const story = BOSS_STORIES.find(s => s.realmId === this._realmId);
      if (story && story.victoryLines && story.victoryLines.length > 0) {
        this._showDialog(story.victoryLines, () => {
          this._fadeToWorldMap();
        });
        return;
      }
    }

    this._fadeToWorldMap();
  }

  private _fadeToWorldMap(): void {
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('WorldMapScene');
    });
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

  private _drawEnemyPanel(bossName: string, color: number): void {
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

    // ボス/雑魚ラベル
    if (this._isBoss) {
      this.add.text(panelX + panelW / 2, panelY + 10, '👑 BOSS', {
        fontFamily: 'Georgia, serif',
        fontSize: 13,
        color: '#ffd700',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5);
    } else {
      this.add.text(panelX + panelW / 2, panelY + 10, '雑魚敵', {
        fontFamily: 'Georgia, serif',
        fontSize: 13,
        color: '#888888',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5);
    }

    // 敵名
    this.add.text(panelX + panelW / 2, panelY + 28, bossName, {
      fontFamily: 'Georgia, serif',
      fontSize: 16,
      color: '#dd4444',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // 敵のシルエット
    const mg = this.add.graphics();
    const ex = panelX + panelW / 2;
    const ey = panelY + 130;
    mg.fillStyle(0x3a2a4a, 0.8);
    mg.fillEllipse(ex, ey + 60, 120, 30);
    mg.fillStyle(color, 1);
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
    mg.fillStyle(color, 1);
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
    const barX = HP_BAR_X, barY = HP_BAR_Y, barW = HP_BAR_W, barH = HP_BAR_H;

    this.add.text(barX - 40, barY + barH / 2, '勇者', {
      fontFamily: 'Georgia, serif',
      fontSize: 14,
      color: '#f4d03f',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 3,
    }).setOrigin(0, 0.5);

    const bg = this.add.graphics();
    bg.fillStyle(0x111111, 0.85);
    bg.fillRoundedRect(barX, barY, barW, barH, 5);
    bg.lineStyle(1, 0x445544, 0.7);
    bg.strokeRoundedRect(barX, barY, barW, barH, 5);

    this._hpBarFill = this.add.graphics();
    this._updateHpBar(barX, barY, barW, barH);

    this._hpText = this.add.text(barX + barW / 2, barY + barH / 2, `HP  ${this._currentHp} / ${this._maxHp}`, {
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
      if (sel >= 0 && !this._grid.isFixed(sel, selC)) {
        this._grid.setCell(sel, selC, 0);
        this._currentGrid[sel][selC] = 0;
      }
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
      const countKey = config.key as keyof typeof this._itemCounts;
      slot.setCount(this._itemCounts[countKey]);
      this._itemSlots.push(slot);

      slot.setOnUse(() => {
        this._useItem(config.key, slot, countKey);
      });
    });
  }

  private _useItem(key: string, slot: ItemSlot, countKey: keyof typeof this._itemCounts): void {
    if (this._itemCounts[countKey] <= 0 || this._won || this._defeated) return;

    this._itemCounts[countKey]--;
    slot.setCount(this._itemCounts[countKey]);

    // GameState 更新
    const state: GameState = this.game.registry.get('gameState');
    (state.items as Record<string, number>)[countKey] = this._itemCounts[countKey];
    this.game.registry.set('gameState', state);

    if (key === 'numberLight') {
      // 選択セルの候補数字を表示
      const selR = this._grid['_selectedRow'];
      const selC = this._grid['_selectedCol'];
      if (selR >= 0 && this._currentGrid[selR][selC] === 0) {
        const candidates = getCandidates(this._currentGrid, { row: selR, col: selC });
        this._grid.showCandidates(selR, selC, candidates);
      }
    } else if (key === 'truthEye') {
      // ミスセルをハイライト
      const mistakes = getMistakeCells(this._currentGrid, this._solution);
      this._grid.setMistakes(mistakes);
    } else if (key === 'guidingHand') {
      // ランダムな空白セルに正解を自動入力
      const emptyCells: { row: number; col: number }[] = [];
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (this._currentGrid[r][c] === 0) {
            emptyCells.push({ row: r, col: c });
          }
        }
      }
      if (emptyCells.length > 0) {
        const idx = Math.floor(Math.random() * emptyCells.length);
        const { row, col } = emptyCells[idx];
        const correct = this._solution[row][col];
        this._grid.setCell(row, col, correct);
        this._currentGrid[row][col] = correct;
        if (isComplete(this._currentGrid)) {
          this._checkVictory();
        }
      }
    }
  }

  // ─── ダメージ情報 ─────────────────────────────────────────────

  private _drawDamageInfo(cx: number, y: number, intervalSec: number, damage: number): void {
    const w = 200, h = 30;
    const g = this.add.graphics();
    g.lineStyle(1, 0xaa4444, 0.7);
    g.strokeRoundedRect(cx - w / 2, y, w, h, 5);
    this.add.text(cx, y + h / 2, `⚔  ${intervalSec}秒ごとに  ${damage}ダメージ`, {
      fontFamily: 'Georgia, serif',
      fontSize: 13,
      color: '#cc8888',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);
  }

  // ─── セリフ表示（インライン方式） ──────────────────────────────

  private _showDialog(lines: string[], onComplete: () => void): void {
    const { WIDTH, HEIGHT } = GAME_CONFIG;
    let lineIndex = 0;

    // 既存のダイアログがあれば破棄
    this._dialogOverlay?.destroy();

    const container = this.add.container(0, 0).setDepth(100);
    this._dialogOverlay = container;

    // 半透明背景
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.75);
    bg.fillRect(0, HEIGHT - 140, WIDTH, 140);
    bg.lineStyle(2, 0x888888, 0.8);
    bg.strokeRect(20, HEIGHT - 136, WIDTH - 40, 132);
    container.add(bg);

    const textObj = this.add.text(40, HEIGHT - 116, '', {
      fontFamily: 'Georgia, serif',
      fontSize: '16px',
      color: '#ffffff',
      wordWrap: { width: WIDTH - 80 },
      lineSpacing: 6,
    });
    container.add(textObj);

    const hint = this.add.text(WIDTH - 40, HEIGHT - 20, 'クリックで次へ', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#aaaaaa',
    }).setOrigin(1, 1);
    container.add(hint);

    const showLine = () => {
      if (lineIndex < lines.length) {
        textObj.setText(lines[lineIndex]);
        lineIndex++;
      } else {
        container.destroy();
        this._dialogOverlay = undefined;
        onComplete();
      }
    };

    showLine();

    // クリックで次のセリフへ
    const zone = this.add.zone(0, HEIGHT - 140, WIDTH, 140).setOrigin(0).setInteractive();
    container.add(zone);
    zone.on('pointerdown', () => showLine());
  }
}
