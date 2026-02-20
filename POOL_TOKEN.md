# StackOdds Pool Token (SODDS)

## Overview
A SIP-010 compliant fungible token for the StackOdds platform, designed for liquidity provision and potential governance.

## Token Details
- **Name**: StackOdds Pool Token
- **Symbol**: SODDS
- **Decimals**: 6
- **Standard**: SIP-010 Fungible Token

## Features
- ✅ Full SIP-010 compliance
- ✅ Mint/burn functionality (owner only)
- ✅ Transfer with optional memo
- ✅ Ownership transfer capability
- ✅ Token URI support

## Contract Location
`contracts/pool-token.clar`

## Deployment

### Local Testing
```bash
# Check contracts
clarinet check

# Test in console
clarinet console
```

### Mainnet Deployment
```bash
# Deploy to mainnet
node scripts/deploy-pool-token.cjs
```

## Usage Examples

### Mint Tokens (Owner Only)
```clarity
(contract-call? .pool-token mint u1000000 'SP...)
```

### Transfer Tokens
```clarity
(contract-call? .pool-token transfer u100000 tx-sender 'SP... none)
```

### Check Balance
```clarity
(contract-call? .pool-token get-balance 'SP...)
```

### Get Total Supply
```clarity
(contract-call? .pool-token get-total-supply)
```

## Integration with StackOdds

The pool token can be used for:
1. **Liquidity Provider Rewards**: Distribute SODDS to LPs
2. **Governance**: Future DAO voting rights
3. **Fee Sharing**: Protocol revenue distribution
4. **Staking**: Lock tokens for benefits

## Security
- Owner-only minting prevents unauthorized token creation
- Standard SIP-010 implementation ensures compatibility
- Transfer authorization checks prevent unauthorized moves

## Next Steps
1. ✅ Contract created and validated
2. ⏳ Deploy to mainnet
3. ⏳ Integrate with main StackOdds contract
4. ⏳ Set up liquidity mining program
