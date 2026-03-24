import Phaser from 'phaser';
import { GAME_CONFIG } from '../config';

interface RealmClearData {
  realmId: number;
  realmName: string;
  goldEarned: number;
}

const DEFAULT_DATA: RealmClearData = {
  realmId: 1,
  realmName: '草原の王国',
  goldEarned: 60,
};

export class RealmClearScene extends Phaser.Scene {
  private _data!: RealmClearData;
  private _transitioning = false;

  constructor() {
    super({ key: 'RealmClearScene' });
  }

  init(data?: Partial<RealmClearData>): void {
    this._transitioning = false;
    if (data && data.realmId !== undefined && data.realmName && data.goldEarned !== undefined) {
      this._data = data as RealmClearData;
    } else {
      this._data = { ...DEFAULT_DATA };
    }
  }

  create(): void {
    const { WIDTH, HEIGHT } = GAME_CONFIG;

    // ── 背景（暗いフラッシュ演出）
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 1);
    bg.fillRect(0, 0, WIDTH, HEIGHT);

    // フラッシュ用オーバーレイ
    const flash = this.add.graphics();
    flash.fillStyle(0xffffff, 1);
    flash.fillRect(0, 0, WIDTH, HEIGHT);
    flash.setAlpha(0);

    // フラッシュ演出
    this.tweens.add({
      targets: flash,
      alpha: { from: 0, to: 0.9 },
      duration: 300,
      yoyo: true,
      onComplete: () => {
        flash.setAlpha(0);
        this._showContent(bg);
      },
    });

    // 背景を徐々に明るく
    this.tweens.add({
      targets: bg,
      alpha: 0.7,
      delay: 200,
      duration: 800,
      onComplete: () => {
        bg.clear();
        bg.fillGradientStyle(0x0a0520, 0x0a0520, 0x1a0e40, 0x1a0e40, 1);
        bg.fillRect(0, 0, WIDTH, HEIGHT);
        bg.setAlpha(1);
      },
    });
  }

  private _showContent(_bg: Phaser.GameObjects.Graphics): void {
    const { WIDTH, HEIGHT } = GAME_CONFIG;

    // ── REALM CLEAR! テキスト
    const clearText = this.add.text(WIDTH / 2, HEIGHT / 2 - 80, 'REALM CLEAR!', {
      fontFamily: 'Georgia, serif',
      fontSize: '48px',
      color: '#f4d03f',
      stroke: '#8b6914',
      strokeThickness: 4,
    }).setOrigin(0.5).setScale(0).setAlpha(0);

    this.tweens.add({
      targets: clearText,
      scale: 1,
      alpha: 1,
      duration: 600,
      ease: 'Back.easeOut',
    });

    // 脈動アニメ
    this.time.delayedCall(650, () => {
      this.tweens.add({
        targets: clearText,
        scale: 1.06,
        duration: 700,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });
    });

    // ── Realm名
    const realmText = this.add.text(
      WIDTH / 2,
      HEIGHT / 2 - 10,
      `${this._data.realmName} を制覇！`,
      {
        fontFamily: 'Georgia, serif',
        fontSize: '28px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
      },
    ).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: realmText,
      alpha: 1,
      delay: 400,
      duration: 500,
    });

    // ── 獲得ゴールド
    const goldText = this.add.text(
      WIDTH / 2,
      HEIGHT / 2 + 36,
      `+ ${this._data.goldEarned} G`,
      {
        fontFamily: 'Georgia, serif',
        fontSize: '22px',
        color: '#f4d03f',
        stroke: '#5a3e00',
        strokeThickness: 2,
      },
    ).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: goldText,
      alpha: 1,
      delay: 700,
      duration: 500,
    });

    // ── 星パーティクル
    this.time.delayedCall(300, () => this._spawnStars());

    // ── 「つづく...」テキスト
    const continueLabel = this._data.realmId === 9 ? 'おわり...' : 'つづく...';
    const continueText = this.add.text(WIDTH / 2, HEIGHT - 60, continueLabel, {
      fontFamily: 'Georgia, serif',
      fontSize: '18px',
      color: '#cccccc',
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: continueText,
      alpha: 1,
      delay: 2000,
      duration: 600,
    });

    // 自動遷移（3.5秒後）
    this.time.delayedCall(3500, () => {
      this._goToWorldMap();
    });

    // クリックで即遷移
    this.time.delayedCall(800, () => {
      this.input.once('pointerdown', () => {
        this._goToWorldMap();
      });
    });
  }

  private _spawnStars(): void {
    const { WIDTH, HEIGHT } = GAME_CONFIG;
    const starCount = 20;

    for (let i = 0; i < starCount; i++) {
      this.time.delayedCall(i * 80, () => {
        const startX = WIDTH / 2 + Phaser.Math.Between(-100, 100);
        const startY = HEIGHT / 2 + Phaser.Math.Between(-60, 60);
        const targetX = startX + Phaser.Math.Between(-300, 300);
        const targetY = startY + Phaser.Math.Between(-250, 100);

        const star = this.add.graphics();
        this._drawStar(star, 0, 0, Phaser.Math.Between(4, 9));
        star.setPosition(startX, startY);

        this.tweens.add({
          targets: star,
          x: targetX,
          y: targetY,
          alpha: 0,
          scaleX: 0.2,
          scaleY: 0.2,
          duration: Phaser.Math.Between(800, 1600),
          ease: 'Power2',
          onComplete: () => star.destroy(),
        });
      });
    }
  }

  private _drawStar(g: Phaser.GameObjects.Graphics, cx: number, cy: number, r: number): void {
    const points: { x: number; y: number }[] = [];
    const inner = r * 0.45;

    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI / 5) * i - Math.PI / 2;
      const radius = i % 2 === 0 ? r : inner;
      points.push({
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
      });
    }

    g.fillStyle(0xf4d03f, 1);
    g.fillPoints(points, true);
  }

  private _goToWorldMap(): void {
    if (this._transitioning) return;
    this._transitioning = true;
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      if (this._data.realmId === 9) {
        this.scene.start('EndingScene');
      } else {
        this.scene.start('WorldMapScene');
      }
    });
  }
}
