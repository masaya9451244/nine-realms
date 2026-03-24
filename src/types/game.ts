export interface GameState {
  hp: number;
  maxHp: number;
  gold: number;
  equipment: {
    weapon: string | null;
    armor: string | null;
    accessory: string | null;
  };
  inventory: string[];        // 所持装備IDリスト
  items: {
    numberLight: number;      // 数字の光
    truthEye: number;         // 真実の目
    guidingHand: number;      // 導きの手
  };
  clearedRealms: number[];    // クリア済みRealmのID
  currentRealmId: number;     // 現在挑戦中のRealm ID
}

export const INITIAL_GAME_STATE: GameState = {
  hp: 100, maxHp: 100, gold: 0,
  equipment: { weapon: null, armor: null, accessory: null },
  inventory: [],
  items: { numberLight: 0, truthEye: 0, guidingHand: 0 },
  clearedRealms: [], currentRealmId: 1,
};
