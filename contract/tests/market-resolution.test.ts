import { describe, it, expect, beforeEach } from 'vitest';
import { tx } from '@stacks/clarinet-sdk';
import { uintCV, boolCV } from '@stacks/transactions';
import {
  getAccounts, setupAll, createMarket, mineBlocks,
  CONTRACT_ERRORS, err, okTrue, type TestAccounts,
} from './utils';

// @ts-ignore
declare const simnet: any;

describe('Market Resolution', () => {
  let accounts: TestAccounts;
  let marketId: number;

  beforeEach(() => {
    accounts = getAccounts(simnet);
    setupAll(simnet, accounts.deployer);
    marketId = createMarket(simnet, accounts.deployer, { startOffset: 10, endOffset: 20 });
  });

  it('rejects resolution before end time', () => {
    const result = simnet.mineBlock([
      tx.callPublicFn('contract', 'resolve-market', [uintCV(marketId), boolCV(true)], accounts.deployer),
    ]);
    expect(result[0].result).toEqual(err(CONTRACT_ERRORS.NOT_EXPIRED));
  });

  it('resolves market after end time', () => {
    mineBlocks(simnet, 25);
    const result = simnet.mineBlock([
      tx.callPublicFn('contract', 'resolve-market', [uintCV(marketId), boolCV(true)], accounts.deployer),
    ]);
    expect(result[0].result).toEqual(okTrue());
  });

  it('rejects double resolution', () => {
    mineBlocks(simnet, 25);
    simnet.mineBlock([tx.callPublicFn('contract', 'resolve-market', [uintCV(marketId), boolCV(true)], accounts.deployer)]);
    const result = simnet.mineBlock([
      tx.callPublicFn('contract', 'resolve-market', [uintCV(marketId), boolCV(false)], accounts.deployer),
    ]);
    expect(result[0].result).toEqual(err(CONTRACT_ERRORS.ALREADY_RESOLVED));
  });

  it('rejects resolution from non-owner', () => {
    mineBlocks(simnet, 25);
    const result = simnet.mineBlock([
      tx.callPublicFn('contract', 'resolve-market', [uintCV(marketId), boolCV(true)], accounts.user1),
    ]);
    expect(result[0].result).toEqual(err(CONTRACT_ERRORS.UNAUTHORIZED));
  });
});
