import { Link } from 'react-router-dom'
import { Card, PageHeader } from '../components/ui'
import { features, type FeatureKey } from '../config/app'

const plans: Record<string, { feature: FeatureKey; lead: string; items: string[] }> = {
  services: {
    feature: 'services',
    lead: 'AWSの各サービスを検索して調べられる辞書です。',
    items: [
      'サービス名・カテゴリー・重要度での検索',
      '初心者向けの説明と、試験対策向けの説明の切り替え',
      'お気に入り、学習済みの管理',
      '類似サービスの比較ページへの移動',
    ],
  },
  compare: {
    feature: 'compare',
    lead: '似たサービスを比べて、要件から選べるようになるための最重要機能です。',
    items: [
      '12項目の比較表と、仕組みの違いがわかる図解',
      '質問をたどって適切なサービスに着く判断フロー',
      '要件文からサービスを選ぶトレーニング',
      '条件を1つだけ変えた応用問題（正解が変わる理由を学ぶ）',
    ],
  },
  designer: {
    feature: 'designer',
    lead: 'サービスを並べて線でつなぎ、AWSの構成を組み立てます。',
    items: ['お手本構成8テーマの閲覧', '構成図の作成・保存・読み込み', '企業の課題を想定した設計問題と、観点別の講評'],
  },
  practice: {
    feature: 'practice',
    lead: 'CLF・SAAの問題演習と模擬試験です。',
    items: [
      '分野別・サービス別・苦手分野・ランダムの演習',
      '正解の理由と、不正解の選択肢がなぜ不適切かの解説',
      '65問の模擬試験（CLF 90分・SAA 130分）と分野別の弱点分析',
      '採点はアプリ独自の正答率で表示します（本番のスケールドスコアとは異なり、合格点とは直接対応しません）',
    ],
  },
}

export function ComingSoon({ kind }: { kind: keyof typeof plans }) {
  const plan = plans[kind]
  const f = features[plan.feature]
  return (
    <div>
      <PageHeader title={f.label} lead={plan.lead} />
      <Card>
        <p className="text-base font-bold">この機能は準備中です（Phase {f.phase}で実装）</p>
        <p className="mt-1 text-base leading-relaxed text-navy-700">実装予定の内容：</p>
        <ul className="mt-2 list-disc pl-5 text-base leading-relaxed text-navy-800">
          {plan.items.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
        <Link to="/" className="mt-4 inline-flex min-h-11 items-center rounded-xl border border-navy-600 px-4 font-bold">
          ホームに戻る
        </Link>
      </Card>
    </div>
  )
}
