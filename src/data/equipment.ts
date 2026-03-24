export interface EquipmentData {
  id: string;
  name: string;
  slot: 'weapon' | 'armor' | 'accessory';
  effect: {
    blankReduction?: number;        // 空白マス削減（武器）
    maxHpBonus?: number;            // 最大HP増加（防具）
    timeDamageReduction?: number;   // 時間ダメージ軽減（アクセサリー）
    missDamageReduction?: number;   // ミスダメージ軽減（アクセサリー）
  };
  price: number | null;             // null=ドロップのみ
  dropRealmId: number | null;       // ドロップするRealmのボスID
}

export const EQUIPMENT_LIST: EquipmentData[] = [
  {
    id: 'wooden-sword',
    name: '木の剣',
    slot: 'weapon',
    effect: { blankReduction: 5 },
    price: 100,
    dropRealmId: null,
  },
  {
    id: 'iron-sword',
    name: '鉄の剣',
    slot: 'weapon',
    effect: { blankReduction: 10 },
    price: null,
    dropRealmId: 3,
  },
  {
    id: 'legend-sword',
    name: '伝説の剣',
    slot: 'weapon',
    effect: { blankReduction: 15 },
    price: null,
    dropRealmId: 7,
  },
  {
    id: 'leather-armor',
    name: '革の鎧',
    slot: 'armor',
    effect: { maxHpBonus: 50 },
    price: 150,
    dropRealmId: null,
  },
  {
    id: 'iron-armor',
    name: '鉄の鎧',
    slot: 'armor',
    effect: { maxHpBonus: 100 },
    price: null,
    dropRealmId: 5,
  },
  {
    id: 'guardian-armor',
    name: '守護の鎧',
    slot: 'armor',
    effect: { maxHpBonus: 150 },
    price: null,
    dropRealmId: 8,
  },
  {
    id: 'omamori',
    name: 'お守り',
    slot: 'accessory',
    effect: { timeDamageReduction: 1 },
    price: 80,
    dropRealmId: null,
  },
  {
    id: 'sage-ring',
    name: '賢者の指輪',
    slot: 'accessory',
    effect: { missDamageReduction: 5 },
    price: null,
    dropRealmId: 4,
  },
  {
    id: 'phoenix-feather',
    name: '不死鳥の羽',
    slot: 'accessory',
    effect: { timeDamageReduction: 3 },
    price: null,
    dropRealmId: 9,
  },
];

export function findEquipment(id: string): EquipmentData | undefined {
  return EQUIPMENT_LIST.find(e => e.id === id);
}
