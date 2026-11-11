import type { ReactNode } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { appInfo } from '../config/app'
import { BookIcon, ChartIcon, CompareIcon, HomeIcon, PencilIcon } from './icons'

interface NavItem {
  to: string
  label: string
  icon: ReactNode
  /** このナビ項目に属するパスの先頭 */
  match: string[]
}

const navItems: NavItem[] = [
  { to: '/', label: 'ホーム', icon: <HomeIcon />, match: [] },
  { to: '/learn', label: '学ぶ', icon: <BookIcon />, match: ['/learn', '/services', '/designer'] },
  { to: '/compare', label: '比較', icon: <CompareIcon />, match: ['/compare'] },
  { to: '/practice', label: '演習', icon: <PencilIcon />, match: ['/practice', '/exam'] },
  { to: '/progress', label: '記録', icon: <ChartIcon />, match: ['/progress', '/review', '/settings'] },
]

function useActive() {
  const { pathname } = useLocation()
  return (item: NavItem) =>
    item.to === '/' ? pathname === '/' : item.match.some((m) => pathname === m || pathname.startsWith(`${m}/`))
}

export function Layout() {
  const isActive = useActive()
  return (
    <div className="min-h-dvh lg:pl-60">
      {/* PC：左サイドバー */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col bg-navy-800 text-white lg:flex">
        <div className="px-5 py-6">
          <p className="text-lg font-bold">
            AWS <span className="text-brand-500">Master</span> Academy
          </p>
          <p className="mt-1 text-sm text-navy-100">CLF・SAA 学習アプリ</p>
        </div>
        <nav aria-label="メインメニュー" className="flex flex-1 flex-col gap-1 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              aria-current={isActive(item) ? 'page' : undefined}
              className={`flex min-h-12 items-center gap-3 rounded-xl px-3 text-base font-semibold ${
                isActive(item) ? 'bg-brand-500 text-navy-900' : 'text-white hover:bg-navy-700'
              }`}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>
        <p className="px-5 py-4 text-sm leading-relaxed text-navy-100">AWS非公式の学習用アプリ</p>
      </aside>

      {/* スマートフォン：上部バー */}
      <header className="sticky top-0 z-20 flex items-center justify-between bg-navy-800 px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 text-white lg:hidden">
        <p className="text-base font-bold">
          AWS <span className="text-brand-500">Master</span> Academy
        </p>
        <span className="rounded-full border border-navy-600 px-2 py-0.5 text-sm text-navy-100">AWS非公式</span>
      </header>

      <main className="mx-auto w-full max-w-4xl px-4 pt-5 pb-28 sm:px-6 lg:pb-10">
        <Outlet />
        <footer className="mt-10 border-t border-navy-100 pt-4 text-sm leading-relaxed text-navy-700">
          <p>{appInfo.disclaimer}</p>
          <p className="mt-1">
            バージョン {appInfo.version}・{appInfo.phase}
          </p>
        </footer>
      </main>

      {/* スマートフォン：下部タブ */}
      <nav
        aria-label="メインメニュー"
        className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-navy-100 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            aria-current={isActive(item) ? 'page' : undefined}
            className={`flex min-h-16 flex-col items-center justify-center gap-0.5 text-sm font-semibold ${
              isActive(item) ? 'text-navy-900' : 'text-navy-600'
            }`}
          >
            <span className={`flex h-8 w-14 items-center justify-center rounded-full ${isActive(item) ? 'bg-brand-500' : ''}`}>
              {item.icon}
            </span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
