# p15: CLF問題の個別出典とLambdaの課金の修正（2026-11-13）
## Lambda（公式の料金ページ・FAQで確認）
- 2026年にWeb関数（10月）とMicroVMs（6月）が加わり、従来の関数は「イベント関数」と呼ばれるようになった。
- イベント関数＝リクエスト数と実行時間。Web関数＝リクエスト、アクティブなCPU時間、実行環境のメモリ（リクエストの間の時間も含む）。MicroVMs＝実行中の基本のコンピューティング、スナップショット。
- 「実行していないときは料金がかからない」（古いホワイトペーパーの表現）を、イベント関数に限った表現へ修正: サービスページ、比較表、clf-compute、clf-q-comp-01、clf-q-cmp-train-01。
## Artifact
- 料金の根拠を2019年のブログ → ユーザーガイド「AWS provides AWS Artifact documents and agreements to you free of charge」。
## CLF出典（52問に追加）
- 概要ページに細部がない（本文は既存出典のまま）: db-04/db-train-02（3AZ・15レプリカ）, gov-04（イベント）, gov-02（IPと時刻）, stg-train-02（NTFS）, stg-train-03（低レイテンシー）, stg-train-04（11の9）, oth-03（SaaS・Lambda）, oth-06（フルマネージド・ビルドとテスト）, oth-08（数分で）, oth-10（マネージド）, mig-03（移行元が稼働し続ける）, sec-06（Organizations）, net-06（名前→IP）, db-03/db-train-03（ディスクとの比較）, ana-03（「フルマネージドのETL」→ページは「サーバーレスのデータ統合」）, db-01（ハードウェアの用意）
- 未追加: URLなし（Lex, Macie, Quick, SES, Direct Connect, Beanstalk, Identity Center, KMS, Security Hub, Trusted Advisor, Timestream）、AmplifyのURLは旧Admin UIのAPI参照で不適、X-Rayの概念ページは「デバッグ・根本原因」を裏付けない、OrganizationsのページはOrg-cost-01の「追加料金なし」を記載せず、Client VPN（net-07）、RDSマルチAZ（db-07）、概念の問題（cloud/caf/shared/econ/deploy/res/gov-07/price-dt-in）
- 気づき: Amazon Connectは「エージェント型AIソリューション群」の名前になり、従来の製品は「Connect Customer」と呼ばれている。教材の名前は未変更（要確認）。
