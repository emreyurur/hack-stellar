import { useState, type ReactNode } from 'react'

// ─── Nav config ───────────────────────────────────────────────────────────────

const navSections = [
  {
    id: 'getting-started',
    label: 'Getting Started',
    items: [
      { id: 'overview', label: 'Overview' },
      { id: 'architecture', label: 'Architecture' },
    ],
  },
  {
    id: 'protocol',
    label: 'Protocol',
    items: [
      { id: 'roadmap', label: 'Roadmap' },
      { id: 'contracts', label: 'Contracts' },
    ],
  },
  {
    id: 'developers',
    label: 'Developers',
    items: [
      { id: 'integration', label: 'Integration Guide' },
      { id: 'api', label: 'API Reference', badge: 'Soon' },
    ],
  },
]


// ─── Page ────────────────────────────────────────────────────────────────────

export function DocsPage() {
  const [activeSection, setActiveSection] = useState('overview')

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActiveSection(id)
  }

  return (
    <div className="flex gap-0">
      {/* ── Left sidebar ─────────────────────────────────────────────────── */}
      <aside className="hidden w-52 shrink-0 lg:block">
        <div className="sticky top-6 pr-6">
          {navSections.map((section) => (
            <div className="mb-7" key={section.id}>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#6B7B6B]">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <button
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-all duration-150 ${
                      activeSection === item.id
                        ? 'bg-[#1A2E1A] font-medium text-[#F5F0E8]'
                        : 'text-[#6B7B6B] hover:bg-white/65 hover:text-[#1A2E1A]'
                    }`}
                    key={item.id}
                    onClick={() => scrollTo(item.id)}
                    type="button"
                  >
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="rounded-md border border-[#6B7B6B]/20 px-1.5 py-0.5 text-[10px] text-[#6B7B6B]">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="mt-2 rounded-xl border border-[#6B7B6B]/15 bg-white/45 p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6B7B6B]">
              Version
            </p>
            <p className="mt-1 font-terminal text-xs font-semibold text-[#1A2E1A]">v0.1.0</p>
            <p className="mt-0.5 text-[10px] text-[#6B7B6B]">Stellar Testnet</p>
          </div>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className="min-w-0 flex-1 lg:px-10">

        {/* ── Overview ───────────────────────────────────────────────────── */}
        <section className="scroll-mt-6" id="overview">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status="live">v0.1 — Live on Testnet</StatusBadge>
            <span className="font-terminal text-xs text-[#6B7B6B]">Soroban · Horizon</span>
          </div>

          <h1 className="mt-4 text-[2.5rem] font-bold leading-tight tracking-tight text-[#1A2E1A]">
            Terminal8 Protocol
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#6B7B6B]">
            An open, composable yield routing and position management protocol built on Stellar's
            Soroban smart contract platform. Developers get primitives for batch asset management,
            risk-adjusted yield allocation, and on-chain position tracking across the Stellar DeFi
            ecosystem.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <FeatureCard icon="⚡" title="Batch Swaps">
              Route multiple assets to a single target via{' '}
              <code className="font-terminal text-xs">PathPaymentStrictSend</code> in one
              fee-bumped transaction envelope.
            </FeatureCard>
            <FeatureCard icon="🛡" title="Risk Oracle">
              On-chain pool scoring across four axes: Liquidity (40), Age (20), Audit (20),
              Activity (20). Total score out of 100.
            </FeatureCard>
            <FeatureCard icon="📊" title="Position Manager">
              Track, manage, and exit yield positions across Blend, Soroswap, and Aquarius —
              full supply/withdraw lifecycle.
            </FeatureCard>
          </div>
        </section>

        <DocsDivider />

        {/* ── Architecture ───────────────────────────────────────────────── */}
        <section className="scroll-mt-6" id="architecture">
          <SectionLabel>Architecture</SectionLabel>
          <h2 className="mt-2 text-2xl font-bold text-[#1A2E1A]">Protocol Stack</h2>
          <p className="mt-2 text-sm leading-6 text-[#6B7B6B]">
            Terminal8 is a layered protocol. The React SDK communicates with Soroban contracts
            for on-chain logic and with the Horizon API for pathfinding and transaction submission.
          </p>

          <div className="mt-6 overflow-hidden rounded-2xl border border-[#6B7B6B]/15">
            <div className="border-b border-[#6B7B6B]/10 bg-[#1A2E1A] px-5 py-3.5">
              <p className="font-terminal text-xs text-[#C8A84B]">// protocol-stack.ts</p>
            </div>
            <div className="grid divide-y divide-[#6B7B6B]/10 bg-white/45 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
              {[
                {
                  layer: 'Client',
                  name: 'React SDK',
                  desc: 'useWallet · usePools · usePositions',
                  color: 'text-[#C8A84B]',
                },
                {
                  layer: 'Routing',
                  name: 'Horizon API',
                  desc: 'PathPayment · DEX pathfinding',
                  color: 'text-blue-500',
                },
                {
                  layer: 'Contracts',
                  name: 'Soroban',
                  desc: 'PositionManager · RiskOracle · Router',
                  color: 'text-purple-500',
                },
                {
                  layer: 'Protocols',
                  name: 'Integrations',
                  desc: 'Blend · Soroswap · Aquarius',
                  color: 'text-[#4ade80]',
                },
              ].map((item) => (
                <div className="p-5" key={item.layer}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6B7B6B]">
                    {item.layer}
                  </p>
                  <p className={`mt-2 text-sm font-semibold ${item.color}`}>{item.name}</p>
                  <p className="mt-1.5 font-terminal text-xs leading-5 text-[#6B7B6B]">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <ArchBlock badge="Horizon API" title="Routing Engine">
              Finds optimal swap paths using Stellar's native DEX pathfinding.
              Supports strict-send and strict-receive modes with configurable slippage protection
              and automatic reserve buffering for XLM fee operations.
            </ArchBlock>
            <ArchBlock badge="Soroban" title="Risk Oracle">
              Evaluates each pool across Liquidity depth (40pt), Protocol age (20pt),
              Audit status (20pt), and Trading activity (20pt). Scores are computed
              off-chain and can be migrated to a Soroban oracle in v0.2.
            </ArchBlock>
            <ArchBlock badge="Soroban" title="Position Manager">
              Tracks user supply positions across all integrated protocols. Emits lifecycle
              events — <code className="font-terminal text-[10px]">opened</code>,{' '}
              <code className="font-terminal text-[10px]">accruing</code>,{' '}
              <code className="font-terminal text-[10px]">withdrawn</code> — for frontend
              indexing and earned yield calculation.
            </ArchBlock>
            <ArchBlock badge="Horizon API" title="Batch Router">
              Bundles multiple{' '}
              <code className="font-terminal text-[10px]">PathPaymentStrictSend</code> operations
              into a single fee-bumped transaction envelope, minimising per-operation gas cost
              and reducing failed partial swaps.
            </ArchBlock>
          </div>
        </section>

        <DocsDivider />

        {/* ── Roadmap ────────────────────────────────────────────────────── */}
        <section className="scroll-mt-6" id="roadmap">
          <SectionLabel>Roadmap</SectionLabel>
          <h2 className="mt-2 text-2xl font-bold text-[#1A2E1A]">Protocol Milestones</h2>
          <p className="mt-2 text-sm leading-6 text-[#6B7B6B]">
            Four versioned milestones from testnet MVP to full mainnet deployment with governance.
          </p>

          <div className="mt-6 space-y-4">
            <RoadmapPhase
              date="June 2026"
              items={[
                { text: 'Freighter wallet integration (isConnected, requestAccess, signTransaction)', done: true },
                { text: 'Batch PathPaymentStrictSend engine with XLM reserve buffering and 1% slippage guard', done: true },
                { text: 'Risk assessment quiz — 3-question profiling into Conservative / Moderate / Aggressive', done: true },
                { text: 'Pool reputation scoring — Liquidity, Age, Audit, Activity axes with expandable breakdown', done: true },
                { text: 'Blend Protocol testnet supply via Soroban PoolContractV2.submit()', done: true },
                { text: 'Position management UI — open, track earned yield, partial or full withdrawal', done: true },
                { text: 'Deterministic terminal with sweep all and show yield commands', done: true },
              ]}
              status="live"
              title="Foundation"
              version="v0.1"
            />

            <RoadmapPhase
              date="Q3 2026"
              items={[
                { text: 'Soroswap LP position management — addLiquidity / removeLiquidity flows', done: false, active: true },
                { text: 'Aquarius rewards auto-compounding via claim + re-supply loop', done: false, active: true },
                { text: 'Real-time APY indexing from Soroban contract events via RPC stream', done: false },
                { text: 'Multi-hop routing optimiser — shortest path across pool liquidity graph', done: false },
                { text: 'Position health monitoring — LTV alerts for overleveraged Blend positions', done: false },
                { text: 'Mainnet batch swap — full PathPayment pipeline on PUBLIC network', done: false },
              ]}
              status="in-progress"
              title="DeFi Primitives"
              version="v0.2"
            />

            <RoadmapPhase
              date="Q4 2026"
              items={[
                { text: '@terminal8/sdk — TypeScript library published on npm', done: false },
                { text: 'REST API at api.stellardomain.xyz with OpenAPI 3.0 schema', done: false },
                { text: 'Webhooks for position lifecycle events (opened · accruing · withdrawn)', done: false },
                { text: 'CLI tool: terminal8 swap, terminal8 positions, terminal8 pools', done: false },
                { text: 'Developer dashboard with API key management and usage analytics', done: false },
                { text: 'Testnet sandbox environment for protocol integration testing', done: false },
              ]}
              status="planned"
              title="Developer SDK"
              version="v0.3"
            />

            <RoadmapPhase
              date="Q1 2027"
              items={[
                { text: 'Soroban contract audits — PositionManager, RiskOracle, BatchRouter', done: false },
                { text: 'Full PUBLIC network deployment across all integrated protocols', done: false },
                { text: 'SDP governance token — on-chain proposal creation and token voting', done: false },
                { text: 'Protocol fee switch — configurable basis points via DAO resolution', done: false },
                { text: 'Ecosystem grants program for builders integrating the SDK', done: false },
                { text: 'Cross-chain research — IBC bridge for Cosmos chain yield access', done: false },
              ]}
              status="planned"
              title="Mainnet"
              version="v1.0"
            />
          </div>
        </section>

        <DocsDivider />

        {/* ── Contracts ──────────────────────────────────────────────────── */}
        <section className="scroll-mt-6" id="contracts">
          <SectionLabel>Contract Reference</SectionLabel>
          <h2 className="mt-2 text-2xl font-bold text-[#1A2E1A]">Deployed Contracts</h2>
          <p className="mt-2 text-sm leading-6 text-[#6B7B6B]">
            All contracts are currently live on{' '}
            <code className="font-terminal text-xs">Test SDF Network ; September 2015</code>.
            Mainnet addresses will be published after audit completion.
          </p>

          <div className="mt-4 overflow-hidden rounded-2xl border border-[#6B7B6B]/15">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#1A2E1A] text-left">
                  {['Contract', 'Address', 'Network', 'Status'].map((h) => (
                    <th
                      className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#F5F0E8]/50"
                      key={h}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#6B7B6B]/10 bg-white/45">
                {[
                  {
                    name: 'PositionManager',
                    addr: 'CCEBVDYM32YNYCVNRXQKD...Q44HGF',
                    network: 'Testnet',
                    status: 'live' as const,
                  },
                  {
                    name: 'RiskOracle',
                    addr: 'CDL7K4BV...XRWP3M8Q',
                    network: 'Testnet',
                    status: 'live' as const,
                  },
                  {
                    name: 'BatchRouter',
                    addr: 'CBY28KLP...9ZQ1NV4R',
                    network: 'Testnet',
                    status: 'in-progress' as const,
                  },
                  {
                    name: 'PositionManager',
                    addr: 'TBD — post-audit',
                    network: 'Mainnet',
                    status: 'planned' as const,
                  },
                ].map((row, i) => (
                  <tr className="hover:bg-white/60 transition-colors duration-100" key={i}>
                    <td className="px-5 py-3.5 font-terminal text-xs font-semibold text-[#1A2E1A]">
                      {row.name}
                    </td>
                    <td className="px-5 py-3.5 font-terminal text-xs text-[#6B7B6B]">
                      {row.addr}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-[#6B7B6B]">{row.network}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={row.status}>
                        {row.status === 'live'
                          ? 'Live'
                          : row.status === 'in-progress'
                            ? 'In progress'
                            : 'Planned'}
                      </StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <DocsDivider />

        {/* ── Integration Guide ──────────────────────────────────────────── */}
        <section className="scroll-mt-6" id="integration">
          <SectionLabel>Integration Guide</SectionLabel>
          <h2 className="mt-2 text-2xl font-bold text-[#1A2E1A]">Integrate the Protocol</h2>
          <p className="mt-2 text-sm leading-6 text-[#6B7B6B]">
            The TypeScript SDK ships in v0.3. Until then, use the Soroban contracts and Horizon API
            directly — the snippets below are production-ready and extracted from the live frontend.
          </p>

          <SubHeading>1. Connect Freighter wallet</SubHeading>
          <p className="mt-1 mb-3 text-sm text-[#6B7B6B]">
            Use the <code className="font-terminal text-xs">@stellar/freighter-api</code> package
            to request wallet access and retrieve network details for the Soroban RPC URL.
          </p>
          <CodeBlock language="typescript">{`import {
  isConnected,
  requestAccess,
  getNetworkDetails,
} from '@stellar/freighter-api'

const connection = await isConnected()
if (!connection.isConnected) throw new Error('Freighter not installed')

const access = await requestAccess()
// { address: 'GABC...1234', error?: ... }

const details = await getNetworkDetails()
// { network, networkPassphrase, sorobanRpcUrl, networkUrl }

console.log('Connected:', access.address)
console.log('Network:', details.network) // 'TESTNET' | 'PUBLIC'`}</CodeBlock>

          <SubHeading>2. Execute a batch swap</SubHeading>
          <p className="mt-1 mb-3 text-sm text-[#6B7B6B]">
            Find the optimal strict-send path on Horizon, then bundle multiple swap operations
            into a single fee-bumped envelope.
          </p>
          <CodeBlock language="typescript">{`import {
  Horizon,
  Operation,
  TransactionBuilder,
  Asset,
  BASE_FEE,
} from '@stellar/stellar-sdk'
import { signTransaction } from '@stellar/freighter-api'

const horizon = new Horizon.Server(networkUrl)
const account = await horizon.loadAccount(publicKey)

// Find best path for each source asset
const paths = await horizon
  .strictSendPaths(sourceAsset, sendAmount, [destinationAsset])
  .call()

const best = paths.records.sort(
  (a, b) => Number(b.destination_amount) - Number(a.destination_amount)
)[0]

// Apply 1% slippage buffer
const destMin = (Number(best.destination_amount) * 0.99).toFixed(7)

// Build multi-op transaction
let builder = new TransactionBuilder(account, {
  fee: (Number(BASE_FEE) * ops.length).toString(),
  networkPassphrase,
}).setTimeout(60)

for (const op of ops) {
  builder = builder.addOperation(
    Operation.pathPaymentStrictSend({ ...op })
  )
}

const tx = builder.build()
const { signedTxXdr } = await signTransaction(tx.toXDR(), {
  address: publicKey,
  networkPassphrase,
})

const response = await horizon.submitTransaction(
  TransactionBuilder.fromXDR(signedTxXdr, networkPassphrase)
)
console.log('Batch swap hash:', response.hash)`}</CodeBlock>

          <SubHeading>3. Supply to Blend (Soroban)</SubHeading>
          <p className="mt-1 mb-3 text-sm text-[#6B7B6B]">
            Use <code className="font-terminal text-xs">@blend-capital/blend-sdk</code> to build
            the supply operation, then prepare and submit via the Soroban RPC.
          </p>
          <CodeBlock language="typescript">{`import { PoolContractV2, RequestType } from '@blend-capital/blend-sdk'
import { rpc, xdr, TransactionBuilder, BASE_FEE } from '@stellar/stellar-sdk'
import { signTransaction } from '@stellar/freighter-api'

const POOL_ID   = 'CCEBVDYM32YNYCVNRXQKDFFPISJJCV557CDZEIRBEE4NCV4KHPQ44HGF'
const USDC_ADDR = 'CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU'

const pool = new PoolContractV2(POOL_ID)
const amount = BigInt(Math.floor(supplyAmount * 10_000_000)) // to stroops

const op = xdr.Operation.fromXDR(
  pool.submit({
    from:    publicKey,
    spender: publicKey,
    to:      publicKey,
    requests: [{
      amount,
      request_type: RequestType.SupplyCollateral,
      address: USDC_ADDR,
    }],
  }),
  'base64'
)

const rpcServer = new rpc.Server(sorobanRpcUrl)

const rawTx = new TransactionBuilder(account, {
  fee: BASE_FEE,
  networkPassphrase,
})
  .addOperation(op)
  .setTimeout(60)
  .build()

const prepared = await rpcServer.prepareTransaction(rawTx)

const { signedTxXdr } = await signTransaction(prepared.toXDR(), {
  address: publicKey,
  networkPassphrase,
})

const result = await rpcServer.sendTransaction(
  TransactionBuilder.fromXDR(signedTxXdr, networkPassphrase)
)

console.log('Supply tx hash:', result.hash)
// result.status: 'PENDING' | 'SUCCESS' | 'ERROR'`}</CodeBlock>

          <SubHeading>4. Pool reputation scoring</SubHeading>
          <p className="mt-1 mb-3 text-sm text-[#6B7B6B]">
            The reputation formula is deterministic and can be computed client-side or migrated to
            a Soroban oracle in v0.2.
          </p>
          <CodeBlock language="typescript">{`type PoolReputation = {
  liquidity: number // 0–40  pool TVL weight
  age:       number // 0–20  days since first tx
  audit:     number // 0–20  0 | 10 | 15 | 20
  activity:  number // 0–20  30-day volume rank
}

function reputationScore(r: PoolReputation): number {
  return r.liquidity + r.age + r.audit + r.activity
}

function reputationLabel(score: number) {
  if (score >= 75) return 'Trusted'
  if (score >= 50) return 'Moderate'
  return 'Risky'
}

// Example: Blend USDC Lending Pool
const blendUsdc: PoolReputation = {
  liquidity: 35, // $2.4M TVL
  age:       18, // ~4 months live
  audit:     20, // audited by OtterSec
  activity:  14, // active borrower base
}

console.log(reputationScore(blendUsdc))  // 87
console.log(reputationLabel(87))         // 'Trusted'`}</CodeBlock>
        </section>

        {/* ── Footer CTA ─────────────────────────────────────────────────── */}
        <div className="mb-6 mt-12 rounded-2xl border border-[#C8A84B]/25 bg-[#C8A84B]/8 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-[#1A2E1A]">Build on Terminal8</p>
              <p className="mt-1 text-sm text-[#6B7B6B]">
                The protocol is open source. PRs, issues, and integrations welcome.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a className="rounded-xl border border-[#1A2E1A]/30 bg-[#1A2E1A] px-4 py-2.5 text-sm font-semibold text-[#F5F0E8] transition hover:bg-[#0F1F0F]" href="#">
                GitHub →
              </a>
              <a className="rounded-xl border border-[#6B7B6B]/20 bg-white/55 px-4 py-2.5 text-sm font-semibold text-[#1A2E1A] transition hover:bg-white/80" href="#">
                Discord
              </a>
            </div>
          </div>
        </div>
      </main>

    </div>
  )
}

// ─── Components ───────────────────────────────────────────────────────────────

function StatusBadge({
  children,
  status,
}: {
  children: ReactNode
  status: 'live' | 'in-progress' | 'planned'
}) {
  const styles = {
    live: 'border-[#4ade80]/30 bg-[#4ade80]/15 text-[#1A2E1A]',
    'in-progress': 'border-[#C8A84B]/30 bg-[#C8A84B]/15 text-[#1A2E1A]',
    planned: 'border-[#6B7B6B]/20 bg-[#6B7B6B]/10 text-[#6B7B6B]',
  }
  const dots = {
    live: 'bg-[#4ade80]',
    'in-progress': 'bg-[#C8A84B]',
    planned: 'bg-[#6B7B6B]/50',
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[status]}`}
    >
      <span className={`size-1.5 rounded-full ${dots[status]}`} />
      {children}
    </span>
  )
}

function FeatureCard({
  children,
  icon,
  title,
}: {
  children: ReactNode
  icon: string
  title: string
}) {
  return (
    <div className="rounded-2xl border border-[#6B7B6B]/15 bg-white/55 p-5">
      <div className="mb-3 flex size-9 items-center justify-center rounded-xl bg-[#1A2E1A] text-base">
        {icon}
      </div>
      <p className="font-semibold text-[#1A2E1A]">{title}</p>
      <p className="mt-1.5 text-sm leading-6 text-[#6B7B6B]">{children}</p>
    </div>
  )
}

function ArchBlock({
  badge,
  children,
  title,
}: {
  badge: string
  children: ReactNode
  title: string
}) {
  return (
    <div className="rounded-xl border border-[#6B7B6B]/15 bg-white/45 p-5">
      <div className="flex items-center gap-2">
        <p className="font-semibold text-[#1A2E1A]">{title}</p>
        <span className="rounded-md border border-[#6B7B6B]/20 px-1.5 py-0.5 font-terminal text-[10px] text-[#6B7B6B]">
          {badge}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-[#6B7B6B]">{children}</p>
    </div>
  )
}

function RoadmapPhase({
  date,
  items,
  status,
  title,
  version,
}: {
  date: string
  items: { text: string; done?: boolean; active?: boolean }[]
  status: 'live' | 'in-progress' | 'planned'
  title: string
  version: string
}) {
  const borderColor = {
    live: 'border-[#4ade80]/25',
    'in-progress': 'border-[#C8A84B]/25',
    planned: 'border-[#6B7B6B]/15',
  }[status]

  const versionColor = {
    live: 'text-[#4ade80]',
    'in-progress': 'text-[#C8A84B]',
    planned: 'text-[#6B7B6B]',
  }[status]

  return (
    <div className={`overflow-hidden rounded-2xl border ${borderColor} bg-white/45`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#6B7B6B]/10 px-6 py-4">
        <div className="flex items-center gap-3">
          <span className={`font-terminal text-xs font-bold ${versionColor}`}>{version}</span>
          <h3 className="text-base font-semibold text-[#1A2E1A]">{title}</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#6B7B6B]">{date}</span>
          <StatusBadge status={status}>
            {status === 'live' ? 'Live' : status === 'in-progress' ? 'In progress' : 'Planned'}
          </StatusBadge>
        </div>
      </div>

      <div className="px-6 py-5">
        <div className="space-y-3">
          {items.map((item, i) => (
            <div className="flex items-start gap-3" key={i}>
              <span
                className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border font-terminal text-[10px] font-bold ${
                  item.done
                    ? 'border-[#4ade80]/40 bg-[#4ade80]/15 text-[#4ade80]'
                    : item.active
                      ? 'border-[#C8A84B]/40 bg-[#C8A84B]/15 text-[#C8A84B]'
                      : 'border-[#6B7B6B]/20 bg-transparent text-transparent'
                }`}
              >
                {item.done ? '✓' : item.active ? '◉' : ''}
              </span>
              <p
                className={`text-sm leading-6 ${
                  item.done ? 'text-[#1A2E1A]' : 'text-[#6B7B6B]'
                }`}
              >
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function CodeBlock({ children, language }: { children: string; language: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#F5F0E8]/5">
      <div className="flex items-center justify-between bg-[#1A2E1A] px-4 py-2.5">
        <span className="font-terminal text-xs text-[#C8A84B]">{language}</span>
        <button
          className="font-terminal text-xs text-[#F5F0E8]/40 transition hover:text-[#F5F0E8]/80"
          onClick={handleCopy}
          type="button"
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto bg-[#0A1A0A] px-5 py-4 font-terminal text-xs leading-6 text-[#F5F0E8]/80">
        <code>{children}</code>
      </pre>
    </div>
  )
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#6B7B6B]">{children}</p>
  )
}

function SubHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="mt-8 mb-1 text-base font-semibold text-[#1A2E1A]">{children}</h3>
  )
}

function DocsDivider() {
  return <hr className="my-10 border-[#6B7B6B]/15" />
}
