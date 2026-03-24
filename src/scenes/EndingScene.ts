import Phaser from 'phaser';
import { GAME_CONFIG } from '../config';

interface EndingLine {
  text: string;
  color: string;
  fontSize: string;
}

const ENDING_LINES: EndingLine[] = [
  { text: '魔王は倒された。',                     color: '#ffffff', fontSize: '28px' },
  { text: '九つの王国に、再び光が戻った。',         color: '#ffffff', fontSize: '28px' },
  { text: '数の力が世界を救った。',                 color: '#ffffff', fontSize: '28px' },
  { text: 'そして勇者は、また旅に出る。',           color: '#dddddd', fontSize: '26px' },
  { text: '--- THE END ---',                        color: '#f4d03f', fontSize: '44px' },
];

const LINE_INTERVAL = 2000;

export class EndingScene extends Phaser.Scene {
  private _bgGraphics!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'EndingScene' });
  }

  create(): void {
    // ── 背景（最初は暗い）
    this._bgGraphics = this.add.graphics();
    this._drawBackground(0);

    // ── 徐々に夜明けへ（グラデーション変化）
    this._animateBackground();

    // ── テキスト演出
    this._showLines();
  }

  private _drawBackground(phase: number): void {
    const { WIDTH, HEIGHT } = GAME_CONFIG;
    const g = this._bgGraphics;
    g.clear();

    if (phase < 0.5) {
      // 暗い夜
      const t = phase * 2; // 0→1
      const topR = Math.floor(Phaser.Math.Linear(0x05, 0x0a, t));
      const topG = Math.floor(Phaser.Math.Linear(0x05, 0x12, t));
      const topB = Math.floor(Phaser.Math.Linear(0x15, 0x2e, t));
      const botR = Math.floor(Phaser.Math.Linear(0x00, 0x08, t));
      const botG = Math.floor(Phaser.Math.Linear(0x00, 0x0a, t));
      const botB = Math.floor(Phaser.Math.Linear(0x10, 0x22, t));
      const topColor = (topR << 16) | (topG << 8) | topB;
      const botColor = (botR << 16) | (botG << 8) | botB;
      g.fillGradientStyle(topColor, topColor, botColor, botColor, 1);
    } else {
      // 夜明け
      const t = (phase - 0.5) * 2; // 0→1
      const topR = Math.floor(Phaser.Math.Linear(0x0a, 0x1a, t));
      const topG = Math.floor(Phaser.Math.Linear(0x12, 0x2a, t));
      const topB = Math.floor(Phaser.Math.Linear(0x2e, 0x60, t));
      const botR = Math.floor(Phaser.Math.Linear(0x08, 0x80, t));
      const botG = Math.floor(Phaser.Math.Linear(0x0a, 0x50, t));
      const botB = Math.floor(Phaser.Math.Linear(0x22, 0x20, t));
      const topColor = (topR << 16) | (topG << 8) | topB;
      const botColor = (botR << 16) | (botG << 8) | botB;
      g.fillGradientStyle(topColor, topColor, botColor, botColor, 1);
    }
    g.fillRect(0, 0, WIDTH, HEIGHT);

    // 星（夜の間だけ）
    if (phase < 0.7) {
      const alpha = Math.max(0, 1 - phase / 0.7);
      g.fillStyle(0xffffff, alpha * 0.8);
      const starPositions = [
        [200, 80], [450, 50], [680, 110], [900, 65], [1100, 90],
        [320, 140], [560, 30], [780, 155], [1020, 40], [150, 180],
        [800, 200], [350, 60], [620, 170], [950, 130], [1200, 160],
      ];
      starPositions.forEach(([sx, sy]) => {
        g.fillCircle(sx, sy, 1.5);
      });
    }

    // 夜明けの光（後半）
    if (phase > 0.5) {
      const t = (phase - 0.5) * 2;
      g.fillStyle(0xffaa44, t * 0.3);
      g.fillEllipse(WIDTH / 2, HEIGHT * 0.72, WIDTH * 1.4, HEIGHT * 0.6);
      g.fillStyle(0xffdd88, t * 0.15);
      g.fillEllipse(WIDTH / 2, HEIGHT * 0.75, WIDTH * 0.9, HEIGHT * 0.35);
    }
  }

  private _animateBackground(): void {
    const tweenObj = { phase: 0 };
    this.tweens.add({
      targets: tweenObj,
      phase: 1,
      duration: ENDING_LINES.length * LINE_INTERVAL + 2000,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        this._drawBackground(tweenObj.phase);
      },
    });
  }

  private _showLines(): void {
    const { WIDTH, HEIGHT } = GAME_CONFIG;
    const totalLines = ENDING_LINES.length;
    const startY = HEIGHT / 2 - (totalLines * 54) / 2;

    ENDING_LINES.forEach((line, i) => {
      const textY = startY + i * 60;
      const isLast = i === totalLines - 1;

      const textObj = this.add.text(WIDTH / 2, textY, line.text, {
        fontFamily: isLast ? 'Georgia, serif' : 'Georgia, serif',
        fontSize: line.fontSize,
        color: line.color,
        stroke: '#000000',
        strokeThickness: isLast ? 3 : 1,
      }).setOrigin(0.5).setAlpha(0);

      this.tweens.add({
        targets: textObj,
        alpha: 1,
        delay: i * LINE_INTERVAL,
        duration: 800,
        ease: 'Sine.easeIn',
      });

      // 最後の行：スケールアニメ
      if (isLast) {
        textObj.setScale(0.7);
        this.tweens.add({
          targets: textObj,
          scale: 1,
          delay: i * LINE_INTERVAL,
          duration: 1000,
          ease: 'Back.easeOut',
        });

        // 「タイトルへ戻る」ボタン
        const btnDelay = i * LINE_INTERVAL + 3000;
        this._showTitleButton(btnDelay);
      }
    });
  }

  private _showTitleButton(delay: number): void {
    const { WIDTH, HEIGHT } = GAME_CONFIG;

    const btnW = 220;
    const btnH = 48;
    const btnX = WIDTH / 2 - btnW / 2;
    const btnY = HEIGHT - 90;

    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x2c1a00, 0.9);
    btnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 8);
    btnBg.lineStyle(2, 0xf4d03f, 0.8);
    btnBg.strokeRoundedRect(btnX, btnY, btnW, btnH, 8);
    btnBg.setAlpha(0);

    const btnText = this.add.text(WIDTH / 2, btnY + btnH / 2, 'タイトルへ戻る', {
      fontFamily: 'Georgia, serif',
      fontSize: '20px',
      color: '#f4d03f',
    }).setOrigin(0.5).setAlpha(0).setDepth(1);

    this.tweens.add({
      targets: [btnBg, btnText],
      alpha: 1,
      delay,
      duration: 600,
    });

    const zone = this.add.zone(btnX, btnY, btnW, btnH).setOrigin(0).setDepth(2);
    this.time.delayedCall(delay, () => {
      zone.setInteractive({ useHandCursor: true });
    });

    zone.on('pointerover', () => {
      btnBg.clear();
      btnBg.fillStyle(0x5a3e00, 0.95);
      btnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 8);
      btnBg.lineStyle(2, 0xf4d03f, 1);
      btnBg.strokeRoundedRect(btnX, btnY, btnW, btnH, 8);
    });
    zone.on('pointerout', () => {
      btnBg.clear();
      btnBg.fillStyle(0x2c1a00, 0.9);
      btnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 8);
      btnBg.lineStyle(2, 0xf4d03f, 0.8);
      btnBg.strokeRoundedRect(btnX, btnY, btnW, btnH, 8);
    });
    zone.on('pointerdown', () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('TitleScene');
      });
    });
  }
}
