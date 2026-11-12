import { describe, expect, it } from 'vitest'
import { content } from '../content'
import { reviewDiagram } from './challenge'

describe('設計問題の模範解答', () => {
  for (const ch of content.challenges) {
    it(`${ch.id}：模範解答が、すべての確認項目を満たす`, () => {
      const r = reviewDiagram(ch, ch.modelAnswer)
      const failed = r.items.filter((i) => !i.ok).map((i) => i.label)
      expect(failed).toEqual([])
    })
  }
})
