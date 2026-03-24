# 実装設計 - Nine Realms 初回実装

## 実装アプローチ

### フェーズ分割

実装を以下の順で進める。UIが承認されるまで開発部（ロジック）は動かない。

```
Phase 1: 環境セットアップ
Phase 2: 数独コアロジック（UIなし・テスト可能な純粋ロジック）
Phase 3: UI実装（UI部担当） ← オーナー承認まで反復
Phase 4: ロジック統合（開発部担当） ← UI承認後に開始
Phase 5: セーブ・ロード・仕上げ
```

## Phase 1: 環境セットアップ

### 作業内容
- Vite + TypeScript プロジェクト作成
- Phaser 3 インストール
- Vitest インストール
- ディレクトリ構造作成（`docs/architecture.md` 準拠）
- `src/config.ts` の初期定義（COLORS, FONTS, EVENTS, GAME_CONFIG）

### 完了条件
- `npm run dev` でブラウザに Phaser の空画面が表示される
- `npm run test` でテストが実行できる

## Phase 2: 数独コアロジック

### 作業内容
- `src/game/SudokuGenerator.ts` - 難易度（空白数）指定で問題生成
- `src/game/SudokuValidator.ts` - 正解判定・候補数字計算・ミス検出
- `tests/` にユニットテスト作成

### 設計方針
- Phaserに依存しない純粋なTypeScriptで実装
- 難易度は空白セル数で制御（`docs/functional-design.md` のRealm一覧参照）

### 完了条件
- 全テスト通過
- 難易度別に問題が生成できる

## Phase 3: UI実装（UI部）

### 作業内容・順序

1. **BootScene + TitleScene** - アセット読み込み・タイトル画面
2. **OpeningScene** - オープニングテキスト演出
3. **WorldMapScene** - ワールドマップ・Realm選択
4. **BattleScene（UIのみ）** - 数独グリッド・HPバー・アイテムスロット（ロジックなし）
5. **ShopScene** - ショップ画面
6. **DialogScene** - NPC会話テキストボックス
7. **RealmClearScene + EndingScene** - クリア・エンディング演出

### UI承認ルール
- 各シーンをオーナーに確認
- 修正 → 再確認 → OKまで反復
- **全シーンOK後に Phase 4 へ**

## Phase 4: ロジック統合（開発部）

### 作業内容
- `BattleScene` にSudokuGenerator/Validator を組み込む
- HP・ダメージシステム実装（`BattleManager.ts`）
- 装備効果の計算実装（`EquipmentManager.ts`）
- ヒントアイテムの効果実装
- ゴールド獲得・消費フロー
- Realm進行管理（雑魚敵 → ボス → クリア）

### 完了条件
- Realm1〜9まで通しでプレイできる
- HPがゼロになるとバトル失敗・マップに戻る
- 装備・ヒントアイテムの効果が正しく反映される

## Phase 5: セーブ・ロード・仕上げ

### 作業内容
- `SaveManager.ts` 実装（LocalStorage）
- タイトル画面からセーブデータをロードして再開
- ストーリーテキスト全入力（`src/data/story.ts`）
- 装備マスターデータ全入力（`src/data/equipment.ts`）
- 全体動作確認・バグ修正

## 変更するファイル・新規作成ファイル

### 新規作成（全ファイル）
`docs/architecture.md` および `docs/repository-structure.md` のディレクトリ構成に準拠。

## 影響範囲

初回実装のため既存コードへの影響なし。

## 参照ドキュメント

- `docs/product-requirements.md`
- `docs/functional-design.md`
- `docs/architecture.md`
- `docs/repository-structure.md`
- `docs/development-guidelines.md`
- `docs/glossary.md`
