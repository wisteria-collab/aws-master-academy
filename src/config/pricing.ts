/** 料金を調べるための、AWS公式の入口。教材の中の料金の案内は、すべてここから出す */
export const pricingLinks = [
  { title: 'AWS公式 料金一覧', note: '各サービスの最新の料金ページへの入口です。', url: 'https://aws.amazon.com/jp/pricing/' },
  { title: 'AWS料金計算ツール（AWS Pricing Calculator）', note: '使う構成を入力して、費用を見積もる無料のツールです。見積もりに税は含まれません。', url: 'https://calculator.aws/' },
  { title: 'AWS料金体系の仕組み（AWSホワイトペーパー）', note: '料金の考え方と、主なサービスの料金の決まり方をまとめた公式資料です。', url: 'https://docs.aws.amazon.com/ja_jp/whitepapers/latest/how-aws-pricing-works/how-aws-pricing-works.pdf' },
  { title: 'AWS料金計算ツールの公式ドキュメント', note: '料金計算ツールの使い方です。', url: 'https://docs.aws.amazon.com/pricing-calculator/latest/userguide/what-is-pricing-calculator.html' },
] as const
