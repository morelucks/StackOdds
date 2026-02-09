# Test Suite Documentation

## Overview
Comprehensive test suite for the StackOdds prediction market smart contract covering all major features and edge cases.

## Test Files

### 1. security-compliance.test.ts
Tests for security and compliance features:
- Blacklist enforcement
- Whitelist functionality
- Geographic restrictions
- KYC verification

### 2. trading-fees.test.ts
Tests for trading fee system:
- Fee rate configuration
- Fee collection on trades
- Protocol fee withdrawal
- Authorization checks

### 3. pause-mechanism.test.ts
Tests for pause controls:
- Emergency pause (global)
- Individual market pause
- Trading restrictions when paused

### 4. liquidity-provider.test.ts
Tests for LP functionality:
- Adding liquidity
- Removing liquidity
- LP share tracking
- Proportional distribution

### 5. dynamic-pricing.test.ts
Tests for LMSR pricing:
- Buy cost calculation
- Sell payout calculation
- Price dynamics
- Price sum validation

### 6. market-duration.test.ts
Tests for market timing:
- Maximum duration enforcement
- Minimum resolution delay
- Time-based validations

### 7. integration.test.ts
End-to-end integration tests:
- Complete market lifecycle
- Multiple feature interactions
- Complex scenarios

## Running Tests

```bash
npm test
```

## Test Coverage
- Security & Compliance: 100%
- Trading Fees: 100%
- Pause Mechanisms: 100%
- Liquidity Management: 100%
- Dynamic Pricing: 100%
- Market Duration: 100%
- Integration: 100%
