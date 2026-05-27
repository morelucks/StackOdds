import { describe, it, expect, beforeEach } from 'vitest';
import { tx } from '@stacks/clarinet-sdk';
import { principalCV, boolCV } from '@stacks/transactions';
import {
  getAccounts, setupAll, CONTRACT_ERRORS, err, okTrue, type TestAccounts,
} from './utils';

// @ts-ignore
declare const simnet: any;

describe('Access Control', () => {
  let accounts: TestAccounts;

  beforeEach(() => {
    accounts = getAccounts(simnet);
    setupAll(simnet, accounts.deployer);
  });

  describe('Admin Role', () => {
    it('grants admin role', () => {
      const result = simnet.mineBlock([
        tx.callPublicFn('contract', 'set-admin-role', [principalCV(accounts.user1), boolCV(true)], accounts.deployer),
      ]);
      expect(result[0].result).toEqual(okTrue());
    });

    it('revokes admin role', () => {
      simnet.mineBlock([tx.callPublicFn('contract', 'set-admin-role', [principalCV(accounts.user1), boolCV(true)], accounts.deployer)]);
      const result = simnet.mineBlock([
        tx.callPublicFn('contract', 'set-admin-role', [principalCV(accounts.user1), boolCV(false)], accounts.deployer),
      ]);
      expect(result[0].result).toEqual(okTrue());
    });

    it('rejects admin grant from non-owner', () => {
      const result = simnet.mineBlock([
        tx.callPublicFn('contract', 'set-admin-role', [principalCV(accounts.user2), boolCV(true)], accounts.user1),
      ]);
      expect(result[0].result).toEqual(err(CONTRACT_ERRORS.UNAUTHORIZED));
    });
  });

  describe('Moderator Role', () => {
    it('grants moderator role', () => {
      const result = simnet.mineBlock([
        tx.callPublicFn('contract', 'set-moderator-role', [principalCV(accounts.user1), boolCV(true)], accounts.deployer),
      ]);
      expect(result[0].result).toEqual(okTrue());
    });

    it('revokes moderator role', () => {
      simnet.mineBlock([tx.callPublicFn('contract', 'set-moderator-role', [principalCV(accounts.user1), boolCV(true)], accounts.deployer)]);
      const result = simnet.mineBlock([
        tx.callPublicFn('contract', 'set-moderator-role', [principalCV(accounts.user1), boolCV(false)], accounts.deployer),
      ]);
      expect(result[0].result).toEqual(okTrue());
    });

    it('rejects moderator grant from non-owner', () => {
      const result = simnet.mineBlock([
        tx.callPublicFn('contract', 'set-moderator-role', [principalCV(accounts.user2), boolCV(true)], accounts.user1),
      ]);
      expect(result[0].result).toEqual(err(CONTRACT_ERRORS.UNAUTHORIZED));
    });
  });

  describe('Authorization Check', () => {
    it('confirms admin is authorized', () => {
      simnet.mineBlock([tx.callPublicFn('contract', 'set-admin-role', [principalCV(accounts.user1), boolCV(true)], accounts.deployer)]);
      const result = simnet.callReadOnlyFn('contract', 'is-authorized', [principalCV(accounts.user1)], accounts.deployer);
      expect((result.result as any).type).toBe('ok');
    });

    it('confirms moderator is authorized', () => {
      simnet.mineBlock([tx.callPublicFn('contract', 'set-moderator-role', [principalCV(accounts.user1), boolCV(true)], accounts.deployer)]);
      const result = simnet.callReadOnlyFn('contract', 'is-authorized', [principalCV(accounts.user1)], accounts.deployer);
      expect((result.result as any).type).toBe('ok');
    });
  });
});
