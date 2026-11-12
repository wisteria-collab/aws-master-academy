# 改善4項目の進み具合（2026-11-12）
## ①正確性の再点検：実施済み（未コミットなら git status を見る）
- 重大：択一279問すべてで正解が1番目だった → content/index.ts の arrangeChoices で問題IDごとに決まった順に並べ替え（テストあり）
- Deep Archive の取り出し時間「数時間」→ 公式の「9〜48時間」に統一（問題・レッスン・比較）
- CLF 148問・SAA第3分野を通読：事実の誤りは見つからず。よく似た問題の組（レッスン問題と比較トレーニング）が12組ほど → 模擬試験・ランダム演習で重ならないよう similarKey で調整
- 古い名称（QuickSight等）は注記つきで問題なし
- 残り：レッスン35本・比較15件・図鑑94件の通読は未実施（次にやるなら要点の矛盾チェックを機械的に）
## ②未確認・空欄：未着手（料金ページ10件＝X-Ray, IAM, IAM Identity Center, Organizations, Artifact, CLI, Console, Health Dashboard, Marketplace, Trusted Advisor／比較表の空欄30／スロットリング）
## ③使い勝手と速度：未着手（全体検索、学習計画、軽量化、オフライン、flaky e2e「[d] ブラウザの進むで比較の位置と状態が戻る」）
## ④問題・設計問題の追加：未着手
## ② 実施済み v1.3.0（16:30 JST頃）
- 料金: IAM/Organizations/Identity Center/Health Dashboard/Artifact=追加料金なし、Trusted Advisor=プランで範囲が変わる、を pricingNote に。未確認のまま: X-Ray, CLI, Console, Marketplace
- 比較表 29→19 か所（EBS scalability×4、インターフェイスエンドポイント/PrivateLink ×6）
- スロットリング: saa-ha-ft に追記＋用語（104語）
- 重要な発見: サポートプランが変更（現行=Basic, Business Support+, Enterprise Support, Unified Operations。Developer/Business/Enterprise On-Ramp は2027-01-01終了）→ 注記のみ追加。レッスン本文の書き換えはユーザーに確認すること
- e2e 388件（S3苦手の確認は乱数依存だったので修正）
## ③ 次: 検索、学習計画、コード分割、PWA、flaky
## ③ 実施済み v1.4.0（17時頃）: /search、StudyPlanCard（ホーム、settings.examDates）、scripts/make-sw.mjs（オフライン）、lazyページ10、flaky対策。vitest 74 / e2e 395 / quality 31
- 初回の読み込み量は教材データが大半で、ほぼ変わらず（gzip約475KB）。2回目以降は端末の保存分から即表示
## ④ 次: 問題と設計問題の追加（p9c.py）。e2e の '公開中 148 問' と '1 / 26' に注意
## ④ 実施済み v1.5.0: SAA+4（140）CLF+3（151）設計問題+1（5）。vitest 74 / e2e 397 / quality 32。残: 完了報告
