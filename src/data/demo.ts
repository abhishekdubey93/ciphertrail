export type PageKey =
  | 'overview'
  | 'transactions'
  | 'mules'
  | 'money-trail'
  | 'complaints'
  | 'cases'
  | 'reports'

export type TransactionStatus = 'Flagged' | 'Under review' | 'Cleared'
export type CaseStatus = 'Open' | 'In review' | 'Escalated' | 'Closed'
export type CasePriority = 'Critical' | 'High' | 'Medium' | 'Low'
export type ComplaintStatus = 'New' | 'Reviewed' | 'Linked'

export interface DemoAccount {
  id: string
  name: string
  institution: string
  accountType: string
  riskScore: number
}

export interface DemoTransaction {
  id: string
  timestamp: string
  senderId: string
  senderName: string
  recipientId: string
  recipientName: string
  amount: number
  channel: 'RTGS' | 'NEFT' | 'Card' | 'IMPS'
  status: TransactionStatus
  riskScore: number
  memo: string
  riskExplanation: string
}

export interface MuleProfile {
  accountId: string
  explanation: string
  signals: string[]
  transactionIds: string[]
}

export interface DemoComplaint {
  id: string
  customer: string
  filedAt: string
  incidentType: string
  reportedAmount: number
  summary: string
  correlationScore: number
  linkedTransactionIds: string[]
  matchedAccountIds: string[]
  status: ComplaintStatus
}

export interface InvestigationCase {
  id: string
  title: string
  primaryAccountId: string
  owner: string
  openedAt: string
  status: CaseStatus
  priority: CasePriority
  transactionIds: string[]
  complaintIds: string[]
  summary: string
}

export interface CaseDraft {
  title: string
  primaryAccountId: string
  transactionIds: string[]
  complaintIds: string[]
}

export interface WorkspaceEvent {
  id: string
  timestamp: string
  title: string
  detail: string
  kind: 'system' | 'transaction' | 'case' | 'complaint'
  source: 'WORKSPACE' | 'DEMO FEED'
  transactionId?: string
}

export const accounts: DemoAccount[] = [
  { id: 'A-10482', name: 'Ananya Rao', institution: 'Narmada Bank (Demo)', accountType: 'Personal', riskScore: 28 },
  { id: 'A-89316', name: 'Blue Cedar Consulting India Pvt Ltd', institution: 'Deccan Commercial Bank (Demo)', accountType: 'Business', riskScore: 97 },
  { id: 'A-44721', name: 'Nikhil Deshmukh', institution: 'Western Crest Bank (Demo)', accountType: 'Personal', riskScore: 93 },
  { id: 'A-39104', name: 'Westline Goods India Pvt Ltd', institution: 'Saffron Union Bank (Demo)', accountType: 'Business', riskScore: 88 },
  { id: 'A-20866', name: 'Harbor & Pine Traders', institution: 'Lotus Cooperative Bank (Demo)', accountType: 'Business', riskScore: 22 },
  { id: 'A-77430', name: 'Northstar Studio India Pvt Ltd', institution: 'Meridian Payments Bank (Demo)', accountType: 'Business', riskScore: 74 },
  { id: 'A-55018', name: 'Atlas Digital Works India Pvt Ltd', institution: 'Pinnacle Commercial Bank (Demo)', accountType: 'Business', riskScore: 90 },
]

export const initialTransactions: DemoTransaction[] = [
  {
    id: 'TXN-90218', timestamp: '2026-10-28T05:42:00Z', senderId: 'A-10482', senderName: 'Ananya Rao', recipientId: 'A-89316', recipientName: 'Blue Cedar Consulting India Pvt Ltd', amount: 4850000, channel: 'RTGS', status: 'Flagged', riskScore: 98, memo: 'Vendor settlement', riskExplanation: 'Unusual value and a rapid onward transfer into a high-risk business account.'
  },
  {
    id: 'TXN-90217', timestamp: '2026-10-28T05:31:00Z', senderId: 'A-89316', senderName: 'Blue Cedar Consulting India Pvt Ltd', recipientId: 'A-44721', recipientName: 'Nikhil Deshmukh', amount: 4620000, channel: 'NEFT', status: 'Flagged', riskScore: 96, memo: 'Consulting invoice 184', riskExplanation: 'Funds moved onward within minutes while retaining nearly all of the incoming value.'
  },
  {
    id: 'TXN-90216', timestamp: '2026-10-28T05:15:00Z', senderId: 'A-44721', senderName: 'Nikhil Deshmukh', recipientId: 'A-39104', recipientName: 'Westline Goods India Pvt Ltd', amount: 3990000, channel: 'IMPS', status: 'Flagged', riskScore: 94, memo: 'Inventory purchase', riskExplanation: 'Third hop in a short multi-account transfer chain with limited balance retention.'
  },
  {
    id: 'TXN-90214', timestamp: '2026-10-28T04:54:00Z', senderId: 'A-39104', senderName: 'Westline Goods India Pvt Ltd', recipientId: 'A-55018', recipientName: 'Atlas Digital Works India Pvt Ltd', amount: 3360000, channel: 'NEFT', status: 'Flagged', riskScore: 92, memo: 'Operations transfer', riskExplanation: 'High-value funds were split across multiple counterparties in a compressed time window.'
  },
  {
    id: 'TXN-90211', timestamp: '2026-10-28T04:12:00Z', senderId: 'A-55018', senderName: 'Atlas Digital Works India Pvt Ltd', recipientId: 'A-20866', recipientName: 'Harbor & Pine Traders', amount: 780000, channel: 'RTGS', status: 'Under review', riskScore: 82, memo: 'Service retainer', riskExplanation: 'A lower-value terminal transfer is connected to the same flagged fund-flow cluster.'
  },
  {
    id: 'TXN-90198', timestamp: '2026-10-27T17:48:00Z', senderId: 'A-20866', senderName: 'Harbor & Pine Traders', recipientId: 'A-10482', recipientName: 'Ananya Rao', amount: 125000, channel: 'Card', status: 'Cleared', riskScore: 14, memo: 'Refund', riskExplanation: 'No material risk indicators were identified in this synthetic sample.'
  },
  {
    id: 'TXN-90175', timestamp: '2026-10-27T13:20:00Z', senderId: 'A-10482', senderName: 'Ananya Rao', recipientId: 'A-77430', recipientName: 'Northstar Studio India Pvt Ltd', amount: 1240000, channel: 'RTGS', status: 'Under review', riskScore: 71, memo: 'Creative services', riskExplanation: 'Amount is elevated compared with this account’s sample activity and needs context review.'
  },
  {
    id: 'TXN-90171', timestamp: '2026-10-27T13:02:00Z', senderId: 'A-77430', senderName: 'Northstar Studio India Pvt Ltd', recipientId: 'A-89316', recipientName: 'Blue Cedar Consulting India Pvt Ltd', amount: 1190000, channel: 'NEFT', status: 'Flagged', riskScore: 88, memo: 'Project referral', riskExplanation: 'Funds returned to a high-risk account through a separate entity shortly after receipt.'
  },
  {
    id: 'TXN-90153', timestamp: '2026-10-27T11:14:00Z', senderId: 'A-20866', senderName: 'Harbor & Pine Traders', recipientId: 'A-39104', recipientName: 'Westline Goods India Pvt Ltd', amount: 240000, channel: 'NEFT', status: 'Cleared', riskScore: 32, memo: 'Wholesale supplies', riskExplanation: 'The amount and timing are consistent with the lower-risk sample records.'
  },
  {
    id: 'TXN-90135', timestamp: '2026-10-27T09:07:00Z', senderId: 'A-44721', senderName: 'Nikhil Deshmukh', recipientId: 'A-55018', recipientName: 'Atlas Digital Works India Pvt Ltd', amount: 1920000, channel: 'RTGS', status: 'Flagged', riskScore: 91, memo: 'Equipment deposit', riskExplanation: 'A high-value transfer connects two accounts in the same rapid movement cluster.'
  },
  {
    id: 'TXN-90104', timestamp: '2026-10-26T16:23:00Z', senderId: 'A-77430', senderName: 'Northstar Studio India Pvt Ltd', recipientId: 'A-44721', recipientName: 'Nikhil Deshmukh', amount: 860000, channel: 'NEFT', status: 'Under review', riskScore: 78, memo: 'Production advance', riskExplanation: 'A cross-account transfer overlaps with an account already under elevated review.'
  },
  {
    id: 'TXN-90092', timestamp: '2026-10-26T15:54:00Z', senderId: 'A-55018', senderName: 'Atlas Digital Works India Pvt Ltd', recipientId: 'A-89316', recipientName: 'Blue Cedar Consulting India Pvt Ltd', amount: 575000, channel: 'IMPS', status: 'Flagged', riskScore: 86, memo: 'Invoice adjustment', riskExplanation: 'A repeat payment returns to the same high-risk recipient through a fast channel.'
  },
  {
    id: 'TXN-90073', timestamp: '2026-10-26T14:31:00Z', senderId: 'A-20866', senderName: 'Harbor & Pine Traders', recipientId: 'A-77430', recipientName: 'Northstar Studio India Pvt Ltd', amount: 2100000, channel: 'RTGS', status: 'Under review', riskScore: 73, memo: 'Studio deposit', riskExplanation: 'The value is atypical for the sender’s sample history and overlaps with an active complaint.'
  },
  {
    id: 'TXN-90011', timestamp: '2026-10-25T10:12:00Z', senderId: 'A-39104', senderName: 'Westline Goods India Pvt Ltd', recipientId: 'A-20866', recipientName: 'Harbor & Pine Traders', amount: 95000, channel: 'NEFT', status: 'Cleared', riskScore: 18, memo: 'Supply credit', riskExplanation: 'No material risk indicators were identified in this synthetic sample.'
  },
]

export const muleProfiles: MuleProfile[] = [
  {
    accountId: 'A-89316',
    explanation: 'Blue Cedar Consulting India Pvt Ltd receives large credits and forwards most of the value to linked personal and business accounts with little dwell time.',
    signals: ['Two onward transfers within 30 minutes', '95% of incoming value moved onward', 'Repeated counterparties across flagged records'],
    transactionIds: ['TXN-90218', 'TXN-90217', 'TXN-90171', 'TXN-90092'],
  },
  {
    accountId: 'A-44721',
    explanation: 'Nikhil Deshmukh appears in the middle of several fast-moving flows and sends funds to multiple high-risk entities.',
    signals: ['Multi-hop relay behavior', 'High-risk counterparties on both sides', 'Several transfers clustered within one business day'],
    transactionIds: ['TXN-90217', 'TXN-90216', 'TXN-90135', 'TXN-90104'],
  },
  {
    accountId: 'A-55018',
    explanation: 'Atlas Digital Works India Pvt Ltd receives funds from a flagged account and makes repeat outbound transfers through high-velocity channels.',
    signals: ['Repeat payments to a shared recipient', 'Cross-channel movement (RTGS and IMPS)', 'Limited separation between incoming and outgoing activity'],
    transactionIds: ['TXN-90214', 'TXN-90211', 'TXN-90135', 'TXN-90092'],
  },
  {
    accountId: 'A-39104',
    explanation: 'Westline Goods India Pvt Ltd sits on a connected path between personal accounts and higher-risk business entities.',
    signals: ['Repeated adjacency to flagged accounts', 'Material value passed to a new counterparty', 'Observed in a four-account transfer chain'],
    transactionIds: ['TXN-90216', 'TXN-90214', 'TXN-90153', 'TXN-90011'],
  },
]

export const initialComplaints: DemoComplaint[] = [
  {
    id: 'CMP-3381', customer: 'Meera Shah', filedAt: '2026-10-28T06:06:00Z', incidentType: 'Authorized push payment', reportedAmount: 4850000,
    summary: 'Customer reports being directed to send funds to a new consulting vendor after a supplier email change.', correlationScore: 96,
    linkedTransactionIds: ['TXN-90218', 'TXN-90217'], matchedAccountIds: ['A-89316', 'A-44721'], status: 'New'
  },
  {
    id: 'CMP-3380', customer: 'Rahul Iyer', filedAt: '2026-10-28T04:47:00Z', incidentType: 'Account takeover', reportedAmount: 1240000,
    summary: 'Customer disputes a first-time RTGS payment after an unrecognized session and recent contact-detail change.', correlationScore: 82,
    linkedTransactionIds: ['TXN-90175', 'TXN-90171'], matchedAccountIds: ['A-77430', 'A-89316'], status: 'Reviewed'
  },
  {
    id: 'CMP-3374', customer: 'Priya Nair', filedAt: '2026-10-27T15:19:00Z', incidentType: 'Payment redirection', reportedAmount: 2100000,
    summary: 'A deposit request arrived through a newly provided account number and does not match prior correspondence.', correlationScore: 74,
    linkedTransactionIds: ['TXN-90073', 'TXN-90104'], matchedAccountIds: ['A-77430', 'A-44721'], status: 'New'
  },
  {
    id: 'CMP-3368', customer: 'Aditya Bose', filedAt: '2026-10-26T12:11:00Z', incidentType: 'Card dispute', reportedAmount: 125000,
    summary: 'Customer reports an unfamiliar card refund entry; the sample record was previously cleared.', correlationScore: 32,
    linkedTransactionIds: ['TXN-90198'], matchedAccountIds: ['A-20866', 'A-10482'], status: 'Linked'
  },
]

export const initialCases: InvestigationCase[] = [
  {
    id: 'CASE-2481', title: 'Rapid relay from payroll account', primaryAccountId: 'A-89316', owner: 'Rhea Kapur', openedAt: '2026-10-28T05:54:00Z',
    status: 'Escalated', priority: 'Critical', transactionIds: ['TXN-90218', 'TXN-90217', 'TXN-90171'], complaintIds: ['CMP-3381'],
    summary: 'Review a high-value credit followed by multiple rapid onward transfers.'
  },
  {
    id: 'CASE-2480', title: 'Layered transfer cluster review', primaryAccountId: 'A-44721', owner: 'Neha Rao', openedAt: '2026-10-28T04:38:00Z',
    status: 'In review', priority: 'High', transactionIds: ['TXN-90217', 'TXN-90216', 'TXN-90135'], complaintIds: [],
    summary: 'Map counterparties and timing across a connected four-account fund flow.'
  },
  {
    id: 'CASE-2476', title: 'Digital services corridor', primaryAccountId: 'A-55018', owner: 'Samira Patel', openedAt: '2026-10-27T14:26:00Z',
    status: 'Open', priority: 'High', transactionIds: ['TXN-90214', 'TXN-90211', 'TXN-90092'], complaintIds: [],
    summary: 'Assess repeated payments between Atlas Digital Works India Pvt Ltd and flagged counterparties.'
  },
  {
    id: 'CASE-2469', title: 'Customer dispute and refund trace', primaryAccountId: 'A-20866', owner: 'Neha Rao', openedAt: '2026-10-26T12:35:00Z',
    status: 'Closed', priority: 'Low', transactionIds: ['TXN-90198'], complaintIds: ['CMP-3368'],
    summary: 'Document the cleared refund and close the customer dispute review.'
  },
]

export const trendSeries = {
  '7d': {
    labels: ['Oct 22', 'Oct 23', 'Oct 24', 'Oct 25', 'Oct 26', 'Oct 27', 'Oct 28'],
    values: [7, 11, 8, 14, 12, 18, 15],
  },
  '30d': {
    labels: ['Oct 1', 'Oct 5', 'Oct 9', 'Oct 13', 'Oct 17', 'Oct 21', 'Oct 25', 'Oct 28'],
    values: [9, 13, 11, 17, 14, 19, 16, 22],
  },
} as const
