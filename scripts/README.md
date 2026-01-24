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

### Interaction

```bash
# Interact with token contract
npx tsx scripts/interact/interact-token.ts <command> [args...]

# Run 12 interactions
npx tsx scripts/interact/interact-token-12x.ts
```

## Security

⚠️ **Important**: These scripts read private keys from `.env` file. Never commit:
- `.env` file
- Scripts with hardcoded keys
- Deployment configurations with sensitive data




