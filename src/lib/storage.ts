import {
  initialCases,
  initialComplaints,
  initialTransactions,
  type DemoComplaint,
  type DemoTransaction,
  type InvestigationCase,
  type WorkspaceEvent,
} from '@/data/demo'

const STORAGE_KEYS = {
  CASES: 'ciphertrail_cases_v2',
  TRANSACTIONS: 'ciphertrail_transactions_v2',
  COMPLAINTS: 'ciphertrail_complaints_v2',
  EVENTS: 'ciphertrail_events_v2',
} as const

function isClient(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function loadStoredCases(): InvestigationCase[] {
  if (!isClient()) return initialCases
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.CASES)
    if (!raw) return initialCases
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed
    }
  } catch (error) {
    console.warn('Failed to read cases from localStorage, using initial dataset:', error)
  }
  return initialCases
}

export function saveStoredCases(cases: InvestigationCase[]): void {
  if (!isClient()) return
  try {
    window.localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(cases))
  } catch (error) {
    console.warn('Failed to save cases to localStorage:', error)
  }
}

export function loadStoredTransactions(): DemoTransaction[] {
  if (!isClient()) return initialTransactions
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)
    if (!raw) return initialTransactions
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed
    }
  } catch (error) {
    console.warn('Failed to read transactions from localStorage, using initial dataset:', error)
  }
  return initialTransactions
}

export function saveStoredTransactions(transactions: DemoTransaction[]): void {
  if (!isClient()) return
  try {
    window.localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions))
  } catch (error) {
    console.warn('Failed to save transactions to localStorage:', error)
  }
}

export function loadStoredComplaints(): DemoComplaint[] {
  if (!isClient()) return initialComplaints
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.COMPLAINTS)
    if (!raw) return initialComplaints
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed
    }
  } catch (error) {
    console.warn('Failed to read complaints from localStorage, using initial dataset:', error)
  }
  return initialComplaints
}

export function saveStoredComplaints(complaints: DemoComplaint[]): void {
  if (!isClient()) return
  try {
    window.localStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify(complaints))
  } catch (error) {
    console.warn('Failed to save complaints to localStorage:', error)
  }
}

export function loadStoredEvents(): WorkspaceEvent[] {
  const defaultEvent: WorkspaceEvent = {
    id: 'workspace-loaded',
    timestamp: new Date().toISOString(),
    title: 'Demo workspace loaded',
    detail: `${initialTransactions.length} synthetic transaction records are ready for review.`,
    kind: 'system',
    source: 'WORKSPACE',
  }
  if (!isClient()) return [defaultEvent]
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.EVENTS)
    if (!raw) return [defaultEvent]
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed
    }
  } catch (error) {
    console.warn('Failed to read events from localStorage:', error)
  }
  return [defaultEvent]
}

export function saveStoredEvents(events: WorkspaceEvent[]): void {
  if (!isClient()) return
  try {
    window.localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events.slice(0, 16)))
  } catch (error) {
    console.warn('Failed to save events to localStorage:', error)
  }
}

export function clearWorkspaceStorage(): void {
  if (!isClient()) return
  try {
    window.localStorage.removeItem(STORAGE_KEYS.CASES)
    window.localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS)
    window.localStorage.removeItem(STORAGE_KEYS.COMPLAINTS)
    window.localStorage.removeItem(STORAGE_KEYS.EVENTS)
  } catch (error) {
    console.warn('Failed to reset workspace storage:', error)
  }
}

