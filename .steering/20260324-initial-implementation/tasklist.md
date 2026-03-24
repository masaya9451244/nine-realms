# タスクリスト - Nine Realms 初回実装

## Phase 1: 環境セットアップ

- [ ] Vite + TypeScript プロジェクト作成
  - 仕様参照: `docs/architecture.md`
  - 完了条件: `npm run dev` でブラウザに空画面が表示される
- [ ] Phaser 3 インストール
  - 完了条件: `import Phaser from 'phaser'` がエラーなく動作する
- [ ] Vitest インストール・設定
  - 完了条件: `npm run test` でテストが実行できる
- [ ] ディレクトリ構造作成
  - 仕様参照: `docs/repository-structure.md`
  - 完了条件: `src/scenes/`, `src/game/`, `src/ui/`, `src/types/`, `src/data/`, `tests/` が存在する
- [ ] `src/config.ts` 作成
  - 完了条件: COLORS, FONTS, EVENTS, GAME_CONFIG（画面サイズ等）が定義されている

## Phase 2: 数独コアロジック

- [ ] `src/types/sudoku.ts` 作成
  - 仕様参照: `docs/glossary.md`
  - 完了条件: SudokuPuzzle, Cell 等の型定義が揃っている
- [ ] `src/game/SudokuGenerator.ts` 実装
  - 仕様参照: `docs/functional-design.md` § Realm一覧
  - 完了条件: 難易度（空白数）を指定して有効な数独問題を生成できる
- [ ] `src/game/SudokuValidator.ts` 実装
  - 完了条件: 正解判定・候補数字計算・ミス検出が正しく動作する
- [ ] `tests/SudokuGenerator.test.ts` 作成
  - 完了条件: 生成された問題が有効な数独であることを検証するテストが通過する
- [ ] `tests/SudokuValidator.test.ts` 作成
  - 完了条件: 正解判定・候補数字・ミス検出のテストが全通過する

## Phase 3: UI実装（UI部）← オーナー承認まで反復

- [ ] `src/scenes/BootScene.ts` 実装
  - 完了条件: アセット読み込み後に TitleScene へ遷移する
- [ ] `src/scenes/TitleScene.ts` 実装
  - 完了条件: タイトルロゴ・「はじめから」「つづきから」ボタンが表示される
- [ ] `src/scenes/OpeningScene.ts` 実装
  - 仕様参照: `docs/functional-design.md` § ストーリーテキスト設計
  - 完了条件: オープニングテキストがアニメーション表示され、クリックで次へ進める
- [ ] `src/ui/DialogBox.ts` 実装
  - 完了条件: テキストを渡すと会話ボックスとして表示できる
- [ ] `src/scenes/WorldMapScene.ts` 実装
  - 仕様参照: `docs/functional-design.md` § ワールドマップ設計
  - 完了条件: 9つのRealmがマップ上に表示され、クリアRealm・未クリアが視覚的に区別できる
- [ ] ワールドマップにショップボタン追加
  - 完了条件: ショップボタンをクリックすると ShopScene へ遷移する
- [ ] `src/scenes/ShopScene.ts` 実装
  - 仕様参照: `docs/functional-design.md` § ショップ設計
  - 完了条件: 装備・ヒントアイテムの一覧と価格が表示される（購入ロジックはPhase 4）
- [ ] `src/scenes/BattleScene.ts` UIのみ実装
  - 仕様参照: `docs/functional-design.md` § バトルシステム設計
  - 完了条件: 数独グリッド・HPバー・アイテムスロットが表示される（ロジックはPhase 4）
- [ ] `src/ui/SudokuGrid.ts` 実装
  - 完了条件: 9×9グリッドが表示され、セル選択・ハイライトが動作する
- [ ] `src/ui/HpBar.ts` 実装
  - 完了条件: HP値を渡すとバーが正しく表示される
- [ ] `src/ui/ItemSlot.ts` 実装
  - 完了条件: アイテムスロットが表示され、所持・未所持で見た目が変わる
- [ ] `src/scenes/DialogScene.ts` 実装
  - 完了条件: NPCセリフが表示され、クリックで次のテキストへ進める
- [ ] `src/scenes/RealmClearScene.ts` 実装
  - 完了条件: クリア演出テキストが表示され、ワールドマップへ戻れる
- [ ] `src/scenes/EndingScene.ts` 実装
  - 完了条件: エンディングテキストが表示される
- [ ] **オーナー確認・承認** ← 全シーンOKになるまで反復

## Phase 4: ロジック統合（開発部）← Phase 3 承認後に開始

- [ ] `src/types/game.ts` 作成
  - 仕様参照: `docs/glossary.md`, `docs/functional-design.md`
  - 完了条件: SaveData, Equipment 等の型定義が揃っている
- [ ] `src/types/equipment.ts` 作成
  - 完了条件: 装備・ヒントアイテムの型定義が揃っている
- [ ] `src/data/realms.ts` 作成
  - 仕様参照: `docs/functional-design.md` § Realm一覧
  - 完了条件: 9つのRealmの設定データ（名前・難易度・ゴールド報酬など）が定義されている
- [ ] `src/data/equipment.ts` 作成
  - 仕様参照: `docs/functional-design.md` § 装備一覧
  - 完了条件: 9種類の装備マスターデータが定義されている
- [ ] `src/data/story.ts` 作成
  - 仕様参照: `docs/functional-design.md` § ストーリーテキスト設計
  - 完了条件: オープニング・NPC・ボスセリフ・クリアテキストが定義されている
- [ ] `src/game/BattleManager.ts` 実装
  - 仕様参照: `docs/functional-design.md` § HPとダメージシステム設計
  - 完了条件: 時間ダメージ・ミスダメージ・HP0判定が正しく動作する
- [ ] `src/game/EquipmentManager.ts` 実装
  - 仕様参照: `docs/functional-design.md` § 装備システム設計
  - 完了条件: 装備効果（空白数減少・HP増加・ダメージ軽減）が正しく計算される
- [ ] `tests/EquipmentManager.test.ts` 作成
  - 完了条件: 装備効果の計算テストが全通過する
- [ ] `BattleScene` にSudokuGenerator/Validator を組み込む
  - 完了条件: 実際の数独パズルが表示され、正解判定が動作する
- [ ] `BattleScene` に BattleManager を組み込む
  - 完了条件: 時間経過・ミスでHPが減り、HP0でバトル失敗・マップへ戻る
- [ ] ヒントアイテムの効果実装（BattleScene）
  - 仕様参照: `docs/functional-design.md` § アイテム一覧
  - 完了条件: 数字の光・真実の目・導きの手が正しく動作する
- [ ] ShopScene に購入ロジックを組み込む
  - 完了条件: ゴールドを消費して装備・ヒントアイテムを購入できる
- [ ] ゴールド獲得フロー実装
  - 完了条件: 雑魚敵・ボス撃破時にゴールドが加算される
- [ ] Realm進行管理実装（WorldMapScene）
  - 完了条件: 雑魚敵 → ボス → Realmクリアの流れが動作する

## Phase 5: セーブ・ロード・仕上げ

- [ ] `src/game/SaveManager.ts` 実装
  - 仕様参照: `docs/functional-design.md` § セーブデータ
  - 完了条件: ゲーム進捗をLocalStorageに保存・読み込みできる
- [ ] TitleScene に「つづきから」機能を組み込む
  - 完了条件: セーブデータがある場合、途中から再開できる
- [ ] 全体通しプレイ・バグ修正
  - 完了条件: Realm1〜9まで通しでプレイできる
- [ ] **QA: 仕様照合・バグ確認**

## 進捗サマリー

| Phase | 状態 |
|---|---|
| Phase 1: 環境セットアップ | ✅ 完了 |
| Phase 2: 数独コアロジック | ✅ 完了 |
| Phase 3: UI実装 | ✅ 完了 (2026-03-24 オーナー承認) |
| Phase 4: ロジック統合 | 🔄 進行中 |
| Phase 5: セーブ・ロード・仕上げ | ⬜ 未着手 |
