import { EQUIPMENT_LIST } from '../data/equipment';

export class EquipmentManager {
  /**
   * 防具による最大HP計算
   */
  getMaxHp(baseHp: number, armorId: string | null): number {
    if (!armorId) return baseHp;
    const armor = EQUIPMENT_LIST.find(e => e.id === armorId && e.slot === 'armor');
    return baseHp + (armor?.effect.maxHpBonus ?? 0);
  }

  /**
   * 武器による空白マス削減量
   */
  getBlankReduction(weaponId: string | null): number {
    if (!weaponId) return 0;
    const weapon = EQUIPMENT_LIST.find(e => e.id === weaponId && e.slot === 'weapon');
    return weapon?.effect.blankReduction ?? 0;
  }

  /**
   * アクセサリーによる時間ダメージ軽減量
   */
  getTimeDamageReduction(accessoryId: string | null): number {
    if (!accessoryId) return 0;
    const accessory = EQUIPMENT_LIST.find(e => e.id === accessoryId && e.slot === 'accessory');
    return accessory?.effect.timeDamageReduction ?? 0;
  }

  /**
   * アクセサリーによるミスダメージ軽減量
   */
  getMissDamageReduction(accessoryId: string | null): number {
    if (!accessoryId) return 0;
    const accessory = EQUIPMENT_LIST.find(e => e.id === accessoryId && e.slot === 'accessory');
    return accessory?.effect.missDamageReduction ?? 0;
  }

  /**
   * インベントリに装備が含まれているか（装備可能か）
   */
  canEquip(equipId: string, inventory: string[]): boolean {
    return inventory.includes(equipId);
  }

  /**
   * ゴールドが足りて購入可能か
   */
  canBuy(equipId: string, gold: number): boolean {
    const equip = EQUIPMENT_LIST.find(e => e.id === equipId);
    if (!equip || equip.price === null) return false;
    return gold >= equip.price;
  }
}
