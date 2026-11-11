import { describe, expect, it } from 'vitest'
import { addEdge, addNode, canvasHeight, emptyDiagram, moveNode, nodeBox, parseDiagram, removeNode, renameNode, resizeNode, toSaved, updateEdge, usedServiceIds } from './diagram'

const two = () => {
  const a = addNode(emptyDiagram(), { kind: 'service', label: 'Amazon EC2', serviceId: 'amazon-ec2' })
  const b = addNode(a.diagram, { kind: 'service', label: 'Amazon RDS', serviceId: 'amazon-rds' })
  return { d: b.diagram, a: a.id, b: b.id }
}

describe('構成図の編集', () => {
  it('追加した箱は重ならず、横幅360に収まる', () => {
    let d = emptyDiagram()
    for (let i = 0; i < 12; i++) d = addNode(d, { kind: 'service', label: `S${i}`, serviceId: 'amazon-s3' }).diagram
    const boxes = d.nodes.map(nodeBox)
    boxes.forEach((b) => expect(b.x + b.w).toBeLessThanOrEqual(360))
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i], b = boxes[j]
        expect(a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h).toBe(false)
      }
    expect(new Set(d.nodes.map((n) => n.id)).size).toBe(12)
    expect(canvasHeight(d)).toBeGreaterThan(Math.max(...boxes.map((b) => b.y + b.h)))
  })

  it('線は、同じ箱どうし・重複・存在しない箱にはつながない', () => {
    const { d, a, b } = two()
    const e1 = addEdge(d, a, b)
    expect(e1.id).not.toBeNull()
    expect(addEdge(e1.diagram, a, b).id).toBeNull()
    expect(addEdge(e1.diagram, b, a).id).toBeNull()
    expect(addEdge(e1.diagram, a, a).id).toBeNull()
    expect(addEdge(e1.diagram, a, 'zzz').id).toBeNull()
  })

  it('箱を消すと、つながっていた線も消える', () => {
    const { d, a, b } = two()
    const e = addEdge(d, a, b).diagram
    const r = removeNode(e, a)
    expect(r.nodes).toHaveLength(1)
    expect(r.edges).toHaveLength(0)
  })

  it('箱は図の外に出ない', () => {
    const { d, a } = two()
    const m = moveNode(d, a, -500, -500).nodes.find((n) => n.id === a)!
    expect(m.x).toBe(0)
    expect(m.y).toBe(0)
    const r = moveNode(d, a, 5000, 0).nodes.find((n) => n.id === a)!
    expect(r.x + nodeBox(r).w).toBeLessThanOrEqual(360)
  })

  it('枠を動かすと、中の箱も一緒に動く。外の箱は動かない', () => {
    const { d, a, b } = two()
    const na = d.nodes.find((n) => n.id === a)!
    let g = addNode(d, { kind: 'group', label: 'VPC', width: 120, height: 60 })
    // 枠を、1つ目の箱を囲む位置に置く
    g = { ...g, diagram: { ...g.diagram, nodes: g.diagram.nodes.map((n) => (n.id === g.id ? { ...n, x: na.x - 8, y: na.y - 8 } : n)) } }
    const moved = moveNode(g.diagram, g.id, 0, 40)
    expect(moved.nodes.find((n) => n.id === a)!.y).toBe(na.y + 40)
    expect(moved.nodes.find((n) => n.id === b)!.y).toBe(d.nodes.find((n) => n.id === b)!.y)
  })

  it('線の向きの反転とラベル、枠の大きさの変更', () => {
    const { d, a, b } = two()
    const e = addEdge(d, a, b)
    const r = updateEdge(e.diagram, e.id!, { reverse: true, label: 'HTTPS' }).edges[0]
    expect(r).toMatchObject({ from: b, to: a, label: 'HTTPS' })
    expect(updateEdge(e.diagram, e.id!, { label: '' }).edges[0].label).toBeUndefined()
    const g = addNode(d, { kind: 'group', label: 'VPC' })
    const s = resizeNode(g.diagram, g.id, 1000, -1000).nodes.find((n) => n.id === g.id)!
    expect(s.x + s.width!).toBeLessThanOrEqual(360)
    expect(s.height).toBe(60)
  })

  it('名前が空のまま保存しても、読み込める形になる', () => {
    const { d, a, b } = two()
    const e = addEdge(renameNode(d, a, ''), a, b)
    const saved = toSaved(updateEdge(e.diagram, e.id!, { label: 'x' }))
    const back = parseDiagram(saved.nodes, saved.edges)
    expect(back.nodes).toHaveLength(2)
    expect(back.nodes.find((n) => n.id === a)!.label).toBe('名前なし')
    expect(back.edges[0].label).toBe('x')
    // 片方の箱が壊れていたら、その箱と、つながる線だけを取り除く
    const partial = parseDiagram([saved.nodes[0], { bad: true }], saved.edges)
    expect(partial.nodes).toHaveLength(1)
    expect(partial.edges).toHaveLength(0)
  })

  it('壊れた保存データは空の図として読む', () => {
    expect(parseDiagram([{ bad: true }], [])).toEqual({ nodes: [], edges: [] })
    const { d } = two()
    expect(parseDiagram(d.nodes, d.edges).nodes).toHaveLength(2)
    expect(usedServiceIds(d)).toEqual(['amazon-ec2', 'amazon-rds'])
  })
})
