import Phaser from 'phaser';
import { FONTS, GAME_CONFIG } from '../config';
import { REALMS } from '../data/realms';

export class WorldMapScene extends Phaser.Scene {
  private _clearedRealms: number[] = [];
  private _currentRealm = 1;
  private _gold = 0;
  private _infoText!: Phaser.GameObjects.Text;

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

    // 背景
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0d1b2e, 0x0d1b2e, 0x1a2f4a, 0x1a2f4a, 1);
    bg.fillRect(0, 0, WIDTH, HEIGHT);

    // タイトル
    this.add.text(WIDTH / 2, 32, 'WORLD MAP', {
      fontFamily: FONTS.DEFAULT,
      fontSize: 28,
      color: '#f4d03f',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // ゴールド表示
    this.add.text(WIDTH - 20, 20, `💰 ${this._gold} G`, {
      fontFamily: FONTS.DEFAULT,
      fontSize: 20,
      color: '#f4d03f',
    }).setOrigin(1, 0);

    // Realm間の道を描画
    this._drawPaths(bg);

    // 各Realmノードを描画
    REALMS.forEach(realm => this._drawRealmNode(realm));

    // 情報パネル（下部）
    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x0a0f1a, 0.85);
    panelBg.fillRect(0, HEIGHT - 80, WIDTH, 80);
    panelBg.lineStyle(1, 0x3a5a7a, 0.6);
    panelBg.lineBetween(0, HEIGHT - 80, WIDTH, HEIGHT - 80);

    this._infoText = this.add.text(WIDTH / 2, HEIGHT - 40, 'Realmをクリックして詳細を確認', {
      fontFamily: FONTS.DEFAULT,
      fontSize: 18,
      color: '#aabbcc',
      align: 'center',
    }).setOrigin(0.5);

    // ショップボタン
    this._createShopButton();
  }

  private _drawPaths(g: Phaser.GameObjects.Graphics): void {
    const { WIDTH, HEIGHT } = GAME_CONFIG;
    const MAP_X = 40;
    const MAP_Y = 65;
    const MAP_W = WIDTH - 80;
    const MAP_H = HEIGHT - 160;

    // Realm順に道を繋ぐ
    g.lineStyle(3, 0x3a5a3a, 0.5);
    for (let i = 0; i < REALMS.length - 1; i++) {
      const a = REALMS[i];
      const b = REALMS[i + 1];
      const ax = MAP_X + a.x * MAP_W;
      const ay = MAP_Y + a.y * MAP_H;
      const bx = MAP_X + b.x * MAP_W;
      const by = MAP_Y + b.y * MAP_H;

      const cleared = this._clearedRealms.includes(a.id);
      g.lineStyle(3, cleared ? 0x4a9e4a : 0x2a3a2a, cleared ? 0.8 : 0.4);
      g.lineBetween(ax, ay, bx, by);
    }
  }

  private _drawRealmNode(realm: typeof REALMS[0]): void {
    const { WIDTH, HEIGHT } = GAME_CONFIG;
    const MAP_X = 40;
    const MAP_Y = 65;
    const MAP_W = WIDTH - 80;
    const MAP_H = HEIGHT - 160;

    const x = MAP_X + realm.x * MAP_W;
    const y = MAP_Y + realm.y * MAP_H;
    const isCleared = this._clearedRealms.includes(realm.id);
    const isCurrent = realm.id === this._currentRealm;
    const isLocked = realm.id > this._currentRealm;
    const radius = isCurrent ? 28 : 22;

    const container = this.add.container(x, y);

    // ノード背景（外輪）
    const ring = this.add.graphics();
    if (isCurrent) {
      ring.lineStyle(3, 0xf4d03f, 1);
      ring.strokeCircle(0, 0, radius + 5);
      // 点滅アニメーション
      this.tweens.add({
        targets: ring,
        alpha: 0.3,
        duration: 800,
        yoyo: true,
        repeat: -1,
      });
    }
    container.add(ring);

    // ノード本体
    const circle = this.add.graphics();
    const color = isLocked ? 0x333333 : realm.color;
    const alpha = isLocked ? 0.5 : 1;
    circle.fillStyle(color, alpha);
    circle.fillCircle(0, 0, radius);
    if (isCleared) {
      circle.lineStyle(2, 0xffffff, 0.8);
      circle.strokeCircle(0, 0, radius);
    }
    container.add(circle);

    // Realm番号
    const numText = this.add.text(0, 0, `${realm.id}`, {
      fontFamily: FONTS.DEFAULT,
      fontSize: isCurrent ? 20 : 16,
      color: isLocked ? '#555555' : '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    container.add(numText);

    // クリア済みチェックマーク
    if (isCleared) {
      const check = this.add.text(radius - 4, -radius + 4, '✓', {
        fontFamily: FONTS.DEFAULT,
        fontSize: 14,
        color: '#2ecc71',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      container.add(check);
    }

    // Realm名ラベル
    const label = this.add.text(0, radius + 14, realm.name, {
      fontFamily: FONTS.DEFAULT,
      fontSize: 13,
      color: isLocked ? '#444444' : '#ccddee',
    }).setOrigin(0.5);
    container.add(label);

    // クリック判定
    if (!isLocked) {
      circle.setInteractive(
        new Phaser.Geom.Circle(0, 0, radius),
        Phaser.Geom.Circle.Contains
      );
      circle.on('pointerover', () => {
        this.input.setDefaultCursor('pointer');
        this._infoText.setText(
          `${realm.name}  ｜  難易度: ${'★'.repeat(Math.ceil(realm.id / 2))}  ｜  ボス: ${realm.bossName}`
        );
        container.setScale(1.1);
      });
      circle.on('pointerout', () => {
        this.input.setDefaultCursor('default');
        this._infoText.setText('Realmをクリックして詳細を確認');
        container.setScale(1);
      });
      circle.on('pointerdown', () => {
        // TODO Phase 4でバトル遷移を実装
        this._infoText.setText(`${realm.name} に挑戦！（バトル実装中）`);
      });
    }
  }

  private _createShopButton(): void {
    const { HEIGHT } = GAME_CONFIG;
    const x = 80;
    const y = HEIGHT - 40;

    const container = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(0xc0820a, 1);
    bg.fillRoundedRect(-60, -22, 120, 44, 10);

    const text = this.add.text(0, 0, '🏪 ショップ', {
      fontFamily: FONTS.DEFAULT,
      fontSize: 18,
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    container.add([bg, text]);
    container.setInteractive(
      new Phaser.Geom.Rectangle(-60, -22, 120, 44),
      Phaser.Geom.Rectangle.Contains
    );
    container.on('pointerover', () => {
      this.input.setDefaultCursor('pointer');
      container.setScale(1.05);
    });
    container.on('pointerout', () => {
      this.input.setDefaultCursor('default');
      container.setScale(1);
    });
    container.on('pointerdown', () => {
      // TODO Phase 4でショップ遷移を実装
      this._infoText.setText('ショップ（実装中）');
    });
  }
}
