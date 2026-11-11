import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/progress', label: '進捗' },
  { to: '/review', label: '復習' },
  { to: '/settings', label: '設定・バックアップ' },
]

/** 「記録」エリア内の切り替え */
export function RecordTabs() {
  return (
    <nav aria-label="記録メニュー" className="mb-5 flex gap-2 overflow-x-auto">
      {tabs.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          className={({ isActive }) =>
            `inline-flex min-h-11 shrink-0 items-center rounded-full px-4 text-base font-bold ${
              isActive ? 'bg-navy-800 text-white' : 'border border-navy-100 bg-white text-navy-800'
            }`
          }
        >
          {t.label}
        </NavLink>
      ))}
    </nav>
  )
}
