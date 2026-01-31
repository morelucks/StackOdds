import { describe, it, expect, beforeEach } from 'vitest';
import { tx } from '@stacks/clarinet-sdk';
import { uintCV, stringAsciiCV, principalCV, boolCV } from '@stacks/transactions';

// @ts-ignore - simnet is provided by vitest-environment-clarinet
declare const simnet: any;

describe('Contract Tests', () => {
  let deployer: any;
  let user1: any;
  let user2: any;
  let contractAddress: string;

  beforeEach(() => {
    deployer = simnet.getAccounts().get('deployer')!;
    user1 = simnet.getAccounts().get('wallet_1')!;
    user2 = simnet.getAccounts().get('wallet_2')!;
    contractAddress = `${deployer}.contract`;

    // Initialize token contract with market contract address as owner
    simnet.mineBlock([
      tx.callPublicFn('token', 'initialize', [principalCV(contractAddress)], deployer)
    ]);
  });

  describe('Initialization', () => {
    it('should initialize contract with owner and collateral token', async () => {
      const collateralTokenAddress = `${deployer}.token`;
      const result = simnet.mineBlock([
        tx.callPublicFn('market', 'initialize', [principalCV(simnet.deployer), principalCV(collateralTokenAddress)], deployer)
      ]);
      expect(result[0].result).toEqual({ type: 'ok', value: { type: 'true' } });
    });

    it('should get initial market count of zero', async () => {
      const result = [simnet.callReadOnlyFn('market', 'get-market-count', [], deployer)];
      expect(result[0].result).toEqual({ type: 'ok', value: { type: 'uint', value: 0n } });
    });

    it('should get contract owner after initialization', async () => {
      const collateralTokenAddress = `${deployer}.token`;
      simnet.mineBlock([
        tx.callPublicFn('market', 'initialize', [principalCV(simnet.deployer), principalCV(collateralTokenAddress)], deployer)
      ]);
      const result = [simnet.callReadOnlyFn('market', 'get-owner', [], deployer)];
      expect((result[0].result as any).type).toBe('ok');
    });
  });

  describe('Role Management', () => {
    beforeEach(async () => {
      const collateralTokenAddress = `${deployer}.token`;
      simnet.mineBlock([
        tx.callPublicFn('market', 'initialize', [principalCV(simnet.deployer), principalCV(collateralTokenAddress)], deployer)
      ]);
    });

    it('should set admin role for a user', async () => {
      const result = simnet.mineBlock([
        tx.callPublicFn('market', 'set-admin-role', [principalCV(user1), boolCV(true)], deployer)
      ]);
      expect(result[0].result).toEqual({ type: 'ok', value: { type: 'true' } });
    });

    it('should revoke admin role for a user', async () => {
      simnet.mineBlock([
        tx.callPublicFn('market', 'set-admin-role', [principalCV(user1), boolCV(true)], deployer)
      ]);
      const result = simnet.mineBlock([
        tx.callPublicFn('market', 'set-admin-role', [principalCV(user1), boolCV(false)], deployer)
      ]);
      expect(result[0].result).toEqual({ type: 'ok', value: { type: 'true' } });
    });

    it('should fail to set admin role if not owner', async () => {
      const result = simnet.mineBlock([
        tx.callPublicFn('market', 'set-admin-role', [principalCV(user1), boolCV(true)], user1)
      ]);
      expect(result[0].result).toEqual({ type: 'err', value: { type: 'uint', value: 2001n } });
    });

    it('should set moderator role for a user', async () => {
      const result = simnet.mineBlock([
        tx.callPublicFn('market', 'set-moderator-role', [principalCV(user1), boolCV(true)], deployer)
      ]);
      expect(result[0].result).toEqual({ type: 'ok', value: { type: 'true' } });
    });

    it('should revoke moderator role for a user', async () => {
      simnet.mineBlock([
        tx.callPublicFn('market', 'set-moderator-role', [principalCV(user1), boolCV(true)], deployer)
      ]);
      const result = simnet.mineBlock([
        tx.callPublicFn('market', 'set-moderator-role', [principalCV(user1), boolCV(false)], deployer)
      ]);
      expect(result[0].result).toEqual({ type: 'ok', value: { type: 'true' } });
    });

    it('should fail to set moderator role if not owner', async () => {
      const result = simnet.mineBlock([
        tx.callPublicFn('market', 'set-moderator-role', [principalCV(user1), boolCV(true)], user1)
      ]);
      expect(result[0].result).toEqual({ type: 'err', value: { type: 'uint', value: 2001n } });
    });
  });

  describe('Market Creation', () => {
    beforeEach(async () => {
      const collateralTokenAddress = `${deployer}.token`;
      simnet.mineBlock([
        tx.callPublicFn('market', 'initialize', [principalCV(simnet.deployer), principalCV(collateralTokenAddress)], deployer)
      ]);
    });

    it('should fail to create market with zero liquidity', async () => {
      const currentBlock = simnet.blockHeight;
      const result = simnet.mineBlock([
        tx.callPublicFn('market', 'create-market', [uintCV(0), uintCV(currentBlock + 10), uintCV(currentBlock + 100), stringAsciiCV('Test question'), stringAsciiCV('ipfs-hash')], deployer)
      ]);
      expect(result[0].result).toEqual({ type: 'err', value: { type: 'uint', value: 2002n } });
    });

    it('should fail to create market if end-time <= start-time', async () => {
      const currentBlock = simnet.blockHeight;
      const result = simnet.mineBlock([
        tx.callPublicFn('market', 'create-market', [uintCV(1000000), uintCV(currentBlock + 100), uintCV(currentBlock + 10), stringAsciiCV('Test question'), stringAsciiCV('ipfs-hash')], deployer)
      ]);
      expect(result[0].result).toEqual({ type: 'err', value: { type: 'uint', value: 2008n } });
    });

    it('should fail to create market if start-time < current block', async () => {
      const currentBlock = simnet.blockHeight;
      const result = simnet.mineBlock([
        tx.callPublicFn('market', 'create-market', [uintCV(1000000), uintCV(currentBlock - 1), uintCV(currentBlock + 100), stringAsciiCV('Test question'), stringAsciiCV('ipfs-hash')], deployer)
      ]);
      expect(result[0].result).toEqual({ type: 'err', value: { type: 'uint', value: 2008n } });
    });

    it('should fail to create market if not owner', async () => {
      const currentBlock = simnet.blockHeight;
      const result = simnet.mineBlock([
        tx.callPublicFn('market', 'create-market', [uintCV(1000000), uintCV(currentBlock + 10), uintCV(currentBlock + 100), stringAsciiCV('Test question'), stringAsciiCV('ipfs-hash')], user1)
      ]);
      expect(result[0].result).toEqual({ type: 'err', value: { type: 'uint', value: 2001n } });
    });
  });

  describe('Buy/Sell Failures', () => {
    beforeEach(async () => {
      const collateralTokenAddress = `${deployer}.token`;
      simnet.mineBlock([
        tx.callPublicFn('market', 'initialize', [principalCV(simnet.deployer), principalCV(collateralTokenAddress)], deployer)
      ]);
    });

    it('should fail to buy YES if market does not exist', async () => {
      const result = simnet.mineBlock([
        tx.callPublicFn('market', 'buy-yes', [uintCV(99999), uintCV(1000000)], user1)
      ]);
      expect(result[0].result).toEqual({ type: 'err', value: { type: 'uint', value: 2005n } });
    });

    it('should fail to buy NO if market does not exist', async () => {
      const result = simnet.mineBlock([
        tx.callPublicFn('market', 'buy-no', [uintCV(99999), uintCV(1000000)], user1)
      ]);
      expect(result[0].result).toEqual({ type: 'err', value: { type: 'uint', value: 2005n } });
    });
  });

  describe('Token Transfer Errors', () => {
    it('should fail to transfer if not sender', async () => {
      const result = simnet.mineBlock([
        tx.callPublicFn('market', 'transfer', [uintCV(1), uintCV(1000000), principalCV(user1), principalCV(user2)], user2)
      ]);
      expect(result[0].result).toEqual({ type: 'err', value: { type: 'uint', value: 2001n } });
    });
  });

  describe('Read-Only Functions', () => {
    it('should get token ID for YES outcome', async () => {
      const result = [simnet.callReadOnlyFn('market', 'get-token-id', [uintCV(1), uintCV(1)], deployer)];
      expect((result[0].result as any).type).toBe('ok');
    });

    it('should get token ID for NO outcome', async () => {
      const result = [simnet.callReadOnlyFn('market', 'get-token-id', [uintCV(1), uintCV(0)], deployer)];
      expect((result[0].result as any).type).toBe('ok');
    });
  });

  describe('Expiration Consistency', () => {
    it('should maintain market data consistency through expiration', async () => {
      const collateralTokenAddress = `${deployer}.token`;
      simnet.mineBlock([
        tx.callPublicFn('market', 'initialize', [principalCV(simnet.deployer), principalCV(collateralTokenAddress)], deployer)
      ]);

      const currentBlock = simnet.blockHeight;
      const createResult = simnet.mineBlock([
        tx.callPublicFn('market', 'create-market', [uintCV(1000000), uintCV(currentBlock + 10), uintCV(currentBlock + 20), stringAsciiCV('Exp test'), stringAsciiCV('ipfs')], deployer)
      ]);
      const marketId = Number((createResult[0].result as any).value.value);

      const marketBefore = [simnet.callReadOnlyFn('market', 'get-market', [uintCV(marketId)], deployer)];

      for (let i = 0; i < 30; i++) {
        simnet.mineBlock([]);
      }

      const marketAfter = [simnet.callReadOnlyFn('market', 'get-market', [uintCV(marketId)], deployer)];
      expect((marketBefore[0].result as any).type).toBe('ok');
      expect((marketAfter[0].result as any).type).toBe('ok');
    });
  });
});
