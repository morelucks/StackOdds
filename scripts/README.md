# Scripts

This directory contains deployment and interaction scripts for the StackOdds contracts.

## Structure

- `deploy/` - Contract deployment scripts
- `interact/` - Contract interaction scripts

## Usage

### Deployment

```bash
# Deploy to mainnet
npx tsx scripts/deploy/deploy-mainnet.ts
```

### Initialization

⚠️ **CRITICAL**: After deploying the contract, you MUST initialize it with **contract principals** (address.contract-name), not just addresses!

```bash
# Initialize contract (with defaults)
npx tsx scripts/interact/initialize-contract.ts

# Initialize contract with USDCx (for hackathon)
npx tsx scripts/interact/initialize-contract.ts <owner> <collateral-token>

# Example with USDCx:
npx tsx scripts/interact/initialize-contract.ts \
  SP1EQNTKNRGME36P9EEXZCFFNCYBA50VN51676JB \
  SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.usdcx
```

**Important Notes:**
- `collateral-token` **MUST** be a contract principal (format: `address.contract-name`)
- Outcome token functionality is now merged into the main contract (no separate token needed)
- For USDCx integration, use: `SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.usdcx`
- See [USDCX_INTEGRATION.md](../USDCX_INTEGRATION.md) for detailed integration guide

### Interaction

```bash
# Interact with token contract
npx tsx scripts/interact/interact-token.ts <command> [args...]

# Run 12 interactions
npx tsx scripts/interact/interact-token-12x.ts
```

## Contract Principal Requirements

The `contract.clar` uses dynamic contract calls with variable principals. This requires:

1. **Contract Principals**: When initializing, pass `address.contract-name` format
   - ✅ Correct: `SP1EQNTKNRGME36P9EEXZCFFNCYBA50VN51676JB.token`
   - ❌ Wrong: `SP1EQNTKNRGME36P9EEXZCFFNCYBA50VN51676JB`

2. **Static Analyzer Warnings**: The contract will show "missing contract name for call" errors during `clarinet check`. This is **expected** and does not prevent runtime execution when contract principals are used correctly.

3. **Why token.clar builds but contract.clar doesn't**: 
   - `token.clar` has no `contract-call?` calls → builds fine
   - `contract.clar` has `contract-call?` calls with variable principals → static analyzer error (but works at runtime)

## Security

⚠️ **Important**: These scripts read private keys from `.env` file. Never commit:
- `.env` file
- Scripts with hardcoded keys
- Deployment configurations with sensitive data




