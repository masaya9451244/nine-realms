export interface BattleConfig {
  realmId: number;
  maxHp: number;
  baseBlankCount: number;   // 元の空白数
  blankReduction: number;   // 武器による削減
  timeDamageReduction: number;
  missDamageReduction: number;
}

const TIME_DAMAGE_INTERVAL_MS = 30000;

export class BattleManager {
  /**
   * 時間ダメージ量（30秒ごと）
   * functional-design.md の仕様: 5ダメージ（アクセサリーで軽減）
   * realmIdに関わらず固定の5ダメージを基本とし、軽減を引く
   */
  getTimeDamage(realmId: number, timeDamageReduction: number): number {
    // realmId を参照した将来的な拡張に備えて引数に含める
    void realmId;
    return Math.max(1, 5 - timeDamageReduction);
  }

  /**
   * ミスダメージ量
   * functional-design.md の仕様: 10ダメージ（アクセサリーで軽減）
   */
  getMissDamage(realmId: number, missDamageReduction: number): number {
    void realmId;
    return Math.max(1, 10 - missDamageReduction);
  }

  /**
   * ダメージ発生間隔 (ms) — 30000ms 固定
   */
  getDamageInterval(_realmId: number): number {
    return TIME_DAMAGE_INTERVAL_MS;
  }

  /**
   * 武器による削減を反映した実際の空白マス数
   */
  getActualBlankCount(baseBlank: number, reduction: number): number {
    return Math.max(17, baseBlank - reduction); // 数独として成立する最低空白数を17とする
  }

  /**
   * HP が 0 以下かどうか
   */
  isDefeated(hp: number): boolean {
    return hp <= 0;
  }
}
