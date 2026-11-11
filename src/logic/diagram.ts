/**
 * 構成図の編集の計算。画面から切り離して、テストできるようにしている。
 * 座標は横幅 360 を基準にする（スマートフォンの幅で文字が読める大きさ）。
 */
import { diagramBodySchema, type DiagramBody, type DiagramEdge, type DiagramNode } from '../content/schema'

export const CANVAS_W = 360
export const GRID = 4
export const NODE_W = 104
export const NODE_H = 44

export interface Box {
  x: number
  y: number
  w: number
  h: number
  cx: number
  cy: number
}

export function nodeBox(n: DiagramNode): Box {
  const w = n.width ?? (n.kind === 'actor' ? 88 : NODE_W)
  const h = n.height ?? NODE_H
  return { x: n.x, y: n.y, w, h, cx: n.x + w / 2, cy: n.y + h / 2 }
}

export const emptyDiagram = (): DiagramBody => ({ nodes: [], edges: [] })

/** 保存データを構成図として読む。壊れている箱や線は取り除き、読めるものだけを残す */
export function parseDiagram(nodes: unknown[], edges: unknown[]): DiagramBody {
  const nodeSchema = diagramBodySchema.shape.nodes.element
  const edgeSchema = diagramBodySchema.shape.edges.element
  const okNodes = nodes.flatMap((n) => {
    const r = nodeSchema.safeParse(n)
    return r.success ? [r.data] : []
  })
  const ids = new Set(okNodes.map((n) => n.id))
  const okEdges = edges.flatMap((e) => {
    const r = edgeSchema.safeParse(e)
    return r.success && ids.has(r.data.from) && ids.has(r.data.to) ? [r.data] : []
  })
  return { nodes: okNodes, edges: okEdges }
}

/** 保存する形にする。空の名前は保存できないため、仮の名前を入れる */
export function toSaved(d: DiagramBody): DiagramBody {
  return {
    nodes: d.nodes.map((n) => ({ ...n, label: n.label.trim() || '名前なし' })),
    edges: d.edges.map((e) => {
      const { label, ...rest } = e
      return label?.trim() ? { ...rest, label: label.trim() } : rest
    }),
  }
}

export const newDiagramId = () => `dg-${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`

export const snap = (v: number) => Math.round(v / GRID) * GRID

const overlaps = (a: Box, b: Box, gap = 6) => a.x < b.x + b.w + gap && b.x < a.x + a.w + gap && a.y < b.y + b.h + gap && b.y < a.y + a.h + gap

export function diagramBottom(d: DiagramBody): number {
  return d.nodes.reduce((m, n) => Math.max(m, nodeBox(n).y + nodeBox(n).h), 0)
}

/** 図の高さ。下に、次の箱を置ける余白を残す */
export function canvasHeight(d: DiagramBody, min = 420): number {
  return Math.max(min, diagramBottom(d) + 96)
}

function nextId(d: DiagramBody, prefix: string): string {
  const used = new Set([...d.nodes.map((n) => n.id), ...d.edges.map((e) => e.id)])
  let i = d.nodes.length + d.edges.length + 1
  while (used.has(`${prefix}${i}`)) i++
  return `${prefix}${i}`
}

/** ほかの箱（枠を除く）と重ならない、空いている場所を探す */
export function freeSpot(d: DiagramBody, w: number, h: number): { x: number; y: number } {
  const items = d.nodes.filter((n) => n.kind !== 'group').map(nodeBox)
  // 2列に並べる（箱の間に、線を引く余白を残す）
  for (let y = 16; y < 6000; y += 76) {
    for (const x of [28, 228]) {
      if (x + w > CANVAS_W) continue
      const box = { x, y, w, h, cx: 0, cy: 0 }
      if (!items.some((b) => overlaps(box, b))) return { x, y }
    }
  }
  return { x: 16, y: snap(diagramBottom(d) + 16) }
}

export type NewNode = Pick<DiagramNode, 'kind' | 'label'> & Partial<Pick<DiagramNode, 'serviceId' | 'width' | 'height'>>

export function addNode(d: DiagramBody, spec: NewNode): { diagram: DiagramBody; id: string } {
  const id = nextId(d, 'n')
  let node: DiagramNode
  if (spec.kind === 'group') {
    const width = spec.width ?? 200
    const height = spec.height ?? 140
    // 枠は、いまの図の下に置く（あとで動かして、箱を囲む）
    node = { id, kind: 'group', label: spec.label, x: snap((CANVAS_W - width) / 2), y: snap(diagramBottom(d) + 16), width, height }
  } else {
    const w = spec.width ?? (spec.kind === 'actor' ? 88 : NODE_W)
    const h = spec.height ?? NODE_H
    node = { id, ...spec, ...freeSpot(d, w, h) }
  }
  return { diagram: { ...d, nodes: [...d.nodes, node] }, id }
}

const inside = (inner: Box, outer: Box) => inner.x >= outer.x && inner.y >= outer.y && inner.x + inner.w <= outer.x + outer.w && inner.y + inner.h <= outer.y + outer.h

/** 箱を動かす。枠を動かすときは、枠の中に入っている箱も一緒に動かす */
export function moveNode(d: DiagramBody, id: string, dx: number, dy: number): DiagramBody {
  const target = d.nodes.find((n) => n.id === id)
  if (!target) return d
  const tb = nodeBox(target)
  const moving = new Set([id])
  if (target.kind === 'group') {
    for (const n of d.nodes) if (n.id !== id && inside(nodeBox(n), tb)) moving.add(n.id)
  }
  // まとめて動かすものが、すべて図の中に収まる範囲に抑える
  const boxes = d.nodes.filter((n) => moving.has(n.id)).map(nodeBox)
  const minX = Math.min(...boxes.map((b) => b.x))
  const maxX = Math.max(...boxes.map((b) => b.x + b.w))
  const minY = Math.min(...boxes.map((b) => b.y))
  const mx = snap(Math.min(Math.max(dx, -minX), CANVAS_W - maxX))
  const my = snap(Math.max(dy, -minY))
  if (mx === 0 && my === 0) return d
  return { ...d, nodes: d.nodes.map((n) => (moving.has(n.id) ? { ...n, x: n.x + mx, y: n.y + my } : n)) }
}

export function resizeNode(d: DiagramBody, id: string, dw: number, dh: number): DiagramBody {
  return {
    ...d,
    nodes: d.nodes.map((n) => {
      if (n.id !== id) return n
      const b = nodeBox(n)
      const width = Math.min(Math.max(b.w + dw, 72), CANVAS_W - n.x)
      const height = Math.max(b.h + dh, n.kind === 'group' ? 60 : 36)
      return { ...n, width, height }
    }),
  }
}

/** 名前を変える。入力の途中で空になってもよい（保存するときに toSaved で整える） */
export function renameNode(d: DiagramBody, id: string, label: string): DiagramBody {
  return { ...d, nodes: d.nodes.map((n) => (n.id === id ? { ...n, label } : n)) }
}

export function removeNode(d: DiagramBody, id: string): DiagramBody {
  return { nodes: d.nodes.filter((n) => n.id !== id), edges: d.edges.filter((e) => e.from !== id && e.to !== id) }
}

/** 線をつなぐ。同じ箱どうしや、すでにある線は追加しない */
export function addEdge(d: DiagramBody, from: string, to: string): { diagram: DiagramBody; id: string | null } {
  const ok = from !== to && d.nodes.some((n) => n.id === from) && d.nodes.some((n) => n.id === to)
  const dup = d.edges.some((e) => (e.from === from && e.to === to) || (e.from === to && e.to === from))
  if (!ok || dup) return { diagram: d, id: null }
  const id = nextId(d, 'e')
  return { diagram: { ...d, edges: [...d.edges, { id, from, to }] }, id }
}

export function updateEdge(d: DiagramBody, id: string, patch: Partial<Pick<DiagramEdge, 'label'>> & { reverse?: boolean }): DiagramBody {
  return {
    ...d,
    edges: d.edges.map((e) => {
      if (e.id !== id) return e
      const next: DiagramEdge = patch.reverse ? { ...e, from: e.to, to: e.from } : { ...e }
      if ('label' in patch) {
        if (patch.label) next.label = patch.label
        else delete next.label
      }
      return next
    }),
  }
}

export function removeEdge(d: DiagramBody, id: string): DiagramBody {
  return { ...d, edges: d.edges.filter((e) => e.id !== id) }
}

/** 図に使われているサービスID（重複なし） */
export function usedServiceIds(d: DiagramBody): string[] {
  return [...new Set(d.nodes.map((n) => n.serviceId).filter((id): id is string => id !== undefined))]
}
