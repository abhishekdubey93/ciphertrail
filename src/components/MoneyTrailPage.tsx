import { useMemo, useState } from 'react'
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  ExternalLink,
  Layers,
  Network,
  RotateCcw,
  Scale,
  ShieldAlert,
  Sparkles,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  EmptyState,
  PageHeader,
  Panel,
  PanelHeading,
  RiskMeter,
  StatusBadge,
  controlClass,
} from '@/components/Common'
import type { DemoAccount, DemoTransaction, MuleProfile } from '@/data/demo'
import { formatCurrency, formatDateTime } from '@/lib/format'
import { evaluateTransactionRisk } from '@/lib/riskEngine'

type FlowDirection = 'both' | 'out' | 'in'
type GraphEdge = DemoTransaction

const staticPositions: Record<string, { x: number; y: number }> = {
  'A-10482': { x: 388, y: 205 },
  'A-89316': { x: 552, y: 98 },
  'A-44721': { x: 558, y: 306 },
  'A-39104': { x: 218, y: 306 },
  'A-20866': { x: 218, y: 98 },
  'A-77430': { x: 388, y: 370 },
  'A-55018': { x: 80, y: 205 },
}

function getNodePosition(accountId: string, allAccounts: DemoAccount[]): { x: number; y: number } {
  if (staticPositions[accountId]) return staticPositions[accountId]
  const index = allAccounts.findIndex((a) => a.id === accountId)
  const total = Math.max(allAccounts.length, 1)
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2
  return {
    x: Math.round(380 + 250 * Math.cos(angle)),
    y: Math.round(215 + 140 * Math.sin(angle)),
  }
}

function buildTrail(
  transactions: DemoTransaction[],
  selectedAccountId: string,
  direction: FlowDirection,
  depth: number
) {
  const reached = new Set([selectedAccountId])
  const edgeIds = new Set<string>()
  const edges: GraphEdge[] = []

  for (let hop = 0; hop < depth; hop += 1) {
    const currentLayer = new Set(reached)
    const nextLayer = new Set<string>()
    for (const transaction of transactions) {
      if (edgeIds.has(transaction.id)) continue
      const touchesLayer =
        direction === 'out'
          ? currentLayer.has(transaction.senderId)
          : direction === 'in'
            ? currentLayer.has(transaction.recipientId)
            : currentLayer.has(transaction.senderId) || currentLayer.has(transaction.recipientId)
      if (!touchesLayer) continue
      edgeIds.add(transaction.id)
      edges.push(transaction)
      if (direction === 'out') nextLayer.add(transaction.recipientId)
      else if (direction === 'in') nextLayer.add(transaction.senderId)
      else {
        if (currentLayer.has(transaction.senderId)) nextLayer.add(transaction.recipientId)
        if (currentLayer.has(transaction.recipientId)) nextLayer.add(transaction.senderId)
      }
    }
    nextLayer.forEach((accountId) => reached.add(accountId))
  }

  const visibleAccountIds = new Set<string>([selectedAccountId])
  edges.forEach((edge) => {
    visibleAccountIds.add(edge.senderId)
    visibleAccountIds.add(edge.recipientId)
  })
  return { edges, visibleAccountIds }
}

function NetworkGraph({
  accounts,
  edges,
  visibleAccountIds,
  selectedAccountId,
  selectedTransactionId,
  onSelectAccount,
  onSelectTransaction,
}: {
  accounts: DemoAccount[]
  edges: GraphEdge[]
  visibleAccountIds: Set<string>
  selectedAccountId: string
  selectedTransactionId: string | null
  onSelectAccount: (id: string) => void
  onSelectTransaction: (id: string) => void
}) {
  const visibleAccounts = accounts.filter((account) => visibleAccountIds.has(account.id))
  const keyAccountNames = new Map(accounts.map((account) => [account.id, account.name]))

  const handleNodeKeyDown = (event: React.KeyboardEvent<SVGGElement>, accountId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelectAccount(accountId)
    }
  }

  const handleEdgeKeyDown = (event: React.KeyboardEvent<SVGGElement>, transactionId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelectTransaction(transactionId)
    }
  }

  return (
    <div className="network-scroll">
      <svg
        viewBox="0 0 760 430"
        role="img"
        aria-label="Interactive synthetic money trail network. Select any node or transfer edge to inspect connected flows."
        className="h-[400px] min-w-[700px] w-full"
      >
        <defs>
          <marker
            id="trail-arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--chart-1)" />
          </marker>
          <marker
            id="trail-arrow-active"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--primary)" />
          </marker>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Transfer Edges */}
        <g aria-label="Transfer connections">
          {edges.map((edge) => {
            const from = getNodePosition(edge.senderId, accounts)
            const to = getNodePosition(edge.recipientId, accounts)
            if (!from || !to) return null
            const dx = to.x - from.x
            const dy = to.y - from.y
            const length = Math.max(Math.sqrt(dx * dx + dy * dy), 1)
            const startX = from.x + (dx / length) * 26
            const startY = from.y + (dy / length) * 26
            const endX = to.x - (dx / length) * 30
            const endY = to.y - (dy / length) * 30
            const midX = (startX + endX) / 2
            const midY = (startY + endY) / 2
            const isEdgeActive = edge.id === selectedTransactionId

            const riskColor =
              edge.riskScore >= 85
                ? 'var(--destructive)'
                : edge.riskScore >= 60
                  ? 'var(--warning)'
                  : 'var(--chart-1)'

            return (
              <g
                key={edge.id}
                role="button"
                tabIndex={0}
                aria-label={`Select transfer ${edge.id}, amount ${formatCurrency(edge.amount)}, risk ${edge.riskScore}`}
                aria-pressed={isEdgeActive}
                onClick={() => onSelectTransaction(edge.id)}
                onKeyDown={(event) => handleEdgeKeyDown(event, edge.id)}
                className="cursor-pointer outline-none transition group"
              >
                {/* Hit area */}
                <line x1={startX} y1={startY} x2={endX} y2={endY} stroke="transparent" strokeWidth="22" />

                {/* Glowing aura if active */}
                {isEdgeActive ? (
                  <line
                    x1={startX}
                    y1={startY}
                    x2={endX}
                    y2={endY}
                    stroke="var(--primary)"
                    strokeWidth="6"
                    strokeOpacity="0.4"
                    filter="url(#glow)"
                  />
                ) : null}

                {/* Transfer line */}
                <line
                  x1={startX}
                  y1={startY}
                  x2={endX}
                  y2={endY}
                  stroke={isEdgeActive ? 'var(--primary)' : riskColor}
                  strokeWidth={isEdgeActive ? 3.5 : edge.riskScore >= 85 ? 2.5 : 1.7}
                  strokeOpacity={isEdgeActive ? 1 : 0.72}
                  strokeDasharray={isEdgeActive ? '5 3' : undefined}
                  markerEnd={isEdgeActive ? 'url(#trail-arrow-active)' : 'url(#trail-arrow)'}
                />

                {/* Transfer Amount Pill */}
                <rect
                  x={midX - 32}
                  y={midY - 10}
                  width="64"
                  height="20"
                  rx="10"
                  fill="var(--card)"
                  stroke={isEdgeActive ? 'var(--primary)' : 'var(--border)'}
                  strokeWidth={isEdgeActive ? 2 : 1}
                />
                <text
                  x={midX}
                  y={midY + 4}
                  textAnchor="middle"
                  fill={isEdgeActive ? 'var(--primary)' : 'var(--foreground)'}
                  fontSize="9.5"
                  fontWeight={isEdgeActive ? '700' : '600'}
                  fontFamily="ui-monospace, monospace"
                >
                  {formatCurrency(edge.amount, true)}
                </text>
                <title>
                  {`${edge.id}: ${keyAccountNames.get(edge.senderId)} to ${keyAccountNames.get(edge.recipientId)} · ${formatCurrency(edge.amount)} · Risk ${edge.riskScore}`}
                </title>
              </g>
            )
          })}
        </g>

        {/* Account Nodes */}
        {visibleAccounts.map((account) => {
          const point = getNodePosition(account.id, accounts)
          if (!point) return null
          const isSelected = account.id === selectedAccountId
          const fill =
            account.riskScore >= 85
              ? 'var(--destructive)'
              : account.riskScore >= 60
                ? 'var(--warning)'
                : 'var(--chart-1)'

          return (
            <g
              key={account.id}
              role="button"
              tabIndex={0}
              aria-label={`Select account ${account.name}, ${account.id}, risk score ${account.riskScore}`}
              aria-pressed={isSelected}
              onClick={() => onSelectAccount(account.id)}
              onKeyDown={(event) => handleNodeKeyDown(event, account.id)}
              className="cursor-pointer outline-none focus-visible:outline-none group"
            >
              {isSelected ? (
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="34"
                  fill="none"
                  stroke="var(--primary)"
                  strokeOpacity="0.25"
                  strokeWidth="8"
                />
              ) : null}
              <circle
                cx={point.x}
                cy={point.y}
                r="25"
                fill={isSelected ? 'var(--primary)' : 'var(--card)'}
                stroke={isSelected ? 'var(--primary)' : fill}
                strokeWidth="2.5"
                className="transition duration-150 group-hover:scale-105"
              />
              <text
                x={point.x}
                y={point.y + 4}
                textAnchor="middle"
                fill={isSelected ? 'var(--primary-foreground)' : fill}
                fontSize="11"
                fontWeight="800"
                fontFamily="ui-monospace, monospace"
              >
                {account.riskScore}
              </text>
              <text
                x={point.x}
                y={point.y + 43}
                textAnchor="middle"
                fill="var(--foreground)"
                fontSize="10"
                fontWeight="600"
              >
                {account.name.length > 18 ? `${account.name.slice(0, 17)}…` : account.name}
              </text>
              <text
                x={point.x}
                y={point.y + 57}
                textAnchor="middle"
                fill="var(--muted-foreground)"
                fontSize="8.5"
                fontFamily="ui-monospace, monospace"
              >
                {account.id}
              </text>
              <title>{`${account.name} · ${account.institution} · risk ${account.riskScore}/100`}</title>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export function MoneyTrailPage({
  accounts,
  transactions,
  profiles,
  selectedAccountId,
  selectedTransactionId = null,
  onSelectAccount,
  onSelectTransaction,
  onOpenTransaction,
}: {
  accounts: DemoAccount[]
  transactions: DemoTransaction[]
  profiles: MuleProfile[]
  selectedAccountId: string
  selectedTransactionId?: string | null
  onSelectAccount: (id: string) => void
  onSelectTransaction?: (id: string) => void
  onOpenTransaction: (id: string) => void
}) {
  const [direction, setDirection] = useState<FlowDirection>('both')
  const [depth, setDepth] = useState('1')
  const [activeTab, setActiveTab] = useState<'account' | 'transaction'>(
    selectedTransactionId ? 'transaction' : 'account'
  )

  const selectedAccount =
    accounts.find((account) => account.id === selectedAccountId) ?? accounts[0]
  const profile = profiles.find((item) => item.accountId === selectedAccount?.id)

  const selectedTxn = useMemo(() => {
    if (!selectedTransactionId) return null
    return transactions.find((t) => t.id === selectedTransactionId) ?? null
  }, [transactions, selectedTransactionId])

  const selectedTxnRiskEval = useMemo(() => {
    if (!selectedTxn) return null
    return evaluateTransactionRisk(selectedTxn, transactions, accounts)
  }, [selectedTxn, transactions, accounts])

  const trail = useMemo(
    () => buildTrail(transactions, selectedAccount?.id ?? '', direction, Number(depth)),
    [transactions, selectedAccount?.id, direction, depth]
  )

  const incomingValue = trail.edges
    .filter((edge) => edge.recipientId === selectedAccount?.id)
    .reduce((sum, edge) => sum + edge.amount, 0)
  const outgoingValue = trail.edges
    .filter((edge) => edge.senderId === selectedAccount?.id)
    .reduce((sum, edge) => sum + edge.amount, 0)

  const handleTransactionClick = (id: string) => {
    onSelectTransaction?.(id)
    setActiveTab('transaction')
    // Automatically recenter account to sender if not in trail
    const txn = transactions.find((t) => t.id === id)
    if (txn && !trail.visibleAccountIds.has(txn.senderId) && !trail.visibleAccountIds.has(txn.recipientId)) {
      onSelectAccount(txn.senderId)
    }
  }

  const handleAccountClick = (id: string) => {
    onSelectAccount(id)
    setActiveTab('account')
  }

  if (!selectedAccount) {
    return (
      <Panel>
        <EmptyState
          title="No accounts available"
          description="The synthetic account set is empty, so a money trail cannot be drawn."
        />
      </Panel>
    )
  }

  return (
    <div>
      <PageHeader
        eyebrow="Trace · interactive fund-flow graph"
        title="Money trail"
        description="Follow synthetic transfer paths across Indian financial institutions. Choose a starting account or specific transaction to visualize multi-hop fund flows, relay velocity, and counterparty clusters."
        action={
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.05] px-3 py-2 text-[11px] font-semibold text-primary">
            <Network className="size-3.5" aria-hidden="true" />
            {trail.edges.length} connected transfers in view
          </span>
        }
      />

      <Panel className="mb-4">
        <div className="grid gap-3 p-4 lg:grid-cols-[minmax(200px,1.2fr)_minmax(200px,1.2fr)_minmax(140px,0.6fr)_minmax(140px,0.5fr)_auto] lg:items-end">
          {/* Starting Account */}
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Trace Account
            </span>
            <select
              className={controlClass}
              value={selectedAccount.id}
              onChange={(event) => handleAccountClick(event.target.value)}
              aria-label="Choose a starting account"
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} · {account.id} (Risk {account.riskScore})
                </option>
              ))}
            </select>
          </label>

          {/* Direct Transaction Selector */}
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Focus Specific Transfer
            </span>
            <select
              className={controlClass}
              value={selectedTransactionId ?? ''}
              onChange={(event) => {
                if (event.target.value) {
                  handleTransactionClick(event.target.value)
                }
              }}
              aria-label="Choose a specific transaction to trace"
            >
              <option value="">-- Choose transaction to inspect --</option>
              {transactions.map((txn) => (
                <option key={txn.id} value={txn.id}>
                  {txn.id} · {formatCurrency(txn.amount, true)} ({txn.senderName} → {txn.recipientName})
                </option>
              ))}
            </select>
          </label>

          {/* Flow Direction */}
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Flow Direction
            </span>
            <select
              className={controlClass}
              value={direction}
              onChange={(event) => setDirection(event.target.value as FlowDirection)}
              aria-label="Choose money trail direction"
            >
              <option value="both">Incoming + Outgoing</option>
              <option value="out">Outgoing only</option>
              <option value="in">Incoming only</option>
            </select>
          </label>

          {/* Trace Depth */}
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Trace Depth
            </span>
            <select
              className={controlClass}
              value={depth}
              onChange={(event) => setDepth(event.target.value)}
              aria-label="Choose graph trace depth"
            >
              <option value="1">1 hop · Direct</option>
              <option value="2">2 hops · Extended</option>
              <option value="3">3 hops · Deep trail</option>
            </select>
          </label>

          <Button
            variant="outline"
            size="sm"
            className="h-10 rounded-xl bg-card text-xs"
            onClick={() => {
              onSelectAccount('A-89316')
              onSelectTransaction?.('')
              setDirection('both')
              setDepth('1')
              setActiveTab('account')
            }}
          >
            <RotateCcw />Reset
          </Button>
        </div>
      </Panel>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(330px,0.7fr)]">
        {/* Main Graph Panel */}
        <Panel className="min-w-0">
          <PanelHeading
            title="Synthetic transfer network graph"
            description="Click any account node to recenter the trail; click any transfer line or amount pill to inspect the transaction."
            action={
              <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-destructive" />High Risk (85+)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-warning" />Elevated (60-84)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-chart-1" />Low (&lt;60)
                </span>
              </div>
            }
          />

          {trail.edges.length ? (
            <NetworkGraph
              accounts={accounts}
              edges={trail.edges}
              visibleAccountIds={trail.visibleAccountIds}
              selectedAccountId={selectedAccount.id}
              selectedTransactionId={selectedTransactionId}
              onSelectAccount={handleAccountClick}
              onSelectTransaction={handleTransactionClick}
            />
          ) : (
            <EmptyState
              title="No transfers in this direction"
              description="Try switching flow direction to 'Incoming + Outgoing' or expand the trace depth."
            />
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 px-5 py-3 text-[10px] text-muted-foreground">
            <span>{trail.visibleAccountIds.size} accounts · {trail.edges.length} transfers visualized</span>
            <span>Interactive graph with deterministic rule scoring · Synthetic INR records</span>
          </div>
        </Panel>

        {/* Right Details Panel: Toggle between Account View & Transaction View */}
        <Panel>
          <div className="flex items-center border-b border-border/70 p-2">
            <Button
              variant={activeTab === 'account' ? 'secondary' : 'ghost'}
              size="sm"
              className="flex-1 rounded-lg text-xs"
              onClick={() => setActiveTab('account')}
            >
              Account Context ({selectedAccount.id})
            </Button>
            {selectedTxn ? (
              <Button
                variant={activeTab === 'transaction' ? 'secondary' : 'ghost'}
                size="sm"
                className="flex-1 rounded-lg text-xs"
                onClick={() => setActiveTab('transaction')}
              >
                Transfer ({selectedTxn.id})
              </Button>
            ) : null}
          </div>

          {activeTab === 'transaction' && selectedTxn && selectedTxnRiskEval ? (
            /* Selected Transaction Detail View */
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary">{selectedTxn.id}</span>
                    <StatusBadge status={selectedTxn.status} />
                  </div>
                  <p className="mt-1 text-base font-bold tabular-nums text-foreground">
                    {formatCurrency(selectedTxn.amount)}
                  </p>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    {selectedTxn.channel} · {formatDateTime(selectedTxn.timestamp)} IST
                  </p>
                </div>
                <div className="w-24">
                  <RiskMeter score={selectedTxnRiskEval.score} />
                </div>
              </div>

              {/* Fund Flow Parties */}
              <div className="mt-4 space-y-2 rounded-xl border border-border/70 bg-muted/25 p-3 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase">From</span>
                    <p className="font-semibold text-foreground truncate max-w-44">{selectedTxn.senderName}</p>
                    <p className="font-mono text-[9px] text-muted-foreground">{selectedTxn.senderId}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[10px] bg-card"
                    onClick={() => handleAccountClick(selectedTxn.senderId)}
                  >
                    Trace Sender
                  </Button>
                </div>

                <div className="border-t border-border/60 pt-2 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase">To</span>
                    <p className="font-semibold text-foreground truncate max-w-44">{selectedTxn.recipientName}</p>
                    <p className="font-mono text-[9px] text-muted-foreground">{selectedTxn.recipientId}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[10px] bg-card"
                    onClick={() => handleAccountClick(selectedTxn.recipientId)}
                  >
                    Trace Recipient
                  </Button>
                </div>
              </div>

              {/* Rule Breakdown for this transfer */}
              <div className="mt-4 rounded-xl border border-primary/15 bg-card/60 p-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Scale className="size-3.5 text-primary" />
                  <span>Rule-Based Risk Factors</span>
                </div>
                <div className="mt-2 space-y-1.5">
                  {selectedTxnRiskEval.triggeredFactors.map((f) => (
                    <div key={f.ruleId} className="flex items-start gap-2 text-[11px] leading-4 text-muted-foreground">
                      <span className="font-mono text-[10px] font-bold text-destructive shrink-0">+{f.points}</span>
                      <span>{f.ruleName}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-2">
                <Button
                  size="sm"
                  className="w-full text-xs font-semibold"
                  onClick={() => onOpenTransaction(selectedTxn.id)}
                >
                  <ExternalLink />Inspect in Transactions Ledger
                </Button>
              </div>
            </div>
          ) : (
            /* Selected Account View */
            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-foreground">{selectedAccount.name}</h2>
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground">{selectedAccount.id}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {selectedAccount.institution} · {selectedAccount.accountType}
                  </p>
                </div>
                <div className="w-24 shrink-0">
                  <RiskMeter score={selectedAccount.riskScore} />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-border/70 bg-muted/35 p-3">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <ArrowDownLeft className="size-3.5" aria-hidden="true" />
                    Direct Inflow
                  </div>
                  <p className="mt-1.5 text-sm font-semibold tabular-nums text-foreground">
                    {formatCurrency(incomingValue, true)}
                  </p>
                </div>
                <div className="rounded-xl border border-border/70 bg-muted/35 p-3">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <ArrowUpRight className="size-3.5" aria-hidden="true" />
                    Direct Outflow
                  </div>
                  <p className="mt-1.5 text-sm font-semibold tabular-nums text-foreground">
                    {formatCurrency(outgoingValue, true)}
                  </p>
                </div>
              </div>

              {profile ? (
                <div className="mt-4 rounded-xl border border-destructive/15 bg-destructive/[0.035] p-3.5">
                  <div className="mb-1.5 flex items-center gap-2">
                    <StatusBadge status="Mule candidate" />
                  </div>
                  <p className="text-[11px] leading-5 text-foreground">{profile.explanation}</p>
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Observed Relay Signals
                  </p>
                  <ul className="mt-1.5 flex flex-col gap-1.5">
                    {profile.signals.map((signal) => (
                      <li key={signal} className="flex gap-2 text-[10px] leading-4 text-muted-foreground">
                        <span className="mt-1.5 size-1 shrink-0 rounded-full bg-destructive/70" />
                        {signal}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="mt-4 rounded-xl border border-border/70 bg-muted/35 p-3.5 text-[11px] leading-5 text-muted-foreground">
                  No registered mule profile for this account. Composite score derived from network topology.
                </p>
              )}

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="text-xs font-semibold text-foreground">Direct Transfer Records</h3>
                  <span className="text-[10px] text-muted-foreground">
                    {
                      transactions.filter(
                        (t) => t.senderId === selectedAccount.id || t.recipientId === selectedAccount.id
                      ).length
                    }{' '}
                    total
                  </span>
                </div>
                <div className="flex flex-col divide-y divide-border/60 rounded-xl border border-border/70">
                  {transactions
                    .filter(
                      (t) => t.senderId === selectedAccount.id || t.recipientId === selectedAccount.id
                    )
                    .slice(0, 6)
                    .map((t) => (
                      <div key={t.id} className="flex items-center justify-between gap-2 px-3 py-2.5">
                        <div className="min-w-0">
                          <button
                            type="button"
                            className="font-mono text-[10px] font-semibold text-primary hover:underline text-left block"
                            onClick={() => handleTransactionClick(t.id)}
                          >
                            {t.id} →
                          </button>
                          <p className="mt-0.5 text-[9px] text-muted-foreground truncate">
                            {t.senderId === selectedAccount.id ? `Outgoing to ${t.recipientName}` : `Incoming from ${t.senderName}`}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-[10px] font-semibold tabular-nums text-foreground">
                            {formatCurrency(t.amount, true)}
                          </p>
                          <span className="font-mono text-[9px] text-muted-foreground">{t.channel}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}
