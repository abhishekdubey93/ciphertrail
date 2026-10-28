import type { ReactNode } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, CircleHelp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const controlClass =
  'h-10 w-full rounded-xl border border-border bg-input/30 px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus-visible:border-primary/45 focus-visible:ring-4 focus-visible:ring-primary/10'

export const checkboxClass =
  'size-4 cursor-pointer rounded border-border accent-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15'

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div className="max-w-3xl">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary/75">{eyebrow}</p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[28px]">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </div>
  )
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn('rounded-2xl border border-border/80 bg-card/90 shadow-[0_18px_48px_rgba(0,0,0,0.18)] backdrop-blur-xl', className)}>{children}</section>
}

export function PanelHeading({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-border/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {description ? <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </div>
  )
}

export function StatCard({
  label,
  value,
  detail,
  icon,
  tone = 'blue',
}: {
  label: string
  value: string
  detail: string
  icon: ReactNode
  tone?: 'blue' | 'red' | 'amber' | 'green'
}) {
  const tones = {
    blue: 'bg-primary/8 text-primary',
    red: 'bg-destructive/10 text-destructive',
    amber: 'bg-warning/15 text-warning',
    green: 'bg-success/10 text-success',
  }

  return (
    <Panel className="relative overflow-hidden p-5">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-3 text-[28px] font-semibold leading-none tracking-tight text-foreground">{value}</p>
        </div>
        <div className={cn('grid size-10 shrink-0 place-items-center rounded-xl', tones[tone])}>{icon}</div>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">{detail}</p>
    </Panel>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase()
  const tone =
    normalized.includes('flagged') || normalized.includes('escalated') || normalized.includes('critical')
      ? 'border-destructive/15 bg-destructive/8 text-destructive'
      : normalized.includes('cleared') || normalized.includes('closed') || normalized.includes('linked')
        ? 'border-success/15 bg-success/8 text-success'
        : normalized.includes('new') || normalized.includes('high')
          ? 'border-primary/15 bg-primary/8 text-primary'
          : 'border-warning/20 bg-warning/10 text-warning'

  return <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none', tone)}><span className="size-1.5 rounded-full bg-current" />{status}</span>
}

export function RiskMeter({ score, showLabel = true }: { score: number; showLabel?: boolean }) {
  const tone = score >= 85 ? 'bg-destructive' : score >= 60 ? 'bg-warning' : 'bg-success'
  const textTone = score >= 85 ? 'text-destructive' : score >= 60 ? 'text-warning' : 'text-success'
  const label = score >= 85 ? 'High' : score >= 60 ? 'Elevated' : 'Low'

  return (
    <div className="min-w-28">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className={cn('font-semibold tabular-nums', textTone)}>{score}<span className="text-muted-foreground">/100</span></span>
        {showLabel ? <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span> : null}
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted" role="meter" aria-label={`${label} risk score`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={score}>
        <div className={cn('h-full rounded-full transition-[width]', tone)} style={{ width: `${Math.max(0, Math.min(score, 100))}%` }} />
      </div>
    </div>
  )
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center px-6 py-10 text-center">
      <div className="mb-3 grid size-10 place-items-center rounded-xl bg-muted text-muted-foreground"><CircleHelp aria-hidden="true" /></div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

export function SortButton({
  label,
  active,
  direction,
  onClick,
}: {
  label: string
  active: boolean
  direction: 'asc' | 'desc'
  onClick: () => void
}) {
  const SortIcon = active ? (direction === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30" aria-label={`Sort by ${label}`}>
      {label}<SortIcon aria-hidden="true" />
    </button>
  )
}

export function InlineAction({
  children,
  onClick,
  className,
}: {
  children: ReactNode
  onClick: () => void
  className?: string
}) {
  return <Button variant="ghost" size="sm" className={cn('h-8 px-2 text-xs text-primary hover:bg-primary/5 hover:text-primary', className)} onClick={onClick}>{children}</Button>
}
