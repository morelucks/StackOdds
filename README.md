# StackOdds

A decentralised prediction market built on the [Stacks](https://stacks.co) blockchain, using the **LMSR (Logarithmic Market Scoring Rule)** pricing model for automated market making.

## Overview

StackOdds lets users create binary outcome markets (YES / NO), trade shares priced dynamically via LMSR, and claim winnings after resolution. All logic lives on-chain in Clarity smart contracts; the frontend is a Next.js app.

## Repository structure

```
stackodds/
├── contract/          # Clarity smart contracts + tests
│   ├── contracts/
│   │   ├── contract.clar   # Main prediction market contract
│   │   └── token.clar      # SIP-010 collateral token
│   ├── tests/              # Vitest test suite (clarinet-sdk)
│   └── Clarinet.toml
└── frontend/          # Next.js 14 frontend
    ├── app/
    ├── components/
    └── hooks/
```

## Smart contracts

| Contract | Name in Clarinet | Description |
|---|---|---|
| `contracts/contract.clar` | `stackodds` | Market creation, LMSR trading, resolution, LP shares |
| `contracts/token.clar` | `so-token` | SIP-010 fungible token used as collateral |

### Key functions

**`initialize(owner, collateral)`** — Sets the contract owner and collateral token. Only callable by the current owner.

**`set-admin-role(account, enabled)`** — Grants or revokes admin privileges. Owner-only.

**`create-market(b, start, end, question, cid)`** — Creates a new LMSR market with liquidity parameter `b`.

**`buy-yes / buy-no`** — Purchase YES or NO shares; price determined by LMSR.

**`sell-yes / sell-no`** — Sell shares back to the market.

**`resolve-market(market-id, yes-won)`** — Resolves a market after its end time.

**`claim-winnings(market-id)`** — Claim payout for winning shares.

## Running tests

```bash
cd contract
npm install
npm test
```

Tests use [Clarinet SDK](https://github.com/hirosystems/clarinet) with Vitest and run against a local simnet.

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Requires a `.env` file — copy `.env.example` and fill in values.

## Tech stack

- **Contracts** — Clarity 2, Clarinet, Vitest
- **Frontend** — Next.js 14, TypeScript, Tailwind CSS, `@stacks/connect`
- **Pricing** — LMSR with polynomial exp approximation

## License

MIT
