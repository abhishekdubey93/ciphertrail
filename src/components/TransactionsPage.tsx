import { useMemo, useState } from 'react'
import {
  ArrowDownToLine,
  ArrowLeftRight,
  Check,
  CircleAlert,
  Download,
  ExternalLink,
  Network,
  Plus,
  Scale,
  Search,
  ShieldAlert,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  EmptyState,
  PageHeader,
  Panel,
  PanelHeading,
  RiskMeter,
  SortButton,
  StatusBadge,
  checkboxClass,
  controlClass,
} from '@/components/Common'
import type { DemoAccount, DemoComplaint, DemoTransaction, TransactionStatus } from '@/data/demo'
import { formatCurrency, formatDateTime } from '@/lib/format'
import { evaluateTransactionRisk } from '@/lib/riskEngine'
import { downloadReport } from '@/lib/report'

export type TransactionRiskFilter = 'all' | 'high' | 'elevated' | 'low'
type TransactionSortKey =
  | 'id'
  | 'timestamp'
  | 'senderName'
  | 'recipientName'
  | 'amount'
  | 'riskScore'
  | 'status'

export function TransactionsPage({
  transactions,
  accounts = [],
  complaints = [],
  riskFilter,
  onRiskFilterChange,
  selectedTransactionId,
  onSelectTransaction,
  onClearSelectedTransaction,
  onStatusChange,
  onStartCase,
  onTraceTransaction,
  onTraceAccount,
}: {
  transactions: DemoTransaction[]
  accounts?: DemoAccount[]
  complaints?: DemoComplaint[]
  riskFilter: TransactionRiskFilter
  onRiskFilterChange: (value: TransactionRiskFilter) => void
  selectedTransactionId: string | null
  onSelectTransaction: (id: string) => void
  onClearSelectedTransaction: () => void
  onStatusChange: (id: string, status: TransactionStatus) => void
  onStartCase: (transactionIds: string[], accountId: string, title: string) => void
  onTraceTransaction?: (transactionId: string) => void
  onTraceAccount?: (accountId: string) => void
}) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [channelFilter, setChannelFilter] = useState('all')
  const [sortKey, setSortKey] = useState<TransactionSortKey>('timestamp')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [exportNotice, setExportNotice] = useState<string | null>(null)

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase()
    const rows = transactions.filter((transaction) => {
      const queryMatches =
        !query ||
        [
          transaction.id,
          transaction.senderName,
          transaction.senderId,
          transaction.recipientName,
          transaction.recipientId,
          transaction.memo,
        ].some((value) => value.toLowerCase().includes(query))
      const statusMatches = statusFilter === 'all' || transaction.status === statusFilter
      const channelMatches = channelFilter === 'all' || transaction.channel === channelFilter
      const riskMatches =
        riskFilter === 'all' ||
        (riskFilter === 'high' && transaction.riskScore >= 85) ||
        (riskFilter === 'elevated' && transaction.riskScore >= 60 && transaction.riskScore < 85) ||
        (riskFilter === 'low' && transaction.riskScore < 60)
      return queryMatches && statusMatches && channelMatches && riskMatches
    })
    return rows.sort((left, right) => {
      const a = left[sortKey]
      const b = right[sortKey]
      const comparison =
        typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b))
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [transactions, search, statusFilter, channelFilter, riskFilter, sortKey, sortDirection])

  const selectedTransaction =
    transactions.find((transaction) => transaction.id === selectedTransactionId) ?? null

  const selectedRiskEvaluation = useMemo(() => {
    if (!selectedTransaction) return null
    return evaluateTransactionRisk(selectedTransaction, transactions, accounts, complaints)
  }, [selectedTransaction, transactions, accounts, complaints])

  const senderAccount = useMemo(() => {
    if (!selectedTransaction) return null
    return accounts.find((a) => a.id === selectedTransaction.senderId)
  }, [selectedTransaction, accounts])

  const recipientAccount = useMemo(() => {
    if (!selectedTransaction) return null
    return accounts.find((a) => a.id === selectedTransaction.recipientId)
  }, [selectedTransaction, accounts])

  const allVisibleSelected =
    filteredTransactions.length > 0 &&
    filteredTransactions.every((transaction) => selectedIds.includes(transaction.id))

  const sort = (key: TransactionSortKey) => {
    if (sortKey === key) setSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDirection(
        key === 'timestamp' || key === 'riskScore' || key === 'amount' ? 'desc' : 'asc'
      )
    }
  }

  const toggleRow = (id: string) =>
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    )

  const toggleAll = () => {
    if (allVisibleSelected) {
      setSelectedIds((current) =>
        current.filter((id) => !filteredTransactions.some((transaction) => transaction.id === id))
      )
    } else {
      setSelectedIds((current) =>
        Array.from(new Set([...current, ...filteredTransactions.map((transaction) => transaction.id)]))
      )
    }
  }

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setChannelFilter('all')
    onRiskFilterChange('all')
  }

  const startCase = () => {
    const selectedTransactions = transactions.filter((transaction) =>
      selectedIds.includes(transaction.id)
    )
    if (!selectedTransactions.length) return
    const accountId = selectedTransactions[0].senderId
    onStartCase(
      selectedTransactions.map((transaction) => transaction.id),
      accountId,
      `INR transfer inquiry · ${selectedTransactions[0].id} (+${selectedTransactions.length - 1} records)`
    )
  }

  const exportSelected = (format: 'csv' | 'json') => {
    try {
      const fileName = downloadReport('selected-transactions', format, {
        transactions,
        accounts,
        complaints,
        cases: [],
        mules: [],
        selectedTransactionIds: selectedIds,
      })
      setExportNotice(`Downloaded ${fileName}`)
      window.setTimeout(() => setExportNotice(null), 4000)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Monitor · synthetic transaction records"
        title="Transactions"
        description="Filter, sort, and inspect transaction records. Open any record to review its deterministic rule-based risk factors, counterparties, and connected money trails."
        action={
          <span className="rounded-full border border-border bg-card/70 px-3 py-2 text-[11px] font-medium text-muted-foreground">
            {transactions.length} synthetic INR records
          </span>
        }
      />

      <Panel className="mb-4">
        <div className="grid gap-3 p-4 lg:grid-cols-[minmax(220px,1.5fr)_minmax(150px,0.8fr)_minmax(150px,0.8fr)_minmax(150px,0.8fr)_auto] lg:items-end">
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Search
            </span>
            <span className="relative block">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="ID, account, memo..."
                className={`${controlClass} pl-10`}
                aria-label="Search transactions by ID, account, or memo"
              />
            </span>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Status
            </span>
            <select
              className={controlClass}
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter transactions by status"
            >
              <option value="all">All statuses</option>
              <option value="Flagged">Flagged</option>
              <option value="Under review">Under review</option>
              <option value="Cleared">Cleared</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Channel
            </span>
            <select
              className={controlClass}
              value={channelFilter}
              onChange={(event) => setChannelFilter(event.target.value)}
              aria-label="Filter transactions by channel"
            >
              <option value="all">All channels</option>
              <option value="RTGS">RTGS</option>
              <option value="NEFT">NEFT</option>
              <option value="Card">Card</option>
              <option value="IMPS">IMPS</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Risk band
            </span>
            <select
              className={controlClass}
              value={riskFilter}
              onChange={(event) => onRiskFilterChange(event.target.value as TransactionRiskFilter)}
              aria-label="Filter transactions by risk band"
            >
              <option value="all">All risk scores</option>
              <option value="high">High · 85+</option>
              <option value="elevated">Elevated · 60–84</option>
              <option value="low">Low · below 60</option>
            </select>
          </label>
          <Button variant="ghost" size="sm" className="h-10 px-3 text-xs text-muted-foreground" onClick={clearFilters}>
            <X />Reset filters
          </Button>
        </div>
      </Panel>

      {exportNotice ? (
        <div role="status" className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-success/20 bg-success/5 px-4 py-2.5 text-xs text-success">
          <span>{exportNotice}</span>
          <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => setExportNotice(null)}>Dismiss</Button>
        </div>
      ) : null}

      {selectedIds.length ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/15 bg-primary/[0.045] px-4 py-3">
          <p className="text-xs font-semibold text-primary">
            {selectedIds.length} transaction{selectedIds.length === 1 ? '' : 's'} selected
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 bg-card/70 text-xs" onClick={() => exportSelected('csv')}>
              <Download />Export CSV
            </Button>
            <Button variant="outline" size="sm" className="h-8 bg-card/70 text-xs" onClick={() => exportSelected('json')}>
              <Download />Export JSON
            </Button>
            <Button variant="outline" size="sm" className="h-8 bg-card/70 text-xs" onClick={() => setSelectedIds([])}>
              Clear selection
            </Button>
            <Button size="sm" className="h-8 text-xs" onClick={startCase}>
              Create investigation case<ArrowLeftRight />
            </Button>
          </div>
        </div>
      ) : null}

      {selectedTransaction && selectedRiskEvaluation ? (
        <Panel className="mb-5 border-primary/30 shadow-lg">
          <PanelHeading
            title={`Transaction detail · ${selectedTransaction.id}`}
            description={`${selectedTransaction.senderName} (${selectedTransaction.senderId}) → ${selectedTransaction.recipientName} (${selectedTransaction.recipientId}) · ${formatDateTime(selectedTransaction.timestamp)} IST`}
            action={
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label="Close transaction detail"
                onClick={onClearSelectedTransaction}
              >
                <X />
              </Button>
            }
          />
          <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
            <div className="space-y-5">
              {/* Primary metadata row */}
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={selectedTransaction.status} />
                <span className="rounded-full border border-border bg-muted/40 px-2.5 py-1 font-mono text-[11px] font-semibold text-foreground">
                  {selectedTransaction.channel}
                </span>
                <span className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11px] text-muted-foreground">
                  Memo: {selectedTransaction.memo}
                </span>
                <span className="rounded-full border border-primary/20 bg-primary/[0.06] px-2.5 py-1 font-mono text-[10px] text-primary">
                  Timestamp: {formatDateTime(selectedTransaction.timestamp)} IST
                </span>
              </div>

              {/* Rule-Based Risk Engine Breakdown */}
              <div className="rounded-xl border border-primary/20 bg-card/70 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-3">
                  <div className="flex items-center gap-2">
                    <Scale className="size-4 text-primary" aria-hidden="true" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                      Rule-Based Risk Factor Breakdown
                    </h3>
                  </div>
                  <span className="rounded-full border border-border bg-muted/40 px-2.5 py-0.5 font-mono text-[9px] font-medium text-muted-foreground">
                    Deterministic Engine v1.4 · No AI/ML
                  </span>
                </div>

                <p className="text-xs leading-5 text-muted-foreground">
                  Score calculated deterministically from transaction values, payment rail velocity, and counterparty adjacency:
                </p>

                <div className="mt-3 divide-y divide-border/60 rounded-xl border border-border/70 bg-background/50">
                  {selectedRiskEvaluation.triggeredFactors.length > 0 ? (
                    selectedRiskEvaluation.triggeredFactors.map((factor) => (
                      <div key={factor.ruleId} className="flex items-start gap-3 p-3">
                        <span className="shrink-0 rounded-md border border-destructive/20 bg-destructive/10 px-2 py-0.5 font-mono text-[10px] font-bold text-destructive">
                          +{factor.points}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold text-foreground">{factor.ruleName}</span>
                            <span className="rounded border border-border bg-muted/30 px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground">
                              {factor.category}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] leading-4 text-muted-foreground">{factor.description}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-xs text-muted-foreground">
                      No elevated risk rules triggered. Transfer parameters fall within standard retail thresholds.
                    </div>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-xs">
                  <span className="text-muted-foreground">Composite Rule-Based Score:</span>
                  <span className="font-mono font-bold text-foreground">
                    {selectedRiskEvaluation.score} / 100 ({selectedRiskEvaluation.band} Risk)
                  </span>
                </div>
              </div>

              {/* Counterparties summary */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Sender Account</span>
                    {onTraceAccount ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 p-0 text-[10px] text-primary"
                        onClick={() => onTraceAccount(selectedTransaction.senderId)}
                      >
                        Trace <ExternalLink className="size-3" />
                      </Button>
                    ) : null}
                  </div>
                  <p className="mt-1.5 truncate text-xs font-semibold text-foreground">{selectedTransaction.senderName}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">{selectedTransaction.senderId}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {senderAccount?.institution ?? 'Narmada Bank (Demo)'} · Risk {senderAccount?.riskScore ?? 28}/100
                  </p>
                </div>

                <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Recipient Account</span>
                    {onTraceAccount ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 p-0 text-[10px] text-primary"
                        onClick={() => onTraceAccount(selectedTransaction.recipientId)}
                      >
                        Trace <ExternalLink className="size-3" />
                      </Button>
                    ) : null}
                  </div>
                  <p className="mt-1.5 truncate text-xs font-semibold text-foreground">{selectedTransaction.recipientName}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">{selectedTransaction.recipientId}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {recipientAccount?.institution ?? 'Deccan Commercial Bank (Demo)'} · Risk {recipientAccount?.riskScore ?? 97}/100
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <CircleAlert className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span>Synthetic INR record for demonstration. Rationale is fully explainable; no production banking access.</span>
              </div>
            </div>

            {/* Action sidebar for transaction */}
            <div className="flex flex-col justify-between rounded-xl border border-border/80 bg-muted/30 p-4">
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Transfer Amount</p>
                    <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
                      {formatCurrency(selectedTransaction.amount)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Approx. ₹{(selectedTransaction.amount / 100000).toFixed(2)} Lakhs
                    </p>
                  </div>
                  <div className="w-28">
                    <RiskMeter score={selectedRiskEvaluation.score} />
                  </div>
                </div>

                <div className="mt-5 border-t border-border/70 pt-4">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Review Status Workflow
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Flagged', 'Under review', 'Cleared'] as const).map((status) => (
                      <Button
                        key={status}
                        size="sm"
                        variant={selectedTransaction.status === status ? 'secondary' : 'outline'}
                        className={`h-8 text-[10px] ${selectedTransaction.status === status ? 'border-primary/40 font-bold text-primary' : ''}`}
                        onClick={() => onStatusChange(selectedTransaction.id, status)}
                      >
                        {selectedTransaction.status === status ? <Check className="size-3" /> : null}
                        {status}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-2 border-t border-border/70 pt-4">
                {onTraceTransaction ? (
                  <Button
                    size="sm"
                    className="w-full text-xs font-semibold"
                    onClick={() => onTraceTransaction(selectedTransaction.id)}
                  >
                    <Network />Visualize in Money Trail
                  </Button>
                ) : null}

                <Button
                  size="sm"
                  variant="outline"
                  className="w-full bg-card text-xs"
                  onClick={() =>
                    onStartCase(
                      [selectedTransaction.id],
                      selectedTransaction.senderId,
                      `Transfer review · ${selectedTransaction.id} (${formatCurrency(selectedTransaction.amount, true)})`
                    )
                  }
                >
                  <Plus />Create Case from Record
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full text-xs text-muted-foreground"
                  onClick={() => {
                    downloadReport('selected-transactions', 'json', {
                      transactions,
                      accounts,
                      complaints,
                      cases: [],
                      mules: [],
                      selectedTransactionIds: [selectedTransaction.id],
                    })
                  }}
                >
                  <ArrowDownToLine />Download Record JSON
                </Button>
              </div>
            </div>
          </div>
        </Panel>
      ) : null}

      <Panel>
        <PanelHeading
          title="Transaction ledger"
          description={`${filteredTransactions.length} record${filteredTransactions.length === 1 ? '' : 's'} match${filteredTransactions.length === 1 ? 'es' : ''} the current search and filters`}
        />
        {filteredTransactions.length ? (
          <div className="data-table-wrap">
            <table className="w-full min-w-[980px] border-separate border-spacing-0 text-left">
              <thead className="bg-muted/45">
                <tr>
                  <th className="w-12 border-b border-border px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleAll}
                      className={checkboxClass}
                      aria-label="Select all visible transactions"
                    />
                  </th>
                  <th className="border-b border-border px-3 py-3">
                    <SortButton label="Transaction" active={sortKey === 'id'} direction={sortDirection} onClick={() => sort('id')} />
                  </th>
                  <th className="border-b border-border px-3 py-3">
                    <SortButton label="Date" active={sortKey === 'timestamp'} direction={sortDirection} onClick={() => sort('timestamp')} />
                  </th>
                  <th className="border-b border-border px-3 py-3">
                    <SortButton label="Sender" active={sortKey === 'senderName'} direction={sortDirection} onClick={() => sort('senderName')} />
                  </th>
                  <th className="border-b border-border px-3 py-3">
                    <SortButton label="Recipient" active={sortKey === 'recipientName'} direction={sortDirection} onClick={() => sort('recipientName')} />
                  </th>
                  <th className="border-b border-border px-3 py-3 text-right">
                    <SortButton label="Amount" active={sortKey === 'amount'} direction={sortDirection} onClick={() => sort('amount')} />
                  </th>
                  <th className="border-b border-border px-3 py-3">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Channel</span>
                  </th>
                  <th className="border-b border-border px-3 py-3">
                    <SortButton label="Risk" active={sortKey === 'riskScore'} direction={sortDirection} onClick={() => sort('riskScore')} />
                  </th>
                  <th className="border-b border-border px-4 py-3">
                    <SortButton label="Status" active={sortKey === 'status'} direction={sortDirection} onClick={() => sort('status')} />
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => {
                  const isSelected = selectedIds.includes(transaction.id)
                  const isActive = selectedTransactionId === transaction.id
                  return (
                    <tr
                      key={transaction.id}
                      aria-selected={isSelected}
                      className={`group transition hover:bg-muted/35 ${isSelected ? 'bg-primary/[0.04]' : ''} ${isActive ? 'ring-1 ring-inset ring-primary/40 bg-primary/[0.06]' : ''}`}
                    >
                      <td className="border-b border-border/60 px-4 py-3.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRow(transaction.id)}
                          className={checkboxClass}
                          aria-label={`Select transaction ${transaction.id}`}
                        />
                      </td>
                      <td className="border-b border-border/60 px-3 py-3.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 font-mono text-[11px] font-semibold text-primary hover:bg-transparent hover:text-primary"
                          onClick={() => onSelectTransaction(transaction.id)}
                        >
                          {transaction.id}
                        </Button>
                        <p className="mt-1 max-w-32 truncate text-[10px] text-muted-foreground">{transaction.memo}</p>
                      </td>
                      <td className="border-b border-border/60 px-3 py-3.5 text-xs text-foreground">
                        {formatDateTime(transaction.timestamp)}
                      </td>
                      <td className="max-w-44 border-b border-border/60 px-3 py-3.5">
                        <p className="truncate text-xs font-medium text-foreground">{transaction.senderName}</p>
                        <p className="mt-1 font-mono text-[10px] text-muted-foreground">{transaction.senderId}</p>
                      </td>
                      <td className="max-w-44 border-b border-border/60 px-3 py-3.5">
                        <p className="truncate text-xs font-medium text-foreground">{transaction.recipientName}</p>
                        <p className="mt-1 font-mono text-[10px] text-muted-foreground">{transaction.recipientId}</p>
                      </td>
                      <td className="border-b border-border/60 px-3 py-3.5 text-right text-xs font-semibold tabular-nums text-foreground">
                        {formatCurrency(transaction.amount, true)}
                      </td>
                      <td className="border-b border-border/60 px-3 py-3.5 text-xs text-muted-foreground">
                        {transaction.channel}
                      </td>
                      <td className="border-b border-border/60 px-3 py-3.5">
                        <div className="w-24">
                          <RiskMeter score={transaction.riskScore} showLabel={false} />
                        </div>
                      </td>
                      <td className="border-b border-border/60 px-4 py-3.5">
                        <StatusBadge status={transaction.status} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No transactions match"
            description="Try a different search term or clear one or more filters."
            action={
              <Button variant="outline" size="sm" className="text-xs" onClick={clearFilters}>
                Clear filters
              </Button>
            }
          />
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 px-5 py-3 text-[10px] text-muted-foreground">
          <span>Showing {filteredTransactions.length} of {transactions.length} synthetic transaction records</span>
          <span>Risk scores computed using deterministic explainable rules (no AI/ML models).</span>
        </div>
      </Panel>
    </div>
  )
}
