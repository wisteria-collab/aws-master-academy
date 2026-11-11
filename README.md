# AWS Master Academy

AWS認定 CLF-C02 / SAA-C03 の学習アプリです（AWS非公式）。
現在は **Phase 7 完了**（CLFのレッスン21本、SAAのレッスン14本、サービス94件、比較グループ15件、問題283問）まで公開しています。

## GitHub Pages で公開する手順

1. GitHub で新しい公開リポジトリを作る（例：`aws-master-academy`）。
2. このフォルダの中身をすべてリポジトリの `main` ブランチにアップロードする。
3. リポジトリの **Settings → Pages → Build and deployment → Source** を **GitHub Actions** にする。
4. **Actions** タブで「Deploy to GitHub Pages」が緑になれば公開完了。
   URL は `https://<ユーザー名>.github.io/<リポジトリ名>/` です。

以降は `main` に変更を入れるたびに、検証 → テスト → ビルド → 公開が自動で行われます。

## 手元で動かす

```bash
npm install
npm run dev        # 開発用サーバー
npm test           # 単体テスト
npm run validate   # 教材データの検証
npm run build      # 検証 + 型チェック + ビルド（dist/ に出力）
```

## フォルダ構成

| 場所 | 内容 |
| --- | --- |
| `content/` | 教材データ（JSON）。アプリ本体のコードとは分離 |
| `src/content/` | 教材の形式（スキーマ）と検証 |
| `src/storage/` | 保存層（IndexedDB / LocalStorage）とバックアップ |
| `src/logic/` | 復習スケジュール、集計などの学習ロジック |
| `src/pages/`, `src/components/` | 画面 |
| `scripts/validate-content.ts` | 教材の検証スクリプト |
| `e2e/run.py` | ブラウザでの動作確認（Playwright） |
| `e2e/quality.py` | 仕上げの確認（SAA模擬試験、時間切れの自動採点、アクセシビリティの自動検査） |

## 教材を追加するとき

1. `content/<種類>/` に JSON を置く（最初は `"status": "draft"`）。
2. AWS公式ドキュメントと照合し、`sources`（出典）、`verifiedAt`（確認日）、`basedOnGuide`（基準にした公式試験ガイドのバージョン）を記入する。
3. 照合できたら `"status": "verified"` にする。**verified の教材だけが画面に表示されます。**
4. `npm run validate` でエラーが出ないことを確認する。

検証スクリプトは、出典・確認日の漏れ、択一問題の正解数、選択肢ごとの解説の有無、
不正解の選択肢を排除する根拠、存在しない参照先などを検出し、エラーがあれば公開を止めます。

## 学習データについて

学習履歴はブラウザ内（IndexedDB）に保存され、外部には送信されません。
「記録 → 設定・バックアップ」から JSON で書き出し・読み込みができます。

---

AWS非公式の学習用アプリです。Amazon Web Services、AWS は、Amazon.com, Inc. またはその関連会社の商標です。
