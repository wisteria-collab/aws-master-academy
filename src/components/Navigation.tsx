/**
 * 画面の移動を覚えておく仕組み。
 * - 直前に見ていた画面の名前を「戻る」ボタンに表示する
 * - 戻ったときに、元のスクロール位置を復元する（ブラウザの戻るボタンでも同じ）
 */
import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'
import { Link, useLocation, useNavigate, useNavigationType } from 'react-router-dom'
import { useEntryId } from '../hooks/useEntryId'

interface Entry {
  key: string
  path: string
  title: string
}
interface NavState {
  stack: Entry[]
  pos: number
}

const STORE_NAV = 'ama:nav'
const STORE_SCROLL = 'ama:scroll'

function load<T>(name: string, fallback: T): T {
  try {
    const raw = window.sessionStorage.getItem(name)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}
function save(name: string, value: unknown) {
  try {
    window.sessionStorage.setItem(name, JSON.stringify(value))
  } catch {
    // 保存できなくても動作は続ける
  }
}

interface Ctx {
  previous: Entry | null
  setTitle: (title: string) => void
}
const NavContext = createContext<Ctx>({ previous: null, setTitle: () => {} })

export function NavigationProvider({ children }: { children: ReactNode }) {
  const location = useLocation()
  const type = useNavigationType()
  const id = useEntryId()
  const path = `${location.pathname}${location.search}`
  const nav = useRef<NavState>(load<NavState>(STORE_NAV, { stack: [], pos: -1 }))
  const scrolls = useRef<Record<string, number>>(load<Record<string, number>>(STORE_SCROLL, {}))
  const currentKey = useRef(id)
  const restoring = useRef(false)

  // 履歴の中での現在位置を更新する（同じ履歴に対しては何度呼んでも結果が変わらない）
  const s = nav.current
  if (s.stack[s.pos]?.key !== id) {
    const entry: Entry = { key: id, path, title: '' }
    const found = s.stack.findIndex((e) => e.key === id)
    if (found >= 0) {
      s.pos = found
    } else if (type === 'REPLACE' && s.pos >= 0) {
      s.stack[s.pos] = { ...entry, title: s.stack[s.pos].title }
    } else {
      // 新しい画面へ進んだ：現在位置より先の履歴は捨てて追加する
      s.stack = [...s.stack.slice(0, s.pos + 1), entry].slice(-50)
      s.pos = s.stack.length - 1
    }
    save(STORE_NAV, s)
  }
  const previous = s.pos > 0 ? s.stack[s.pos - 1] : null
  const previousKey = previous?.key ?? null

  // スクロール位置：新しい画面は先頭から、戻ったときは元の位置から
  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual'
    const saved = scrolls.current[id]
    const target = type === 'POP' && saved !== undefined ? saved : 0
    currentKey.current = id
    restoring.current = true
    let frame = 0
    let raf = 0
    const step = () => {
      window.scrollTo(0, target)
      frame += 1
      // 内容の読み込みで高さが変わることがあるため、位置が合うまで数回試す
      if (frame < 30 && Math.abs(window.scrollY - target) > 2) {
        raf = window.requestAnimationFrame(step)
      } else {
        scrolls.current[id] = window.scrollY
        restoring.current = false
      }
    }
    step()
    return () => {
      window.cancelAnimationFrame(raf)
      restoring.current = false
    }
  }, [id, type])

  useEffect(() => {
    let timer = 0
    const onScroll = () => {
      if (restoring.current) return
      scrolls.current[currentKey.current] = window.scrollY
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        // 古い記録が増えすぎないよう、新しいものだけ残す
        const keys = Object.keys(scrolls.current)
        if (keys.length > 60) for (const k of keys.slice(0, keys.length - 60)) delete scrolls.current[k]
        save(STORE_SCROLL, scrolls.current)
      }, 150)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    const flush = () => save(STORE_SCROLL, scrolls.current)
    window.addEventListener('pagehide', flush)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pagehide', flush)
      window.clearTimeout(timer)
    }
  }, [])

  const value = useMemo<Ctx>(
    () => ({
      previous,
      setTitle: (title: string) => {
        const s = nav.current
        if (s.stack[s.pos] && s.stack[s.pos].title !== title) {
          s.stack[s.pos].title = title
          save(STORE_NAV, s)
        }
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [previousKey, previous?.title],
  )

  return <NavContext.Provider value={value}>{children}</NavContext.Provider>
}

/** 画面の名前を登録する。「戻る」ボタンの行き先の表示と、ブラウザのタブ名に使う */
export function usePageTitle(title: string) {
  const { setTitle } = useContext(NavContext)
  useEffect(() => {
    if (!title) return
    setTitle(title)
    document.title = `${title}｜AWS Master Academy`
  }, [title, setTitle])
}

interface BackProps {
  /** 履歴がないとき（URLを直接開いたときなど）の戻り先 */
  fallback: string
  fallbackLabel: string
}

/**
 * 直前に見ていた画面へ戻るボタン。元のスクロール位置や入力の状態に戻る。
 * 直前の画面が一覧（fallback）と違う場合は、一覧へのリンクも並べる。
 */
export function BackLink({ fallback, fallbackLabel }: BackProps) {
  const { previous } = useContext(NavContext)
  const navigate = useNavigate()
  const pill = 'inline-flex min-h-11 max-w-full items-center gap-1 rounded-full border border-navy-600 bg-white px-4 text-base font-bold text-navy-900'

  if (!previous) {
    return (
      <Link to={fallback} className={pill}>
        <span aria-hidden="true">←</span>
        <span className="truncate">{fallbackLabel}</span>
      </Link>
    )
  }
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <button type="button" onClick={() => navigate(-1)} className={pill} data-testid="back">
        <span aria-hidden="true">←</span>
        <span className="truncate">{previous.title ? `戻る：${previous.title}` : '前の画面に戻る'}</span>
      </button>
      {previous.path !== fallback && (
        <Link to={fallback} className="inline-flex min-h-11 items-center text-base font-semibold text-navy-700 underline">
          {fallbackLabel}へ
        </Link>
      )}
    </div>
  )
}
