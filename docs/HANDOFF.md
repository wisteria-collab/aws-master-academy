# 引き継ぎメモ（AWS Master Academy）

最終更新：2026-11-12（v1.9.3）。このファイルを読めば、別の担当（別のモデル・別の会話）でも作業を続けられるようにまとめています。

## 1. これは何か
- AWS認定 CLF-C02（試験ガイド v1.3）と SAA-C03（v1.1）の学習用Webアプリ。**AWS非公式**。
- 公開先：https://wisteria-collab.github.io/aws-master-academy/ （main に push すると GitHub Actions が自動で公開）
- 技術：React 19 / TypeScript / Vite / Tailwind v4 / HashRouter / Dexie（IndexedDB）/ Zod / Vitest / Playwright（Python）

## 2. 守るルール（依頼者の方針）
1. **AWS公式情報で確認できた内容だけを公開する。** 確認できないものは載せない（「確認できていません」と書く）。
2. すべての教材に、出典（sources）・試験ガイドの版（basedOnGuide）・確認日（verifiedAt）を記録する。
3. 問題は、**誤りの選択肢すべてに解説**を付ける。ダミーの内容は作らない。
4. **金額（ドルなど）は書かない。** 料金は「何に対して課金されるか」を書き、公式の料金ページへ案内する。
5. 「無料であること」と「関連するサービスの利用まで無料であること」を混同しない。料金表のないツールに、無理に料金表を作らない。
6. AWSのロゴは使わない。「AWS非公式の学習用アプリ」と表示する。
7. 模擬試験は65問。結果は「アプリ独自の正答率」で、本番のスコアとは対応しないと明記する。
8. 説明は、**たとえ話を先に、式や専門用語はあと**。読者はプログラミング未経験者。
9. 既存の画面や作りを、必要以上に変えない。

## 3. 作業の手順（毎回この順）
```
npm run validate          # 教材の形式と参照の検証（エラー0・警告0が条件）
npx vitest run            # 単体テスト
npm run build             # 検証→型チェック→ビルド→sw.js 作成
npx vite preview --port 4173 --strictPort &   # 別プロセスで起動
python3 e2e/run.py        # 画面テスト（全件成功が条件）
python3 e2e/quality.py    # 模擬試験・オフライン・アクセシビリティ
python3 authoring/release.py <版> "<説明>"   # 版の表示を更新
git commit → git push → gh run list -R wisteria-collab/aws-master-academy -L 1
```
- **テスト結果を読んでからコミットする。** テストとコミットを `;` でつなげない（失敗したまま公開した前例あり）。
- CLFの問題数を変えたら、`e2e/run.py` の `'公開中 151 問'` を手で直す。分野1の問題数を変えたら `'1 / 26'` も直す。
- `authoring/` のスクリプトは、元の作業場所の絶対パス（`/home/claude/aws-master-academy`、`/home/claude/authoring`）を前提にしている。別の場所で使うときは、`batch1.py` の `ROOT` と `release.py` の `R` を書き換える。

## 4. どこに何があるか
| 場所 | 内容 |
|---|---|
| `content/<種類>/*.json` | 教材（exams, lessons, services, comparisons, questions, glossary, diagrams, challenges）。`status: "verified"` だけが表示される |
| `src/content/schema.ts` | 教材の形式（Zod）。`validate.ts` が参照の整合性も確認 |
| `src/content/index.ts` | 教材の読み込み。`arrangeChoices` が選択肢の並び順を問題ごとに決める |
| `src/logic/` | 計算の部分（模擬試験 exam.ts、構成図 diagram.ts、講評 challenge.ts、検索 search.ts、学習計画 plan.ts） |
| `src/pages/` | 画面。経路は `App.tsx` |
| `src/components/PricingCard.tsx` | 料金の案内。`pricingUrl`（料金ページ）、`pricingNote`（説明）、`pricingRefUrl`（料金ページがないときの根拠のページ） |
| `scripts/make-sw.mjs` | オフライン用の Service Worker を、ビルド後に作る |
| `e2e/run.py`, `e2e/quality.py` | 画面テスト |
| `authoring/` | 教材を作ったスクリプトと記録。`p4common.py` に共通の部品（`SQ`＝SAAの問題、`q`＝CLFの問題、`check_qs`＝問題文と解説の整合確認）。`p9c.py` が最新の書き方の見本 |
| `authoring/p8-verified.json` | 確認済みの料金ページの一覧 |
| `authoring/p9-notes.md` | 直近の作業の記録 |

## 5. いまの規模
レッスン35（CLF 21・SAA 14）／サービス94（全件に料金の案内あり）／比較15／問題 CLF 151・SAA 148／構成図8／設計問題8／用語104

## 6. 残っている課題
- サポートプラン：レッスン・図鑑・問題は、現行のプラン（Basic / Business Support+ / Enterprise Support / Unified Operations）で書かれている。Developer・Business・Enterprise On-Ramp は2027-01-01に終了予定、という案内も記載済み。追加の対応は不要。
- AWS CLI とマネジメントコンソール：公式ページに「そのもの自体の料金」の記載が見つからず、「記載は確認できていません」と表示している。無料と明記した公式ページが見つかれば書き換える。
- AWS Artifact の「追加料金なし」の根拠は2019年の公式ブログ。新しい公式ページが見つかれば差し替える。
- 通読：レッスン35本・比較15件・図鑑94件・問題（CLF全問、SAA全分野）を2026-11-12に通読済み。
- 比較表の空欄：残り1か所（ゲートウェイエンドポイントの性能。公式のゲートウェイエンドポイントのページとVPCのFAQに記載なし、2026-11-13確認）。
- Snow Family：新規の利用者には提供されていない（2026-11-12確認）。試験ガイドに名前があるため教材には残し、注記で代わりの方法（DataSync, Data Transfer Terminal, Outposts）を案内。
- SAAの問題は140問中137問が standard。サービス名を当てる形式が多く、CLFとの難易度の差が小さい。複数の要件を比べる問題を増やすとよい。
- ElastiCache（Valkey）、CloudHSM（FIPS 140-3）、マルチAZ DBクラスター（読み取り可能なスタンバイ）は2026-11-12に公式で確認して反映済み。
- 初回の表示：読み込みの大半が教材データ（gzipで約475KB）。教材を分けて読み込む作り替えは未着手。
- 実機（特に iPhone）でのオフライン動作とホーム画面への追加は未確認。ホーム画面用の PNG アイコン（180・192・512）は作成済み。
- 公式リンクの点検：`.github/workflows/link-check.yml`（毎週月曜と手動）。`scripts/check-links.mjs` が content の全URLを開き、結果を実行結果のSummaryに出す。403・429は「要確認」として分ける。
- 試験ガイドの版：2026-11-13に公式で確認。CLF-C02は v1.3（2026-10-29）、SAA-C03は v1.1（2026-10-29）が最新。後継試験の告知はなし（同時期の更新は SAP-C03・DVA-C03・MLA-C02）。
- よく似た問題の組が約12組ある（レッスンの問題と比較トレーニング）。模擬試験とランダム演習では重ならないよう調整済み。

## 7. 調べ方のこつ
- 公式ページの確認は、依頼者に URL をもらって1件ずつ開くのが、いちばん少ない手間で済む。
- 名前が変わったサービスは、試験ガイドの名前に合わせ、`uncertainNote` で公式の現在の名前を注記する。
