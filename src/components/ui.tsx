import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AlertIcon, ChevronIcon } from './icons'

export function PageHeader({ title, lead, children }: { title: string; lead?: string; children?: ReactNode }) {
  return (
    <header className="mb-5">
      <h1 className="text-2xl font-bold text-navy-900">{title}</h1>
      {lead && <p className="mt-1 text-base leading-relaxed text-navy-700">{lead}</p>}
      {children}
    </header>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-navy-100 bg-white p-4 shadow-sm sm:p-5 ${className}`}>{children}</section>
}

export function CardTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-lg font-bold text-navy-900">{children}</h2>
      {aside}
    </div>
  )
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'brand' | 'good' }) {
  const tones = {
    neutral: 'bg-navy-100 text-navy-700',
    brand: 'bg-brand-500 text-navy-900',
    good: 'bg-emerald-100 text-emerald-900',
  }
  return <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-sm font-semibold ${tones[tone]}`}>{children}</span>
}

export function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100)
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-3 w-full overflow-hidden rounded-full bg-navy-100"
    >
      <div className="h-full rounded-full bg-brand-500 transition-[width]" style={{ width: `${pct}%` }} />
    </div>
  )
}

/** まだ記録がないときの表示。架空の数値は出さず、次の一歩を案内する */
export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-navy-100 bg-navy-50 px-4 py-5 text-center">
      <p className="font-semibold text-navy-800">{title}</p>
      {children && <div className="mt-1 text-base leading-relaxed text-navy-700">{children}</div>}
    </div>
  )
}

export function Notice({
  tone = 'info',
  title,
  children,
}: {
  tone?: 'info' | 'warn' | 'error' | 'good'
  title: string
  children?: ReactNode
}) {
  const tones = {
    info: 'border-navy-100 bg-white text-navy-900',
    warn: 'border-brand-500 bg-brand-50 text-navy-900',
    error: 'border-red-300 bg-red-50 text-red-950',
    good: 'border-emerald-300 bg-emerald-50 text-emerald-950',
  }
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`flex gap-3 rounded-xl border p-4 ${tones[tone]}`}>
      {(tone === 'warn' || tone === 'error') && <AlertIcon className="mt-0.5 h-6 w-6 shrink-0" />}
      <div className="min-w-0 flex-1">
        <p className="font-bold">{title}</p>
        {children && <div className="mt-1 text-base leading-relaxed">{children}</div>}
      </div>
    </div>
  )
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' }

export function Button({ variant = 'secondary', className = '', ...rest }: ButtonProps) {
  const variants = {
    primary: 'bg-brand-500 text-navy-900 hover:bg-brand-600 hover:text-white',
    secondary: 'border border-navy-600 bg-white text-navy-900 hover:bg-navy-50',
    danger: 'bg-red-700 text-white hover:bg-red-800',
  }
  return (
    <button
      type="button"
      className={`inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2 text-base font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...rest}
    />
  )
}

export function LinkRow({ to, title, note, icon, aside }: { to: string; title: string; note?: string; icon?: ReactNode; aside?: ReactNode }) {
  return (
    <Link
      to={to}
      className="flex min-h-16 items-center gap-3 rounded-2xl border border-navy-100 bg-white p-4 shadow-sm transition-colors hover:border-brand-500"
    >
      {icon && <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-800 text-brand-500">{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-base font-bold text-navy-900">{title}</span>
          {aside}
        </span>
        {note && <span className="mt-0.5 block text-sm leading-relaxed text-navy-700">{note}</span>}
      </span>
      <ChevronIcon className="h-5 w-5 shrink-0 text-navy-600" />
    </Link>
  )
}

export function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-xl bg-navy-50 p-3">
      <p className="text-sm text-navy-700">{label}</p>
      <p className="mt-0.5 text-xl font-bold text-navy-900">{value}</p>
      {note && <p className="text-sm text-navy-700">{note}</p>}
    </div>
  )
}
