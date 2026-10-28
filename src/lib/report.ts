import type { DemoAccount, DemoComplaint, DemoTransaction, InvestigationCase, MuleProfile } from '@/data/demo'
import { escapeCsv, formatCurrency, formatDateTime } from '@/lib/format'
import { evaluateTransactionRisk } from '@/lib/riskEngine'

export type ReportId =
  | 'transaction-ledger'
  | 'mule-register'
  | 'complaint-correlation'
  | 'case-evidence'
  | 'case-dossier'
  | 'selected-transactions'

export type ReportFormat = 'json' | 'csv' | 'markdown'

export interface ReportContext {
  transactions: DemoTransaction[]
  mules: MuleProfile[]
  complaints: DemoComplaint[]
  cases: InvestigationCase[]
  accounts: DemoAccount[]
  selectedCaseId?: string
  selectedTransactionIds?: string[]
}

const accountName = (id: string, allAccounts: DemoAccount[]) =>
  allAccounts.find((account) => account.id === id)?.name ?? id

export function generateCaseDossierMarkdown(
  investigationCase: InvestigationCase,
  context: ReportContext
): string {
  const account = context.accounts.find((a) => a.id === investigationCase.primaryAccountId)
  const caseTransactions = context.transactions.filter((t) =>
    investigationCase.transactionIds.includes(t.id)
  )
  const totalAmount = caseTransactions.reduce((sum, t) => sum + t.amount, 0)
  const linkedComplaints = context.complaints.filter((c) =>
    investigationCase.complaintIds.includes(c.id)
  )

  const timestamp = new Date().toISOString()

  let md = `# CIPHERTRAIL FINANCIAL CRIME INVESTIGATION DOSSIER
**Notice: SYNTHETIC DEMO DATA ONLY · NO REAL BANK INTEGRATION**
**Generated:** ${formatDateTime(timestamp)} IST
**Case Reference:** ${investigationCase.id}
--------------------------------------------------------------------------------

## 1. CASE PROFILE & SUMMARY
- **Case Title:** ${investigationCase.title}
- **Status:** ${investigationCase.status.toUpperCase()}
- **Priority:** ${investigationCase.priority.toUpperCase()}
- **Investigator / Case Officer:** ${investigationCase.owner}
- **Opened At:** ${formatDateTime(investigationCase.openedAt)}
- **Case Summary:** ${investigationCase.summary}

## 2. SUBJECT OF INQUIRY
- **Account Identifier:** ${investigationCase.primaryAccountId}
- **Entity / Account Name:** ${account?.name ?? 'Unknown'}
- **Institution:** ${account?.institution ?? 'Deccan Commercial Bank (Demo)'}
- **Account Category:** ${account?.accountType ?? 'Business'}
- **Composite Risk Rating:** ${account?.riskScore ?? 85}/100

## 3. FINANCIAL EXPOSURE & TRANSACTION EVIDENCE
- **Total Correlated Value:** ${formatCurrency(totalAmount)} (INR)
- **Total Supporting Records:** ${caseTransactions.length}

| Transaction ID | Timestamp (IST) | Channel | From Account | To Account | Amount (INR) | Risk Score | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
`

  for (const txn of caseTransactions) {
    const riskEval = evaluateTransactionRisk(txn, context.transactions, context.accounts, context.complaints)
    md += `| ${txn.id} | ${formatDateTime(txn.timestamp)} | ${txn.channel} | ${txn.senderName} (${txn.senderId}) | ${txn.recipientName} (${txn.recipientId}) | ${formatCurrency(txn.amount)} | ${riskEval.score}/100 | ${txn.status} |\n`
  }

  md += `\n## 4. DETERMINISTIC RISK RULES TRIGGERED (NO AI/ML MODEL)\n`
  for (const txn of caseTransactions) {
    const riskEval = evaluateTransactionRisk(txn, context.transactions, context.accounts, context.complaints)
    md += `\n### Record ${txn.id} (Score: ${riskEval.score}/100 - ${riskEval.band})\n`
    for (const factor of riskEval.triggeredFactors) {
      md += `- **[${factor.category}] ${factor.ruleName} (+${factor.points} pts):** ${factor.description}\n`
    }
  }

  if (linkedComplaints.length > 0) {
    md += `\n## 5. LINKED CUSTOMER COMPLAINTS / CYBER INCIDENT REPORTS\n`
    for (const cmp of linkedComplaints) {
      md += `- **${cmp.id} (${cmp.incidentType}):** Filed by ${cmp.customer} on ${formatDateTime(cmp.filedAt)}. Stated Loss: ${formatCurrency(cmp.reportedAmount)}. Correlation Score: ${cmp.correlationScore}/100.\n  *Summary:* ${cmp.summary}\n`
    }
  }

  md += `\n## 6. PRELIMINARY INVESTIGATION RECOMMENDATIONS
- Request immediate temporary debit freeze / lien on suspect account ${investigationCase.primaryAccountId} per Section 91 CrPC guidelines.
- Issue requisition for complete KYC dossier, device IP logs, and linked beneficiary list.
- Cross-correlate beneficiary counterparties for potential multi-tier mule relay infrastructure.

--------------------------------------------------------------------------------
*Disclaimer: All entities, transaction IDs, timestamps, and customer complaints in this dossier are synthetic demonstration records generated locally for the CipherTrail project. No actual banking data or real-time payment network is involved.*
`
  return md
}

export function createReportData(reportId: ReportId, context: ReportContext) {
  const generatedAt = new Date().toISOString()
  const transactionById = new Map(context.transactions.map((transaction) => [transaction.id, transaction]))

  if (reportId === 'case-dossier') {
    const targetCase =
      context.cases.find((c) => c.id === context.selectedCaseId) ?? context.cases[0]
    if (!targetCase) {
      throw new Error('No case available to generate dossier')
    }
    const supportingTxns = targetCase.transactionIds.map((id) => transactionById.get(id)).filter(Boolean)
    const linkedComplaints = context.complaints.filter((c) => targetCase.complaintIds.includes(c.id))
    const totalExposure = supportingTxns.reduce((sum, t) => sum + (t?.amount ?? 0), 0)

    return {
      reportId,
      reportName: `Investigation Case Dossier · ${targetCase.id}`,
      generatedAt,
      currency: 'INR',
      dataNotice: 'Synthetic demo data only. Deterministic rule scoring. No banking APIs connected.',
      recordCount: supportingTxns.length,
      caseDetails: {
        ...targetCase,
        primaryAccountName: accountName(targetCase.primaryAccountId, context.accounts),
        totalExposureInr: totalExposure,
      },
      supportingTransactions: supportingTxns.map((txn) => {
        if (!txn) return null
        const riskEval = evaluateTransactionRisk(txn, context.transactions, context.accounts, context.complaints)
        return {
          ...txn,
          evaluatedRiskScore: riskEval.score,
          riskBand: riskEval.band,
          triggeredRules: riskEval.triggeredFactors,
        }
      }),
      linkedComplaints,
    }
  }

  if (reportId === 'selected-transactions') {
    const selectedIds = new Set(context.selectedTransactionIds ?? [])
    const selectedList = context.transactions.filter((t) => selectedIds.has(t.id))
    return {
      reportId,
      reportName: 'Selected Transaction Evidence Ledger',
      generatedAt,
      currency: 'INR',
      dataNotice: 'Synthetic demo data only. Deterministic rule scoring.',
      recordCount: selectedList.length,
      records: selectedList.map((txn) => {
        const riskEval = evaluateTransactionRisk(txn, context.transactions, context.accounts, context.complaints)
        return {
          ...txn,
          senderName: accountName(txn.senderId, context.accounts),
          recipientName: accountName(txn.recipientId, context.accounts),
          evaluatedRiskScore: riskEval.score,
          riskBand: riskEval.band,
          triggeredRules: riskEval.triggeredFactors.map((f) => `[+${f.points}] ${f.ruleName}: ${f.description}`),
        }
      }),
    }
  }

  const reportContents = {
    'transaction-ledger': {
      title: 'Transaction review ledger',
      records: context.transactions.map((transaction) => {
        const riskEval = evaluateTransactionRisk(transaction, context.transactions, context.accounts, context.complaints)
        return {
          ...transaction,
          sender: accountName(transaction.senderId, context.accounts),
          recipient: accountName(transaction.recipientId, context.accounts),
          evaluatedRiskScore: riskEval.score,
          riskBand: riskEval.band,
          riskFactors: riskEval.triggeredFactors.map((f) => `[+${f.points}] ${f.ruleName}`).join('; '),
        }
      }),
    },
    'mule-register': {
      title: 'Mule account risk register',
      records: context.mules.map((profile) => ({
        ...profile,
        account: context.accounts.find((account) => account.id === profile.accountId) ?? null,
        supportingTransactions: profile.transactionIds.map((id) => transactionById.get(id)).filter(Boolean),
      })),
    },
    'complaint-correlation': {
      title: 'Complaint correlation report',
      records: context.complaints.map((complaint) => ({
        ...complaint,
        matchedAccounts: complaint.matchedAccountIds.map((id) => ({ id, name: accountName(id, context.accounts) })),
        supportingTransactions: complaint.linkedTransactionIds.map((id) => transactionById.get(id)).filter(Boolean),
      })),
    },
    'case-evidence': {
      title: 'Investigation case evidence bundle',
      records: context.cases.map((investigationCase) => ({
        ...investigationCase,
        primaryAccountName: accountName(investigationCase.primaryAccountId, context.accounts),
        transactions: investigationCase.transactionIds.map((id) => transactionById.get(id)).filter(Boolean),
        complaints: context.complaints.filter((complaint) => investigationCase.complaintIds.includes(complaint.id)),
      })),
    },
  } satisfies Record<string, { title: string; records: unknown[] }>

  return {
    reportId,
    reportName: reportContents[reportId as keyof typeof reportContents]?.title ?? 'Evidence Report',
    generatedAt,
    currency: 'INR',
    dataNotice: 'Synthetic demo data only. This report is generated in the browser and is not an official financial record.',
    recordCount: reportContents[reportId as keyof typeof reportContents]?.records?.length ?? 0,
    records: reportContents[reportId as keyof typeof reportContents]?.records ?? [],
  }
}

function recordsForCsv(reportId: ReportId, context: ReportContext): Record<string, unknown>[] {
  if (reportId === 'case-dossier') {
    const targetCase =
      context.cases.find((c) => c.id === context.selectedCaseId) ?? context.cases[0]
    if (!targetCase) return []
    const supportingTxns = context.transactions.filter((t) => targetCase.transactionIds.includes(t.id))
    return supportingTxns.map((txn) => {
      const riskEval = evaluateTransactionRisk(txn, context.transactions, context.accounts, context.complaints)
      return {
        caseId: targetCase.id,
        caseTitle: targetCase.title,
        caseStatus: targetCase.status,
        casePriority: targetCase.priority,
        primaryAccountId: targetCase.primaryAccountId,
        transactionId: txn.id,
        timestamp: txn.timestamp,
        channel: txn.channel,
        sender: `${txn.senderName} (${txn.senderId})`,
        recipient: `${txn.recipientName} (${txn.recipientId})`,
        amountInr: txn.amount,
        riskScore: riskEval.score,
        riskBand: riskEval.band,
        riskRulesTriggered: riskEval.triggeredFactors.map((f) => `+${f.points} ${f.ruleName}`).join(' | '),
      }
    })
  }

  if (reportId === 'selected-transactions') {
    const selectedIds = new Set(context.selectedTransactionIds ?? [])
    const selectedList = context.transactions.filter((t) => selectedIds.has(t.id))
    return selectedList.map((txn) => {
      const riskEval = evaluateTransactionRisk(txn, context.transactions, context.accounts, context.complaints)
      return {
        transactionId: txn.id,
        timestamp: txn.timestamp,
        senderId: txn.senderId,
        senderName: txn.senderName,
        recipientId: txn.recipientId,
        recipientName: txn.recipientName,
        amountInr: txn.amount,
        channel: txn.channel,
        status: txn.status,
        riskScore: riskEval.score,
        riskBand: riskEval.band,
        riskRules: riskEval.triggeredFactors.map((f) => `+${f.points} ${f.ruleName}`).join(' | '),
        memo: txn.memo,
      }
    })
  }

  if (reportId === 'transaction-ledger') {
    return context.transactions.map((transaction) => {
      const riskEval = evaluateTransactionRisk(transaction, context.transactions, context.accounts, context.complaints)
      return {
        transactionId: transaction.id,
        timestamp: transaction.timestamp,
        senderId: transaction.senderId,
        senderName: transaction.senderName,
        recipientId: transaction.recipientId,
        recipientName: transaction.recipientName,
        amountInr: transaction.amount,
        channel: transaction.channel,
        status: transaction.status,
        riskScore: riskEval.score,
        riskBand: riskEval.band,
        memo: transaction.memo,
        riskExplanation: riskEval.summaryExplanation,
      }
    })
  }

  if (reportId === 'mule-register') {
    return context.mules.map((profile) => {
      const account = context.accounts.find((item) => item.id === profile.accountId)
      return {
        accountId: profile.accountId,
        accountName: account?.name ?? profile.accountId,
        institution: account?.institution ?? '',
        riskScore: account?.riskScore ?? '',
        explanation: profile.explanation,
        signals: profile.signals.join(' | '),
        supportingTransactionIds: profile.transactionIds.join(' | '),
      }
    })
  }

  if (reportId === 'complaint-correlation') {
    return context.complaints.map((complaint) => ({
      complaintId: complaint.id,
      customer: complaint.customer,
      filedAt: complaint.filedAt,
      incidentType: complaint.incidentType,
      reportedAmountInr: complaint.reportedAmount,
      correlationScore: complaint.correlationScore,
      status: complaint.status,
      matchedAccountIds: complaint.matchedAccountIds.join(' | '),
      linkedTransactionIds: complaint.linkedTransactionIds.join(' | '),
      summary: complaint.summary,
    }))
  }

  return context.cases.map((investigationCase) => ({
    caseId: investigationCase.id,
    title: investigationCase.title,
    primaryAccountId: investigationCase.primaryAccountId,
    primaryAccountName: accountName(investigationCase.primaryAccountId, context.accounts),
    owner: investigationCase.owner,
    openedAt: investigationCase.openedAt,
    status: investigationCase.status,
    priority: investigationCase.priority,
    transactionIds: investigationCase.transactionIds.join(' | '),
    complaintIds: investigationCase.complaintIds.join(' | '),
    summary: investigationCase.summary,
  }))
}

export function downloadReport(
  reportId: ReportId,
  format: ReportFormat,
  context: ReportContext
): string {
  let content: string
  let mimeType: string
  let extension: string = format

  if (format === 'markdown') {
    if (reportId === 'case-dossier') {
      const targetCase =
        context.cases.find((c) => c.id === context.selectedCaseId) ?? context.cases[0]
      if (!targetCase) throw new Error('No case available to generate dossier')
      content = generateCaseDossierMarkdown(targetCase, context)
      mimeType = 'text/markdown;charset=utf-8'
      extension = 'md'
    } else {
      // Fallback for general markdown report
      const report = createReportData(reportId, context)
      content = `# ${report.reportName}\n\nNotice: ${report.dataNotice}\nGenerated: ${report.generatedAt}\nRecord count: ${report.recordCount}\n\n` +
        '```json\n' + JSON.stringify(report, null, 2) + '\n```'
      mimeType = 'text/markdown;charset=utf-8'
      extension = 'md'
    }
  } else if (format === 'json') {
    const report = createReportData(reportId, context)
    content = JSON.stringify(report, null, 2)
    mimeType = 'application/json;charset=utf-8'
  } else {
    const records = recordsForCsv(reportId, context)
    const headers = records.length > 0 ? Object.keys(records[0]) : ['recordCount']
    const rows = records.map((record) =>
      headers.map((header) => escapeCsv(record[header])).join(',')
    )
    content = [headers.map(escapeCsv).join(','), ...rows].join('\r\n')
    mimeType = 'text/csv;charset=utf-8'
  }

  const fileSuffix = reportId === 'case-dossier' && context.selectedCaseId ? context.selectedCaseId.toLowerCase() : reportId
  const fileName = `ciphertrail-${fileSuffix}-${new Date().toISOString().slice(0, 10)}.${extension}`
  const file = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(file)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  return fileName
}
