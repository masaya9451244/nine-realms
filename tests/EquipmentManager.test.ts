import { describe, it, expect, beforeEach } from 'vitest';
import { BattleManager } from '../src/game/BattleManager';
import { EquipmentManager } from '../src/game/EquipmentManager';

// ─── BattleManager ──────────────────────────────────────────────────────────

describe('BattleManager', () => {
  let manager: BattleManager;

  beforeEach(() => {
    manager = new BattleManager();
  });

  describe('getTimeDamage', () => {
    it('軽減なしの場合は5ダメージを返す', () => {
      expect(manager.getTimeDamage(1, 0)).toBe(5);
    });

    it('軽減1の場合は4ダメージを返す', () => {
      expect(manager.getTimeDamage(1, 1)).toBe(4);
    });

    it('軽減3の場合は2ダメージを返す', () => {
      expect(manager.getTimeDamage(1, 3)).toBe(2);
    });

    it('軽減量が5以上でも最低1ダメージを返す', () => {
      expect(manager.getTimeDamage(1, 10)).toBe(1);
    });

    it('異なるrealmIdでも同じ結果を返す', () => {
      expect(manager.getTimeDamage(9, 0)).toBe(5);
    });
  });

  describe('getMissDamage', () => {
    it('軽減なしの場合は10ダメージを返す', () => {
      expect(manager.getMissDamage(1, 0)).toBe(10);
    });

    it('軽減5の場合は5ダメージを返す', () => {
      expect(manager.getMissDamage(1, 5)).toBe(5);
    });

    it('軽減量が10以上でも最低1ダメージを返す', () => {
      expect(manager.getMissDamage(1, 15)).toBe(1);
    });
  });

  describe('getDamageInterval', () => {
    it('30000ms を返す', () => {
      expect(manager.getDamageInterval(1)).toBe(30000);
    });

    it('どのrealmIdでも30000ms を返す', () => {
      expect(manager.getDamageInterval(9)).toBe(30000);
    });
  });

  describe('getActualBlankCount', () => {
    it('削減なしの場合は元の空白数を返す', () => {
      expect(manager.getActualBlankCount(30, 0)).toBe(30);
    });

    it('削減を反映した空白数を返す', () => {
      expect(manager.getActualBlankCount(30, 5)).toBe(25);
    });

    it('削減後が17未満になる場合は17を返す', () => {
      expect(manager.getActualBlankCount(20, 10)).toBe(17);
    });

    it('削減後がちょうど17の場合は17を返す', () => {
      expect(manager.getActualBlankCount(17, 0)).toBe(17);
    });
  });

  describe('isDefeated', () => {
    it('HP が 0 の場合は true を返す', () => {
      expect(manager.isDefeated(0)).toBe(true);
    });

    it('HP が 負の場合は true を返す', () => {
      expect(manager.isDefeated(-1)).toBe(true);
    });

    it('HP が 1 以上の場合は false を返す', () => {
      expect(manager.isDefeated(1)).toBe(false);
    });

    it('HP が 100 の場合は false を返す', () => {
      expect(manager.isDefeated(100)).toBe(false);
    });
  });
});

// ─── EquipmentManager ───────────────────────────────────────────────────────

describe('EquipmentManager', () => {
  let manager: EquipmentManager;

  beforeEach(() => {
    manager = new EquipmentManager();
  });

  describe('getMaxHp', () => {
    it('防具なしの場合は基本HPを返す', () => {
      expect(manager.getMaxHp(100, null)).toBe(100);
    });

    it('革の鎧（+50）を装備した場合は150を返す', () => {
      expect(manager.getMaxHp(100, 'leather-armor')).toBe(150);
    });

    it('鉄の鎧（+100）を装備した場合は200を返す', () => {
      expect(manager.getMaxHp(100, 'iron-armor')).toBe(200);
    });

    it('守護の鎧（+150）を装備した場合は250を返す', () => {
      expect(manager.getMaxHp(100, 'guardian-armor')).toBe(250);
    });

    it('存在しないIDの場合は基本HPを返す', () => {
      expect(manager.getMaxHp(100, 'unknown-armor')).toBe(100);
    });
  });

  describe('getBlankReduction', () => {
    it('武器なしの場合は0を返す', () => {
      expect(manager.getBlankReduction(null)).toBe(0);
    });

    it('木の剣（-5）の場合は5を返す', () => {
      expect(manager.getBlankReduction('wooden-sword')).toBe(5);
    });

    it('鉄の剣（-10）の場合は10を返す', () => {
      expect(manager.getBlankReduction('iron-sword')).toBe(10);
    });

    it('伝説の剣（-15）の場合は15を返す', () => {
      expect(manager.getBlankReduction('legend-sword')).toBe(15);
    });

    it('存在しないIDの場合は0を返す', () => {
      expect(manager.getBlankReduction('unknown-weapon')).toBe(0);
    });
  });

  describe('getTimeDamageReduction', () => {
    it('アクセサリーなしの場合は0を返す', () => {
      expect(manager.getTimeDamageReduction(null)).toBe(0);
    });

    it('お守り（-1）の場合は1を返す', () => {
      expect(manager.getTimeDamageReduction('omamori')).toBe(1);
    });

    it('不死鳥の羽（-3）の場合は3を返す', () => {
      expect(manager.getTimeDamageReduction('phoenix-feather')).toBe(3);
    });

    it('賢者の指輪はtimeDamageReductionを持たないので0を返す', () => {
      expect(manager.getTimeDamageReduction('sage-ring')).toBe(0);
    });
  });

  describe('getMissDamageReduction', () => {
    it('アクセサリーなしの場合は0を返す', () => {
      expect(manager.getMissDamageReduction(null)).toBe(0);
    });

    it('賢者の指輪（-5）の場合は5を返す', () => {
      expect(manager.getMissDamageReduction('sage-ring')).toBe(5);
    });

    it('お守りはmissDamageReductionを持たないので0を返す', () => {
      expect(manager.getMissDamageReduction('omamori')).toBe(0);
    });
  });

  describe('canEquip', () => {
    it('インベントリに含まれている場合はtrueを返す', () => {
      expect(manager.canEquip('wooden-sword', ['wooden-sword', 'leather-armor'])).toBe(true);
    });

    it('インベントリに含まれていない場合はfalseを返す', () => {
      expect(manager.canEquip('iron-sword', ['wooden-sword'])).toBe(false);
    });

    it('空のインベントリの場合はfalseを返す', () => {
      expect(manager.canEquip('wooden-sword', [])).toBe(false);
    });
  });

  describe('canBuy', () => {
    it('ゴールドが足りる場合はtrueを返す', () => {
      expect(manager.canBuy('wooden-sword', 100)).toBe(true);
    });

    it('ゴールドがちょうどの場合はtrueを返す', () => {
      expect(manager.canBuy('wooden-sword', 100)).toBe(true);
    });

    it('ゴールドが足りない場合はfalseを返す', () => {
      expect(manager.canBuy('wooden-sword', 99)).toBe(false);
    });

    it('ドロップ専用装備（price=null）はfalseを返す', () => {
      expect(manager.canBuy('iron-sword', 9999)).toBe(false);
    });

    it('存在しないIDの場合はfalseを返す', () => {
      expect(manager.canBuy('unknown', 9999)).toBe(false);
    });
  });
});
