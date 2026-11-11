export const appInfo = {
  name: 'AWS Master Academy',
  version: '0.2.0',
  phase: 'Phase 2（基本画面・学習管理）',
  disclaimer:
    'AWS非公式の学習用アプリです。Amazon Web Services、AWS は、Amazon.com, Inc. またはその関連会社の商標です。',
} as const

/** 各機能の実装状況。機能を公開するときに ready を true にする */
export const features = {
  clf: { ready: false, phase: 3, label: 'CLF学習', to: '/learn/clf' },
  saa: { ready: false, phase: 4, label: 'SAA学習', to: '/learn/saa' },
  services: { ready: false, phase: 3, label: 'サービス図鑑', to: '/services' },
  compare: { ready: false, phase: 4, label: '類似サービス比較', to: '/compare' },
  designer: { ready: false, phase: 5, label: '構成図シミュレーター', to: '/designer' },
  practice: { ready: false, phase: 6, label: '問題演習', to: '/practice' },
  review: { ready: true, phase: 2, label: '苦手分野・復習', to: '/review' },
  progress: { ready: true, phase: 2, label: '学習進捗', to: '/progress' },
} as const
export type FeatureKey = keyof typeof features
