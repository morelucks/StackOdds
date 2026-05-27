import { describe, it, expect, beforeEach } from 'vitest';
import { tx } from '@stacks/clarinet-sdk';
import { uintCV, stringAsciiCV, principalCV } from '@stacks/transactions';
import {
  getAccounts, setupAll, CONTRACT_ERRORS, err, okTrue, type TestAccounts,
} from './utils';

// @ts-ignore
declare const simnet: any;

describe('Market Creation', () => {
  let accounts: TestAccounts;

  beforeEach(() => {
    accounts = getAccounts(simnet);
    setupAll(simnet, accounts.deployer);
  });

  it('creates a market successfully', () => {
    const b = simnet.blockHeight;
    const result = simnet.mineBlock([
      tx.callPublicFn('contract', 'create-market', [
        uintCV(1_000_000), uintCV(b + 10), uintCV(b + 100),
        stringAsciiCV('Will BTC reach $100k?'), stringAsciiCV('ipfs-hash-123'),
      ], accounts.deployer),
    ]);
    expect(result[0].result.type).toBe('ok');
  });

  it('increments market count after creation', () => {
    const b = simnet.blockHeight;
    simnet.mineBlock([
      tx.callPublicFn('contract', 'create-market', [
        uintCV(1_000_000), uintCV(b + 10), uintCV(b + 100),
        stringAsciiCV('Test'), stringAsciiCV('ipfs'),
      ], accounts.deployer),
    ]);
    const count = simnet.callReadOnlyFn('contract', 'get-market-count', [], accounts.deployer);
    expect((count.result as any).value.value).toBe(1n);
  });

  it('rejects zero liquidity', () => {
    const b = simnet.blockHeight;
    const result = simnet.mineBlock([
      tx.callPublicFn('contract', 'create-market', [
        uintCV(0), uintCV(b + 10), uintCV(b + 100),
        stringAsciiCV('Test'), stringAsciiCV('ipfs'),
      ], accounts.deployer),
    ]);
    expect(result[0].result).toEqual(err(CONTRACT_ERRORS.ZERO_LIQUIDITY));
  });

  it('rejects when end-time <= start-time', () => {
    const b = simnet.blockHeight;
    const result = simnet.mineBlock([
      tx.callPublicFn('contract', 'create-market', [
        uintCV(1_000_000), uintCV(b + 100), uintCV(b + 10),
        stringAsciiCV('Test'), stringAsciiCV('ipfs'),
      ], accounts.deployer),
    ]);
    expect(result[0].result).toEqual(err(CONTRACT_ERRORS.INVALID_PARAMS));
  });

  it('rejects creation from non-owner', () => {
    const b = simnet.blockHeight;
    const result = simnet.mineBlock([
      tx.callPublicFn('contract', 'create-market', [
        uintCV(1_000_000), uintCV(b + 10), uintCV(b + 100),
        stringAsciiCV('Test'), stringAsciiCV('ipfs'),
      ], accounts.user1),
    ]);
    expect(result[0].result).toEqual(err(CONTRACT_ERRORS.UNAUTHORIZED));
  });

  it('returns the new market ID in the response', () => {
    const b = simnet.blockHeight;
    const result = simnet.mineBlock([
      tx.callPublicFn('contract', 'create-market', [
        uintCV(1_000_000), uintCV(b + 10), uintCV(b + 100),
        stringAsciiCV('Test'), stringAsciiCV('ipfs'),
      ], accounts.deployer),
    ]);
    const marketId = (result[0].result as any).value.value;
    expect(typeof marketId).toBe('bigint');
    expect(marketId).toBeGreaterThanOrEqual(1n);
  });
});
