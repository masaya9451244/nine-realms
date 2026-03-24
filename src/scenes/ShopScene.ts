import Phaser from 'phaser';
import { GAME_CONFIG } from '../config';

interface HintItem {
  icon: string;
  name: string;
  description: string;
  price: number;
  owned: number;
}

interface EquipItem {
  icon: string;
  name: string;
  description: string;
  price: number | null; // null = drop only
}

const HINT_ITEMS: HintItem[] = [
  { icon: '💡', name: '数字の光',  description: '候補数字を表示',  price: 10,  owned: 3 },
  { icon: '👁',  name: '真実の目', description: 'ミスをハイライト', price: 30,  owned: 1 },
  { icon: '✋', name: '導きの手', description: '1マス自動入力',   price: 50,  owned: 0 },
];

const EQUIP_WEAPONS: EquipItem[] = [
  { icon: '⚔', name: '木の剣',   description: '空白マス-5',   price: 100  },
  { icon: '⚔', name: '鉄の剣',   description: '空白マス-10',  price: null },
  { icon: '⚔', name: '伝説の剣', description: '空白マス-15',  price: null },
];

const EQUIP_ARMORS: EquipItem[] = [
  { icon: '🛡', name: '革の鎧',   description: '最大HP+50',   price: 150  },
  { icon: '🛡', name: '鉄の鎧',   description: '最大HP+100',  price: null },
  { icon: '🛡', name: '守護の鎧', description: '最大HP+150',  price: null },
];

const EQUIP_ACCESSORIES: EquipItem[] = [
  { icon: '✨', name: 'お守り',       description: '時間ダメージ-1',  price: 80   },
  { icon: '✨', name: '賢者の指輪',   description: 'ミスダメージ-5',  price: null },
  { icon: '✨', name: '不死鳥の羽',   description: '時間ダメージ-3',  price: null },
];

const DEMO_GOLD = 250;

const COL_PARCHMENT = 0xf5e6c8;
const COL_PARCHMENT_DARK = 0xe8d4a8;
const COL_BORDER = 0x8b6914;
const COL_BTN_BUY = 0x4a7c3f;
const COL_BG_DARK = 0x1a1a2e;

export class ShopScene extends Phaser.Scene {
  private _feedbackText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'ShopScene' });
  }

  create(_data?: unknown): void {
    const { WIDTH, HEIGHT } = GAME_CONFIG;

    // ── 背景（暗いオーバーレイ）
    const overlay = this.add.graphics();
    overlay.fillStyle(COL_BG_DARK, 0.85);
    overlay.fillRect(0, 0, WIDTH, HEIGHT);

    // ── 中央パネル（羊皮紙）
    const panelW = 700;
    const panelH = 560;
    const panelX = (WIDTH - panelW) / 2;
    const panelY = (HEIGHT - panelH) / 2;

    this._drawParchment(panelX, panelY, panelW, panelH);

    // ── タイトル
    this.add.text(WIDTH / 2, panelY + 28, '⚒ 商店', {
      fontFamily: 'Georgia, serif',
      fontSize: '28px',
      color: '#2c1a00',
    }).setOrigin(0.5, 0);

    // 仕切り線
    const divider = this.add.graphics();
    divider.lineStyle(2, COL_BORDER, 0.8);
    divider.lineBetween(panelX + 20, panelY + 66, panelX + panelW - 20, panelY + 66);

    // ── 左列: ヒントアイテム
    const leftX = panelX + 20;
    this._drawHintSection(leftX, panelY + 80);

    // ── 縦仕切り
    const colDivider = this.add.graphics();
    colDivider.lineStyle(1, COL_BORDER, 0.5);
    colDivider.lineBetween(panelX + 330, panelY + 70, panelX + 330, panelY + panelH - 70);

    // ── 右列: 装備
    const rightX = panelX + 345;
    this._drawEquipSection(rightX, panelY + 80);

    // ── 所持ゴールド
    this.add.text(panelX + 24, panelY + panelH - 52, `G: ${DEMO_GOLD}`, {
      fontFamily: 'Georgia, serif',
      fontSize: '20px',
      color: '#c9a227',
    });

    // ── 閉じるボタン
    this._drawCloseButton(panelX + panelW - 130, panelY + panelH - 54);

    // ── フィードバックテキスト
    this._feedbackText = this.add.text(WIDTH / 2, HEIGHT / 2 - 20, '', {
      fontFamily: 'Georgia, serif',
      fontSize: '22px',
      color: '#f4d03f',
      backgroundColor: '#2c1a00',
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setDepth(10).setAlpha(0);
  }

  private _drawParchment(x: number, y: number, w: number, h: number): void {
    const g = this.add.graphics();
    // 影
    g.fillStyle(0x000000, 0.5);
    g.fillRoundedRect(x + 6, y + 6, w, h, 12);
    // 本体
    g.fillStyle(COL_PARCHMENT, 1);
    g.fillRoundedRect(x, y, w, h, 12);
    // 内側グラデーション感
    g.fillStyle(COL_PARCHMENT_DARK, 0.3);
    g.fillRoundedRect(x + 4, y + 4, w - 8, h - 8, 10);
    // 枠線
    g.lineStyle(3, COL_BORDER, 1);
    g.strokeRoundedRect(x, y, w, h, 12);
    // 内枠
    g.lineStyle(1, COL_BORDER, 0.4);
    g.strokeRoundedRect(x + 6, y + 6, w - 12, h - 12, 9);
  }

  private _drawHintSection(x: number, y: number): void {
    this.add.text(x + 130, y, 'ヒントアイテム', {
      fontFamily: 'Georgia, serif',
      fontSize: '15px',
      color: '#6b4c11',
    }).setOrigin(0.5, 0);

    HINT_ITEMS.forEach((item, i) => {
      const rowY = y + 28 + i * 130;
      this._drawHintItemRow(x, rowY, item);
    });
  }

  private _drawHintItemRow(x: number, y: number, item: HintItem): void {
    // 行背景
    const rowBg = this.add.graphics();
    rowBg.fillStyle(COL_PARCHMENT_DARK, 0.4);
    rowBg.fillRoundedRect(x, y, 295, 110, 6);
    rowBg.lineStyle(1, COL_BORDER, 0.3);
    rowBg.strokeRoundedRect(x, y, 295, 110, 6);

    // アイコン
    this.add.text(x + 14, y + 10, item.icon, {
      fontSize: '28px',
    });

    // アイテム名
    this.add.text(x + 52, y + 10, item.name, {
      fontFamily: 'Georgia, serif',
      fontSize: '16px',
      color: '#2c1a00',
    });

    // 説明
    this.add.text(x + 52, y + 34, item.description, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      color: '#5a3e00',
    });

    // 所持数
    this.add.text(x + 52, y + 54, `所持: ${item.owned}個`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      color: '#7a5c20',
    });

    // 価格
    this.add.text(x + 52, y + 72, `${item.price} G`, {
      fontFamily: 'Georgia, serif',
      fontSize: '14px',
      color: '#c9a227',
    });

    // 購入ボタン
    this._drawBuyButton(x + 190, y + 36, 88, 36, item.price, () => {
      this._showFeedback('購入しました！');
    });
  }

  private _drawEquipSection(x: number, y: number): void {
    this.add.text(x + 155, y, '装備品', {
      fontFamily: 'Georgia, serif',
      fontSize: '15px',
      color: '#6b4c11',
    }).setOrigin(0.5, 0);

    let currentY = y + 26;

    const sections: { label: string; items: EquipItem[] }[] = [
      { label: '武器', items: EQUIP_WEAPONS },
      { label: '防具', items: EQUIP_ARMORS },
      { label: 'アクセサリー', items: EQUIP_ACCESSORIES },
    ];

    sections.forEach(sec => {
      this.add.text(x + 4, currentY, sec.label, {
        fontFamily: 'Georgia, serif',
        fontSize: '13px',
        color: '#8b6914',
      });
      currentY += 16;

      sec.items.forEach(item => {
        this._drawEquipItemRow(x, currentY, item);
        currentY += 42;
      });
      currentY += 2;
    });
  }

  private _drawEquipItemRow(x: number, y: number, item: EquipItem): void {
    const isAvail = item.price !== null;

    // 行背景
    const rowBg = this.add.graphics();
    rowBg.fillStyle(isAvail ? COL_PARCHMENT_DARK : 0xcccccc, isAvail ? 0.35 : 0.2);
    rowBg.fillRoundedRect(x, y, 305, 38, 4);

    // アイコン
    this.add.text(x + 6, y + 4, item.icon, {
      fontSize: '16px',
    }).setAlpha(isAvail ? 1 : 0.4);

    // 名前
    this.add.text(x + 28, y + 5, item.name, {
      fontFamily: 'Georgia, serif',
      fontSize: '13px',
      color: isAvail ? '#2c1a00' : '#888888',
    });

    // 説明
    this.add.text(x + 28, y + 22, item.description, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '11px',
      color: isAvail ? '#5a3e00' : '#999999',
    });

    if (isAvail) {
      // 価格
      this.add.text(x + 165, y + 10, `${item.price} G`, {
        fontFamily: 'Georgia, serif',
        fontSize: '13px',
        color: '#c9a227',
      });

      // 購入ボタン
      this._drawBuyButton(x + 220, y + 4, 76, 28, item.price, () => {
        this._showFeedback('購入しました！');
      });
    } else {
      this.add.text(x + 165, y + 10, 'ドロップ品', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        color: '#888888',
      });
    }
  }

  private _drawBuyButton(
    x: number,
    y: number,
    w: number,
    h: number,
    _price: number | null,
    onClick: () => void,
  ): void {
    const g = this.add.graphics();
    g.fillStyle(COL_BTN_BUY, 1);
    g.fillRoundedRect(x, y, w, h, 5);
    g.lineStyle(1, 0x2a5c1f, 1);
    g.strokeRoundedRect(x, y, w, h, 5);

    const label = this.add.text(x + w / 2, y + h / 2, '購入', {
      fontFamily: 'Georgia, serif',
      fontSize: '13px',
      color: '#ffffff',
    }).setOrigin(0.5);

    const zone = this.add.zone(x, y, w, h).setOrigin(0).setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => {
      g.clear();
      g.fillStyle(0x5a9c4f, 1);
      g.fillRoundedRect(x, y, w, h, 5);
      g.lineStyle(1, 0x2a5c1f, 1);
      g.strokeRoundedRect(x, y, w, h, 5);
    });
    zone.on('pointerout', () => {
      g.clear();
      g.fillStyle(COL_BTN_BUY, 1);
      g.fillRoundedRect(x, y, w, h, 5);
      g.lineStyle(1, 0x2a5c1f, 1);
      g.strokeRoundedRect(x, y, w, h, 5);
    });
    zone.on('pointerdown', () => {
      onClick();
    });

    // labelをzoneより前面に
    label.setDepth(1);
  }

  private _drawCloseButton(x: number, y: number): void {
    const w = 110;
    const h = 36;

    const g = this.add.graphics();
    g.fillStyle(0x7a2222, 1);
    g.fillRoundedRect(x, y, w, h, 6);
    g.lineStyle(1.5, 0x4a1010, 1);
    g.strokeRoundedRect(x, y, w, h, 6);

    this.add.text(x + w / 2, y + h / 2, '× 閉じる', {
      fontFamily: 'Georgia, serif',
      fontSize: '15px',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(1);

    const zone = this.add.zone(x, y, w, h).setOrigin(0).setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => {
      g.clear();
      g.fillStyle(0x9a3232, 1);
      g.fillRoundedRect(x, y, w, h, 6);
      g.lineStyle(1.5, 0x4a1010, 1);
      g.strokeRoundedRect(x, y, w, h, 6);
    });
    zone.on('pointerout', () => {
      g.clear();
      g.fillStyle(0x7a2222, 1);
      g.fillRoundedRect(x, y, w, h, 6);
      g.lineStyle(1.5, 0x4a1010, 1);
      g.strokeRoundedRect(x, y, w, h, 6);
    });
    zone.on('pointerdown', () => {
      this.scene.start('WorldMapScene');
    });
  }

  private _showFeedback(message: string): void {
    this._feedbackText.setText(message).setAlpha(1);
    this.tweens.add({
      targets: this._feedbackText,
      alpha: 0,
      delay: 1500,
      duration: 400,
    });
  }

}
