import Phaser from 'phaser';
import { GAME_CONFIG, COLORS } from './config';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { OpeningScene } from './scenes/OpeningScene';
import { WorldMapScene } from './scenes/WorldMapScene';
import { BattleScene } from './scenes/BattleScene';
import { ShopScene } from './scenes/ShopScene';
import { DialogScene } from './scenes/DialogScene';
import { RealmClearScene } from './scenes/RealmClearScene';
import { EndingScene } from './scenes/EndingScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_CONFIG.WIDTH,
  height: GAME_CONFIG.HEIGHT,
  backgroundColor: COLORS.BG_DARK,
  scene: [
    EndingScene,
    BootScene,
    TitleScene,
    OpeningScene,
    WorldMapScene,
    BattleScene,
    ShopScene,
    DialogScene,
    RealmClearScene,
  ],
  parent: 'app',
};

new Phaser.Game(config);
