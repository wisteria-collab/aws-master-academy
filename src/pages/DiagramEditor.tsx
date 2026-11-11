import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { DiagramView } from '../components/DiagramView'
import { BackLink, usePageTitle } from '../components/Navigation'
import { Button, Card, EmptyState } from '../components/ui'
import { categoryLabel } from '../config/labels'
import { content } from '../content'
import type { DiagramBody } from '../content/schema'
import { useStore } from '../hooks/useStore'
import {
  addEdge,
  addNode,
  canvasHeight,
  emptyDiagram,
  moveNode,
  parseDiagram,
  removeEdge,
  removeNode,
  renameNode,
  resizeNode,
  toSaved,
  updateEdge,
  usedServiceIds,
  type NewNode,
} from '../logic/diagram'
import { storage } from '../storage'

type Selection = { kind: 'node' | 'edge'; id: string } | null
type Picker = 'service' | 'group' | 'actor' | null

const groupPresets: { label: string; width: number; height: number }[] = [
  { label: 'VPC', width: 328, height: 220 },
  { label: 'アベイラビリティゾーン', width: 156, height: 180 },
  { label: 'パブリックサブネット', width: 140, height: 76 },
  { label: 'プライベートサブネット', width: 140, height: 76 },
  { label: 'リージョン', width: 344, height: 260 },
  { label: 'オンプレミス', width: 140, height: 100 },
  { label: '枠', width: 160, height: 100 },
]
const actorPresets = ['利用者', '管理者', 'オンプレミスのサーバー', '外部のシステム']

/** 箱に収まりやすい名前にする（長いサービス名は、先頭の Amazon / AWS を省く） */
const shortName = (name: string) => (name.length > 22 ? name.replace(/^(Amazon|AWS)\s+/, '') : name)

const inputClass = 'min-h-11 w-full rounded-xl border border-navy-600 bg-white px-3 text-base'

export function DiagramEditor() {
  const { diagramId = '' } = useParams()
  const navigate = useNavigate()
  const saved = useStore('diagrams')
  const record = saved.data.find((d) => d.id === diagramId)

  const [loaded, setLoaded] = useState(false)
  const [name, setName] = useState('')
  const [body, setBody] = useState<DiagramBody>(emptyDiagram)
  const [sel, setSel] = useState<Selection>(null)
  const [connecting, setConnecting] = useState(false)
  const [picker, setPicker] = useState<Picker>(null)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [message, setMessage] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [undoCount, setUndoCount] = useState(0)
  const history = useRef<DiagramBody[]>([])
  const dragBase = useRef<DiagramBody | null>(null)
  const challengeId = useRef<string | undefined>(undefined)

  usePageTitle(name || '構成図を作る')

  // 保存済みのデータを、最初の1回だけ読み込む
  useEffect(() => {
    if (loaded || saved.loading || !record) return
    setName(record.name)
    setBody(parseDiagram(record.nodes, record.edges))
    challengeId.current = record.challengeId
    setLoaded(true)
  }, [loaded, saved.loading, record])

  // 変更のたびに、少し待ってから自動で保存する
  useEffect(() => {
    if (!loaded) return
    setStatus('保存中…')
    const timer = window.setTimeout(() => {
      const d = toSaved(body)
      storage
        .put('diagrams', { id: diagramId, name: name.trim() || '名前のない構成図', nodes: d.nodes, edges: d.edges, challengeId: challengeId.current, updatedAt: new Date().toISOString() })
        .then(() => setStatus('自動で保存しました'))
        .catch(() => setStatus('保存できませんでした。設定の「保存の状態」を確認してください'))
    }, 300)
    return () => window.clearTimeout(timer)
  }, [loaded, body, name, diagramId])

  const pushHistory = (prev: DiagramBody) => {
    history.current = [...history.current.slice(-39), prev]
    setUndoCount(history.current.length)
  }
  const apply = (next: DiagramBody) => {
    if (next === body) return
    pushHistory(body)
    setBody(next)
  }
  const undo = () => {
    const prev = history.current.pop()
    setUndoCount(history.current.length)
    if (!prev) return
    setBody(prev)
    setSel(null)
    setConnecting(false)
    setMessage('1つ前の状態に戻しました')
  }

  const add = (spec: NewNode) => {
    const r = addNode(body, spec)
    apply(r.diagram)
    setSel({ kind: 'node', id: r.id })
    setPicker(null)
    setQuery('')
    setConnecting(false)
    setMessage(`「${spec.label}」を追加しました。ドラッグで動かせます`)
  }

  const selectNode = (id: string) => {
    if (connecting && sel?.kind === 'node' && sel.id !== id) {
      const r = addEdge(body, sel.id, id)
      setConnecting(false)
      if (r.id) {
        apply(r.diagram)
        setSel({ kind: 'edge', id: r.id })
        setMessage('線をつなぎました。線の名前や向きを変えられます')
      } else {
        setMessage('この2つは、すでに線でつながっています')
      }
      return
    }
    setConnecting(false)
    setSel((prev) => (prev?.kind === 'node' && prev.id === id ? null : { kind: 'node', id }))
    setMessage('')
  }

  const node = sel?.kind === 'node' ? body.nodes.find((n) => n.id === sel.id) : undefined
  const edge = sel?.kind === 'edge' ? body.edges.find((e) => e.id === sel.id) : undefined
  const service = node?.serviceId ? content.services.find((s) => s.id === node.serviceId) : undefined
  const services = useMemo(() => usedServiceIds(body).map((id) => content.services.find((s) => s.id === id)).filter((s) => s !== undefined), [body])
  const labelOf = (id: string) => body.nodes.find((n) => n.id === id)?.label ?? ''

  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = [...content.services].sort((a, b) => a.name.localeCompare(b.name))
    if (!q) return list
    return list.filter((s) => [s.name, ...s.aliases, categoryLabel(s.category)].some((t) => t.toLowerCase().includes(q)))
  }, [query])

  if (saved.loading) return <p className="text-base text-navy-700">読み込み中…</p>
  if (!record && !loaded) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink fallback="/designer" fallbackLabel="構成図シミュレーター" />
        <EmptyState title="この構成図は見つかりません">削除されたか、別の端末で作られた可能性があります。</EmptyState>
      </div>
    )
  }

  const move = (dx: number, dy: number) => node && apply(moveNode(body, node.id, dx, dy))
  const size = (dw: number, dh: number) => node && apply(resizeNode(body, node.id, dw, dh))

  return (
    <div className="flex flex-col gap-4">
      <BackLink fallback="/designer" fallbackLabel="構成図シミュレーター" />

      <div>
        <label htmlFor="dg-name" className="text-sm font-bold text-navy-700">
          構成図の名前
        </label>
        <input id="dg-name" className={`${inputClass} mt-1 text-lg font-bold`} value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
        <p className="mt-1 text-sm text-navy-700" role="status">
          {status}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant={picker === 'service' ? 'primary' : 'secondary'} onClick={() => setPicker(picker === 'service' ? null : 'service')}>
          ＋ サービス
        </Button>
        <Button variant={picker === 'group' ? 'primary' : 'secondary'} onClick={() => setPicker(picker === 'group' ? null : 'group')}>
          ＋ 枠
        </Button>
        <Button variant={picker === 'actor' ? 'primary' : 'secondary'} onClick={() => setPicker(picker === 'actor' ? null : 'actor')}>
          ＋ 人・外部
        </Button>
        <Button onClick={undo} disabled={undoCount === 0}>
          元に戻す
        </Button>
      </div>

      {picker === 'service' && (
        <Card>
          <label htmlFor="dg-search" className="text-base font-bold">
            追加するサービス
          </label>
          <input id="dg-search" className={`${inputClass} mt-2`} placeholder="サービス名で探す（例：S3、データベース）" value={query} onChange={(e) => setQuery(e.target.value)} />
          <ul className="mt-2 flex max-h-72 flex-col gap-1 overflow-y-auto" aria-label="サービスの候補">
            {candidates.map((s) => (
              <li key={s.id}>
                <button type="button" className="flex min-h-11 w-full items-center justify-between gap-2 rounded-lg border border-navy-100 px-3 text-left text-base hover:border-brand-500" onClick={() => add({ kind: 'service', label: shortName(s.name), serviceId: s.id })}>
                  <span className="font-bold">{s.name}</span>
                  <span className="shrink-0 text-sm text-navy-700">{categoryLabel(s.category)}</span>
                </button>
              </li>
            ))}
            {candidates.length === 0 && <li className="p-2 text-base text-navy-700">見つかりません。別の言葉で探してください。</li>}
          </ul>
        </Card>
      )}
      {picker === 'group' && (
        <Card>
          <p className="text-base font-bold">追加する枠</p>
          <p className="mt-1 text-sm text-navy-700">枠は、VPCやサブネットなどの「範囲」を表します。図の下に追加されるので、動かして箱を囲んでください。</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {groupPresets.map((g) => (
              <Button key={g.label} onClick={() => add({ kind: 'group', ...g })}>
                {g.label}
              </Button>
            ))}
          </div>
        </Card>
      )}
      {picker === 'actor' && (
        <Card>
          <p className="text-base font-bold">追加する人・外部のもの</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {actorPresets.map((a) => (
              <Button key={a} onClick={() => add({ kind: 'actor', label: a, width: a.length > 5 ? 136 : 88 })}>
                {a}
              </Button>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <p className="text-sm text-navy-700">箱をタップすると選べます。ドラッグで動かせます。</p>
        <div className="mt-2 rounded-xl bg-navy-50 p-1">
          <DiagramView
            diagram={body}
            title={name || '構成図'}
            showCaption={false}
            height={canvasHeight(body)}
            selectedId={sel?.kind === 'node' ? sel.id : null}
            selectedEdgeId={sel?.kind === 'edge' ? sel.id : null}
            connectFromId={connecting && sel?.kind === 'node' ? sel.id : null}
            onSelect={selectNode}
            onSelectEdge={(id) => {
              setConnecting(false)
              setSel((prev) => (prev?.kind === 'edge' && prev.id === id ? null : { kind: 'edge', id }))
            }}
            onBackground={() => {
              setSel(null)
              setConnecting(false)
            }}
            onMoveStart={() => {
              dragBase.current = body
            }}
            onMove={(id, dx, dy) => dragBase.current && setBody(moveNode(dragBase.current, id, dx, dy))}
            onMoveEnd={() => {
              if (dragBase.current && dragBase.current !== body) pushHistory(dragBase.current)
              dragBase.current = null
            }}
          />
        </div>
        {body.nodes.length === 0 && <p className="mt-2 text-base text-navy-800">まだ何もありません。「＋ サービス」から、最初の箱を追加しましょう。</p>}
        <p className="mt-2 min-h-6 text-base text-navy-800" role="status">
          {connecting ? 'つなぐ先の箱をタップしてください' : message}
        </p>
      </Card>

      {node && (
        <Card>
          <h2 className="text-lg font-bold">選択中：{node.kind === 'group' ? '枠' : '箱'}</h2>
          <label htmlFor="dg-label" className="mt-2 block text-sm font-bold text-navy-700">
            表示する名前
          </label>
          <input id="dg-label" className={`${inputClass} mt-1`} value={node.label} maxLength={40} onChange={(e) => setBody(renameNode(body, node.id, e.target.value))} />
          <div className="mt-3 flex flex-wrap gap-2">
            {node.kind !== 'group' && (
              <Button variant={connecting ? 'primary' : 'secondary'} onClick={() => setConnecting(!connecting)}>
                {connecting ? 'つなぐのをやめる' : '線をつなぐ'}
              </Button>
            )}
            <Button
              onClick={() => {
                apply(removeNode(body, node.id))
                setSel(null)
                setConnecting(false)
                setMessage(`「${node.label}」を削除しました`)
              }}
            >
              削除
            </Button>
          </div>
          <p className="mt-3 text-sm font-bold text-navy-700">位置を少しずつ動かす</p>
          <div className="mt-1 flex flex-wrap gap-2">
            <Button aria-label="左へ動かす" onClick={() => move(-8, 0)}>←</Button>
            <Button aria-label="上へ動かす" onClick={() => move(0, -8)}>↑</Button>
            <Button aria-label="下へ動かす" onClick={() => move(0, 8)}>↓</Button>
            <Button aria-label="右へ動かす" onClick={() => move(8, 0)}>→</Button>
          </div>
          <p className="mt-3 text-sm font-bold text-navy-700">大きさ</p>
          <div className="mt-1 flex flex-wrap gap-2">
            <Button onClick={() => size(-16, 0)}>幅 −</Button>
            <Button onClick={() => size(16, 0)}>幅 ＋</Button>
            <Button onClick={() => size(0, -16)}>高さ −</Button>
            <Button onClick={() => size(0, 16)}>高さ ＋</Button>
          </div>
          {service && (
            <div className="mt-3 rounded-xl border border-navy-100 p-3">
              <p className="text-base font-bold">{service.name}</p>
              <p className="text-sm leading-relaxed text-navy-700">{service.summary}</p>
              <Link to={`/services/${service.id}`} className="mt-2 inline-flex min-h-11 items-center rounded-xl border border-navy-600 px-4 text-base font-bold">
                図鑑で見る
              </Link>
            </div>
          )}
        </Card>
      )}

      {edge && (
        <Card>
          <h2 className="text-lg font-bold">選択中：線</h2>
          <p className="mt-1 text-base text-navy-800">
            {labelOf(edge.from)} → {labelOf(edge.to)}
          </p>
          <label htmlFor="dg-edge" className="mt-2 block text-sm font-bold text-navy-700">
            線の名前（省略できます。例：HTTPS、読み書き）
          </label>
          <input id="dg-edge" className={`${inputClass} mt-1`} value={edge.label ?? ''} maxLength={16} onChange={(e) => setBody(updateEdge(body, edge.id, { label: e.target.value }))} />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={() => apply(updateEdge(body, edge.id, { reverse: true }))}>向きを逆にする</Button>
            <Button
              onClick={() => {
                apply(removeEdge(body, edge.id))
                setSel(null)
                setMessage('線を削除しました')
              }}
            >
              削除
            </Button>
          </div>
        </Card>
      )}

      {services.length > 0 && (
        <Card>
          <h2 className="text-lg font-bold">この図で使っているサービス</h2>
          <ul className="mt-2 flex flex-col gap-2">
            {services.map((s) => (
              <li key={s.id}>
                <Link to={`/services/${s.id}`} className="block rounded-xl border border-navy-100 p-3 transition-colors hover:border-brand-500">
                  <span className="text-base font-bold">{s.name}</span>
                  <span className="block text-sm leading-relaxed text-navy-700">{s.summary}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <h2 className="text-lg font-bold">この構成図を削除する</h2>
        <p className="mt-1 text-base text-navy-700">削除すると、元に戻せません。</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {confirmDelete ? (
            <>
              <Button
                variant="danger"
                onClick={() => {
                  setLoaded(false)
                  void storage
                    .remove('diagrams', diagramId)
                    .catch(() => {})
                    .then(() => navigate('/designer', { replace: true }))
                }}
              >
                本当に削除する
              </Button>
              <Button onClick={() => setConfirmDelete(false)}>やめる</Button>
            </>
          ) : (
            <Button onClick={() => setConfirmDelete(true)}>削除する</Button>
          )}
        </div>
      </Card>
    </div>
  )
}
