import Phaser from 'phaser';

export class HpBar {
  private _bg: Phaser.GameObjects.Graphics;
  private _bar: Phaser.GameObjects.Graphics;
  private _text: Phaser.GameObjects.Text;
  private _maxHp: number;
  private _currentHp: number;
  private _width: number;
  private _height: number;

  constructor(
    scene: Phaser.Scene,
    x: number, y: number,
    width: number, height: number,
    maxHp: number
  ) {
    this._width = width;
    this._height = height;
    this._maxHp = maxHp;
    this._currentHp = maxHp;

    this._bg = scene.add.graphics();
    this._bar = scene.add.graphics();
    this._text = scene.add.text(x + width / 2, y + height / 2, '', {
      fontFamily: 'Georgia, serif',
      fontSize: 13,
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(1);

    this._drawBg(x, y);
    this._drawBar(x, y);
    this._updateText();
  }

  setHp(hp: number): void {
    this._currentHp = Math.max(0, Math.min(hp, this._maxHp));
    // バーを再描画するには座標が必要なので外部から呼び出す形にする
    // 簡易実装：barのalpha変更でなくscaleで表現
    const ratio = this._currentHp / this._maxHp;
    this._bar.setScale(ratio, 1);
    this._updateText();
  }

  private _drawBg(x: number, y: number): void {
    this._bg.fillStyle(0x111111, 0.85);
    this._bg.fillRoundedRect(x, y, this._width, this._height, 4);
    this._bg.lineStyle(1, 0x555555, 0.8);
    this._bg.strokeRoundedRect(x, y, this._width, this._height, 4);
  }

  private _drawBar(x: number, y: number): void {
    const ratio = this._currentHp / this._maxHp;
    // 緑〜黄〜赤のグラデーション
    const color = ratio > 0.5 ? 0x44cc44 : ratio > 0.25 ? 0xddaa22 : 0xdd2222;
    this._bar.fillStyle(color, 1);
    this._bar.fillRoundedRect(x + 2, y + 2, this._width - 4, this._height - 4, 3);
    // ハイライト
    this._bar.fillStyle(0xffffff, 0.2);
    this._bar.fillRoundedRect(x + 2, y + 2, this._width - 4, (this._height - 4) / 2, 2);
    this._bar.setMask(new Phaser.Display.Masks.GeometryMask(
      this._bar.scene,
      this._bg
    ));
  }

  private _updateText(): void {
    this._text.setText(`HP  ${this._currentHp} / ${this._maxHp}`);
  }
}
