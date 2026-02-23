# Stacks Integration

## Dependencies

This project uses the official Stacks libraries:

### @stacks/connect (v8.2.4)
Used for wallet connection and transaction signing:
- `openContractCall` - Contract interactions
- `connect` - Wallet connection
- `disconnect` - Wallet disconnection
- `isConnected` - Connection status
- `getLocalStorage` - Session management

### @stacks/transactions (v7.3.1)
Used for transaction construction and data handling:
- `callReadOnlyFunction` - Read-only contract calls
- `fetchCallReadOnlyFunction` - Async read-only calls
- `cvToJSON` - Clarity value conversion
- `hexToCV` - Hex to Clarity value
- `uintCV`, `principalCV`, `boolCV`, `stringAsciiCV` - Clarity value constructors
- `contractPrincipalCV` - Contract principal values
- `PostConditionMode` - Transaction post-conditions

## Usage Locations

### Frontend
- `/frontend/lib/stacks-transactions.ts` - Core transaction logic
- `/frontend/lib/usdcx-approval.ts` - Token approvals
- `/frontend/lib/resolve-market.ts` - Market resolution
- `/frontend/lib/claim-winnings.ts` - Claiming winnings
- `/frontend/lib/market-queries.ts` - Market data queries
- `/frontend/lib/usdcx-balance.ts` - Balance queries
- `/frontend/hooks/useStacks.ts` - Wallet connection hook
- `/frontend/hooks/useMarkets.ts` - Markets data hook
- `/frontend/hooks/useMarket.ts` - Single market hook
- `/frontend/hooks/useVault.ts` - Vault interactions

### Tests
- All test files use `@stacks/transactions` for Clarity value construction

## Integration Status
✅ Fully integrated across frontend and backend
✅ Used for all wallet interactions
✅ Used for all contract calls
✅ Used for all read-only queries
