import Phaser from 'phaser';
import { COLORS, FONTS, GAME_CONFIG } from '../config';

const OPENING_LINES = [
  '遥か昔、この世界は一つだった。',
  '豊かな大地、澄んだ空、\n人々は平和に暮らしていた。',
  'しかし――',
  '魔王ナインが現れた。',
  '彼は世界を9つのRealm（王国）に引き裂き、\nそれぞれに手下を君臨させた。',
  '人々は苦しみ、希望を失っていった。',
  'そして今――',
  'あなたは伝説の数術師の血を引く勇者。',
  '9つのRealmを解放し、\n魔王ナインを打ち倒せ！',
];

export class OpeningScene extends Phaser.Scene {
  private _currentLine = 0;
  private _textObj!: Phaser.GameObjects.Text;
  private _isAnimating = false;

  constructor() {
    super({ key: 'OpeningScene' });
  }

  create(): void {
    const { WIDTH, HEIGHT } = GAME_CONFIG;

    // 背景
    this.add.rectangle(0, 0, WIDTH, HEIGHT, COLORS.BG_DARK).setOrigin(0, 0);

    // テキスト表示エリア
    this._textObj = this.add.text(WIDTH / 2, HEIGHT / 2, '', {
      fontFamily: FONTS.DEFAULT,
      fontSize: 28,
      color: '#ffffff',
      align: 'center',
      lineSpacing: 16,
      wordWrap: { width: 700 },
    }).setOrigin(0.5).setAlpha(0);

    // クリック or スペースで次へ
    this.input.on('pointerdown', () => this._nextLine());
    this.input.keyboard?.on('keydown-SPACE', () => this._nextLine());
    this.input.keyboard?.on('keydown-ENTER', () => this._nextLine());

    // ヒント
    this.add.text(WIDTH / 2, HEIGHT - 36, 'クリック または スペースキーで次へ', {
      fontFamily: FONTS.DEFAULT,
      fontSize: 14,
      color: '#555577',
    }).setOrigin(0.5);

    this._showLine();
  }

  private _showLine(): void {
    if (this._currentLine >= OPENING_LINES.length) {
      this.scene.start('WorldMapScene');
      return;
    }

    this._isAnimating = true;
    const line = OPENING_LINES[this._currentLine];

    // フェードアウト → テキスト更新 → フェードイン
    this.tweens.add({
      targets: this._textObj,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        this._textObj.setText(line);
        this.tweens.add({
          targets: this._textObj,
          alpha: 1,
          duration: 500,
          onComplete: () => {
            this._isAnimating = false;
          },
        });
      },
    });
  }

  private _nextLine(): void {
    if (this._isAnimating) return;
    this._currentLine++;
    this._showLine();
  }
}
