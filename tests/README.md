# Tests

This directory contains test files for the StackOdds contracts.

## Structure

- `contract.test.ts` - Tests for the main contract
- `token.test.ts` - Tests for the token contract

## Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:report

# Watch mode
npm run test:watch
```

## Writing Tests

Tests use Vitest and the Clarinet SDK. Example:

```typescript
import { describe, it, expect } from 'vitest';
import { Clarinet } from '@stacks/clarinet-sdk';

describe('My Contract', () => {
  it('should work correctly', async () => {
    // Your test here
  });
});
```

