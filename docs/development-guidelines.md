# 開発ガイドライン - Nine Realms

## コーディング規約

### 基本方針
- TypeScript の型を明示的に定義する（`any` 禁止）
- 関数は単一責務を守る（1関数100行以内）
- マジックナンバーは `config.ts` または `src/data/` に定数として定義する

### ファイル構成
- 1ファイル500行以内を目安にする
- シーンクラスはPhaserの `create()` / `update()` に処理を集中させず、UIや管理クラスに委譲する

## 命名規則

### ファイル名
- シーン: `PascalCase` + `Scene.ts`（例: `BattleScene.ts`）
- 管理クラス: `PascalCase` + `Manager.ts`（例: `SaveManager.ts`）
- UIコンポーネント: `PascalCase.ts`（例: `HpBar.ts`）
- データファイル: `camelCase.ts`（例: `realms.ts`）

### 変数・関数名
- 変数・関数: `camelCase`
- クラス・型・インターフェース: `PascalCase`
- 定数: `UPPER_SNAKE_CASE`
- プライベートプロパティ: `_camelCase`（先頭アンダースコア）

### イベント名
- Phaserのグローバルイベント名は `config.ts` の `EVENTS` オブジェクトに定数として定義する

```typescript
// config.ts
export const EVENTS = {
  BATTLE_START: 'battle-start',
  BATTLE_WIN: 'battle-win',
  BATTLE_LOSE: 'battle-lose',
  REALM_CLEAR: 'realm-clear',
} as const;
```

## スタイリング規約

- UIの色・フォントサイズ・余白は `config.ts` の `COLORS` / `FONTS` に定数として定義
- 画面サイズは固定 1280×720px

```typescript
// config.ts
export const COLORS = {
  PRIMARY: 0xf4d03f,
  DANGER: 0xe74c3c,
  SUCCESS: 0x2ecc71,
  BG_DARK: 0x1a1a2e,
} as const;

export const FONTS = {
  DEFAULT: 'Arial',
  SIZE_SMALL: 14,
  SIZE_MEDIUM: 20,
  SIZE_LARGE: 32,
} as const;
```

## テスト規約

### テスト対象
UIに依存しない純粋なロジックをテストする：
- `SudokuGenerator.ts` - 生成した問題が有効な数独か
- `SudokuValidator.ts` - 正解判定・候補数字計算が正しいか
- `EquipmentManager.ts` - 装備効果の計算が正しいか

### テスト対象外
- Phaserシーン（UIテストは手動確認）
- `SaveManager.ts`（LocalStorageのモックが複雑なため手動確認）

### テストファイル配置
```
tests/
└── [対象ファイル名].test.ts
```

### テストの書き方
```typescript
import { describe, it, expect } from 'vitest';

describe('SudokuValidator', () => {
  it('正しい数独を正解と判定する', () => {
    // ...
  });

  it('空白があれば未完了と判定する', () => {
    // ...
  });
});
```

## Git規約

### ブランチ戦略
- `main`: 動作する状態を常に保つ
- `feature/[機能名]`: 機能追加
- `fix/[バグ名]`: バグ修正

### コミットメッセージ
```
[種別]: [内容]

例:
feat: BattleSceneにHPバーを追加
fix: 数独生成ロジックの無限ループを修正
docs: functional-design.mdを更新
```

| 種別 | 用途 |
|---|---|
| feat | 新機能追加 |
| fix | バグ修正 |
| refactor | リファクタリング |
| test | テスト追加・修正 |
| docs | ドキュメント更新 |
| chore | ビルド・設定変更 |

## 変更履歴

- 2026-03-24: 初版作成
