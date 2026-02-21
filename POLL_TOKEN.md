# StackOdds Poll Token (SPOLL)

## Overview
A SIP-010 compliant fungible token for the StackOdds platform, specifically designed for governance, polling, and community engagement.

## Token Details
- **Name**: StackOdds Poll Token
- **Symbol**: SPOLL
- **Decimals**: 6
- **Standard**: SIP-010 Fungible Token
- **Contract Address**: `SP34MN3DMM07BNAWYJSHTS4B08T8JRVK8AT810X1B.stackoddpoll`

## Features
- ✅ Full SIP-010 compliance
- ✅ Mint/burn functionality (owner only)
- ✅ Transfer with optional memo
- ✅ Ownership transfer capability
- ✅ Token URI support

## Contract Location
`contracts/stackoddpoll.clar`

## Deployment Details (Mainnet)
- **TX ID**: `b1ea1ae10a672bae07ebf24a0b304a232c4a2d4886d362b833cb4ffed7c67442`
- **Explorer**: [View on Stacks Explorer](https://explorer.hiro.so/txid/b1ea1ae10a672bae07ebf24a0b304a232c4a2d4886d362b833cb4ffed7c67442?chain=mainnet)

## Usage Examples

### Mint Tokens (Owner Only)
```clarity
(contract-call? 'SP34MN3DMM07BNAWYJSHTS4B08T8JRVK8AT810X1B.stackoddpoll mint u1000000 'SP...)
```

### Transfer Tokens
```clarity
(contract-call? 'SP34MN3DMM07BNAWYJSHTS4B08T8JRVK8AT810X1B.stackoddpoll transfer u100000 tx-sender 'SP... none)
```

### Check Balance
```clarity
(contract-call? 'SP34MN3DMM07BNAWYJSHTS4B08T8JRVK8AT810X1B.stackoddpoll get-balance 'SP...)
```

## Security
- Owner-only minting prevents unauthorized token creation.
- Standard SIP-010 implementation ensures broad compatibility with wallets and exchanges.
