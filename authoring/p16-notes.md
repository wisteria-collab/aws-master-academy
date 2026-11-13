# p16: Gemini回答（24項目）の確認（2026-11-13）
- 反映（16問）: ai-02 Lex, sec-05 Macie, oth-05 SES, net-04 Direct Connect（「専用」「一貫性」は記載なし）, comp-07 Beanstalk（デプロイ自体は利用者が行う）, gov-06 KMS, sec-08 Security Hub CSPM, sec-07 Trusted Advisor, net-07 Client VPN, oth-07 X-Ray（DevOpsホワイトペーパー）, org-cost-01 Organizations料金, db-07 RDSマルチAZ, db-train-02 Aurora 15レプリカ, stg-train-04 S3耐久性, mig-03 DMS（規範ガイダンス）, sec-06 Firewall Manager
- 不採用: 17 Aurora HAページは「複数のAZ」「6つのストレージノード」で、3AZの記載なし（3AZは既存の出典＝AWS概要ホワイトペーパーが根拠、変更なし）。20 CloudTrailのページに「ID・時刻・IP」の記載なし（Geminiの引用はページに存在せず）。11 Timestreamの概念ページは説明を裏付けず、LiveAnalyticsの代わりにInfluxDB版を勧める注記あり。
- 未解決: Quick・Amplify（URLなし）、Connectの名前、Security Hubの名前（ページは「Security Hub CSPM」）、Timestream LiveAnalyticsの新規受付
