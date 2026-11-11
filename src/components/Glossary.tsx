/**
 * 用語の説明ポップアップ。本文中の用語をタップすると、その言葉の近くに表示する。
 * - 画面からはみ出さないよう、幅と位置を調整する
 * - ページの上に重ねて表示するため、本文の位置（スクロール）は変わらない
 * - 閉じるボタン、ウィンドウの外のタップ、Esc キーで閉じる
 */
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useEntryId } from '../hooks/useEntryId'
import { content } from '../content'
import type { GlossaryTerm } from '../content/schema'

interface Open {
  term: GlossaryTerm
  anchor: HTMLElement
}
interface Ctx {
  openId: string | null
  toggle: (termId: string, anchor: HTMLElement) => void
}
const GlossaryContext = createContext<Ctx>({ openId: null, toggle: () => {} })

export function useGlossary() {
  return useContext(GlossaryContext)
}

const MARGIN = 8

function Popover({ open, onClose }: { open: Open; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [style, setStyle] = useState<{ top: number; left: number; width: number } | null>(null)

  const place = useCallback(() => {
    const el = ref.current
    if (!el) return
    const vw = document.documentElement.clientWidth
    const vh = window.innerHeight
    const width = Math.min(380, vw - MARGIN * 2)
    const r = open.anchor.getBoundingClientRect()
    const left = Math.min(Math.max(r.left + r.width / 2 - width / 2, MARGIN), vw - width - MARGIN)
    el.style.width = `${width}px`
    const height = el.offsetHeight
    // スマートフォンでは下部のタブ、上部のバーに隠れないようにする
    const bottomBar = window.matchMedia('(min-width: 1024px)').matches ? 0 : 72
    const topBar = window.matchMedia('(min-width: 1024px)').matches ? 0 : 56
    const below = r.bottom + MARGIN
    const above = r.top - MARGIN - height
    const fitsBelow = below + height <= vh - bottomBar - MARGIN
    const fitsAbove = above >= topBar + MARGIN
    const top = fitsBelow || !fitsAbove ? below : above
    setStyle({ top: top + window.scrollY, left: left + window.scrollX, width })
  }, [open.anchor])

  useLayoutEffect(() => {
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [place])

  useEffect(() => {
    if (style) ref.current?.focus({ preventScroll: true })
  }, [style !== null]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node
      if (ref.current?.contains(t) || open.anchor.contains(t)) return
      onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('pointerdown', onPointer, true)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer, true)
      document.removeEventListener('keydown', onKey)
    }
  }, [open.anchor, onClose])

  const t = open.term
  return createPortal(
    <div
      ref={ref}
      role="dialog"
      aria-label={`用語の説明：${t.term}`}
      tabIndex={-1}
      data-testid="glossary-popover"
      className="absolute z-40 rounded-2xl border-2 border-brand-500 bg-white p-4 text-navy-900 shadow-xl outline-none"
      style={{ top: style?.top ?? 0, left: style?.left ?? 0, width: style?.width, visibility: style ? 'visible' : 'hidden' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-navy-700">用語</p>
          <p className="text-lg font-bold">{t.term}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="説明を閉じる"
          className="-mt-1 -mr-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-navy-100 text-xl font-bold"
        >
          ×
        </button>
      </div>
      <dl className="mt-2 flex flex-col gap-2 text-base leading-relaxed">
        <div>
          <dt className="text-sm font-bold text-navy-700">意味</dt>
          <dd>{t.description}</dd>
        </div>
        <div className="rounded-xl bg-brand-50 p-2">
          <dt className="text-sm font-bold text-navy-700">かんたんに言うと</dt>
          <dd>{t.plain}</dd>
        </div>
        <div>
          <dt className="text-sm font-bold text-navy-700">具体例</dt>
          <dd>{t.example}</dd>
        </div>
      </dl>
    </div>,
    document.body,
  )
}

export function GlossaryProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<Open | null>(null)
  const entryId = useEntryId()

  const close = useCallback(() => {
    setOpen((cur) => {
      // 閉じたあと、元の用語にフォーカスを戻す（画面は動かさない）
      cur?.anchor.focus({ preventScroll: true })
      return null
    })
  }, [])

  // 画面を移動したら閉じる
  useEffect(() => setOpen(null), [entryId])

  const value = useMemo<Ctx>(
    () => ({
      openId: open?.term.id ?? null,
      toggle: (termId, anchor) => {
        setOpen((cur) => {
          if (cur?.anchor === anchor) return null
          const term = content.glossary.find((g) => g.id === termId)
          return term ? { term, anchor } : null
        })
      },
    }),
    [open],
  )

  return (
    <GlossaryContext.Provider value={value}>
      {children}
      {open && <Popover key={open.term.id} open={open} onClose={close} />}
    </GlossaryContext.Provider>
  )
}
