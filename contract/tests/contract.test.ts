import { describe, it, expect, beforeEach } from 'vitest';
import { tx } from '@stacks/clarinet-sdk';
import { uintCV, stringAsciiCV, principalCV, boolCV } from '@stacks/transactions';
import {
  getAccounts, setupAll, createMarket, mineBlocks,
  CONTRACT_ERRORS, ok, err, okTrue, okUint, type TestAccounts,
} from './utils';

// @ts-ignore
declare const simnet: any;

describe('Contract Tests', () => {
  let accounts: TestAccounts;

  beforeEach(() => {
    accounts = getAccounts(simnet);
    setupAll(simnet, accounts.deployer);
  });

  describe('Initialization', () => {
    it('initializes with owner and collateral token', () => {
      const result = simnet.mineBlock([
        tx.callPublicFn('contract', 'initialize', [
          principalCV(accounts.deployer),
          principalCV(`${accounts.deployer}.token`),
        ], accounts.deployer),
      ]);
      expect(result[0].result).toEqual(okTrue());
    });

    it('returns zero market count initially', () => {
      const result = simnet.callReadOnlyFn('contract', 'get-market-count', [], accounts.deployer);
      expect(result.result).toEqual(okUint(0n));
    });

    it('returns contract owner after initialization', () => {
      const result = simnet.callReadOnlyFn('contract', 'get-owner', [], accounts.deployer);
      expect((result.result as any).type).toBe('ok');
    });
  });

  describe('Role Management', () => {
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
        tx.callPublicFn('contract', 'set-admin-role', [principalCV(accounts.user1), boolCV(true)], accounts.user1),
      ]);
      expect(result[0].result).toEqual(err(CONTRACT_ERRORS.UNAUTHORIZED));
    });

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
        tx.callPublicFn('contract', 'set-moderator-role', [principalCV(accounts.user1), boolCV(true)], accounts.user1),
      ]);
      expect(result[0].result).toEqual(err(CONTRACT_ERRORS.UNAUTHORIZED));
    });
  });

  describe('Market Creation', () => {
    it('rejects market with zero liquidity', () => {
      const b = simnet.blockHeight;
      const result = simnet.mineBlock([
        tx.callPublicFn('contract', 'create-market', [uintCV(0), uintCV(b + 10), uintCV(b + 100), stringAsciiCV('Q'), stringAsciiCV('ipfs')], accounts.deployer),
      ]);
      expect(result[0].result).toEqual(err(CONTRACT_ERRORS.ZERO_LIQUIDITY));
    });

    it('rejects market when end-time <= start-time', () => {
      const b = simnet.blockHeight;
      const result = simnet.mineBlock([
        tx.callPublicFn('contract', 'create-market', [uintCV(1000000), uintCV(b + 100), uintCV(b + 10), stringAsciiCV('Q'), stringAsciiCV('ipfs')], accounts.deployer),
      ]);
      expect(result[0].result).toEqual(err(CONTRACT_ERRORS.INVALID_PARAMS));
    });

    it('rejects market creation from non-owner', () => {
      const b = simnet.blockHeight;
      const result = simnet.mineBlock([
        tx.callPublicFn('contract', 'create-market', [uintCV(1000000), uintCV(b + 10), uintCV(b + 100), stringAsciiCV('Q'), stringAsciiCV('ipfs')], accounts.user1),
      ]);
      expect(result[0].result).toEqual(err(CONTRACT_ERRORS.UNAUTHORIZED));
    });
  });

  describe('Buy/Sell Failures', () => {
    it('rejects buy-yes on non-existent market', () => {
      const result = simnet.mineBlock([
        tx.callPublicFn('contract', 'buy-yes', [uintCV(99999), uintCV(1000000), stringAsciiCV('US')], accounts.user1),
      ]);
      expect(result[0].result).toEqual(err(CONTRACT_ERRORS.MARKET_NOT_FOUND));
    });

    it('rejects buy-no on non-existent market', () => {
      const result = simnet.mineBlock([
        tx.callPublicFn('contract', 'buy-no', [uintCV(99999), uintCV(1000000), stringAsciiCV('US')], accounts.user1),
      ]);
      expect(result[0].result).toEqual(err(CONTRACT_ERRORS.MARKET_NOT_FOUND));
    });
  });

  describe('Token Transfer Errors', () => {
    it('rejects transfer when caller is not sender', () => {
      const result = simnet.mineBlock([
        tx.callPublicFn('contract', 'transfer', [uintCV(1), uintCV(1000000), principalCV(accounts.user1), principalCV(accounts.user2)], accounts.user2),
      ]);
      expect(result[0].result).toEqual(err(CONTRACT_ERRORS.UNAUTHORIZED));
    });
  });

  describe('Read-Only Functions', () => {
    it('returns token ID for YES outcome', () => {
      const result = simnet.callReadOnlyFn('contract', 'get-token-id', [uintCV(1), uintCV(1)], accounts.deployer);
      expect((result.result as any).type).toBe('ok');
    });

    it('returns token ID for NO outcome', () => {
      const result = simnet.callReadOnlyFn('contract', 'get-token-id', [uintCV(1), uintCV(0)], accounts.deployer);
      expect((result.result as any).type).toBe('ok');
    });
  });

  describe('Market Data Consistency', () => {
    it('maintains market data through expiration', () => {
      const marketId = createMarket(simnet, accounts.deployer, { startOffset: 10, endOffset: 20 });
      const before = simnet.callReadOnlyFn('contract', 'get-market', [uintCV(marketId)], accounts.deployer);
      mineBlocks(simnet, 30);
      const after = simnet.callReadOnlyFn('contract', 'get-market', [uintCV(marketId)], accounts.deployer);
      expect((before.result as any).type).toBe('ok');
      expect((after.result as any).type).toBe('ok');
    });
  });
});
