# Frontend USDCx Integration Updates

## Summary

The frontend has been updated to use **USDCx** instead of **USDC** throughout the user interface and codebase.

## Changes Made

### 1. Constants (`frontend/lib/constants.ts`)
- ✅ Added `USDCX_MAINNET` constant
- ✅ Added `USDCX_TESTNET` constant  
- ✅ Added `getUSDCxAddress()` helper function

### 2. Trading Form (`frontend/components/market/trading-form.tsx`)
- ✅ Updated toast messages: "USDC Approved!" → "USDCx Approved!"
- ✅ Updated error messages: "Failed to approve USDC" → "Failed to approve USDCx"
- ✅ Updated button label: "Approve USDC" → "Approve USDCx"
- ✅ Updated input label: "USDC" → "USDCx"
- ✅ Updated comment: "microSTX" → "USDCx uses 6 decimals"

### 3. Market Creation Form (`frontend/components/market/market-creation-form.tsx`)
- ✅ Updated error messages: "Failed to approve USDC" → "Failed to approve USDCx"
- ✅ Updated form label: "Initial Liquidity (USDC)" → "Initial Liquidity (USDCx)"
- ✅ Updated button label: "Approve USDC" → "Approve USDCx"

## USDCx Contract Addresses

**Mainnet:**
```
SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.usdcx
```

**Testnet:**
```
ST2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.usdcx
```

## Usage in Frontend

To use USDCx address in components:

```typescript
import { USDCX_MAINNET, USDCX_TESTNET, getUSDCxAddress } from "@/lib/constants"

// Direct usage
const usdcxAddress = USDCX_MAINNET // or USDCX_TESTNET

// Or use helper function
const isMainnet = process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet'
const usdcxAddress = getUSDCxAddress(isMainnet)
```

## Next Steps for Full Integration

While the UI has been updated to show USDCx, the following still need implementation:

1. **Token Approval**: Implement USDCx token approval using `@stacks/transactions`
   - Use `makeContractCall` to call USDCx's `approve` function
   - Check allowance using `fetchCallReadOnlyFunction`

2. **Token Transfers**: Implement USDCx transfers for:
   - Market creation (initial liquidity deposit)
   - Buying shares (YES/NO)
   - Claiming winnings

3. **Balance Display**: Show user's USDCx balance
   - Read balance from USDCx contract
   - Display in wallet/header component

4. **Transaction Building**: Use USDCx address in contract calls:
   ```typescript
   import { makeContractCall } from '@stacks/transactions'
   import { USDCX_MAINNET } from '@/lib/constants'
   
   // Approve USDCx
   const approveTx = await makeContractCall({
     contractAddress: 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR',
     contractName: 'usdcx',
     functionName: 'approve',
     functionArgs: [...],
     // ...
   })
   ```

## Current Status

- ✅ **UI Updated**: All references to "USDC" changed to "USDCx"
- ✅ **Constants Added**: USDCx addresses available
- ⏳ **Implementation Pending**: Token approval and transfer functions need Stacks implementation

## Notes

- USDCx uses 6 decimals (same as USDC)
- All amounts should be in micro-units (multiply by 1,000,000)
- USDCx is a SIP-010 compliant token, so standard token functions apply





