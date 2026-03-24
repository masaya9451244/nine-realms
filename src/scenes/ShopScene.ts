import Phaser from 'phaser';
import { GAME_CONFIG } from '../config';
import { EQUIPMENT_LIST } from '../data/equipment';
import type { GameState } from '../types/game';

interface HintItemDef {
  key: 'numberLight' | 'truthEye' | 'guidingHand';
  icon: string;
  name: string;
  description: string;
  price: number;
}

interface EquipItemDef {
  id: string;
  icon: string;
  name: string;
  description: string;
  price: number | null;
}

const HINT_ITEMS: HintItemDef[] = [
  { key: 'numberLight', icon: '💡', name: '数字の光',  description: '候補数字を表示',   price: 10 },
  { key: 'truthEye',    icon: '👁',  name: '真実の目', description: 'ミスをハイライト', price: 30 },
  { key: 'guidingHand', icon: '✋', name: '導きの手', description: '1マス自動入力',    price: 50 },
];

const EQUIP_WEAPONS: EquipItemDef[] = EQUIPMENT_LIST
  .filter(e => e.slot === 'weapon')
  .map(e => ({
    id: e.id,
    icon: '⚔',
    name: e.name,
    description: `空白マス -${e.effect.blankReduction ?? 0}`,
    price: e.price,
  }));

const EQUIP_ARMORS: EquipItemDef[] = EQUIPMENT_LIST
  .filter(e => e.slot === 'armor')
  .map(e => ({
    id: e.id,
    icon: '🛡',
    name: e.name,
    description: `最大HP +${e.effect.maxHpBonus ?? 0}`,
    price: e.price,
  }));

const EQUIP_ACCESSORIES: EquipItemDef[] = EQUIPMENT_LIST
  .filter(e => e.slot === 'accessory')
  .map(e => ({
    id: e.id,
    icon: '✨',
    name: e.name,
    description: e.effect.timeDamageReduction
      ? `時間ダメージ -${e.effect.timeDamageReduction}`
      : `ミスダメージ -${e.effect.missDamageReduction ?? 0}`,
    price: e.price,
  }));

const COL_PARCHMENT      = 0xf5e6c8;
const COL_PARCHMENT_DARK = 0xe8d4a8;
const COL_BORDER         = 0x8b6914;
const COL_BTN_BUY        = 0x4a7c3f;
const COL_BG_DARK        = 0x1a1a2e;
const COL_TAB_ACTIVE     = 0xd4a847;
const COL_TAB_INACTIVE   = 0xb8965a;

const TABS = ['道具', '武器', '防具', 'アクセサリー'];

// スクロール1行の高さ
const ROW_H = 52;

export class ShopScene extends Phaser.Scene {
  private _feedbackText!: Phaser.GameObjects.Text;
  private _activeTab = 0;
  private _goldText!: Phaser.GameObjects.Text;

  // タブごとのコンテナ・スクロール状態
  private _tabContainers: Phaser.GameObjects.Container[] = [];
  private _tabScrollOffsets: number[] = [0, 0, 0, 0];
  private _tabMaxScrolls: number[] = [0, 0, 0, 0];
  private _tabBtnGraphics: Phaser.GameObjects.Graphics[] = [];
  private _tabBtnTexts: Phaser.GameObjects.Text[] = [];

  // スクロールエリア（絶対座標）
  private _scrollAreaX = 0;
  private _scrollAreaY = 0;
  private _scrollAreaW = 0;
  private _scrollAreaH = 0;

  constructor() {
    super({ key: 'ShopScene' });
  }

  create(_data?: unknown): void {
    const { WIDTH, HEIGHT } = GAME_CONFIG;
    const state: GameState = this.game.registry.get('gameState');

    // 背景
    const overlay = this.add.graphics();
    overlay.fillStyle(COL_BG_DARK, 0.85);
    overlay.fillRect(0, 0, WIDTH, HEIGHT);

    // 中央パネル
    const panelW = 680;
    const panelH = 560;
    const panelX = (WIDTH - panelW) / 2;
    const panelY = (HEIGHT - panelH) / 2;

    this._drawParchment(panelX, panelY, panelW, panelH);

    // タイトル
    this.add.text(WIDTH / 2, panelY + 22, '⚒ 商店', {
      fontFamily: 'Georgia, serif',
      fontSize: '26px',
      color: '#2c1a00',
    }).setOrigin(0.5, 0);

    const divG = this.add.graphics();
    divG.lineStyle(2, COL_BORDER, 0.8);
    divG.lineBetween(panelX + 20, panelY + 60, panelX + panelW - 20, panelY + 60);

    // タブ
    const tabY = panelY + 68;
    const tabH = 34;
    const tabW = (panelW - 40) / TABS.length;
    this._drawTabs(panelX + 20, tabY, tabW, tabH);

    // スクロールエリア
    this._scrollAreaX = panelX + 20;
    this._scrollAreaY = tabY + tabH + 4;
    this._scrollAreaW = panelW - 40;
    this._scrollAreaH = panelH - (tabY - panelY) - tabH - 4 - 70;

    // 各タブのコンテンツ
    this._buildTabContent(0, HINT_ITEMS.map(i => this._hintRow(i, state)));
    this._buildTabContent(1, EQUIP_WEAPONS.map(i => this._equipRow(i, state)));
    this._buildTabContent(2, EQUIP_ARMORS.map(i => this._equipRow(i, state)));
    this._buildTabContent(3, EQUIP_ACCESSORIES.map(i => this._equipRow(i, state)));

    this._showTab(0);

    // マウスホイール
    this.input.on('wheel', (_p: unknown, _g: unknown, _dx: number, deltaY: number) => {
      const tab = this._activeTab;
      const newOffset = Phaser.Math.Clamp(
        this._tabScrollOffsets[tab] + deltaY * 0.6,
        0,
        this._tabMaxScrolls[tab],
      );
      const diff = newOffset - this._tabScrollOffsets[tab];
      this._tabScrollOffsets[tab] = newOffset;
      this._tabContainers[tab].y -= diff;
    });

    // 所持ゴールド
    this._goldText = this.add.text(panelX + 24, panelY + panelH - 46, `G: ${state.gold}`, {
      fontFamily: 'Georgia, serif',
      fontSize: '20px',
      color: '#c9a227',
    });

    // 閉じるボタン
    this._drawCloseButton(panelX + panelW - 130, panelY + panelH - 50);

    // フィードバック
    this._feedbackText = this.add.text(WIDTH / 2, HEIGHT / 2, '', {
      fontFamily: 'Georgia, serif',
      fontSize: '20px',
      color: '#f4d03f',
      backgroundColor: '#2c1a00',
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setDepth(20).setAlpha(0);
  }

  // ─── タブ描画 ────────────────────────────────────────────────

  private _drawTabs(x: number, y: number, tabW: number, tabH: number): void {
    TABS.forEach((label, i) => {
      const tx = x + i * tabW;

      const g = this.add.graphics();
      this._tabBtnGraphics.push(g);

      const t = this.add.text(tx + tabW / 2, y + tabH / 2, label, {
        fontFamily: 'Georgia, serif',
        fontSize: '14px',
        color: '#2c1a00',
      }).setOrigin(0.5).setDepth(2);
      this._tabBtnTexts.push(t);

      const zone = this.add.zone(tx, y, tabW - 2, tabH).setOrigin(0).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => this._showTab(i));
    });
  }

  private _showTab(index: number): void {
    this._activeTab = index;
    const { _scrollAreaX: x, _scrollAreaY: y, _scrollAreaW: w } = this;
    const tabH = 34;
    const tabW = w / TABS.length;
    const tabBaseY = y - tabH - 4;

    // タブボタン再描画
    TABS.forEach((_, i) => {
      const g = this._tabBtnGraphics[i];
      const tx = x + i * tabW;
      const active = i === index;
      g.clear();
      g.fillStyle(active ? COL_TAB_ACTIVE : COL_TAB_INACTIVE, active ? 1 : 0.5);
      g.fillRoundedRect(tx, tabBaseY, tabW - 2, tabH, { tl: 6, tr: 6, bl: 0, br: 0 });
      g.lineStyle(1, COL_BORDER, active ? 1 : 0.4);
      g.strokeRoundedRect(tx, tabBaseY, tabW - 2, tabH, { tl: 6, tr: 6, bl: 0, br: 0 });
      this._tabBtnTexts[i].setColor(active ? '#1a0800' : '#5a3a10').setFontStyle(active ? 'bold' : 'normal');
    });

    // コンテナ表示切替
    this._tabContainers.forEach((c, i) => c.setVisible(i === index));
  }

  // ─── タブコンテンツ ──────────────────────────────────────────

  private _buildTabContent(
    tabIndex: number,
    rows: Array<(container: Phaser.GameObjects.Container, relY: number) => void>,
  ): void {
    const container = this.add.container(this._scrollAreaX, this._scrollAreaY);

    // マスク（クリッピング）
    const maskG = this.add.graphics();
    maskG.fillStyle(0xffffff);
    maskG.fillRect(this._scrollAreaX, this._scrollAreaY, this._scrollAreaW, this._scrollAreaH);
    const mask = maskG.createGeometryMask();
    maskG.setVisible(false);
    container.setMask(mask);

    let relY = 4;
    rows.forEach(buildRow => {
      buildRow(container, relY);
      relY += ROW_H + 4;
    });

    const totalH = relY;
    this._tabMaxScrolls[tabIndex] = Math.max(0, totalH - this._scrollAreaH);
    this._tabContainers.push(container);
  }

  // ─── 行ビルダー ──────────────────────────────────────────────

  private _hintRow(item: HintItemDef, state: GameState): (c: Phaser.GameObjects.Container, ry: number) => void {
    return (c, ry) => {
      const W = this._scrollAreaW;

      const bg = this.add.graphics();
      bg.fillStyle(COL_PARCHMENT_DARK, 0.4);
      bg.fillRoundedRect(0, ry, W, ROW_H, 6);
      bg.lineStyle(1, COL_BORDER, 0.25);
      bg.strokeRoundedRect(0, ry, W, ROW_H, 6);

      const icon = this.add.text(12, ry + ROW_H / 2, item.icon, { fontSize: '24px' }).setOrigin(0, 0.5);
      const name = this.add.text(50, ry + 10, item.name, { fontFamily: 'Georgia, serif', fontSize: '15px', color: '#2c1a00' });
      const desc = this.add.text(50, ry + 28, item.description, { fontFamily: 'Arial', fontSize: '12px', color: '#5a3e00' });
      const owned = this.add.text(240, ry + ROW_H / 2, `所持: ${state.items[item.key]}個`, { fontFamily: 'Arial', fontSize: '12px', color: '#7a5c20' }).setOrigin(0, 0.5);
      const priceText = this.add.text(360, ry + ROW_H / 2, `${item.price} G`, { fontFamily: 'Georgia, serif', fontSize: '14px', color: '#c9a227' }).setOrigin(0, 0.5);

      c.add([bg, icon, name, desc, owned, priceText]);

      this._addBuyBtn(c, W - 100, ry + (ROW_H - 30) / 2, 88, 30, () => {
        const gs: GameState = this.game.registry.get('gameState');
        if (gs.gold < item.price) {
          this._showFeedback('ゴールドが足りません');
          return;
        }
        gs.gold -= item.price;
        (gs.items as Record<string, number>)[item.key]++;
        this.game.registry.set('gameState', gs);
        state.items[item.key]++;
        owned.setText(`所持: ${state.items[item.key]}個`);
        this._goldText.setText(`G: ${gs.gold}`);
        this._showFeedback('購入しました！');
      });
    };
  }

  private _equipRow(item: EquipItemDef, state: GameState): (c: Phaser.GameObjects.Container, ry: number) => void {
    return (c, ry) => {
      const W = this._scrollAreaW;
      const avail = item.price !== null;

      const bg = this.add.graphics();
      bg.fillStyle(avail ? COL_PARCHMENT_DARK : 0xcccccc, avail ? 0.35 : 0.15);
      bg.fillRoundedRect(0, ry, W, ROW_H, 6);

      const icon = this.add.text(12, ry + ROW_H / 2, item.icon, { fontSize: '20px' }).setOrigin(0, 0.5).setAlpha(avail ? 1 : 0.35);
      const name = this.add.text(42, ry + 10, item.name, { fontFamily: 'Georgia, serif', fontSize: '15px', color: avail ? '#2c1a00' : '#888888' });
      const desc = this.add.text(42, ry + 28, item.description, { fontFamily: 'Arial', fontSize: '12px', color: avail ? '#5a3e00' : '#999999' });

      c.add([bg, icon, name, desc]);

      if (avail) {
        const alreadyOwned = state.inventory.includes(item.id);
        const price = item.price as number;
        const priceText = this.add.text(360, ry + ROW_H / 2, `${price} G`, { fontFamily: 'Georgia, serif', fontSize: '14px', color: '#c9a227' }).setOrigin(0, 0.5);
        c.add(priceText);

        if (alreadyOwned) {
          const ownedLabel = this.add.text(W - 56, ry + ROW_H / 2, '所持済み', { fontFamily: 'Arial', fontSize: '12px', color: '#888888' }).setOrigin(0.5, 0.5);
          c.add(ownedLabel);
        } else {
          this._addBuyBtn(c, W - 100, ry + (ROW_H - 30) / 2, 88, 30, () => {
            const gs: GameState = this.game.registry.get('gameState');
            if (gs.gold < price) {
              this._showFeedback('ゴールドが足りません');
              return;
            }
            if (gs.inventory.includes(item.id)) {
              this._showFeedback('すでに所持しています');
              return;
            }
            gs.gold -= price;
            gs.inventory.push(item.id);
            this.game.registry.set('gameState', gs);
            this._goldText.setText(`G: ${gs.gold}`);
            this._showFeedback('購入しました！');
          });
        }
      } else {
        const dropLabel = this.add.text(360, ry + ROW_H / 2, 'ドロップ品', { fontFamily: 'Arial', fontSize: '12px', color: '#888888' }).setOrigin(0, 0.5);
        c.add(dropLabel);
      }
    };
  }

  // ─── 購入ボタン（コンテナ内） ─────────────────────────────────

  private _addBuyBtn(
    c: Phaser.GameObjects.Container,
    rx: number, ry: number, w: number, h: number,
    onBuy: () => void,
  ): void {
    const g = this.add.graphics();
    const draw = (hover: boolean) => {
      g.clear();
      g.fillStyle(hover ? 0x5a9c4f : COL_BTN_BUY, 1);
      g.fillRoundedRect(rx, ry, w, h, 5);
      g.lineStyle(1, 0x2a5c1f, 1);
      g.strokeRoundedRect(rx, ry, w, h, 5);
    };
    draw(false);

    const label = this.add.text(rx + w / 2, ry + h / 2, '購入', {
      fontFamily: 'Georgia, serif',
      fontSize: '13px',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(1);

    const zone = this.add.zone(rx, ry, w, h).setOrigin(0).setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => draw(true));
    zone.on('pointerout',  () => draw(false));
    zone.on('pointerdown', () => onBuy());

    c.add([g, label, zone]);
  }

  // ─── 背景パーチメント ─────────────────────────────────────────

  private _drawParchment(x: number, y: number, w: number, h: number): void {
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.5);
    g.fillRoundedRect(x + 6, y + 6, w, h, 12);
    g.fillStyle(COL_PARCHMENT, 1);
    g.fillRoundedRect(x, y, w, h, 12);
    g.fillStyle(COL_PARCHMENT_DARK, 0.3);
    g.fillRoundedRect(x + 4, y + 4, w - 8, h - 8, 10);
    g.lineStyle(3, COL_BORDER, 1);
    g.strokeRoundedRect(x, y, w, h, 12);
    g.lineStyle(1, COL_BORDER, 0.4);
    g.strokeRoundedRect(x + 6, y + 6, w - 12, h - 12, 9);
  }

  // ─── 閉じるボタン ────────────────────────────────────────────

  private _drawCloseButton(x: number, y: number): void {
    const w = 110, h = 34;
    const g = this.add.graphics();
    const draw = (hover: boolean) => {
      g.clear();
      g.fillStyle(hover ? 0x9a3232 : 0x7a2222, 1);
      g.fillRoundedRect(x, y, w, h, 6);
      g.lineStyle(1.5, 0x4a1010, 1);
      g.strokeRoundedRect(x, y, w, h, 6);
    };
    draw(false);
    this.add.text(x + w / 2, y + h / 2, '× 閉じる', { fontFamily: 'Georgia, serif', fontSize: '14px', color: '#ffffff' }).setOrigin(0.5).setDepth(1);
    const zone = this.add.zone(x, y, w, h).setOrigin(0).setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => draw(true));
    zone.on('pointerout',  () => draw(false));
    zone.on('pointerdown', () => this.scene.start('WorldMapScene'));
  }

  // ─── フィードバック ───────────────────────────────────────────

  private _showFeedback(message: string): void {
    this._feedbackText.setText(message).setAlpha(1);
    this.tweens.add({ targets: this._feedbackText, alpha: 0, delay: 1500, duration: 400 });
  }
}
