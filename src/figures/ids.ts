/** 教材から参照できる図解のID。図を追加したらここにも追加する（検証スクリプトが参照先を確認する） */
export const figureIds = ['region-az', 'shared-responsibility', 'storage-types', 'wa-pillars', 'compute-options', 'iam-elements', 'edge-delivery', 'db-types', 'vpc-structure', 'purchase-options', 'cost-tools', 'access-methods', 'data-flow'] as const
export type FigureId = (typeof figureIds)[number]
