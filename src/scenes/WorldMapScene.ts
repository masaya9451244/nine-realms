import Phaser from 'phaser';
import { COLORS, FONTS, GAME_CONFIG } from '../config';

export class WorldMapScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WorldMapScene' });
  }

  create(): void {
    const { WIDTH, HEIGHT } = GAME_CONFIG;

    this.add.rectangle(0, 0, WIDTH, HEIGHT, COLORS.BG_DARK).setOrigin(0, 0);

    this.add.text(WIDTH / 2, HEIGHT / 2, 'ワールドマップ\n（実装中）', {
      fontFamily: FONTS.DEFAULT,
      fontSize: FONTS.SIZE_LARGE,
      color: '#ffffff',
      align: 'center',
    }).setOrigin(0.5);
  }
}
