import Phaser from 'phaser';
import { FONTS, GAME_CONFIG } from '../config';

// 各テキストに対応する背景演出の種類
type IllustType =
  | 'peaceful'   // 平和な世界
  | 'people'     // 人々の暮らし
  | 'dramatic'   // 転換点
  | 'darkLord'   // 魔王登場
  | 'shatter'    // 世界が砕ける
  | 'suffering'  // 苦しむ人々
  | 'dawn'       // 夜明け
  | 'hero'       // 勇者
  | 'battle';    // 決戦へ

const OPENING_LINES: { text: string; illust: IllustType }[] = [
  { text: '遥か昔、この世界は一つだった。',                          illust: 'peaceful' },
  { text: '豊かな大地、澄んだ空、\n人々は平和に暮らしていた。',       illust: 'people' },
  { text: 'しかし――',                                               illust: 'dramatic' },
  { text: '魔王ナインが現れた。',                                    illust: 'darkLord' },
  { text: '彼は世界を9つのRealm（王国）に引き裂き、\nそれぞれに手下を君臨させた。', illust: 'shatter' },
  { text: '人々は苦しみ、希望を失っていった。',                       illust: 'suffering' },
  { text: 'そして今――',                                             illust: 'dawn' },
  { text: 'あなたは伝説の数術師の血を引く勇者。',                    illust: 'hero' },
  { text: '9つのRealmを解放し、\n魔王ナインを打ち倒せ！',            illust: 'battle' },
];

export class OpeningScene extends Phaser.Scene {
  private _currentLine = 0;
  private _textObj!: Phaser.GameObjects.Text;
  private _illustLayer!: Phaser.GameObjects.Container;
  private _isAnimating = false;

  constructor() {
    super({ key: 'OpeningScene' });
  }

  create(): void {
    const { WIDTH, HEIGHT } = GAME_CONFIG;

    // 羊皮紙風の背景
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x2b1d0e, 0x2b1d0e, 0x1a0f05, 0x1a0f05, 1);
    bg.fillRect(0, 0, WIDTH, HEIGHT);

    // 羊皮紙のテクスチャ感（縦線）
    const texture = this.add.graphics();
    texture.lineStyle(1, 0x3d2b15, 0.15);
    for (let x = 0; x < WIDTH; x += 4) {
      texture.lineBetween(x, 0, x, HEIGHT);
    }

    // ビネット（周囲を暗く）
    const vignette = this.add.graphics();
    vignette.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.8, 0.8, 0, 0);
    vignette.fillRect(0, 0, WIDTH, HEIGHT / 3);
    vignette.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.8, 0.8);
    vignette.fillRect(0, HEIGHT * 2 / 3, WIDTH, HEIGHT / 3);

    // イラストレイヤー（上部3/5）
    this._illustLayer = this.add.container(0, 0);

    // 区切り線（イラストとテキストの境界）
    const divider = this.add.graphics();
    divider.lineStyle(1, 0x8b6914, 0.4);
    divider.lineBetween(100, HEIGHT * 0.62, WIDTH - 100, HEIGHT * 0.62);

    // テキストエリア（下部）
    this._textObj = this.add.text(WIDTH / 2, HEIGHT * 0.78, '', {
      fontFamily: FONTS.DEFAULT,
      fontSize: 26,
      color: '#f0d090',
      align: 'center',
      lineSpacing: 14,
      wordWrap: { width: 800 },
      shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 4, fill: true },
    }).setOrigin(0.5).setAlpha(0);

    // ヒント
    this.add.text(WIDTH / 2, HEIGHT - 28, 'クリック または スペースキーで次へ', {
      fontFamily: FONTS.DEFAULT,
      fontSize: 13,
      color: '#6b4f2a',
    }).setOrigin(0.5);

    // 入力
    this.input.on('pointerdown', () => this._nextLine());
    this.input.keyboard?.on('keydown-SPACE', () => this._nextLine());
    this.input.keyboard?.on('keydown-ENTER', () => this._nextLine());

    this._showLine();
  }

  private _showLine(): void {
    if (this._currentLine >= OPENING_LINES.length) {
      this.scene.start('WorldMapScene');
      return;
    }

    this._isAnimating = true;
    const { text, illust } = OPENING_LINES[this._currentLine];

    this.tweens.add({
      targets: this._textObj,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        this._drawIllust(illust);
        this._textObj.setText(text);
        this.tweens.add({
          targets: this._textObj,
          alpha: 1,
          duration: 600,
          onComplete: () => { this._isAnimating = false; },
        });
      },
    });
  }

  private _nextLine(): void {
    if (this._isAnimating) return;
    this._currentLine++;
    this._showLine();
  }

  private _drawIllust(type: IllustType): void {
    const { WIDTH, HEIGHT } = GAME_CONFIG;
    const canvasH = HEIGHT * 0.58;
    const cx = WIDTH / 2;
    const cy = canvasH / 2;

    // 前のイラストをフェードアウトしてから描画
    this.tweens.add({
      targets: this._illustLayer,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        this._illustLayer.removeAll(true);
        const g = this.add.graphics();
        this._illustLayer.add(g);

        switch (type) {
          case 'peaceful':   this._drawPeaceful(g, cx, cy, WIDTH, canvasH); break;
          case 'people':     this._drawPeople(g, cx, cy, WIDTH, canvasH); break;
          case 'dramatic':   this._drawDramatic(g, cx, cy, WIDTH, canvasH); break;
          case 'darkLord':   this._drawDarkLord(g, cx, cy, WIDTH, canvasH); break;
          case 'shatter':    this._drawShatter(g, cx, cy, WIDTH, canvasH); break;
          case 'suffering':  this._drawSuffering(g, cx, cy, WIDTH, canvasH); break;
          case 'dawn':       this._drawDawn(g, cx, cy, WIDTH, canvasH); break;
          case 'hero':       this._drawHero(g, cx, cy, WIDTH, canvasH); break;
          case 'battle':     this._drawBattle(g, cx, cy, WIDTH, canvasH); break;
        }

        this.tweens.add({ targets: this._illustLayer, alpha: 1, duration: 500 });
      },
    });
  }

  // ── 各イラスト描画関数 ──────────────────────────────────────

  private _drawPeaceful(g: Phaser.GameObjects.Graphics, cx: number, _cy: number, w: number, h: number): void {
    // 空（青みがかった金色）
    g.fillGradientStyle(0x4a6fa5, 0x4a6fa5, 0x8b5e3c, 0x8b5e3c, 1);
    g.fillRect(0, 0, w, h * 0.65);

    // 太陽
    g.fillStyle(0xf7c948, 0.9);
    g.fillCircle(cx, h * 0.22, 55);
    g.lineStyle(2, 0xf7c948, 0.3);
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      g.lineBetween(
        cx + Math.cos(angle) * 65, h * 0.22 + Math.sin(angle) * 65,
        cx + Math.cos(angle) * 90, h * 0.22 + Math.sin(angle) * 90
      );
    }

    // 大地
    g.fillStyle(0x4a7c3f, 1);
    g.fillRect(0, h * 0.62, w, h * 0.38);

    // 丘
    g.fillStyle(0x5d9e52, 1);
    g.fillEllipse(cx - 250, h * 0.65, 500, 160);
    g.fillEllipse(cx + 200, h * 0.67, 420, 130);

    // 木のシルエット
    this._drawTree(g, cx - 120, h * 0.55, 0.9);
    this._drawTree(g, cx + 100, h * 0.56, 0.8);
    this._drawTree(g, cx - 280, h * 0.60, 0.6);
  }

  private _drawPeople(g: Phaser.GameObjects.Graphics, cx: number, _cy: number, w: number, h: number): void {
    // 空
    g.fillGradientStyle(0x4a6fa5, 0x4a6fa5, 0x8b7355, 0x8b7355, 1);
    g.fillRect(0, 0, w, h * 0.65);

    // 大地
    g.fillStyle(0x4a7c3f, 1);
    g.fillRect(0, h * 0.62, w, h * 0.38);

    // 村（家のシルエット）
    this._drawHouse(g, cx - 180, h * 0.55);
    this._drawHouse(g, cx, h * 0.52);
    this._drawHouse(g, cx + 170, h * 0.56);

    // 人物シルエット（小さい人々）
    for (let i = 0; i < 5; i++) {
      this._drawPerson(g, cx - 200 + i * 90, h * 0.65, 0.7);
    }
  }

  private _drawDramatic(g: Phaser.GameObjects.Graphics, cx: number, _cy: number, w: number, h: number): void {
    // 暗い空
    g.fillStyle(0x0a0a0a, 1);
    g.fillRect(0, 0, w, h);

    // 雷のような光
    g.lineStyle(4, 0xffdd44, 0.9);
    const lx = cx;
    g.lineBetween(lx, 0, lx - 30, h * 0.35);
    g.lineBetween(lx - 30, h * 0.35, lx + 20, h * 0.5);
    g.lineBetween(lx + 20, h * 0.5, lx - 10, h * 0.75);

    // 光の広がり
    g.fillStyle(0xffdd44, 0.08);
    g.fillCircle(cx, h * 0.4, 200);
    g.fillStyle(0xffdd44, 0.04);
    g.fillCircle(cx, h * 0.4, 350);

    // 「しかし――」用の亀裂
    g.lineStyle(2, 0xdd3333, 0.6);
    g.lineBetween(cx - 300, h * 0.5, cx + 300, h * 0.5);
  }

  private _drawDarkLord(g: Phaser.GameObjects.Graphics, cx: number, _cy: number, w: number, h: number): void {
    // 赤みがかった暗い空
    g.fillGradientStyle(0x1a0000, 0x1a0000, 0x3d0a0a, 0x3d0a0a, 1);
    g.fillRect(0, 0, w, h);

    // 赤い月
    g.fillStyle(0xcc2200, 0.8);
    g.fillCircle(cx, h * 0.2, 60);
    g.fillStyle(0xff4400, 0.2);
    g.fillCircle(cx, h * 0.2, 90);

    // 魔王シルエット（大きなローブ姿）
    const bx = cx;
    const by = h * 0.75;
    // ローブ
    g.fillStyle(0x111111, 1);
    g.fillTriangle(bx - 70, by, bx + 70, by, bx, by - 220);
    // マント（広がり）
    g.fillTriangle(bx - 100, by + 10, bx + 100, by + 10, bx, by - 180);
    // 頭
    g.fillCircle(bx, by - 230, 28);
    // 角
    g.fillTriangle(bx - 28, by - 245, bx - 15, by - 245, bx - 22, by - 285);
    g.fillTriangle(bx + 15, by - 245, bx + 28, by - 245, bx + 22, by - 285);
    // 目（赤く光る）
    g.fillStyle(0xff0000, 1);
    g.fillCircle(bx - 10, by - 232, 5);
    g.fillCircle(bx + 10, by - 232, 5);

    // 地面
    g.fillStyle(0x0d0000, 1);
    g.fillRect(0, h * 0.78, w, h * 0.22);
  }

  private _drawShatter(g: Phaser.GameObjects.Graphics, cx: number, cy: number, w: number, h: number): void {
    // 暗い背景
    g.fillStyle(0x050510, 1);
    g.fillRect(0, 0, w, h);

    // 割れた世界（9つの破片）
    const colors = [0x4a6fa5, 0x4a7c3f, 0x8b5e3c, 0x6a4fa5, 0x7c4a4a, 0x4a7c7c, 0xa5824a, 0x5a4a7c, 0x7c5a4a];
    const offsets = [
      [-180, -120], [0, -140], [180, -120],
      [-200, 0],    [0, 0],    [200, 0],
      [-180, 120],  [0, 140],  [180, 120],
    ];
    colors.forEach((color, i) => {
      const [ox, oy] = offsets[i];
      g.fillStyle(color, 0.7);
      g.fillRect(cx + ox - 55, cy + oy - 55, 90, 90);
      g.lineStyle(2, 0xffffff, 0.3);
      g.strokeRect(cx + ox - 55, cy + oy - 55, 90, 90);
    });

    // 亀裂（放射状）
    g.lineStyle(2, 0xffffff, 0.4);
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      g.lineBetween(cx, cy, cx + Math.cos(angle) * 280, cy + Math.sin(angle) * 250);
    }
  }

  private _drawSuffering(g: Phaser.GameObjects.Graphics, cx: number, _cy: number, w: number, h: number): void {
    // 暗い空
    g.fillStyle(0x0d0d1a, 1);
    g.fillRect(0, 0, w, h);

    // 荒廃した地面
    g.fillStyle(0x2a1f1a, 1);
    g.fillRect(0, h * 0.65, w, h * 0.35);

    // うなだれた人々
    for (let i = 0; i < 4; i++) {
      this._drawPerson(g, cx - 200 + i * 130, h * 0.65, 0.8, true);
    }

    // 壊れた家
    g.fillStyle(0x3d2b1a, 1);
    g.fillRect(cx - 100, h * 0.45, 80, 80);
    g.fillTriangle(cx - 115, h * 0.45, cx - 20, h * 0.45, cx - 68, h * 0.27);
    // 煙
    g.lineStyle(2, 0x555555, 0.5);
    g.lineBetween(cx - 68, h * 0.27, cx - 60, h * 0.15);
    g.lineBetween(cx - 80, h * 0.25, cx - 90, h * 0.12);
  }

  private _drawDawn(g: Phaser.GameObjects.Graphics, cx: number, _cy: number, w: number, h: number): void {
    // 夜明けの空
    g.fillGradientStyle(0x0a0a2a, 0x0a0a2a, 0x8b3a0a, 0x8b3a0a, 1);
    g.fillRect(0, 0, w, h * 0.7);

    // 地平線の光
    g.fillGradientStyle(0xff8c00, 0xff8c00, 0x8b3a0a, 0x8b3a0a, 0.8, 0.8, 0, 0);
    g.fillRect(0, h * 0.55, w, h * 0.15);

    // 太陽が昇り始める
    g.fillStyle(0xffcc00, 0.9);
    g.fillCircle(cx, h * 0.67, 40);
    g.fillStyle(0xffcc00, 0.2);
    g.fillCircle(cx, h * 0.67, 80);

    // 地面
    g.fillStyle(0x1a1a1a, 1);
    g.fillRect(0, h * 0.68, w, h * 0.32);

    // 山のシルエット
    g.fillStyle(0x111111, 1);
    g.fillTriangle(cx - 350, h * 0.68, cx - 100, h * 0.68, cx - 230, h * 0.28);
    g.fillTriangle(cx + 50, h * 0.68, cx + 380, h * 0.68, cx + 200, h * 0.32);
  }

  private _drawHero(g: Phaser.GameObjects.Graphics, cx: number, _cy: number, w: number, h: number): void {
    // 夜明けの空（継続）
    g.fillGradientStyle(0x1a2a4a, 0x1a2a4a, 0xc0640a, 0xc0640a, 1);
    g.fillRect(0, 0, w, h * 0.7);

    // 光の後光
    g.fillStyle(0xffcc00, 0.15);
    g.fillCircle(cx, h * 0.5, 180);

    // 地面
    g.fillStyle(0x2a1f1a, 1);
    g.fillRect(0, h * 0.7, w, h * 0.3);

    // 勇者シルエット（剣を持つ）
    const hx = cx;
    const hy = h * 0.75;
    g.fillStyle(0x111111, 1);
    // 体
    g.fillRect(hx - 16, hy - 100, 32, 60);
    // 頭
    g.fillCircle(hx, hy - 118, 22);
    // 足
    g.fillRect(hx - 18, hy - 40, 16, 45);
    g.fillRect(hx + 2, hy - 40, 16, 45);
    // 腕（剣を掲げる）
    g.fillRect(hx - 40, hy - 110, 14, 50);
    g.fillRect(hx + 26, hy - 130, 14, 60);
    // 剣
    g.lineStyle(3, 0xdddddd, 1);
    g.lineBetween(hx + 33, hy - 130, hx + 33, hy - 200);
    g.lineStyle(2, 0xdddddd, 0.8);
    g.lineBetween(hx + 20, hy - 150, hx + 46, hy - 150);
    // マント
    g.fillTriangle(hx - 20, hy - 100, hx + 20, hy - 100, hx - 50, hy - 30);
  }

  private _drawBattle(g: Phaser.GameObjects.Graphics, cx: number, _cy: number, w: number, h: number): void {
    // 劇的な空
    g.fillGradientStyle(0x1a0000, 0x1a0000, 0x300d00, 0x300d00, 1);
    g.fillRect(0, 0, w, h);

    // 魔王城のシルエット
    const castleX = cx + 150;
    const castleY = h * 0.65;
    g.fillStyle(0x0a0a0a, 1);
    // メインタワー
    g.fillRect(castleX - 40, castleY - 180, 80, 180);
    g.fillTriangle(castleX - 50, castleY - 180, castleX + 50, castleY - 180, castleX, castleY - 250);
    // 小タワー
    g.fillRect(castleX - 80, castleY - 120, 40, 120);
    g.fillTriangle(castleX - 90, castleY - 120, castleX - 30, castleY - 120, castleX - 60, castleY - 175);
    g.fillRect(castleX + 40, castleY - 110, 40, 110);
    g.fillTriangle(castleX + 30, castleY - 110, castleX + 90, castleY - 110, castleX + 60, castleY - 165);
    // 城壁
    g.fillRect(castleX - 200, castleY - 50, 400, 50);
    // 城の窓（赤く光る）
    g.fillStyle(0xff2200, 0.8);
    g.fillRect(castleX - 12, castleY - 160, 24, 30);

    // 勇者シルエット（城に向かう）
    const hx = cx - 200;
    const hy = h * 0.68;
    g.fillStyle(0x222222, 1);
    g.fillRect(hx - 10, hy - 65, 20, 40);
    g.fillCircle(hx, hy - 75, 16);
    g.fillRect(hx - 12, hy - 25, 10, 30);
    g.fillRect(hx + 2, hy - 25, 10, 30);
    g.lineStyle(2, 0xdddddd, 1);
    g.lineBetween(hx + 15, hy - 70, hx + 15, hy - 120);

    // 地面
    g.fillStyle(0x111111, 1);
    g.fillRect(0, h * 0.68, w, h * 0.32);
  }

  // ── ヘルパー描画 ────────────────────────────────────────────

  private _drawTree(g: Phaser.GameObjects.Graphics, x: number, y: number, scale: number): void {
    g.fillStyle(0x2d5a1b, 1);
    g.fillTriangle(x, y - 80 * scale, x - 35 * scale, y, x + 35 * scale, y);
    g.fillTriangle(x, y - 110 * scale, x - 25 * scale, y - 40 * scale, x + 25 * scale, y - 40 * scale);
    g.fillStyle(0x5c3d1e, 1);
    g.fillRect(x - 7 * scale, y, 14 * scale, 25 * scale);
  }

  private _drawHouse(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
    g.fillStyle(0x6b4c2a, 1);
    g.fillRect(x - 45, y - 50, 90, 55);
    g.fillStyle(0x8b3a1a, 1);
    g.fillTriangle(x - 55, y - 50, x + 55, y - 50, x, y - 100);
    g.fillStyle(0x4a7c3f, 0.6);
    g.fillRect(x - 12, y - 30, 24, 35);
  }

  private _drawPerson(
    g: Phaser.GameObjects.Graphics, x: number, y: number, scale: number, bowed = false
  ): void {
    g.fillStyle(0x222222, 1);
    g.fillCircle(x, y - 40 * scale, 12 * scale);
    if (bowed) {
      g.fillRect(x - 8 * scale, y - 28 * scale, 16 * scale, 25 * scale);
      g.lineBetween(x, y - 10 * scale, x - 15 * scale, y + 15 * scale);
    } else {
      g.fillRect(x - 8 * scale, y - 28 * scale, 16 * scale, 30 * scale);
      g.fillRect(x - 10 * scale, y + 2 * scale, 8 * scale, 22 * scale);
      g.fillRect(x + 2 * scale, y + 2 * scale, 8 * scale, 22 * scale);
    }
  }
}
