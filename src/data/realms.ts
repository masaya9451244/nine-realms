export interface RealmData {
  id: number;
  name: string;
  description: string;
  difficulty: number; // 空白セル数
  bossDifficulty: number; // ボス戦の空白セル数
  goldReward: number; // 雑魚敵撃破ゴールド
  bossGoldReward: number; // ボス撃破ゴールド
  x: number; // マップ上のX座標（0〜1の比率）
  y: number; // マップ上のY座標（0〜1の比率）
  color: number; // Realmのテーマカラー
  bossName: string;
}

export const REALMS: RealmData[] = [
  { id: 1, name: '草原の王国',   description: '緑豊かな平和な大地',     difficulty: 20, bossDifficulty: 25, goldReward: 15,  bossGoldReward: 60,  x: 0.15, y: 0.75, color: 0x4a9e4a, bossName: 'グリーン卿' },
  { id: 2, name: '森の王国',     description: '深き森に覆われた王国',    difficulty: 25, bossDifficulty: 30, goldReward: 20,  bossGoldReward: 70,  x: 0.30, y: 0.55, color: 0x2d6e2d, bossName: 'フォレスト伯' },
  { id: 3, name: '砂漠の王国',   description: '灼熱の砂に覆われた地',    difficulty: 30, bossDifficulty: 35, goldReward: 25,  bossGoldReward: 80,  x: 0.50, y: 0.70, color: 0xc8a84b, bossName: 'サンド侯爵' },
  { id: 4, name: '雪山の王国',   description: '永遠の雪に閉ざされた地',  difficulty: 35, bossDifficulty: 40, goldReward: 30,  bossGoldReward: 90,  x: 0.70, y: 0.55, color: 0x99ccee, bossName: 'フロスト公爵' },
  { id: 5, name: '海の王国',     description: '荒波に囲まれた島国',      difficulty: 40, bossDifficulty: 45, goldReward: 35,  bossGoldReward: 100, x: 0.85, y: 0.75, color: 0x3a7fbf, bossName: '海神ネプタス' },
  { id: 6, name: '火山の王国',   description: '噴火と炎に支配された地',  difficulty: 45, bossDifficulty: 50, goldReward: 40,  bossGoldReward: 110, x: 0.75, y: 0.35, color: 0xcc4411, bossName: 'マグマ将軍' },
  { id: 7, name: '闇の森',       description: '光の届かぬ呪われた森',    difficulty: 50, bossDifficulty: 55, goldReward: 45,  bossGoldReward: 120, x: 0.55, y: 0.20, color: 0x442266, bossName: 'シャドウ公' },
  { id: 8, name: '天空の王国',   description: '雲の上に浮かぶ神秘の地',  difficulty: 55, bossDifficulty: 60, goldReward: 50,  bossGoldReward: 130, x: 0.30, y: 0.18, color: 0xaabbff, bossName: '天帝アルバス' },
  { id: 9, name: '魔王城',       description: '魔王ナインの最後の砦',    difficulty: 60, bossDifficulty: 65, goldReward: 60,  bossGoldReward: 200, x: 0.12, y: 0.30, color: 0xcc1111, bossName: '魔王ナイン' },
];
