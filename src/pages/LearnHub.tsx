import { BookIcon, DiagramIcon, SearchIcon } from '../components/icons'
import { Badge, LinkRow, PageHeader } from '../components/ui'
import { features } from '../config/app'

export function LearnHub() {
  const soon = (phase: number) => <Badge>準備中・Phase {phase}</Badge>
  return (
    <div>
      <PageHeader title="学ぶ" lead="講義で基礎を理解し、図鑑で調べ、構成図で組み立てます。" />
      <div className="flex flex-col gap-3">
        <LinkRow to="/learn/clf" title="CLFコース" note="クラウドの基礎・16テーマ（試験の概要は公開中）" icon={<BookIcon />} aside={soon(features.clf.phase)} />
        <LinkRow to="/learn/saa" title="SAA応用コース" note="公式4分野・14タスク（試験の概要は公開中）" icon={<BookIcon />} aside={soon(features.saa.phase)} />
        <LinkRow to="/services" title="サービス図鑑" note="サービス名・カテゴリーで検索" icon={<SearchIcon />} aside={soon(features.services.phase)} />
        <LinkRow to="/designer" title="構成図シミュレーター" note="お手本構成と設計問題" icon={<DiagramIcon />} aside={soon(features.designer.phase)} />
      </div>
    </div>
  )
}
