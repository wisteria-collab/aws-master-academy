# p19: SAAの出典の補完（2026-11-15、アプリ内ブラウザで確認）
- 追加（8問）: pc-01 予測スケーリング, lb-train-01 ALB（レイヤー7）, lb-train-02 NLB（レイヤー4・毎秒数百万件）, pn-05 サブネット（パブリック/プライベートの定義、プライベートの推奨）, cs-04 st1（低コストのHDD、ログ処理、起動用に使えない）, di-01 Firehose（Parquetへの変換）, cc-01 スポット（中断され得る、バッチ向け、大幅な割引）, ps-03 S3ファイルゲートウェイ（NFS/SMB、ローカルキャッシュ）＋ボリュームゲートウェイ（iSCSI）
- まだ細部の根拠なし（本文は既存の出典のまま）: pd-03「テラバイトから」（Redshiftの概要は「ペタバイト規模」）, ps-01「数千台」（EFSは「大規模な並列アクセス」）, pc-02「数十万件」（Batchは「どんな規模でも」）, di-03「ミリ秒」（KDSの概要は「数秒で処理できる」）。aws.amazon.comの製品ページの確認は、ブラウザの許可が未回答のため未実施。
- 次: CLF17問の細部（p15-notes）
## 追記（aws.amazon.comの許可後）
- pd-03 Redshift FAQ「terabytes to petabytes」, ps-01 EFSのよくある質問「数十、数百、数千のコンピューティングインスタンスから同時にアクセス」, pc-02 Batch FAQ「hundreds of thousands of batch computing jobs」→ 出典追加。
- di-03 KDS FAQ: 拡張ファンアウト（SubscribeToShard）で「typically within 70 milliseconds」、用途に「real-time metrics and analytics」。「異常検知」は見つからず → 正解の解説をFAQの表現に合わせて修正し、出典追加。
