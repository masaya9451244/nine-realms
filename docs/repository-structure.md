# リポジトリ構造定義書 - Nine Realms

## ディレクトリ構成

```
nine-realms/
├── public/
│   └── assets/
│       ├── images/
│       │   ├── characters/      # 勇者・敵・NPCのスプライト
│       │   ├── maps/            # ワールドマップ背景
│       │   ├── ui/              # ボタン・フレーム・アイコン
│       │   └── equipment/       # 装備アイテム画像
│       └── audio/
│           ├── bgm/             # バックグラウンドミュージック
│           └── se/              # 効果音
├── src/
│   ├── main.ts                  # エントリーポイント・Phaser設定
│   ├── config.ts                # ゲーム定数
│   ├── types/
│   │   ├── game.ts              # ゲーム全体の型定義
│   │   ├── sudoku.ts            # 数独関連の型定義
│   │   └── equipment.ts         # 装備・アイテム関連の型定義
│   ├── scenes/
│   │   ├── BootScene.ts         # アセット読み込み
│   │   ├── TitleScene.ts        # タイトル画面
│   │   ├── OpeningScene.ts      # オープニング演出
│   │   ├── WorldMapScene.ts     # ワールドマップ
│   │   ├── ShopScene.ts         # ショップ画面
│   │   ├── DialogScene.ts       # NPC会話
│   │   ├── BattleScene.ts       # 数独バトル
│   │   ├── RealmClearScene.ts   # Realmクリア演出
│   │   └── EndingScene.ts       # エンディング
│   ├── game/
│   │   ├── SudokuGenerator.ts   # 数独問題生成ロジック
│   │   ├── SudokuValidator.ts   # 数独正解判定ロジック
│   │   ├── SaveManager.ts       # LocalStorageのセーブ・ロード
│   │   ├── EquipmentManager.ts  # 装備の管理・効果計算
│   │   └── BattleManager.ts     # バトル進行・HP・ダメージ管理
│   ├── ui/
│   │   ├── SudokuGrid.ts        # 数独グリッドUI
│   │   ├── DialogBox.ts         # 会話テキストボックスUI
│   │   ├── HpBar.ts             # HPバーUI
│   │   ├── ItemSlot.ts          # バトル中アイテムスロットUI
│   │   └── ShopPanel.ts         # ショップパネルUI
│   └── data/
│       ├── realms.ts            # Realm設定データ
│       ├── story.ts             # ストーリーテキスト
│       └── equipment.ts         # 装備・アイテムマスターデータ
├── tests/
│   ├── SudokuGenerator.test.ts  # 数独生成ロジックのテスト
│   ├── SudokuValidator.test.ts  # 数独判定ロジックのテスト
│   └── EquipmentManager.test.ts # 装備効果計算のテスト
├── docs/                        # 永続的ドキュメント
├── .steering/                   # 作業単位のドキュメント
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
└── CLAUDE.md
```

## ディレクトリの役割

| ディレクトリ | 役割 |
|---|---|
| `public/assets/` | 画像・音声などの静的アセット |
| `src/scenes/` | Phaserシーン（画面単位） |
| `src/game/` | ゲームロジック（UIに依存しない純粋なロジック） |
| `src/ui/` | 再利用可能なPhaserUIコンポーネント |
| `src/types/` | TypeScript型定義 |
| `src/data/` | マスターデータ（定数・設定値） |
| `tests/` | ユニットテスト（Vitest） |

## ファイル配置ルール

- シーンは必ず `src/scenes/` に配置
- ゲームロジックはUIに依存しない形で `src/game/` に分離
- マスターデータ（Realm設定・装備データなど）は `src/data/` に集約
- 型定義は必ず `src/types/` に配置し、インラインで定義しない

## 変更履歴

- 2026-03-24: 初版作成
