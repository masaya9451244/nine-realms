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
      return JSON.parse(raw) as GameState;
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
