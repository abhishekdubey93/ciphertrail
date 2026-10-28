import { useMemo, useState, type FormEvent } from 'react'
import {
  ArrowDownToLine,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  Download,
  ExternalLink,
  FileText,
  FolderKanban,
  Plus,
  Search,
  ShieldAlert,
  UserCheck,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  EmptyState,
  PageHeader,
  Panel,
  PanelHeading,
  SortButton,
  StatusBadge,
  checkboxClass,
  controlClass,
} from '@/components/Common'
import type {
  CaseDraft,
  CasePriority,
  CaseStatus,
  DemoAccount,
  DemoComplaint,
  DemoTransaction,
  InvestigationCase,
} from '@/data/demo'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format'
import { downloadReport } from '@/lib/report'

type CaseSortKey = 'id' | 'title' | 'openedAt' | 'priority' | 'status' | 'owner'
type CaseCreateInput = CaseDraft & { owner: string; priority: CasePriority }

const statusOptions: CaseStatus[] = ['Open', 'In review', 'Escalated', 'Closed']
const priorityOptions: CasePriority[] = ['Critical', 'High', 'Medium', 'Low']
const owners = [
  'Rhea Kapur',
  'Neha Rao',
  'Samira Patel',
  'Riley Chen',
  'Morgan Lee',
  'Jordan Blake',
  'Demo analyst',
]

export function CasesPage({
  cases,
  accounts,
  transactions,
  complaints = [],
  initialDraft,
  onClearInitialDraft,
  onCreateCase,
  onUpdateCase,
  onOpenTransaction,
}: {
  cases: InvestigationCase[]
  accounts: DemoAccount[]
  transactions: DemoTransaction[]
  complaints?: DemoComplaint[]
  initialDraft: CaseDraft | null
  onClearInitialDraft: () => void
  onCreateCase: (input: CaseCreateInput) => void
  onUpdateCase: (
    id: string,
    changes: Partial<Pick<InvestigationCase, 'status' | 'priority' | 'owner'>>
  ) => void
  onOpenTransaction: (id: string) => void
}) {
  const [showCreateForm, setShowCreateForm] = useState(Boolean(initialDraft))
  const [title, setTitle] = useState(initialDraft?.title ?? '')
  const [primaryAccountId, setPrimaryAccountId] = useState(initialDraft?.primaryAccountId ?? '')
  const [owner, setOwner] = useState(owners[0])
  const [priority, setPriority] = useState<CasePriority>('Medium')
  const [transactionInput, setTransactionInput] = useState(
    initialDraft?.transactionIds.join(', ') ?? ''
  )
  const [formErrors, setFormErrors] = useState<{
    title?: string
    account?: string
    transactions?: string
  }>({})
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [sortKey, setSortKey] = useState<CaseSortKey>('openedAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null)

  const filteredCases = useMemo(() => {
    const query = search.trim().toLowerCase()
    return cases
      .filter((investigationCase) => {
        const account = accounts.find((item) => item.id === investigationCase.primaryAccountId)
        const matchesQuery =
          !query ||
          [
            investigationCase.id,
            investigationCase.title,
            investigationCase.owner,
            investigationCase.summary,
            investigationCase.primaryAccountId,
            account?.name ?? '',
          ].some((value) => value.toLowerCase().includes(query))
        return (
          matchesQuery &&
          (statusFilter === 'all' || investigationCase.status === statusFilter) &&
          (priorityFilter === 'all' || investigationCase.priority === priorityFilter)
        )
      })
      .sort((left, right) => {
        const a = left[sortKey]
        const b = right[sortKey]
        const comparison = String(a).localeCompare(String(b))
        return sortDirection === 'asc' ? comparison : -comparison
      })
  }, [cases, accounts, search, statusFilter, priorityFilter, sortKey, sortDirection])

  const selectedCase =
    cases.find((investigationCase) => investigationCase.id === selectedCaseId) ?? null

  const selectedCaseTransactions = useMemo(() => {
    if (!selectedCase) return []
    return transactions.filter((t) => selectedCase.transactionIds.includes(t.id))
  }, [selectedCase, transactions])

  const selectedCaseTotalExposure = useMemo(() => {
    return selectedCaseTransactions.reduce((sum, t) => sum + t.amount, 0)
  }, [selectedCaseTransactions])

  const allVisibleSelected =
    filteredCases.length > 0 &&
    filteredCases.every((investigationCase) => selectedIds.includes(investigationCase.id))

  const toggleRow = (id: string) =>
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    )

  const toggleAll = () =>
    setSelectedIds((current) =>
      allVisibleSelected
        ? current.filter(
            (id) => !filteredCases.some((investigationCase) => investigationCase.id === id)
          )
        : Array.from(
            new Set([...current, ...filteredCases.map((investigationCase) => investigationCase.id)])
          )
    )

  const sort = (key: CaseSortKey) => {
    if (sortKey === key) setSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDirection(key === 'openedAt' ? 'desc' : 'asc')
    }
  }

  const openCreateForm = () => {
    setShowCreateForm(true)
    setTitle('')
    setPrimaryAccountId('')
    setOwner(owners[0])
    setPriority('Medium')
    setTransactionInput('')
    setFormErrors({})
  }

  const cancelCreateForm = () => {
    setShowCreateForm(false)
    setFormErrors({})
    onClearInitialDraft()
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors: { title?: string; account?: string; transactions?: string } = {}
    if (title.trim().length < 6) nextErrors.title = 'Enter a case title with at least 6 characters.'
    if (!primaryAccountId) nextErrors.account = 'Choose a primary account for this investigation.'
    const transactionIds = Array.from(
      new Set(
        transactionInput
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean)
      )
    )
    const validIds = new Set(transactions.map((transaction) => transaction.id))
    const unknownIds = transactionIds.filter((id) => !validIds.has(id))
    if (unknownIds.length) {
      nextErrors.transactions = `No matching synthetic transaction record: ${unknownIds.join(', ')}.`
    }
    setFormErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    onCreateCase({
      title: title.trim(),
      primaryAccountId,
      owner,
      priority,
      transactionIds,
      complaintIds: initialDraft?.complaintIds ?? [],
    })
    setShowCreateForm(false)
    setFormErrors({})
    setTitle('')
    setPrimaryAccountId('')
    setTransactionInput('')
    onClearInitialDraft()
  }

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setPriorityFilter('all')
  }

  const closeSelectedCases = () => {
    selectedIds.forEach((id) => onUpdateCase(id, { status: 'Closed' }))
    setSelectedIds([])
  }

  const handleDownloadDossier = (caseId: string, format: 'markdown' | 'json' | 'csv') => {
    try {
      const fileName = downloadReport('case-dossier', format, {
        transactions,
        accounts,
        complaints,
        cases,
        mules: [],
        selectedCaseId: caseId,
      })
      setDownloadSuccess(`Generated and downloaded ${fileName}`)
      window.setTimeout(() => setDownloadSuccess(null), 4000)
    } catch (err) {
      console.error('Download error:', err)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Coordinate · active investigations"
        title="Investigation cases"
        description="Manage case lifecycles, assign investigators, track evidence records, and generate investigation dossiers. All edits and new cases are saved automatically to your local browser storage."
        action={
          !showCreateForm ? (
            <Button size="sm" className="rounded-xl text-xs" onClick={openCreateForm}>
              <Plus />New case
            </Button>
          ) : undefined
        }
      />

      {downloadSuccess ? (
        <div role="status" className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-success/20 bg-success/5 px-4 py-2.5 text-xs text-success">
          <span>{downloadSuccess}</span>
          <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => setDownloadSuccess(null)}>
            Dismiss
          </Button>
        </div>
      ) : null}

      {showCreateForm ? (
        <Panel className="mb-5 border-primary/30">
          <PanelHeading
            title="Create investigation case"
            description="Add a concise title, choose a primary suspect account, assign an investigator, and attach known transaction IDs."
            action={
              <Button variant="ghost" size="icon" className="size-8" aria-label="Close case form" onClick={cancelCreateForm}>
                <X />
              </Button>
            }
          />
          <form noValidate onSubmit={handleSubmit} className="grid gap-4 p-5 lg:grid-cols-2">
            <label className="block lg:col-span-2">
              <span className="mb-1.5 block text-xs font-semibold text-foreground">
                Case title <span className="text-destructive">*</span>
              </span>
              <input
                className={controlClass}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={90}
                placeholder="e.g. Rapid relay from payroll account"
                aria-invalid={Boolean(formErrors.title)}
                aria-describedby={formErrors.title ? 'case-title-error' : undefined}
              />
              {formErrors.title ? (
                <span id="case-title-error" role="alert" className="mt-1.5 block text-xs text-destructive">
                  {formErrors.title}
                </span>
              ) : null}
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-foreground">
                Primary account <span className="text-destructive">*</span>
              </span>
              <select
                className={controlClass}
                value={primaryAccountId}
                onChange={(event) => setPrimaryAccountId(event.target.value)}
                aria-invalid={Boolean(formErrors.account)}
                aria-describedby={formErrors.account ? 'case-account-error' : undefined}
              >
                <option value="">Select an account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} · {account.id} (Risk {account.riskScore})
                  </option>
                ))}
              </select>
              {formErrors.account ? (
                <span id="case-account-error" role="alert" className="mt-1.5 block text-xs text-destructive">
                  {formErrors.account}
                </span>
              ) : null}
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-foreground">Assigned investigator</span>
              <select className={controlClass} value={owner} onChange={(event) => setOwner(event.target.value)}>
                {owners.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-foreground">Priority</span>
              <select
                className={controlClass}
                value={priority}
                onChange={(event) => setPriority(event.target.value as CasePriority)}
              >
                {priorityOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-foreground">Supporting transaction IDs</span>
              <input
                className={controlClass}
                value={transactionInput}
                onChange={(event) => setTransactionInput(event.target.value)}
                placeholder="TXN-90218, TXN-90217"
                aria-invalid={Boolean(formErrors.transactions)}
                aria-describedby={formErrors.transactions ? 'case-transactions-error' : 'case-transactions-help'}
              />
              {formErrors.transactions ? (
                <span id="case-transactions-error" role="alert" className="mt-1.5 block text-xs text-destructive">
                  {formErrors.transactions}
                </span>
              ) : (
                <span id="case-transactions-help" className="mt-1.5 block text-[10px] text-muted-foreground">
                  Optional, comma-separated IDs from the sample ledger.
                </span>
              )}
            </label>

            <div className="flex flex-wrap items-end justify-end gap-2 lg:col-span-2">
              <Button type="button" variant="outline" className="bg-card/70 text-xs" onClick={cancelCreateForm}>
                Cancel
              </Button>
              <Button type="submit" className="text-xs">
                <Check />Create case
              </Button>
            </div>
          </form>
        </Panel>
      ) : null}

      <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(220px,1fr)_minmax(160px,0.5fr)_minmax(160px,0.5fr)]">
        <label className="relative block">
          <span className="sr-only">Search cases</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            className={`${controlClass} pl-10`}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search case, account, owner..."
            aria-label="Search investigation cases"
          />
        </label>
        <label className="block">
          <span className="sr-only">Filter cases by status</span>
          <select
            className={controlClass}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter cases by status"
          >
            <option value="all">All statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="sr-only">Filter cases by priority</span>
          <select
            className={controlClass}
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
            aria-label="Filter cases by priority"
          >
            <option value="all">All priorities</option>
            {priorityOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>

      {selectedIds.length ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/15 bg-primary/[0.045] px-4 py-3">
          <p className="text-xs font-semibold text-primary">
            {selectedIds.length} case{selectedIds.length === 1 ? '' : 's'} selected
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 bg-card/70 text-xs" onClick={() => setSelectedIds([])}>
              Clear selection
            </Button>
            <Button variant="outline" size="sm" className="h-8 bg-card/70 text-xs" onClick={closeSelectedCases}>
              Close selected cases
            </Button>
          </div>
        </div>
      ) : null}

      {/* Case Detailed Inspector Drawer */}
      {selectedCase ? (
        <Panel className="mb-5 border-primary/30 shadow-lg">
          <PanelHeading
            title={`${selectedCase.id} · ${selectedCase.title}`}
            description={`Opened ${formatDateTime(selectedCase.openedAt)} IST · Assigned to ${selectedCase.owner}`}
            action={
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label="Close case details"
                onClick={() => setSelectedCaseId(null)}
              >
                <X />
              </Button>
            }
          />
          <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]">
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Case Executive Summary
                </p>
                <p className="mt-1 text-xs leading-6 text-foreground">{selectedCase.summary}</p>
              </div>

              {/* Status & Assignment Controls */}
              <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Case Status & Assignment Management (Persisted)
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="block text-[10px] font-medium text-muted-foreground mb-1">Status</label>
                    <select
                      className="h-9 w-full rounded-lg border border-border bg-card px-2.5 text-xs font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                      value={selectedCase.status}
                      onChange={(e) => onUpdateCase(selectedCase.id, { status: e.target.value as CaseStatus })}
                    >
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-muted-foreground mb-1">Priority</label>
                    <select
                      className="h-9 w-full rounded-lg border border-border bg-card px-2.5 text-xs font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                      value={selectedCase.priority}
                      onChange={(e) => onUpdateCase(selectedCase.id, { priority: e.target.value as CasePriority })}
                    >
                      {priorityOptions.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-muted-foreground mb-1">Assigned Investigator</label>
                    <select
                      className="h-9 w-full rounded-lg border border-border bg-card px-2.5 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                      value={selectedCase.owner}
                      onChange={(e) => onUpdateCase(selectedCase.id, { owner: e.target.value })}
                    >
                      {owners.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Primary Suspect Entity */}
              <div className="rounded-xl border border-border/70 bg-muted/20 p-3.5 text-xs">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                  Primary Suspect Account
                </span>
                <div className="mt-1 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">
                      {accounts.find((a) => a.id === selectedCase.primaryAccountId)?.name ?? selectedCase.primaryAccountId}
                    </p>
                    <p className="font-mono text-[10px] text-muted-foreground">{selectedCase.primaryAccountId}</p>
                  </div>
                  <span className="rounded-full border border-border bg-card px-2.5 py-1 text-[10px] font-mono font-bold text-destructive">
                    Risk {accounts.find((a) => a.id === selectedCase.primaryAccountId)?.riskScore ?? 85}/100
                  </span>
                </div>
              </div>

              {selectedCase.complaintIds.length ? (
                <div className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">Linked Customer Complaints: </span>
                  {selectedCase.complaintIds.join(', ')}
                </div>
              ) : null}
            </div>

            {/* Right sidebar: Evidence Records & Export */}
            <div className="flex flex-col justify-between rounded-xl border border-border/80 bg-muted/30 p-4">
              <div>
                <div className="flex items-center justify-between border-b border-border/70 pb-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Correlated Exposure
                    </p>
                    <p className="mt-0.5 text-xl font-bold tabular-nums text-foreground">
                      {formatCurrency(selectedCaseTotalExposure)}
                    </p>
                  </div>
                  <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">
                    {selectedCase.transactionIds.length} transfers
                  </span>
                </div>

                <div className="mt-4">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Supporting Transaction Records
                  </p>
                  {selectedCaseTransactions.length ? (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {selectedCaseTransactions.map((txn) => (
                        <div key={txn.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-card p-2 text-xs">
                          <button
                            type="button"
                            className="font-mono text-[10px] font-bold text-primary hover:underline"
                            onClick={() => onOpenTransaction(txn.id)}
                          >
                            {txn.id} →
                          </button>
                          <span className="font-semibold tabular-nums text-foreground">
                            {formatCurrency(txn.amount, true)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No transaction records attached.</p>
                  )}
                </div>
              </div>

              {/* Download Investigation Dossier Actions */}
              <div className="mt-6 border-t border-border/70 pt-4 space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Export Case Dossier
                </p>
                <Button
                  size="sm"
                  className="w-full text-xs font-semibold"
                  onClick={() => handleDownloadDossier(selectedCase.id, 'markdown')}
                >
                  <FileText />Download Investigation Dossier (.md)
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full bg-card text-xs"
                    onClick={() => handleDownloadDossier(selectedCase.id, 'json')}
                  >
                    <Download />Export JSON
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full bg-card text-xs"
                    onClick={() => handleDownloadDossier(selectedCase.id, 'csv')}
                  >
                    <Download />Export CSV
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Panel>
      ) : null}

      {/* Case Register Table */}
      <Panel>
        <PanelHeading
          title="Case register"
          description={`${filteredCases.length} case${filteredCases.length === 1 ? '' : 's'} match${filteredCases.length === 1 ? 'es' : ''} the current filters · updates persist locally`}
        />
        {filteredCases.length ? (
          <div className="data-table-wrap">
            <table className="w-full min-w-[1040px] border-separate border-spacing-0 text-left">
              <thead className="bg-muted/45">
                <tr>
                  <th className="w-12 border-b border-border px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleAll}
                      className={checkboxClass}
                      aria-label="Select all visible cases"
                    />
                  </th>
                  <th className="border-b border-border px-3 py-3">
                    <SortButton label="Case" active={sortKey === 'id'} direction={sortDirection} onClick={() => sort('id')} />
                  </th>
                  <th className="border-b border-border px-3 py-3">
                    <SortButton label="Investigation" active={sortKey === 'title'} direction={sortDirection} onClick={() => sort('title')} />
                  </th>
                  <th className="border-b border-border px-3 py-3">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Account</span>
                  </th>
                  <th className="border-b border-border px-3 py-3">
                    <SortButton label="Priority" active={sortKey === 'priority'} direction={sortDirection} onClick={() => sort('priority')} />
                  </th>
                  <th className="border-b border-border px-3 py-3">
                    <SortButton label="Status" active={sortKey === 'status'} direction={sortDirection} onClick={() => sort('status')} />
                  </th>
                  <th className="border-b border-border px-3 py-3">
                    <SortButton label="Assigned Owner" active={sortKey === 'owner'} direction={sortDirection} onClick={() => sort('owner')} />
                  </th>
                  <th className="border-b border-border px-4 py-3">
                    <SortButton label="Opened" active={sortKey === 'openedAt'} direction={sortDirection} onClick={() => sort('openedAt')} />
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCases.map((investigationCase) => {
                  const account = accounts.find((item) => item.id === investigationCase.primaryAccountId)
                  const isSelected = selectedIds.includes(investigationCase.id)
                  const isActive = selectedCaseId === investigationCase.id
                  return (
                    <tr
                      key={investigationCase.id}
                      aria-selected={isSelected}
                      className={`transition hover:bg-muted/35 ${isSelected ? 'bg-primary/[0.04]' : ''} ${isActive ? 'ring-1 ring-inset ring-primary/40 bg-primary/[0.06]' : ''}`}
                    >
                      <td className="border-b border-border/60 px-4 py-3.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRow(investigationCase.id)}
                          className={checkboxClass}
                          aria-label={`Select case ${investigationCase.id}`}
                        />
                      </td>
                      <td className="border-b border-border/60 px-3 py-3.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 font-mono text-[11px] font-semibold text-primary hover:bg-transparent hover:text-primary"
                          onClick={() => setSelectedCaseId(investigationCase.id)}
                        >
                          {investigationCase.id}
                        </Button>
                        <p className="mt-1 text-[9px] text-muted-foreground">
                          {investigationCase.transactionIds.length} records · {investigationCase.complaintIds.length} complaints
                        </p>
                      </td>
                      <td className="max-w-56 border-b border-border/60 px-3 py-3.5">
                        <button
                          type="button"
                          className="max-w-full truncate text-left text-xs font-semibold text-foreground hover:text-primary focus-visible:outline-none"
                          onClick={() => setSelectedCaseId(investigationCase.id)}
                        >
                          {investigationCase.title}
                        </button>
                        <p className="mt-1 truncate text-[10px] text-muted-foreground">{investigationCase.summary}</p>
                      </td>
                      <td className="max-w-40 border-b border-border/60 px-3 py-3.5">
                        <p className="truncate text-xs text-foreground">
                          {account?.name ?? investigationCase.primaryAccountId}
                        </p>
                        <p className="mt-1 font-mono text-[9px] text-muted-foreground">
                          {investigationCase.primaryAccountId}
                        </p>
                      </td>
                      <td className="border-b border-border/60 px-3 py-3.5">
                        <select
                          className="h-8 rounded-lg border border-border bg-card/70 px-2 text-[10px] font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                          value={investigationCase.priority}
                          onChange={(event) =>
                            onUpdateCase(investigationCase.id, { priority: event.target.value as CasePriority })
                          }
                          aria-label={`Change ${investigationCase.id} priority`}
                        >
                          {priorityOptions.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="border-b border-border/60 px-3 py-3.5">
                        <select
                          className="h-8 rounded-lg border border-border bg-card/70 px-2 text-[10px] font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                          value={investigationCase.status}
                          onChange={(event) =>
                            onUpdateCase(investigationCase.id, { status: event.target.value as CaseStatus })
                          }
                          aria-label={`Change ${investigationCase.id} status`}
                        >
                          {statusOptions.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="border-b border-border/60 px-3 py-3.5">
                        {/* Interactive Owner Reassignment */}
                        <select
                          className="h-8 rounded-lg border border-border bg-card/70 px-2 text-[10px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                          value={investigationCase.owner}
                          onChange={(event) =>
                            onUpdateCase(investigationCase.id, { owner: event.target.value })
                          }
                          aria-label={`Reassign ${investigationCase.id} owner`}
                        >
                          {owners.map((ownerName) => (
                            <option key={ownerName} value={ownerName}>
                              {ownerName}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="border-b border-border/60 px-4 py-3.5 text-xs text-foreground">
                        {formatDate(investigationCase.openedAt)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No cases match"
            description="Adjust the search, status, or priority filters to find a case."
            action={
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            }
          />
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 px-5 py-3 text-[10px] text-muted-foreground">
          <span>Showing {filteredCases.length} of {cases.length} cases</span>
          <span>Case creation, status changes, and assignments persist in local storage.</span>
        </div>
      </Panel>
    </div>
  )
}
