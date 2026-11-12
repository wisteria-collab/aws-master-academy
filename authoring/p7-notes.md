# Phase 7 持ち越し分：公式情報で確認できた事実（2026-11-12）
## IAMポリシーの評価 — https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html , https://docs.aws.amazon.com/IAM/latest/UserGuide/intro-structure.html
- 既定ではすべてのリクエストは拒否（暗黙の拒否）。ルートユーザーの認証情報による自アカウントのリソースへのリクエストは一般に常に許可。
- アイデンティティベース／リソースベースのポリシーの明示的な許可が、この既定を上書きする。
- SCP・RCP・アクセス許可の境界・セッションポリシーがあると、それらすべてが許可している必要がある（なければ暗黙の拒否）。
- どのポリシーでも、明示的な拒否は、すべての許可に優先する。
- 同じアカウント内：アイデンティティベースとリソースベースは「和」（どちらかが許可すれば許可）。アイデンティティベースと境界は「積」。アイデンティティベースとSCP/RCPは「積」。
## Lambdaのメモリ — https://docs.aws.amazon.com/lambda/latest/dg/configuration-memory.html
- メモリは128MB〜10,240MBを1MB刻み。既定は128MB（最小）。CPUは設定メモリに比例して割り当て。1,769MBで1 vCPU相当。
- メモリは性能を制御する主な手段。CPU・ネットワーク・メモリが足かせの関数は、メモリを増やすと性能が大きく上がることがある。CloudWatchで監視して決める。
- 1回の実行は最長15分（900秒）（Lambda quotas: https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html）
## Compute Optimizer — https://docs.aws.amazon.com/compute-optimizer/latest/ug/what-is-compute-optimizer.html
- リソースの設定と使用率のメトリクスを分析し、ライトサイジングの推奨を出し、アイドルなリソースを見つける。オプトインが必要。CloudWatchの直近14日のメトリクスを分析。
- 対象：EC2インスタンス、EC2 Auto Scalingグループ、EBSボリューム、Lambda関数、Fargate上のECSサービス、Aurora/RDS など。
## Service Quotas — https://docs.aws.amazon.com/servicequotas/latest/userguide/intro.html , https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-resource-limits.html
- クォータ（上限、limitsとも呼ぶ）＝アカウント内のリソース・操作・項目の最大値。各サービスが既定値を定める。Service Quotasで一元的に表示・管理し、引き上げを申請できる（調整可能なもの）。申請の審査・承認には時間がかかる。
- EC2：クォータはリージョンごと。超えようとするとリクエストは失敗する（例：オンデマンドのvCPU数）。必要になる前に、前もって引き上げを申請するよう計画する。
- スロットリングの一般的な説明は未確認（載せない）。
## イミュータブルインフラストラクチャ — https://docs.aws.amazon.com/wellarchitected/latest/framework/rel_tracking_change_management_immutable_infrastructure.html
- 本番のワークロードに対して、更新・セキュリティパッチ・設定変更を「その場で」行わないモデル。変更が必要なときは、新しいインフラに構築して本番にデプロイする。
- 新しいリソース一式を既存と並行してデプロイ→自動で検証→成功したらトラフィックを徐々に移す。
- 利点：環境間の一貫性、設定のずれ（ドリフト）の減少、前の版が変更されないので速いロールバック、SSHなどのリモートアクセスを無効にできる。IaC（CloudFormation）で自動化。カナリア／ブルーグリーン。
## S3ストレージクラス比較 — https://docs.aws.amazon.com/AmazonS3/latest/userguide/storage-class-intro.html , glacier-storage-classes.html
| クラス | 可用性(設計) | AZ | 最小保存期間 | その他 |
| Standard | 99.99% | 3以上 | なし | - |
| Standard-IA | 99.9% | 3以上 | 30日 | GBあたりの取り出し料金。128KB未満は128KBとして課金。ミリ秒アクセス |
| Intelligent-Tiering | 99.9% | 3以上 | なし | オブジェクトあたりの監視・自動化の料金。取り出し料金なし。128KB未満は監視されず常に高頻度層 |
| One Zone-IA | 99.5% | 1 | 30日 | 取り出し料金。AZの喪失に耐えない。ミリ秒アクセス |
| Glacier Instant Retrieval | 99.9% | 3以上 | 90日 | 取り出し料金。ミリ秒。四半期に1回程度 |
| Glacier Flexible Retrieval | 99.99%(復元後) | 3以上 | 90日 | 取り出し料金。先に復元が必要。数分〜12時間 |
| Glacier Deep Archive | 99.99%(復元後) | 3以上 | 180日 | 取り出し料金。先に復元が必要。9〜48時間。年1回未満 |
耐久性はすべて99.999999999%。
