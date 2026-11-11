import { useMemo, useState } from 'react'
import { content } from '../content'

type Part = { text: string; termId?: string }

/** 段落の中の用語を見つけて分割する。用語は長いものを優先する */
function split(paragraph: string, terms: { id: string; term: string }[], seen: Set<string>): Part[] {
  const parts: Part[] = []
  let rest = paragraph
  while (rest.length > 0) {
    let best: { index: number; id: string; term: string } | undefined
    for (const t of terms) {
      if (seen.has(t.id)) continue
      const index = rest.indexOf(t.term)
      if (index === -1) continue
      if (!best || index < best.index || (index === best.index && t.term.length > best.term.length)) {
        best = { index, id: t.id, term: t.term }
      }
    }
    if (!best) break
    if (best.index > 0) parts.push({ text: rest.slice(0, best.index) })
    parts.push({ text: best.term, termId: best.id })
    seen.add(best.id)
    rest = rest.slice(best.index + best.term.length)
  }
  if (rest) parts.push({ text: rest })
  return parts
}

/**
 * 教材の本文。改行で段落に分け、用語集にある言葉は最初の1回だけタップで意味を表示できるようにする。
 */
export function RichText({ text, className = '' }: { text: string; className?: string }) {
  const [open, setOpen] = useState<string | null>(null)
  const paragraphs = useMemo(() => {
    const terms = content.glossary.map((g) => ({ id: g.id, term: g.term }))
    const seen = new Set<string>()
    return text.split('\n').filter((p) => p.trim()).map((p) => split(p, terms, seen))
  }, [text])
  const openTerm = content.glossary.find((g) => g.id === open)

  return (
    <div className={`flex flex-col gap-3 text-base leading-relaxed text-navy-900 ${className}`}>
      {paragraphs.map((parts, i) => (
        <div key={i}>
          <p>
            {parts.map((part, j) =>
              part.termId ? (
                <button
                  key={j}
                  type="button"
                  aria-expanded={open === part.termId}
                  onClick={() => setOpen(open === part.termId ? null : part.termId!)}
                  className="rounded bg-brand-50 px-0.5 font-semibold underline decoration-brand-500 decoration-dotted decoration-2 underline-offset-4"
                >
                  {part.text}
                </button>
              ) : (
                <span key={j}>{part.text}</span>
              ),
            )}
          </p>
          {openTerm && parts.some((p) => p.termId === openTerm.id) && (
            <div role="note" className="mt-2 rounded-xl border border-brand-500 bg-brand-50 p-3 text-base">
              <p className="font-bold">用語：{openTerm.term}</p>
              <p className="mt-1">{openTerm.description}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
