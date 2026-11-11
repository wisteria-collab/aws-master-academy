/**
 * 構成図の表示。スマートフォンの幅（約360px）で文字が読めるよう、
 * 図の横幅を 360 の座標にそろえて描く。AWSの公式アイコンは使わず、枠と文字で表す。
 */
import { useRef, type PointerEvent as ReactPointerEvent } from 'react'
import type { DiagramBody } from '../content/schema'
import { nodeBox } from '../logic/diagram'

export { nodeBox } from '../logic/diagram'

type Body = DiagramBody

const navy = '#232f3e'
const orange = '#ff9900'
const tint = '#fff6e5'
const line = '#46597a'
const soft = '#f3f5f9'

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
  /** 以下は編集画面用 */
  selectedEdgeId?: string | null
  onSelectEdge?: (id: string) => void
  onBackground?: () => void
  /** 箱をドラッグしたとき。dx・dy は、ドラッグを始めた位置からの移動量（図の座標） */
  onMoveStart?: (id: string) => void
  onMove?: (id: string, dx: number, dy: number) => void
  onMoveEnd?: (id: string) => void
  /** 図の高さ。省略すると、箱に合わせる */
  height?: number
  /** 線をつなぐ元として選ばれている箱 */
  connectFromId?: string | null
  showCaption?: boolean
}

export function DiagramView({ diagram, title, selectedId, onSelect, selectedEdgeId, onSelectEdge, onBackground, onMoveStart, onMove, onMoveEnd, height: fixedHeight, connectFromId, showCaption = true }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const drag = useRef<{ id: string; x: number; y: number; moved: boolean } | null>(null)
  const editable = onMove !== undefined
  const boxes = new Map(diagram.nodes.map((n) => [n.id, nodeBox(n)]))
  const height = fixedHeight ?? Math.max(...diagram.nodes.map((n) => nodeBox(n).y + nodeBox(n).h), 100) + 12
  const groups = diagram.nodes.filter((n) => n.kind === 'group')
  const items = diagram.nodes.filter((n) => n.kind !== 'group')
  // 外側の枠から順に描く（内側の枠が上に重なるように）
  groups.sort((a, b) => nodeBox(b).w * nodeBox(b).h - nodeBox(a).w * nodeBox(a).h)
  const outer = (id: string) => !diagram.nodes.some((o) => o.kind === 'group' && o.id !== id && contains(nodeBox(o), boxes.get(id)!))

  const scale = () => 360 / (svgRef.current?.getBoundingClientRect().width || 360)
  const handlers = (id: string) => {
    if (!onSelect) return {}
    const key = (ev: { key: string; preventDefault: () => void }) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault()
        onSelect(id)
      }
    }
    if (!editable) return { onClick: () => onSelect(id), onKeyDown: key }
    return {
      onKeyDown: key,
      onPointerDown: (ev: ReactPointerEvent<SVGGElement>) => {
        ev.stopPropagation()
        ev.currentTarget.setPointerCapture?.(ev.pointerId)
        drag.current = { id, x: ev.clientX, y: ev.clientY, moved: false }
        onMoveStart?.(id)
      },
      onPointerMove: (ev: ReactPointerEvent<SVGGElement>) => {
        const d = drag.current
        if (!d || d.id !== id) return
        const dx = (ev.clientX - d.x) * scale()
        const dy = (ev.clientY - d.y) * scale()
        if (!d.moved && Math.hypot(dx, dy) < 5) return
        d.moved = true
        onMove?.(id, dx, dy)
      },
      onPointerUp: (ev: ReactPointerEvent<SVGGElement>) => {
        const d = drag.current
        drag.current = null
        ev.stopPropagation()
        if (!d) return
        if (d.moved) onMoveEnd?.(id)
        else onSelect(id)
      },
      onPointerCancel: () => {
        if (drag.current?.moved) onMoveEnd?.(id)
        drag.current = null
      },
      onClick: (ev: { stopPropagation: () => void }) => ev.stopPropagation(),
    }
  }
  const interactive = (label: string, selected: boolean) =>
    onSelect ? { role: 'button' as const, tabIndex: 0, 'aria-label': label, 'aria-pressed': selected, style: { cursor: 'pointer', touchAction: editable ? ('none' as const) : undefined } } : {}

  return (
    <figure className="mx-auto w-full max-w-md">
      <svg ref={svgRef} viewBox={`0 0 360 ${height}`} role="img" aria-label={title} className="h-auto w-full select-none" fontFamily="inherit" onClick={onBackground}>
        <defs>
          <marker id="dg-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill={line} />
          </marker>
          <marker id="dg-arrow-on" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill={orange} />
          </marker>
        </defs>
        {groups.map((g) => {
          const b = nodeBox(g)
          const selected = editable && g.id === selectedId
          return (
            <g key={g.id} {...(editable ? interactive(`枠：${g.label}`, selected) : {})} {...(editable ? handlers(g.id) : {})}>
              <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={8} fill={outer(g.id) ? soft : '#fff'} stroke={selected ? orange : line} strokeWidth={selected ? 2.5 : 1.2} strokeDasharray="5 3" />
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
          const on = e.id === selectedEdgeId
          return (
            <g key={e.id}>
              <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={on ? orange : line} strokeWidth={on ? 3 : 1.5} markerEnd={on ? 'url(#dg-arrow-on)' : 'url(#dg-arrow)'} />
              {e.label && (
                <>
                  <rect x={mx - textWidth(e.label) * 5.25 - 3} y={my - 8} width={textWidth(e.label) * 10.5 + 6} height={16} rx={4} fill="#fff" opacity="0.92" />
                  <text x={mx} y={my + 4} fontSize={10.5} fill={navy} textAnchor="middle">
                    {e.label}
                  </text>
                </>
              )}
              {onSelectEdge && (
                <rect
                  x={mx - Math.max(Math.hypot(p2.x - p1.x, p2.y - p1.y), 24) / 2}
                  y={my - 12}
                  width={Math.max(Math.hypot(p2.x - p1.x, p2.y - p1.y), 24)}
                  height={24}
                  transform={`rotate(${(Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI} ${mx} ${my})`}
                  fill="transparent"
                  role="button"
                  tabIndex={0}
                  aria-label={`線：${labelOf(diagram, e.from)} から ${labelOf(diagram, e.to)}`}
                  aria-pressed={on}
                  style={{ cursor: 'pointer' }}
                  onClick={(ev) => {
                    ev.stopPropagation()
                    onSelectEdge(e.id)
                  }}
                  onKeyDown={(ev) => {
                    if (ev.key === 'Enter' || ev.key === ' ') {
                      ev.preventDefault()
                      onSelectEdge(e.id)
                    }
                  }}
                />
              )}
            </g>
          )
        })}
        {items.map((n) => {
          const b = nodeBox(n)
          const selected = n.id === selectedId
          const from = n.id === connectFromId
          const lines = splitLabel(n.label, (b.w - 12) / 11.5)
          const actor = n.kind === 'actor'
          return (
            <g key={n.id} {...interactive(n.label, selected)} {...handlers(n.id)}>
              <rect
                x={b.x}
                y={b.y}
                width={b.w}
                height={b.h}
                rx={actor ? b.h / 2 : 8}
                fill={selected || from ? tint : actor ? navy : '#fff'}
                stroke={selected || from ? orange : actor ? navy : line}
                strokeWidth={selected || from ? 3 : 1.5}
                strokeDasharray={from && !selected ? '4 3' : undefined}
              />
              {lines.map((t, i) => (
                <text
                  key={i}
                  x={b.cx}
                  y={b.cy + 4 + (i - (lines.length - 1) / 2) * 13}
                  fontSize={11.5}
                  fontWeight={700}
                  fill={actor && !(selected || from) ? '#fff' : navy}
                  textAnchor="middle"
                >
                  {t}
                </text>
              ))}
            </g>
          )
        })}
      </svg>
      {showCaption && <figcaption className="mt-1 text-center text-sm text-navy-700">{title}</figcaption>}
    </figure>
  )
}

type B = ReturnType<typeof nodeBox>
const contains = (o: B, i: B) => i.x >= o.x && i.y >= o.y && i.x + i.w <= o.x + o.w && i.y + i.h <= o.y + o.h
const labelOf = (d: Body, id: string) => d.nodes.find((n) => n.id === id)?.label ?? ''
