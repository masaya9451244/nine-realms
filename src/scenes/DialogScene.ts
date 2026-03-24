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
  realmId?: number;
  onComplete?: () => void;
}

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

// ポートレートエリアの高さ
const PORTRAIT_AREA_H = 510;

// ギャラリーキャラクター一覧
interface GalleryEntry {
  key: PortraitKey;
  name: string;
  realmId?: number;
}

const GALLERY_CHARACTERS: GalleryEntry[] = [
  { key: 'hero',        name: '勇者' },
  { key: 'merchant',   name: '商人ガイウス' },
  { key: 'boss_green', name: 'グリーン卿',    realmId: 1 },
  { key: 'boss_forest',name: 'フォレスト伯',  realmId: 2 },
  { key: 'boss_sand',  name: 'サンド侯爵',    realmId: 3 },
  { key: 'boss_frost', name: 'フロスト公爵',  realmId: 4 },
  { key: 'boss_sea',   name: '海神ネプタス',  realmId: 5 },
  { key: 'boss_fire',  name: '炎帝ヴォルカ',  realmId: 6 },
  { key: 'boss_dark',  name: '闇の支配者',    realmId: 7 },
  { key: 'boss_sky',   name: '天帝ゼフィル',  realmId: 8 },
  { key: 'boss_demon', name: '魔王',           realmId: 9 },
];

export class DialogScene extends Phaser.Scene {
  // 通常モード
  private _data!: DialogData;
  private _currentLine = 0;
  private _isTyping = false;
  private _fullText = '';
  private _displayedChars = 0;
  private _lineText!: Phaser.GameObjects.Text;
  private _indicator!: Phaser.GameObjects.Text;
  private _typeTimer?: Phaser.Time.TimerEvent;

  // ギャラリーモード
  private _galleryMode = false;
  private _galleryIndex = 0;

  // 再描画可能なGraphicsの参照
  private _portraitGraphics: Phaser.GameObjects.Graphics[] = [];
  private _bgGraphics?: Phaser.GameObjects.Graphics;
  private _frameGraphics?: Phaser.GameObjects.Graphics;

  // ギャラリー用テキスト
  private _galleryNameText?: Phaser.GameObjects.Text;
  private _galleryIndicatorText?: Phaser.GameObjects.Text;
  private _galleryDots: Phaser.GameObjects.Text[] = [];

  constructor() {
    super({ key: 'DialogScene' });
  }

  init(data?: Partial<DialogData>): void {
    if (data && data.name && data.lines && data.portrait) {
      this._data = data as DialogData;
      this._galleryMode = false;
    } else {
      this._galleryMode = true;
      this._data = { name: '', lines: [], portrait: 'hero' };
    }
    this._currentLine = 0;
    this._isTyping = false;
    this._galleryIndex = 0;
    this._portraitGraphics = [];
  }

  create(): void {
    const { WIDTH, HEIGHT } = GAME_CONFIG;

    // 薄い背景オーバーレイ（ポートレートエリア外）
    const overlay = this.add.graphics();
    overlay.fillStyle(COL_BG_DARK, 0.4);
    overlay.fillRect(0, 0, WIDTH, HEIGHT);

    if (this._galleryMode) {
      this._createGalleryMode();
    } else {
      this._createDialogMode();
    }
  }

  // ──────────────────────────────────────────────────────────────
  // ギャラリーモード
  // ──────────────────────────────────────────────────────────────
  private _createGalleryMode(): void {
    const { WIDTH } = GAME_CONFIG;

    // 背景 + ポートレートを描画
    this._renderGalleryCharacter();

    // 上部インジケーター
    this._galleryIndicatorText = this.add.text(WIDTH / 2, 20, '', {
      fontFamily: 'Georgia, serif',
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5, 0);

    // 左矢印ボタン
    const leftBtn = this.add.text(80, 310, '◀', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '40px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    leftBtn.on('pointerover', () => leftBtn.setColor('#ffdd00'));
    leftBtn.on('pointerout', () => leftBtn.setColor('#ffffff'));
    leftBtn.on('pointerdown', () => {
      this._galleryIndex = (this._galleryIndex - 1 + GALLERY_CHARACTERS.length) % GALLERY_CHARACTERS.length;
      this._renderGalleryCharacter();
    });

    // 右矢印ボタン
    const rightBtn = this.add.text(1200, 310, '▶', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '40px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    rightBtn.on('pointerover', () => rightBtn.setColor('#ffdd00'));
    rightBtn.on('pointerout', () => rightBtn.setColor('#ffffff'));
    rightBtn.on('pointerdown', () => {
      this._galleryIndex = (this._galleryIndex + 1) % GALLERY_CHARACTERS.length;
      this._renderGalleryCharacter();
    });

    // キャラクター名テキスト（円形フレームの下）
    this._galleryNameText = this.add.text(PORTRAIT_CX, PORTRAIT_CY + FRAME_RADIUS + 20, '', {
      fontFamily: 'Georgia, serif',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5, 0);

    // 下部ドット列（ドットはテキストとして描画）
    const dotY = PORTRAIT_AREA_H - 18;
    const dotSpacing = 18;
    const totalDots = GALLERY_CHARACTERS.length;
    const dotStartX = PORTRAIT_CX - ((totalDots - 1) * dotSpacing) / 2;

    for (let i = 0; i < totalDots; i++) {
      const dot = this.add.text(dotStartX + i * dotSpacing, dotY, '●', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '10px',
        color: '#888888',
      }).setOrigin(0.5);
      this._galleryDots.push(dot);
    }

    // WorldMapへ戻るボタン
    const backBtn = this.add.text(PORTRAIT_CX, PORTRAIT_AREA_H + 30, '← WorldMapへ戻る', {
      fontFamily: 'Georgia, serif',
      fontSize: '18px',
      color: '#c9a227',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    backBtn.on('pointerover', () => backBtn.setColor('#ffdd44'));
    backBtn.on('pointerout', () => backBtn.setColor('#c9a227'));
    backBtn.on('pointerdown', () => this.scene.start('WorldMapScene'));

    // 初回描画を更新（テキストを正しく反映）
    this._updateGalleryUI();
  }

  private _renderGalleryCharacter(): void {
    const entry = GALLERY_CHARACTERS[this._galleryIndex];

    // 既存の再描画対象を破棄
    for (const g of this._portraitGraphics) {
      g.destroy();
    }
    this._portraitGraphics = [];
    this._bgGraphics?.destroy();
    this._frameGraphics?.destroy();

    // 背景
    const bgG = this.add.graphics();
    this._drawBackground(bgG, entry.realmId);
    this._bgGraphics = bgG;
    this._portraitGraphics.push(bgG);

    // フレーム
    const frameG = this.add.graphics();
    frameG.fillStyle(FRAME_BG, 0.75);
    frameG.fillCircle(PORTRAIT_CX, PORTRAIT_CY, FRAME_RADIUS);
    frameG.lineStyle(5, FRAME_BORDER, 1);
    frameG.strokeCircle(PORTRAIT_CX, PORTRAIT_CY, FRAME_RADIUS);
    this._frameGraphics = frameG;
    this._portraitGraphics.push(frameG);

    // キャラクター
    const portraitG = this.add.graphics();
    this._drawPortrait(portraitG, entry.key);
    this._portraitGraphics.push(portraitG);

    // UI要素があれば最前面に持ってくる（Phaserではdepthで対応）
    // Graphicsのdepthを0に、UI要素は後から追加するため自然に上になる

    // UIテキスト更新
    this._updateGalleryUI();
  }

  private _updateGalleryUI(): void {
    if (!this._galleryIndicatorText || !this._galleryNameText) return;

    const entry = GALLERY_CHARACTERS[this._galleryIndex];
    const total = GALLERY_CHARACTERS.length;
    const current = this._galleryIndex + 1;

    this._galleryIndicatorText.setText(`キャラクター一覧 ${current}/${total}`);
    this._galleryNameText.setText(entry.name);

    // ドット更新
    for (let i = 0; i < this._galleryDots.length; i++) {
      this._galleryDots[i].setColor(i === this._galleryIndex ? '#ffdd00' : '#888888');
    }
  }

  // ──────────────────────────────────────────────────────────────
  // 通常会話モード
  // ──────────────────────────────────────────────────────────────
  private _createDialogMode(): void {
    // 背景
    const bgG = this.add.graphics();
    this._drawBackground(bgG, this._data.realmId);
    this._bgGraphics = bgG;

    // ポートレートフレーム（円形）
    const frameG = this.add.graphics();
    frameG.fillStyle(FRAME_BG, 0.75);
    frameG.fillCircle(PORTRAIT_CX, PORTRAIT_CY, FRAME_RADIUS);
    frameG.lineStyle(5, FRAME_BORDER, 1);
    frameG.strokeCircle(PORTRAIT_CX, PORTRAIT_CY, FRAME_RADIUS);
    this._frameGraphics = frameG;

    // キャラクター描画
    const portraitG = this.add.graphics();
    this._drawPortrait(portraitG, this._data.portrait);
    this._portraitGraphics = [bgG, frameG, portraitG];

    // ウィンドウ寸法
    const winW = 1200;
    const winH = 170;
    const winX = 40;
    const winY = 510;

    this._drawWindow(winX, winY, winW, winH);

    // 名前テキスト
    this.add.text(winX + 24, winY + 14, this._data.name, {
      fontFamily: 'Georgia, serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#c9a227',
    });

    // セリフテキスト
    this._lineText = this.add.text(winX + 24, winY + 50, '', {
      fontFamily: 'Georgia, serif',
      fontSize: '17px',
      color: '#2c1a00',
      wordWrap: { width: winW - 48 },
    });

    // 次へインジケーター
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

    // クリックで進む
    this.input.on('pointerdown', this._onClickAdvance, this);

    // 最初のセリフ開始
    this._startLine(this._currentLine);
  }

  // ──────────────────────────────────────────────────────────────
  // ステージ別背景描画
  // ──────────────────────────────────────────────────────────────
  private _drawBackground(g: Phaser.GameObjects.Graphics, realmId?: number): void {
    const W = 1280;
    const H = PORTRAIT_AREA_H;

    switch (realmId) {
      case 1:
        this._drawBgRealm1(g, W, H);
        break;
      case 2:
        this._drawBgRealm2(g, W, H);
        break;
      case 3:
        this._drawBgRealm3(g, W, H);
        break;
      case 4:
        this._drawBgRealm4(g, W, H);
        break;
      case 5:
        this._drawBgRealm5(g, W, H);
        break;
      case 6:
        this._drawBgRealm6(g, W, H);
        break;
      case 7:
        this._drawBgRealm7(g, W, H);
        break;
      case 8:
        this._drawBgRealm8(g, W, H);
        break;
      case 9:
        this._drawBgRealm9(g, W, H);
        break;
      default:
        this._drawBgDefault(g, W, H);
        break;
    }
  }

  // Realm 1: 草原
  private _drawBgRealm1(g: Phaser.GameObjects.Graphics, W: number, H: number): void {
    // 空グラデーション（上: 0x87ceeb, 下: 0x4a9fe8）
    const halfH = Math.floor(H / 2);
    for (let y = 0; y < halfH; y++) {
      const t = y / halfH;
      const r = Math.round(0x87 + (0x4a - 0x87) * t);
      const gr = Math.round(0xce + (0x9f - 0xce) * t);
      const b = Math.round(0xeb + (0xe8 - 0xeb) * t);
      g.fillStyle((r << 16) | (gr << 8) | b, 1);
      g.fillRect(0, y, W, 1);
    }
    // 草原（下半分）
    g.fillStyle(0x4a9e4a, 1);
    g.fillRect(0, halfH, W, H - halfH);
    // 草の明暗（波）
    g.fillStyle(0x3a8a3a, 0.5);
    g.fillEllipse(200, halfH + 10, 400, 30);
    g.fillEllipse(700, halfH + 15, 500, 35);
    g.fillEllipse(1100, halfH + 8, 350, 25);
    // 雲
    this._drawCloud(g, 150, 60, 1.0);
    this._drawCloud(g, 600, 40, 1.2);
    this._drawCloud(g, 1050, 70, 0.9);
  }

  private _drawCloud(g: Phaser.GameObjects.Graphics, x: number, y: number, scale: number): void {
    g.fillStyle(0xffffff, 0.9);
    g.fillEllipse(x, y, 80 * scale, 30 * scale);
    g.fillEllipse(x - 30 * scale, y + 5 * scale, 50 * scale, 24 * scale);
    g.fillEllipse(x + 30 * scale, y + 5 * scale, 50 * scale, 24 * scale);
    g.fillEllipse(x, y + 10 * scale, 90 * scale, 22 * scale);
  }

  // Realm 2: 森
  private _drawBgRealm2(g: Phaser.GameObjects.Graphics, W: number, H: number): void {
    // 暗い緑の空
    g.fillStyle(0x1a3a1a, 1);
    g.fillRect(0, 0, W, H);
    // 木のシルエット（奥）
    g.fillStyle(0x1a4a1a, 1);
    for (let i = 0; i < 8; i++) {
      const tx = i * 180 - 40;
      const th = 200 + (i % 3) * 60;
      g.fillTriangle(tx, H, tx + 80, H - th, tx + 160, H);
    }
    // 木のシルエット（手前）
    g.fillStyle(0x2a6a2a, 1);
    for (let i = 0; i < 6; i++) {
      const tx = i * 220 + 20;
      const th = 160 + (i % 2) * 80;
      g.fillTriangle(tx - 10, H, tx + 90, H - th, tx + 190, H);
    }
    // 幹
    g.fillStyle(0x1a2a10, 1);
    for (let i = 0; i < 6; i++) {
      g.fillRect(i * 220 + 75, H - 60, 18, 60);
    }
  }

  // Realm 3: 砂漠
  private _drawBgRealm3(g: Phaser.GameObjects.Graphics, W: number, H: number): void {
    // オレンジ空グラデーション
    const skyH = Math.floor(H * 0.55);
    for (let y = 0; y < skyH; y++) {
      const t = y / skyH;
      const r = Math.round(0xdd + (0xf0 - 0xdd) * t);
      const gr = Math.round(0x88 + (0xa0 - 0x88) * t);
      const b = Math.round(0x33 + (0x50 - 0x33) * t);
      g.fillStyle((r << 16) | (gr << 8) | b, 1);
      g.fillRect(0, y, W, 1);
    }
    // 砂丘の波（奥）
    g.fillStyle(0xc8a03a, 1);
    g.fillEllipse(300, H, 700, 300);
    g.fillEllipse(900, H - 10, 600, 260);
    g.fillEllipse(1200, H, 500, 280);
    // 砂丘（手前）
    g.fillStyle(0xd4b04a, 1);
    g.fillEllipse(150, H + 20, 500, 220);
    g.fillEllipse(700, H, 700, 280);
    g.fillEllipse(1200, H + 10, 550, 240);
    g.fillRect(0, skyH, W, H - skyH);
    // 地面の明暗
    g.fillStyle(0xbf9830, 0.4);
    g.fillEllipse(500, skyH + 20, 600, 40);
    g.fillEllipse(1100, skyH + 15, 400, 30);
  }

  // Realm 4: 雪山
  private _drawBgRealm4(g: Phaser.GameObjects.Graphics, W: number, H: number): void {
    // 薄い青空グラデーション
    for (let y = 0; y < H; y++) {
      const t = y / H;
      const r = Math.round(0xaa + (0xdd - 0xaa) * t);
      const gr = Math.round(0xcc + (0xee - 0xcc) * t);
      const b = Math.round(0xee + (0xff - 0xee) * t);
      g.fillStyle((r << 16) | (gr << 8) | b, 1);
      g.fillRect(0, y, W, 1);
    }
    // 雪山シルエット（グレー）
    g.fillStyle(0x889aaa, 1);
    g.fillTriangle(200, H, 500, 60, 800, H);
    g.fillTriangle(500, H, 750, 100, 1000, H);
    g.fillTriangle(0, H, 200, 200, 400, H);
    g.fillTriangle(900, H, 1100, 150, 1280, H);
    // 雪（白い山頂）
    g.fillStyle(0xffffff, 1);
    g.fillTriangle(380, H * 0.3, 500, 60, 620, H * 0.3);
    g.fillTriangle(640, H * 0.35, 750, 100, 860, H * 0.35);
    g.fillTriangle(100, H * 0.55, 200, 200, 300, H * 0.55);
    g.fillTriangle(1000, H * 0.48, 1100, 150, 1200, H * 0.48);
    // 雪の粒
    g.fillStyle(0xffffff, 0.7);
    const snowPts = [
      [100, 80], [250, 30], [450, 120], [620, 50], [780, 100],
      [950, 40], [1100, 90], [1230, 60], [170, 160], [350, 180],
      [580, 140], [820, 170], [1050, 130], [1200, 155],
    ];
    for (const [sx, sy] of snowPts) {
      g.fillCircle(sx, sy, 2);
    }
  }

  // Realm 5: 海
  private _drawBgRealm5(g: Phaser.GameObjects.Graphics, W: number, H: number): void {
    // 空（0x4488cc）
    const horizonY = Math.floor(H * 0.45);
    g.fillStyle(0x4488cc, 1);
    g.fillRect(0, 0, W, horizonY);
    // 海グラデーション（0x1a6a9a → 0x0a3a6a）
    for (let y = horizonY; y < H; y++) {
      const t = (y - horizonY) / (H - horizonY);
      const r = Math.round(0x1a + (0x0a - 0x1a) * t);
      const gr = Math.round(0x6a + (0x3a - 0x6a) * t);
      const b = Math.round(0x9a + (0x6a - 0x9a) * t);
      g.fillStyle((r << 16) | (gr << 8) | b, 1);
      g.fillRect(0, y, W, 1);
    }
    // 地平線
    g.lineStyle(2, 0x88bbdd, 0.8);
    g.lineBetween(0, horizonY, W, horizonY);
    // 波のライン
    g.lineStyle(2, 0x4499cc, 0.6);
    for (let i = 0; i < 5; i++) {
      const wy = horizonY + 30 + i * 35;
      g.beginPath();
      for (let x = 0; x <= W; x += 40) {
        const waveY = wy + Math.sin((x / 80) + i) * 6;
        if (x === 0) g.moveTo(x, waveY);
        else g.lineTo(x, waveY);
      }
      g.strokePath();
    }
    // 太陽
    g.fillStyle(0xffee88, 1);
    g.fillCircle(1050, 80, 45);
    g.fillStyle(0xffcc44, 0.4);
    g.fillCircle(1050, 80, 60);
    // 光の筋（海面）
    g.fillStyle(0xffffff, 0.15);
    g.fillRect(1000, horizonY, 100, H - horizonY);
  }

  // Realm 6: 火山
  private _drawBgRealm6(g: Phaser.GameObjects.Graphics, W: number, H: number): void {
    // 暗赤空グラデーション
    for (let y = 0; y < H * 0.6; y++) {
      const t = y / (H * 0.6);
      const r = Math.round(0x33 + (0x66 - 0x33) * t);
      const gr = Math.round(0x0a + (0x0a - 0x0a) * t);
      const b = 0;
      g.fillStyle((r << 16) | (gr << 8) | b, 1);
      g.fillRect(0, y, W, 1);
    }
    // 黒い溶岩地
    g.fillStyle(0x220000, 1);
    g.fillRect(0, Math.floor(H * 0.6), W, Math.ceil(H * 0.4));
    // 火山シルエット
    g.fillStyle(0x1a0000, 1);
    g.fillTriangle(400, H, 640, H * 0.15, 880, H);
    g.fillTriangle(0, H, 200, H * 0.5, 450, H);
    g.fillTriangle(830, H, 1050, H * 0.45, 1280, H);
    // オレンジの溶岩ライン
    g.lineStyle(3, 0xff6600, 0.9);
    g.lineBetween(500, H * 0.5, 580, H * 0.7);
    g.lineBetween(580, H * 0.7, 540, H);
    g.lineBetween(700, H * 0.55, 760, H * 0.72);
    g.lineBetween(760, H * 0.72, 730, H);
    // 溶岩の光（楕円）
    g.fillStyle(0xff4400, 0.3);
    g.fillEllipse(540, H * 0.85, 200, 30);
    g.fillEllipse(740, H * 0.82, 160, 25);
    // 噴煙
    g.fillStyle(0x440000, 0.5);
    g.fillEllipse(640, H * 0.1, 120, 60);
    g.fillEllipse(620, H * 0.05, 80, 40);
    g.fillEllipse(660, H * 0.03, 60, 35);
  }

  // Realm 7: 闇の森
  private _drawBgRealm7(g: Phaser.GameObjects.Graphics, W: number, H: number): void {
    // 深紫黒
    g.fillStyle(0x080010, 1);
    g.fillRect(0, 0, W, H);
    // 紫の靄（半透明楕円）
    g.fillStyle(0x440066, 0.2);
    g.fillEllipse(300, H * 0.6, 600, 300);
    g.fillStyle(0x330055, 0.15);
    g.fillEllipse(900, H * 0.5, 500, 250);
    g.fillStyle(0x220044, 0.18);
    g.fillEllipse(640, H * 0.3, 800, 200);
    // 枯れ木シルエット
    g.fillStyle(0x0a0015, 1);
    this._drawDeadTree(g, 100, H);
    this._drawDeadTree(g, 350, H);
    this._drawDeadTree(g, 900, H);
    this._drawDeadTree(g, 1150, H);
    // 小さな紫の光点
    g.fillStyle(0xaa44ff, 0.4);
    const glowPts = [[200, 150], [450, 200], [750, 120], [1000, 180], [1200, 100], [80, 300]];
    for (const [gx, gy] of glowPts) {
      g.fillCircle(gx, gy, 3);
    }
  }

  private _drawDeadTree(g: Phaser.GameObjects.Graphics, x: number, baseY: number): void {
    // 幹
    g.fillRect(x - 6, baseY - 180, 12, 180);
    // 枝
    g.fillRect(x - 50, baseY - 140, 55, 6);
    g.fillRect(x - 4, baseY - 140, 50, 6);
    g.fillRect(x - 35, baseY - 100, 8, 45);
    g.fillRect(x + 28, baseY - 100, 8, 40);
    g.fillRect(x - 55, baseY - 140, 8, 30);
    g.fillRect(x + 44, baseY - 138, 8, 28);
  }

  // Realm 8: 天空
  private _drawBgRealm8(g: Phaser.GameObjects.Graphics, W: number, H: number): void {
    // 明るい青グラデーション
    for (let y = 0; y < H; y++) {
      const t = y / H;
      const r = Math.round(0x66 + (0xaa - 0x66) * t);
      const gr = Math.round(0x99 + (0xdd - 0x99) * t);
      const b = Math.round(0xff + (0xff - 0xff) * t);
      g.fillStyle((r << 16) | (gr << 8) | b, 1);
      g.fillRect(0, y, W, 1);
    }
    // 光の柱
    g.fillStyle(0xffffff, 0.12);
    g.fillRect(580, 0, 60, H);
    g.fillStyle(0xffffff, 0.08);
    g.fillRect(540, 0, 140, H);
    // 大きな雲（浮遊感）
    g.fillStyle(0xffffff, 0.95);
    this._drawBigCloud(g, 150, 100, 1.5);
    this._drawBigCloud(g, 700, 60, 2.0);
    this._drawBigCloud(g, 1150, 120, 1.3);
    // 下部の雲
    g.fillStyle(0xeeeeff, 0.7);
    this._drawBigCloud(g, 100, H - 60, 1.8);
    this._drawBigCloud(g, 800, H - 40, 2.2);
    // 光の粒
    g.fillStyle(0xffee88, 0.6);
    const lightPts = [[300, 80], [500, 50], [900, 70], [1100, 40], [200, 180], [1000, 150]];
    for (const [lx, ly] of lightPts) {
      g.fillCircle(lx, ly, 4);
    }
  }

  private _drawBigCloud(g: Phaser.GameObjects.Graphics, x: number, y: number, scale: number): void {
    g.fillEllipse(x, y, 120 * scale, 45 * scale);
    g.fillEllipse(x - 50 * scale, y + 8 * scale, 80 * scale, 36 * scale);
    g.fillEllipse(x + 50 * scale, y + 8 * scale, 80 * scale, 36 * scale);
    g.fillEllipse(x - 20 * scale, y - 15 * scale, 60 * scale, 30 * scale);
    g.fillEllipse(x + 20 * scale, y - 12 * scale, 55 * scale, 28 * scale);
    g.fillEllipse(x, y + 15 * scale, 130 * scale, 32 * scale);
  }

  // Realm 9: 魔王城
  private _drawBgRealm9(g: Phaser.GameObjects.Graphics, W: number, H: number): void {
    // 暗赤空グラデーション
    for (let y = 0; y < H; y++) {
      const t = y / H;
      const r = Math.round(0x1a + (0x33 - 0x1a) * t);
      const gr = 0;
      const b = 0;
      g.fillStyle((r << 16) | (gr << 8) | b, 1);
      g.fillRect(0, y, W, 1);
    }
    // 城のシルエット（黒い城壁）
    g.fillStyle(0x000000, 1);
    // 中央大塔
    g.fillRect(560, H - 350, 120, 350);
    g.fillTriangle(520, H - 350, 620, H - 450, 720, H - 350);
    // 左塔
    g.fillRect(360, H - 240, 80, 240);
    g.fillTriangle(330, H - 240, 400, H - 320, 470, H - 240);
    // 右塔
    g.fillRect(800, H - 240, 80, 240);
    g.fillTriangle(770, H - 240, 840, H - 320, 910, H - 240);
    // 城壁
    g.fillRect(200, H - 100, 900, 100);
    // 城壁の凸凹
    for (let i = 0; i < 18; i++) {
      g.fillRect(200 + i * 50, H - 120, 28, 22);
    }
    // 左右の小塔
    g.fillRect(150, H - 160, 60, 160);
    g.fillTriangle(130, H - 160, 180, H - 220, 230, H - 160);
    g.fillRect(1030, H - 160, 60, 160);
    g.fillTriangle(1010, H - 160, 1060, H - 220, 1110, H - 160);
    // 稲妻のような紫の線
    g.lineStyle(2, 0x8833cc, 0.9);
    g.lineBetween(800, 30, 820, 80);
    g.lineBetween(820, 80, 790, 120);
    g.lineBetween(790, 120, 815, 170);
    g.lineStyle(2, 0xaa44ff, 0.7);
    g.lineBetween(350, 50, 370, 100);
    g.lineBetween(370, 100, 340, 145);
    g.lineBetween(340, 145, 360, 190);
    // 赤い窓の光
    g.fillStyle(0xff2200, 0.6);
    g.fillRect(608, H - 280, 24, 18);
    g.fillRect(390, H - 200, 16, 12);
    g.fillRect(830, H - 200, 16, 12);
  }

  // デフォルト: 夜空
  private _drawBgDefault(g: Phaser.GameObjects.Graphics, W: number, H: number): void {
    g.fillStyle(0x0a0a1a, 1);
    g.fillRect(0, 0, W, H);
    // 星
    g.fillStyle(0xffffff, 0.9);
    const stars = [
      [100, 50], [250, 80], [400, 30], [550, 70], [700, 45], [850, 90], [1000, 55], [1150, 75],
      [170, 150], [320, 120], [480, 160], [630, 130], [780, 140], [930, 110], [1080, 145],
      [80, 250], [230, 220], [380, 270], [530, 240], [680, 260], [830, 210], [980, 245], [1130, 230],
      [150, 350], [300, 320], [450, 370], [600, 340], [750, 360], [900, 310], [1050, 345],
      [60, 420], [210, 400], [360, 440], [510, 410], [660, 430], [810, 390], [960, 420], [1110, 405],
    ];
    for (const [sx, sy] of stars) {
      g.fillCircle(sx, sy, 1.5);
    }
    // 少し大きい星
    g.fillStyle(0xffffff, 1);
    const bigStars = [[200, 100], [700, 60], [1100, 120], [450, 300], [900, 200]];
    for (const [sx, sy] of bigStars) {
      g.fillCircle(sx, sy, 2.5);
    }
    // 三日月
    g.fillStyle(0xffffcc, 0.9);
    g.fillCircle(1100, 80, 28);
    g.fillStyle(0x0a0a1a, 1);
    g.fillCircle(1112, 72, 22);
  }

  // ──────────────────────────────────────────────────────────────
  // ウィンドウ
  // ──────────────────────────────────────────────────────────────
  private _drawWindow(x: number, y: number, w: number, h: number): void {
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.5);
    g.fillRoundedRect(x + 4, y + 4, w, h, 10);
    g.fillStyle(COL_PARCHMENT, 1);
    g.fillRoundedRect(x, y, w, h, 10);
    g.fillStyle(COL_PARCHMENT_DARK, 0.3);
    g.fillRoundedRect(x + 4, y + 4, w - 8, h - 8, 8);
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

    g.fillStyle(0x2244aa, 1);
    g.fillTriangle(cx - 70, cy + 120, cx + 70, cy + 120, cx - 90, cy + 240);
    g.fillTriangle(cx - 70, cy + 120, cx + 70, cy + 120, cx + 90, cy + 240);
    g.fillRect(cx - 70, cy + 80, 140, 50);

    g.fillStyle(0xd4a827, 1);
    g.fillRect(cx - 55, cy + 90, 110, 80);
    g.lineStyle(2, 0xffd700, 1);
    g.strokeRect(cx - 50, cy + 95, 100, 70);
    g.lineBetween(cx - 50, cy + 130, cx + 50, cy + 130);
    g.lineBetween(cx, cy + 95, cx, cy + 165);

    g.fillStyle(0xf5c090, 1);
    g.fillRect(cx - 14, cy + 55, 28, 40);
    g.fillEllipse(cx, cy - 20, 88, 96);

    g.fillStyle(0xc0c0c0, 1);
    g.fillEllipse(cx, cy - 60, 92, 60);
    g.fillRect(cx - 46, cy - 30, 92, 20);
    g.lineStyle(3, 0xd4a827, 1);
    g.lineBetween(cx - 46, cy - 30, cx + 46, cy - 30);
    g.lineStyle(2, 0xffd700, 1);
    g.lineBetween(cx - 10, cy - 80, cx + 10, cy - 80);

    g.fillStyle(0x3366cc, 1);
    g.fillEllipse(cx - 20, cy - 18, 16, 12);
    g.fillEllipse(cx + 20, cy - 18, 16, 12);
    g.fillStyle(0x000000, 1);
    g.fillCircle(cx - 20, cy - 18, 4);
    g.fillCircle(cx + 20, cy - 18, 4);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - 17, cy - 21, 2);
    g.fillCircle(cx + 23, cy - 21, 2);

    g.lineStyle(3, 0x222222, 1);
    g.lineBetween(cx - 28, cy - 30, cx - 12, cy - 28);
    g.lineBetween(cx + 12, cy - 28, cx + 28, cy - 30);

    g.lineStyle(1, 0xd09060, 1);
    g.lineBetween(cx, cy - 10, cx + 5, cy - 2);

    g.lineStyle(2, 0xc07050, 1);
    g.lineBetween(cx - 14, cy + 10, cx + 14, cy + 10);

    g.fillStyle(0xf5c090, 1);
    g.fillEllipse(cx - 44, cy - 18, 14, 20);
    g.fillEllipse(cx + 44, cy - 18, 14, 20);

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

    g.fillStyle(0xcc7722, 1);
    g.fillEllipse(cx, cy + 130, 200, 160);
    g.fillRect(cx - 90, cy + 80, 180, 80);
    g.lineStyle(2, 0xaa5510, 1);
    g.lineBetween(cx - 80, cy + 90, cx - 80, cy + 160);
    g.lineBetween(cx + 80, cy + 90, cx + 80, cy + 160);

    g.fillStyle(0xf0b080, 1);
    g.fillRect(cx - 16, cy + 52, 32, 35);
    g.fillEllipse(cx, cy - 10, 96, 100);

    g.fillStyle(0x5a3a10, 1);
    g.fillEllipse(cx, cy - 78, 130, 30);
    g.fillRect(cx - 48, cy - 80, 96, 80);
    g.fillEllipse(cx, cy - 80, 96, 26);
    g.lineStyle(3, 0x3a2000, 1);
    g.lineBetween(cx - 48, cy - 48, cx + 48, cy - 48);

    g.fillStyle(0xffffff, 1);
    g.fillEllipse(cx, cy + 28, 70, 36);
    g.fillEllipse(cx - 24, cy + 35, 30, 22);
    g.fillEllipse(cx + 24, cy + 35, 30, 22);

    g.fillStyle(0x6b3a1f, 1);
    g.fillEllipse(cx - 22, cy - 10, 16, 14);
    g.fillEllipse(cx + 22, cy - 10, 16, 14);
    g.fillStyle(0x000000, 1);
    g.fillCircle(cx - 22, cy - 10, 4);
    g.fillCircle(cx + 22, cy - 10, 4);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - 19, cy - 13, 2);
    g.fillCircle(cx + 25, cy - 13, 2);

    g.lineStyle(3, 0xcccccc, 1);
    g.lineBetween(cx - 30, cy - 24, cx - 14, cy - 22);
    g.lineBetween(cx + 14, cy - 22, cx + 30, cy - 24);

    g.lineStyle(2, 0xc07050, 1);
    g.beginPath();
    g.arc(cx, cy + 6, 18, 0, Math.PI, false);
    g.strokePath();

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

    g.fillStyle(0x222222, 1);
    g.fillEllipse(cx - 80, cy + 100, 100, 60);
    g.fillEllipse(cx + 80, cy + 100, 100, 60);
    g.fillRect(cx - 80, cy + 90, 160, 80);
    g.lineStyle(2, 0x444444, 1);
    g.strokeRect(cx - 70, cy + 100, 140, 60);

    g.fillStyle(0x336633, 1);
    g.fillRect(cx - 55, cy + 55, 110, 90);
    g.fillRect(cx - 18, cy + 30, 36, 35);
    g.fillEllipse(cx, cy - 15, 100, 104);

    g.fillStyle(0x553311, 1);
    g.fillTriangle(cx - 28, cy - 60, cx - 44, cy - 130, cx - 12, cy - 60);
    g.fillTriangle(cx + 28, cy - 60, cx + 44, cy - 130, cx + 12, cy - 60);

    g.fillStyle(0xcc0000, 1);
    g.fillEllipse(cx - 24, cy - 16, 26, 22);
    g.fillEllipse(cx + 24, cy - 16, 26, 22);
    g.fillStyle(0xff3333, 1);
    g.fillCircle(cx - 24, cy - 16, 7);
    g.fillCircle(cx + 24, cy - 16, 7);
    g.fillStyle(0xff9999, 0.6);
    g.fillCircle(cx - 24, cy - 16, 12);
    g.fillCircle(cx + 24, cy - 16, 12);

    g.lineStyle(4, 0x112211, 1);
    g.lineBetween(cx - 38, cy - 36, cx - 14, cy - 28);
    g.lineBetween(cx + 14, cy - 28, cx + 38, cy - 36);

    g.lineStyle(2, 0x224422, 1);
    g.lineBetween(cx - 20, cy + 12, cx + 20, cy + 12);
    g.fillStyle(0xffffff, 1);
    g.fillTriangle(cx - 14, cy + 12, cx - 8, cy + 12, cx - 11, cy + 24);
    g.fillTriangle(cx + 8, cy + 12, cx + 14, cy + 12, cx + 11, cy + 24);

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

    g.fillStyle(0x1a4a1a, 1);
    g.fillEllipse(cx, cy + 130, 200, 160);
    g.fillRect(cx - 80, cy + 50, 160, 100);
    g.fillRect(cx - 20, cy + 22, 40, 38);
    g.fillEllipse(cx, cy - 20, 108, 110);

    g.fillStyle(0x4a2a00, 1);
    g.fillRect(cx - 46, cy - 60, 10, 50);
    g.fillRect(cx + 36, cy - 60, 10, 50);
    g.fillRect(cx - 60, cy - 90, 8, 40);
    g.fillRect(cx + 52, cy - 90, 8, 40);
    g.fillRect(cx - 58, cy - 100, 30, 7);
    g.fillRect(cx + 28, cy - 100, 30, 7);
    g.fillRect(cx - 56, cy - 80, 20, 6);
    g.fillRect(cx + 36, cy - 80, 20, 6);

    g.fillStyle(0xdddd00, 1);
    g.fillEllipse(cx - 24, cy - 16, 24, 20);
    g.fillEllipse(cx + 24, cy - 16, 24, 20);
    g.fillStyle(0x000000, 1);
    g.fillEllipse(cx - 24, cy - 16, 10, 16);
    g.fillEllipse(cx + 24, cy - 16, 10, 16);

    g.fillStyle(0x2a6a2a, 0.8);
    const spots = [
      [-30, -40, 14, 10], [20, -50, 18, 12], [-10, 10, 16, 10],
      [34, 0, 12, 9], [-38, 5, 10, 8], [10, -35, 12, 8],
    ];
    for (const [dx, dy, w, h] of spots) {
      g.fillEllipse(cx + dx, cy + dy, w, h);
    }

    g.lineStyle(3, 0x0a2a0a, 1);
    g.lineBetween(cx - 36, cy - 32, cx - 12, cy - 30);
    g.lineBetween(cx + 12, cy - 30, cx + 36, cy - 32);

    g.lineStyle(2, 0x0a2a0a, 1);
    g.lineBetween(cx - 18, cy + 12, cx + 18, cy + 12);
  }

  // ──────────────────────────────────────────────────────────────
  // サンド侯爵（Realm3）
  // ──────────────────────────────────────────────────────────────
  private _drawBossSand(g: Phaser.GameObjects.Graphics): void {
    const cx = PORTRAIT_CX;
    const cy = PORTRAIT_CY;

    g.fillStyle(0xd4a85a, 1);
    g.fillEllipse(cx, cy + 130, 190, 155);
    g.fillRect(cx - 75, cy + 50, 150, 95);

    g.fillStyle(0xaa7733, 1);
    g.fillRect(cx - 60, cy - 80, 120, 20);
    g.fillRect(cx - 50, cy - 80, 100, 16);
    g.fillRect(cx - 60, cy - 84, 120, 12);
    g.fillStyle(0xcc8800, 1);
    for (let i = 0; i < 5; i++) {
      g.fillRect(cx - 46 + i * 23, cy - 90, 12, 12);
    }
    g.fillStyle(0xbb8833, 0.9);
    g.fillRect(cx - 60, cy - 64, 16, 80);
    g.fillRect(cx + 44, cy - 64, 16, 80);

    g.fillStyle(0xd4a85a, 1);
    g.fillRect(cx - 18, cy + 28, 36, 32);
    g.fillEllipse(cx, cy - 18, 100, 104);

    g.fillStyle(0xcc4422, 1);
    g.fillRect(cx - 60, cy + 28, 120, 28);
    g.lineStyle(2, 0xaa2200, 1);
    g.lineBetween(cx - 60, cy + 28, cx + 60, cy + 28);
    g.lineBetween(cx - 60, cy + 56, cx + 60, cy + 56);

    g.fillStyle(0xffffff, 1);
    g.fillEllipse(cx - 24, cy - 14, 24, 20);
    g.fillEllipse(cx + 24, cy - 14, 24, 20);
    g.fillStyle(0x553300, 1);
    g.fillCircle(cx - 24, cy - 14, 6);
    g.fillCircle(cx + 24, cy - 14, 6);
    g.fillStyle(0x000000, 1);
    g.fillCircle(cx - 24, cy - 14, 3);
    g.fillCircle(cx + 24, cy - 14, 3);

    g.lineStyle(3, 0x7a4a10, 1);
    g.lineBetween(cx - 32, cy - 30, cx - 14, cy - 26);
    g.lineBetween(cx + 14, cy - 26, cx + 32, cy - 30);

    g.lineStyle(2, 0xaa7733, 1);
    g.lineBetween(cx - 16, cy + 8, cx + 16, cy + 8);

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

    g.fillStyle(0xaaccee, 1);
    g.fillEllipse(cx, cy + 130, 195, 155);
    g.fillRect(cx - 76, cy + 52, 152, 92);
    g.fillRect(cx - 18, cy + 26, 36, 34);

    g.fillStyle(0xbbddee, 1);
    g.fillEllipse(cx, cy - 18, 104, 108);

    g.fillStyle(0xddeeff, 1);
    g.fillTriangle(cx - 36, cy - 64, cx - 22, cy - 120, cx - 8, cy - 64);
    g.fillTriangle(cx - 12, cy - 68, cx, cy - 138, cx + 12, cy - 68);
    g.fillTriangle(cx + 8, cy - 64, cx + 22, cy - 120, cx + 36, cy - 64);
    g.lineStyle(2, 0x99bbdd, 1);
    g.strokeTriangle(cx - 36, cy - 64, cx - 22, cy - 120, cx - 8, cy - 64);
    g.strokeTriangle(cx - 12, cy - 68, cx, cy - 138, cx + 12, cy - 68);
    g.strokeTriangle(cx + 8, cy - 64, cx + 22, cy - 120, cx + 36, cy - 64);
    g.fillStyle(0xbbddff, 1);
    g.fillRect(cx - 44, cy - 66, 88, 12);

    g.fillStyle(0x4488cc, 1);
    g.fillEllipse(cx - 24, cy - 14, 26, 22);
    g.fillEllipse(cx + 24, cy - 14, 26, 22);
    g.fillStyle(0x000000, 1);
    g.fillCircle(cx - 24, cy - 14, 6);
    g.fillCircle(cx + 24, cy - 14, 6);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - 20, cy - 18, 2);
    g.fillCircle(cx + 28, cy - 18, 2);

    g.lineStyle(3, 0x8aaabb, 1);
    g.lineBetween(cx - 34, cy - 30, cx - 14, cy - 28);
    g.lineBetween(cx + 14, cy - 28, cx + 34, cy - 30);

    g.fillStyle(0xffffff, 0.55);
    g.fillEllipse(cx - 20, cy + 30, 30, 16);
    g.fillEllipse(cx + 5, cy + 36, 40, 14);
    g.fillEllipse(cx + 28, cy + 28, 24, 12);

    g.lineStyle(2, 0x88aacc, 1);
    g.lineBetween(cx - 16, cy + 10, cx + 16, cy + 10);
  }

  // ──────────────────────────────────────────────────────────────
  // 海神ネプタス（Realm5）
  // ──────────────────────────────────────────────────────────────
  private _drawBossSea(g: Phaser.GameObjects.Graphics): void {
    const cx = PORTRAIT_CX;
    const cy = PORTRAIT_CY;

    g.fillStyle(0x1a7a8a, 1);
    g.fillEllipse(cx, cy + 130, 200, 165);
    g.fillRect(cx - 80, cy + 50, 160, 95);
    g.fillRect(cx - 20, cy + 28, 40, 32);

    g.fillStyle(0x1a8a9a, 1);
    g.fillEllipse(cx, cy - 16, 106, 110);

    g.lineStyle(2, 0x0a5a6a, 1);
    for (let i = 0; i < 4; i++) {
      g.beginPath();
      g.arc(cx - 60, cy - 20 + i * 14, 20, -0.5, 0.5, false);
      g.strokePath();
      g.beginPath();
      g.arc(cx + 60, cy - 20 + i * 14, 20, Math.PI - 0.5, Math.PI + 0.5, false);
      g.strokePath();
    }

    g.fillStyle(0xddaa22, 1);
    g.fillRect(cx - 50, cy - 68, 100, 14);
    g.fillTriangle(cx - 40, cy - 68, cx - 28, cy - 118, cx - 16, cy - 68);
    g.fillTriangle(cx - 10, cy - 72, cx, cy - 136, cx + 10, cy - 72);
    g.fillTriangle(cx + 16, cy - 68, cx + 28, cy - 118, cx + 40, cy - 68);
    g.fillStyle(0x44aaff, 1);
    g.fillCircle(cx - 28, cy - 66, 5);
    g.fillCircle(cx, cy - 70, 6);
    g.fillCircle(cx + 28, cy - 66, 5);

    g.fillStyle(0x88dd44, 1);
    g.fillEllipse(cx - 26, cy - 14, 28, 22);
    g.fillEllipse(cx + 26, cy - 14, 28, 22);
    g.fillStyle(0x000000, 1);
    g.fillEllipse(cx - 26, cy - 14, 12, 18);
    g.fillEllipse(cx + 26, cy - 14, 12, 18);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - 22, cy - 18, 2);
    g.fillCircle(cx + 30, cy - 18, 2);

    g.lineStyle(3, 0x0a4a5a, 1);
    g.lineBetween(cx - 36, cy - 30, cx - 14, cy - 28);
    g.lineBetween(cx + 14, cy - 28, cx + 36, cy - 30);

    g.lineStyle(2, 0x0a5a6a, 1);
    g.lineBetween(cx - 18, cy + 12, cx + 18, cy + 12);
  }

  // ──────────────────────────────────────────────────────────────
  // 炎帝ヴォルカ（Realm6）
  // ──────────────────────────────────────────────────────────────
  private _drawBossFire(g: Phaser.GameObjects.Graphics): void {
    const cx = PORTRAIT_CX;
    const cy = PORTRAIT_CY;

    g.fillStyle(0xff6600, 0.25);
    g.fillCircle(cx, cy + 50, 130);
    g.fillStyle(0xffaa00, 0.15);
    g.fillCircle(cx, cy + 40, 110);

    g.fillStyle(0xcc3300, 1);
    g.fillEllipse(cx, cy + 130, 195, 160);
    g.fillRect(cx - 76, cy + 50, 152, 94);
    g.fillRect(cx - 18, cy + 26, 36, 32);

    g.fillStyle(0xdd4400, 1);
    g.fillEllipse(cx, cy - 16, 104, 108);

    g.fillStyle(0xff6600, 0.7);
    g.fillTriangle(cx - 40, cy + 80, cx - 20, cy + 40, cx, cy + 80);
    g.fillTriangle(cx, cy + 80, cx + 20, cy + 40, cx + 40, cy + 80);
    g.fillTriangle(cx - 20, cy + 90, cx, cy + 55, cx + 20, cy + 90);

    g.fillStyle(0xff8800, 1);
    g.fillTriangle(cx - 44, cy - 64, cx - 30, cy - 116, cx - 16, cy - 64);
    g.fillTriangle(cx - 14, cy - 70, cx, cy - 142, cx + 14, cy - 70);
    g.fillTriangle(cx + 16, cy - 64, cx + 30, cy - 116, cx + 44, cy - 64);
    g.fillStyle(0xffcc00, 1);
    g.fillTriangle(cx - 38, cy - 66, cx - 28, cy - 106, cx - 18, cy - 66);
    g.fillTriangle(cx - 10, cy - 72, cx, cy - 126, cx + 10, cy - 72);
    g.fillTriangle(cx + 18, cy - 66, cx + 28, cy - 106, cx + 38, cy - 66);

    g.fillStyle(0xffffff, 1);
    g.fillEllipse(cx - 26, cy - 14, 28, 24);
    g.fillEllipse(cx + 26, cy - 14, 28, 24);
    g.fillStyle(0xffcc44, 0.8);
    g.fillCircle(cx - 26, cy - 14, 8);
    g.fillCircle(cx + 26, cy - 14, 8);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - 22, cy - 18, 3);
    g.fillCircle(cx + 30, cy - 18, 3);

    g.lineStyle(3, 0x881100, 1);
    g.lineBetween(cx - 38, cy - 32, cx - 14, cy - 26);
    g.lineBetween(cx + 14, cy - 26, cx + 38, cy - 32);

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

    g.fillStyle(0x440066, 0.35);
    g.fillEllipse(cx, cy + 40, 300, 260);
    g.fillStyle(0x220044, 0.3);
    g.fillEllipse(cx, cy + 30, 240, 200);

    g.fillStyle(0x2a0a4a, 1);
    g.fillEllipse(cx, cy + 130, 195, 160);
    g.fillRect(cx - 76, cy + 50, 152, 95);
    g.fillRect(cx - 18, cy + 26, 36, 34);

    g.fillStyle(0x3a1060, 1);
    g.fillEllipse(cx, cy - 16, 104, 108);

    g.fillStyle(0x440066, 1);
    g.fillTriangle(cx - 32, cy - 60, cx - 50, cy - 148, cx - 10, cy - 58);
    g.fillTriangle(cx + 32, cy - 60, cx + 50, cy - 148, cx + 10, cy - 58);
    g.lineStyle(2, 0x220044, 1);
    g.strokeTriangle(cx - 32, cy - 60, cx - 50, cy - 148, cx - 10, cy - 58);
    g.strokeTriangle(cx + 32, cy - 60, cx + 50, cy - 148, cx + 10, cy - 58);

    g.fillStyle(0xaa44ff, 1);
    g.fillEllipse(cx - 26, cy - 14, 28, 24);
    g.fillEllipse(cx + 26, cy - 14, 28, 24);
    g.fillStyle(0x6600cc, 1);
    g.fillCircle(cx - 26, cy - 14, 7);
    g.fillCircle(cx + 26, cy - 14, 7);
    g.fillStyle(0xcc88ff, 0.7);
    g.fillCircle(cx - 26, cy - 14, 12);
    g.fillCircle(cx + 26, cy - 14, 12);

    g.lineStyle(3, 0x110022, 1);
    g.lineBetween(cx - 36, cy - 32, cx - 12, cy - 26);
    g.lineBetween(cx + 12, cy - 26, cx + 36, cy - 32);

    g.lineStyle(2, 0x551188, 1);
    g.lineBetween(cx - 18, cy + 12, cx + 18, cy + 12);

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

    g.fillStyle(0xffffcc, 0.2);
    g.fillCircle(cx, cy + 30, 150);

    g.fillStyle(0xeeeeff, 0.9);
    g.fillTriangle(cx - 76, cy + 60, cx - 160, cy - 20, cx - 60, cy + 100);
    g.fillTriangle(cx + 76, cy + 60, cx + 160, cy - 20, cx + 60, cy + 100);
    g.fillStyle(0xddddee, 0.7);
    g.fillTriangle(cx - 76, cy + 80, cx - 150, cy + 10, cx - 60, cy + 120);
    g.fillTriangle(cx + 76, cy + 80, cx + 150, cy + 10, cx + 60, cy + 120);

    g.fillStyle(0xeeeebb, 1);
    g.fillEllipse(cx, cy + 130, 195, 155);
    g.fillRect(cx - 76, cy + 52, 152, 92);
    g.fillRect(cx - 18, cy + 28, 36, 32);

    g.fillStyle(0xffffcc, 1);
    g.fillEllipse(cx, cy - 16, 104, 108);

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
    g.fillStyle(0xddcc55, 1);
    g.fillRect(cx - 50, cy - 70, 100, 14);
    g.lineStyle(2, 0xffee88, 1);
    g.strokeRect(cx - 50, cy - 70, 100, 14);

    g.fillStyle(0xddaa00, 1);
    g.fillEllipse(cx - 24, cy - 14, 26, 22);
    g.fillEllipse(cx + 24, cy - 14, 26, 22);
    g.fillStyle(0x000000, 1);
    g.fillCircle(cx - 24, cy - 14, 6);
    g.fillCircle(cx + 24, cy - 14, 6);
    g.fillStyle(0xffffcc, 1);
    g.fillCircle(cx - 20, cy - 18, 2);
    g.fillCircle(cx + 28, cy - 18, 2);

    g.lineStyle(3, 0xaa8800, 1);
    g.lineBetween(cx - 34, cy - 30, cx - 14, cy - 28);
    g.lineBetween(cx + 14, cy - 28, cx + 34, cy - 30);

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

    g.fillStyle(0x110011, 1);
    g.fillEllipse(cx, cy + 130, 200, 165);
    g.fillRect(cx - 80, cy + 50, 160, 96);
    g.fillRect(cx - 20, cy + 28, 40, 32);

    g.fillStyle(0x1a0022, 1);
    g.fillEllipse(cx, cy - 14, 108, 112);

    g.fillStyle(0x660000, 1);
    g.fillTriangle(cx - 34, cy - 58, cx - 56, cy - 170, cx - 4, cy - 56);
    g.fillTriangle(cx + 34, cy - 58, cx + 56, cy - 170, cx + 4, cy - 56);
    g.lineStyle(2, 0xaa5500, 1);
    g.strokeTriangle(cx - 34, cy - 58, cx - 56, cy - 170, cx - 4, cy - 56);
    g.strokeTriangle(cx + 34, cy - 58, cx + 56, cy - 170, cx + 4, cy - 56);

    g.fillStyle(0x880000, 1);
    g.fillRect(cx - 48, cy - 64, 96, 16);
    g.fillStyle(0xaa7700, 1);
    for (let i = 0; i < 5; i++) {
      g.fillTriangle(cx - 40 + i * 20, cy - 64, cx - 30 + i * 20, cy - 88, cx - 20 + i * 20, cy - 64);
    }
    g.lineStyle(2, 0xddaa00, 1);
    g.strokeRect(cx - 48, cy - 64, 96, 16);

    g.fillStyle(0xcc0000, 1);
    g.fillEllipse(cx - 28, cy - 14, 32, 26);
    g.fillEllipse(cx + 28, cy - 14, 32, 26);
    g.fillStyle(0xff2222, 1);
    g.fillCircle(cx - 28, cy - 14, 9);
    g.fillCircle(cx + 28, cy - 14, 9);
    g.fillStyle(0xff8888, 0.5);
    g.fillCircle(cx - 28, cy - 14, 14);
    g.fillCircle(cx + 28, cy - 14, 14);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - 24, cy - 18, 3);
    g.fillCircle(cx + 32, cy - 18, 3);

    g.lineStyle(2, 0xddaa00, 1);
    g.strokeEllipse(cx - 28, cy - 14, 36, 30);
    g.strokeEllipse(cx + 28, cy - 14, 36, 30);

    g.lineStyle(2, 0x553300, 1);
    g.lineBetween(cx - 38, cy - 34, cx - 10, cy - 28);
    g.lineBetween(cx + 10, cy - 28, cx + 38, cy - 34);

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
