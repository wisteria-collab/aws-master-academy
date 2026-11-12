/** アプリ全体の検索。レッスン・サービス・比較・用語を、1つの入力欄から探す */
export type SearchKind = 'lesson' | 'service' | 'comparison' | 'term'

export interface SearchDoc {
  kind: SearchKind
  id: string
  title: string
  /** 一覧に出す短い説明 */
  note: string
  /** タイトル以外の、検索の対象にする文章 */
  body: string
  to?: string
}

export interface SearchHit extends SearchDoc {
  score: number
}

/** 全角・半角、大文字・小文字の違いを気にせず探せるようにそろえる */
export function normalize(text: string): string {
  return text.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim()
}

/** 空白で区切った語を、すべて含むものだけを返す。タイトルに含むものを上に並べる */
export function search(docs: SearchDoc[], query: string, limit = 40): SearchHit[] {
  const words = normalize(query).split(' ').filter(Boolean)
  if (words.length === 0) return []
  const hits: SearchHit[] = []
  for (const d of docs) {
    const title = normalize(d.title)
    const body = normalize(`${d.note} ${d.body}`)
    let score = 0
    let ok = true
    for (const w of words) {
      if (title === w) score += 100
      else if (title.startsWith(w)) score += 60
      else if (title.includes(w)) score += 40
      else if (body.includes(w)) score += 10
      else {
        ok = false
        break
      }
    }
    if (ok) hits.push({ ...d, score })
  }
  return hits.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, 'ja')).slice(0, limit)
}
