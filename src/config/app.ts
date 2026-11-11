export const appInfo = {
  name: 'AWS Master Academy',
  version: '0.4.1',
  phase: 'Phase 4 第2弾（SAA 第1分野）',
  disclaimer:
    'AWS非公式の学習用アプリです。Amazon Web Services、AWS は、Amazon.com, Inc. またはその関連会社の商標です。',
} as const

/** 各機能の実装状況。機能を公開するときに ready を true にする */
export const features = {
  clf: { ready: true, partial: true, phase: 3, label: 'CLF学習', to: '/learn/clf' },
  saa: { ready: true, partial: true, phase: 4, label: 'SAA学習', to: '/learn/saa' },
  services: { ready: true, partial: true, phase: 3, label: 'サービス図鑑', to: '/services' },
  compare: { ready: true, partial: true, phase: 4, label: '類似サービス比較', to: '/compare' },
  designer: { ready: false, partial: false, phase: 5, label: '構成図シミュレーター', to: '/designer' },
  practice: { ready: true, partial: true, phase: 6, label: '問題演習', to: '/practice' },
  review: { ready: true, partial: false, phase: 2, label: '苦手分野・復習', to: '/review' },
  progress: { ready: true, partial: false, phase: 2, label: '学習進捗', to: '/progress' },
} as const
export type FeatureKey = keyof typeof features
