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

const registry: Record<FigureId, () => ReactNode> = {
  'region-az': RegionAz,
  'shared-responsibility': SharedResponsibility,
  'storage-types': StorageTypes,
}

export function Figure({ id }: { id: string }) {
  const Component = registry[id as FigureId]
  return Component ? <Component /> : null
}
