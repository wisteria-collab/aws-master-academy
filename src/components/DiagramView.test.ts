import { describe, expect, it } from 'vitest'
import { content } from '../content'
import { nodeBox, splitLabel } from './DiagramView'

describe('構成図の表示', () => {
  it('短い名前は1行、長い名前は2行に分ける', () => {
    expect(splitLabel('Amazon S3', 8)).toEqual(['Amazon S3'])
    expect(splitLabel('Amazon CloudFront', 8)).toEqual(['Amazon', 'CloudFront'])
    expect(splitLabel('EC2（Auto Scaling）', 8)).toHaveLength(2)
  })

  it('お手本構成は、横幅360の中に収まり、サービスの箱どうしが重ならない', () => {
    for (const t of content.diagrams) {
      const items = t.diagram.nodes.filter((n) => n.kind !== 'group').map((n) => ({ id: n.id, ...nodeBox(n) }))
      for (const n of t.diagram.nodes) {
        const b = nodeBox(n)
        expect(b.x, `${t.id}/${n.id}`).toBeGreaterThanOrEqual(0)
        expect(b.x + b.w, `${t.id}/${n.id}`).toBeLessThanOrEqual(360)
      }
      for (const a of items) {
        for (const b of items) {
          if (a.id >= b.id) continue
          const overlap = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
          expect(overlap, `${t.id}: ${a.id} と ${b.id}`).toBe(false)
        }
      }
    }
  })

  it('お手本構成のサービスの箱には、役割の説明がある', () => {
    for (const t of content.diagrams) {
      for (const n of t.diagram.nodes.filter((x) => x.kind !== 'group')) {
        expect(n.note?.length ?? 0, `${t.id}/${n.id}`).toBeGreaterThanOrEqual(15)
      }
    }
  })
})
