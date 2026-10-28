import { useState } from 'react'
import {
  ArrowDownToLine,
  Check,
  ClipboardList,
  FileJson2,
  FileSpreadsheet,
  FileText,
  Fingerprint,
  Scale,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState, PageHeader, Panel, PanelHeading, StatusBadge, controlClass } from '@/components/Common'
import type {
  DemoAccount,
  DemoComplaint,
  DemoTransaction,
  InvestigationCase,
  MuleProfile,
} from '@/data/demo'
import { downloadReport, type ReportFormat, type ReportId } from '@/lib/report'
import { formatCurrency, formatDateTime } from '@/lib/format'

const reportDefinitions: {
  id: ReportId
  title: string
  description: string
  icon: typeof FileSpreadsheet
  scope: string
}[] = [
  {
    id: 'transaction-ledger',
    title: 'Transaction review ledger',
    description:
      'Transaction IDs, parties, amounts, channel, status, risk score, and transparent rule-based factor rationale.',
    icon: FileSpreadsheet,
    scope: 'Full transaction sample',
  },
  {
    id: 'mule-register',
    title: 'Mule account risk register',
    description:
      'Account profiles, risk indicators, relay velocity explanations, and supporting transaction records.',
    icon: Fingerprint,
    scope: 'All candidate profiles',
  },
  {
    id: 'complaint-correlation',
    title: 'Complaint correlation report',
    description:
      'Customer-reported events, correlation scores, linked accounts, and transaction evidence.',
    icon: ClipboardList,
    scope: 'All complaint records',
  },
  {
    id: 'case-evidence',
    title: 'Investigation case evidence bundle',
    description:
      'Case status, owner, priority, linked complaints, and supporting synthetic transactions.',
    icon: ShieldCheck,
    scope: 'Current case register',
  },
]

export function ReportsPage({
  transactions,
  mules,
  complaints,
  cases,
  accounts,
}: {
  transactions: DemoTransaction[]
  mules: MuleProfile[]
  complaints: DemoComplaint[]
  cases: InvestigationCase[]
  accounts: DemoAccount[]
}) {
  const [bulkFormat, setBulkFormat] = useState<ReportFormat>('json')
  const [dossierCaseId, setDossierCaseId] = useState<string>(cases[0]?.id ?? '')
  const [dossierFormat, setDossierFormat] = useState<ReportFormat>('markdown')
  const [lastDownload, setLastDownload] = useState<string | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const selectedCase = cases.find((c) => c.id === dossierCaseId) ?? cases[0]
  const selectedCaseAccount = selectedCase
    ? accounts.find((a) => a.id === selectedCase.primaryAccountId)
    : null
  const selectedCaseTransactions = selectedCase
    ? transactions.filter((t) => selectedCase.transactionIds.includes(t.id))
    : []
  const selectedCaseExposure = selectedCaseTransactions.reduce((sum, t) => sum + t.amount, 0)

  const counts: Record<string, number> = {
    'transaction-ledger': transactions.length,
    'mule-register': mules.length,
    'complaint-correlation': complaints.length,
    'case-evidence': cases.length,
  }

  const handleDownloadBulk = (reportId: ReportId) => {
    setDownloadError(null)
    try {
      const fileName = downloadReport(reportId, bulkFormat, {
        transactions,
        mules,
        complaints,
        cases,
        accounts,
      })
      setLastDownload(fileName)
    } catch {
      setDownloadError(
        'The report could not be generated in this browser. Try another format or reload the demo workspace.'
      )
    }
  }

  const handleDownloadDossier = () => {
    if (!selectedCase) return
    setDownloadError(null)
    try {
      const fileName = downloadReport('case-dossier', dossierFormat, {
        transactions,
        mules,
        complaints,
        cases,
        accounts,
        selectedCaseId: selectedCase.id,
      })
      setLastDownload(fileName)
    } catch {
      setDownloadError('Could not generate the case dossier. Please check that cases exist in the workspace.')
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Export · browser-generated evidence"
        title="Evidence reports"
        description="Generate and download structured investigation summaries and evidence packages assembled from current synthetic records. All files are generated client-side with full rule explainability."
        action={
          <span className="rounded-full border border-border bg-card/70 px-3 py-2 text-[11px] font-medium text-muted-foreground">
            Client-side generator · No API required
          </span>
        }
      />

      {downloadError ? (
        <div role="alert" className="mb-4 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-xs text-destructive">
          {downloadError}
        </div>
      ) : null}

      {lastDownload ? (
        <div role="status" className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-success/20 bg-success/5 px-4 py-3 text-xs">
          <span className="flex items-center gap-2 font-medium text-success">
            <Check className="size-4" /> Report successfully generated and downloaded
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">{lastDownload}</span>
        </div>
      ) : null}

      {/* Case Investigation Dossier Generator (Interactive Selection) */}
      <Panel className="mb-6 border-primary/25 bg-card/85 shadow-md">
        <PanelHeading
          title="Case Investigation Summary Dossier"
          description="Generate a comprehensive, downloadable incident report for an individual investigation case, including transaction ledger, deterministic risk factors, and statutory freeze recommendations."
          action={
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] uppercase tracking-wider text-primary border border-primary/20 bg-primary/10 rounded-full px-2.5 py-1">
                Selected Case Export
              </span>
            </div>
          }
        />
        <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-foreground">
                  Select Investigation Case
                </span>
                <select
                  className={controlClass}
                  value={selectedCase?.id ?? ''}
                  onChange={(e) => setDossierCaseId(e.target.value)}
                  aria-label="Select case to export"
                >
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.id} · {c.title} ({c.status})
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-foreground">
                  Dossier Format
                </span>
                <select
                  className={controlClass}
                  value={dossierFormat}
                  onChange={(e) => setDossierFormat(e.target.value as ReportFormat)}
                  aria-label="Select dossier export format"
                >
                  <option value="markdown">Investigation Brief (.md · Markdown)</option>
                  <option value="json">Structured Evidence Bundle (.json)</option>
                  <option value="csv">Case Transaction Ledger (.csv)</option>
                </select>
              </label>
            </div>

            {selectedCase ? (
              <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-primary">{selectedCase.id}</span>
                    <h3 className="text-sm font-semibold text-foreground mt-0.5">{selectedCase.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={selectedCase.status} />
                    <StatusBadge status={selectedCase.priority} />
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
                  <div>
                    <span className="text-[10px] uppercase text-muted-foreground">Investigator</span>
                    <p className="font-medium text-foreground mt-0.5">{selectedCase.owner}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-muted-foreground">Opened Date</span>
                    <p className="font-medium text-foreground mt-0.5">{formatDateTime(selectedCase.openedAt)}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-muted-foreground">Primary Subject</span>
                    <p className="font-medium text-foreground mt-0.5 truncate">{selectedCaseAccount?.name ?? selectedCase.primaryAccountId}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-muted-foreground">Correlated Value</span>
                    <p className="font-bold text-foreground mt-0.5">{formatCurrency(selectedCaseExposure)}</p>
                  </div>
                </div>

                <div className="mt-3 border-t border-border/60 pt-3">
                  <p className="text-[11px] leading-5 text-muted-foreground">
                    <strong className="text-foreground">Scope: </strong>
                    Includes {selectedCase.transactionIds.length} transaction records, {selectedCase.complaintIds.length} customer complaints, and rule attribution based on deterministic policy v1.4.
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-border/70 bg-muted/30 p-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <FileText className="size-4 text-primary" />
                <span>What's inside this dossier</span>
              </div>
              <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="size-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span>Executive case summary & suspect account profile</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="size-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span>Chronological transaction evidence table in INR</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="size-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span>Explainable deterministic risk scoring breakdown</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="size-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span>Section 91 CrPC notice format for banking debit freeze</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="size-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span>Synthetic data disclaimer & compliance header</span>
                </li>
              </ul>
            </div>

            <Button
              className="mt-6 w-full text-xs font-semibold"
              onClick={handleDownloadDossier}
              disabled={!selectedCase}
            >
              <ArrowDownToLine />Generate & Download Case Dossier ({dossierFormat.toUpperCase()})
            </Button>
          </div>
        </div>
      </Panel>

      {/* Bulk Evidence Packages */}
      <Panel className="mb-5">
        <PanelHeading
          title="Available bulk evidence packages"
          description="Download dataset-wide evidence files in JSON or CSV format."
          action={
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Bulk Format:
              </span>
              <select
                className="h-8 rounded-lg border border-border bg-card px-2.5 text-xs text-foreground outline-none"
                value={bulkFormat}
                onChange={(e) => setBulkFormat(e.target.value as ReportFormat)}
                aria-label="Bulk export format"
              >
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
              </select>
            </div>
          }
        />
        <div className="grid gap-3 p-4 md:grid-cols-2">
          {reportDefinitions.map((report) => {
            const Icon = report.icon
            return (
              <article
                key={report.id}
                className="flex min-h-[200px] flex-col rounded-2xl border border-border/80 bg-card/70 p-5 transition hover:border-primary/30"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="grid size-10 place-items-center rounded-xl bg-primary/8 text-primary">
                    <Icon aria-hidden="true" />
                  </div>
                  <span className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
                    {counts[report.id]} records
                  </span>
                </div>
                <h2 className="mt-4 text-sm font-semibold text-foreground">{report.title}</h2>
                <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{report.description}</p>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
                  <span className="text-[10px] text-muted-foreground">
                    {report.scope} · {bulkFormat.toUpperCase()}
                  </span>
                  <Button size="sm" className="rounded-xl text-xs" onClick={() => handleDownloadBulk(report.id)}>
                    <ArrowDownToLine />Download report
                  </Button>
                </div>
              </article>
            )
          })}
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
        <Panel>
          <PanelHeading
            title="Report contents specification"
            description="The generated file includes the evidence fields required for financial crime reviews."
          />
          <div className="grid gap-3 p-5 sm:grid-cols-2">
            {[
              [
                'Transaction review ledger',
                'Sender & receiver details, IFSC/channel, amount in ₹, timestamp, status, risk score, and triggered rule factor breakdown.',
              ],
              [
                'Mule account risk register',
                'Account institution and type, 0–100 score, velocity explanation, signal list, and referenced transactions.',
              ],
              [
                'Complaint correlation',
                'Complaint summary, correlation score, matched account IDs, and linked transaction records.',
              ],
              [
                'Investigation case dossier',
                'Owner, status, priority, primary account, related complaints, Section 91 CrPC notice format, and supporting transactions.',
              ],
            ].map(([title, description]) => (
              <div key={title} className="rounded-xl border border-border/70 bg-muted/25 p-3.5">
                <h3 className="text-xs font-semibold text-foreground">{title}</h3>
                <p className="mt-1.5 text-[10px] leading-5 text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <PanelHeading title="Data handling & governance" description="Frontend local-only demo behavior" />
          <div className="flex flex-col gap-3 p-5">
            <div className="flex gap-3 rounded-xl border border-primary/10 bg-primary/[0.035] p-3.5">
              <FileJson2 className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
              <p className="text-xs leading-5 text-foreground">
                Reports are generated on-the-fly using browser memory and downloaded directly. No data leaves your machine.
              </p>
            </div>
            <div className="flex gap-3 rounded-xl border border-warning/20 bg-warning/8 p-3.5">
              <ShieldCheck className="mt-0.5 shrink-0 text-warning" aria-hidden="true" />
              <p className="text-xs leading-5 text-foreground">
                All records, names, amounts, and complaints are synthetic demonstration samples. No real bank accounts or NPCI networks are accessed.
              </p>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  )
}
