import Phaser from 'phaser';
import { FONTS, GAME_CONFIG } from '../config';
import { REALMS } from '../data/realms';

// 大陸の輪郭ポリント（0〜1の比率、マップエリア内）
const CONTINENT_POINTS = [
  0.18, 0.82,  // 左下
  0.10, 0.68,  // 左
  0.08, 0.52,  // 左上
  0.12, 0.38,  // 左上内
  0.18, 0.25,  // 左上
  0.28, 0.15,  // 上左
  0.40, 0.10,  // 上中
  0.52, 0.13,  // 上右
  0.62, 0.10,  // 上右2
  0.72, 0.16,  // 右上
  0.82, 0.22,  // 右上
  0.90, 0.35,  // 右
  0.92, 0.50,  // 右中
  0.88, 0.65,  // 右下
  0.80, 0.78,  // 右下2
  0.68, 0.85,  // 下右
  0.55, 0.88,  // 下中右
  0.42, 0.87,  // 下中
  0.30, 0.90,  // 下左
  0.20, 0.87,  // 下左2
];

export class WorldMapScene extends Phaser.Scene {
  private _clearedRealms: number[] = [];
  private _currentRealm = 1;
  private _gold = 0;
  private _infoText!: Phaser.GameObjects.Text;
  private _mapX = 20;
  private _mapY = 58;
  private _mapW = 0;
  private _mapH = 0;

  constructor() {
    super({ key: 'WorldMapScene' });
  }

  init(data: { clearedRealms?: number[]; currentRealm?: number; gold?: number }): void {
    this._clearedRealms = data.clearedRealms ?? JSON.parse(localStorage.getItem('nine-realms-cleared') ?? '[]');
    this._currentRealm = data.currentRealm ?? Number(localStorage.getItem('nine-realms-current') ?? '1');
    this._gold = data.gold ?? Number(localStorage.getItem('nine-realms-gold') ?? '0');
  }

  create(): void {
    const { WIDTH, HEIGHT } = GAME_CONFIG;
    this._mapW = WIDTH - this._mapX * 2;
    this._mapH = HEIGHT - this._mapY - 80;

    // ── 海（背景）
    this._drawOcean();

    // ── 大陸
    this._drawContinent();

    // ── 地形テクスチャ
    this._drawTerrain();

    // ── 道
    this._drawPaths();

    // ── Realmノード
    REALMS.forEach(realm => this._drawRealmNode(realm));

    // ── UI
    this._drawUI();
  }

  // ─────────────────────────────────────────────────────────────

  private _toMapXY(rx: number, ry: number): { x: number; y: number } {
    return {
      x: this._mapX + rx * this._mapW,
      y: this._mapY + ry * this._mapH,
    };
  }

  private _drawOcean(): void {
    const { WIDTH, HEIGHT } = GAME_CONFIG;
    const g = this.add.graphics();

    // 海の基本色
    g.fillGradientStyle(0x1a4a7a, 0x1a4a7a, 0x0d2d50, 0x0d2d50, 1);
    g.fillRect(0, 0, WIDTH, HEIGHT);

    // 波のパターン（横線）
    g.lineStyle(1, 0x2a6aaa, 0.25);
    for (let y = this._mapY; y < this._mapY + this._mapH; y += 14) {
      for (let x = this._mapX; x < this._mapX + this._mapW; x += 28) {
        g.lineBetween(x, y, x + 12, y);
      }
    }
  }

  private _drawContinent(): void {
    const g = this.add.graphics();

    // 大陸の影（わずかにずらした暗い層）
    g.fillStyle(0x0a1a0a, 0.5);
    const shadowPoints = CONTINENT_POINTS.map((v, i) => {
      if (i % 2 === 0) return this._mapX + v * this._mapW + 6;
      return this._mapY + v * this._mapH + 6;
    });
    g.fillPoints(this._buildPoints(shadowPoints), true);

    // 大陸本体（草原ベース）
    g.fillStyle(0x3d7a3d, 1);
    g.fillPoints(this._buildContinentPoints(), true);

    // 9つに引き裂かれた痕跡（裏設定）
    // 魔王ナインが世界を分断した断層線。薄く・細く・知る人ぞ知る
    this._drawRiftLines(g);

    // 海岸線
    g.lineStyle(2, 0x8ab88a, 0.7);
    g.strokePoints(this._buildContinentPoints(), true);
  }

  private _buildContinentPoints(): Phaser.Geom.Point[] {
    const pts: Phaser.Geom.Point[] = [];
    for (let i = 0; i < CONTINENT_POINTS.length; i += 2) {
      const { x, y } = this._toMapXY(CONTINENT_POINTS[i], CONTINENT_POINTS[i + 1]);
      pts.push(new Phaser.Geom.Point(x, y));
    }
    return pts;
  }

  private _buildPoints(flatArr: number[]): Phaser.Geom.Point[] {
    const pts: Phaser.Geom.Point[] = [];
    for (let i = 0; i < flatArr.length; i += 2) {
      pts.push(new Phaser.Geom.Point(flatArr[i], flatArr[i + 1]));
    }
    return pts;
  }

  private _drawTerrain(): void {
    const g = this.add.graphics();

    // 草原エリア（Realm1）
    this._drawSmallTrees(g, 0.18, 0.73, 5);
    this._drawSmallTrees(g, 0.26, 0.66, 4);

    // 森エリア（Realm2）
    g.fillStyle(0x1e5e1e, 0.85);
    g.fillEllipse(...this._ellipseArgs(0.33, 0.52, 0.18, 0.16));
    this._drawSmallTrees(g, 0.33, 0.52, 8);
    this._drawSmallTrees(g, 0.26, 0.48, 5);
    this._drawSmallTrees(g, 0.40, 0.55, 5);

    // 砂漠エリア（Realm3）
    g.fillStyle(0xc8a84b, 0.9);
    g.fillEllipse(...this._ellipseArgs(0.52, 0.66, 0.20, 0.18));
    this._drawDunes(g, 0.50, 0.68);

    // 雪山エリア（Realm4）
    g.fillStyle(0xddeeff, 0.85);
    g.fillEllipse(...this._ellipseArgs(0.70, 0.50, 0.18, 0.16));
    this._drawMountains(g, 0.68, 0.50, 0xffffff);
    this._drawMountains(g, 0.74, 0.46, 0xeef4ff);

    // 海の王国（Realm5）- 大陸右端の港町風
    g.fillStyle(0x2a6aaa, 0.5);
    g.fillEllipse(...this._ellipseArgs(0.83, 0.60, 0.14, 0.18));
    g.fillStyle(0x3d7a3d, 0.85);
    g.fillEllipse(...this._ellipseArgs(0.82, 0.62, 0.09, 0.10));

    // 火山エリア（Realm6）
    g.fillStyle(0x5a1a0a, 0.85);
    g.fillEllipse(...this._ellipseArgs(0.76, 0.32, 0.16, 0.14));
    this._drawVolcano(g, 0.76, 0.32);

    // 闇の森（Realm7）
    g.fillStyle(0x1a0a2a, 0.88);
    g.fillEllipse(...this._ellipseArgs(0.55, 0.22, 0.16, 0.14));
    this._drawDeadTrees(g, 0.53, 0.23);
    this._drawDeadTrees(g, 0.58, 0.19);

    // 魔王城エリア（Realm9）- 左側の暗い山岳地帯
    g.fillStyle(0x2a0a0a, 0.9);
    g.fillEllipse(...this._ellipseArgs(0.16, 0.38, 0.14, 0.16));
    this._drawMountains(g, 0.15, 0.38, 0x440000);

    // 天空の王国（Realm8）- 空に浮かぶ島（大陸の上方、別世界感）
    this._drawSkyIsland(g);
  }

  private _drawRiftLines(g: Phaser.GameObjects.Graphics): void {
    // 魔王ナインが世界を9つのRealmに引き裂いた痕跡。
    // 各Realmの境界を走る断層線。薄く描くことで「気づく人だけ気づく」裏設定になる。
    // 亀裂は不規則にジグザグし、紫がかった暗い輝きを帯びている。

    const rifts: Array<[number, number][]> = [
      // Realm1 と Realm2 の境界（草原〜森）
      [[0.18, 0.58], [0.22, 0.64], [0.20, 0.70], [0.24, 0.76]],
      // Realm2 と Realm3 の境界（森〜砂漠）
      [[0.38, 0.44], [0.42, 0.52], [0.40, 0.60], [0.44, 0.68]],
      // Realm3 と Realm4 の境界（砂漠〜雪山）
      [[0.60, 0.46], [0.62, 0.54], [0.64, 0.62], [0.62, 0.70]],
      // Realm4 と Realm5 の境界（雪山〜海の王国）
      [[0.74, 0.44], [0.76, 0.52], [0.78, 0.58]],
      // Realm5 と Realm6 の境界（海〜火山）
      [[0.80, 0.40], [0.78, 0.46], [0.80, 0.52]],
      // Realm6 と Realm7 の境界（火山〜闇の森）
      [[0.62, 0.22], [0.66, 0.28], [0.68, 0.34]],
      // Realm7 と Realm8 の境界（闇の森〜天空）
      [[0.42, 0.18], [0.46, 0.22], [0.44, 0.28]],
      // Realm8 と Realm9 の境界（天空〜魔王城）
      [[0.18, 0.26], [0.20, 0.32], [0.18, 0.38]],
    ];

    rifts.forEach(points => {
      // 亀裂の外縁（暗い紫）
      g.lineStyle(3, 0x220033, 0.22);
      g.beginPath();
      const first = this._toMapXY(points[0][0], points[0][1]);
      g.moveTo(first.x, first.y);
      points.slice(1).forEach(([rx, ry]) => {
        const { x, y } = this._toMapXY(rx, ry);
        g.lineTo(x, y);
      });
      g.strokePath();

      // 亀裂の中心（薄い紫の光）
      g.lineStyle(1, 0x9933cc, 0.18);
      g.beginPath();
      g.moveTo(first.x, first.y);
      points.slice(1).forEach(([rx, ry]) => {
        const { x, y } = this._toMapXY(rx, ry);
        g.lineTo(x, y);
      });
      g.strokePath();
    });
  }

  private _drawSkyIsland(g: Phaser.GameObjects.Graphics): void {
    const { x, y } = this._toMapXY(0.32, 0.08);
    const W = this._mapW;

    // 背景の空（薄い青いグラデーション帯）
    g.fillStyle(0x99bbff, 0.18);
    g.fillRect(this._mapX, this._mapY, W, this._mapH * 0.15);

    // 流れる雲（背景）
    const cloudColor = 0xddeeff;
    [[x - 90, y + 10], [x + 70, y + 5], [x - 30, y - 8], [x + 120, y + 18], [x - 150, y + 20]].forEach(([cx, cy]) => {
      g.fillStyle(cloudColor, 0.45);
      g.fillEllipse(cx, cy, 80, 28);
      g.fillEllipse(cx + 22, cy - 10, 60, 24);
      g.fillEllipse(cx - 20, cy - 6, 50, 20);
    });

    // 浮島本体（岩の底面）
    g.fillStyle(0x7a6a4a, 1);
    g.fillEllipse(x, y + 28, 110, 28);
    // 草の層
    g.fillStyle(0x7acc55, 1);
    g.fillEllipse(x, y + 12, 100, 26);
    // 光る粒子（星）
    g.fillStyle(0xffffaa, 0.9);
    [[-30, -10], [20, -15], [-10, -20], [35, -5], [-40, -18]].forEach(([ox, oy]) => {
      g.fillCircle(x + ox, y + oy, 2.5);
    });

    // 虹の橋（大陸上部から天空島へ）
    const bridgeStartX = this._mapX + 0.32 * this._mapW;
    const bridgeStartY = this._mapY + 0.18 * this._mapH;
    const rainbowColors = [0xff6666, 0xffaa44, 0xffee44, 0x88ee44, 0x44aaff, 0x8844ff];
    rainbowColors.forEach((col, i) => {
      g.lineStyle(2, col, 0.35);
      g.beginPath();
      g.moveTo(bridgeStartX - 20, bridgeStartY);
      g.lineTo(x - 20 + i * 2, y + 30);
      g.strokePath();
    });
  }

  private _ellipseArgs(rx: number, ry: number, rw: number, rh: number): [number, number, number, number] {
    const { x, y } = this._toMapXY(rx, ry);
    return [x, y, rw * this._mapW, rh * this._mapH];
  }

  private _drawSmallTrees(g: Phaser.GameObjects.Graphics, rx: number, ry: number, count: number): void {
    const { x, y } = this._toMapXY(rx, ry);
    for (let i = 0; i < count; i++) {
      const tx = x + (Math.random() - 0.5) * 80;
      const ty = y + (Math.random() - 0.5) * 60;
      const s = 6 + Math.random() * 4;
      g.fillStyle(0x2d6e2d, 1);
      g.fillTriangle(tx, ty - s * 2, tx - s, ty, tx + s, ty);
      g.fillStyle(0x5c3d1e, 1);
      g.fillRect(tx - 2, ty, 4, s);
    }
  }

  private _drawMountains(g: Phaser.GameObjects.Graphics, rx: number, ry: number, snowColor: number): void {
    const { x, y } = this._toMapXY(rx, ry);
    const positions = [[-25, 10], [0, -5], [25, 8], [-12, 20], [18, 18]];
    positions.forEach(([ox, oy]) => {
      const h = 28 + Math.random() * 14;
      const w = 20 + Math.random() * 10;
      g.fillStyle(0x6b6b6b, 1);
      g.fillTriangle(x + ox, y + oy, x + ox - w, y + oy + h, x + ox + w, y + oy + h);
      g.fillStyle(snowColor, 0.9);
      g.fillTriangle(x + ox, y + oy, x + ox - w * 0.4, y + oy + h * 0.4, x + ox + w * 0.4, y + oy + h * 0.4);
    });
  }

  private _drawDunes(g: Phaser.GameObjects.Graphics, rx: number, ry: number): void {
    const { x, y } = this._toMapXY(rx, ry);
    g.lineStyle(1, 0xa07830, 0.5);
    for (let i = 0; i < 4; i++) {
      const ox = (i - 2) * 22;
      g.beginPath();
      g.moveTo(x + ox - 20, y + i * 8);
      g.lineTo(x + ox, y + i * 8 - 8);
      g.lineTo(x + ox + 20, y + i * 8);
      g.strokePath();
    }
  }

  private _drawVolcano(g: Phaser.GameObjects.Graphics, rx: number, ry: number): void {
    const { x, y } = this._toMapXY(rx, ry);
    // 火山本体
    g.fillStyle(0x4a1a0a, 1);
    g.fillTriangle(x, y - 40, x - 45, y + 20, x + 45, y + 20);
    // マグマ
    g.fillStyle(0xff4400, 0.8);
    g.fillCircle(x, y - 35, 10);
    g.fillStyle(0xff8800, 0.6);
    g.fillCircle(x - 5, y - 32, 6);
    g.fillCircle(x + 6, y - 33, 5);
    // 煙
    g.fillStyle(0x888888, 0.4);
    g.fillCircle(x, y - 55, 12);
    g.fillCircle(x - 8, y - 65, 9);
    g.fillCircle(x + 6, y - 68, 8);
  }

  private _drawDeadTrees(g: Phaser.GameObjects.Graphics, rx: number, ry: number): void {
    const { x, y } = this._toMapXY(rx, ry);
    const positions = [[-15, 0], [10, -5], [-5, 10], [20, 5]];
    positions.forEach(([ox, oy]) => {
      g.lineStyle(2, 0x3a2a4a, 1);
      g.lineBetween(x + ox, y + oy, x + ox, y + oy - 25);
      g.lineBetween(x + ox, y + oy - 15, x + ox - 10, y + oy - 22);
      g.lineBetween(x + ox, y + oy - 18, x + ox + 8, y + oy - 24);
    });
  }

  private _drawPaths(): void {
    const g = this.add.graphics();
    for (let i = 0; i < REALMS.length - 1; i++) {
      const a = REALMS[i];
      const b = REALMS[i + 1];
      const { x: ax, y: ay } = this._toMapXY(a.x, a.y);
      const { x: bx, y: by } = this._toMapXY(b.x, b.y);
      const cleared = this._clearedRealms.includes(a.id);
      // 破線風の道
      g.lineStyle(2, cleared ? 0xd4b86a : 0x6a5a3a, cleared ? 0.9 : 0.5);
      const steps = 8;
      for (let s = 0; s < steps; s += 2) {
        const t0 = s / steps;
        const t1 = (s + 1) / steps;
        g.lineBetween(
          ax + (bx - ax) * t0, ay + (by - ay) * t0,
          ax + (bx - ax) * t1, ay + (by - ay) * t1
        );
      }
    }
  }

  private _drawRealmNode(realm: typeof REALMS[0]): void {
    const { x, y } = this._toMapXY(realm.x, realm.y);
    const isCleared = this._clearedRealms.includes(realm.id);
    const isCurrent = realm.id === this._currentRealm;
    const isLocked = realm.id > this._currentRealm;

    const container = this.add.container(x, y);

    // 城・砦アイコン（Phaserグラフィクスで描画）
    const icon = this.add.graphics();
    this._drawCastleIcon(icon, realm.id, isCleared, isCurrent, isLocked);
    container.add(icon);

    // 現在地フラグ
    if (isCurrent) {
      const flag = this.add.graphics();
      flag.lineStyle(2, 0xf4d03f, 1);
      flag.lineBetween(0, -28, 0, -46);
      flag.fillStyle(0xf4d03f, 1);
      flag.fillTriangle(0, -46, 14, -40, 0, -34);
      container.add(flag);
      this.tweens.add({
        targets: container,
        y: y - 3,
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // ラベル（背景付き）
    const label = this.add.text(0, 22, realm.name, {
      fontFamily: FONTS.DEFAULT,
      fontSize: 11,
      color: isLocked ? '#555566' : '#f0e8c8',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
    container.add(label);

    // クリック判定
    if (!isLocked) {
      icon.setInteractive(
        new Phaser.Geom.Rectangle(-18, -28, 36, 32),
        Phaser.Geom.Rectangle.Contains
      );
      icon.on('pointerover', () => {
        this.input.setDefaultCursor('pointer');
        const stars = '★'.repeat(Math.min(realm.id, 5)) + '☆'.repeat(Math.max(0, 5 - realm.id));
        this._infoText.setText(
          `【${realm.name}】  ${realm.description}  ｜  難易度: ${stars}  ｜  ボス: ${realm.bossName}`
        );
        icon.setScale(1.15);
      });
      icon.on('pointerout', () => {
        this.input.setDefaultCursor('default');
        this._infoText.setText('Realmをクリックして詳細を確認');
        icon.setScale(1);
      });
      icon.on('pointerdown', () => {
        this._infoText.setText(`「${realm.name}」 に挑戦！（バトル実装中）`);
      });
    }
  }

  private _drawCastleIcon(
    g: Phaser.GameObjects.Graphics,
    realmId: number,
    isCleared: boolean,
    isCurrent: boolean,
    isLocked: boolean
  ): void {
    const baseColor = isLocked ? 0x444455 : isCleared ? 0xaabbcc : 0xddccaa;
    const roofColor = isLocked ? 0x333344 : realmId === 9 ? 0x880000 : isCleared ? 0x6688aa : 0x8b3a1a;
    const alpha = isLocked ? 0.5 : 1;

    g.lineStyle(0, 0, 0);

    // 城の壁
    g.fillStyle(baseColor, alpha);
    g.fillRect(-16, -12, 32, 20);

    // 城壁の凹凸（銃眼）
    g.fillStyle(baseColor, alpha);
    g.fillRect(-16, -22, 8, 12);
    g.fillRect(-4, -22, 8, 12);
    g.fillRect(8, -22, 8, 12);

    // 屋根
    g.fillStyle(roofColor, alpha);
    g.fillTriangle(-18, -22, 18, -22, 0, -38);

    // 門
    g.fillStyle(0x221100, alpha);
    g.fillRect(-7, -4, 14, 16);

    // 窓（明かり）
    if (!isLocked) {
      g.fillStyle(0xf7d060, 0.8);
      g.fillRect(-12, -18, 7, 7);
      g.fillRect(5, -18, 7, 7);
    }

    // クリア済みは金色のドーム
    if (isCleared) {
      g.fillStyle(0xf4d03f, 0.9);
      g.fillCircle(0, -38, 5);
    }

    // 現在地は輝くリング
    if (isCurrent) {
      g.lineStyle(2, 0xf4d03f, 1);
      g.strokeRect(-20, -42, 40, 50);
    }
  }

  private _drawUI(): void {
    const { WIDTH, HEIGHT } = GAME_CONFIG;

    // タイトルバー
    const titleBg = this.add.graphics();
    titleBg.fillStyle(0x0a0f1a, 0.88);
    titleBg.fillRect(0, 0, WIDTH, 56);
    titleBg.lineStyle(1, 0x3a5a3a, 0.7);
    titleBg.lineBetween(0, 56, WIDTH, 56);

    this.add.text(WIDTH / 2, 28, '～ NINE REALMS ～', {
      fontFamily: FONTS.DEFAULT,
      fontSize: 22,
      color: '#f4d03f',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // ゴールド
    this.add.text(WIDTH - 16, 28, `G : ${this._gold}`, {
      fontFamily: FONTS.DEFAULT,
      fontSize: 18,
      color: '#f4d03f',
      stroke: '#000',
      strokeThickness: 3,
    }).setOrigin(1, 0.5);

    // 情報パネル（下部）
    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x0a0f1a, 0.88);
    panelBg.fillRect(0, HEIGHT - 78, WIDTH, 78);
    panelBg.lineStyle(1, 0x3a5a3a, 0.7);
    panelBg.lineBetween(0, HEIGHT - 78, WIDTH, HEIGHT - 78);

    this._infoText = this.add.text(WIDTH / 2, HEIGHT - 48, 'Realmをクリックして詳細を確認', {
      fontFamily: FONTS.DEFAULT,
      fontSize: 16,
      color: '#c8d8b8',
      align: 'center',
    }).setOrigin(0.5);

    // ショップボタン
    const shopContainer = this.add.container(90, HEIGHT - 30);
    const shopBg = this.add.graphics();
    shopBg.fillStyle(0x8a6000, 1);
    shopBg.fillRoundedRect(-72, -20, 144, 40, 8);
    shopBg.lineStyle(1, 0xf4d03f, 0.7);
    shopBg.strokeRoundedRect(-72, -20, 144, 40, 8);
    const shopText = this.add.text(0, 0, '⚒ ショップ', {
      fontFamily: FONTS.DEFAULT,
      fontSize: 16,
      color: '#f4d03f',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    shopContainer.add([shopBg, shopText]);
    shopContainer.setInteractive(
      new Phaser.Geom.Rectangle(-72, -20, 144, 40),
      Phaser.Geom.Rectangle.Contains
    );
    shopContainer.on('pointerover', () => {
      this.input.setDefaultCursor('pointer');
      shopContainer.setScale(1.05);
    });
    shopContainer.on('pointerout', () => {
      this.input.setDefaultCursor('default');
      shopContainer.setScale(1);
    });
    shopContainer.on('pointerdown', () => {
      this._infoText.setText('ショップ（実装中）');
    });
  }
}
