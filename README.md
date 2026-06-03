# TERMINAL8

> **One interface for all of Stellar DeFi** — batch swaps, risk-adjusted yield routing, pool reputation scoring, and position management built on Soroban.

[![Live on Testnet](https://img.shields.io/badge/v0.1-Live%20on%20Testnet-4ade80?style=flat-square)](https://terminal8.xyz)
[![Stellar](https://img.shields.io/badge/Stellar-Soroban-C8A84B?style=flat-square)](https://stellar.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square)](https://react.dev)

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
