# StackOdds

A prediction market platform built on Stacks using the Logarithmic Market Scoring Rule (LMSR) mechanism, integrated with **USDCx** for stablecoin liquidity.

**🏆 Built for the Programming USDCx on Stacks Builder Challenge**

## Overview

StackOdds implements a prediction market system on the Stacks blockchain using Clarity smart contracts. The system allows users to:

- Create prediction markets on various topics
- Buy YES or NO shares based on their predictions
- Resolve markets when outcomes are determined
- Claim winnings based on their share holdings

## Contracts

### `outcome-token.clar`

An outcome-token-style SIP-010 fungible token contract that manages outcome tokens for each market. Each market has two outcome tokens:
- **YES token** (outcome = 1): Represents a bet that the market outcome will be YES
- **NO token** (outcome = 0): Represents a bet that the market outcome will be NO

**Key Functions:**
- `initialize(owner)`: Initialize the contract with the market contract as owner
- `mint(token-id, recipient, amount)`: Mint outcome tokens (only callable by market contract)
- `burn(token-id, owner, amount)`: Burn outcome tokens (only callable by market contract)
- `transfer(token-id, amount, sender, recipient)`: Transfer tokens between users
- `get-balance(token-id, owner)`: Get balance of a specific outcome token

### `lmsr-market.clar`

The main prediction market contract implementing the LMSR-style pricing mechanism (simplified in this prototype).

**Key Functions:**
- `initialize(owner, collateral, outcome-token)`: Initialize the market contract
- `create-market(b, start-time, end-time, question, c-id)`: Create a new prediction market
- `buy-yes(market-id, amount)`: Buy YES shares in a market
- `buy-no(market-id, amount)`: Buy NO shares in a market
- `resolve-market(market-id, yes-won)`: Resolve a market (admin/moderator only)
- `claim(market-id)`: Claim winnings for resolved markets
- `price-yes(market-id)`: Get current price of YES shares
- `price-no(market-id)`: Get current price of NO shares
- `cost(market-id)`: Get current cost function value

**Access Control:**
- `set-admin-role(principal, enabled)`: Grant/revoke admin role
- `set-moderator-role(principal, enabled)`: Grant/revoke moderator role

## LMSR Pricing

The Logarithmic Market Scoring Rule uses the following formulas:

- **Cost Function**: `C = b * ln(exp(qYes/b) + exp(qNo/b))`
- **YES Price**: `pYes = exp(qYes/b) / (exp(qYes/b) + exp(qNo/b))`
- **NO Price**: `pNo = exp(qNo/b) / (exp(qYes/b) + exp(qNo/b))`

Where:
- `b` = liquidity parameter
- `qYes` = quantity of YES shares sold
- `qNo` = quantity of NO shares sold

## Usage

### Setup

1. Install dependencies:
```bash
npm install
```

2. Run tests:
```bash
npm test
```

### Deployment

1. **Deploy Contracts:**
```bash
# Deploy token and contract to mainnet
npx tsx scripts/deploy/deploy-mainnet.ts
```

2. **Initialize Contracts:**
⚠️ **CRITICAL**: After deployment, you MUST initialize the contract with a **contract principal** (address.contract-name) for the collateral token, not just an address!

```bash
# Initialize the contract with USDCx (for hackathon)
npx tsx scripts/interact/initialize-contract.ts \
  <owner-address> \
  SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.usdcx

# Example with your deployer address:
npx tsx scripts/interact/initialize-contract.ts \
  SP1EQNTKNRGME36P9EEXZCFFNCYBA50VN51676JB \
  SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.usdcx
```

**Important Notes:**
- `collateral-token` **MUST** be a contract principal (format: `address.contract-name`)
- Outcome token functionality is now merged into the main contract (no separate token needed)
- For USDCx integration, use: `SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.usdcx`
- See [USDCX_INTEGRATION.md](./USDCX_INTEGRATION.md) for detailed integration guide

### Creating a Market

1. Initialize the market contract with USDCx as collateral token (see initialization above)
2. Call `create-market` with:
   - `b`: Liquidity parameter (in USDCx's 6-decimal format, e.g., 1000000 for 1 USDCx)
   - `start-time`: Block height when market starts
   - `end-time`: Block height when market ends
   - `question`: Market question (max 256 characters)
   - `c-id`: IPFS CID for market metadata

### Buying Shares

Users can buy YES or NO shares by calling:
- `buy-yes(market-id, amount)` - Buy YES shares
- `buy-no(market-id, amount)` - Buy NO shares

The amount should be in USDCx's 6-decimal format (e.g., 1000000 = 1 USDCx).

### Resolving Markets

Only admins or moderators can resolve markets after the end time:
```clarity
(resolve-market market-id true)  ; YES won
(resolve-market market-id false) ; NO won
```

### Claiming Winnings

After a market is resolved, users holding winning shares can claim:
```clarity
(claim market-id)
```

This burns their winning outcome tokens and transfers the equivalent amount of USDCx (1:1 ratio).

## Technical Notes

### Contract Principal Requirements

The `contract.clar` uses dynamic contract calls with variable principals. This has important implications:

1. **Static Analyzer Warnings**: The contract will show "missing contract name for call" errors during `clarinet check`. This is **expected** and does not prevent runtime execution when contract principals are used correctly.

2. **Why token.clar builds but contract.clar doesn't**: 
   - `token.clar` has no `contract-call?` calls → builds fine
   - `contract.clar` has `contract-call?` calls with variable principals → static analyzer error (but works at runtime)

3. **Contract Principals Required**: When initializing, always use contract principals:
   - ✅ Correct: `SP1EQNTKNRGME36P9EEXZCFFNCYBA50VN51676JB.token`
   - ❌ Wrong: `SP1EQNTKNRGME36P9EEXZCFFNCYBA50VN51676JB`

### Other Technical Notes

- The contract uses fixed-point arithmetic for LMSR calculations
- Exponential and logarithm functions are approximated using Taylor series
- All internal calculations use 18-decimal precision
- Token amounts are converted between token decimals (typically 6 for USDC) and internal 18-decimal format
- Markets require initial funding of `b * ln(2)` from the creator

## License

MIT