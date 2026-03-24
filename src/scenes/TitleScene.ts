import Phaser from 'phaser';
import { FONTS, GAME_CONFIG } from '../config';
import { SaveManager } from '../game/SaveManager';
import { INITIAL_GAME_STATE } from '../types/game';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' });
  }

  create(): void {
    const { WIDTH, HEIGHT } = GAME_CONFIG;
    const cx = WIDTH / 2;

    // 背景グラデーション風
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0d0d2b, 0x0d0d2b, 0x1a1a4e, 0x1a1a4e, 1);
    bg.fillRect(0, 0, WIDTH, HEIGHT);

    // 星をランダム配置
    const stars = this.add.graphics();
    stars.fillStyle(0xffffff, 1);
    for (let i = 0; i < 120; i++) {
      const x = Phaser.Math.Between(0, WIDTH);
      const y = Phaser.Math.Between(0, HEIGHT);
      const r = Math.random() < 0.3 ? 2 : 1;
      stars.fillCircle(x, y, r);
    }

    // タイトルロゴ
    this.add.text(cx, 200, 'NINE REALMS', {
      fontFamily: FONTS.DEFAULT,
      fontSize: 72,
      color: '#f4d03f',
      fontStyle: 'bold',
      stroke: '#8a6f00',
      strokeThickness: 6,
      shadow: { offsetX: 3, offsetY: 3, color: '#000', blur: 8, fill: true },
    }).setOrigin(0.5);

    // サブタイトル
    this.add.text(cx, 280, '～ 数の王国を解放せよ ～', {
      fontFamily: FONTS.DEFAULT,
      fontSize: 22,
      color: '#aaaaff',
    }).setOrigin(0.5);

    // 区切り線
    const line = this.add.graphics();
    line.lineStyle(1, 0x4444aa, 0.6);
    line.lineBetween(cx - 220, 310, cx + 220, 310);

    // はじめからボタン
    const startBtn = this.createButton(cx, 400, 'はじめから', 0x2ecc71, () => {
      SaveManager.deleteSave();
      this.game.registry.set('gameState', { ...INITIAL_GAME_STATE });
      this.scene.start('OpeningScene');
    });

    // つづきからボタン（セーブデータがある場合のみ有効）
    const hasSave = SaveManager.hasSaveData();
    this.createButton(cx, 480, 'つづきから', hasSave ? 0x3498db : 0x555555, () => {
      if (hasSave) {
        const saved = SaveManager.load();
        if (saved) {
          this.game.registry.set('gameState', saved);
        }
        this.scene.start('WorldMapScene');
      }
    }, !hasSave);

    // ボタンにパルスアニメーション
    this.tweens.add({
      targets: startBtn,
      scaleX: 1.04,
      scaleY: 1.04,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // バージョン
    this.add.text(WIDTH - 12, HEIGHT - 12, 'v0.1.0', {
      fontFamily: FONTS.DEFAULT,
      fontSize: 12,
      color: '#555577',
    }).setOrigin(1, 1);
  }

  private createButton(
    x: number, y: number, label: string,
    color: number,
    onClick: () => void,
    disabled = false
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(color, disabled ? 0.4 : 1);
    bg.fillRoundedRect(-140, -28, 280, 56, 12);

    const text = this.add.text(0, 0, label, {
      fontFamily: FONTS.DEFAULT,
      fontSize: FONTS.SIZE_LARGE,
      color: disabled ? '#888888' : '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    container.add([bg, text]);

    if (!disabled) {
      container.setInteractive(
        new Phaser.Geom.Rectangle(-140, -28, 280, 56),
        Phaser.Geom.Rectangle.Contains
      );
      container.on('pointerover', () => {
        bg.clear();
        bg.fillStyle(color, 1);
        bg.fillRoundedRect(-140, -28, 280, 56, 12);
        bg.lineStyle(2, 0xffffff, 0.6);
        bg.strokeRoundedRect(-140, -28, 280, 56, 12);
        this.input.setDefaultCursor('pointer');
      });
      container.on('pointerout', () => {
        bg.clear();
        bg.fillStyle(color, 1);
        bg.fillRoundedRect(-140, -28, 280, 56, 12);
        this.input.setDefaultCursor('default');
      });
      container.on('pointerdown', onClick);
    }

    return container;
  }
}
