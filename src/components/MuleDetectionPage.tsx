import { useMemo, useState } from 'react'
import { ArrowRight, CircleAlert, Network, Search, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState, PageHeader, Panel, RiskMeter, StatusBadge, controlClass } from '@/components/Common'
import type { DemoAccount, DemoTransaction, MuleProfile } from '@/data/demo'
import { formatCurrency, formatDateTime } from '@/lib/format'

export function MuleDetectionPage({
  profiles,
  accounts,
  transactions,
  onOpenTransaction,
  onTraceAccount,
}: {
  profiles: MuleProfile[]
  accounts: DemoAccount[]
  transactions: DemoTransaction[]
  onOpenTransaction: (id: string) => void
  onTraceAccount: (id: string) => void
}) {
  const [search, setSearch] = useState('')
  const [riskBand, setRiskBand] = useState('all')
  const [sortOrder, setSortOrder] = useState('high')

  const filteredProfiles = useMemo(() => {
    const query = search.trim().toLowerCase()
    return profiles
      .filter((profile) => {
        const account = accounts.find((item) => item.id === profile.accountId)
        if (!account) return false
        const matchesQuery = !query || [account.id, account.name, account.institution, profile.explanation, ...profile.signals].some((value) => value.toLowerCase().includes(query))
        const matchesBand = riskBand === 'all' || (riskBand === 'high' && account.riskScore >= 85) || (riskBand === 'elevated' && account.riskScore >= 60 && account.riskScore < 85) || (riskBand === 'low' && account.riskScore < 60)
        return matchesQuery && matchesBand
      })
      .sort((left, right) => {
        const leftScore = accounts.find((account) => account.id === left.accountId)?.riskScore ?? 0
        const rightScore = accounts.find((account) => account.id === right.accountId)?.riskScore ?? 0
        return sortOrder === 'high' ? rightScore - leftScore : leftScore - rightScore
      })
  }, [profiles, accounts, search, riskBand, sortOrder])

  return (
    <div>
      <PageHeader
        eyebrow="Analyze · explainable risk signals"
        title="Mule account detection"
        description="Review every candidate’s 0–100 score alongside the signals and synthetic transaction records that support it. These scores are demonstration data, not production decisions."
        action={<span className="inline-flex items-center gap-2 rounded-full border border-destructive/15 bg-destructive/8 px-3 py-2 text-[11px] font-semibold text-destructive"><ShieldAlert aria-hidden="true" />{profiles.length} candidate profiles</span>}
      />

      <Panel className="mb-5">
        <div className="grid gap-3 p-4 sm:grid-cols-[minmax(220px,1fr)_minmax(165px,0.45fr)_minmax(165px,0.45fr)] sm:items-end">
          <label className="block"><span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Search profiles</span><span className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><input className={`${controlClass} pl-10`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Account, institution, or signal..." aria-label="Search mule profiles" /></span></label>
          <label className="block"><span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Risk band</span><select className={controlClass} value={riskBand} onChange={(event) => setRiskBand(event.target.value)} aria-label="Filter profiles by risk score"><option value="all">All risk bands</option><option value="high">High · 85+</option><option value="elevated">Elevated · 60–84</option><option value="low">Low · below 60</option></select></label>
          <label className="block"><span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Sort candidates</span><select className={controlClass} value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} aria-label="Sort mule profiles by risk score"><option value="high">Highest risk first</option><option value="low">Lowest risk first</option></select></label>
        </div>
      </Panel>

      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-muted-foreground">{filteredProfiles.length} of {profiles.length} profiles match your criteria</p>
        <span className="text-[10px] text-muted-foreground">Each score includes its evidence set</span>
      </div>

      {filteredProfiles.length ? (
        <div className="flex flex-col gap-4">
          {filteredProfiles.map((profile) => {
            const account = accounts.find((item) => item.id === profile.accountId)
            if (!account) return null
            const evidence = profile.transactionIds.map((id) => transactions.find((transaction) => transaction.id === id)).filter((transaction): transaction is DemoTransaction => Boolean(transaction))
            return (
              <Panel key={profile.accountId}>
                <div className="grid gap-0 xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
                  <div className="border-b border-border/70 p-5 xl:border-b-0 xl:border-r">
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2"><h2 className="truncate text-base font-semibold text-foreground">{account.name}</h2><StatusBadge status="Flagged candidate" /></div>
                        <p className="mt-1.5 font-mono text-[11px] text-muted-foreground">{account.id}<span className="mx-2">·</span>{account.accountType} account<span className="mx-2">·</span>{account.institution}</p>
                      </div>
                      <div className="w-28 shrink-0"><RiskMeter score={account.riskScore} /></div>
                    </div>
                    <div className="rounded-xl border border-primary/10 bg-primary/[0.035] p-4">
                      <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary"><CircleAlert aria-hidden="true" />Why this account was surfaced</div>
                      <p className="text-xs leading-5 text-foreground">{profile.explanation}</p>
                    </div>
                    <div className="mt-4">
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Supporting signals</p>
                      <ul className="flex flex-col gap-2">
                        {profile.signals.map((signal) => <li key={signal} className="flex items-start gap-2 text-xs leading-5 text-foreground"><span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-primary/60" />{signal}</li>)}
                      </ul>
                    </div>
                    <Button variant="outline" size="sm" className="mt-5 rounded-xl bg-card/70 text-xs" onClick={() => onTraceAccount(account.id)}>Trace account flows<Network /></Button>
                  </div>

                  <div className="min-w-0 p-5">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div><h3 className="text-xs font-semibold text-foreground">Supporting transaction records</h3><p className="mt-1 text-[10px] text-muted-foreground">{evidence.length} linked synthetic records · select an ID to inspect</p></div>
                      <span className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[10px] font-medium text-muted-foreground">Score {account.riskScore}/100</span>
                    </div>
                    {evidence.length ? (
                      <div className="flex flex-col divide-y divide-border/60 rounded-xl border border-border/70">
                        {evidence.map((transaction) => (
                          <div key={transaction.id} className="grid gap-2 px-3 py-3 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)_auto] sm:items-center">
                            <div className="min-w-0"><Button variant="ghost" size="sm" className="h-auto p-0 font-mono text-[11px] font-semibold text-primary hover:bg-transparent hover:text-primary" onClick={() => onOpenTransaction(transaction.id)}>{transaction.id}<ArrowRight /></Button><p className="mt-1 text-[10px] text-muted-foreground">{formatDateTime(transaction.timestamp)}</p></div>
                            <p className="truncate text-[10px] text-foreground">{transaction.senderName}<span className="mx-1.5 text-muted-foreground">→</span>{transaction.recipientName}</p>
                            <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end sm:gap-1"><span className="text-xs font-semibold tabular-nums text-foreground">{formatCurrency(transaction.amount, true)}</span><span className="text-[10px] font-semibold text-destructive">Risk {transaction.riskScore}</span></div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState title="No linked records" description="This profile has no matching transaction IDs in the current demo sample." />
                    )}
                  </div>
                </div>
              </Panel>
            )
          })}
        </div>
      ) : (
        <Panel><EmptyState title="No mule profiles match" description="Adjust the search or risk band to view candidate profiles from the synthetic dataset." action={<Button variant="outline" size="sm" onClick={() => { setSearch(''); setRiskBand('all') }}>Reset profile filters</Button>} /></Panel>
      )}
    </div>
  )
}
