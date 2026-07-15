# TERMINAL8

> **One interface for all of Stellar DeFi** — batch swaps, risk-adjusted yield routing, pool reputation scoring, and position management built on Soroban.

[![Live on Testnet](https://img.shields.io/badge/v0.3-Live%20on%20Testnet-4ade80?style=flat-square)](https://terminal8.xyz)
[![CI](https://img.shields.io/badge/CI-GitHub%20Actions-2088FF?style=flat-square)](https://github.com/terminal8/protocol/actions)
[![Stellar](https://img.shields.io/badge/Stellar-Soroban-C8A84B?style=flat-square)](https://stellar.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square)](https://react.dev)

---

## The Problem

Stellar's DeFi ecosystem has **$300M+ in TVL** spread across multiple decentralized protocols — with no unified interface to manage it.

- Users need multiple separate applications to access lending, liquidity provisioning, and reward positions
- Most wallets hold idle trustlines earning 0% yield
- There is **no trust signal** for liquidity pools — no reputation score, no audit visibility
- LP positions are complex and opaque for non-technical users

---

## What We Built

Terminal8 is a composable DeFi routing and yield management dashboard on Stellar Soroban.

### Core Features

**⚡ Batch Swap Engine**  
Sweeps multiple dust trustlines into a single target asset (USDC or XLM) via Horizon pathfinding in one fee-bumped transaction envelope.

**🛡 Pool Reputation & Trust Oracle**  
Every pool is scored 0–100 across four axes:
- **Liquidity Depth** (40pts) — TVL depth and pool stability
- **Protocol Age** (20pts) — time since first deployment
- **Security Audit Status** (20pts) — security review history
- **Activity & Volume** (20pts) — 30-day trading volume rank

**🎯 Risk Profiling Quiz**  
3-question onboarding determines the user's risk profile (Conservative / Moderate / Aggressive) and personalizes all liquidity recommendations.

**📦 Yield Bundles**  
One-click multi-pool allocation. "Balanced Bundle" splits funds smoothly into liquidity positions in a single flow — each with its own Freighter signature and real Soroban transaction.

**📊 Position Management**  
Open, track, and exit yield positions across top pools. Real-time estimated earnings and instant withdrawal via Freighter-signed transactions.

**💻 Developer CLI Terminal**  
Power users manage everything through an in-app terminal command suite (`positions`, `withdraw`, `pools`, `balance`, `whoami`).

---

## Technology Stack & Architecture

This section details the full-stack technologies, infrastructure tools, libraries, and architectural decisions used across both the Terminal8 Dashboard UI and the NestJS API. Each technology was selected to provide modern, scalable, and secure blockchain integration with high throughput and strict type safety.

### Frontend & Client Layer (Dashboard UI)

- **React 19 & Vite (v6.0)**: Modern, highly performant component architecture utilizing React 19 concurrent rendering, hot module replacement, and ultra-fast production builds via Vite.
- **TypeScript (v5.6+)**: Strictly typed UI layer guaranteeing exact shape alignment between client components, custom hooks, XDR payload generators, and backend API responses.
- **Tailwind CSS (v3.4.17)**: Utility-first styling architecture delivering responsive layouts across mobile and desktop, rich glassmorphism (`backdrop-blur`), curated dark-mode aesthetics, and smooth micro-animations.
- **Stellar Wallets Kit & Freighter API (`@creit.tech/stellar-wallets-kit` & `@stellar/freighter-api`)**: Seamless multi-wallet connection layer supporting **Freighter, xBull, LOBSTR, and Albedo**. Handles cryptographic account challenge verification (`signAuthEntry`), raw XDR transaction authorization (`signTransaction`), and active network detection.
- **Data Visualization & Icons (`recharts` & `lucide-react`)**: Interactive historical APY curves and pool yield charts powered by Recharts alongside crisp, lightweight vector iconography across all interface panels.
- **Interactive Terminal & State Management (`WalletContext`, `usePoolDashboard`)**: Custom modular hooks and an embedded interactive CLI terminal (`positions`, `withdraw`, `pools`, `balance`, `whoami`) enabling advanced users to execute live on-chain operations directly from a command prompt.

---

### Backend Layer (Terminal8 API & NestJS)

#### 1. Core Framework & Language

- **Node.js (v20+) & V8 Engine**: Runs our asynchronous, non-blocking I/O server environment. Perfectly suited for handling intensive network requests to Stellar Horizon and Soroban RPC nodes without I/O bottlenecks.
- **TypeScript (v5.1)**: Built entirely in strict TypeScript. Type safety is enforced across every layer from API DTOs down to database entities, avoiding `any` types and utilizing clean composition over complex inheritance.
- **NestJS (v10.0)**: Our primary enterprise-grade architectural framework. Utilizes modular domain separation (e.g., `HistoryModule`, `TestnetToolsModule`), Dependency Injection (DI) for loosely coupled service providers, and strict Receive-Object/Return-Object (RO-RO) patterns.

### 2. Blockchain & Stellar Integration

- **`@stellar/stellar-sdk` (v12.3)**: Core library providing full integration with the Stellar network and Soroban engine.
  - **XDR Envelope Construction**: Builds all smart contract operations (`TransactionBuilder`), liquidity pool (LP) deposits, trustlines, and token transfers on the backend. Transactions are transmitted to the frontend as XDR envelopes for Freighter wallet signing or partially signed with backend security keys.
  - **Horizon API Requests**: Connects directly to Stellar Testnet and Mainnet Horizon instances for account validation, real-time balance queries, sequence tracking, and deterministic `poolId` resolution (`getLiquidityPoolId`).
  - **Background Indexer**: Periodically scans the Horizon network for transaction history and synchronizes active user portfolio positions automatically.

### 3. Database & ORM Layer

- **PostgreSQL (v16 Alpine)**: Persistent relational database. Ensures strict ACID compliance when storing user transaction histories (`History`), profile metadata, and financial activity logs.
- **TypeORM (v0.3.20)**: Robust Object-Relational Mapping layer. Tables are defined as strictly typed classes using `@Entity` and `@Column` decorators, keeping data access (`@InjectRepository`) completely isolated from core business logic.

### 4. Caching, Queues & Background Workers

- **Redis (v7 Alpine) & ioredis (v5)**: High-speed in-memory data store. Used alongside `@nestjs/cache-manager` (`cache-manager-ioredis-yet` adapter) to cache repetitive Horizon queries and heavy computations.
- **BullMQ (v5.7) & `@nestjs/bullmq`**: Redis-powered message and job queue. Offloads long-running indexing tasks and periodic CRON jobs to asynchronous worker processes equipped with automatic retry mechanisms.

### 5. Security, Authentication & Validation

- **JSON Web Token (JWT) & Passport.js**: Stateless authentication mechanism via `@nestjs/jwt` and `passport-jwt`. Custom route guards (`@UseGuards`) protect API endpoints after verifying wallet challenges.
- **Class Validator & Class Transformer**: Acts as our primary request firewall. Incoming JSON payloads are intercepted and validated against strict decorators (`@IsString()`, `@IsNotEmpty()`, `@IsOptional()`), throwing immediate HTTP 400 Bad Request errors on malformed inputs.
- **Joi (v17.13)**: Validates environment variables (`.env`) during application startup, preventing deployment if required database parameters or Horizon RPC URLs are missing or invalid.

### 6. API Documentation & DevOps Infrastructure

- **Swagger (OpenAPI 3.0)**: Live, automated OpenAPI documentation (`@nestjs/swagger`) accessible directly at `/api/v1/docs` for immediate interactive request testing.
- **Docker & Docker Compose**: Containerized multi-service architecture (`docker-compose up -d`) orchestrating our NestJS API, PostgreSQL database, and Redis server inside an isolated Docker network.
- **Jest & Supertest**: Full test coverage ensuring unit test isolation for business services (`ts-jest`) and comprehensive end-to-end (E2E) HTTP scenario verification.

---

## Soroban Smart Contract Reference

Terminal8's on-chain pool trust scoring and community upvote/downvote scores are persisted directly on Stellar Soroban via our dedicated voting contract.

| Property | Details |
|---|---|
| **Contract Name** | `PoolVotingContract` |
| **Contract Address / ID** | `CDYRNT2EBC3KJPYMCN3K7YWEIH5LS355TRJ25HPIEZYMAKFXFLM3XMZN` |
| **Network** | Stellar Testnet (`Test SDF Network ; September 2015`) |
| **Stellar Explorer** | [↗ View Contract on Stellar Expert Explorer](https://stellar.expert/explorer/testnet/contract/CDYRNT2EBC3KJPYMCN3K7YWEIH5LS355TRJ25HPIEZYMAKFXFLM3XMZN) |

---

## Why Terminal8?

The name reflects our philosophy: **terminal-first DeFi**. The interface gives retail users a clean visual layer while exposing the full power of Stellar's primitives to developers through a real CLI terminal.

- Unified yield routing across Stellar liquidity pools
- Pool trust scoring with on-chain verifiable inputs
- One-click multi-pool allocation bundles
- Developer CLI with real transaction execution

---

## License

MIT
