# p18: アプリ内ブラウザ経由のGemini（2026-11-15）
- 流れ: デスクトップアプリの組み込みブラウザで gemini.google.com を開き、プロンプトを入力して回答を読む → 同じブラウザで公式ページを開いて確認。APIは通信制限（cloud・PC側ともに403）で使えない。
- Amplify: userguide/welcome.html（Amplify Hosting。Gen 2 はTypeScriptのコードでバックエンドを定義）→ サービスページと clf-q-oth-09 に出典追加。解説の「iOS・Android」はこのページになし（既存のホワイトペーパーが根拠）。
- ゲートウェイエンドポイントの性能: 「Guidance for Network Connectivity on AWS」の帯域の表で Gateway Endpoint は「NA」。意味（制限なし／該当なし）が書かれていないため空欄のまま。
- CLI・コンソールの「追加料金なし」: Geminiも見つけられず。未解決のまま。
