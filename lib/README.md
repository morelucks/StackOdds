# Shared Library

This directory contains shared utilities used across the project (deployment scripts, frontend, tests).

## Files

- `stacks-client.ts` - Shared Stacks network and client utilities

## Usage

```typescript
import { getNetwork, getApiUrl, parseContractAddress } from '../lib/stacks-client';

const network = getNetwork('mainnet');
const apiUrl = getApiUrl('mainnet');
const { contractAddress, contractName } = parseContractAddress('SP123...contract');
```




