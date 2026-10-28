import { useCallback, useEffect, useMemo, useState } from 'react'
import { Sidebar, Topbar, type SearchHit } from '@/components/Shell'
import { OverviewPage, type ChartRange } from '@/components/OverviewPage'
import { TransactionsPage, type TransactionRiskFilter } from '@/components/TransactionsPage'
import { MuleDetectionPage } from '@/components/MuleDetectionPage'
import { MoneyTrailPage } from '@/components/MoneyTrailPage'
import { ComplaintsPage } from '@/components/ComplaintsPage'
import { CasesPage } from '@/components/CasesPage'
import { ReportsPage } from '@/components/ReportsPage'
import {
  accounts,
  initialCases,
  initialComplaints,
  initialTransactions,
  muleProfiles,
  type CaseDraft,
  type CasePriority,
  type CaseStatus,
  type ComplaintStatus,
  type DemoComplaint,
  type DemoTransaction,
  type InvestigationCase,
  type PageKey,
  type TransactionStatus,
  type WorkspaceEvent,
} from '@/data/demo'
import { formatCurrency } from '@/lib/format'
import { IntroOverlay } from '@/components/IntroOverlay'
import {
  clearWorkspaceStorage,
  loadStoredCases,
  loadStoredComplaints,
  loadStoredEvents,
  loadStoredTransactions,
  saveStoredCases,
  saveStoredComplaints,
  saveStoredEvents,
  saveStoredTransactions,
} from '@/lib/storage'
import { RotateCcw } from 'lucide-react'
import { Button } from './components/ui/button'

export default function App() {
  const [introVisible, setIntroVisible] = useState(() => {
    try {
      return (
        typeof window !== 'undefined' &&
        window.sessionStorage.getItem('ciphertrail-intro-seen') !== 'true' &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      )
    } catch {
      return false
    }
  })

  // State with LocalStorage Persistence
  const [workspaceEvents, setWorkspaceEvents] = useState<WorkspaceEvent[]>(loadStoredEvents)
  const [transactions, setTransactions] = useState<DemoTransaction[]>(loadStoredTransactions)
  const [complaints, setComplaints] = useState<DemoComplaint[]>(loadStoredComplaints)
  const [cases, setCases] = useState<InvestigationCase[]>(loadStoredCases)

  const completeIntro = useCallback(() => {
    try {
      window.sessionStorage.setItem('ciphertrail-intro-seen', 'true')
    } catch {
      setIntroVisible(false)
      return
    }
    setIntroVisible(false)
  }, [])

  const recordWorkspaceEvent = (
    event: Pick<WorkspaceEvent, 'kind' | 'title' | 'detail' | 'transactionId'>
  ) => {
    const newEvent: WorkspaceEvent = {
      ...event,
      id: `event-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      source: 'WORKSPACE',
    }
    setWorkspaceEvents((current) => {
      const updated = [newEvent, ...current].slice(0, 16)
      saveStoredEvents(updated)
      return updated
    })
  }

  const [page, setPage] = useState<PageKey>('overview')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [page])

  const [searchValue, setSearchValue] = useState('')
  const [chartRange, setChartRange] = useState<ChartRange>('7d')
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null)
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null)
  const [selectedAccountId, setSelectedAccountId] = useState('A-89316')
  const [transactionRiskFilter, setTransactionRiskFilter] = useState<TransactionRiskFilter>('all')
  const [caseDraft, setCaseDraft] = useState<CaseDraft | null>(null)

  // Universal Search across Transactions, Accounts, Cases, Complaints
  const searchHits = useMemo<SearchHit[]>(() => {
    const query = searchValue.trim().toLowerCase()
    if (!query) return []

    const transactionHits = transactions
      .filter((transaction) =>
        [
          transaction.id,
          transaction.senderName,
          transaction.senderId,
          transaction.recipientName,
          transaction.recipientId,
          transaction.memo,
        ].some((value) => value.toLowerCase().includes(query))
      )
      .map((transaction) => ({
        key: `transaction-${transaction.id}`,
        title: transaction.id,
        subtitle: `${transaction.senderName} → ${transaction.recipientName} · ${formatCurrency(transaction.amount, true)} · risk ${transaction.riskScore}`,
        type: 'Transaction' as const,
        page: 'transactions' as const,
        transactionId: transaction.id,
      }))

    const accountHits = accounts
      .filter((account) =>
        [account.id, account.name, account.institution].some((value) =>
          value.toLowerCase().includes(query)
        )
      )
      .map((account) => ({
        key: `account-${account.id}`,
        title: account.name,
        subtitle: `${account.id} · ${account.institution} · risk ${account.riskScore}/100`,
        type: 'Account' as const,
        page: 'money-trail' as const,
        accountId: account.id,
      }))

    const caseHits = cases
      .filter((item) =>
        [item.id, item.title, item.owner, item.summary, item.primaryAccountId].some((value) =>
          value.toLowerCase().includes(query)
        )
      )
      .map((item) => ({
        key: `case-${item.id}`,
        title: item.id,
        subtitle: `${item.title} · ${item.status} · Assigned: ${item.owner}`,
        type: 'Case' as const,
        page: 'cases' as const,
        caseId: item.id,
      }))

    const complaintHits = complaints
      .filter((item) =>
        [item.id, item.customer, item.incidentType, item.summary].some((value) =>
          value.toLowerCase().includes(query)
        )
      )
      .map((item) => ({
        key: `complaint-${item.id}`,
        title: item.id,
        subtitle: `${item.customer} · ${item.incidentType} · ${formatCurrency(item.reportedAmount, true)}`,
        type: 'Complaint' as const,
        page: 'complaints' as const,
        complaintId: item.id,
      }))

    return [...accountHits, ...transactionHits, ...caseHits, ...complaintHits].slice(0, 8)
  }, [searchValue, transactions, cases, complaints])

  const openTransaction = (id: string) => {
    setSelectedTransactionId(id)
    setTransactionRiskFilter('all')
    setPage('transactions')
    setMobileNavOpen(false)
  }

  const traceTransaction = (id: string) => {
    setSelectedTransactionId(id)
    const txn = transactions.find((t) => t.id === id)
    if (txn) {
      setSelectedAccountId(txn.senderId)
    }
    setPage('money-trail')
    setMobileNavOpen(false)
  }

  const openAccount = (id: string) => {
    setSelectedAccountId(id)
    setPage('money-trail')
    setMobileNavOpen(false)
  }

  const openCase = (id: string) => {
    setPage('cases')
    setMobileNavOpen(false)
  }

  const openComplaint = (id: string) => {
    setSelectedComplaintId(id)
    setPage('complaints')
    setMobileNavOpen(false)
  }

  const startCaseDraft = (draft: CaseDraft) => {
    setCaseDraft(draft)
    setPage('cases')
    setMobileNavOpen(false)
  }

  const updateTransactionStatus = (id: string, status: TransactionStatus) => {
    const transaction = transactions.find((item) => item.id === id)
    if (!transaction || transaction.status === status) return
    setTransactions((current) => {
      const updated = current.map((item) => (item.id === id ? { ...item, status } : item))
      saveStoredTransactions(updated)
      return updated
    })
    recordWorkspaceEvent({
      kind: 'transaction',
      title: 'Transaction status updated',
      detail: `${id} · ${transaction.status} → ${status}`,
      transactionId: id,
    })
  }

  const updateComplaintStatus = (id: string, status: ComplaintStatus) => {
    const complaint = complaints.find((item) => item.id === id)
    if (!complaint || complaint.status === status) return
    setComplaints((current) => {
      const updated = current.map((item) => (item.id === id ? { ...item, status } : item))
      saveStoredComplaints(updated)
      return updated
    })
    recordWorkspaceEvent({
      kind: 'complaint',
      title: 'Complaint review updated',
      detail: `${id} · ${complaint.status} → ${status}`,
    })
  }

  const updateCase = (
    id: string,
    changes: Partial<Pick<InvestigationCase, 'status' | 'priority' | 'owner'>>
  ) => {
    const investigationCase = cases.find((item) => item.id === id)
    if (!investigationCase) return
    const changesSummary = [
      changes.status && changes.status !== investigationCase.status
        ? `status ${investigationCase.status} → ${changes.status}`
        : null,
      changes.priority && changes.priority !== investigationCase.priority
        ? `priority ${investigationCase.priority} → ${changes.priority}`
        : null,
      changes.owner && changes.owner !== investigationCase.owner
        ? `assigned ${investigationCase.owner} → ${changes.owner}`
        : null,
    ]
      .filter(Boolean)
      .join(' · ')
    if (!changesSummary) return
    setCases((current) => {
      const updated = current.map((item) => (item.id === id ? { ...item, ...changes } : item))
      saveStoredCases(updated)
      return updated
    })
    recordWorkspaceEvent({
      kind: 'case',
      title: 'Investigation case updated',
      detail: `${id} · ${changesSummary}`,
    })
  }

  const createCase = (input: CaseDraft & { owner: string; priority: CasePriority }) => {
    const caseId = `CASE-${String(2500 + cases.length).padStart(4, '0')}`
    const newCase: InvestigationCase = {
      id: caseId,
      title: input.title,
      primaryAccountId: input.primaryAccountId,
      owner: input.owner,
      openedAt: new Date().toISOString(),
      status: 'Open' satisfies CaseStatus,
      priority: input.priority,
      transactionIds: input.transactionIds,
      complaintIds: input.complaintIds,
      summary: `Created in the CipherTrail local investigation workspace with ${input.transactionIds.length} supporting transaction record${input.transactionIds.length === 1 ? '' : 's'}.`,
    }
    setCases((current) => {
      const updated = [newCase, ...current]
      saveStoredCases(updated)
      return updated
    })
    recordWorkspaceEvent({
      kind: 'case',
      title: 'Investigation case created',
      detail: `${caseId} · ${input.title} · ${input.transactionIds.length} supporting transactions`,
    })
    if (input.complaintIds.length) {
      const complaintIds = new Set(input.complaintIds)
      setComplaints((current) => {
        const updated = current.map((complaint) =>
          complaintIds.has(complaint.id) ? { ...complaint, status: 'Linked' as ComplaintStatus } : complaint
        )
        saveStoredComplaints(updated)
        return updated
      })
    }
    setCaseDraft(null)
  }

  const resetAllDemoData = () => {
    clearWorkspaceStorage()
    setTransactions(initialTransactions)
    setComplaints(initialComplaints)
    setCases(initialCases)
    recordWorkspaceEvent({
      kind: 'system',
      title: 'Demo workspace reset',
      detail: 'Restored initial synthetic INR transaction, complaint, and case datasets.',
    })
  }

  const viewHighRiskTransactions = () => {
    setSelectedTransactionId(null)
    setTransactionRiskFilter('high')
    setPage('transactions')
  }

  let activePage
  switch (page) {
    case 'overview':
      activePage = (
        <OverviewPage
          transactions={transactions}
          accounts={accounts}
          mules={muleProfiles}
          cases={cases}
          activityEvents={workspaceEvents}
          chartRange={chartRange}
          onChartRangeChange={setChartRange}
          onNavigate={setPage}
          onOpenTransaction={openTransaction}
          onTraceAccount={openAccount}
          onViewHighRisk={viewHighRiskTransactions}
        />
      )
      break
    case 'transactions':
      activePage = (
        <TransactionsPage
          transactions={transactions}
          accounts={accounts}
          complaints={complaints}
          riskFilter={transactionRiskFilter}
          onRiskFilterChange={setTransactionRiskFilter}
          selectedTransactionId={selectedTransactionId}
          onSelectTransaction={setSelectedTransactionId}
          onClearSelectedTransaction={() => setSelectedTransactionId(null)}
          onStatusChange={updateTransactionStatus}
          onStartCase={(transactionIds, accountId, title) =>
            startCaseDraft({
              transactionIds,
              primaryAccountId: accountId,
              title,
              complaintIds: [],
            })
          }
          onTraceTransaction={traceTransaction}
          onTraceAccount={openAccount}
        />
      )
      break
    case 'mules':
      activePage = (
        <MuleDetectionPage
          profiles={muleProfiles}
          accounts={accounts}
          transactions={transactions}
          onOpenTransaction={openTransaction}
          onTraceAccount={openAccount}
        />
      )
      break
    case 'money-trail':
      activePage = (
        <MoneyTrailPage
          accounts={accounts}
          transactions={transactions}
          profiles={muleProfiles}
          selectedAccountId={selectedAccountId}
          selectedTransactionId={selectedTransactionId}
          onSelectAccount={setSelectedAccountId}
          onSelectTransaction={setSelectedTransactionId}
          onOpenTransaction={openTransaction}
        />
      )
      break
    case 'complaints':
      activePage = (
        <ComplaintsPage
          complaints={complaints}
          transactions={transactions}
          accounts={accounts}
          selectedComplaintId={selectedComplaintId}
          onSelectComplaint={setSelectedComplaintId}
          onClearSelectedComplaint={() => setSelectedComplaintId(null)}
          onStatusChange={updateComplaintStatus}
          onTraceAccount={openAccount}
          onOpenTransaction={openTransaction}
          onStartCase={startCaseDraft}
        />
      )
      break
    case 'cases':
      activePage = (
        <CasesPage
          cases={cases}
          accounts={accounts}
          transactions={transactions}
          complaints={complaints}
          initialDraft={caseDraft}
          onClearInitialDraft={() => setCaseDraft(null)}
          onCreateCase={createCase}
          onUpdateCase={updateCase}
          onOpenTransaction={openTransaction}
        />
      )
      break
    case 'reports':
      activePage = (
        <ReportsPage
          transactions={transactions}
          mules={muleProfiles}
          complaints={complaints}
          cases={cases}
          accounts={accounts}
        />
      )
      break
  }

  return (
    <div className="dark command-center-bg flex min-h-screen bg-background">
      <Sidebar
        page={page}
        onNavigate={setPage}
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Topbar
          page={page}
          searchValue={searchValue}
          onSearchValueChange={setSearchValue}
          searchHits={searchHits}
          transactions={transactions}
          onOpenTransaction={openTransaction}
          onOpenAccount={openAccount}
          onOpenCase={openCase}
          onOpenComplaint={openComplaint}
          onViewHighRisk={viewHighRiskTransactions}
          onMobileMenu={() => setMobileNavOpen(true)}
        />
        <main id="main-content" className="w-full flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[1420px]">{activePage}</div>
        </main>
        <footer className="border-t border-border/70 px-4 py-3 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1420px] flex-col items-center justify-between gap-2 text-[10px] text-muted-foreground sm:flex-row">
            <span>
              CipherTrail · Indian financial context · Synthetic INR records only · Changes persist in local browser storage
            </span>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[10px] text-muted-foreground hover:text-foreground"
                onClick={resetAllDemoData}
              >
                <RotateCcw className="size-3" />Reset Demo Data
              </Button>
            </div>
          </div>
        </footer>
      </div>
      {introVisible ? <IntroOverlay onComplete={completeIntro} /> : null}
    </div>
  )
}
