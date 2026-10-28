import { useMemo, type KeyboardEvent } from 'react'
import {
  Activity,
  ArrowLeftRight,
  ArrowRight,
  CircleDollarSign,
  FileCheck2,
  FolderKanban,
  Network,
  ShieldAlert,
  UsersRound,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader, Panel, PanelHeading, RiskMeter, StatCard, StatusBadge } from '@/components/Common'
import {
  accounts as demoAccounts,
  type DemoAccount,
  type DemoTransaction,
  type InvestigationCase,
  type MuleProfile,
  type PageKey,
  type WorkspaceEvent,
} from '@/data/demo'
import { formatCurrency, formatDateTime } from '@/lib/format'

export type ChartRange = '7d' | '30d'

const overviewPositions: Record<string, { x: number; y: number }> = {
  'A-10482': { x: 52, y: 116 },
  'A-89316': { x: 135, y: 62 },
  'A-44721': { x: 225, y: 112 },
  'A-39104': { x: 314, y: 62 },
  'A-20866': { x: 135, y: 205 },
  'A-77430': { x: 276, y: 205 },
  'A-55018': { x: 385, y: 146 },
}

function TrendChart({
  transactions,
  range,
  onRangeChange,
}: {
  transactions: DemoTransaction[]
  range: ChartRange
  onRangeChange: (range: ChartRange) => void
}) {
  const data = useMemo(() => {
    // Dynamically calculate flagged/elevated transactions per date bucket
    // Anchor to latest transaction date or 2026-10-28
    const latestTxnDate = transactions.reduce((latest, t) => {
      const d = new Date(t.timestamp)
      return d > latest ? d : latest
    }, new Date('2026-10-28T00:00:00Z'))

    const anchorDate = new Date(latestTxnDate)
    anchorDate.setHours(0, 0, 0, 0)

    const numDays = range === '7d' ? 7 : 30
    const step = range === '7d' ? 1 : 4

    const buckets: { label: string; dateStr: string; count: number }[] = []
    for (let i = numDays - 1; i >= 0; i -= step) {
      const d = new Date(anchorDate)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().slice(0, 10)
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
      buckets.push({ label, dateStr, count: 0 })
    }

    // Count transactions falling into each bucket
    for (const txn of transactions) {
      const txnDateStr = txn.timestamp.slice(0, 10)
      const isElevated = txn.riskScore >= 60 || txn.status === 'Flagged'
      if (!isElevated) continue

      // Find best matching bucket
      const bucket = buckets.find((b) => b.dateStr === txnDateStr)
      if (bucket) {
        bucket.count += 1
      } else {
        // If outside exact bucket in 30d view, add to nearest or last bucket
        const nearest = buckets.reduce((closest, curr) => {
          const diffCurr = Math.abs(new Date(curr.dateStr).getTime() - new Date(txnDateStr).getTime())
          const diffClosest = Math.abs(new Date(closest.dateStr).getTime() - new Date(txnDateStr).getTime())
          return diffCurr < diffClosest ? curr : closest
        }, buckets[0])
        if (nearest) nearest.count += 1
      }
    }

    return {
      labels: buckets.map((b) => b.label),
      values: buckets.map((b) => b.count),
    }
  }, [transactions, range])

  const width = 720
  const height = 230
  const left = 34
  const right = 36
  const top = 18
  const bottom = 34
  const maxRecorded = Math.max(...data.values, 0)
  const maxValue = Math.max(5, Math.ceil(maxRecorded / 5) * 5)
  const points = data.values.map((value, index) => ({
    x: left + (index * (width - left - right)) / Math.max(1, data.values.length - 1),
    y: top + ((maxValue - value) / maxValue) * (height - top - bottom),
    value,
    label: data.labels[index],
  }))
  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - bottom} L ${points[0].x} ${height - bottom} Z`

  return (
    <Panel className="h-full overflow-hidden">
      <PanelHeading
        title="Flagged transaction trend"
        description="Daily elevated/flagged records calculated from current dataset"
        action={
          <div className="flex items-center rounded-xl border border-border/80 bg-muted/50 p-1" aria-label="Trend time range">
            {(['7d', '30d'] as const).map((option) => (
              <Button key={option} variant={range === option ? 'secondary' : 'ghost'} size="sm" className="h-7 rounded-lg px-3 text-[11px]" aria-pressed={range === option} onClick={() => onRangeChange(option)}>
                {option === '7d' ? '7 days' : '30 days'}
              </Button>
            ))}
          </div>
        }
      />
      <div className="px-4 pb-4 pt-5 sm:px-5">
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-chart-1" />Calculated flagged / elevated records</span>
          <span className="font-mono text-[10px] text-muted-foreground/80">Dynamic INR sample data</span>
        </div>
        <div className="data-table-wrap">
          <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${range === '7d' ? 'Seven' : 'Thirty'} day flagged transaction trend chart`} className="h-[220px] min-w-[540px] w-full overflow-visible">
            <defs>
              <linearGradient id="trend-fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-1)" stopOpacity="0.2" />
                <stop offset="100%" stopColor="var(--chart-1)" stopOpacity="0.01" />
              </linearGradient>
            </defs>
            {[0, 1, 2, 3].map((index) => {
              const y = top + (index * (height - top - bottom)) / 3
              return <g key={index}><line x1={left} y1={y} x2={width - right} y2={y} stroke="var(--border)" strokeDasharray="3 5" /><text x={left - 8} y={y + 3} textAnchor="end" fill="var(--muted-foreground)" fontSize="9">{Math.round(maxValue - (index * maxValue) / 3)}</text></g>
            })}
            <path d={areaPath} fill="url(#trend-fill)" />
            <path d={linePath} fill="none" stroke="var(--chart-1)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
            {points.map((point) => <g key={point.label}><circle cx={point.x} cy={point.y} r="4" fill="var(--card)" stroke="var(--chart-1)" strokeWidth="2" /><title>{`${point.label}: ${point.value} flagged records`}</title></g>)}
            {points.map((point) => <text key={`${point.label}-axis`} x={point.x} y={height - 9} textAnchor="middle" fill="var(--muted-foreground)" fontSize="9">{point.label}</text>)}
          </svg>
        </div>
      </div>
    </Panel>
  )
}

function RiskDistribution({ accounts, onExplore }: { accounts: DemoAccount[]; onExplore: () => void }) {
  const groups = [
    { label: 'High risk', color: 'bg-destructive', count: accounts.filter((account) => account.riskScore >= 85).length },
    { label: 'Elevated', color: 'bg-warning', count: accounts.filter((account) => account.riskScore >= 60 && account.riskScore < 85).length },
    { label: 'Low risk', color: 'bg-success', count: accounts.filter((account) => account.riskScore < 60).length },
  ]
  const total = Math.max(1, accounts.length)

  return (
    <Panel className="h-full overflow-hidden">
      <PanelHeading title="Account risk distribution" description="Risk bands across the synthetic account set" />
      <div className="p-5">
        <div className="mb-5 flex h-2.5 overflow-hidden rounded-full bg-muted" aria-label="Account risk distribution">
          {groups.map((group) => <div key={group.label} className={group.color} style={{ width: `${(group.count / total) * 100}%` }} title={`${group.label}: ${group.count}`} />)}
        </div>
        <div className="flex flex-col gap-3">
          {groups.map((group) => (
            <div key={group.label} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2 text-xs text-muted-foreground"><span className={`size-2 rounded-full ${group.color}`} />{group.label}</span>
              <span className="text-xs font-semibold tabular-nums text-foreground">{group.count}<span className="ml-1 font-normal text-muted-foreground">{group.count === 1 ? 'account' : 'accounts'}</span></span>
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" className="mt-5 w-full justify-between rounded-xl text-xs" onClick={onExplore}>Review mule candidates<ArrowRight data-icon="inline-end" /></Button>
      </div>
    </Panel>
  )
}

function TransactionActivity({ transactions, onOpenTransaction }: {
  transactions: DemoTransaction[]
  onOpenTransaction: (id: string) => void
}) {
  const recentTransactions = [...transactions].sort((left, right) => right.timestamp.localeCompare(left.timestamp)).slice(0, 4)

  return (
    <Panel className="overflow-hidden">
      <PanelHeading
        title="Transaction activity"
        description="Latest movement across the synthetic account set"
        action={<span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.06] px-2.5 py-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-primary"><span className="size-1.5 rounded-full bg-primary" />Simulated feed</span>}
      />
      <div className="divide-y divide-border/70">
        {recentTransactions.map((transaction) => (
          <button key={transaction.id} type="button" className="flex w-full flex-col gap-3 px-5 py-3.5 text-left transition hover:bg-muted/25 sm:flex-row sm:items-center" onClick={() => onOpenTransaction(transaction.id)}>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[11px] font-semibold text-primary">{transaction.id}</span>
                <StatusBadge status={transaction.status} />
              </div>
              <p className="mt-1.5 truncate text-xs text-foreground">{transaction.senderName}<span className="mx-2 text-muted-foreground">→</span>{transaction.recipientName}</p>
              <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground">{formatDateTime(transaction.timestamp)} · {transaction.channel}</p>
            </div>
            <div className="flex items-center justify-between gap-4 sm:justify-end">
              <div className="text-right"><p className="text-sm font-semibold tabular-nums text-foreground">{formatCurrency(transaction.amount, true)}</p><p className="mt-1 font-mono text-[9px] uppercase tracking-wide text-muted-foreground">INR amount</p></div>
              <div className="w-24"><RiskMeter score={transaction.riskScore} showLabel={false} /></div>
            </div>
          </button>
        ))}
      </div>
      <div className="border-t border-border/70 px-5 py-2.5">
        <p className="flex items-center gap-2 text-[9px] font-mono uppercase tracking-[0.1em] text-muted-foreground"><span className="size-1.5 rounded-full bg-muted-foreground/70" />Illustrative sample activity · no live banking connection</p>
      </div>
    </Panel>
  )
}

function NetworkOverview({ accounts, transactions, onTraceAccount, onOpenTransaction, onNavigate }: {
  accounts: DemoAccount[]
  transactions: DemoTransaction[]
  onTraceAccount: (id: string) => void
  onOpenTransaction: (id: string) => void
  onNavigate: (page: PageKey) => void
}) {
  const accountNames = new Map(accounts.map((account) => [account.id, account.name]))
  const graphTransactions = transactions.filter((transaction) => overviewPositions[transaction.senderId] && overviewPositions[transaction.recipientId]).slice(0, 9)
  const handleKeyDown = (event: KeyboardEvent<SVGGElement>, action: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      action()
    }
  }

  return (
    <Panel className="overflow-hidden">
      <PanelHeading
        title="Network overview"
        description="Synthetic transfer relationships between linked accounts"
        action={<span className="rounded-full border border-border/80 bg-muted/40 px-2.5 py-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Risk mapped</span>}
      />
      <div className="px-4 pb-4 pt-3 sm:px-5">
        <div className="overflow-hidden rounded-xl border border-border/70 bg-background/30 px-1 py-2">
          <svg viewBox="0 0 430 250" role="group" aria-label="Interactive preview of synthetic transaction connections. Select a node to trace an account or a line to inspect a transaction." className="h-[220px] w-full">
            <defs>
              <marker id="overview-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--primary)" /></marker>
            </defs>
            {graphTransactions.map((transaction) => {
              const from = overviewPositions[transaction.senderId]
              const to = overviewPositions[transaction.recipientId]
              const dx = to.x - from.x
              const dy = to.y - from.y
              const length = Math.max(Math.hypot(dx, dy), 1)
              const startX = from.x + (dx / length) * 18
              const startY = from.y + (dy / length) * 18
              const endX = to.x - (dx / length) * 19
              const endY = to.y - (dy / length) * 19
              const lineColor = transaction.riskScore >= 85 ? 'var(--destructive)' : transaction.riskScore >= 60 ? 'var(--warning)' : 'var(--chart-1)'
              return (
                <g key={transaction.id} role="button" tabIndex={0} aria-label={`Inspect ${transaction.id}, ${formatCurrency(transaction.amount)}, risk ${transaction.riskScore}`} onClick={() => onOpenTransaction(transaction.id)} onKeyDown={(event) => handleKeyDown(event, () => onOpenTransaction(transaction.id))} className="cursor-pointer outline-none">
                  <line x1={startX} y1={startY} x2={endX} y2={endY} stroke="transparent" strokeWidth="14" />
                  <line x1={startX} y1={startY} x2={endX} y2={endY} stroke={lineColor} strokeOpacity="0.78" strokeWidth={transaction.riskScore >= 85 ? 2 : 1.4} markerEnd="url(#overview-arrow)" />
                  <title>{`${transaction.id}: ${accountNames.get(transaction.senderId)} to ${accountNames.get(transaction.recipientId)} · ${formatCurrency(transaction.amount)} · risk ${transaction.riskScore}`}</title>
                </g>
              )
            })}
            {accounts.map((account) => {
              const point = overviewPositions[account.id]
              if (!point) return null
              const tone = account.riskScore >= 85 ? 'var(--destructive)' : account.riskScore >= 60 ? 'var(--warning)' : 'var(--chart-1)'
              const shortName = account.name.length > 12 ? `${account.name.slice(0, 11)}…` : account.name
              return (
                <g key={account.id} role="button" tabIndex={0} aria-label={`Trace ${account.name}, account ${account.id}, risk score ${account.riskScore}`} onClick={() => onTraceAccount(account.id)} onKeyDown={(event) => handleKeyDown(event, () => onTraceAccount(account.id))} className="cursor-pointer outline-none">
                  <circle cx={point.x} cy={point.y} r="18" fill="var(--card)" stroke={tone} strokeWidth="2" />
                  <circle cx={point.x + 12} cy={point.y - 12} r="3" fill={tone} />
                  <text x={point.x} y={point.y + 3.5} textAnchor="middle" fill="var(--foreground)" fontSize="9" fontFamily="ui-monospace, monospace" fontWeight="700">{account.riskScore}</text>
                  <text x={point.x} y={point.y + 32} textAnchor="middle" fill="var(--muted-foreground)" fontSize="8" fontFamily="ui-monospace, monospace">{shortName}</text>
                  <title>{`${account.name} · ${account.institution} · risk ${account.riskScore}/100`}</title>
                </g>
              )
            })}
          </svg>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground"><span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-destructive" />High</span><span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-warning" />Elevated</span><span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-chart-1" />Low</span></div>
          <Button variant="ghost" size="sm" className="h-8 px-2 text-[10px] text-primary hover:bg-primary/5 hover:text-primary" onClick={() => onNavigate('money-trail')}>Open full trail<ArrowRight data-icon="inline-end" /></Button>
        </div>
      </div>
    </Panel>
  )
}

function HighRiskAlerts({ transactions, onOpenTransaction, onViewAll }: {
  transactions: DemoTransaction[]
  onOpenTransaction: (id: string) => void
  onViewAll: () => void
}) {
  const alerts = transactions.filter((transaction) => transaction.riskScore >= 85).sort((left, right) => right.riskScore - left.riskScore).slice(0, 5)

  return (
    <Panel className="min-w-0 overflow-hidden">
      <PanelHeading
        title="High-risk alerts"
        description="Transactions requiring analyst review · score 85 and above"
        action={<Button variant="ghost" size="sm" className="h-8 text-[10px] text-primary" onClick={onViewAll}>View all alerts<ArrowRight data-icon="inline-end" /></Button>}
      />
      {alerts.length ? (
        <div className="data-table-wrap">
          <table className="w-full min-w-[740px] text-left">
            <caption className="sr-only">High-risk synthetic transaction alerts</caption>
            <thead className="bg-muted/35 font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
              <tr><th className="px-5 py-3 font-semibold">Transaction</th><th className="px-4 py-3 font-semibold">Fund flow</th><th className="px-4 py-3 text-right font-semibold">Amount · INR</th><th className="px-4 py-3 text-center font-semibold">Risk</th><th className="px-4 py-3 font-semibold">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {alerts.map((transaction) => (
                <tr key={transaction.id} className="transition hover:bg-muted/20">
                  <td className="px-5 py-3.5"><Button variant="ghost" size="sm" className="h-auto p-0 font-mono text-[10px] font-semibold text-primary hover:bg-transparent hover:text-primary" onClick={() => onOpenTransaction(transaction.id)}>{transaction.id}</Button><p className="mt-1 font-mono text-[9px] text-muted-foreground">{formatDateTime(transaction.timestamp)}</p></td>
                  <td className="max-w-[250px] px-4 py-3.5"><p className="truncate text-[10px] text-foreground" title={`${transaction.senderName} to ${transaction.recipientName}`}>{transaction.senderName}</p><p className="mt-1 truncate text-[9px] text-muted-foreground">to {transaction.recipientName}</p></td>
                  <td className="px-4 py-3.5 text-right font-sans text-[10px] font-semibold tabular-nums text-foreground">{formatCurrency(transaction.amount)}</td>
                  <td className="px-4 py-3.5 text-center"><span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/20 bg-destructive/10 px-2 py-1 font-mono text-[10px] font-semibold tabular-nums text-destructive"><span className="size-1.5 rounded-full bg-destructive" />{transaction.riskScore}</span></td>
                  <td className="px-4 py-3.5"><StatusBadge status={transaction.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="px-5 py-10 text-center text-xs text-muted-foreground">No records currently meet the high-risk threshold.</p>}
    </Panel>
  )
}

const eventIcons = {
  system: Activity,
  transaction: ArrowLeftRight,
  case: FolderKanban,
  complaint: FileCheck2,
}

function InvestigationTimeline({ activityEvents, transactions, onOpenTransaction }: {
  activityEvents: WorkspaceEvent[]
  transactions: DemoTransaction[]
  onOpenTransaction: (id: string) => void
}) {
  const feedEvents: WorkspaceEvent[] = transactions.slice(0, 4).map((transaction) => ({
    id: `feed-${transaction.id}`,
    timestamp: transaction.timestamp,
    title: transaction.riskScore >= 85 ? 'Risk signal in sample feed' : 'Synthetic transfer observed',
    detail: `${transaction.id} · ${transaction.senderName} → ${transaction.recipientName}`,
    kind: 'transaction',
    source: 'DEMO FEED',
    transactionId: transaction.id,
  }))
  const events = [...activityEvents, ...feedEvents].sort((left, right) => right.timestamp.localeCompare(left.timestamp)).slice(0, 5)

  return (
    <Panel className="overflow-hidden">
      <PanelHeading title="Investigation timeline" description="Workspace actions alongside synthetic feed activity" action={<span className="rounded-full border border-border/80 bg-muted/40 px-2.5 py-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Event log</span>} />
      <div className="p-5">
        {events.length ? (
          <ol className="flex flex-col">
            {events.map((event, index) => {
              const EventIcon = eventIcons[event.kind]
              const inWorkspace = event.source === 'WORKSPACE'
              return (
                <li key={event.id} className="relative flex gap-3 pb-4 last:pb-0">
                  <div className="relative flex shrink-0 flex-col items-center">
                    <span className={`relative z-10 grid size-8 place-items-center rounded-xl border ${inWorkspace ? 'border-primary/20 bg-primary/10 text-primary' : 'border-border bg-muted/60 text-muted-foreground'}`}><EventIcon aria-hidden="true" /></span>
                    {index < events.length - 1 ? <span className="absolute bottom-0 top-8 w-px bg-border/80" /> : null}
                  </div>
                  <div className="min-w-0 flex-1 pb-1">
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                      <p className="text-[11px] font-semibold text-foreground">{event.title}</p>
                      <time dateTime={event.timestamp} className="font-mono text-[9px] text-muted-foreground">{formatDateTime(event.timestamp)}</time>
                    </div>
                    {event.transactionId ? (
                      <button type="button" className="mt-1 block max-w-full truncate text-left font-mono text-[9px] text-muted-foreground transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40" onClick={() => onOpenTransaction(event.transactionId!)}>{event.detail}</button>
                    ) : <p className="mt-1 text-[10px] leading-4 text-muted-foreground">{event.detail}</p>}
                    <span className={`mt-1.5 inline-flex rounded-full px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.09em] ${inWorkspace ? 'bg-primary/[0.08] text-primary' : 'bg-muted text-muted-foreground'}`}>{event.source}</span>
                  </div>
                </li>
              )
            })}
          </ol>
        ) : <p className="text-xs text-muted-foreground">Workspace and sample feed events will appear here.</p>}
      </div>
    </Panel>
  )
}

export function OverviewPage({
  transactions,
  accounts,
  mules,
  cases,
  activityEvents,
  chartRange,
  onChartRangeChange,
  onNavigate,
  onOpenTransaction,
  onTraceAccount,
  onViewHighRisk,
}: {
  transactions: DemoTransaction[]
  accounts: DemoAccount[]
  mules: MuleProfile[]
  cases: InvestigationCase[]
  activityEvents: WorkspaceEvent[]
  chartRange: ChartRange
  onChartRangeChange: (range: ChartRange) => void
  onNavigate: (page: PageKey) => void
  onOpenTransaction: (id: string) => void
  onTraceAccount: (id: string) => void
  onViewHighRisk: () => void
}) {
  const highRiskTransactions = useMemo(() => transactions.filter((transaction) => transaction.riskScore >= 85).sort((left, right) => right.riskScore - left.riskScore), [transactions])
  const highRiskValue = useMemo(() => highRiskTransactions.reduce((sum, transaction) => sum + transaction.amount, 0), [highRiskTransactions])
  const openCases = cases.filter((investigationCase) => investigationCase.status !== 'Closed').length

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="CipherTrail / command center"
        title="Investigation overview"
        description="Connect suspicious activity to a clear, reviewable financial trail. This workspace uses synthetic INR records only; no production data is connected."
        action={<span className="inline-flex items-center gap-2 rounded-full border border-success/20 bg-success/[0.08] px-3 py-2 font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-success"><span className="size-1.5 rounded-full bg-success" />Local demo · INR</span>}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Sample transactions" value={transactions.length.toString()} detail="Synthetic records in this local workspace" icon={<ArrowLeftRight aria-hidden="true" />} tone="blue" />
        <StatCard label="High-risk exposure" value={formatCurrency(highRiskValue, true)} detail={`${highRiskTransactions.length} records at risk score 85+ · INR`} icon={<CircleDollarSign aria-hidden="true" />} tone="red" />
        <StatCard label="Mule candidates" value={mules.length.toString()} detail="Accounts with supporting transfer records" icon={<UsersRound aria-hidden="true" />} tone="amber" />
        <StatCard label="Open investigations" value={openCases.toString()} detail="Cases not yet closed" icon={<ShieldAlert aria-hidden="true" />} tone="green" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <TransactionActivity transactions={transactions} onOpenTransaction={onOpenTransaction} />
        <NetworkOverview accounts={accounts} transactions={transactions} onTraceAccount={onTraceAccount} onOpenTransaction={onOpenTransaction} onNavigate={onNavigate} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <HighRiskAlerts transactions={transactions} onOpenTransaction={onOpenTransaction} onViewAll={onViewHighRisk} />
        <InvestigationTimeline activityEvents={activityEvents} transactions={transactions} onOpenTransaction={onOpenTransaction} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.75fr)]">
        <TrendChart transactions={transactions} range={chartRange} onRangeChange={onChartRangeChange} />
        <RiskDistribution accounts={accounts} onExplore={() => onNavigate('mules')} />
      </div>
    </div>
  )
}
