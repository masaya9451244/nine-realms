import Phaser from 'phaser';

export interface ItemSlotConfig {
  key: string;
  label: string;
  icon: string;
  color: number;
}

export const ITEM_CONFIGS: ItemSlotConfig[] = [
  { key: 'numberLight', label: '数字の光',  icon: '💡', color: 0x4488ff },
  { key: 'truthEye',    label: '真実の目',  icon: '👁',  color: 0xaa44ff },
  { key: 'guidingHand', label: '導きの手',  icon: '✋',  color: 0xff8844 },
];

export class ItemSlot {
  private _container: Phaser.GameObjects.Container;
  private _countText: Phaser.GameObjects.Text;
  private _bg: Phaser.GameObjects.Graphics;
  private _config: ItemSlotConfig;
  private _count = 0;
  private _onUse?: () => void;

  constructor(scene: Phaser.Scene, x: number, y: number, config: ItemSlotConfig) {
    this._config = config;
    this._container = scene.add.container(x, y);

    const W = 100, H = 70;

    // 背景
    this._bg = scene.add.graphics();
    this._drawBg(W, H, false);
    this._container.add(this._bg);

    // アイコン
    const icon = scene.add.text(0, -10, config.icon, {
      fontSize: 24,
    }).setOrigin(0.5);
    this._container.add(icon);

    // ラベル
    const label = scene.add.text(0, 16, config.label, {
      fontFamily: 'Georgia, serif',
      fontSize: 11,
      color: '#ccccdd',
    }).setOrigin(0.5);
    this._container.add(label);

    // カウント
    this._countText = scene.add.text(36, -28, '×0', {
      fontFamily: 'Arial',
      fontSize: 14,
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(1, 0);
    this._container.add(this._countText);

    // クリック判定
    this._container.setInteractive(
      new Phaser.Geom.Rectangle(-W / 2, -H / 2, W, H),
      Phaser.Geom.Rectangle.Contains
    );
    this._container.on('pointerover', () => {
      if (this._count > 0) {
        scene.input.setDefaultCursor('pointer');
        this._drawBg(W, H, true);
      }
    });
    this._container.on('pointerout', () => {
      scene.input.setDefaultCursor('default');
      this._drawBg(W, H, false);
    });
    this._container.on('pointerdown', () => {
      if (this._count > 0) this._onUse?.();
    });
  }

  setCount(count: number): void {
    this._count = count;
    this._countText.setText(`×${count}`);
    this._countText.setColor(count > 0 ? '#ffee88' : '#666666');
    this._container.setAlpha(count > 0 ? 1 : 0.5);
  }

  setOnUse(cb: () => void): void {
    this._onUse = cb;
  }

  private _drawBg(W: number, H: number, hover: boolean): void {
    this._bg.clear();
    const color = hover ? this._config.color : 0x1a1a2e;
    const alpha = hover ? 0.7 : 0.85;
    this._bg.fillStyle(color, alpha);
    this._bg.fillRoundedRect(-W / 2, -H / 2, W, H, 8);
    this._bg.lineStyle(1, hover ? 0xffffff : this._config.color, hover ? 0.9 : 0.5);
    this._bg.strokeRoundedRect(-W / 2, -H / 2, W, H, 8);
  }
}
