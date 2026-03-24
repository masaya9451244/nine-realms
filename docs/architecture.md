# 技術仕様書 - Nine Realms

## テクノロジースタック

| カテゴリ | 技術 | バージョン |
|---|---|---|
| ゲームエンジン | Phaser | 3.x |
| 言語 | TypeScript | 5.x |
| ビルドツール | Vite | 6.x |
| テスト | Vitest | 3.x |
| パッケージマネージャー | npm | - |

## システム構成

```
ブラウザ
└── Phaser 3 ゲームエンジン
    ├── シーン管理（Scene Manager）
    ├── アセット管理（Asset Loader）
    ├── 入力管理（Input Manager）
    └── LocalStorage（セーブデータ）
```

バックエンドなし。完全クライアントサイドで動作。

## ディレクトリ構成

```
src/
├── main.ts                  # エントリーポイント・Phaser設定
├── config.ts                # ゲーム定数（画面サイズ・色・イベント名など）
├── types/
│   ├── game.ts              # ゲーム全体の型定義
│   └── sudoku.ts            # 数独関連の型定義
├── scenes/
│   ├── BootScene.ts         # アセット読み込み
│   ├── TitleScene.ts        # タイトル画面
│   ├── OpeningScene.ts      # オープニング演出
│   ├── WorldMapScene.ts     # ワールドマップ
│   ├── DialogScene.ts       # NPC会話
│   ├── BattleScene.ts       # 数独バトル
│   ├── RealmClearScene.ts   # Realmクリア演出
│   └── EndingScene.ts       # エンディング
├── game/
│   ├── SudokuGenerator.ts   # 数独問題生成ロジック
│   ├── SudokuValidator.ts   # 数独正解判定ロジック
│   └── SaveManager.ts       # LocalStorageのセーブ・ロード
├── ui/
│   ├── SudokuGrid.ts        # 数独グリッドUI（Phaserオブジェクト）
│   └── DialogBox.ts         # 会話テキストボックスUI
└── data/
    ├── realms.ts            # Realm設定データ（名前・難易度・ボス名など）
    └── story.ts             # ストーリーテキスト一覧
```

## 技術的制約と要件

- **対応環境**: デスクトップブラウザ（Chrome / Firefox / Safari）
- **画面サイズ**: 1280×720px 固定
- **データ永続化**: LocalStorage のみ（サーバー不要）
- **外部通信**: なし

## パフォーマンス要件

- 初回読み込み: 3秒以内
- シーン遷移: 即時（ローディング不要なレベル）
- 数独生成: 1秒以内

## 開発ツール

- VSCode
- ESLint + Prettier（コード品質）
- Vite dev server（開発サーバー）

## 変更履歴

- 2026-03-24: 初版作成
