import Phaser from 'phaser';
import { INITIAL_GAME_STATE } from '../types/game';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // ローディングバー表示
    const { width, height } = this.scale;
    const bar = this.add.graphics();
    const bg = this.add.graphics();

    bg.fillStyle(0x333333);
    bg.fillRect(width / 2 - 200, height / 2 - 15, 400, 30);

    this.load.on('progress', (value: number) => {
      bar.clear();
      bar.fillStyle(0xf4d03f);
      bar.fillRect(width / 2 - 200, height / 2 - 15, 400 * value, 30);
    });

    // アセットは現在なし（将来ここに追加）
  }

  create(): void {
    // GameStateの初期化（初回のみ）
    if (!this.game.registry.get('gameState')) {
      this.game.registry.set('gameState', { ...INITIAL_GAME_STATE });
    }
    this.scene.start('TitleScene');
  }
}
