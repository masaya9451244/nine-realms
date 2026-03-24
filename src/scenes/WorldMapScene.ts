import Phaser from 'phaser';
import { GAME_CONFIG } from '../config';
import { REALMS } from '../data/realms';
import type { GameState } from '../types/game';
import { SaveManager } from '../game/SaveManager';

// 大陸の輪郭ポイント（0〜1の比率）
const CONTINENT_POINTS = [
  0.22, 0.88,
  0.16, 0.83,
  0.11, 0.76,
  0.08, 0.68,
  0.12, 0.62,
  0.08, 0.55,
  0.10, 0.48,
  0.07, 0.42,
  0.13, 0.36,
  0.10, 0.30,
  0.15, 0.24,
  0.20, 0.20,
  0.26, 0.15,
  0.32, 0.18,
  0.36, 0.12,
  0.44, 0.10,
  0.48, 0.14,
  0.54, 0.11,
  0.60, 0.13,
  0.65, 0.09,
  0.70, 0.14,
  0.76, 0.12,
  0.82, 0.18,
  0.88, 0.24,
  0.91, 0.32,
  0.89, 0.38,
  0.93, 0.44,
  0.90, 0.50,
  0.92, 0.56,
  0.87, 0.62,
  0.90, 0.67,
  0.84, 0.72,
  0.78, 0.78,
  0.72, 0.82,
  0.65, 0.80,
  0.60, 0.86,
  0.52, 0.89,
  0.46, 0.87,
  0.40, 0.91,
  0.34, 0.89,
  0.28, 0.92,
];

export class WorldMapScene extends Phaser.Scene {
  private _clearedRealms: number[] = [];
  private _currentRealm = 1;
  private _gold = 0;
  private _infoText!: Phaser.GameObjects.Text;
  private _mapX = 28;
  private _mapY = 28;
  private _mapW = 0;
  private _mapH = 0;

  constructor() {
    super({ key: 'WorldMapScene' });
  }

  init(_data?: unknown): void {
    const state: GameState | undefined = this.game.registry.get('gameState');
    if (state) {
      this._clearedRealms = [...state.clearedRealms];
      this._currentRealm = state.currentRealmId;
      this._gold = state.gold;
    } else {
      this._clearedRealms = JSON.parse(localStorage.getItem('nine-realms-cleared') ?? '[]');
      this._currentRealm = Number(localStorage.getItem('nine-realms-current') ?? '1');
      this._gold = Number(localStorage.getItem('nine-realms-gold') ?? '0');
    }
  }

  create(): void {
    const { WIDTH, HEIGHT } = GAME_CONFIG;
    this._mapW = WIDTH - this._mapX * 2;
    this._mapH = HEIGHT - this._mapY * 2 - 72;

    this._drawParchmentBackground();
    this._drawOcean();
    this._drawContinent();
    this._drawTerrain();
    this._drawRiftLines();
    this._drawPaths();
    REALMS.forEach(r => this._drawRealmNode(r));
    this._drawMapFrame();
    this._drawUI();

    // マップ表示時に自動セーブ
    const state: GameState = this.game.registry.get('gameState');
    if (state) {
      SaveManager.save(state);
    }
  }

  private _toXY(rx: number, ry: number) {
    return {
      x: this._mapX + rx * this._mapW,
      y: this._mapY + ry * this._mapH,
    };
  }

  // ── 羊皮紙の背景 ────────────────────────────────────────────

  private _drawParchmentBackground(): void {
    const { WIDTH, HEIGHT } = GAME_CONFIG;
    const g = this.add.graphics();

    // 羊皮紙ベース色（明るめに）
    g.fillStyle(0xe2c88a, 1);
    g.fillRect(0, 0, WIDTH, HEIGHT);

    // ムラ感
    g.fillStyle(0xecd898, 0.4);
    g.fillRect(0, 0, WIDTH * 0.6, HEIGHT * 0.6);
    g.fillStyle(0xd0a858, 0.25);
    g.fillRect(WIDTH * 0.3, HEIGHT * 0.2, WIDTH * 0.7, HEIGHT * 0.8);
    g.fillStyle(0xf0e0a0, 0.2);
    g.fillRect(WIDTH * 0.1, HEIGHT * 0.4, WIDTH * 0.5, HEIGHT * 0.6);

    // 縦方向のにじみ（紙の繊維感）
    for (let x = 0; x < WIDTH; x += 6) {
      const alpha = Math.random() * 0.04;
      g.fillStyle(0x8a6030, alpha);
      g.fillRect(x, 0, 2, HEIGHT);
    }
  }

  // ── 海 ──────────────────────────────────────────────────────

  private _drawOcean(): void {
    const g = this.add.graphics();

    // 海: 羊皮紙に馴染む温かみのある青
    g.fillStyle(0x7aadcc, 0.55);
    g.fillRect(this._mapX, this._mapY, this._mapW, this._mapH);

    // 波模様（カーブ線）
    g.lineStyle(1, 0x5a8daa, 0.35);
    for (let y = this._mapY + 12; y < this._mapY + this._mapH; y += 16) {
      for (let x = this._mapX; x < this._mapX + this._mapW; x += 30) {
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x + 10, y - 4);
        g.lineTo(x + 20, y);
        g.strokePath();
      }
    }

    // 「OCEAN」的な薄いラベル
    this.add.text(this._mapX + this._mapW * 0.05, this._mapY + this._mapH * 0.85, 'THE GREAT SEA', {
      fontFamily: 'Georgia, serif',
      fontSize: 13,
      color: '#4a7a99',
      fontStyle: 'italic',
    }).setAlpha(0.45);
  }

  // ── 大陸 ────────────────────────────────────────────────────

  private _drawContinent(): void {
    const g = this.add.graphics();

    // 影
    g.fillStyle(0x5a3a1a, 0.35);
    const shadow = CONTINENT_POINTS.map((v, i) =>
      i % 2 === 0 ? this._mapX + v * this._mapW + 7 : this._mapY + v * this._mapH + 7
    );
    g.fillPoints(this._buildPoints(shadow), true);

    // 大陸ベース（鮮やかな緑）
    g.fillStyle(0x6abf4a, 1);
    g.fillPoints(this._buildContinentPoints(), true);

    // 大陸の内側グラデーション感（明るい中心）
    g.fillStyle(0x90dd60, 0.45);
    const inner = CONTINENT_POINTS.map((v, i) => {
      const center = i % 2 === 0 ? 0.5 : 0.5;
      return i % 2 === 0
        ? this._mapX + (v * 0.85 + center * 0.15) * this._mapW
        : this._mapY + (v * 0.85 + center * 0.15) * this._mapH;
    });
    g.fillPoints(this._buildPoints(inner), true);

    // 海岸線
    g.lineStyle(2, 0x5a7a3a, 0.8);
    g.strokePoints(this._buildContinentPoints(), true);
    // 外側の細い影線
    g.lineStyle(4, 0x3a2a10, 0.2);
    g.strokePoints(this._buildContinentPoints(), true);
  }

  private _buildContinentPoints(): Phaser.Geom.Point[] {
    const pts: Phaser.Geom.Point[] = [];
    for (let i = 0; i < CONTINENT_POINTS.length; i += 2) {
      const { x, y } = this._toXY(CONTINENT_POINTS[i], CONTINENT_POINTS[i + 1]);
      pts.push(new Phaser.Geom.Point(x, y));
    }
    return pts;
  }

  private _buildPoints(flat: number[]): Phaser.Geom.Point[] {
    const pts: Phaser.Geom.Point[] = [];
    for (let i = 0; i < flat.length; i += 2) {
      pts.push(new Phaser.Geom.Point(flat[i], flat[i + 1]));
    }
    return pts;
  }

  // ── 地形 ────────────────────────────────────────────────────

  private _drawTerrain(): void {
    const g = this.add.graphics();

    // 草原（Realm1）- 明るい黄緑
    g.fillStyle(0xaadd66, 0.8);
    g.fillEllipse(...this._ea(0.20, 0.72, 0.16, 0.14));
    this._drawTreeCluster(g, 0.17, 0.73, 6);
    this._drawTreeCluster(g, 0.24, 0.68, 5);

    // 森（Realm2）- 深い緑、不整形
    g.fillStyle(0x2a8a2a, 0.88);
    g.fillEllipse(...this._ea(0.30, 0.54, 0.15, 0.12));
    g.fillStyle(0x44bb44, 0.65);
    g.fillEllipse(...this._ea(0.36, 0.50, 0.10, 0.10));
    g.fillEllipse(...this._ea(0.26, 0.58, 0.09, 0.08));
    this._drawTreeCluster(g, 0.30, 0.52, 10);
    this._drawTreeCluster(g, 0.36, 0.48, 7);

    // 砂漠（Realm3）- 黄土色
    g.fillStyle(0xeecc44, 0.92);
    g.fillEllipse(...this._ea(0.52, 0.66, 0.18, 0.15));
    g.fillStyle(0xddaa20, 0.5);
    g.fillEllipse(...this._ea(0.55, 0.70, 0.10, 0.08));
    this._drawDunes(g, 0.50, 0.67);
    this._drawDunes(g, 0.56, 0.63);

    // 雪山（Realm4）- 白・水色
    g.fillStyle(0xddf4ff, 0.95);
    g.fillEllipse(...this._ea(0.70, 0.50, 0.17, 0.15));
    this._drawMountains(g, 0.67, 0.52, 0xffffff, 0xbbddff);
    this._drawMountains(g, 0.74, 0.47, 0xffffff, 0xeef8ff);

    // 海の王国（Realm5）- 港・半島
    g.fillStyle(0x33aadd, 0.65);
    g.fillEllipse(...this._ea(0.84, 0.60, 0.13, 0.17));
    g.fillStyle(0x44cc66, 0.9);
    g.fillEllipse(...this._ea(0.83, 0.62, 0.08, 0.09));

    // 火山（Realm6）- 黒赤
    g.fillStyle(0x771a0a, 0.9);
    g.fillEllipse(...this._ea(0.76, 0.32, 0.14, 0.13));
    this._drawVolcano(g, 0.76, 0.32);

    // 闇の森（Realm7）- 紫黒
    g.fillStyle(0x2a0a44, 0.9);
    g.fillEllipse(...this._ea(0.55, 0.22, 0.15, 0.13));
    g.fillStyle(0x4a1a66, 0.6);
    g.fillEllipse(...this._ea(0.50, 0.19, 0.08, 0.07));
    this._drawDeadTrees(g, 0.53, 0.22);
    this._drawDeadTrees(g, 0.58, 0.19);

    // 魔王城エリア（Realm9）- 焦土・山岳
    g.fillStyle(0x440808, 0.92);
    g.fillEllipse(...this._ea(0.16, 0.38, 0.13, 0.15));
    this._drawMountains(g, 0.14, 0.40, 0x771010, 0x440808);

    // 天空島（Realm8）
    this._drawSkyIsland(g);
  }

  private _ea(rx: number, ry: number, rw: number, rh: number): [number, number, number, number] {
    const { x, y } = this._toXY(rx, ry);
    return [x, y, rw * this._mapW, rh * this._mapH];
  }

  private _drawTreeCluster(g: Phaser.GameObjects.Graphics, rx: number, ry: number, count: number): void {
    const { x, y } = this._toXY(rx, ry);
    for (let i = 0; i < count; i++) {
      const tx = x + (Math.random() - 0.5) * 70;
      const ty = y + (Math.random() - 0.5) * 50;
      const s = 5 + Math.random() * 4;
      // 影
      g.fillStyle(0x2a4a1a, 0.4);
      g.fillTriangle(tx + 2, ty - s * 1.8 + 3, tx - s + 2, ty + 3, tx + s + 2, ty + 3);
      // 木
      g.fillStyle(0x3a7a2a, 1);
      g.fillTriangle(tx, ty - s * 2, tx - s, ty, tx + s, ty);
      g.fillStyle(0x4a9a3a, 0.8);
      g.fillTriangle(tx, ty - s * 2.6, tx - s * 0.7, ty - s * 0.8, tx + s * 0.7, ty - s * 0.8);
      // 幹
      g.fillStyle(0x6a4a2a, 1);
      g.fillRect(tx - 2, ty, 4, s * 0.8);
    }
  }

  private _drawMountains(
    g: Phaser.GameObjects.Graphics, rx: number, ry: number,
    snowColor: number, baseColor: number
  ): void {
    const { x, y } = this._toXY(rx, ry);
    const peaks: [number, number, number][] = [
      [-20, 15, 26], [5, -2, 32], [30, 12, 22], [-8, 28, 18], [22, 25, 20],
    ];
    peaks.forEach(([ox, oy, h]) => {
      const w = h * 0.75;
      g.fillStyle(0x2a2a2a, 0.2);
      g.fillTriangle(x + ox + 3, y + oy + 3, x + ox - w + 3, y + oy + h + 3, x + ox + w + 3, y + oy + h + 3);
      g.fillStyle(baseColor, 1);
      g.fillTriangle(x + ox, y + oy, x + ox - w, y + oy + h, x + ox + w, y + oy + h);
      g.fillStyle(snowColor, 0.9);
      g.fillTriangle(x + ox, y + oy, x + ox - w * 0.38, y + oy + h * 0.42, x + ox + w * 0.38, y + oy + h * 0.42);
    });
  }

  private _drawDunes(g: Phaser.GameObjects.Graphics, rx: number, ry: number): void {
    const { x, y } = this._toXY(rx, ry);
    g.lineStyle(1, 0x9a7020, 0.5);
    for (let i = 0; i < 5; i++) {
      const ox = (i - 2) * 18;
      g.beginPath();
      g.moveTo(x + ox - 18, y + i * 6);
      g.lineTo(x + ox, y + i * 6 - 7);
      g.lineTo(x + ox + 18, y + i * 6);
      g.strokePath();
    }
  }

  private _drawVolcano(g: Phaser.GameObjects.Graphics, rx: number, ry: number): void {
    const { x, y } = this._toXY(rx, ry);
    g.fillStyle(0x2a2a2a, 0.25);
    g.fillTriangle(x + 4, y - 36 + 4, x - 44 + 4, y + 22 + 4, x + 44 + 4, y + 22 + 4);
    g.fillStyle(0x3a1008, 1);
    g.fillTriangle(x, y - 38, x - 44, y + 22, x + 44, y + 22);
    g.fillStyle(0x6a2010, 0.8);
    g.fillTriangle(x, y - 38, x - 22, y, x + 22, y);
    g.fillStyle(0xff5500, 0.9);
    g.fillCircle(x, y - 33, 9);
    g.fillStyle(0xff8800, 0.6);
    g.fillCircle(x - 5, y - 30, 6);
    g.fillCircle(x + 5, y - 31, 5);
    g.fillStyle(0x666666, 0.35);
    g.fillEllipse(x - 4, y - 52, 20, 14);
    g.fillEllipse(x + 6, y - 62, 16, 12);
  }

  private _drawDeadTrees(g: Phaser.GameObjects.Graphics, rx: number, ry: number): void {
    const { x, y } = this._toXY(rx, ry);
    [[-14, 0], [8, -4], [-4, 12], [18, 6], [-20, 14]].forEach(([ox, oy]) => {
      g.lineStyle(2, 0x2a1a38, 0.9);
      g.lineBetween(x + ox, y + oy, x + ox, y + oy - 22);
      g.lineBetween(x + ox, y + oy - 13, x + ox - 9, y + oy - 20);
      g.lineBetween(x + ox, y + oy - 16, x + ox + 7, y + oy - 22);
    });
  }

  private _drawSkyIsland(g: Phaser.GameObjects.Graphics): void {
    const { x, y } = this._toXY(0.32, 0.08);
    const W = this._mapW;

    // 空の帯（上部）
    g.fillStyle(0x88ccff, 0.45);
    g.fillRect(this._mapX, this._mapY, W, this._mapH * 0.18);

    // 背景の雲（ふわふわ）
    [
      [x - 100, y + 8, 0.4], [x + 80, y + 2, 0.35],
      [x - 40, y - 6, 0.3], [x + 130, y + 14, 0.28],
      [x - 160, y + 18, 0.32],
    ].forEach(([cx, cy, a]) => {
      g.fillStyle(0xffffff, (a as number) * 1.4);
      g.fillEllipse(cx, cy, 90, 32);
      g.fillEllipse(cx + 24, cy - 12, 64, 26);
      g.fillEllipse(cx - 22, cy - 8, 52, 22);
    });

    // 浮島本体
    g.fillStyle(0x7a6a3a, 1);           // 岩の側面
    g.fillEllipse(x, y + 30, 100, 24);
    g.fillStyle(0x9a8a4a, 0.85);         // 岩の底グラデーション
    g.fillEllipse(x, y + 34, 90, 16);
    g.fillStyle(0x88ee44, 1);           // 草の層
    g.fillEllipse(x, y + 14, 96, 28);
    g.fillStyle(0xccff66, 0.7);         // 草の明るい部分
    g.fillEllipse(x - 10, y + 10, 60, 16);

    // 島の上の小さな塔
    g.fillStyle(0xddd0a8, 1);
    g.fillRect(x - 8, y - 14, 16, 24);
    g.fillStyle(0x66aaff, 1);
    g.fillTriangle(x - 12, y - 14, x + 12, y - 14, x, y - 30);
    g.fillStyle(0xffffcc, 0.9);
    g.fillRect(x - 4, y - 8, 8, 8);

    // 星の輝き（十字形）
    g.fillStyle(0xffffaa, 0.85);
    [[-28, -14], [18, -18], [-8, -22], [32, -8], [-38, -10]].forEach(([ox, oy]) => {
      g.fillRect(x + ox - 1, y + oy - 4, 2, 8);
      g.fillRect(x + ox - 4, y + oy - 1, 8, 2);
    });

    // 大陸からの虹の橋（細くて品よく）
    const bx = this._mapX + 0.30 * this._mapW;
    const by = this._mapY + 0.20 * this._mapH;
    [0xff8888, 0xffbb66, 0xffee66, 0x88ee88, 0x88aaff, 0xcc88ff].forEach((col, i) => {
      g.lineStyle(1.5, col, 0.28);
      g.beginPath();
      g.moveTo(bx, by);
      g.lineTo(x + (i - 3) * 4, y + 24);
      g.strokePath();
    });
  }

  // ── 亀裂（裏設定）────────────────────────────────────────────

  private _drawRiftLines(): void {
    const g = this.add.graphics();
    const rifts: [number, number][][] = [
      [[0.18, 0.58], [0.22, 0.64], [0.20, 0.70], [0.24, 0.76]],
      [[0.38, 0.44], [0.42, 0.52], [0.40, 0.60], [0.44, 0.68]],
      [[0.60, 0.46], [0.62, 0.54], [0.64, 0.62], [0.62, 0.70]],
      [[0.74, 0.44], [0.76, 0.52], [0.78, 0.58]],
      [[0.80, 0.40], [0.78, 0.46], [0.80, 0.52]],
      [[0.62, 0.22], [0.66, 0.28], [0.68, 0.34]],
      [[0.42, 0.18], [0.46, 0.22], [0.44, 0.28]],
      [[0.18, 0.26], [0.20, 0.32], [0.18, 0.38]],
    ];

    rifts.forEach(points => {
      const first = this._toXY(points[0][0], points[0][1]);

      g.lineStyle(5, 0x110022, 0.7);
      g.beginPath();
      g.moveTo(first.x, first.y);
      points.slice(1).forEach(([rx, ry]) => {
        const { x, y } = this._toXY(rx, ry);
        g.lineTo(x, y);
      });
      g.strokePath();

      g.lineStyle(2, 0xbb44ff, 0.55);
      g.beginPath();
      g.moveTo(first.x, first.y);
      points.slice(1).forEach(([rx, ry]) => {
        const { x, y } = this._toXY(rx, ry);
        g.lineTo(x, y);
      });
      g.strokePath();

      g.lineStyle(1, 0xeeccff, 0.35);
      g.beginPath();
      g.moveTo(first.x, first.y);
      points.slice(1).forEach(([rx, ry]) => {
        const { x, y } = this._toXY(rx, ry);
        g.lineTo(x, y);
      });
      g.strokePath();
    });
  }

  // ── 道 ──────────────────────────────────────────────────────

  private _drawPaths(): void {
    const g = this.add.graphics();
    for (let i = 0; i < REALMS.length - 1; i++) {
      const a = REALMS[i];
      const b = REALMS[i + 1];
      const { x: ax, y: ay } = this._toXY(a.x, a.y);
      const { x: bx, y: by } = this._toXY(b.x, b.y);
      const cleared = this._clearedRealms.includes(a.id);

      // 道の影
      g.lineStyle(4, 0x5a3a10, 0.3);
      for (let s = 0; s < 8; s += 2) {
        const t0 = s / 8, t1 = (s + 1) / 8;
        g.lineBetween(
          ax + (bx - ax) * t0 + 1, ay + (by - ay) * t0 + 1,
          ax + (bx - ax) * t1 + 1, ay + (by - ay) * t1 + 1
        );
      }
      // 道本体
      g.lineStyle(3, cleared ? 0xc8963a : 0x8a6030, cleared ? 0.85 : 0.55);
      for (let s = 0; s < 8; s += 2) {
        const t0 = s / 8, t1 = (s + 1) / 8;
        g.lineBetween(
          ax + (bx - ax) * t0, ay + (by - ay) * t0,
          ax + (bx - ax) * t1, ay + (by - ay) * t1
        );
      }
    }
  }

  // ── Realmノード ──────────────────────────────────────────────

  private _drawRealmNode(realm: typeof REALMS[0]): void {
    const { x, y } = this._toXY(realm.x, realm.y);
    const isCleared = this._clearedRealms.includes(realm.id);
    const isCurrent = realm.id === this._currentRealm;
    const isLocked = realm.id > this._currentRealm;

    const container = this.add.container(x, y);
    const icon = this.add.graphics();
    this._drawCastle(icon, realm.id, isCleared, isCurrent, isLocked);
    container.add(icon);

    // 現在地フラグ
    if (isCurrent) {
      const flag = this.add.graphics();
      flag.lineStyle(2, 0xcc3300, 1);
      flag.lineBetween(0, -30, 0, -50);
      flag.fillStyle(0xcc3300, 1);
      flag.fillTriangle(0, -50, 16, -44, 0, -38);
      flag.fillStyle(0xffeecc, 1);
      flag.fillCircle(0, -52, 3);
      container.add(flag);
      this.tweens.add({
        targets: container,
        y: y - 4,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // ラベル（手書き風フォント）
    const label = this.add.text(0, 26, realm.name, {
      fontFamily: 'Georgia, serif',
      fontSize: 12,
      color: isLocked ? '#8a7a60' : '#1a0a00',
      stroke: '#f0d890',
      strokeThickness: 4,
      fontStyle: isLocked ? 'italic' : 'bold',
    }).setOrigin(0.5);
    container.add(label);

    // クリック判定
    if (!isLocked) {
      icon.setInteractive(
        new Phaser.Geom.Rectangle(-18, -34, 36, 38),
        Phaser.Geom.Rectangle.Contains
      );
      icon.on('pointerover', () => {
        this.input.setDefaultCursor('pointer');
        const stars = '★'.repeat(Math.min(realm.id, 5)) + '☆'.repeat(Math.max(0, 5 - realm.id));
        this._infoText.setText(
          `【${realm.name}】  ${realm.description}  ─  難易度: ${stars}  ─  ボス: ${realm.bossName}`
        );
        container.setScale(1.12);
      });
      icon.on('pointerout', () => {
        this.input.setDefaultCursor('default');
        this._infoText.setText('王国をクリックして詳細を確認');
        container.setScale(1);
      });
      icon.on('pointerdown', () => {
        this.scene.start('BattleScene', { realmId: realm.id });
      });
    }
  }

  private _drawCastle(
    g: Phaser.GameObjects.Graphics,
    realmId: number,
    isCleared: boolean,
    isCurrent: boolean,
    isLocked: boolean
  ): void {
    const wall = isLocked ? 0x8a7a5a : isCleared ? 0xd4c8a0 : 0xe8dcc0;
    const roof = isLocked ? 0x6a5a3a : realmId === 9 ? 0x660000 : 0x8a3a18;
    const a = isLocked ? 0.55 : 1;

    g.lineStyle(0, 0, 0);

    // 影
    g.fillStyle(0x3a2a10, 0.3);
    g.fillRect(-14, -10 + 3, 28, 20 + 3);

    // 壁
    g.fillStyle(wall, a);
    g.fillRect(-14, -10, 28, 20);

    // 銃眼（城壁の凹凸）
    [-14, -6, 2].forEach(bx => {
      g.fillStyle(wall, a);
      g.fillRect(bx, -20, 7, 12);
    });

    // 屋根
    g.fillStyle(roof, a);
    g.fillTriangle(-17, -20, 17, -20, 0, -36);

    // 屋根のハイライト
    g.fillStyle(0xffffff, 0.15);
    g.fillTriangle(-17, -20, 0, -20, -8, -28);

    // 門
    g.fillStyle(0x2a1a08, a);
    g.fillRect(-6, -2, 12, 12);
    g.fillStyle(0x4a3018, 0.6);
    g.fillRect(-5, -1, 10, 6);

    // 窓
    if (!isLocked) {
      g.fillStyle(0xffe088, 0.85);
      g.fillRect(-11, -8, 6, 5);
      g.fillRect(5, -8, 6, 5);
    }

    // クリア済み：金の旗
    if (isCleared) {
      g.fillStyle(0xf4d03f, 1);
      g.fillCircle(0, -38, 4);
      g.lineStyle(1, 0xc8a020, 0.8);
      g.lineBetween(0, -36, 0, -44);
    }

    // 現在地：輝くオーラ
    if (isCurrent) {
      g.fillStyle(0xf4d03f, 0.12);
      g.fillCircle(0, -14, 28);
      g.lineStyle(1.5, 0xf4d03f, 0.6);
      g.strokeCircle(0, -14, 28);
    }
  }

  // ── 地図フレーム ─────────────────────────────────────────────

  private _drawMapFrame(): void {
    const { WIDTH, HEIGHT } = GAME_CONFIG;
    const g = this.add.graphics();

    // 外枠の影
    g.fillStyle(0x2a1a08, 0.5);
    g.fillRect(0, 0, WIDTH, HEIGHT);

    // 羊皮紙の縁（茶色のグラデーション）
    g.fillStyle(0x8a5a20, 1);
    g.fillRect(0, 0, WIDTH, 26);
    g.fillRect(0, HEIGHT - 26, WIDTH, 26);
    g.fillRect(0, 0, 22, HEIGHT);
    g.fillRect(WIDTH - 22, 0, 22, HEIGHT);

    // 内側の細い金線
    g.lineStyle(1, 0xd4a040, 0.8);
    g.strokeRect(26, 26, WIDTH - 52, HEIGHT - 52);

    // 四隅の装飾
    [[26, 26], [WIDTH - 26, 26], [26, HEIGHT - 26], [WIDTH - 26, HEIGHT - 26]].forEach(([cx, cy]) => {
      g.fillStyle(0xd4a040, 0.9);
      g.fillCircle(cx, cy, 5);
      g.lineStyle(1, 0xd4a040, 0.6);
      g.strokeCircle(cx, cy, 9);
    });

    // タイトル帯（上部中央）
    g.fillStyle(0x5a3a10, 0.9);
    g.fillRect(WIDTH / 2 - 120, 8, 240, 22);
    g.lineStyle(1, 0xd4a040, 0.7);
    g.strokeRect(WIDTH / 2 - 120, 8, 240, 22);

    this.add.text(WIDTH / 2, 19, 'N I N E  R E A L M S', {
      fontFamily: 'Georgia, serif',
      fontSize: 13,
      color: '#f4d4a0',
      fontStyle: 'bold',
      letterSpacing: 2,
    }).setOrigin(0.5);

    // コンパス（右下）
    this._drawCompass(WIDTH - 52, HEIGHT - 52);
  }

  private _drawCompass(x: number, y: number): void {
    const g = this.add.graphics();
    g.fillStyle(0xd4b870, 0.2);
    g.fillCircle(x, y, 20);
    g.lineStyle(1, 0xa07830, 0.6);
    g.strokeCircle(x, y, 20);

    // 方位針
    g.fillStyle(0xcc3300, 0.85);
    g.fillTriangle(x, y - 16, x - 5, y + 2, x + 5, y + 2);
    g.fillStyle(0x888878, 0.85);
    g.fillTriangle(x, y + 16, x - 5, y - 2, x + 5, y - 2);

    this.add.text(x, y - 22, 'N', {
      fontFamily: 'Georgia, serif', fontSize: 10,
      color: '#6a3a10', fontStyle: 'bold',
    }).setOrigin(0.5);
  }

  // ── UI ──────────────────────────────────────────────────────

  private _drawUI(): void {
    const { WIDTH, HEIGHT } = GAME_CONFIG;

    // ゴールド表示
    const goldBg = this.add.graphics();
    goldBg.fillStyle(0x3a2a10, 0.8);
    goldBg.fillRoundedRect(WIDTH - 110, 6, 102, 22, 5);
    goldBg.lineStyle(1, 0xd4a040, 0.6);
    goldBg.strokeRoundedRect(WIDTH - 110, 6, 102, 22, 5);
    this.add.text(WIDTH - 60, 17, `G : ${this._gold}`, {
      fontFamily: 'Georgia, serif',
      fontSize: 13,
      color: '#f4d4a0',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // 情報パネル（下部）
    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x2a1a08, 0.82);
    panelBg.fillRect(22, HEIGHT - 48, WIDTH - 44, 26);
    panelBg.lineStyle(1, 0xa07830, 0.5);
    panelBg.strokeRect(22, HEIGHT - 48, WIDTH - 44, 26);

    this._infoText = this.add.text(WIDTH / 2, HEIGHT - 35, '王国をクリックして詳細を確認', {
      fontFamily: 'Georgia, serif',
      fontSize: 13,
      color: '#d4c8a0',
      align: 'center',
      fontStyle: 'italic',
    }).setOrigin(0.5);

    // ショップボタン
    const shopBg = this.add.graphics();
    shopBg.fillStyle(0x5a3a10, 0.9);
    shopBg.fillRoundedRect(30, HEIGHT - 46, 110, 24, 6);
    shopBg.lineStyle(1, 0xd4a040, 0.7);
    shopBg.strokeRoundedRect(30, HEIGHT - 46, 110, 24, 6);

    const shopText = this.add.text(85, HEIGHT - 34, '⚒ ショップ', {
      fontFamily: 'Georgia, serif',
      fontSize: 13,
      color: '#f4d4a0',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    shopText.setInteractive(new Phaser.Geom.Rectangle(-55, -12, 110, 24), Phaser.Geom.Rectangle.Contains);
    shopText.on('pointerover', () => { this.input.setDefaultCursor('pointer'); shopText.setColor('#ffe8aa'); });
    shopText.on('pointerout', () => { this.input.setDefaultCursor('default'); shopText.setColor('#f4d4a0'); });
    shopText.on('pointerdown', () => { this.scene.start('ShopScene'); });
  }
}
