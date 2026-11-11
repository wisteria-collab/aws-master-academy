/**
 * 設計問題の講評。あらかじめ決めた観点（チェックリスト）を、構成図が満たしているかを確かめる。
 * 正解の構成は1つではないため、「観点を満たしているか」だけを見る。
 */
import { z } from 'zod'
import type { DesignChallenge, DiagramBody, DiagramNode } from '../content/schema'
import { nodeBox } from './diagram'

/** サービスIDのほかに、'@actor'（人・外部の箱）を指定できる */
const targets = z.array(z.string().min(1)).min(1)

export const ruleSchema = z.discriminatedUnion('type', [
  /** 指定したサービスのどれかが、min 個以上ある */
  z.object({ type: z.literal('hasService'), serviceIds: targets, min: z.number().int().positive().optional() }),
  /** 指定したサービスを使っていない */
  z.object({ type: z.literal('notService'), serviceIds: targets }),
  /** from のどれかと to のどれかが、線でつながっている（向きは問わない） */
  z.object({ type: z.literal('connected'), from: targets, to: targets }),
  /** 名前に指定した言葉を含む枠が、min 個以上ある */
  z.object({ type: z.literal('hasGroup'), labelIncludes: targets, min: z.number().int().positive().optional() }),
  /** 指定したサービスの箱が、名前に指定した言葉を含む枠の中にある */
  z.object({ type: z.literal('insideGroup'), serviceIds: targets, labelIncludes: targets }),
])
export type Rule = z.infer<typeof ruleSchema>

const matches = (n: DiagramNode, ids: string[]) => n.kind !== 'group' && ((n.serviceId !== undefined && ids.includes(n.serviceId)) || (n.kind === 'actor' && ids.includes('@actor')))
const labelHas = (n: DiagramNode, words: string[]) => words.some((w) => n.label.toLowerCase().includes(w.toLowerCase()))

export function checkRule(d: DiagramBody, rule: Rule): boolean {
  switch (rule.type) {
    case 'hasService':
      return d.nodes.filter((n) => matches(n, rule.serviceIds)).length >= (rule.min ?? 1)
    case 'notService':
      return !d.nodes.some((n) => matches(n, rule.serviceIds))
    case 'connected': {
      const a = new Set(d.nodes.filter((n) => matches(n, rule.from)).map((n) => n.id))
      const b = new Set(d.nodes.filter((n) => matches(n, rule.to)).map((n) => n.id))
      return d.edges.some((e) => (a.has(e.from) && b.has(e.to)) || (b.has(e.from) && a.has(e.to)))
    }
    case 'hasGroup':
      return d.nodes.filter((n) => n.kind === 'group' && labelHas(n, rule.labelIncludes)).length >= (rule.min ?? 1)
    case 'insideGroup': {
      const groups = d.nodes.filter((n) => n.kind === 'group' && labelHas(n, rule.labelIncludes)).map(nodeBox)
      return d.nodes
        .filter((n) => matches(n, rule.serviceIds))
        .some((n) => {
          const b = nodeBox(n)
          return groups.some((g) => b.x >= g.x && b.y >= g.y && b.x + b.w <= g.x + g.w && b.y + b.h <= g.y + g.h)
        })
    }
  }
}

export interface ReviewItem {
  id: string
  label: string
  reason: string
  ok: boolean
}

export function reviewDiagram(challenge: DesignChallenge, d: DiagramBody): { items: ReviewItem[]; passed: number; total: number } {
  const items = challenge.checklist.map((c) => {
    const rule = ruleSchema.safeParse(c.rule)
    return { id: c.id, label: c.label, reason: c.reason, ok: rule.success && checkRule(d, rule.data) }
  })
  return { items, passed: items.filter((i) => i.ok).length, total: items.length }
}

/** ルールが参照するサービスID（教材の検証用） */
export function ruleServiceIds(rule: Rule): string[] {
  const ids = rule.type === 'connected' ? [...rule.from, ...rule.to] : rule.type === 'hasGroup' ? [] : rule.serviceIds
  return ids.filter((id) => !id.startsWith('@'))
}
