import { describe, it, expect, beforeEach } from 'vitest';
import { tx } from '@stacks/clarinet-sdk';
import { uintCV, stringAsciiCV } from '@stacks/transactions';
import {
  getAccounts, setupAll, createMarket, CONTRACT_ERRORS, err, type TestAccounts,
} from './utils';

// @ts-ignore
declare const simnet: any;

describe('Market Trading', () => {
  let accounts: TestAccounts;
  let marketId: number;

  beforeEach(() => {
    accounts = getAccounts(simnet);
    setupAll(simnet, accounts.deployer);
    marketId = createMarket(simnet, accounts.deployer);
  });

  it('rejects buy-yes on non-existent market', () => {
    const result = simnet.mineBlock([
      tx.callPublicFn('contract', 'buy-yes', [uintCV(99999), uintCV(1_000_000), stringAsciiCV('US')], accounts.user1),
    ]);
    expect(result[0].result).toEqual(err(CONTRACT_ERRORS.MARKET_NOT_FOUND));
  });

  it('rejects buy-no on non-existent market', () => {
    const result = simnet.mineBlock([
      tx.callPublicFn('contract', 'buy-no', [uintCV(99999), uintCV(1_000_000), stringAsciiCV('US')], accounts.user1),
    ]);
    expect(result[0].result).toEqual(err(CONTRACT_ERRORS.MARKET_NOT_FOUND));
  });

  it('rejects buy-yes with zero amount', () => {
    const result = simnet.mineBlock([
      tx.callPublicFn('contract', 'buy-yes', [uintCV(marketId), uintCV(0), stringAsciiCV('US')], accounts.user1),
    ]);
    expect(result[0].result).toEqual(err(CONTRACT_ERRORS.INVALID_PARAMS));
  });

  it('returns market data for a valid market', () => {
    const result = simnet.callReadOnlyFn('contract', 'get-market', [uintCV(marketId)], accounts.deployer);
    expect((result.result as any).type).toBe('ok');
    expect((result.result as any).value.value).toBeDefined();
  });
});
