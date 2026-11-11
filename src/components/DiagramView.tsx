/**
 * 構成図の表示。スマートフォンの幅（約360px）で文字が読めるよう、
 * 図の横幅を 360 の座標にそろえて描く。AWSの公式アイコンは使わず、枠と文字で表す。
 */
import type { DiagramTemplate } from '../content/schema'

type Body = DiagramTemplate['diagram']
type Node = Body['nodes'][number]

const navy = '#232f3e'
const orange = '#ff9900'
const tint = '#fff6e5'
const line = '#46597a'
const soft = '#f3f5f9'

export const NODE_W = 104
export const NODE_H = 44

export function nodeBox(n: Node) {
  const w = n.width ?? (n.kind === 'actor' ? 88 : NODE_W)
  const h = n.height ?? NODE_H
  return { x: n.x, y: n.y, w, h, cx: n.x + w / 2, cy: n.y + h / 2 }
}

/** 箱の中心から相手の中心へ向かう線が、箱の縁と交わる点 */
function edgePoint(a: ReturnType<typeof nodeBox>, b: ReturnType<typeof nodeBox>) {
  const dx = b.cx - a.cx
  const dy = b.cy - a.cy
  if (dx === 0 && dy === 0) return { x: a.cx, y: a.cy }
  const t = Math.min(dx === 0 ? Infinity : a.w / 2 / Math.abs(dx), dy === 0 ? Infinity : a.h / 2 / Math.abs(dy))
  return { x: a.cx + dx * t, y: a.cy + dy * t }
}

/** 文字の幅の目安（半角は全角の約0.58倍） */
const textWidth = (t: string) => [...t].reduce((n, ch) => n + (ch.charCodeAt(0) < 0x2000 ? 0.58 : 1), 0)

/** 長い名前を、箱に収まるように2行までに分ける。max は全角で数えた1行の文字数 */
export function splitLabel(label: string, max = 8): string[] {
  if (textWidth(label) <= max) return [label]
  // 区切りのよい位置（空白、かっこの前）のうち、2行の長さがいちばんそろう位置で分ける
  const cuts: number[] = []
  ;[...label].forEach((ch, i) => {
    if (i > 0 && (ch === ' ' || ch === '（')) cuts.push(i)
  })
  if (cuts.length === 0) cuts.push(Math.ceil(label.length / 2))
  const best = cuts.reduce((p, c) =>
    Math.max(textWidth(label.slice(0, c)), textWidth(label.slice(c))) < Math.max(textWidth(label.slice(0, p)), textWidth(label.slice(p))) ? c : p,
  )
  return [label.slice(0, best).trim(), label.slice(best).trim()]
}

interface Props {
  diagram: Body
  title: string
  selectedId?: string | null
  onSelect?: (id: string) => void
}

export function DiagramView({ diagram, title, selectedId, onSelect }: Props) {
  const boxes = new Map(diagram.nodes.map((n) => [n.id, nodeBox(n)]))
  const height = Math.max(...diagram.nodes.map((n) => nodeBox(n).y + nodeBox(n).h), 100) + 12
  const groups = diagram.nodes.filter((n) => n.kind === 'group')
  const items = diagram.nodes.filter((n) => n.kind !== 'group')
  // 外側の枠から順に描く（内側の枠が上に重なるように）
  groups.sort((a, b) => nodeBox(b).w * nodeBox(b).h - nodeBox(a).w * nodeBox(a).h)

  return (
    <figure className="mx-auto w-full max-w-md">
      <svg viewBox={`0 0 360 ${height}`} role="img" aria-label={title} className="h-auto w-full" fontFamily="inherit">
        <defs>
          <marker id="dg-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill={line} />
          </marker>
        </defs>
        {groups.map((g) => {
          const b = nodeBox(g)
          return (
            <g key={g.id}>
              <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={8} fill={g.parentId ? '#fff' : soft} stroke={line} strokeWidth="1.2" strokeDasharray="5 3" />
              <text x={b.x + 8} y={b.y + 15} fontSize={11} fontWeight={700} fill={line}>
                {g.label}
              </text>
            </g>
          )
        })}
        {diagram.edges.map((e) => {
          const a = boxes.get(e.from)
          const b = boxes.get(e.to)
          if (!a || !b) return null
          const p1 = edgePoint(a, b)
          const p2 = edgePoint(b, a)
          const mx = (p1.x + p2.x) / 2
          const my = (p1.y + p2.y) / 2
          return (
            <g key={e.id}>
              <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={line} strokeWidth="1.5" markerEnd="url(#dg-arrow)" />
              {e.label && (
                <>
                  <rect x={mx - textWidth(e.label) * 5.25 - 3} y={my - 8} width={textWidth(e.label) * 10.5 + 6} height={16} rx={4} fill="#fff" opacity="0.92" />
                  <text x={mx} y={my + 4} fontSize={10.5} fill={navy} textAnchor="middle">
                    {e.label}
                  </text>
                </>
              )}
            </g>
          )
        })}
        {items.map((n) => {
          const b = nodeBox(n)
          const selected = n.id === selectedId
          const lines = splitLabel(n.label, (b.w - 12) / 11.5)
          const actor = n.kind === 'actor'
          return (
            <g
              key={n.id}
              role={onSelect ? 'button' : undefined}
              tabIndex={onSelect ? 0 : undefined}
              aria-label={n.label}
              aria-pressed={onSelect ? selected : undefined}
              onClick={onSelect ? () => onSelect(n.id) : undefined}
              onKeyDown={
                onSelect
                  ? (ev) => {
                      if (ev.key === 'Enter' || ev.key === ' ') {
                        ev.preventDefault()
                        onSelect(n.id)
                      }
                    }
                  : undefined
              }
              style={onSelect ? { cursor: 'pointer' } : undefined}
            >
              <rect
                x={b.x}
                y={b.y}
                width={b.w}
                height={b.h}
                rx={actor ? b.h / 2 : 8}
                fill={selected ? tint : actor ? navy : '#fff'}
                stroke={selected ? orange : actor ? navy : line}
                strokeWidth={selected ? 3 : 1.5}
              />
              {lines.map((t, i) => (
                <text
                  key={i}
                  x={b.cx}
                  y={b.cy + 4 + (i - (lines.length - 1) / 2) * 13}
                  fontSize={11.5}
                  fontWeight={700}
                  fill={actor && !selected ? '#fff' : navy}
                  textAnchor="middle"
                >
                  {t}
                </text>
              ))}
            </g>
          )
        })}
      </svg>
      <figcaption className="mt-1 text-center text-sm text-navy-700">{title}</figcaption>
    </figure>
  )
}
