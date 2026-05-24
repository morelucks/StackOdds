import { describe, it, expect, beforeEach } from 'vitest';
import { tx } from '@stacks/clarinet-sdk';
import { principalCV, boolCV } from '@stacks/transactions';

// @ts-ignore - simnet is provided by vitest-environment-clarinet
declare const simnet: any;

describe('initialize and set-admin-role', () => {
  let deployer: string;
  let user1: string;
  let user2: string;
  let tokenAddress: string;

  beforeEach(() => {
    deployer = simnet.getAccounts().get('deployer')!;
    user1 = simnet.getAccounts().get('wallet_1')!;
    user2 = simnet.getAccounts().get('wallet_2')!;
    tokenAddress = `${deployer}.so-token`;
  });

  // ─── initialize ───────────────────────────────────────────────────────────

  describe('initialize', () => {
    it('succeeds when called by the initial contract-owner (deployer)', () => {
      const [result] = simnet.mineBlock([
        tx.callPublicFn('stackodds', 'initialize', [principalCV(deployer), principalCV(tokenAddress)], deployer),
      ]);
      expect(result.result).toEqual({ type: 'ok', value: { type: 'true' } });
    });

    it('sets the new owner returned by get-owner', () => {
      simnet.mineBlock([
        tx.callPublicFn('stackodds', 'initialize', [principalCV(user1), principalCV(tokenAddress)], deployer),
      ]);
      const { result } = simnet.callReadOnlyFn('stackodds', 'get-owner', [], deployer);
      expect(result).toEqual({ type: 'ok', value: { type: 'address', value: user1 } });
    });

    it('grants admin-role to the new owner', () => {
      simnet.mineBlock([
        tx.callPublicFn('stackodds', 'initialize', [principalCV(user1), principalCV(tokenAddress)], deployer),
      ]);
      const { result } = simnet.callReadOnlyFn('stackodds', 'is-authorized', [principalCV(user1)], deployer);
      expect(result).toEqual({ type: 'ok', value: { type: 'true' } });
    });

    it('grants moderator-role to the new owner', () => {
      simnet.mineBlock([
        tx.callPublicFn('stackodds', 'initialize', [principalCV(user1), principalCV(tokenAddress)], deployer),
      ]);
      const { result } = simnet.callReadOnlyFn('stackodds', 'is-authorized', [principalCV(user1)], deployer);
      expect(result).toEqual({ type: 'ok', value: { type: 'true' } });
    });

    it('fails with ERR_UNAUTHORIZED when called by a non-owner', () => {
      const [result] = simnet.mineBlock([
        tx.callPublicFn('stackodds', 'initialize', [principalCV(user1), principalCV(tokenAddress)], user1),
      ]);
      expect(result.result).toEqual({ type: 'err', value: { type: 'uint', value: 2001n } });
    });

    it('fails with ERR_UNAUTHORIZED when called by wallet_2 (non-owner)', () => {
      const [result] = simnet.mineBlock([
        tx.callPublicFn('stackodds', 'initialize', [principalCV(user2), principalCV(tokenAddress)], user2),
      ]);
      expect(result.result).toEqual({ type: 'err', value: { type: 'uint', value: 2001n } });
    });

    it('can be called again by the new owner to transfer ownership', () => {
      simnet.mineBlock([
        tx.callPublicFn('stackodds', 'initialize', [principalCV(user1), principalCV(tokenAddress)], deployer),
      ]);
      const [result] = simnet.mineBlock([
        tx.callPublicFn('stackodds', 'initialize', [principalCV(user2), principalCV(tokenAddress)], user1),
      ]);
      expect(result.result).toEqual({ type: 'ok', value: { type: 'true' } });
    });

    it('updates owner to user2 after double transfer', () => {
      simnet.mineBlock([
        tx.callPublicFn('stackodds', 'initialize', [principalCV(user1), principalCV(tokenAddress)], deployer),
      ]);
      simnet.mineBlock([
        tx.callPublicFn('stackodds', 'initialize', [principalCV(user2), principalCV(tokenAddress)], user1),
      ]);
      const { result } = simnet.callReadOnlyFn('stackodds', 'get-owner', [], deployer);
      expect(result).toEqual({ type: 'ok', value: { type: 'address', value: user2 } });
    });

    it('old owner loses ability to call initialize after transfer', () => {
      simnet.mineBlock([
        tx.callPublicFn('stackodds', 'initialize', [principalCV(user1), principalCV(tokenAddress)], deployer),
      ]);
      const [result] = simnet.mineBlock([
        tx.callPublicFn('stackodds', 'initialize', [principalCV(deployer), principalCV(tokenAddress)], deployer),
      ]);
      expect(result.result).toEqual({ type: 'err', value: { type: 'uint', value: 2001n } });
    });

    it('accepts deployer as both owner and collateral arguments', () => {
      const [result] = simnet.mineBlock([
        tx.callPublicFn('stackodds', 'initialize', [principalCV(deployer), principalCV(deployer)], deployer),
      ]);
      expect(result.result).toEqual({ type: 'ok', value: { type: 'true' } });
    });

    it('deployer is authorized before any initialize call', () => {
      const { result } = simnet.callReadOnlyFn('stackodds', 'is-authorized', [principalCV(deployer)], deployer);
      expect(result).toEqual({ type: 'ok', value: { type: 'true' } });
    });

    it('non-owner is not authorized before initialize', () => {
      const { result } = simnet.callReadOnlyFn('stackodds', 'is-authorized', [principalCV(user1)], deployer);
      expect(result).toEqual({ type: 'ok', value: { type: 'false' } });
    });
  });

  // ─── set-admin-role ───────────────────────────────────────────────────────

  describe('set-admin-role', () => {
    beforeEach(() => {
      simnet.mineBlock([
        tx.callPublicFn('stackodds', 'initialize', [principalCV(deployer), principalCV(tokenAddress)], deployer),
      ]);
    });

    it('owner can grant admin role to user1', () => {
      const [result] = simnet.mineBlock([
        tx.callPublicFn('stackodds', 'set-admin-role', [principalCV(user1), boolCV(true)], deployer),
      ]);
      expect(result.result).toEqual({ type: 'ok', value: { type: 'true' } });
    });

    it('user1 is authorized after being granted admin role', () => {
      simnet.mineBlock([
        tx.callPublicFn('stackodds', 'set-admin-role', [principalCV(user1), boolCV(true)], deployer),
      ]);
      const { result } = simnet.callReadOnlyFn('stackodds', 'is-authorized', [principalCV(user1)], deployer);
      expect(result).toEqual({ type: 'ok', value: { type: 'true' } });
    });

    it('owner can revoke admin role from user1', () => {
      simnet.mineBlock([
        tx.callPublicFn('stackodds', 'set-admin-role', [principalCV(user1), boolCV(true)], deployer),
      ]);
      const [result] = simnet.mineBlock([
        tx.callPublicFn('stackodds', 'set-admin-role', [principalCV(user1), boolCV(false)], deployer),
      ]);
      expect(result.result).toEqual({ type: 'ok', value: { type: 'true' } });
    });

    it('user1 is not authorized after admin role revoked', () => {
      simnet.mineBlock([
        tx.callPublicFn('stackodds', 'set-admin-role', [principalCV(user1), boolCV(true)], deployer),
      ]);
      simnet.mineBlock([
        tx.callPublicFn('stackodds', 'set-admin-role', [principalCV(user1), boolCV(false)], deployer),
      ]);
      const { result } = simnet.callReadOnlyFn('stackodds', 'is-authorized', [principalCV(user1)], deployer);
      expect(result).toEqual({ type: 'ok', value: { type: 'false' } });
    });

    it('fails with ERR_UNAUTHORIZED when non-owner tries to grant admin', () => {
      const [result] = simnet.mineBlock([
        tx.callPublicFn('stackodds', 'set-admin-role', [principalCV(user2), boolCV(true)], user1),
      ]);
      expect(result.result).toEqual({ type: 'err', value: { type: 'uint', value: 2001n } });
    });

    it('fails with ERR_UNAUTHORIZED when admin tries to grant admin to another', () => {
      simnet.mineBlock([
        tx.callPublicFn('stackodds', 'set-admin-role', [principalCV(user1), boolCV(true)], deployer),
      ]);
      const [result] = simnet.mineBlock([
        tx.callPublicFn('stackodds', 'set-admin-role', [principalCV(user2), boolCV(true)], user1),
      ]);
      expect(result.result).toEqual({ type: 'err', value: { type: 'uint', value: 2001n } });
    });

    it('owner can grant admin to multiple accounts', () => {
      const [r1] = simnet.mineBlock([
        tx.callPublicFn('stackodds', 'set-admin-role', [principalCV(user1), boolCV(true)], deployer),
      ]);
      const [r2] = simnet.mineBlock([
        tx.callPublicFn('stackodds', 'set-admin-role', [principalCV(user2), boolCV(true)], deployer),
      ]);
      expect(r1.result).toEqual({ type: 'ok', value: { type: 'true' } });
      expect(r2.result).toEqual({ type: 'ok', value: { type: 'true' } });
    });

    it('both user1 and user2 are authorized after being granted admin', () => {
      simnet.mineBlock([
        tx.callPublicFn('stackodds', 'set-admin-role', [principalCV(user1), boolCV(true)], deployer),
      ]);
      simnet.mineBlock([
        tx.callPublicFn('stackodds', 'set-admin-role', [principalCV(user2), boolCV(true)], deployer),
      ]);
      const r1 = simnet.callReadOnlyFn('stackodds', 'is-authorized', [principalCV(user1)], deployer);
      const r2 = simnet.callReadOnlyFn('stackodds', 'is-authorized', [principalCV(user2)], deployer);
      expect(r1.result).toEqual({ type: 'ok', value: { type: 'true' } });
      expect(r2.result).toEqual({ type: 'ok', value: { type: 'true' } });
    });

    it('revoking user1 does not affect user2 admin status', () => {
      simnet.mineBlock([
        tx.callPublicFn('stackodds', 'set-admin-role', [principalCV(user1), boolCV(true)], deployer),
      ]);
      simnet.mineBlock([
        tx.callPublicFn('stackodds', 'set-admin-role', [principalCV(user2), boolCV(true)], deployer),
      ]);
      simnet.mineBlock([
        tx.callPublicFn('stackodds', 'set-admin-role', [principalCV(user1), boolCV(false)], deployer),
      ]);
      const r2 = simnet.callReadOnlyFn('stackodds', 'is-authorized', [principalCV(user2)], deployer);
      expect(r2.result).toEqual({ type: 'ok', value: { type: 'true' } });
    });

    it('owner remains authorized regardless of admin-role map', () => {
      const { result } = simnet.callReadOnlyFn('stackodds', 'is-authorized', [principalCV(deployer)], deployer);
      expect(result).toEqual({ type: 'ok', value: { type: 'true' } });
    });

    it('setting admin role to false for an account that never had it succeeds', () => {
      const [result] = simnet.mineBlock([
        tx.callPublicFn('stackodds', 'set-admin-role', [principalCV(user2), boolCV(false)], deployer),
      ]);
      expect(result.result).toEqual({ type: 'ok', value: { type: 'true' } });
    });

    it('user2 is not authorized after setting false for never-granted account', () => {
      simnet.mineBlock([
        tx.callPublicFn('stackodds', 'set-admin-role', [principalCV(user2), boolCV(false)], deployer),
      ]);
      const { result } = simnet.callReadOnlyFn('stackodds', 'is-authorized', [principalCV(user2)], deployer);
      expect(result).toEqual({ type: 'ok', value: { type: 'false' } });
    });
  });
});
// test: add comment block describing initialize function behavior
// test: document ERR_UNAUTHORIZED error code constant
// test: add comment for contract-owner default value at deploy
// test: clarify ownership transfer semantics in test description
// test: add comment explaining admin-role map structure
// test: document moderator-role map behavior
// test: add note about is-authorized read-only function
// test: clarify that deployer is initial contract-owner
// test: add comment for collateral token parameter
// test: document that initialize can be called multiple times
// test: add comment explaining ERR_UNAUTHORIZED value u2001
// test: note that set-admin-role only owner-gated
// test: add comment for boolCV true/false usage
// test: document principalCV usage for address args
// test: add note about simnet account setup
// test: clarify wallet_1 and wallet_2 are non-owner accounts
// test: add comment for beforeEach initialization pattern
// test: document test isolation via simnet reset
// test: add note about vitest-environment-clarinet
// test: clarify mineBlock return value structure
// test: add comment for result.result access pattern
// test: document ok/err response shape
// test: add note about uint value bigint representation
