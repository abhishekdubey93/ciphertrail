import { useEffect, useState, type KeyboardEvent } from 'react'
import {
  ArrowLeftRight,
  Bell,
  ChevronRight,
  Clock3,
  FileCheck2,
  FolderKanban,
  LayoutDashboard,
  Menu,
  Network,
  Search,
  ShieldAlert,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { DemoTransaction, PageKey } from '@/data/demo'
import { formatCurrency, formatDateTime } from '@/lib/format'

export interface SearchHit {
  key: string
  title: string
  subtitle: string
  type: 'Transaction' | 'Account' | 'Case' | 'Complaint'
  page: PageKey
  transactionId?: string
  accountId?: string
  caseId?: string
  complaintId?: string
}

const navGroups: { label: string; items: { key: PageKey; label: string; icon: typeof LayoutDashboard }[] }[] = [
  { label: 'WORKSPACE', items: [{ key: 'overview', label: 'Overview', icon: LayoutDashboard }] },
  {
    label: 'INVESTIGATE',
    items: [
      { key: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
      { key: 'mules', label: 'Mule detection', icon: ShieldAlert },
      { key: 'money-trail', label: 'Money trail', icon: Network },
      { key: 'complaints', label: 'Complaint correlation', icon: FileCheck2 },
      { key: 'cases', label: 'Investigation cases', icon: FolderKanban },
    ],
  },
  { label: 'REPORTING', items: [{ key: 'reports', label: 'Evidence reports', icon: FileCheck2 }] },
]

const pageTitles: Record<PageKey, string> = {
  overview: 'Overview',
  transactions: 'Transactions',
  mules: 'Mule account detection',
  'money-trail': 'Money trail analysis',
  complaints: 'Complaint correlation',
  cases: 'Investigation cases',
  reports: 'Evidence reports',
}

function getIndiaTime() {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date())
}

function SidebarContent({ page, onNavigate, onClose }: { page: PageKey; onNavigate: (page: PageKey) => void; onClose?: () => void }) {
  return (
    <aside className="flex h-full w-[260px] flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-[76px] items-center justify-between border-b border-border/70 px-5">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl border border-primary/25 bg-primary/10 text-primary shadow-[0_0_24px_rgba(40,210,222,0.12)]">
            <span aria-hidden="true" className="font-mono text-[12px] font-black tracking-[-0.16em] text-primary">CT</span>
          </div>
          <div className="min-w-0">
            <p className="text-[15px] font-semibold tracking-tight text-foreground">Cipher<span className="text-primary">Trail</span></p>
            <p className="mt-0.5 whitespace-nowrap text-[8px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Financial crime intelligence</p>
          </div>
        </div>
        {onClose ? <Button variant="ghost" size="icon" className="md:hidden" aria-label="Close navigation" onClick={onClose}><X /></Button> : null}
      </div>

      <nav aria-label="Main navigation" className="flex-1 overflow-y-auto px-3 py-5">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-6">
            <p className="mb-2 px-3 text-[10px] font-semibold tracking-[0.15em] text-muted-foreground/80">{group.label}</p>
            <div className="flex flex-col gap-1">
              {group.items.map(({ key, label, icon: Icon }) => {
                const active = page === key
                return (
                  <Button
                    key={key}
                    variant="ghost"
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'h-10 w-full justify-start gap-3 rounded-xl px-3 text-[13px] font-medium text-muted-foreground transition',
                      active && 'bg-primary/10 text-primary shadow-[inset_2px_0_0_var(--primary)] hover:bg-primary/15 hover:text-primary',
                    )}
                    onClick={() => {
                      onNavigate(key)
                      onClose?.()
                    }}
                  >
                    <Icon aria-hidden="true" />
                    <span className="truncate">{label}</span>
                    {active ? <ChevronRight className="ml-auto text-primary/70" aria-hidden="true" /> : null}
                  </Button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-border/70 p-4">
        <div className="rounded-xl border border-primary/10 bg-primary/[0.035] p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-primary"><span className="size-2 rounded-full bg-success" /> Demo workspace</div>
          <p className="text-[11px] leading-5 text-muted-foreground">Synthetic records only. Changes remain in this browser session.</p>
        </div>
        <div className="mt-4 flex items-center gap-3 px-1">
          <div className="grid size-8 place-items-center rounded-full border border-primary/15 bg-primary/10 text-[10px] font-semibold text-primary">DA</div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-foreground">Demo analyst</p>
            <p className="truncate text-[10px] text-muted-foreground">Investigation workspace</p>
          </div>
          <span className="ml-auto rounded-full border border-border px-2 py-1 font-mono text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">Local</span>
        </div>
      </div>
    </aside>
  )
}

export function Sidebar({ page, onNavigate, mobileOpen, onMobileClose }: {
  page: PageKey
  onNavigate: (page: PageKey) => void
  mobileOpen: boolean
  onMobileClose: () => void
}) {
  return (
    <>
      <div className="hidden shrink-0 md:block"><SidebarContent page={page} onNavigate={onNavigate} /></div>
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button type="button" aria-label="Close navigation overlay" className="absolute inset-0 bg-foreground/25 backdrop-blur-[1px]" onClick={onMobileClose} />
          <div className="absolute inset-y-0 left-0 shadow-2xl shadow-foreground/15"><SidebarContent page={page} onNavigate={onNavigate} onClose={onMobileClose} /></div>
        </div>
      ) : null}
    </>
  )
}

export function Topbar({
  page,
  searchValue,
  onSearchValueChange,
  searchHits,
  transactions,
  onOpenTransaction,
  onOpenAccount,
  onOpenCase,
  onOpenComplaint,
  onViewHighRisk,
  onMobileMenu,
}: {
  page: PageKey
  searchValue: string
  onSearchValueChange: (value: string) => void
  searchHits: SearchHit[]
  transactions: DemoTransaction[]
  onOpenTransaction: (id: string) => void
  onOpenAccount: (id: string) => void
  onOpenCase?: (id: string) => void
  onOpenComplaint?: (id: string) => void
  onViewHighRisk: () => void
  onMobileMenu: () => void
}) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(getIndiaTime)

  useEffect(() => {
    const interval = window.setInterval(() => setCurrentTime(getIndiaTime()), 30_000)
    return () => window.clearInterval(interval)
  }, [])
  const highRiskTransactions = transactions.filter((transaction) => transaction.riskScore >= 85).slice(0, 4)
  const queryActive = searchValue.trim().length > 0

  const selectHit = (hit: SearchHit) => {
    if (hit.transactionId) onOpenTransaction(hit.transactionId)
    if (hit.accountId) onOpenAccount(hit.accountId)
    if (hit.caseId && onOpenCase) onOpenCase(hit.caseId)
    if (hit.complaintId && onOpenComplaint) onOpenComplaint(hit.complaintId)
    onSearchValueChange('')
    setSearchOpen(false)
  }

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setSearchOpen(false)
      return
    }
    if (event.key === 'Enter' && !event.nativeEvent.isComposing && event.keyCode !== 229) {
      event.preventDefault()
      if (searchHits[0]) selectHit(searchHits[0])
      else setSearchOpen(true)
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur-xl">
      <div className="flex min-h-[76px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" size="icon" className="shrink-0 md:hidden" aria-label="Open navigation" onClick={onMobileMenu}><Menu /></Button>
        <div className="hidden min-w-0 sm:block">
          <p className="whitespace-nowrap font-mono text-[8px] font-semibold uppercase tracking-[0.09em] text-primary">CipherTrail / command</p>
          <p className="mt-1 truncate text-sm font-semibold text-foreground">{pageTitles[page]}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:hidden">
          <span className="grid size-7 shrink-0 place-items-center rounded-lg border border-primary/25 bg-primary/10 font-mono text-[9px] font-black tracking-[-0.16em] text-primary" aria-hidden="true">CT</span>
          <span className="text-xs font-semibold tracking-tight text-foreground">Cipher<span className="text-primary">Trail</span></span>
        </div>

        <div className="relative ml-auto w-full max-w-[360px] sm:ml-6">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              type="search"
              value={searchValue}
              onChange={(event) => {
                onSearchValueChange(event.target.value)
                setSearchOpen(true)
              }}
              onFocus={() => setSearchOpen(true)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search..."
              aria-label="Search synthetic transactions or accounts"
              aria-expanded={searchOpen && queryActive}
              className="h-10 w-full rounded-xl border border-border/80 bg-input/30 pl-10 pr-10 text-sm text-foreground outline-none placeholder:text-muted-foreground/80 transition focus:border-primary/45 focus:ring-4 focus:ring-primary/10"
            />
            {queryActive ? (
              <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 size-8 -translate-y-1/2 text-muted-foreground" aria-label="Clear search" onClick={() => { onSearchValueChange(''); setSearchOpen(false) }}><X /></Button>
            ) : null}
          </div>
          {searchOpen && queryActive ? (
            <div className="absolute left-0 right-0 top-[calc(100%+8px)] overflow-hidden rounded-2xl border border-border bg-popover shadow-xl shadow-foreground/10">
              <div className="border-b border-border/70 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">Synthetic data matches</div>
              {searchHits.length ? (
                <div className="max-h-80 overflow-y-auto p-1.5">
                  {searchHits.slice(0, 6).map((hit) => (
                    <button key={hit.key} type="button" className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-primary/5 focus-visible:bg-primary/5 focus-visible:outline-none" onClick={() => selectHit(hit)}>
                      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
                        {hit.type === 'Transaction' ? (
                          <ArrowLeftRight aria-hidden="true" />
                        ) : hit.type === 'Account' ? (
                          <Network aria-hidden="true" />
                        ) : hit.type === 'Case' ? (
                          <FolderKanban aria-hidden="true" />
                        ) : (
                          <FileCheck2 aria-hidden="true" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-xs font-semibold text-foreground">{hit.title}</span>
                          <span className="shrink-0 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">{hit.type}</span>
                        </span>
                        <span className="mt-1 block truncate text-[11px] text-muted-foreground">{hit.subtitle}</span>
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="px-4 py-6 text-center text-xs text-muted-foreground">No matching synthetic records. Try an account name, account ID, or transaction ID.</p>
              )}
            </div>
          ) : null}
        </div>

        <div className="relative shrink-0">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`${highRiskTransactions.length} high-risk transaction alerts`}
            aria-expanded={notificationsOpen}
            className="relative text-muted-foreground"
            onClick={() => { setNotificationsOpen((open) => !open); setSearchOpen(false) }}
          >
            <Bell />
            {highRiskTransactions.length > 0 ? <span className="absolute right-1.5 top-1.5 size-2 rounded-full border-2 border-background bg-destructive" /> : null}
          </Button>
          {notificationsOpen ? (
            <div className="absolute right-0 top-[calc(100%+10px)] z-20 w-[min(360px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-border bg-popover shadow-xl shadow-foreground/10">
              <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
                <div><p className="text-sm font-semibold text-foreground">High-risk alerts</p><p className="mt-0.5 text-[10px] text-muted-foreground">From the synthetic sample</p></div>
                <Button variant="ghost" size="icon" className="size-8" aria-label="Close alerts" onClick={() => setNotificationsOpen(false)}><X /></Button>
              </div>
              {highRiskTransactions.length ? (
                <div className="divide-y divide-border/60">
                  {highRiskTransactions.map((transaction) => (
                    <button key={transaction.id} type="button" className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-muted/60" onClick={() => { setNotificationsOpen(false); onOpenTransaction(transaction.id) }}>
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-destructive/8 text-destructive"><ShieldAlert aria-hidden="true" /></span>
                      <span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-foreground">{transaction.id} · risk {transaction.riskScore}</span><span className="mt-1 block truncate text-[10px] text-muted-foreground">{transaction.senderName} → {transaction.recipientName}</span></span>
                      <span className="shrink-0 text-[10px] font-semibold text-foreground">{formatCurrency(transaction.amount, true)}</span>
                    </button>
                  ))}
                </div>
              ) : <p className="px-4 py-6 text-center text-xs text-muted-foreground">No high-risk records in the current sample.</p>}
              <div className="border-t border-border/70 p-2">
                <Button variant="ghost" size="sm" className="w-full justify-between text-xs text-primary" onClick={() => { setNotificationsOpen(false); onViewHighRisk() }}>View all high-risk transactions<ChevronRight /></Button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="hidden items-center gap-2 rounded-full border border-success/20 bg-success/[0.06] px-3 py-1.5 lg:flex" aria-label="Local synthetic-data demo environment">
          <span className="size-1.5 rounded-full bg-success" />
          <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.08em] text-success">Local demo · INR</span>
        </div>
        <div className="hidden items-center gap-2 border-l border-border/70 pl-3 lg:flex" aria-label={`Current time in India ${currentTime} IST`}>
          <Clock3 className="text-muted-foreground" aria-hidden="true" />
          <span className="font-mono text-[11px] font-semibold tabular-nums text-foreground">{currentTime}</span>
          <span className="font-mono text-[8px] uppercase tracking-wide text-muted-foreground">IST</span>
        </div>
        <div className="hidden size-9 shrink-0 place-items-center rounded-full border border-primary/15 bg-secondary text-[10px] font-semibold text-primary sm:grid" aria-label="Demo analyst workspace">DA</div>
      </div>
    </header>
  )
}
