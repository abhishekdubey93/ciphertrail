import { useMemo, useState } from 'react'
import { ArrowRight, FilePlus2, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState, PageHeader, Panel, PanelHeading, RiskMeter, SortButton, StatusBadge, checkboxClass, controlClass } from '@/components/Common'
import type { CaseDraft, ComplaintStatus, DemoAccount, DemoComplaint, DemoTransaction } from '@/data/demo'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format'

type ComplaintSortKey = 'id' | 'filedAt' | 'customer' | 'reportedAmount' | 'correlationScore' | 'status'

function correlationExplanation(score: number) {
  if (score >= 85) return 'Strong correlation: the reported amount and timing closely overlap with a high-risk transfer path in the sample.'
  if (score >= 60) return 'Potential correlation: one or more linked records share account or timing signals and warrant analyst context.'
  return 'Limited correlation: the available synthetic records show a weaker link to the reported incident.'
}

export function ComplaintsPage({
  complaints,
  transactions,
  accounts,
  selectedComplaintId,
  onSelectComplaint,
  onClearSelectedComplaint,
  onStatusChange,
  onTraceAccount,
  onOpenTransaction,
  onStartCase,
}: {
  complaints: DemoComplaint[]
  transactions: DemoTransaction[]
  accounts: DemoAccount[]
  selectedComplaintId: string | null
  onSelectComplaint: (id: string) => void
  onClearSelectedComplaint: () => void
  onStatusChange: (id: string, status: ComplaintStatus) => void
  onTraceAccount: (id: string) => void
  onOpenTransaction: (id: string) => void
  onStartCase: (draft: CaseDraft) => void
}) {
  const [search, setSearch] = useState('')
  const [correlationBand, setCorrelationBand] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortKey, setSortKey] = useState<ComplaintSortKey>('correlationScore')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const filteredComplaints = useMemo(() => {
    const query = search.trim().toLowerCase()
    return complaints.filter((complaint) => {
      const matchesSearch = !query || [complaint.id, complaint.customer, complaint.incidentType, complaint.summary, ...complaint.matchedAccountIds, ...complaint.linkedTransactionIds].some((value) => value.toLowerCase().includes(query))
      const matchesStatus = statusFilter === 'all' || complaint.status === statusFilter
      const matchesBand = correlationBand === 'all' || (correlationBand === 'high' && complaint.correlationScore >= 85) || (correlationBand === 'medium' && complaint.correlationScore >= 60 && complaint.correlationScore < 85) || (correlationBand === 'low' && complaint.correlationScore < 60)
      return matchesSearch && matchesStatus && matchesBand
    }).sort((left, right) => {
      const a = left[sortKey]
      const b = right[sortKey]
      const comparison = typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b))
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [complaints, search, statusFilter, correlationBand, sortKey, sortDirection])

  const selectedComplaint = complaints.find((complaint) => complaint.id === selectedComplaintId) ?? null
  const allVisibleSelected = filteredComplaints.length > 0 && filteredComplaints.every((complaint) => selectedIds.includes(complaint.id))
  const toggleRow = (id: string) => setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  const toggleAll = () => setSelectedIds((current) => allVisibleSelected ? current.filter((id) => !filteredComplaints.some((complaint) => complaint.id === id)) : Array.from(new Set([...current, ...filteredComplaints.map((complaint) => complaint.id)])))
  const sort = (key: ComplaintSortKey) => {
    if (sortKey === key) setSortDirection((direction) => direction === 'asc' ? 'desc' : 'asc')
    else {
      setSortKey(key)
      setSortDirection(key === 'reportedAmount' || key === 'correlationScore' || key === 'filedAt' ? 'desc' : 'asc')
    }
  }

  const clearFilters = () => { setSearch(''); setStatusFilter('all'); setCorrelationBand('all') }
  const startCaseFromComplaints = (ids: string[]) => {
    const selected = complaints.filter((complaint) => ids.includes(complaint.id))
    if (!selected.length) return
    const transactionIds = Array.from(new Set(selected.flatMap((complaint) => complaint.linkedTransactionIds)))
    const primaryAccountId = selected[0].matchedAccountIds[0] ?? accounts[0]?.id ?? ''
    onStartCase({
      title: selected.length === 1 ? `Complaint review · ${selected[0].id}` : `Complaint correlation review · ${selected.length} reports`,
      primaryAccountId,
      transactionIds,
      complaintIds: selected.map((complaint) => complaint.id),
    })
  }

  return (
    <div>
      <PageHeader
        eyebrow="Correlate · customer-reported events"
        title="Complaint correlation"
        description="Compare synthetic customer reports with transaction paths and account signals. Correlation scores are explainable and every linked record can be inspected."
        action={<span className="rounded-full border border-border bg-card/70 px-3 py-2 text-[11px] font-medium text-muted-foreground">{complaints.length} sample complaints</span>}
      />

      <Panel className="mb-4">
        <div className="grid gap-3 p-4 lg:grid-cols-[minmax(220px,1.4fr)_minmax(155px,0.6fr)_minmax(155px,0.6fr)_auto] lg:items-end">
          <label className="block"><span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Search</span><span className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><input className={`${controlClass} pl-10`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Complaint, customer, transaction..." aria-label="Search complaints" /></span></label>
          <label className="block"><span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Correlation score</span><select className={controlClass} value={correlationBand} onChange={(event) => setCorrelationBand(event.target.value)} aria-label="Filter complaints by correlation score"><option value="all">All scores</option><option value="high">High · 85+</option><option value="medium">Moderate · 60–84</option><option value="low">Low · below 60</option></select></label>
          <label className="block"><span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Complaint status</span><select className={controlClass} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter complaints by status"><option value="all">All statuses</option><option value="New">New</option><option value="Reviewed">Reviewed</option><option value="Linked">Linked</option></select></label>
          <Button variant="ghost" size="sm" className="h-10 text-xs text-muted-foreground" onClick={clearFilters}><X />Reset</Button>
        </div>
      </Panel>

      {selectedIds.length ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/15 bg-primary/[0.045] px-4 py-3">
          <p className="text-xs font-semibold text-primary">{selectedIds.length} complaint{selectedIds.length === 1 ? '' : 's'} selected</p>
          <div className="flex items-center gap-2"><Button variant="outline" size="sm" className="h-8 bg-card/70 text-xs" onClick={() => setSelectedIds([])}>Clear selection</Button><Button size="sm" className="h-8 text-xs" onClick={() => startCaseFromComplaints(selectedIds)}>Create linked case<FilePlus2 /></Button></div>
        </div>
      ) : null}

      {selectedComplaint ? (
        <Panel className="mb-4 border-primary/20">
          <PanelHeading title={`Complaint detail · ${selectedComplaint.id}`} description={`${selectedComplaint.customer} · filed ${formatDateTime(selectedComplaint.filedAt)}`} action={<Button variant="ghost" size="icon" className="size-8" aria-label="Close complaint detail" onClick={onClearSelectedComplaint}><X /></Button>} />
          <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(270px,0.85fr)]">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2"><StatusBadge status={selectedComplaint.status} /><span className="rounded-full border border-border px-2.5 py-1 text-[10px] text-muted-foreground">{selectedComplaint.incidentType}</span><span className="text-xs font-semibold tabular-nums text-foreground">Reported {formatCurrency(selectedComplaint.reportedAmount, true)}</span></div>
              <p className="text-xs leading-6 text-foreground">{selectedComplaint.summary}</p>
              <div className="mt-4 rounded-xl border border-primary/10 bg-primary/[0.035] p-3.5"><div className="mb-2 flex items-center justify-between gap-3"><p className="text-[10px] font-semibold uppercase tracking-wide text-primary">Correlation rationale</p><span className="font-semibold tabular-nums text-primary">{selectedComplaint.correlationScore}/100</span></div><p className="text-xs leading-5 text-foreground">{correlationExplanation(selectedComplaint.correlationScore)}</p><div className="mt-3"><RiskMeter score={selectedComplaint.correlationScore} /></div></div>
              <div className="mt-4 flex flex-wrap gap-2">{selectedComplaint.matchedAccountIds.map((accountId) => { const account = accounts.find((item) => item.id === accountId); return <Button key={accountId} variant="outline" size="sm" className="h-8 bg-card/70 text-[10px]" onClick={() => onTraceAccount(accountId)}>{account?.name ?? accountId}<ArrowRight /></Button> })}</div>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between gap-3"><h3 className="text-xs font-semibold text-foreground">Linked transaction evidence</h3><span className="text-[10px] text-muted-foreground">{selectedComplaint.linkedTransactionIds.length} records</span></div>
              <div className="flex flex-col divide-y divide-border/60 rounded-xl border border-border/70">
                {selectedComplaint.linkedTransactionIds.map((transactionId) => {
                  const transaction = transactions.find((item) => item.id === transactionId)
                  if (!transaction) return <div key={transactionId} className="px-3 py-3 text-xs text-muted-foreground">Missing sample record: {transactionId}</div>
                  return <div key={transactionId} className="flex items-center justify-between gap-3 px-3 py-3"><div className="min-w-0"><Button variant="ghost" size="sm" className="h-auto p-0 font-mono text-[10px] font-semibold text-primary hover:bg-transparent hover:text-primary" onClick={() => onOpenTransaction(transaction.id)}>{transaction.id}<ArrowRight /></Button><p className="mt-1 truncate text-[10px] text-muted-foreground">{transaction.senderName} → {transaction.recipientName}</p></div><div className="shrink-0 text-right"><p className="text-xs font-semibold tabular-nums text-foreground">{formatCurrency(transaction.amount, true)}</p><p className="mt-1 text-[9px] text-muted-foreground">Risk {transaction.riskScore}</p></div></div>
                })}
              </div>
              <Button size="sm" className="mt-3 w-full rounded-xl text-xs" onClick={() => startCaseFromComplaints([selectedComplaint.id])}>Create investigation case<FilePlus2 /></Button>
            </div>
          </div>
        </Panel>
      ) : null}

      <Panel>
        <PanelHeading title="Correlated complaints" description={`${filteredComplaints.length} complaint${filteredComplaints.length === 1 ? '' : 's'} match${filteredComplaints.length === 1 ? 'es' : ''} the selected filters`} />
        {filteredComplaints.length ? (
          <div className="data-table-wrap">
            <table className="w-full min-w-[920px] border-separate border-spacing-0 text-left">
              <thead className="bg-muted/45"><tr>
                <th className="w-12 border-b border-border px-4 py-3"><input type="checkbox" checked={allVisibleSelected} onChange={toggleAll} className={checkboxClass} aria-label="Select all visible complaints" /></th>
                <th className="border-b border-border px-3 py-3"><SortButton label="Complaint" active={sortKey === 'id'} direction={sortDirection} onClick={() => sort('id')} /></th>
                <th className="border-b border-border px-3 py-3"><SortButton label="Filed" active={sortKey === 'filedAt'} direction={sortDirection} onClick={() => sort('filedAt')} /></th>
                <th className="border-b border-border px-3 py-3"><SortButton label="Customer / type" active={sortKey === 'customer'} direction={sortDirection} onClick={() => sort('customer')} /></th>
                <th className="border-b border-border px-3 py-3 text-right"><SortButton label="Reported" active={sortKey === 'reportedAmount'} direction={sortDirection} onClick={() => sort('reportedAmount')} /></th>
                <th className="border-b border-border px-3 py-3"><SortButton label="Correlation" active={sortKey === 'correlationScore'} direction={sortDirection} onClick={() => sort('correlationScore')} /></th>
                <th className="border-b border-border px-4 py-3"><SortButton label="Status" active={sortKey === 'status'} direction={sortDirection} onClick={() => sort('status')} /></th>
              </tr></thead>
              <tbody>{filteredComplaints.map((complaint) => <tr key={complaint.id} aria-selected={selectedIds.includes(complaint.id)} className={`transition hover:bg-muted/35 ${selectedIds.includes(complaint.id) ? 'bg-primary/[0.035]' : ''}`}>
                <td className="border-b border-border/60 px-4 py-3.5"><input type="checkbox" checked={selectedIds.includes(complaint.id)} onChange={() => toggleRow(complaint.id)} className={checkboxClass} aria-label={`Select complaint ${complaint.id}`} /></td>
                <td className="border-b border-border/60 px-3 py-3.5"><Button variant="ghost" size="sm" className="h-auto p-0 font-mono text-[11px] font-semibold text-primary hover:bg-transparent hover:text-primary" onClick={() => onSelectComplaint(complaint.id)}>{complaint.id}</Button><p className="mt-1 max-w-52 truncate text-[10px] text-muted-foreground">{complaint.summary}</p></td>
                <td className="border-b border-border/60 px-3 py-3.5 text-xs text-foreground">{formatDate(complaint.filedAt)}</td>
                <td className="border-b border-border/60 px-3 py-3.5"><p className="text-xs font-medium text-foreground">{complaint.customer}</p><p className="mt-1 text-[10px] text-muted-foreground">{complaint.incidentType}</p></td>
                <td className="border-b border-border/60 px-3 py-3.5 text-right text-xs font-semibold tabular-nums text-foreground">{formatCurrency(complaint.reportedAmount, true)}</td>
                <td className="border-b border-border/60 px-3 py-3.5"><div className="w-28"><RiskMeter score={complaint.correlationScore} showLabel={false} /></div></td>
                <td className="border-b border-border/60 px-4 py-3.5"><select className="h-8 min-w-28 rounded-lg border border-border bg-card/70 px-2 text-[10px] font-medium text-foreground outline-none focus-visible:ring-4 focus-visible:ring-primary/10" value={complaint.status} onChange={(event) => onStatusChange(complaint.id, event.target.value as ComplaintStatus)} aria-label={`Change ${complaint.id} status`}><option value="New">New</option><option value="Reviewed">Reviewed</option><option value="Linked">Linked</option></select></td>
              </tr>)}</tbody>
            </table>
          </div>
        ) : <EmptyState title="No complaints match" description="Try broadening the search, correlation score, or status filter." action={<Button variant="outline" size="sm" onClick={clearFilters}>Clear filters</Button>} />}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 px-5 py-3 text-[10px] text-muted-foreground"><span>Showing {filteredComplaints.length} of {complaints.length} synthetic complaints</span><span>Correlation is an illustrative review aid.</span></div>
      </Panel>
    </div>
  )
}
