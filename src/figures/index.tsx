/**
 * 教材の図解。スマートフォンの幅（約360px）で文字が小さくならないよう、
 * viewBox の幅を 360 にそろえ、最大幅を抑えて表示する。
 */
import type { ReactNode } from 'react'
import type { FigureId } from './ids'

const navy = '#232f3e'
const orange = '#ff9900'
const tint = '#fff6e5'
const line = '#46597a'
const soft = '#e3e8f0'

function Frame({ title, height, children }: { title: string; height: number; children: ReactNode }) {
  return (
    <figure className="mx-auto w-full max-w-md">
      <svg viewBox={`0 0 360 ${height}`} role="img" aria-label={title} className="h-auto w-full" fontFamily="inherit">
        {children}
      </svg>
      <figcaption className="mt-1 text-center text-sm text-navy-700">{title}</figcaption>
    </figure>
  )
}

function Box({ x, y, w, h, fill = '#fff', stroke = line, r = 8 }: { x: number; y: number; w: number; h: number; fill?: string; stroke?: string; r?: number }) {
  return <rect x={x} y={y} width={w} height={h} rx={r} fill={fill} stroke={stroke} strokeWidth="1.5" />
}

function T({ x, y, children, size = 13, bold, fill = navy, anchor = 'middle' }: { x: number; y: number; children: ReactNode; size?: number; bold?: boolean; fill?: string; anchor?: 'start' | 'middle' | 'end' }) {
  return (
    <text x={x} y={y} fontSize={size} fontWeight={bold ? 700 : 400} fill={fill} textAnchor={anchor}>
      {children}
    </text>
  )
}

function RegionAz() {
  const az = (x: number, name: string) => (
    <g>
      <Box x={x} y={52} w={100} h={118} fill={tint} stroke={orange} />
      <T x={x + 50} y={72} bold>{name}</T>
      <Box x={x + 12} y={84} w={76} h={34} />
      <T x={x + 50} y={105} size={12}>データセンター</T>
      <Box x={x + 12} y={126} w={76} h={34} />
      <T x={x + 50} y={147} size={12}>データセンター</T>
    </g>
  )
  return (
    <Frame title="リージョンの中に、離れた複数のアベイラビリティゾーンがある" height={236}>
      <Box x={6} y={6} w={348} h={224} fill="#fff" stroke={navy} r={12} />
      <T x={20} y={30} bold anchor="start" size={14}>リージョン（例：東京）</T>
      {az(16, 'AZ 1')}
      {az(130, 'AZ 2')}
      {az(244, 'AZ 3')}
      <line x1="116" y1="111" x2="130" y2="111" stroke={line} strokeWidth="2" />
      <line x1="230" y1="111" x2="244" y2="111" stroke={line} strokeWidth="2" />
      <T x={180} y={192}>AZどうしは離れた場所にあり、</T>
      <T x={180} y={212}>低遅延の専用回線で結ばれている</T>
    </Frame>
  )
}

function SharedResponsibility() {
  const chip = (x: number, y: number, w: number, label: string, dark?: boolean) => (
    <g>
      <rect x={x} y={y} width={w} height={30} rx={6} fill={dark ? '#31415a' : '#fff'} stroke={dark ? '#31415a' : orange} strokeWidth="1.5" />
      <T x={x + w / 2} y={y + 20} size={12} fill={dark ? '#fff' : navy}>{label}</T>
    </g>
  )
  return (
    <Frame title="責任共有モデル：上が利用者、下がAWSの責任" height={292}>
      <Box x={6} y={6} w={348} h={134} fill={tint} stroke={orange} r={12} />
      <T x={20} y={30} bold anchor="start" size={14}>利用者の責任</T>
      <T x={20} y={50} anchor="start" size={12}>クラウド「内」のセキュリティ</T>
      {chip(16, 62, 160, 'データ')}
      {chip(184, 62, 160, 'アクセス権限（IAM）')}
      {chip(16, 100, 160, 'OS・アプリケーション')}
      {chip(184, 100, 160, 'ネットワーク設定・暗号化')}
      <Box x={6} y={152} w={348} h={134} fill={navy} stroke={navy} r={12} />
      <T x={20} y={176} bold anchor="start" size={14} fill="#fff">AWSの責任</T>
      <T x={20} y={196} anchor="start" size={12} fill={soft}>クラウド「の」セキュリティ</T>
      {chip(16, 208, 160, 'コンピューティング・DB', true)}
      {chip(184, 208, 160, 'ストレージ・ネットワーク', true)}
      {chip(16, 246, 328, 'ハードウェア・施設（リージョン、AZなど）', true)}
    </Frame>
  )
}

function StorageTypes() {
  const ec2 = (x: number, y: number) => (
    <g>
      <Box x={x} y={y} w={56} h={36} />
      <T x={x + 28} y={y + 23} size={12}>EC2</T>
    </g>
  )
  const store = (x: number, y: number, label: string) => (
    <g>
      <Box x={x} y={y} w={84} h={36} fill={tint} stroke={orange} />
      <T x={x + 42} y={y + 23} bold>{label}</T>
    </g>
  )
  const arrow = (x1: number, y1: number, x2: number, y2: number) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={line} strokeWidth="2" markerEnd="url(#st-arrow)" />
  return (
    <Frame title="EBSは1台に接続、EFSは複数台で共有、S3は窓口を通して出し入れ" height={318}>
      <defs>
        <marker id="st-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0 0L10 5L0 10z" fill={line} />
        </marker>
      </defs>
      <Box x={6} y={6} w={348} h={92} stroke={soft} r={12} />
      <T x={18} y={28} bold anchor="start">EBS：1台に取り付けるディスク</T>
      {ec2(60, 46)}
      {arrow(116, 64, 206, 64)}
      {store(210, 46, 'EBS')}
      <Box x={6} y={108} w={348} h={100} stroke={soft} r={12} />
      <T x={18} y={130} bold anchor="start">EFS：複数台で同時に共有</T>
      {ec2(18, 152)}
      {ec2(82, 152)}
      {ec2(146, 152)}
      {arrow(202, 170, 246, 170)}
      {store(250, 152, 'EFS')}
      <Box x={6} y={218} w={348} h={94} stroke={soft} r={12} />
      <T x={18} y={240} bold anchor="start">S3：窓口を通してファイルを出し入れ</T>
      <Box x={18} y={258} w={110} h={36} />
      <T x={73} y={281} size={12}>アプリ・利用者</T>
      {arrow(128, 276, 246, 276)}
      <T x={187} y={268} size={12}>保存・取得</T>
      {store(250, 258, 'S3')}
    </Frame>
  )
}

function WaPillars() {
  const cell = (col: number, row: number, name: string, a: string, b: string) => {
    const x = 6 + col * 177
    const y = 6 + row * 84
    return (
      <g>
        <Box x={x} y={y} w={171} h={76} fill={tint} stroke={orange} />
        <T x={x + 85.5} y={y + 24} bold>{name}</T>
        <T x={x + 85.5} y={y + 46} size={12}>{a}</T>
        <T x={x + 85.5} y={y + 63} size={12}>{b}</T>
      </g>
    )
  }
  return (
    <Frame title="Well-Architected Frameworkの6つの柱" height={258}>
      {cell(0, 0, '運用上の優秀性', '効果的に運用し、', '継続的に改善する')}
      {cell(1, 0, 'セキュリティ', 'データ・システム・', '資産を保護する')}
      {cell(0, 1, '信頼性', '意図した機能を', '正しく一貫して実行する')}
      {cell(1, 1, 'パフォーマンス効率', 'リソースを効率的に', '使って要件を満たす')}
      {cell(0, 2, 'コスト最適化', '最も低い価格で', '価値を提供する')}
      {cell(1, 2, '持続可能性', 'エネルギー消費を減らし', '環境への影響を改善する')}
    </Frame>
  )
}

function ComputeOptions() {
  const row = (y: number, name: string, mine: string, w: number) => (
    <g>
      <T x={12} y={y + 16} bold anchor="start">{name}</T>
      <rect x={12} y={y + 24} width={336} height={30} rx={6} fill={navy} />
      <rect x={12} y={y + 24} width={w} height={30} rx={6} fill={orange} />
      <T x={20} y={y + 44} size={12} anchor="start">{mine}</T>
    </g>
  )
  return (
    <Frame title="下へ行くほど、利用者が管理する範囲が狭くなる（図はイメージ）" height={318}>
      <rect x={12} y={8} width={14} height={14} rx={3} fill={orange} />
      <T x={32} y={20} size={12} anchor="start">利用者が管理</T>
      <rect x={130} y={8} width={14} height={14} rx={3} fill={navy} />
      <T x={150} y={20} size={12} anchor="start">AWSが管理</T>
      {row(34, 'Amazon EC2（仮想サーバー）', 'OS・ソフトウェア・アプリケーション', 250)}
      {row(104, 'ECS・EKS ＋ EC2（コンテナ）', 'コンテナとサーバー群', 190)}
      {row(174, 'AWS Fargate（コンテナ・サーバーレス）', 'コンテナ', 110)}
      {row(244, 'AWS Lambda（コード・サーバーレス）', 'コード', 70)}
    </Frame>
  )
}

function IamElements() {
  const item = (y: number, name: string, a: string) => (
    <g>
      <Box x={150} y={y} w={204} h={50} />
      <T x={162} y={y + 21} bold anchor="start">{name}</T>
      <T x={162} y={y + 40} size={12} anchor="start">{a}</T>
      <line x1={112} y1={y + 25} x2={146} y2={y + 25} stroke={line} strokeWidth="2" markerEnd="url(#iam-arrow)" />
    </g>
  )
  return (
    <Frame title="ポリシー（許可の内容）を、ユーザー・グループ・ロールに関連付ける" height={196}>
      <defs>
        <marker id="iam-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0 0L10 5L0 10z" fill={line} />
        </marker>
      </defs>
      <Box x={6} y={56} w={106} h={84} fill={tint} stroke={orange} />
      <T x={59} y={86} bold>ポリシー</T>
      <T x={59} y={106} size={12}>何をしてよいか</T>
      <T x={59} y={123} size={12}>を書いたもの</T>
      <line x1={112} y1={31} x2={112} y2={165} stroke={line} strokeWidth="2" />
      {item(6, 'ユーザー', '人やアプリケーション')}
      {item(73, 'グループ', 'ユーザーのまとまり')}
      {item(140, 'ロール', '一時的に引き受ける役割')}
    </Frame>
  )
}

function EdgeDelivery() {
  const user = (x: number, label: string) => (
    <g>
      <Box x={x} y={150} w={100} h={34} r={17} fill="#fff" />
      <T x={x + 50} y={172} size={12}>{label}</T>
      <line x1={x + 50} y1={148} x2={x + 50} y2={128} stroke={line} strokeWidth="2" markerEnd="url(#edge-arrow)" />
      <Box x={x} y={84} w={100} h={42} fill={tint} stroke={orange} />
      <T x={x + 50} y={102} size={12} bold>エッジ</T>
      <T x={x + 50} y={118} size={12}>ロケーション</T>
      <line x1={x + 50} y1={82} x2={180} y2={52} stroke={line} strokeWidth="1.5" strokeDasharray="4 3" />
    </g>
  )
  return (
    <Frame title="コンテンツのコピーを、利用者に近いエッジロケーションから届ける" height={190}>
      <defs>
        <marker id="edge-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0 0L10 5L0 10z" fill={line} />
        </marker>
      </defs>
      <Box x={90} y={6} w={180} h={44} fill={soft} />
      <T x={180} y={25} bold>リージョン（オリジン）</T>
      <T x={180} y={42} size={12}>元のコンテンツの置き場所</T>
      {user(6, '利用者（日本）')}
      {user(130, '利用者（欧州）')}
      {user(254, '利用者（米国）')}
    </Frame>
  )
}

function DbTypes() {
  const row = (y: number, kind: string, like: string, svc: string) => (
    <g>
      <Box x={6} y={y} w={348} h={54} />
      <rect x={6} y={y} width={112} height={54} rx={8} fill={tint} stroke={orange} strokeWidth="1.5" />
      <T x={62} y={y + 24} size={12} bold>{kind}</T>
      <T x={62} y={y + 42} size={12}>{like}</T>
      <T x={128} y={y + 32} size={13} anchor="start">{svc}</T>
    </g>
  )
  return (
    <Frame title="データベースの種類と、対応するAWSのサービス" height={190}>
      {row(6, 'リレーショナル', '台帳', 'Amazon RDS、Amazon Aurora')}
      {row(68, 'NoSQL', 'コインロッカー', 'Amazon DynamoDB')}
      {row(130, 'メモリベース', '机の上', 'Amazon ElastiCache')}
    </Frame>
  )
}

function VpcStructure() {
  const subnet = (x: number, name: string, a: string, inst: string) => (
    <g>
      <Box x={x} y={84} w={156} h={112} fill={tint} stroke={orange} />
      <T x={x + 78} y={103} size={12} bold>{name}</T>
      <T x={x + 78} y={119} size={11}>{a}</T>
      <rect x={x + 22} y={130} width={112} height={54} rx={8} fill="none" stroke={line} strokeWidth="1.5" strokeDasharray="4 3" />
      <Box x={x + 30} y={138} w={96} h={26} fill="#fff" r={6} />
      <T x={x + 78} y={156} size={12}>{inst}</T>
      <T x={x + 78} y={179} size={10}>セキュリティグループ</T>
    </g>
  )
  return (
    <Frame title="VPCをサブネットに分け、2種類の仕組みで通信を制御する" height={236}>
      <Box x={110} y={4} w={140} h={28} r={14} fill={soft} />
      <T x={180} y={23} size={12}>インターネット</T>
      <line x1={180} y1={32} x2={180} y2={44} stroke={line} strokeWidth="2" />
      <Box x={4} y={44} w={352} h={188} fill="#fff" stroke={navy} />
      <T x={14} y={62} size={12} bold anchor="start">VPC</T>
      <Box x={104} y={50} w={152} h={24} r={6} fill={soft} />
      <T x={180} y={67} size={11}>インターネットゲートウェイ</T>
      {subnet(14, 'パブリックなサブネット', 'インターネットとやり取り', 'ウェブサーバー')}
      {subnet(190, 'プライベートサブネット', '外から直接入れない', 'データベース')}
      <T x={180} y={220} size={11}>サブネットの出入口：ネットワークACL</T>
    </Frame>
  )
}

const registry: Record<FigureId, () => ReactNode> = {
  'region-az': RegionAz,
  'shared-responsibility': SharedResponsibility,
  'storage-types': StorageTypes,
  'wa-pillars': WaPillars,
  'compute-options': ComputeOptions,
  'iam-elements': IamElements,
  'edge-delivery': EdgeDelivery,
  'db-types': DbTypes,
  'vpc-structure': VpcStructure,
}

export function Figure({ id }: { id: string }) {
  const Component = registry[id as FigureId]
  return Component ? <Component /> : null
}
