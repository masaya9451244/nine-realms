import Phaser from 'phaser';
import { GAME_CONFIG } from '../config';

interface DialogData {
  name: string;
  lines: string[];
  portrait: 'hero' | 'merchant' | 'boss';
  onComplete?: () => void;
}

const DEFAULT_DATA: DialogData = {
  name: '商人ガイウス',
  lines: [
    'よく来たな、勇者よ！',
    '今日も良い品が揃っておるぞ。',
    '何か買っていくか？',
  ],
  portrait: 'merchant',
};

const COL_PARCHMENT = 0xf5e6c8;
const COL_PARCHMENT_DARK = 0xe8d4a8;
const COL_BORDER = 0x8b6914;
const COL_BG_DARK = 0x1a1a2e;
const TYPEWRITER_DELAY = 50;

export class DialogScene extends Phaser.Scene {
  private _data!: DialogData;
  private _currentLine = 0;
  private _isTyping = false;
  private _fullText = '';
  private _displayedChars = 0;

  private _lineText!: Phaser.GameObjects.Text;
  private _indicator!: Phaser.GameObjects.Text;
  private _portraitGraphics!: Phaser.GameObjects.Graphics;
  private _typeTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super({ key: 'DialogScene' });
  }

  init(data?: Partial<DialogData>): void {
    if (data && data.name && data.lines && data.portrait) {
      this._data = data as DialogData;
    } else {
      this._data = { ...DEFAULT_DATA };
    }
    this._currentLine = 0;
    this._isTyping = false;
  }

  create(): void {
    const { WIDTH, HEIGHT } = GAME_CONFIG;

    // ── 薄い背景オーバーレイ
    const overlay = this.add.graphics();
    overlay.fillStyle(COL_BG_DARK, 0.4);
    overlay.fillRect(0, 0, WIDTH, HEIGHT);

    // ── ウィンドウ寸法
    const winW = 1200;
    const winH = 160;
    const winX = (WIDTH - winW) / 2;
    const winY = 530;

    this._drawWindow(winX, winY, winW, winH);

    // ── ポートレート（左側）
    this._portraitGraphics = this.add.graphics();
    this._drawPortrait(this._portraitGraphics, winX + 14, winY + 10, this._data.portrait);

    // ── 名前テキスト
    this.add.text(winX + 105, winY + 12, this._data.name, {
      fontFamily: 'Georgia, serif',
      fontSize: '18px',
      color: '#c9a227',
    });

    // ── セリフテキスト
    this._lineText = this.add.text(winX + 105, winY + 42, '', {
      fontFamily: 'Georgia, serif',
      fontSize: '16px',
      color: '#2c1a00',
      wordWrap: { width: winW - 130 },
    });

    // ── 次へインジケーター
    this._indicator = this.add.text(winX + winW - 28, winY + winH - 22, '▼', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#8b6914',
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: this._indicator,
      alpha: 1,
      duration: 500,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    // ── クリックで進む
    this.input.on('pointerdown', this._onClickAdvance, this);

    // 最初のセリフ開始
    this._startLine(this._currentLine);
  }

  private _drawWindow(x: number, y: number, w: number, h: number): void {
    const g = this.add.graphics();
    // 影
    g.fillStyle(0x000000, 0.5);
    g.fillRoundedRect(x + 4, y + 4, w, h, 10);
    // 羊皮紙本体
    g.fillStyle(COL_PARCHMENT, 1);
    g.fillRoundedRect(x, y, w, h, 10);
    // 内側の色味
    g.fillStyle(COL_PARCHMENT_DARK, 0.3);
    g.fillRoundedRect(x + 4, y + 4, w - 8, h - 8, 8);
    // 枠線
    g.lineStyle(3, COL_BORDER, 1);
    g.strokeRoundedRect(x, y, w, h, 10);
    g.lineStyle(1, COL_BORDER, 0.4);
    g.strokeRoundedRect(x + 5, y + 5, w - 10, h - 10, 8);

    // ポートレートエリアの仕切り線
    g.lineStyle(1, COL_BORDER, 0.5);
    g.lineBetween(x + 92, y + 8, x + 92, y + h - 8);
  }

  private _drawPortrait(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    type: 'hero' | 'merchant' | 'boss',
  ): void {
    g.clear();

    if (type === 'hero') {
      this._drawHeroPortrait(g, x, y);
    } else if (type === 'merchant') {
      this._drawMerchantPortrait(g, x, y);
    } else {
      this._drawBossPortrait(g, x, y);
    }
  }

  /** 勇者シルエット */
  private _drawHeroPortrait(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
    const cx = x + 38;

    // 体（シルエット）
    g.fillStyle(0x2c1a00, 1);
    // 頭
    g.fillCircle(cx, y + 14, 11);
    // 体
    g.fillRect(cx - 10, y + 25, 20, 28);
    // 両腕
    g.fillRect(cx - 20, y + 27, 10, 20);
    g.fillRect(cx + 10, y + 27, 10, 20);
    // 両脚
    g.fillRect(cx - 10, y + 53, 8, 22);
    g.fillRect(cx + 2, y + 53, 8, 22);
    // 剣（右手）
    g.fillStyle(0x8b6914, 1);
    g.fillRect(cx + 20, y + 18, 3, 30);
    g.fillRect(cx + 16, y + 30, 11, 3);
    // マント
    g.fillStyle(0x3a1a0e, 0.8);
    g.fillTriangle(cx - 8, y + 28, cx + 8, y + 28, cx - 20, y + 70);
    g.fillTriangle(cx - 8, y + 28, cx + 8, y + 28, cx + 20, y + 70);
  }

  /** 商人シルエット */
  private _drawMerchantPortrait(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
    const cx = x + 38;

    g.fillStyle(0x2c1a00, 1);
    // 頭（太め）
    g.fillEllipse(cx, y + 14, 24, 22);
    // 帽子
    g.fillRect(cx - 14, y + 4, 28, 6);
    g.fillRect(cx - 8, y - 6, 16, 14);
    // 体（ずんぐり）
    g.fillEllipse(cx, y + 42, 30, 36);
    // 両腕
    g.fillRect(cx - 22, y + 29, 12, 18);
    g.fillRect(cx + 10, y + 29, 12, 18);
    // 荷物（左手）
    g.fillStyle(0x5a3e00, 1);
    g.fillRect(cx - 30, y + 38, 14, 16);
    g.lineStyle(1, 0x8b6914, 1);
    g.strokeRect(cx - 30, y + 38, 14, 16);
    // 脚
    g.fillStyle(0x2c1a00, 1);
    g.fillRect(cx - 8, y + 56, 8, 18);
    g.fillRect(cx + 0, y + 56, 8, 18);
  }

  /** 魔物シルエット（角あり） */
  private _drawBossPortrait(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
    const cx = x + 38;

    g.fillStyle(0x1a0a0a, 1);
    // 体（大柄）
    g.fillEllipse(cx, y + 46, 44, 52);
    // 頭
    g.fillCircle(cx, y + 16, 16);
    // 角（左）
    g.fillTriangle(cx - 12, y + 6, cx - 20, y - 16, cx - 4, y + 2);
    // 角（右）
    g.fillTriangle(cx + 12, y + 6, cx + 20, y - 16, cx + 4, y + 2);
    // 目（赤く光る）
    g.fillStyle(0xff2222, 1);
    g.fillCircle(cx - 6, y + 15, 4);
    g.fillCircle(cx + 6, y + 15, 4);
    g.fillStyle(0xff6666, 1);
    g.fillCircle(cx - 6, y + 15, 2);
    g.fillCircle(cx + 6, y + 15, 2);
    // 腕（鉤爪）
    g.fillStyle(0x1a0a0a, 1);
    g.fillRect(cx - 30, y + 30, 14, 22);
    g.fillRect(cx + 16, y + 30, 14, 22);
    // 鉤爪
    g.fillStyle(0x444444, 1);
    for (let i = 0; i < 3; i++) {
      g.fillRect(cx - 30 + i * 4, y + 52, 3, 8);
      g.fillRect(cx + 16 + i * 4, y + 52, 3, 8);
    }
    // 翼の影
    g.fillStyle(0x0d0505, 0.7);
    g.fillTriangle(cx - 18, y + 22, cx - 46, y + 60, cx - 6, y + 60);
    g.fillTriangle(cx + 18, y + 22, cx + 46, y + 60, cx + 6, y + 60);
  }

  private _startLine(index: number): void {
    if (index >= this._data.lines.length) {
      this._finish();
      return;
    }
    this._fullText = this._data.lines[index];
    this._displayedChars = 0;
    this._isTyping = true;
    this._lineText.setText('');
    this._indicator.setAlpha(0);

    this._typeTimer = this.time.addEvent({
      delay: TYPEWRITER_DELAY,
      repeat: this._fullText.length - 1,
      callback: this._typeNextChar,
      callbackScope: this,
    });
  }

  private _typeNextChar(): void {
    this._displayedChars++;
    this._lineText.setText(this._fullText.substring(0, this._displayedChars));

    if (this._displayedChars >= this._fullText.length) {
      this._isTyping = false;
      this._indicator.setAlpha(1);
    }
  }

  private _onClickAdvance(): void {
    if (this._isTyping) {
      // タイプ中はすぐに全文表示
      if (this._typeTimer) {
        this._typeTimer.remove();
        this._typeTimer = undefined;
      }
      this._lineText.setText(this._fullText);
      this._isTyping = false;
      this._indicator.setAlpha(1);
    } else {
      // 次のセリフへ
      this._currentLine++;
      this._startLine(this._currentLine);
    }
  }

  private _finish(): void {
    if (this._data.onComplete) {
      this._data.onComplete();
    } else {
      this.scene.start('WorldMapScene');
    }
  }
}
