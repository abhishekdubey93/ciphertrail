import type { DemoAccount, DemoComplaint, DemoTransaction } from '@/data/demo'

export interface RiskFactor {
  ruleId: string
  ruleName: string
  category: 'Value' | 'Velocity' | 'Counterparty' | 'Channel' | 'Complaint' | 'Structuring'
  points: number
  triggered: boolean
  description: string
}

export interface RiskEvaluation {
  score: number
  band: 'High' | 'Elevated' | 'Low'
  factors: RiskFactor[]
  triggeredFactors: RiskFactor[]
  summaryExplanation: string
  methodologyNotice: string
}

/**
 * Deterministic rule definitions for financial crime risk scoring.
 * CipherTrail uses transparent, explainable rule weights.
 * NO machine learning or opaque black-box models are used.
 */
export function evaluateTransactionRisk(
  transaction: Pick<DemoTransaction, 'id' | 'amount' | 'channel' | 'senderId' | 'recipientId' | 'timestamp' | 'memo'>,
  allTransactions: DemoTransaction[],
  allAccounts: DemoAccount[],
  allComplaints: DemoComplaint[] = []
): RiskEvaluation {
  const factors: RiskFactor[] = []
  let totalScore = 5 // Baseline network friction score

  const senderAccount = allAccounts.find((a) => a.id === transaction.senderId)
  const recipientAccount = allAccounts.find((a) => a.id === transaction.recipientId)

  // 1. High-Value Exposure Rule
  if (transaction.amount >= 2500000) {
    factors.push({
      ruleId: 'RULE-VAL-01',
      ruleName: 'High-Value RTGS Threshold Exceeded',
      category: 'Value',
      points: 30,
      triggered: true,
      description: `Transfer amount of ₹${(transaction.amount / 100000).toFixed(2)}L exceeds the ₹25L high-priority monitoring threshold.`,
    })
    totalScore += 30
  } else if (transaction.amount >= 1000000) {
    factors.push({
      ruleId: 'RULE-VAL-02',
      ruleName: 'Elevated Commercial Value',
      category: 'Value',
      points: 20,
      triggered: true,
      description: `Transfer amount of ₹${(transaction.amount / 100000).toFixed(2)}L exceeds the ₹10L elevated monitoring threshold.`,
    })
    totalScore += 20
  } else if (transaction.amount >= 500000) {
    factors.push({
      ruleId: 'RULE-VAL-03',
      ruleName: 'Moderate High-Ticket Transfer',
      category: 'Value',
      points: 10,
      triggered: true,
      description: `Transfer amount of ₹${(transaction.amount / 100000).toFixed(2)}L requires baseline verification.`,
    })
    totalScore += 10
  }

  // 2. Rapid Relay / Pass-Through Velocity Rule
  // Checks if sender received funds shortly before (within 2 hours) or recipient sent funds shortly after
  const txnTime = new Date(transaction.timestamp).getTime()
  const recentInflow = allTransactions.find((other) => {
    if (other.id === transaction.id) return false
    if (other.recipientId !== transaction.senderId) return false
    const otherTime = new Date(other.timestamp).getTime()
    const diffMinutes = (txnTime - otherTime) / (1000 * 60)
    return diffMinutes >= 0 && diffMinutes <= 120 && other.amount >= transaction.amount * 0.7
  })

  const recentOutflow = allTransactions.find((other) => {
    if (other.id === transaction.id) return false
    if (other.senderId === transaction.recipientId) return false
    const otherTime = new Date(other.timestamp).getTime()
    const diffMinutes = (otherTime - txnTime) / (1000 * 60)
    return diffMinutes >= 0 && diffMinutes <= 120 && other.amount >= transaction.amount * 0.7
  })

  if (recentInflow || recentOutflow) {
    const relayDetail = recentInflow
      ? `Sender received funds via ${recentInflow.id} and forwarded funds with limited dwell time.`
      : `Recipient disbursed incoming funds within minutes via connected transfers.`
    factors.push({
      ruleId: 'RULE-VEL-01',
      ruleName: 'Rapid Relay & Pass-Through Velocity',
      category: 'Velocity',
      points: 25,
      triggered: true,
      description: `${relayDetail} Classic layering/mule relay behavior pattern.`,
    })
    totalScore += 25
  }

  // 3. Flagged / High-Risk Counterparty Adjacency
  const senderRisk = senderAccount?.riskScore ?? 0
  const recipientRisk = recipientAccount?.riskScore ?? 0
  const maxCounterpartyRisk = Math.max(senderRisk, recipientRisk)

  if (maxCounterpartyRisk >= 85) {
    const flaggedAccountName = senderRisk >= 85 ? senderAccount?.name : recipientAccount?.name
    const flaggedAccountId = senderRisk >= 85 ? transaction.senderId : transaction.recipientId
    factors.push({
      ruleId: 'RULE-CPTY-01',
      ruleName: 'Direct High-Risk Counterparty Adjacency',
      category: 'Counterparty',
      points: 25,
      triggered: true,
      description: `Counterparty ${flaggedAccountName} (${flaggedAccountId}) has an elevated composite risk score of ${maxCounterpartyRisk}/100.`,
    })
    totalScore += 25
  } else if (maxCounterpartyRisk >= 60) {
    factors.push({
      ruleId: 'RULE-CPTY-02',
      ruleName: 'Elevated Counterparty Risk',
      category: 'Counterparty',
      points: 12,
      triggered: true,
      description: `Counterparty account is in the elevated review band (${maxCounterpartyRisk}/100).`,
    })
    totalScore += 12
  }

  // 4. Fast Settlement Channel on High Value
  if ((transaction.channel === 'RTGS' || transaction.channel === 'IMPS') && transaction.amount >= 500000) {
    factors.push({
      ruleId: 'RULE-CHAN-01',
      ruleName: 'Irreversible High-Velocity Rail',
      category: 'Channel',
      points: 10,
      triggered: true,
      description: `Payment routed via ${transaction.channel} provides instant gross settlement with zero recall window.`,
    })
    totalScore += 10
  }

  // 5. Linked Customer Dispute / Complaint Correlation
  const linkedComplaint = allComplaints.find((c) =>
    c.linkedTransactionIds.includes(transaction.id) ||
    (c.matchedAccountIds.includes(transaction.senderId) && c.matchedAccountIds.includes(transaction.recipientId))
  )

  if (linkedComplaint) {
    factors.push({
      ruleId: 'RULE-CMP-01',
      ruleName: 'Active Customer Dispute Correlation',
      category: 'Complaint',
      points: 30,
      triggered: true,
      description: `Transaction is linked to customer dispute ${linkedComplaint.id} (${linkedComplaint.incidentType}) filed by ${linkedComplaint.customer}.`,
    })
    totalScore += 30
  }

  // 6. Round Sum / Structuring Indicator
  if (transaction.amount >= 100000 && transaction.amount % 50000 === 0) {
    factors.push({
      ruleId: 'RULE-STR-01',
      ruleName: 'Round-Sum Amount Characteristic',
      category: 'Structuring',
      points: 5,
      triggered: true,
      description: `Transfer amount is an exact round sum (multiple of ₹50,000), typical in orchestrated transfers.`,
    })
    totalScore += 5
  }

  // Normalize final score to 0 - 100
  const finalScore = Math.min(Math.max(totalScore, 5), 99)
  const band: 'High' | 'Elevated' | 'Low' = finalScore >= 85 ? 'High' : finalScore >= 60 ? 'Elevated' : 'Low'

  const triggeredFactors = factors.filter((f) => f.triggered)
  const summaryExplanation = triggeredFactors.length > 0
    ? triggeredFactors.map((f) => f.description).join(' ')
    : 'No critical risk rules triggered; transfer metrics match baseline parameters.'

  return {
    score: finalScore,
    band,
    factors,
    triggeredFactors,
    summaryExplanation,
    methodologyNotice: 'Scored using CipherTrail deterministic rule engine (policy v1.4). No AI/ML model inference.',
  }
}

