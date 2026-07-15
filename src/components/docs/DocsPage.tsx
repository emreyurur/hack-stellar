import { useState, type ReactNode } from 'react'
import { POOL_VOTING_CONTRACT_ID } from '../../services/poolVotingContract'

// ─── Nav config ───────────────────────────────────────────────────────────────

const navSections = [
  {
    id: 'getting-started',
    label: 'Getting Started',
    items: [
      { id: 'overview', label: 'Overview' },
      { id: 'architecture', label: 'Technology Stack & Architecture' },
    ],
  },
  {
    id: 'core-features',
    label: 'Core Features',
    items: [
      { id: 'pools', label: 'DeFi Pools & LP' },
      { id: 'contracts', label: 'Soroban Contracts Reference', badge: 'NEW' },
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
    <div className="mx-auto flex max-w-[1440px] gap-8 px-5 py-8 sm:px-8">
      {/* ── Left sidebar ─────────────────────────────────────────────────── */}
      <aside className="hidden w-60 shrink-0 lg:block">
        <div className="sticky top-24 pr-4">
          {navSections.map((section) => (
            <div className="mb-8" key={section.id}>
              <p className="mb-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-[#9CA3AF]">
                {section.label}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <button
                    className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-sm transition-all duration-150 ${
                      activeSection === item.id
                        ? 'border border-[#F2C12E]/30 bg-[#F2C12E]/15 font-semibold text-[#F2C12E]'
                        : 'border border-transparent text-[#9CA3AF] hover:bg-white/[0.04] hover:text-[#F0F0F0]'
                    }`}
                    key={item.id}
                    onClick={() => scrollTo(item.id)}
                    type="button"
                  >
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="rounded-md border border-[#F2C12E]/30 bg-[#F2C12E]/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#F2C12E]">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="mt-6 rounded-2xl border border-white/[0.08] bg-[#12121A] p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#9CA3AF]">
                System Status
              </span>
              <span className="flex size-2 rounded-full bg-[#4ade80] shadow-[0_0_8px_#4ade80]" />
            </div>
            <p className="mt-2 font-mono text-sm font-bold text-[#F0F0F0]">v0.1.0-testnet</p>
            <p className="mt-1 text-xs text-[#9CA3AF]">Stellar Soroban & Horizon API</p>
          </div>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className="min-w-0 flex-1 lg:pl-6">
        {/* ── Overview ───────────────────────────────────────────────────── */}
        <section className="scroll-mt-24" id="overview">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status="live">v0.1 — Live on Stellar Testnet</StatusBadge>
            <span className="font-mono text-xs text-[#9CA3AF]">Soroban AMM · Horizon API</span>
          </div>

          <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-[#F0F0F0] sm:text-4xl">
            Terminal8 Architecture & Docs
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[#9CA3AF]">
            Terminal8 is a non-custodial DeFi dashboard and automated liquidity management platform built on the Stellar network and Soroban smart contracts. Developers and liquidity providers get unified access to constant-product AMM pools, risk-adjusted yield scoring, and instant transaction signing via Freighter.
          </p>

          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            <FeatureCard
              icon={
                <svg className="size-5 text-[#F2C12E]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              }
              title="Instant LP Operations"
            >
              Deposit and withdraw liquidity shares directly into Soroswap AMM pools (`AST1/AST2`, `XLM/USDC`) with automated XDR envelope construction.
            </FeatureCard>
            <FeatureCard
              icon={
                <svg className="size-5 text-[#4ade80]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              }
              title="Pool Trust Oracle"
            >
              Deterministic 4-axis reputation evaluation scoring every pool across Liquidity Depth (40pt), Protocol Age (20pt), Security Audit (20pt), and Volume (20pt).
            </FeatureCard>
            <FeatureCard
              icon={
                <svg className="size-5 text-[#60A5FA]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C19.496 3 20 3.504 20 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                  />
                </svg>
              }
              title="Portfolio & APY Sync"
            >
              Real-time synchronization between local storage state and remote Horizon portfolio indexes (`/api/v1/portfolio/sync`) for accurate yield tracking.
            </FeatureCard>
          </div>
        </section>

        <DocsDivider />

        {/* ── Architecture & Technology Stack ───────────────────────────── */}
        <section className="scroll-mt-24" id="architecture">
          <SectionLabel>Technology Stack & Architecture</SectionLabel>
          <h2 className="mt-2 text-2xl font-bold text-[#F0F0F0]">Full-Stack Architecture (Frontend & Backend)</h2>
          <p className="mt-2 text-sm leading-6 text-[#9CA3AF]">
            Terminal8 combines a high-performance React 19 + Vite frontend dashboard with an enterprise-grade NestJS backend API that orchestrates Soroban RPC and Horizon endpoints with strict type safety and real-time indexing.
          </p>

          {/* Frontend Tech Stack Grid */}
          <div className="mt-6 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#12121A]">
            <div className="border-b border-white/[0.08] bg-[#181824] px-6 py-3.5 flex items-center justify-between">
              <p className="font-mono text-xs font-semibold text-[#60A5FA]">// frontend-client-stack.ts</p>
              <span className="rounded bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 font-mono text-[10px] text-blue-400 font-bold">Client Layer</span>
            </div>
            <div className="grid divide-y divide-white/[0.08] sm:grid-cols-4 sm:divide-x sm:divide-y-0">
              {[
                {
                  layer: 'UI Framework',
                  name: 'React 19 & Vite v6.0',
                  desc: 'Concurrent Rendering · Hot Module Replacement · Ultra-fast Build Pipeline',
                  color: 'text-[#60A5FA]',
                },
                {
                  layer: 'Type & State',
                  name: 'Strict TypeScript v5.6+',
                  desc: 'Zero-runtime Type Errors · Custom Dashboard Hooks · Strict DTO Alignment',
                  color: 'text-[#F2C12E]',
                },
                {
                  layer: 'Design & Styling',
                  name: 'Tailwind CSS v3.4',
                  desc: 'Utility-first Responsive Grid · Glassmorphism · Curated Dark Mode Aesthetics',
                  color: 'text-purple-400',
                },
                {
                  layer: 'Wallet & XDR',
                  name: 'Stellar Wallets Kit & Freighter',
                  desc: 'Multi-wallet Support · Cryptographic Challenge Signing · XDR Verification',
                  color: 'text-[#4ade80]',
                },
              ].map((item) => (
                <div className="p-6" key={item.layer}>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#9CA3AF]">
                    {item.layer}
                  </p>
                  <p className={`mt-2 text-sm font-bold ${item.color}`}>{item.name}</p>
                  <p className="mt-1.5 font-mono text-xs leading-5 text-[#9CA3AF]">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/[0.08] bg-[#12121A] p-6">
              <h3 className="text-base font-bold text-[#F0F0F0] flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#60A5FA]" />
                Frontend Core & UI Architecture
              </h3>
              <p className="mt-2 text-xs leading-6 text-[#9CA3AF]">
                <strong>React 19 & Vite:</strong> Delivers instantaneous UI feedback, custom hooks (`usePoolDashboard`, `usePortfolioDashboard`, `WalletContext`), and seamless component tree reconciliation.<br/>
                <strong>Tailwind CSS & Recharts:</strong> Styled with custom glassmorphism (`backdrop-blur`), vibrant neon gradients, and interactive APY trend charts.
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-[#12121A] p-6">
              <h3 className="text-base font-bold text-[#F0F0F0] flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#4ade80]" />
                Wallet Integration & CLI Terminal
              </h3>
              <p className="mt-2 text-xs leading-6 text-[#9CA3AF]">
                <strong>Stellar Wallets Kit:</strong> Connects to **Freighter, xBull, LOBSTR, and Albedo** with automated challenge authorization (`signAuthEntry`).<br/>
                <strong>Developer CLI Terminal:</strong> Embedded command suite (`positions`, `withdraw`, `pools`, `balance`) allowing power users to sign real XDR envelopes directly via command prompt.
              </p>
            </div>
          </div>

          {/* Backend Tech Stack Grid */}
          <div className="mt-8 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#12121A]">
            <div className="border-b border-white/[0.08] bg-[#181824] px-6 py-3.5 flex items-center justify-between">
              <p className="font-mono text-xs font-semibold text-[#F2C12E]">// system-architecture.ts & backend-stack</p>
              <span className="rounded bg-[#F2C12E]/10 border border-[#F2C12E]/20 px-2 py-0.5 font-mono text-[10px] text-[#F2C12E] font-bold">API Layer</span>
            </div>
            <div className="grid divide-y divide-white/[0.08] sm:grid-cols-4 sm:divide-x sm:divide-y-0">
              {[
                {
                  layer: 'Core Framework',
                  name: 'NestJS & Node v20+',
                  desc: 'Modular Architecture · Dependency Injection · RO-RO Pattern · Asynchronous Non-blocking I/O',
                  color: 'text-[#F2C12E]',
                },
                {
                  layer: 'Blockchain Layer',
                  name: '@stellar/stellar-sdk v12.3',
                  desc: 'XDR TransactionBuilder · Horizon API Integration · Indexer Mechanism · getLiquidityPoolId',
                  color: 'text-blue-400',
                },
                {
                  layer: 'Database & ORM',
                  name: 'PostgreSQL v16 & TypeORM',
                  desc: 'ACID Transaction History · Isolated Data Access Layer via @Entity and Repository Pattern',
                  color: 'text-purple-400',
                },
                {
                  layer: 'Queue & Caching',
                  name: 'Redis v7 & BullMQ v5.7',
                  desc: 'Cache Manager ioredis Adapter · Asynchronous Workers · CRON-based Retry Mechanism',
                  color: 'text-[#4ade80]',
                },
              ].map((item) => (
                <div className="p-6" key={item.layer}>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#9CA3AF]">
                    {item.layer}
                  </p>
                  <p className={`mt-2 text-sm font-bold ${item.color}`}>{item.name}</p>
                  <p className="mt-1.5 font-mono text-xs leading-5 text-[#9CA3AF]">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-white/[0.08] bg-[#12121A] p-6">
              <h3 className="text-base font-bold text-[#F0F0F0] flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#F2C12E]" />
                1. Core Framework & Language
              </h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-3 font-mono text-xs text-[#CBD5E1]">
                <div className="rounded-xl border border-white/[0.06] bg-[#0D0D12] p-4">
                  <p className="font-bold text-white mb-1">Node.js (v20+) & V8 Engine</p>
                  <p className="text-[#9CA3AF] text-[11px] leading-5">Asynchronous non-blocking I/O architecture processes intensive Horizon network requests without bottlenecks.</p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-[#0D0D12] p-4">
                  <p className="font-bold text-white mb-1">TypeScript (v5.1)</p>
                  <p className="text-[#9CA3AF] text-[11px] leading-5">Strict mode enabled across all layers, avoiding `any` types and guaranteeing zero compile-time type errors.</p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-[#0D0D12] p-4">
                  <p className="font-bold text-white mb-1">NestJS (v10.0)</p>
                  <p className="text-[#9CA3AF] text-[11px] leading-5">Modular domain structure (`HistoryModule`, `TestnetToolsModule`) utilizing strict DI and clean architectural patterns.</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-[#12121A] p-6">
              <h3 className="text-base font-bold text-[#F0F0F0] flex items-center gap-2">
                <span className="size-2 rounded-full bg-blue-400" />
                2. Blockchain & Stellar Integration (@stellar/stellar-sdk v12.3)
              </h3>
              <p className="mt-2 text-xs leading-6 text-[#9CA3AF]">
                Core library providing full integration with the Stellar network. Smart contract logic, LP operations, trustlines, and token transfers are built on the backend (`TransactionBuilder`) and delivered to the client as XDR envelopes for Freighter wallet signing.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 font-mono text-[11px]">
                <span className="rounded-md border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-blue-300">Horizon API Integration</span>
                <span className="rounded-md border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-blue-300">XDR Envelope Construction</span>
                <span className="rounded-md border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-blue-300">Asynchronous Horizon Indexer</span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/[0.08] bg-[#12121A] p-6">
                <h3 className="text-base font-bold text-[#F0F0F0] flex items-center gap-2">
                  <span className="size-2 rounded-full bg-purple-400" />
                  3. Database & ORM Layer
                </h3>
                <p className="mt-2 text-xs leading-6 text-[#9CA3AF]">
                  <strong>PostgreSQL (v16 Alpine):</strong> ACID-compliant persistent storage for user transaction records (`History`), profile metadata, and financial activity logs.<br/>
                  <strong>TypeORM (v0.3.20):</strong> Strictly typed `@Entity` and `@Column` classes isolating database access (`@InjectRepository`) from business logic.
                </p>
              </div>

              <div className="rounded-2xl border border-white/[0.08] bg-[#12121A] p-6">
                <h3 className="text-base font-bold text-[#F0F0F0] flex items-center gap-2">
                  <span className="size-2 rounded-full bg-[#4ade80]" />
                  4. Caching & Queue Engine (Redis & BullMQ)
                </h3>
                <p className="mt-2 text-xs leading-6 text-[#9CA3AF]">
                  <strong>Redis (v7) & ioredis:</strong> Caches high-frequency Horizon API queries via `@nestjs/cache-manager` and `cache-manager-ioredis-yet` adapter.<br/>
                  <strong>BullMQ (v5.7):</strong> Manages CRON-based indexer synchronization and background workers with automated retry mechanisms.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <ArchBlock badge="Security & Validations" title="JWT, Class Validator & Joi">
                Stateless authentication via `@nestjs/jwt` & `passport-jwt`. Requests are validated using `Class Validator` (`@IsString()`, `@IsNotEmpty()`), while `Joi` verifies required environment variables (`.env`) on application startup.
              </ArchBlock>
              <ArchBlock badge="DevOps & QA" title="Docker, Swagger & Jest">
                Containerized deployment (`docker-compose up -d`) orchestrates PostgreSQL, Redis, and API services in an isolated network. Live OpenAPI 3.0 specs are published at `/api/v1/docs`, backed by comprehensive `Jest` and `Supertest` suites.
              </ArchBlock>
            </div>
          </div>
        </section>

        <DocsDivider />

        {/* ── Pools & LP ─────────────────────────────────────────────────── */}
        <section className="scroll-mt-24" id="pools">
          <SectionLabel>Core Features</SectionLabel>
          <h2 className="mt-2 text-2xl font-bold text-[#F0F0F0]">DeFi Pools & LP Operations</h2>
          <p className="mt-2 text-sm leading-6 text-[#9CA3AF]">
            Terminal8 prioritizes deep liquidity pools (`constant_product`) with instant deposit/withdraw capabilities and real-time shares tracking.
          </p>

          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-white/[0.08] bg-[#12121A] p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#F0F0F0]">Constant Product AMM Mechanics</h3>
                <span className="rounded-full border border-[#4ade80]/30 bg-[#4ade80]/15 px-3 py-1 font-mono text-xs font-semibold text-[#4ade80]">
                  Active
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-[#9CA3AF]">
                When depositing into a pool (e.g. `AST1 / AST2` or `XLM / USDC`), the protocol automatically calculates the proportional asset reserves and issues LP shares (`totalShares`). Users earn transaction fees (`feeBp: 30`) proportional to their share of the pool.
              </p>
              <div className="mt-4 flex flex-wrap gap-4 rounded-xl border border-white/[0.06] bg-[#0D0D12] p-4 font-mono text-xs text-[#CBD5E1]">
                <div><span className="text-[#9CA3AF]">Asset A Code:</span> AST1 / XLM</div>
                <div><span className="text-[#9CA3AF]">Asset B Code:</span> AST2 / USDC</div>
                <div><span className="text-[#9CA3AF]">Fee Basis Points:</span> 30 bps (0.30%)</div>
              </div>
            </div>
          </div>
        </section>

        <DocsDivider />

        {/* ── Deployed Contracts Reference ───────────────────────────── */}
        <section className="scroll-mt-24" id="contracts">
          <SectionLabel>Contract Reference</SectionLabel>
          <h2 className="mt-2 text-2xl font-bold text-[#F0F0F0]">Soroban Deployed Contracts</h2>
          <p className="mt-2 text-sm leading-6 text-[#9CA3AF]">
            Terminal8 smart contracts run directly on <code className="font-mono text-xs text-[#F2C12E]">Test SDF Network ; September 2015</code> with persistent on-chain state storage.
          </p>

          {/* Featured PoolVotingContract Card */}
          <div className="mt-6 rounded-2xl border border-[#F2C12E]/40 bg-[#12121A] p-6 shadow-xl">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="rounded-md border border-[#F2C12E]/40 bg-[#F2C12E]/15 px-2.5 py-1 font-mono text-[11px] font-bold text-[#F2C12E]">
                    Soroban Persistent Storage
                  </span>
                  <h3 className="text-xl font-extrabold text-white">PoolVotingContract</h3>
                  <StatusBadge status="live">Active on Testnet</StatusBadge>
                </div>
                <p className="mt-2 text-sm leading-6 text-[#9CA3AF]">
                  Stores on-chain upvote/downvote aggregate scores (<code className="font-mono text-xs text-[#CBD5E1]">Score(Address)</code>) and a master pool discovery list (<code className="font-mono text-xs text-[#CBD5E1]">PoolList</code>) on Stellar Soroban with automatic 30-day TTL extension.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-xs text-[#CBD5E1]">
                  <span className="text-[#9CA3AF]">Contract Address:</span>
                  <code className="rounded bg-[#1E1E2E] px-2.5 py-1 text-[#F2C12E] select-all">{POOL_VOTING_CONTRACT_ID}</code>
                </div>
              </div>
              <a
                href={`https://stellar.expert/explorer/testnet/contract/${POOL_VOTING_CONTRACT_ID}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center justify-center gap-2.5 rounded-xl bg-[#F2C12E] px-5 py-3 font-mono text-xs font-extrabold text-[#0D0D12] shadow-[0_0_20px_rgba(242,193,46,0.3)] transition hover:bg-[#FDE047] hover:shadow-[0_0_25px_rgba(242,193,46,0.5)]"
              >
                <span>View on Stellar Explorer ↗</span>
                <svg className="size-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </a>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#12121A]">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.08] bg-[#181824]">
                  {['Contract Name', 'Contract Address / Explorer Link', 'Network', 'Status'].map((h) => (
                    <th
                      className="px-6 py-4 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#9CA3AF]"
                      key={h}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] font-mono text-xs">
                {[
                  {
                    name: 'PoolVotingContract',
                    addr: POOL_VOTING_CONTRACT_ID,
                    network: 'Testnet',
                    status: 'live' as const,
                  },
                  {
                    name: 'Soroswap AMM Router',
                    addr: 'CAG5LRYQ5JVEUI5TEID72EYOVX44TTUJT5BQR2J6J77FH65PCCFAJDDH',
                    network: 'Testnet',
                    status: 'live' as const,
                  },
                  {
                    name: 'XLM Asset SAC',
                    addr: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
                    network: 'Testnet',
                    status: 'live' as const,
                  },
                  {
                    name: 'USDC Asset SAC',
                    addr: 'CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU',
                    network: 'Testnet',
                    status: 'live' as const,
                  },
                ].map((row, i) => (
                  <tr className="transition-colors hover:bg-white/[0.03]" key={i}>
                    <td className="px-6 py-4 font-semibold text-[#F0F0F0]">{row.name}</td>
                    <td className="px-6 py-4">
                      <a
                        href={`https://stellar.expert/explorer/testnet/contract/${row.addr}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-[#60A5FA] hover:text-[#F2C12E] hover:underline transition"
                        title="Open in Stellar Explorer"
                      >
                        <span>{row.addr.slice(0, 10)}...{row.addr.slice(-8)}</span>
                        <svg className="size-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                        </svg>
                      </a>
                    </td>
                    <td className="px-6 py-4 text-[#CBD5E1]">{row.network}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={row.status}>Live</StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Footer CTA ─────────────────────────────────────────────────── */}
        <div className="mb-10 mt-14 rounded-2xl border border-[#F2C12E]/30 bg-[#F2C12E]/10 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-bold text-[#F0F0F0]">Ready to test live pool operations?</p>
              <p className="mt-1 text-sm text-[#9CA3AF]">
                Connect your wallet on the Home tab or use the API Tester to inspect raw XDR envelopes.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                className="inline-flex items-center gap-2 rounded-xl bg-[#F2C12E] px-5 py-2.5 text-sm font-black tracking-wide text-[#0D0D12] transition hover:bg-[#FDE047]"
                href="#"
              >
                <span>Launch Dashboard</span>
                <svg className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={3.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
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
    live: 'border-[#4ade80]/30 bg-[#4ade80]/15 text-[#4ade80]',
    'in-progress': 'border-[#F2C12E]/30 bg-[#F2C12E]/15 text-[#F2C12E]',
    planned: 'border-white/[0.12] bg-white/[0.06] text-[#9CA3AF]',
  }
  const dots = {
    live: 'bg-[#4ade80]',
    'in-progress': 'bg-[#F2C12E]',
    planned: 'bg-[#9CA3AF]',
  }
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-xs font-semibold ${styles[status]}`}
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
  icon: ReactNode
  title: string
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#12121A] p-6 transition-all hover:border-white/[0.16]">
      <div className="mb-4 flex size-10 items-center justify-center rounded-xl border border-[#F2C12E]/30 bg-[#F2C12E]/15">
        {icon}
      </div>
      <p className="font-bold text-[#F0F0F0]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[#9CA3AF]">{children}</p>
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
    <div className="rounded-xl border border-white/[0.08] bg-[#12121A] p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="font-bold text-[#F0F0F0]">{title}</p>
        <span className="rounded-md border border-[#F2C12E]/30 bg-[#F2C12E]/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#F2C12E]">
          {badge}
        </span>
      </div>
      <p className="mt-2.5 text-sm leading-6 text-[#9CA3AF]">{children}</p>
    </div>
  )
}


function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-[#F2C12E]">{children}</p>
  )
}

function DocsDivider() {
  return <hr className="my-10 border-white/[0.08]" />
}
