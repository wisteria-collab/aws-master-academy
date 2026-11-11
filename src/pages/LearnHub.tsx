import { usePageTitle } from '../components/Navigation'
import { BookIcon, DiagramIcon, SearchIcon } from '../components/icons'
import { Badge, LinkRow, PageHeader } from '../components/ui'
import { features } from '../config/app'
import { plannedLessons } from '../config/labels'
import { content } from '../content'

export function LearnHub() {
  usePageTitle('学ぶ')
  const soon = (phase: number) => <Badge>準備中・Phase {phase}</Badge>
  const open = <Badge tone="good">一部公開中</Badge>
  const done = <Badge tone="good">全テーマ公開</Badge>
  const state = (n: number, planned: number) => (n >= planned ? done : open)
  const clfLessons = content.lessons.filter((l) => l.course === 'clf').length
  const saaLessons = content.lessons.filter((l) => l.course === 'saa').length
  return (
    <div>
      <PageHeader title="学ぶ" lead="講義で基礎を理解し、図鑑で調べ、構成図で組み立てます。" />
      <div className="flex flex-col gap-3">
        <LinkRow to="/learn/clf" title="CLFコース" note={`クラウドの基礎・公開中 ${clfLessons} / 予定 ${plannedLessons.clf} テーマ`} icon={<BookIcon />} aside={state(clfLessons, plannedLessons.clf)} />
        <LinkRow to="/learn/saa" title="SAA応用コース" note={`公式4分野・14タスク・公開中 ${saaLessons} / 予定 ${plannedLessons.saa} テーマ`} icon={<BookIcon />} aside={saaLessons > 0 ? state(saaLessons, plannedLessons.saa) : soon(features.saa.phase)} />
        <LinkRow to="/services" title="サービス図鑑" note={`サービス名・カテゴリーで検索・${content.services.length} サービス公開中`} icon={<SearchIcon />} aside={open} />
        <LinkRow to="/designer" title="構成図シミュレーター" note={`お手本構成 ${content.diagrams.length} テーマ公開中・作図と設計問題は準備中`} icon={<DiagramIcon />} aside={content.diagrams.length > 0 ? open : soon(features.designer.phase)} />
      </div>
    </div>
  )
}
