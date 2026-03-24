import type { GameState } from '../types/game';

const SAVE_KEY = 'nine-realms-save';

export class SaveManager {
  static save(state: GameState): void {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  }

  static load(): GameState | null {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw === null) return null;
    try {
      const parsed = JSON.parse(raw) as Partial<GameState>;
      // 古いセーブデータに存在しない可能性があるフィールドにフォールバックを設定
      const state: GameState = {
        hp: parsed.hp ?? 100,
        maxHp: parsed.maxHp ?? 100,
        gold: parsed.gold ?? 0,
        equipment: parsed.equipment ?? { weapon: null, armor: null, accessory: null },
        inventory: parsed.inventory ?? [],
        items: parsed.items ?? { numberLight: 0, truthEye: 0, guidingHand: 0 },
        clearedRealms: parsed.clearedRealms ?? [],
        currentRealmId: parsed.currentRealmId ?? 1,
        realmProgress: parsed.realmProgress ?? {},
      };
      return state;
    } catch {
      return null;
    }
  }

  static hasSaveData(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  static deleteSave(): void {
    localStorage.removeItem(SAVE_KEY);
  }
}
