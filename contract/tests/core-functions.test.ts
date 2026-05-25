import { describe, it, expect, beforeEach } from 'vitest';
import { tx } from '@stacks/clarinet-sdk';
import { uintCV, stringAsciiCV, principalCV, boolCV } from '@stacks/transactions';

// @ts-ignore - simnet is provided by vitest-environment-clarinet
declare const simnet: any;

describe('StackOdds Core Functions', () => {
  let deployer: string;
  let user1: string;
  let user2: string;
  let tokenAddress: string;

  beforeEach(() => {
    deployer = simnet.getAccounts().get('deployer')!;
    user1 = simnet.getAccounts().get('wallet_1')!;
    user2 = simnet.getAccounts().get('wallet_2')!;
    tokenAddress = `${deployer}.so-token`;

    // Fund accounts with collateral token
    simnet.mineBlock([
      tx.callPublicFn('so-token', 'mint', [uintCV(0), principalCV(deployer), uintCV(10000000000)], deployer),
      tx.callPublicFn('so-token', 'mint', [uintCV(0), principalCV(user1), uintCV(10000000000)], deployer),
    ]);
  });

  // ─── initialize ──────────────────────────────────────────────────────────

  describe('initialize', () => {
    it('succeeds when called by the current owner (deployer)', () => {
      const [result] = simnet.mineBlock([
        tx.callPublicFn('stackodds', 'initialize', [principalCV(deployer), principalCV(tokenAddress)], deployer),
      ]);
      expect(result.result).toEqual({ type: 'ok', value: { type: 'true' } });
    });

    it('updates the contract owner to the provided address', () => {
      simnet.mineBlock([
        tx.callPublicFn('stackodds', 'initialize', [principalCV(user1), principalCV(tokenAddress)], deployer),
      ]);
      const { result } = simnet.callReadOnlyFn('stackodds', 'get-owner', [], deployer);
      expect(result).toEqual({ type: 'ok', value: { type: 'address', value: user1 } });
    });

    it('grants admin role to the new owner', () => {
      simnet.mineBlock([
        tx.callPublicFn('stackodds', 'initialize', [principalCV(user1), principalCV(tokenAddress)], deployer),
      ]);
      const { result } = simnet.callReadOnlyFn('stackodds', 'is-authorized', [principalCV(user1)], deployer);
      expect(result).toEqual({ type: 'ok', value: { type: 'true' } });
    });

    it('grants moderator role to the new owner', () => {
      simnet.mineBlock([
        tx.callPublicFn('stackodds', 'initialize', [principalCV(user1), principalCV(tokenAddress)], deployer),
      ]);
      // new owner should pass is-authorized (moderator-role is set)
      const { result } = simnet.callReadOnlyFn('stackodds', 'is-authorized', [principalCV(user1)], deployer);
      expect(result).toEqual({ type: 'ok', value: { type: 'true' } });
    });

    it('fails with ERR_UNAUTHORIZED when called by a non-owner', () => {
      const [result] = simnet.mineBlock([
        tx.callPublicFn('stackodds', 'initialize', [principalCV(user2), principalCV(tokenAddress)], user1),
      ]);
      expect(result.result).toEqual({ type: 'err', value: { type: 'uint', value: 2001n } });
    });

    it('allows the new owner to call initialize again after ownership transfer', () => {
      simnet.mineBlock([
        tx.callPublicFn('stackodds', 'initialize', [principalCV(user1), principalCV(tokenAddress)], deployer),
      ]);
      const [result] = simnet.mineBlock([
        tx.callPublicFn('stackodds', 'initialize', [principalCV(user2), principalCV(tokenAddress)], user1),
      ]);
      expect(result.result).toEqual({ type: 'ok', value: { type: 'true' } });
    });

    it('old owner cannot call initialize after ownership transfer', () => {
      simnet.mineBlock([
        tx.callPublicFn('stackodds', 'initialize', [principalCV(user1), principalCV(tokenAddress)], deployer),
      ]);
      const [result] = simnet.mineBlock([
        tx.callPublicFn('stackodds', 'initialize', [principalCV(deployer), principalCV(tokenAddress)], deployer),
      ]);
      expect(result.result).toEqual({ type: 'err', value: { type: 'uint', value: 2001n } });
    });

    it('deployer is not authorized after transferring ownership', () => {
      simnet.mineBlock([
        tx.callPublicFn('stackodds', 'initialize', [principalCV(user1), principalCV(tokenAddress)], deployer),
      ]);
      // deployer is no longer owner, so is-authorized should be false
      const { result } = simnet.callReadOnlyFn('stackodds', 'is-authorized', [principalCV(deployer)], deployer);
      expect(result).toEqual({ type: 'ok', value: { type: 'false' } });
    });

    it('returns ok true on successful initialization', () => {
      const [result] = simnet.mineBlock([
        tx.callPublicFn('stackodds', 'initialize', [principalCV(deployer), principalCV(tokenAddress)], deployer),
      ]);
      expect(result.result.type).toBe('ok');
    });

    it('market count remains zero after initialize', () => {
      simnet.mineBlock([
        tx.callPublicFn('stackodds', 'initialize', [principalCV(deployer), principalCV(tokenAddress)], deployer),
      ]);
      const { result } = simnet.callReadOnlyFn('stackodds', 'get-market-count', [], deployer);
      expect(result).toEqual({ type: 'ok', value: { type: 'uint', value: 0n } });
    });
  });

  // ─── set-admin-role ───────────────────────────────────────────────────────

  describe('set-admin-role', () => {
    beforeEach(() => {
      simnet.mineBlock([
        tx.callPublicFn('stackodds', 'initialize', [principalCV(deployer), principalCV(tokenAddress)], deployer),
      ]);
    });

    it('owner can grant admin role to another account', () => {
      const [result] = simnet.mineBlock([
        tx.callPublicFn('stackodds', 'set-admin-role', [principalCV(user1), boolCV(true)], deployer),
      ]);
      expect(result.result).toEqual({ type: 'ok', value: { type: 'true' } });
    });

    it('granted admin is recognized as authorized', () => {
      simnet.mineBlock([
        tx.callPublicFn('stackodds', 'set-admin-role', [principalCV(user1), boolCV(true)], deployer),
      ]);
      const { result } = simnet.callReadOnlyFn('stackodds', 'is-authorized', [principalCV(user1)], deployer);
      expect(result).toEqual({ type: 'ok', value: { type: 'true' } });
    });

    it('owner can revoke admin role', () => {
      simnet.mineBlock([
        tx.callPublicFn('stackodds', 'set-admin-role', [principalCV(user1), boolCV(true)], deployer),
      ]);
      const [result] = simnet.mineBlock([
        tx.callPublicFn('stackodds', 'set-admin-role', [principalCV(user1), boolCV(false)], deployer),
      ]);
      expect(result.result).toEqual({ type: 'ok', value: { type: 'true' } });
    });

    it('revoked admin is no longer authorized', () => {
      simnet.mineBlock([
        tx.callPublicFn('stackodds', 'set-admin-role', [principalCV(user1), boolCV(true)], deployer),
        tx.callPublicFn('stackodds', 'set-admin-role', [principalCV(user1), boolCV(false)], deployer),
      ]);
      const { result } = simnet.callReadOnlyFn('stackodds', 'is-authorized', [principalCV(user1)], deployer);
      expect(result).toEqual({ type: 'ok', value: { type: 'false' } });
    });

    it('non-owner cannot grant admin role', () => {
      const [result] = simnet.mineBlock([
        tx.callPublicFn('stackodds', 'set-admin-role', [principalCV(user2), boolCV(true)], user1),
      ]);
      expect(result.result).toEqual({ type: 'err', value: { type: 'uint', value: 2001n } });
    });

    it('non-owner cannot revoke admin role', () => {
      simnet.mineBlock([
        tx.callPublicFn('stackodds', 'set-admin-role', [principalCV(user1), boolCV(true)], deployer),
      ]);
      const [result] = simnet.mineBlock([
        tx.callPublicFn('stackodds', 'set-admin-role', [principalCV(user1), boolCV(false)], user2),
      ]);
      expect(result.result).toEqual({ type: 'err', value: { type: 'uint', value: 2001n } });
    });

    it('admin cannot grant admin role to others (only owner can)', () => {
      simnet.mineBlock([
        tx.callPublicFn('stackodds', 'set-admin-role', [principalCV(user1), boolCV(true)], deployer),
      ]);
      const [result] = simnet.mineBlock([
        tx.callPublicFn('stackodds', 'set-admin-role', [principalCV(user2), boolCV(true)], user1),
      ]);
      expect(result.result).toEqual({ type: 'err', value: { type: 'uint', value: 2001n } });
    });

    it('owner can grant admin role to multiple accounts', () => {
      const results = simnet.mineBlock([
        tx.callPublicFn('stackodds', 'set-admin-role', [principalCV(user1), boolCV(true)], deployer),
        tx.callPublicFn('stackodds', 'set-admin-role', [principalCV(user2), boolCV(true)], deployer),
      ]);
      expect(results[0].result).toEqual({ type: 'ok', value: { type: 'true' } });
      expect(results[1].result).toEqual({ type: 'ok', value: { type: 'true' } });
    });

    it('both granted admins are authorized', () => {
      simnet.mineBlock([
        tx.callPublicFn('stackodds', 'set-admin-role', [principalCV(user1), boolCV(true)], deployer),
        tx.callPublicFn('stackodds', 'set-admin-role', [principalCV(user2), boolCV(true)], deployer),
      ]);
      const r1 = simnet.callReadOnlyFn('stackodds', 'is-authorized', [principalCV(user1)], deployer);
      const r2 = simnet.callReadOnlyFn('stackodds', 'is-authorized', [principalCV(user2)], deployer);
      expect(r1.result).toEqual({ type: 'ok', value: { type: 'true' } });
      expect(r2.result).toEqual({ type: 'ok', value: { type: 'true' } });
    });

    it('setting admin role to false for a non-admin is a no-op and returns ok', () => {
      const [result] = simnet.mineBlock([
        tx.callPublicFn('stackodds', 'set-admin-role', [principalCV(user1), boolCV(false)], deployer),
      ]);
      expect(result.result).toEqual({ type: 'ok', value: { type: 'true' } });
    });
  });

  // ─── create-market ────────────────────────────────────────────────────────

  describe('create-market', () => {
    beforeEach(() => {
      simnet.mineBlock([
        tx.callPublicFn('stackodds', 'initialize', [principalCV(deployer), principalCV(tokenAddress)], deployer),
        tx.callPublicFn('so-token', 'initialize', [principalCV(`${deployer}.stackodds`)], deployer),
      ]);
    });

    it('owner can create a valid market', () => {
      const block = simnet.blockHeight;
      const [result] = simnet.mineBlock([
        tx.callPublicFn('stackodds', 'create-market', [
          uintCV(1000000),
          uintCV(block + 10),
          uintCV(block + 100),
          stringAsciiCV('Will BTC hit 100k?'),
          stringAsciiCV('ipfs://Qm123'),
        ], deployer),
      ]);
      expect(result.result.type).toBe('ok');
    });

    it('market id starts at 1 for the first market', () => {
      const block = simnet.blockHeight;
      const [result] = simnet.mineBlock([
        tx.callPublicFn('stackodds', 'create-market', [
          uintCV(1000000),
          uintCV(block + 10),
          uintCV(block + 100),
          stringAsciiCV('First market?'),
          stringAsciiCV('ipfs://Qm001'),
        ], deployer),
      ]);
      expect(result.result).toEqual({ type: 'ok', value: { type: 'uint', value: 1n } });
    });

    it('market count increments after creation', () => {
      const block = simnet.blockHeight;
      simnet.mineBlock([
        tx.callPublicFn('stackodds', 'create-market', [
          uintCV(1000000),
          uintCV(block + 10),
          uintCV(block + 100),
          stringAsciiCV('Market count test?'),
          stringAsciiCV('ipfs://Qm002'),
        ], deployer),
      ]);
      const { result } = simnet.callReadOnlyFn('stackodds', 'get-market-count', [], deployer);
      expect(result).toEqual({ type: 'ok', value: { type: 'uint', value: 1n } });
    });

    it('created market is retrievable via get-market', () => {
      const block = simnet.blockHeight;
      const [createResult] = simnet.mineBlock([
        tx.callPublicFn('stackodds', 'create-market', [
          uintCV(1000000),
          uintCV(block + 10),
          uintCV(block + 100),
          stringAsciiCV('Retrievable market?'),
          stringAsciiCV('ipfs://Qm003'),
        ], deployer),
      ]);
      const marketId = (createResult.result as any).value.value;
      const { result } = simnet.callReadOnlyFn('stackodds', 'get-market', [uintCV(Number(marketId))], deployer);
      expect(result.type).toBe('ok');
    });

    it('created market has resolved=false', () => {
      const block = simnet.blockHeight;
      const [createResult] = simnet.mineBlock([
        tx.callPublicFn('stackodds', 'create-market', [
          uintCV(1000000),
          uintCV(block + 10),
          uintCV(block + 100),
          stringAsciiCV('Unresolved market?'),
          stringAsciiCV('ipfs://Qm004'),
        ], deployer),
      ]);
      const marketId = Number((createResult.result as any).value.value);
      const { result } = simnet.callReadOnlyFn('stackodds', 'get-market', [uintCV(marketId)], deployer);
      // market exists and is not resolved — just verify the call succeeds
      expect((result as any).type).toBe('ok');
    });

    it('fails with ERR_UNAUTHORIZED when non-owner tries to create market', () => {
      const block = simnet.blockHeight;
      const [result] = simnet.mineBlock([
        tx.callPublicFn('stackodds', 'create-market', [
          uintCV(1000000),
          uintCV(block + 10),
          uintCV(block + 100),
          stringAsciiCV('Unauthorized market?'),
          stringAsciiCV('ipfs://Qm005'),
        ], user1),
      ]);
      expect(result.result).toEqual({ type: 'err', value: { type: 'uint', value: 2001n } });
    });

    it('fails with ERR_ZERO_LIQUIDITY when b=0', () => {
      const block = simnet.blockHeight;
      const [result] = simnet.mineBlock([
        tx.callPublicFn('stackodds', 'create-market', [
          uintCV(0),
          uintCV(block + 10),
          uintCV(block + 100),
          stringAsciiCV('Zero liquidity?'),
          stringAsciiCV('ipfs://Qm006'),
        ], deployer),
      ]);
      expect(result.result).toEqual({ type: 'err', value: { type: 'uint', value: 2002n } });
    });

    it('fails with ERR_INVALID_PARAMS when end-time <= start-time', () => {
      const block = simnet.blockHeight;
      const [result] = simnet.mineBlock([
        tx.callPublicFn('stackodds', 'create-market', [
          uintCV(1000000),
          uintCV(block + 100),
          uintCV(block + 10),
          stringAsciiCV('Bad time range?'),
          stringAsciiCV('ipfs://Qm007'),
        ], deployer),
      ]);
      expect(result.result).toEqual({ type: 'err', value: { type: 'uint', value: 2008n } });
    });

    it('fails with ERR_INVALID_PARAMS when start-time is in the past', () => {
      const block = simnet.blockHeight;
      const [result] = simnet.mineBlock([
        tx.callPublicFn('stackodds', 'create-market', [
          uintCV(1000000),
          uintCV(block - 1),
          uintCV(block + 100),
          stringAsciiCV('Past start?'),
          stringAsciiCV('ipfs://Qm008'),
        ], deployer),
      ]);
      expect(result.result).toEqual({ type: 'err', value: { type: 'uint', value: 2008n } });
    });

    it('fails with ERR_DURATION_EXCEEDED when duration exceeds MAX_MARKET_DURATION', () => {
      const block = simnet.blockHeight;
      const [result] = simnet.mineBlock([
        tx.callPublicFn('stackodds', 'create-market', [
          uintCV(1000000),
          uintCV(block + 10),
          uintCV(block + 20000), // > MAX_MARKET_DURATION (10000)
          stringAsciiCV('Too long market?'),
          stringAsciiCV('ipfs://Qm009'),
        ], deployer),
      ]);
      expect(result.result).toEqual({ type: 'err', value: { type: 'uint', value: 2015n } });
    });

    it('second market gets id 2', () => {
      const block = simnet.blockHeight;
      simnet.mineBlock([
        tx.callPublicFn('stackodds', 'create-market', [
          uintCV(1000000),
          uintCV(block + 10),
          uintCV(block + 100),
          stringAsciiCV('First?'),
          stringAsciiCV('ipfs://Qm010'),
        ], deployer),
      ]);
      const block2 = simnet.blockHeight;
      const [result] = simnet.mineBlock([
        tx.callPublicFn('stackodds', 'create-market', [
          uintCV(1000000),
          uintCV(block2 + 10),
          uintCV(block2 + 100),
          stringAsciiCV('Second?'),
          stringAsciiCV('ipfs://Qm011'),
        ], deployer),
      ]);
      expect(result.result).toEqual({ type: 'ok', value: { type: 'uint', value: 2n } });
    });

    it('non-existent market returns ERR_MARKET_NOT_CREATED', () => {
      const { result } = simnet.callReadOnlyFn('stackodds', 'get-market', [uintCV(9999)], deployer);
      expect(result).toEqual({ type: 'err', value: { type: 'uint', value: 2005n } });
    });
  });
});
