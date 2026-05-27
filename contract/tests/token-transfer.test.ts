import { describe, it, expect, beforeEach } from 'vitest';
import { tx } from '@stacks/clarinet-sdk';
import { uintCV, principalCV } from '@stacks/transactions';
import {
  getAccounts, setupToken, CONTRACT_ERRORS, err, okUint, type TestAccounts,
} from './utils';

// @ts-ignore
declare const simnet: any;

describe('Token Transfer (via contract)', () => {
  let accounts: TestAccounts;

  beforeEach(() => {
    accounts = getAccounts(simnet);
    setupToken(simnet, accounts.deployer);
  });

  it('rejects transfer when caller is not the sender', () => {
    const result = simnet.mineBlock([
      tx.callPublicFn('contract', 'transfer', [
        uintCV(1), uintCV(1_000_000),
        principalCV(accounts.user1), principalCV(accounts.user2),
      ], accounts.user2),
    ]);
    expect(result[0].result).toEqual(err(CONTRACT_ERRORS.UNAUTHORIZED));
  });

  it('rejects transfer with insufficient balance', () => {
    const result = simnet.mineBlock([
      tx.callPublicFn('contract', 'transfer', [
        uintCV(1), uintCV(1_000_000),
        principalCV(accounts.user1), principalCV(accounts.user2),
      ], accounts.user1),
    ]);
    // Insufficient balance error
    expect(result[0].result.type).toBe('err');
  });

  it('returns zero balance for a user with no tokens', () => {
    const result = simnet.callReadOnlyFn(
      'contract', 'get-balance', [uintCV(1), principalCV(accounts.user1)], accounts.deployer,
    );
    expect((result.result as any).type).toBe('ok');
    expect((result.result as any).value.value).toBe(0n);
  });

  it('returns total supply for a token', () => {
    const result = simnet.callReadOnlyFn('contract', 'get-total-supply', [uintCV(1)], accounts.deployer);
    expect((result.result as any).type).toBe('ok');
  });

  it('returns token metadata', () => {
    const result = simnet.callReadOnlyFn('contract', 'get-token-metadata', [uintCV(1)], accounts.deployer);
    expect((result.result as any).type).toBe('ok');
  });
});
