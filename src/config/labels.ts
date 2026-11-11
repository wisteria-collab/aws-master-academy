/** サービスのカテゴリー名（公式試験ガイドのサービス分類に合わせる） */
export const categoryLabels: Record<string, string> = {
  analytics: '分析',
  'application-integration': 'アプリケーション統合',
  compute: 'コンピューティング',
  containers: 'コンテナ',
  database: 'データベース',
  'management-governance': '管理とガバナンス',
  'migration-transfer': '移行と転送',
  networking: 'ネットワークとコンテンツ配信',
  security: 'セキュリティ、ID、コンプライアンス',
  serverless: 'サーバーレス',
  storage: 'ストレージ',
  'machine-learning': '機械学習',
  'cost-management': 'クラウド財務管理',
}
export const categoryLabel = (id: string) => categoryLabels[id] ?? id

export const importanceLabels = { high: '高', mid: '中', low: '低', out: '範囲外' } as const
export const difficultyLabels = { basic: '基礎', standard: '標準', advanced: '応用' } as const
export const formatLabels = { basic: '知識', scenario: 'シナリオ', comparison: 'サービス比較', architecture: '構成選択' } as const

/** コースの予定テーマ数（公開済みの数とあわせて表示する） */
export const plannedLessons = { clf: 18, saa: 14 } as const
