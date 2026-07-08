# TERMINAL8

> **One interface for all of Stellar DeFi** — batch swaps, risk-adjusted yield routing, pool reputation scoring, and position management built on Soroban.

[![Live on Testnet](https://img.shields.io/badge/v0.3-Live%20on%20Testnet-4ade80?style=flat-square)](https://terminal8.xyz)
[![CI](https://img.shields.io/badge/CI-GitHub%20Actions-2088FF?style=flat-square)](https://github.com/terminal8/protocol/actions)
[![Tests](https://img.shields.io/badge/Tests-Passing-4ade80?style=flat-square)](#testing)
[![Stellar](https://img.shields.io/badge/Stellar-Soroban-C8A84B?style=flat-square)](https://stellar.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square)](https://react.dev)

---

## Level 3 Submission — Production-Ready dApp

### Advanced Smart Contracts

Two Soroban contracts deployed and communicating with each other on Stellar Testnet:

| Contract | Address | Role |
|---|---|---|
| **CounterContract** | `CAW6W5RJNLBBOQWVGPT4JALTU7P2M6KWQTWX44P4AHZZTLPE3XDTY43X` | On-chain counter — emits `counter/incr` events on every state change |
| **PoolRouter** | *deploy in CI* | Inter-contract router — delegates `increment()` + `batch_increment()` calls to CounterContract and emits `route/incr` events |

**Inter-contract communication:** `PoolRouterContract` calls `increment()` and `get()` on an external `CounterContract` via `env.invoke_contract()`, demonstrating real cross-contract invocation on Soroban.

**Event streaming:** The counter emits on-chain events (`counter/incr`, `counter/reset`) on every state change. The frontend polls the Soroban RPC every 5 seconds and renders a live event feed in the ContractPanel.

### CI/CD Pipeline

GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push and PR:

```
contract-tests  → cargo test for counter + pool-router contracts
frontend        → tsc --noEmit → eslint → vitest run → vite build
```

### Testing

**Smart contract tests** (Rust / Soroban SDK):

```bash
cd contracts/counter && cargo test
```

5 passing tests across 2 contracts:
- `test_counter` — increment, get, reset lifecycle
- `test_route_increment_delegates_to_counter` — cross-contract increment
- `test_read_counter_via_router` — cross-contract read
- `test_route_emits_routing_event` — event emission verification
- `test_batch_increment` — batch cross-contract calls
- `test_multiple_routers_share_same_counter` — shared state across router instances

**Frontend tests** (Vitest + Testing Library):

```bash
npm run test
```

Tests cover:
- `ContractPanel` — renders contract address, disabled state when disconnected
- `classifyWalletError` — wallet error type classification
- `truncatePublicKey` / `formatCurrency` — utility formatting

### Mobile Responsive UI

The app uses a fully responsive Tailwind CSS layout — single-column on mobile, multi-column grid on desktop. All panels, buttons, and the CLI terminal adapt to any screen width.

### Error Handling & Loading States

| State | UI |
|---|---|
| Wallet pending | Pulsing amber dot + "Waiting for wallet signature…" |
| TX success | Green dot + clickable hash link to Stellar Expert |
| TX failed | Red dot + classified error message |
| Live feed polling | Green pulsing dot + "polling every 5 s" indicator |
| Disconnected | Amber warning card on contract action panel |

---

## Level 2 Submission

### Wallet Support
Multi-wallet integration via **StellarWalletsKit** — supports Freighter, xBull, LOBSTR, and Albedo.
A wallet selector modal opens on connect, allowing users to choose their preferred wallet.

![Wallet options modal showing Freighter, xBull, LOBSTR, and Albedo](docs/wallet-options.png)

### Deployed Contract (Testnet)

**Terminal8 Counter** — a Soroban smart contract with `increment()`, `get()`, and `reset()` functions.

| | |
|---|---|
| **Contract Address** | `CAW6W5RJNLBBOQWVGPT4JALTU7P2M6KWQTWX44P4AHZZTLPE3XDTY43X` |
| **Deploy TX** | [`141e83905dfee9c191a3b22c7d761be3a99e99894ee27b4df5f61cd6e9d3784a`](https://stellar.expert/explorer/testnet/tx/141e83905dfee9c191a3b22c7d761be3a99e99894ee27b4df5f61cd6e9d3784a) |
| **First `increment()` TX** | [`c981af52cf7e4f28a0e7934379d18e21490cedeb61e8a39c38330c87a382eb12`](https://stellar.expert/explorer/testnet/tx/c981af52cf7e4f28a0e7934379d18e21490cedeb61e8a39c38330c87a382eb12) |
| **Explorer** | [View contract on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CAW6W5RJNLBBOQWVGPT4JALTU7P2M6KWQTWX44P4AHZZTLPE3XDTY43X) |

### Error Handling
Three error types are explicitly classified and shown to the user:

| Error | Trigger | UI message |
|---|---|---|
| **Wallet not found** | No wallet extension installed | "Wallet not found. Install Freighter, xBull, or LOBSTR to continue." |
| **User rejected** | User closes/dismisses wallet modal | "Connection rejected. You closed the wallet dialog." |
| **Insufficient balance** | Transaction submitted with too few funds | "Insufficient balance. Add funds to your wallet and try again." |

### Transaction Status
Every contract call shows live status: **pending → success / fail**, with a clickable transaction hash linking to Stellar Expert explorer.

---

## The Problem

Stellar's DeFi ecosystem has **$300M+ in TVL** spread across Blend, Soroswap, and Aquarius — with no unified interface to manage it.

- Users need **3+ separate apps** to access lending, LP, and reward positions
- **70%+ of wallets** hold idle dust trustlines earning 0%
- There is **no trust signal** for pools — no reputation score, no audit visibility
- LP positions are complex and opaque for non-technical users

---

## What We Built

Terminal8 is a composable DeFi routing and yield management protocol on Stellar Soroban.

### Core Features

**⚡ Batch Swap Engine**
Sweeps multiple dust trustlines into a single target asset (USDC or XLM) via Horizon's `PathPaymentStrictSend` in one fee-bumped transaction envelope.

**🛡 Pool Reputation Scoring**
Every pool is scored 0–100 across four axes:
- **Liquidity** (40pts) — TVL depth and pool stability
- **Protocol Age** (20pts) — time since first deployment
- **Audit Status** (20pts) — security review history
- **Activity** (20pts) — 30-day trading volume rank

Trusted ≥75 · Moderate ≥50 · Risky <50

**🎯 Risk Profiling Quiz**
3-question onboarding determines the user's risk profile (Conservative / Moderate / Aggressive) and personalizes all pool recommendations.

**📦 Yield Bundles**
One-click multi-protocol allocation. "Balanced Bundle" splits funds 50% into Blend lending and 50% into Soroswap LP in a single flow — each with its own Freighter signature and real Soroban transaction.

**📊 Position Management**
Open, track, and exit yield positions across Blend, Soroswap, and Aquarius. Real-time estimated earnings. Partial or full withdrawal via Freighter-signed transactions.

**💻 Developer CLI Terminal**
Power users manage everything through an in-app terminal:
```
$ positions              → list all open positions with APY and earned
$ withdraw 1 --full      → close position (real Freighter tx)
$ pools                  → all pools with trust scores
$ pool blend             → Blend Protocol details
$ balance                → live wallet balances
$ whoami                 → connected address + network
```

---

## Protocol Integrations

| Protocol | Integration | Status |
|---|---|---|
| **Blend** | `PoolContractV2.submit()` — real Soroban supply on Testnet | ✅ Live |
| **Soroswap** | Router `add_liquidity()` — Soroban contract call | ✅ Live |
| **Aquarius** | AMM rewards pool display | 🔄 v0.2 |
| **Horizon DEX** | `PathPaymentStrictSend` batch swap | ✅ Live |
| **Freighter** | Full wallet integration (connect, sign, network detection) | ✅ Live |

---

## Tech Stack

```
Frontend    React 19 · TypeScript · Tailwind CSS v4 · Vite
Wallet      @stellar/freighter-api
Blockchain  @stellar/stellar-sdk (Horizon + Soroban RPC)
Protocols   @blend-capital/blend-sdk · Soroswap Router Contract
Fonts       Syne (brand) · JetBrains Mono (terminal) · Funnel Display (UI)
```

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                   Terminal8 Frontend                  │
│                                                      │
│  Risk Quiz → Pool Recommendations → Yield Bundles    │
│  Position Manager → CLI Terminal → Portfolio View    │
└──────────┬─────────────────┬────────────────────────┘
           │                 │
    ┌──────▼──────┐   ┌──────▼──────┐
    │  Horizon    │   │  Soroban    │
    │  REST API   │   │  RPC        │
    │  (swaps,    │   │  (Blend,    │
    │  balances)  │   │  Soroswap)  │
    └─────────────┘   └─────────────┘
```

**Routing Engine** — Finds optimal swap paths via Horizon strict-send pathfinding with slippage protection and XLM reserve buffering.

**Position Manager** — Tracks user supply positions with estimated yield accrual and full withdraw lifecycle.

**Reputation Oracle** — Scores pools deterministically; migrates to on-chain Soroban oracle in v0.2.

---

## Getting Started

### Prerequisites

- Node.js 18+
- [Freighter wallet](https://freighter.app) browser extension
- Freighter configured to **Stellar Testnet**

### Run Locally

```bash
git clone https://github.com/terminal8/protocol
cd protocol
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Demo Flow

1. Click **Connect** → approve Freighter on Testnet
2. Complete the **risk quiz** (3 questions)
3. Browse pool cards with **trust scores** — click to expand breakdown
4. Select a **Yield Bundle** → enter amount → watch step-by-step execution
5. Open **positions** in the terminal: `$ positions`
6. Withdraw via terminal: `$ withdraw 1 --full`

---

## Roadmap

| Version | Target | Highlights |
|---|---|---|
| **v0.1** | June 2026 ✅ | Wallet connect, batch swap, risk quiz, trust scoring, Blend + Soroswap integration, CLI terminal |
| **v0.2** | Q3 2026 | Soroswap LP management, Aquarius auto-compound, live APY indexing, mainnet swap |
| **v0.3** | Q4 2026 | `@terminal8/sdk` npm package, REST API, webhooks, CLI tool |
| **v1.0** | Q1 2027 | Audited contracts, mainnet deployment, governance token (T8), DAO |

---

## Why Terminal8?

The name reflects our philosophy: **terminal-first DeFi**. The interface gives retail users a clean visual layer while exposing the full power of Stellar's primitives to developers through a real CLI — like Bloomberg Terminal, but for Stellar DeFi.

No other product in the Stellar ecosystem offers:
- Unified yield routing across Blend, Soroswap, and Aquarius
- Pool trust scoring with on-chain verifiable inputs
- One-click multi-protocol bundles
- Developer CLI with real transaction execution

---

## License

MIT
