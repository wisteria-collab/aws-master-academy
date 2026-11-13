# おすすめ順の作業（2026-11-13 09:48 指示）
- ① 試験ガイド：CLF v1.3・SAA v1.1 が最新（2026-10-29）。後継の告知なし。変更不要
- ② リンク点検：link-check.yml + check-links.mjs（311件）。push後に手動実行して結果を見ること
- ③ PNGアイコン 180/192/512、manifest、apple-touch-icon。v1.9.2
- 次：④SAA難問追加 ⑤出典の絞り込み ⑥似た問題の整理 ⑦初回表示の高速化 …
- リンク点検 初回（run 43340777762）：311件中 307 開けた、切れ 0、要確認 4（docs.aws.amazon.com の awssupport/ cost-management/ directoryservice/ elasticbeanstalk/ のトップが 403）。gh workflow run は GraphQL 不可 → gh api -X POST .../dispatches -f ref=main で起動
- ④ SAA advanced 3問（gp3への変更、TGWのAZ、DataSync拡張モード）p13a.py v1.9.3。advanced 計11問。次：⑤出典の絞り込み
