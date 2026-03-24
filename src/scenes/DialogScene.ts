import Phaser from 'phaser';
import { GAME_CONFIG } from '../config';

type PortraitKey =
  | 'hero'
  | 'merchant'
  | 'boss_green'
  | 'boss_forest'
  | 'boss_sand'
  | 'boss_frost'
  | 'boss_sea'
  | 'boss_fire'
  | 'boss_dark'
  | 'boss_sky'
  | 'boss_demon';

interface DialogData {
  name: string;
  lines: string[];
  portrait: PortraitKey;
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

// ポートレートフレーム
const FRAME_BG = 0x1a1a2e;
const FRAME_BORDER = 0x4a3a2a;
const PORTRAIT_CX = 640;
const PORTRAIT_CY = 310;
const FRAME_RADIUS = 160;

export class DialogScene extends Phaser.Scene {
  private _data!: DialogData;
  private _currentLine = 0;
  private _isTyping = false;
  private _fullText = '';
  private _displayedChars = 0;

  private _lineText!: Phaser.GameObjects.Text;
  private _indicator!: Phaser.GameObjects.Text;
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

    // ── ポートレートフレーム（円形）
    const frameG = this.add.graphics();
    frameG.fillStyle(FRAME_BG, 0.75);
    frameG.fillCircle(PORTRAIT_CX, PORTRAIT_CY, FRAME_RADIUS);
    frameG.lineStyle(5, FRAME_BORDER, 1);
    frameG.strokeCircle(PORTRAIT_CX, PORTRAIT_CY, FRAME_RADIUS);

    // ── キャラクター描画
    const portraitG = this.add.graphics();
    this._drawPortrait(portraitG, this._data.portrait);

    // ── ウィンドウ寸法
    const winW = 1200;
    const winH = 170;
    const winX = 40;
    const winY = 510;

    this._drawWindow(winX, winY, winW, winH);

    // ── 名前テキスト
    this.add.text(winX + 24, winY + 14, this._data.name, {
      fontFamily: 'Georgia, serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#c9a227',
    });

    // ── セリフテキスト
    this._lineText = this.add.text(winX + 24, winY + 50, '', {
      fontFamily: 'Georgia, serif',
      fontSize: '17px',
      color: '#2c1a00',
      wordWrap: { width: winW - 48 },
    });

    // ── 次へインジケーター
    this._indicator = this.add
      .text(winX + winW - 28, winY + winH - 22, '▼', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        color: '#8b6914',
      })
      .setOrigin(0.5)
      .setAlpha(0);

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
  }

  // ──────────────────────────────────────────────────────────────
  // ポートレート振り分け
  // ──────────────────────────────────────────────────────────────
  private _drawPortrait(g: Phaser.GameObjects.Graphics, key: PortraitKey): void {
    g.clear();
    switch (key) {
      case 'hero':
        this._drawHero(g);
        break;
      case 'merchant':
        this._drawMerchant(g);
        break;
      case 'boss_green':
        this._drawBossGreen(g);
        break;
      case 'boss_forest':
        this._drawBossForest(g);
        break;
      case 'boss_sand':
        this._drawBossSand(g);
        break;
      case 'boss_frost':
        this._drawBossFrost(g);
        break;
      case 'boss_sea':
        this._drawBossSea(g);
        break;
      case 'boss_fire':
        this._drawBossFire(g);
        break;
      case 'boss_dark':
        this._drawBossDark(g);
        break;
      case 'boss_sky':
        this._drawBossSky(g);
        break;
      case 'boss_demon':
        this._drawBossDemon(g);
        break;
      default:
        this._drawHero(g);
        break;
    }
  }

  // ──────────────────────────────────────────────────────────────
  // 勇者（バストショット）
  // ──────────────────────────────────────────────────────────────
  private _drawHero(g: Phaser.GameObjects.Graphics): void {
    const cx = PORTRAIT_CX;
    const cy = PORTRAIT_CY;

    // 青いマント（後ろ層）
    g.fillStyle(0x2244aa, 1);
    g.fillTriangle(cx - 70, cy + 120, cx + 70, cy + 120, cx - 90, cy + 240);
    g.fillTriangle(cx - 70, cy + 120, cx + 70, cy + 120, cx + 90, cy + 240);
    g.fillRect(cx - 70, cy + 80, 140, 50);

    // 体・胸当て（金色）
    g.fillStyle(0xd4a827, 1);
    g.fillRect(cx - 55, cy + 90, 110, 80);
    // 胸当て装飾
    g.lineStyle(2, 0xffd700, 1);
    g.strokeRect(cx - 50, cy + 95, 100, 70);
    g.lineBetween(cx - 50, cy + 130, cx + 50, cy + 130);
    g.lineBetween(cx, cy + 95, cx, cy + 165);

    // 首
    g.fillStyle(0xf5c090, 1);
    g.fillRect(cx - 14, cy + 55, 28, 40);

    // 顔（肌色）
    g.fillStyle(0xf5c090, 1);
    g.fillEllipse(cx, cy - 20, 88, 96);

    // 兜（銀色）
    g.fillStyle(0xc0c0c0, 1);
    g.fillEllipse(cx, cy - 60, 92, 60);
    g.fillRect(cx - 46, cy - 30, 92, 20);
    // 兜の縁（金のライン）
    g.lineStyle(3, 0xd4a827, 1);
    g.lineBetween(cx - 46, cy - 30, cx + 46, cy - 30);
    g.lineStyle(2, 0xffd700, 1);
    g.lineBetween(cx - 10, cy - 80, cx + 10, cy - 80);

    // 青い目
    g.fillStyle(0x3366cc, 1);
    g.fillEllipse(cx - 20, cy - 18, 16, 12);
    g.fillEllipse(cx + 20, cy - 18, 16, 12);
    g.fillStyle(0x000000, 1);
    g.fillCircle(cx - 20, cy - 18, 4);
    g.fillCircle(cx + 20, cy - 18, 4);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - 17, cy - 21, 2);
    g.fillCircle(cx + 23, cy - 21, 2);

    // 黒い眉
    g.lineStyle(3, 0x222222, 1);
    g.lineBetween(cx - 28, cy - 30, cx - 12, cy - 28);
    g.lineBetween(cx + 12, cy - 28, cx + 28, cy - 30);

    // 鼻
    g.lineStyle(1, 0xd09060, 1);
    g.lineBetween(cx, cy - 10, cx + 5, cy - 2);

    // 口（引き締まった線）
    g.lineStyle(2, 0xc07050, 1);
    g.lineBetween(cx - 14, cy + 10, cx + 14, cy + 10);

    // 耳
    g.fillStyle(0xf5c090, 1);
    g.fillEllipse(cx - 44, cy - 18, 14, 20);
    g.fillEllipse(cx + 44, cy - 18, 14, 20);

    // 剣の柄（右肩から）
    g.fillStyle(0xaaaaaa, 1);
    g.fillRect(cx + 60, cy - 40, 6, 80);
    g.fillStyle(0xd4a827, 1);
    g.fillRect(cx + 50, cy, 26, 6);
    g.fillStyle(0x8b4513, 1);
    g.fillRect(cx + 61, cy + 5, 4, 30);
  }

  // ──────────────────────────────────────────────────────────────
  // 商人（バストショット）
  // ──────────────────────────────────────────────────────────────
  private _drawMerchant(g: Phaser.GameObjects.Graphics): void {
    const cx = PORTRAIT_CX;
    const cy = PORTRAIT_CY;

    // オレンジのローブ
    g.fillStyle(0xcc7722, 1);
    g.fillEllipse(cx, cy + 130, 200, 160);
    g.fillRect(cx - 90, cy + 80, 180, 80);
    // ローブの装飾
    g.lineStyle(2, 0xaa5510, 1);
    g.lineBetween(cx - 80, cy + 90, cx - 80, cy + 160);
    g.lineBetween(cx + 80, cy + 90, cx + 80, cy + 160);

    // 首
    g.fillStyle(0xf0b080, 1);
    g.fillRect(cx - 16, cy + 52, 32, 35);

    // 顔（肌色）
    g.fillStyle(0xf0b080, 1);
    g.fillEllipse(cx, cy - 10, 96, 100);

    // 大きな茶色の帽子
    g.fillStyle(0x5a3a10, 1);
    g.fillEllipse(cx, cy - 78, 130, 30);
    g.fillRect(cx - 48, cy - 80, 96, 80);
    g.fillEllipse(cx, cy - 80, 96, 26);
    // 帽子のバンド
    g.lineStyle(3, 0x3a2000, 1);
    g.lineBetween(cx - 48, cy - 48, cx + 48, cy - 48);

    // 白いひげ
    g.fillStyle(0xffffff, 1);
    g.fillEllipse(cx, cy + 28, 70, 36);
    g.fillEllipse(cx - 24, cy + 35, 30, 22);
    g.fillEllipse(cx + 24, cy + 35, 30, 22);

    // 茶色の目
    g.fillStyle(0x6b3a1f, 1);
    g.fillEllipse(cx - 22, cy - 10, 16, 14);
    g.fillEllipse(cx + 22, cy - 10, 16, 14);
    g.fillStyle(0x000000, 1);
    g.fillCircle(cx - 22, cy - 10, 4);
    g.fillCircle(cx + 22, cy - 10, 4);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - 19, cy - 13, 2);
    g.fillCircle(cx + 25, cy - 13, 2);

    // 白/灰色の眉
    g.lineStyle(3, 0xcccccc, 1);
    g.lineBetween(cx - 30, cy - 24, cx - 14, cy - 22);
    g.lineBetween(cx + 14, cy - 22, cx + 30, cy - 24);

    // にこやかな口（口角が上がる）
    g.lineStyle(2, 0xc07050, 1);
    g.beginPath();
    g.arc(cx, cy + 6, 18, 0, Math.PI, false);
    g.strokePath();

    // 耳
    g.fillStyle(0xf0b080, 1);
    g.fillEllipse(cx - 48, cy - 8, 16, 22);
    g.fillEllipse(cx + 48, cy - 8, 16, 22);
  }

  // ──────────────────────────────────────────────────────────────
  // グリーン卿（Realm1）
  // ──────────────────────────────────────────────────────────────
  private _drawBossGreen(g: Phaser.GameObjects.Graphics): void {
    const cx = PORTRAIT_CX;
    const cy = PORTRAIT_CY;

    // 黒甲冑の肩当て
    g.fillStyle(0x222222, 1);
    g.fillEllipse(cx - 80, cy + 100, 100, 60);
    g.fillEllipse(cx + 80, cy + 100, 100, 60);
    g.fillRect(cx - 80, cy + 90, 160, 80);
    // 甲冑の縁取り
    g.lineStyle(2, 0x444444, 1);
    g.strokeRect(cx - 70, cy + 100, 140, 60);

    // 緑の体・首
    g.fillStyle(0x336633, 1);
    g.fillRect(cx - 55, cy + 55, 110, 90);
    g.fillRect(cx - 18, cy + 30, 36, 35);

    // 緑の顔
    g.fillStyle(0x336633, 1);
    g.fillEllipse(cx, cy - 15, 100, 104);

    // 角2本（茶色）
    g.fillStyle(0x553311, 1);
    g.fillTriangle(cx - 28, cy - 60, cx - 44, cy - 130, cx - 12, cy - 60);
    g.fillTriangle(cx + 28, cy - 60, cx + 44, cy - 130, cx + 12, cy - 60);

    // 赤い目（大きく光る）
    g.fillStyle(0xcc0000, 1);
    g.fillEllipse(cx - 24, cy - 16, 26, 22);
    g.fillEllipse(cx + 24, cy - 16, 26, 22);
    g.fillStyle(0xff3333, 1);
    g.fillCircle(cx - 24, cy - 16, 7);
    g.fillCircle(cx + 24, cy - 16, 7);
    g.fillStyle(0xff9999, 0.6);
    g.fillCircle(cx - 24, cy - 16, 12);
    g.fillCircle(cx + 24, cy - 16, 12);

    // 怒った眉（内向き）
    g.lineStyle(4, 0x112211, 1);
    g.lineBetween(cx - 38, cy - 36, cx - 14, cy - 28);
    g.lineBetween(cx + 14, cy - 28, cx + 38, cy - 36);

    // 口（牙）
    g.lineStyle(2, 0x224422, 1);
    g.lineBetween(cx - 20, cy + 12, cx + 20, cy + 12);
    g.fillStyle(0xffffff, 1);
    g.fillTriangle(cx - 14, cy + 12, cx - 8, cy + 12, cx - 11, cy + 24);
    g.fillTriangle(cx + 8, cy + 12, cx + 14, cy + 12, cx + 11, cy + 24);

    // 鼻（平らな穴）
    g.fillStyle(0x224422, 1);
    g.fillEllipse(cx - 10, cy, 10, 6);
    g.fillEllipse(cx + 10, cy, 10, 6);
  }

  // ──────────────────────────────────────────────────────────────
  // フォレスト伯（Realm2）
  // ──────────────────────────────────────────────────────────────
  private _drawBossForest(g: Phaser.GameObjects.Graphics): void {
    const cx = PORTRAIT_CX;
    const cy = PORTRAIT_CY;

    // 濃い緑の体
    g.fillStyle(0x1a4a1a, 1);
    g.fillEllipse(cx, cy + 130, 200, 160);
    g.fillRect(cx - 80, cy + 50, 160, 100);

    // 首
    g.fillStyle(0x1a4a1a, 1);
    g.fillRect(cx - 20, cy + 22, 40, 38);

    // 顔
    g.fillStyle(0x1a4a1a, 1);
    g.fillEllipse(cx, cy - 20, 108, 110);

    // 木の枝のような角
    g.fillStyle(0x4a2a00, 1);
    g.fillRect(cx - 46, cy - 60, 10, 50);
    g.fillRect(cx + 36, cy - 60, 10, 50);
    g.fillRect(cx - 60, cy - 90, 8, 40);
    g.fillRect(cx + 52, cy - 90, 8, 40);
    g.fillRect(cx - 58, cy - 100, 30, 7);
    g.fillRect(cx + 28, cy - 100, 30, 7);
    // 枝の細い分岐
    g.fillRect(cx - 56, cy - 80, 20, 6);
    g.fillRect(cx + 36, cy - 80, 20, 6);

    // 黄色い目
    g.fillStyle(0xdddd00, 1);
    g.fillEllipse(cx - 24, cy - 16, 24, 20);
    g.fillEllipse(cx + 24, cy - 16, 24, 20);
    g.fillStyle(0x000000, 1);
    g.fillEllipse(cx - 24, cy - 16, 10, 16);
    g.fillEllipse(cx + 24, cy - 16, 10, 16);

    // 苔のような斑点
    g.fillStyle(0x2a6a2a, 0.8);
    const spots = [
      [-30, -40, 14, 10], [20, -50, 18, 12], [-10, 10, 16, 10],
      [34, 0, 12, 9], [-38, 5, 10, 8], [10, -35, 12, 8],
    ];
    for (const [dx, dy, w, h] of spots) {
      g.fillEllipse(cx + dx, cy + dy, w, h);
    }

    // 眉（暗い、ほぼ平ら）
    g.lineStyle(3, 0x0a2a0a, 1);
    g.lineBetween(cx - 36, cy - 32, cx - 12, cy - 30);
    g.lineBetween(cx + 12, cy - 30, cx + 36, cy - 32);

    // 口
    g.lineStyle(2, 0x0a2a0a, 1);
    g.lineBetween(cx - 18, cy + 12, cx + 18, cy + 12);
  }

  // ──────────────────────────────────────────────────────────────
  // サンド侯爵（Realm3）
  // ──────────────────────────────────────────────────────────────
  private _drawBossSand(g: Phaser.GameObjects.Graphics): void {
    const cx = PORTRAIT_CX;
    const cy = PORTRAIT_CY;

    // 砂色の体
    g.fillStyle(0xd4a85a, 1);
    g.fillEllipse(cx, cy + 130, 190, 155);
    g.fillRect(cx - 75, cy + 50, 150, 95);

    // 頭飾り（砂漠の民風）
    g.fillStyle(0xaa7733, 1);
    g.fillRect(cx - 60, cy - 80, 120, 20);
    g.fillRect(cx - 50, cy - 80, 100, 16);
    g.fillRect(cx - 60, cy - 84, 120, 12);
    // 頭飾りの装飾
    g.fillStyle(0xcc8800, 1);
    for (let i = 0; i < 5; i++) {
      g.fillRect(cx - 46 + i * 23, cy - 90, 12, 12);
    }
    // 布が垂れ下がる
    g.fillStyle(0xbb8833, 0.9);
    g.fillRect(cx - 60, cy - 64, 16, 80);
    g.fillRect(cx + 44, cy - 64, 16, 80);

    // 首
    g.fillStyle(0xd4a85a, 1);
    g.fillRect(cx - 18, cy + 28, 36, 32);

    // 顔（砂色）
    g.fillStyle(0xd4a85a, 1);
    g.fillEllipse(cx, cy - 18, 100, 104);

    // スカーフ（赤）
    g.fillStyle(0xcc4422, 1);
    g.fillRect(cx - 60, cy + 28, 120, 28);
    g.lineStyle(2, 0xaa2200, 1);
    g.lineBetween(cx - 60, cy + 28, cx + 60, cy + 28);
    g.lineBetween(cx - 60, cy + 56, cx + 60, cy + 56);

    // 白い目
    g.fillStyle(0xffffff, 1);
    g.fillEllipse(cx - 24, cy - 14, 24, 20);
    g.fillEllipse(cx + 24, cy - 14, 24, 20);
    g.fillStyle(0x553300, 1);
    g.fillCircle(cx - 24, cy - 14, 6);
    g.fillCircle(cx + 24, cy - 14, 6);
    g.fillStyle(0x000000, 1);
    g.fillCircle(cx - 24, cy - 14, 3);
    g.fillCircle(cx + 24, cy - 14, 3);

    // 眉（濃い茶）
    g.lineStyle(3, 0x7a4a10, 1);
    g.lineBetween(cx - 32, cy - 30, cx - 14, cy - 26);
    g.lineBetween(cx + 14, cy - 26, cx + 32, cy - 30);

    // 口（すぼんだ）
    g.lineStyle(2, 0xaa7733, 1);
    g.lineBetween(cx - 16, cy + 8, cx + 16, cy + 8);

    // 鼻（鷲鼻ライン）
    g.lineStyle(1, 0xba8844, 1);
    g.lineBetween(cx, cy - 6, cx + 6, cy + 2);
    g.lineBetween(cx + 6, cy + 2, cx - 2, cy + 6);
  }

  // ──────────────────────────────────────────────────────────────
  // フロスト公爵（Realm4）
  // ──────────────────────────────────────────────────────────────
  private _drawBossFrost(g: Phaser.GameObjects.Graphics): void {
    const cx = PORTRAIT_CX;
    const cy = PORTRAIT_CY;

    // 青白い体
    g.fillStyle(0xaaccee, 1);
    g.fillEllipse(cx, cy + 130, 195, 155);
    g.fillRect(cx - 76, cy + 52, 152, 92);

    // 首
    g.fillStyle(0xaaccee, 1);
    g.fillRect(cx - 18, cy + 26, 36, 34);

    // 顔（青白）
    g.fillStyle(0xbbddee, 1);
    g.fillEllipse(cx, cy - 18, 104, 108);

    // 氷の冠（三角形3つ）
    g.fillStyle(0xddeeff, 1);
    g.fillTriangle(cx - 36, cy - 64, cx - 22, cy - 120, cx - 8, cy - 64);
    g.fillTriangle(cx - 12, cy - 68, cx, cy - 138, cx + 12, cy - 68);
    g.fillTriangle(cx + 8, cy - 64, cx + 22, cy - 120, cx + 36, cy - 64);
    // 冠の縁
    g.lineStyle(2, 0x99bbdd, 1);
    g.strokeTriangle(cx - 36, cy - 64, cx - 22, cy - 120, cx - 8, cy - 64);
    g.strokeTriangle(cx - 12, cy - 68, cx, cy - 138, cx + 12, cy - 68);
    g.strokeTriangle(cx + 8, cy - 64, cx + 22, cy - 120, cx + 36, cy - 64);
    // 冠のベース
    g.fillStyle(0xbbddff, 1);
    g.fillRect(cx - 44, cy - 66, 88, 12);

    // 青い目
    g.fillStyle(0x4488cc, 1);
    g.fillEllipse(cx - 24, cy - 14, 26, 22);
    g.fillEllipse(cx + 24, cy - 14, 26, 22);
    g.fillStyle(0x000000, 1);
    g.fillCircle(cx - 24, cy - 14, 6);
    g.fillCircle(cx + 24, cy - 14, 6);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - 20, cy - 18, 2);
    g.fillCircle(cx + 28, cy - 18, 2);

    // 眉（淡い青白）
    g.lineStyle(3, 0x8aaabb, 1);
    g.lineBetween(cx - 34, cy - 30, cx - 14, cy - 28);
    g.lineBetween(cx + 14, cy - 28, cx + 34, cy - 30);

    // 白い息（楕円の白い雲）
    g.fillStyle(0xffffff, 0.55);
    g.fillEllipse(cx - 20, cy + 30, 30, 16);
    g.fillEllipse(cx + 5, cy + 36, 40, 14);
    g.fillEllipse(cx + 28, cy + 28, 24, 12);

    // 口（冷たい薄い線）
    g.lineStyle(2, 0x88aacc, 1);
    g.lineBetween(cx - 16, cy + 10, cx + 16, cy + 10);
  }

  // ──────────────────────────────────────────────────────────────
  // 海神ネプタス（Realm5）
  // ──────────────────────────────────────────────────────────────
  private _drawBossSea(g: Phaser.GameObjects.Graphics): void {
    const cx = PORTRAIT_CX;
    const cy = PORTRAIT_CY;

    // 青緑の体
    g.fillStyle(0x1a7a8a, 1);
    g.fillEllipse(cx, cy + 130, 200, 165);
    g.fillRect(cx - 80, cy + 50, 160, 95);

    // 首
    g.fillStyle(0x1a7a8a, 1);
    g.fillRect(cx - 20, cy + 28, 40, 32);

    // 顔（青緑）
    g.fillStyle(0x1a8a9a, 1);
    g.fillEllipse(cx, cy - 16, 106, 110);

    // えらのような模様
    g.lineStyle(2, 0x0a5a6a, 1);
    for (let i = 0; i < 4; i++) {
      g.beginPath();
      g.arc(cx - 60, cy - 20 + i * 14, 20, -0.5, 0.5, false);
      g.strokePath();
      g.beginPath();
      g.arc(cx + 60, cy - 20 + i * 14, 20, Math.PI - 0.5, Math.PI + 0.5, false);
      g.strokePath();
    }

    // 三叉の冠（金色）
    g.fillStyle(0xddaa22, 1);
    g.fillRect(cx - 50, cy - 68, 100, 14);
    g.fillTriangle(cx - 40, cy - 68, cx - 28, cy - 118, cx - 16, cy - 68);
    g.fillTriangle(cx - 10, cy - 72, cx, cy - 136, cx + 10, cy - 72);
    g.fillTriangle(cx + 16, cy - 68, cx + 28, cy - 118, cx + 40, cy - 68);
    // 冠の宝石
    g.fillStyle(0x44aaff, 1);
    g.fillCircle(cx - 28, cy - 66, 5);
    g.fillCircle(cx, cy - 70, 6);
    g.fillCircle(cx + 28, cy - 66, 5);

    // 黄緑の目
    g.fillStyle(0x88dd44, 1);
    g.fillEllipse(cx - 26, cy - 14, 28, 22);
    g.fillEllipse(cx + 26, cy - 14, 28, 22);
    g.fillStyle(0x000000, 1);
    g.fillEllipse(cx - 26, cy - 14, 12, 18);
    g.fillEllipse(cx + 26, cy - 14, 12, 18);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - 22, cy - 18, 2);
    g.fillCircle(cx + 30, cy - 18, 2);

    // 眉（暗い青緑）
    g.lineStyle(3, 0x0a4a5a, 1);
    g.lineBetween(cx - 36, cy - 30, cx - 14, cy - 28);
    g.lineBetween(cx + 14, cy - 28, cx + 36, cy - 30);

    // 口
    g.lineStyle(2, 0x0a5a6a, 1);
    g.lineBetween(cx - 18, cy + 12, cx + 18, cy + 12);
  }

  // ──────────────────────────────────────────────────────────────
  // 炎帝ヴォルカ（Realm6）
  // ──────────────────────────────────────────────────────────────
  private _drawBossFire(g: Phaser.GameObjects.Graphics): void {
    const cx = PORTRAIT_CX;
    const cy = PORTRAIT_CY;

    // 炎のオーラ（外側）
    g.fillStyle(0xff6600, 0.25);
    g.fillCircle(cx, cy + 50, 130);
    g.fillStyle(0xffaa00, 0.15);
    g.fillCircle(cx, cy + 40, 110);

    // 赤橙色の体
    g.fillStyle(0xcc3300, 1);
    g.fillEllipse(cx, cy + 130, 195, 160);
    g.fillRect(cx - 76, cy + 50, 152, 94);

    // 首
    g.fillStyle(0xcc3300, 1);
    g.fillRect(cx - 18, cy + 26, 36, 32);

    // 顔（赤橙）
    g.fillStyle(0xdd4400, 1);
    g.fillEllipse(cx, cy - 16, 104, 108);

    // 炎の模様（体に）
    g.fillStyle(0xff6600, 0.7);
    g.fillTriangle(cx - 40, cy + 80, cx - 20, cy + 40, cx, cy + 80);
    g.fillTriangle(cx, cy + 80, cx + 20, cy + 40, cx + 40, cy + 80);
    g.fillTriangle(cx - 20, cy + 90, cx, cy + 55, cx + 20, cy + 90);

    // 炎の冠（オレンジの三角形）
    g.fillStyle(0xff8800, 1);
    g.fillTriangle(cx - 44, cy - 64, cx - 30, cy - 116, cx - 16, cy - 64);
    g.fillTriangle(cx - 14, cy - 70, cx, cy - 142, cx + 14, cy - 70);
    g.fillTriangle(cx + 16, cy - 64, cx + 30, cy - 116, cx + 44, cy - 64);
    g.fillStyle(0xffcc00, 1);
    g.fillTriangle(cx - 38, cy - 66, cx - 28, cy - 106, cx - 18, cy - 66);
    g.fillTriangle(cx - 10, cy - 72, cx, cy - 126, cx + 10, cy - 72);
    g.fillTriangle(cx + 18, cy - 66, cx + 28, cy - 106, cx + 38, cy - 66);

    // 白く光る目
    g.fillStyle(0xffffff, 1);
    g.fillEllipse(cx - 26, cy - 14, 28, 24);
    g.fillEllipse(cx + 26, cy - 14, 28, 24);
    g.fillStyle(0xffcc44, 0.8);
    g.fillCircle(cx - 26, cy - 14, 8);
    g.fillCircle(cx + 26, cy - 14, 8);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - 22, cy - 18, 3);
    g.fillCircle(cx + 30, cy - 18, 3);

    // 眉（炎形）
    g.lineStyle(3, 0x881100, 1);
    g.lineBetween(cx - 38, cy - 32, cx - 14, cy - 26);
    g.lineBetween(cx + 14, cy - 26, cx + 38, cy - 32);

    // 口（炎の牙）
    g.lineStyle(2, 0xaa2200, 1);
    g.lineBetween(cx - 20, cy + 12, cx + 20, cy + 12);
    g.fillStyle(0xff8800, 1);
    g.fillTriangle(cx - 14, cy + 12, cx - 8, cy + 12, cx - 11, cy + 22);
    g.fillTriangle(cx + 8, cy + 12, cx + 14, cy + 12, cx + 11, cy + 22);
  }

  // ──────────────────────────────────────────────────────────────
  // 闇の支配者（Realm7）
  // ──────────────────────────────────────────────────────────────
  private _drawBossDark(g: Phaser.GameObjects.Graphics): void {
    const cx = PORTRAIT_CX;
    const cy = PORTRAIT_CY;

    // 闇のオーラ（紫の楕円を半透明で重ねる）
    g.fillStyle(0x440066, 0.35);
    g.fillEllipse(cx, cy + 40, 300, 260);
    g.fillStyle(0x220044, 0.3);
    g.fillEllipse(cx, cy + 30, 240, 200);

    // 紫黒の体
    g.fillStyle(0x2a0a4a, 1);
    g.fillEllipse(cx, cy + 130, 195, 160);
    g.fillRect(cx - 76, cy + 50, 152, 95);

    // 首
    g.fillStyle(0x2a0a4a, 1);
    g.fillRect(cx - 18, cy + 26, 36, 34);

    // 顔（紫黒）
    g.fillStyle(0x3a1060, 1);
    g.fillEllipse(cx, cy - 16, 104, 108);

    // 長い角
    g.fillStyle(0x440066, 1);
    g.fillTriangle(cx - 32, cy - 60, cx - 50, cy - 148, cx - 10, cy - 58);
    g.fillTriangle(cx + 32, cy - 60, cx + 50, cy - 148, cx + 10, cy - 58);
    // 角の縁（暗い紫）
    g.lineStyle(2, 0x220044, 1);
    g.strokeTriangle(cx - 32, cy - 60, cx - 50, cy - 148, cx - 10, cy - 58);
    g.strokeTriangle(cx + 32, cy - 60, cx + 50, cy - 148, cx + 10, cy - 58);

    // 紫色の目
    g.fillStyle(0xaa44ff, 1);
    g.fillEllipse(cx - 26, cy - 14, 28, 24);
    g.fillEllipse(cx + 26, cy - 14, 28, 24);
    g.fillStyle(0x6600cc, 1);
    g.fillCircle(cx - 26, cy - 14, 7);
    g.fillCircle(cx + 26, cy - 14, 7);
    g.fillStyle(0xcc88ff, 0.7);
    g.fillCircle(cx - 26, cy - 14, 12);
    g.fillCircle(cx + 26, cy - 14, 12);

    // 眉（暗い）
    g.lineStyle(3, 0x110022, 1);
    g.lineBetween(cx - 36, cy - 32, cx - 12, cy - 26);
    g.lineBetween(cx + 12, cy - 26, cx + 36, cy - 32);

    // 口（薄い）
    g.lineStyle(2, 0x551188, 1);
    g.lineBetween(cx - 18, cy + 12, cx + 18, cy + 12);

    // 闇のパーティクル（小さい楕円）
    g.fillStyle(0x8822cc, 0.4);
    const particles = [[-70, -60], [75, -50], [-80, 20], [80, 30], [-60, 80], [65, 70]];
    for (const [dx, dy] of particles) {
      g.fillEllipse(cx + dx, cy + dy, 12, 8);
    }
  }

  // ──────────────────────────────────────────────────────────────
  // 天帝ゼフィル（Realm8）
  // ──────────────────────────────────────────────────────────────
  private _drawBossSky(g: Phaser.GameObjects.Graphics): void {
    const cx = PORTRAIT_CX;
    const cy = PORTRAIT_CY;

    // 光のオーラ
    g.fillStyle(0xffffcc, 0.2);
    g.fillCircle(cx, cy + 30, 150);

    // 翼の一部（肩から）
    g.fillStyle(0xeeeeff, 0.9);
    g.fillTriangle(cx - 76, cy + 60, cx - 160, cy - 20, cx - 60, cy + 100);
    g.fillTriangle(cx + 76, cy + 60, cx + 160, cy - 20, cx + 60, cy + 100);
    g.fillStyle(0xddddee, 0.7);
    g.fillTriangle(cx - 76, cy + 80, cx - 150, cy + 10, cx - 60, cy + 120);
    g.fillTriangle(cx + 76, cy + 80, cx + 150, cy + 10, cx + 60, cy + 120);

    // 白金色の体
    g.fillStyle(0xeeeebb, 1);
    g.fillEllipse(cx, cy + 130, 195, 155);
    g.fillRect(cx - 76, cy + 52, 152, 92);

    // 首
    g.fillStyle(0xeeeebb, 1);
    g.fillRect(cx - 18, cy + 28, 36, 32);

    // 顔（白金色）
    g.fillStyle(0xffffcc, 1);
    g.fillEllipse(cx, cy - 16, 104, 108);

    // 光の冠（黄色い放射状の線）
    g.lineStyle(4, 0xffdd00, 1);
    const rayCount = 10;
    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI - Math.PI / 2 - 0.8;
      const innerR = 54;
      const outerR = 110;
      const ix = cx + Math.cos(angle) * innerR;
      const iy = (cy - 64) + Math.sin(angle) * innerR;
      const ox = cx + Math.cos(angle) * outerR;
      const oy = (cy - 64) + Math.sin(angle) * outerR;
      g.lineBetween(ix, iy, ox, oy);
    }
    // 冠のベース
    g.fillStyle(0xddcc55, 1);
    g.fillRect(cx - 50, cy - 70, 100, 14);
    g.lineStyle(2, 0xffee88, 1);
    g.strokeRect(cx - 50, cy - 70, 100, 14);

    // 金色の目
    g.fillStyle(0xddaa00, 1);
    g.fillEllipse(cx - 24, cy - 14, 26, 22);
    g.fillEllipse(cx + 24, cy - 14, 26, 22);
    g.fillStyle(0x000000, 1);
    g.fillCircle(cx - 24, cy - 14, 6);
    g.fillCircle(cx + 24, cy - 14, 6);
    g.fillStyle(0xffffcc, 1);
    g.fillCircle(cx - 20, cy - 18, 2);
    g.fillCircle(cx + 28, cy - 18, 2);

    // 眉（金色）
    g.lineStyle(3, 0xaa8800, 1);
    g.lineBetween(cx - 34, cy - 30, cx - 14, cy - 28);
    g.lineBetween(cx + 14, cy - 28, cx + 34, cy - 30);

    // 口（穏やか）
    g.lineStyle(2, 0xaa9944, 1);
    g.beginPath();
    g.arc(cx, cy + 8, 16, Math.PI * 0.1, Math.PI * 0.9, false);
    g.strokePath();
  }

  // ──────────────────────────────────────────────────────────────
  // 魔王（Realm9）
  // ──────────────────────────────────────────────────────────────
  private _drawBossDemon(g: Phaser.GameObjects.Graphics): void {
    const cx = PORTRAIT_CX;
    const cy = PORTRAIT_CY;

    // 漆黒の体
    g.fillStyle(0x110011, 1);
    g.fillEllipse(cx, cy + 130, 200, 165);
    g.fillRect(cx - 80, cy + 50, 160, 96);

    // 首
    g.fillStyle(0x110011, 1);
    g.fillRect(cx - 20, cy + 28, 40, 32);

    // 顔（漆黒）
    g.fillStyle(0x1a0022, 1);
    g.fillEllipse(cx, cy - 14, 108, 112);

    // 大きな2本の角
    g.fillStyle(0x660000, 1);
    g.fillTriangle(cx - 34, cy - 58, cx - 56, cy - 170, cx - 4, cy - 56);
    g.fillTriangle(cx + 34, cy - 58, cx + 56, cy - 170, cx + 4, cy - 56);
    // 角の縁取り（金）
    g.lineStyle(2, 0xaa5500, 1);
    g.strokeTriangle(cx - 34, cy - 58, cx - 56, cy - 170, cx - 4, cy - 56);
    g.strokeTriangle(cx + 34, cy - 58, cx + 56, cy - 170, cx + 4, cy - 56);

    // 王冠（暗赤 + 金）
    g.fillStyle(0x880000, 1);
    g.fillRect(cx - 48, cy - 64, 96, 16);
    g.fillStyle(0xaa7700, 1);
    for (let i = 0; i < 5; i++) {
      g.fillTriangle(cx - 40 + i * 20, cy - 64, cx - 30 + i * 20, cy - 88, cx - 20 + i * 20, cy - 64);
    }
    g.lineStyle(2, 0xddaa00, 1);
    g.strokeRect(cx - 48, cy - 64, 96, 16);

    // 真紅の目（大きく）
    g.fillStyle(0xcc0000, 1);
    g.fillEllipse(cx - 28, cy - 14, 32, 26);
    g.fillEllipse(cx + 28, cy - 14, 32, 26);
    g.fillStyle(0xff2222, 1);
    g.fillCircle(cx - 28, cy - 14, 9);
    g.fillCircle(cx + 28, cy - 14, 9);
    // 光るエフェクト
    g.fillStyle(0xff8888, 0.5);
    g.fillCircle(cx - 28, cy - 14, 14);
    g.fillCircle(cx + 28, cy - 14, 14);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - 24, cy - 18, 3);
    g.fillCircle(cx + 32, cy - 18, 3);

    // 金の装飾（眼の周り）
    g.lineStyle(2, 0xddaa00, 1);
    g.strokeEllipse(cx - 28, cy - 14, 36, 30);
    g.strokeEllipse(cx + 28, cy - 14, 36, 30);

    // 眉（ほぼ見えない、細い金線）
    g.lineStyle(2, 0x553300, 1);
    g.lineBetween(cx - 38, cy - 34, cx - 10, cy - 28);
    g.lineBetween(cx + 10, cy - 28, cx + 38, cy - 34);

    // 口（金の牙）
    g.lineStyle(2, 0x330000, 1);
    g.lineBetween(cx - 22, cy + 12, cx + 22, cy + 12);
    g.fillStyle(0xddaa00, 1);
    g.fillTriangle(cx - 18, cy + 12, cx - 10, cy + 12, cx - 14, cy + 28);
    g.fillTriangle(cx + 10, cy + 12, cx + 18, cy + 12, cx + 14, cy + 28);
    g.fillTriangle(cx - 6, cy + 12, cx + 6, cy + 12, cx, cy + 24);
  }

  // ──────────────────────────────────────────────────────────────
  // タイプライター
  // ──────────────────────────────────────────────────────────────
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
      if (this._typeTimer) {
        this._typeTimer.remove();
        this._typeTimer = undefined;
      }
      this._lineText.setText(this._fullText);
      this._isTyping = false;
      this._indicator.setAlpha(1);
    } else {
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
