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
  let tokenAddress: string;

  beforeEach(() => {
    deployer = simnet.deployer;
    user1 = simnet.accounts.get('wallet_1')!;
    user2 = simnet.accounts.get('wallet_2')!;
    contractAddress = `${deployer.address}.contract`;
    tokenAddress = `${deployer.address}.token`;
  });

  describe('Initialization', () => {
    it('should initialize contract with owner and collateral token', async () => {
      const collateralTokenAddress = `${deployer.address}.token`;
      
      const result = simnet.mineBlock([
        tx.callPublicFn(
          'contract',
          'initialize',
          [
            principalCV(simnet.deployer.address),
            principalCV(collateralTokenAddress)
          ],
          deployer.address
        )
      ]);

      expect(result[0].result).toBe('(ok true)');
    });

    it('should get initial market count of zero', async () => {
      const result = simnet.mineBlock([
        tx.callPublicFn('contract', 'get-market-count', [], deployer.address)
      ]);

      expect(result[0].result).toBe('(ok u0)');
    });

    it('should get contract owner after initialization', async () => {
      const collateralTokenAddress = `${deployer.address}.token`;
      
      simnet.mineBlock([
        tx.callPublicFn(
          'contract',
          'initialize',
          [
            principalCV(simnet.deployer.address),
            principalCV(collateralTokenAddress)
          ],
          deployer.address
        )
      ]);

      const result = simnet.mineBlock([
        tx.callPublicFn('contract', 'get-owner', [], deployer.address)
      ]);

      expect(result[0].result).toContain('(ok');
    });
  });

  describe('Role Management', () => {
    beforeEach(async () => {
      const collateralTokenAddress = `${deployer.address}.token`;
      simnet.mineBlock([
        tx.callPublicFn(
          'contract',
          'initialize',
          [
            principalCV(simnet.deployer.address),
            principalCV(collateralTokenAddress)
          ],
          deployer.address
        )
      ]);
    });

    it('should set admin role for a user', async () => {
      const result = simnet.mineBlock([
        tx.callPublicFn(
          'contract',
          'set-admin-role',
          [
            principalCV(user1.address),
            boolCV(true)
          ],
          deployer.address
        )
      ]);

      expect(result[0].result).toBe('(ok true)');
    });

    it('should revoke admin role for a user', async () => {
      simnet.mineBlock([
        tx.callPublicFn(
          'contract',
          'set-admin-role',
          [
            principalCV(user1.address),
            boolCV(true)
          ],
          deployer.address
        )
      ]);

      const result = simnet.mineBlock([
        tx.callPublicFn(
          'contract',
          'set-admin-role',
          [
            principalCV(user1.address),
            boolCV(false)
          ],
          deployer.address
        )
      ]);

      expect(result[0].result).toBe('(ok true)');
    });

    it('should fail to set admin role if not owner', async () => {
      const result = simnet.mineBlock([
        tx.callPublicFn(
          'contract',
          'set-admin-role',
          [
            principalCV(user1.address),
            boolCV(true)
          ],
          user1.address
        )
      ]);

      expect(result[0].result).toContain('(err u2001)');
    });

    it('should set moderator role for a user', async () => {
      const result = simnet.mineBlock([
        tx.callPublicFn(
          'contract',
          'set-moderator-role',
          [
            principalCV(user1.address),
            boolCV(true)
          ],
          deployer.address
        )
      ]);

      expect(result[0].result).toBe('(ok true)');
    });

    it('should revoke moderator role for a user', async () => {
      simnet.mineBlock([
        tx.callPublicFn(
          'contract',
          'set-moderator-role',
          [
            principalCV(user1.address),
            boolCV(true)
          ],
          deployer.address
        )
      ]);

      const result = simnet.mineBlock([
        tx.callPublicFn(
          'contract',
          'set-moderator-role',
          [
            principalCV(user1.address),
            boolCV(false)
          ],
          deployer.address
        )
      ]);

      expect(result[0].result).toBe('(ok true)');
    });

    it('should fail to set moderator role if not owner', async () => {
      const result = simnet.mineBlock([
        tx.callPublicFn(
          'contract',
          'set-moderator-role',
          [
            principalCV(user1.address),
            boolCV(true)
          ],
          user1.address
        )
      ]);

      expect(result[0].result).toContain('(err u2001)');
    });
  });

  describe('Market Creation', () => {
    beforeEach(async () => {
      const collateralTokenAddress = `${deployer.address}.token`;
      simnet.mineBlock([
        tx.callPublicFn(
          'contract',
          'initialize',
          [
            principalCV(simnet.deployer.address),
            principalCV(collateralTokenAddress)
          ],
          deployer.address
        )
      ]);
    });

    it('should create a new market successfully', async () => {
      const currentBlock = simnet.blockHeight;
      const result = simnet.mineBlock([
        tx.callPublicFn(
          'contract',
          'create-market',
          [
            uintCV(1000000), // b = 1 USDCx (6 decimals)
            uintCV(currentBlock + 10),
            uintCV(currentBlock + 100),
            stringAsciiCV('Will Bitcoin reach $100k by 2026?'),
            stringAsciiCV('ipfs-hash-123')
          ],
          deployer.address
        )
      ]);

      expect(result[0].result).toContain('(ok u');
    });

    it('should fail to create market with zero liquidity', async () => {
      const currentBlock = simnet.blockHeight;
      const result = simnet.mineBlock([
        tx.callPublicFn(
          'contract',
          'create-market',
          [
            uintCV(0),
            uintCV(currentBlock + 10),
            uintCV(currentBlock + 100),
            stringAsciiCV('Test question'),
            stringAsciiCV('ipfs-hash')
          ],
          deployer.address
        )
      ]);

      expect(result[0].result).toContain('(err u2002)');
    });

    it('should fail to create market if end-time <= start-time', async () => {
      const currentBlock = simnet.blockHeight;
      const result = simnet.mineBlock([
        tx.callPublicFn(
          'contract',
          'create-market',
          [
            uintCV(1000000),
            uintCV(currentBlock + 100),
            uintCV(currentBlock + 10), // end before start
            stringAsciiCV('Test question'),
            stringAsciiCV('ipfs-hash')
          ],
          deployer.address
        )
      ]);

      expect(result[0].result).toContain('(err u2008)');
    });

    it('should fail to create market if start-time < current block', async () => {
      const currentBlock = simnet.blockHeight;
      const result = simnet.mineBlock([
        tx.callPublicFn(
          'contract',
          'create-market',
          [
            uintCV(1000000),
            uintCV(currentBlock - 1), // start in the past
            uintCV(currentBlock + 100),
            stringAsciiCV('Test question'),
            stringAsciiCV('ipfs-hash')
          ],
          deployer.address
        )
      ]);

      expect(result[0].result).toContain('(err u2008)');
    });

    it('should fail to create market if not owner', async () => {
      const currentBlock = simnet.blockHeight;
      const result = simnet.mineBlock([
        tx.callPublicFn(
          'contract',
          'create-market',
          [
            uintCV(1000000),
            uintCV(currentBlock + 10),
            uintCV(currentBlock + 100),
            stringAsciiCV('Test question'),
            stringAsciiCV('ipfs-hash')
          ],
          user1.address
        )
      ]);

      expect(result[0].result).toContain('(err u2001)');
    });

    it('should increment market count after creation', async () => {
      const currentBlock = simnet.blockHeight;
      simnet.mineBlock([
        tx.callPublicFn(
          'contract',
          'create-market',
          [
            uintCV(1000000),
            uintCV(currentBlock + 10),
            uintCV(currentBlock + 100),
            stringAsciiCV('Test question'),
            stringAsciiCV('ipfs-hash')
          ],
          deployer.address
        )
      ]);

      const result = simnet.mineBlock([
        tx.callPublicFn('contract', 'get-market-count', [], deployer.address)
      ]);

      expect(result[0].result).toBe('(ok u1)');
    });
  });

  describe('Buy YES Shares', () => {
    let marketId: number;
    let currentBlock: number;

    beforeEach(async () => {
      const collateralTokenAddress = `${deployer.address}.token`;
      simnet.mineBlock([
        tx.callPublicFn(
          'contract',
          'initialize',
          [
            principalCV(simnet.deployer.address),
            principalCV(collateralTokenAddress)
          ],
          deployer.address
        )
      ]);

      currentBlock = simnet.blockHeight;
      const createResult = simnet.mineBlock([
        tx.callPublicFn(
          'contract',
          'create-market',
          [
            uintCV(1000000),
            uintCV(currentBlock + 10),
            uintCV(currentBlock + 1000),
            stringAsciiCV('Will Ethereum reach $5000?'),
            stringAsciiCV('ipfs-hash-eth')
          ],
          deployer.address
        )
      ]);

      // Extract market ID from result
      const resultStr = createResult[0].result as string;
      marketId = parseInt(resultStr.match(/u(\d+)/)?.[1] || '1');
    });

    it('should allow buying YES shares', async () => {
      const result = simnet.mineBlock([
        tx.callPublicFn(
          'contract',
          'buy-yes',
          [
            uintCV(marketId),
            uintCV(1000000) // 1 USDCx
          ],
          user1.address
        )
      ]);

      expect(result[0].result).toBe('(ok true)');
    });

    it('should update user balance after buying YES', async () => {
      simnet.mineBlock([
        tx.callPublicFn(
          'contract',
          'buy-yes',
          [
            uintCV(marketId),
            uintCV(1000000)
          ],
          user1.address
        )
      ]);

      // Get token ID for YES outcome
      const tokenIdResult = simnet.mineBlock([
        tx.callPublicFn(
          'contract',
          'get-token-id',
          [
            uintCV(marketId),
            uintCV(1) // YES outcome
          ],
          deployer.address
        )
      ]);

      const tokenIdStr = tokenIdResult[0].result as string;
      const tokenId = parseInt(tokenIdStr.match(/u(\d+)/)?.[1] || '0');

      const balanceResult = simnet.mineBlock([
        tx.callPublicFn(
          'contract',
          'get-balance',
          [
            uintCV(tokenId),
            principalCV(user1.address)
          ],
          deployer.address
        )
      ]);

      expect(balanceResult[0].result).toContain('u1000000');
    });

    it('should fail to buy YES if market does not exist', async () => {
      const result = simnet.mineBlock([
        tx.callPublicFn(
          'contract',
          'buy-yes',
          [
            uintCV(99999), // Non-existent market
            uintCV(1000000)
          ],
          user1.address
        )
      ]);

      expect(result[0].result).toContain('(err u2005)');
    });

    it('should fail to buy YES with zero amount', async () => {
      const result = simnet.mineBlock([
        tx.callPublicFn(
          'contract',
          'buy-yes',
          [
            uintCV(marketId),
            uintCV(0)
          ],
          user1.address
        )
      ]);

      expect(result[0].result).toContain('(err u2008)');
    });
  });

  describe('Buy NO Shares', () => {
    let marketId: number;
    let currentBlock: number;

    beforeEach(async () => {
      const collateralTokenAddress = `${deployer.address}.token`;
      simnet.mineBlock([
        tx.callPublicFn(
          'contract',
          'initialize',
          [
            principalCV(simnet.deployer.address),
            principalCV(collateralTokenAddress)
          ],
          deployer.address
        )
      ]);

      currentBlock = simnet.blockHeight;
      const createResult = simnet.mineBlock([
        tx.callPublicFn(
          'contract',
          'create-market',
          [
            uintCV(1000000),
            uintCV(currentBlock + 10),
            uintCV(currentBlock + 1000),
            stringAsciiCV('Will Solana reach $200?'),
            stringAsciiCV('ipfs-hash-sol')
          ],
          deployer.address
        )
      ]);

      const resultStr = createResult[0].result as string;
      marketId = parseInt(resultStr.match(/u(\d+)/)?.[1] || '1');
    });

    it('should allow buying NO shares', async () => {
      const result = simnet.mineBlock([
        tx.callPublicFn(
          'contract',
          'buy-no',
          [
            uintCV(marketId),
            uintCV(1000000) // 1 USDCx
          ],
          user1.address
        )
      ]);

      expect(result[0].result).toBe('(ok true)');
    });

    it('should update user balance after buying NO', async () => {
      simnet.mineBlock([
        tx.callPublicFn(
          'contract',
          'buy-no',
          [
            uintCV(marketId),
            uintCV(2000000) // 2 USDCx
          ],
          user2.address
        )
      ]);

      const tokenIdResult = simnet.mineBlock([
        tx.callPublicFn(
          'contract',
          'get-token-id',
          [
            uintCV(marketId),
            uintCV(0) // NO outcome
          ],
          deployer.address
        )
      ]);

      const tokenIdStr = tokenIdResult[0].result as string;
      const tokenId = parseInt(tokenIdStr.match(/u(\d+)/)?.[1] || '0');

      const balanceResult = simnet.mineBlock([
        tx.callPublicFn(
          'contract',
          'get-balance',
          [
            uintCV(tokenId),
            principalCV(user2.address)
          ],
          deployer.address
        )
      ]);

      expect(balanceResult[0].result).toContain('u2000000');
    });

    it('should fail to buy NO if market does not exist', async () => {
      const result = simnet.mineBlock([
        tx.callPublicFn(
          'contract',
          'buy-no',
          [
            uintCV(99999),
            uintCV(1000000)
          ],
          user1.address
        )
      ]);

      expect(result[0].result).toContain('(err u2005)');
    });

    it('should fail to buy NO with zero amount', async () => {
      const result = simnet.mineBlock([
        tx.callPublicFn(
          'contract',
          'buy-no',
          [
            uintCV(marketId),
            uintCV(0)
          ],
          user1.address
        )
      ]);

      expect(result[0].result).toContain('(err u2008)');
    });
  });

  describe('Market Resolution', () => {
    let marketId: number;
    let currentBlock: number;

    beforeEach(async () => {
      const collateralTokenAddress = `${deployer.address}.token`;
      simnet.mineBlock([
        tx.callPublicFn(
          'contract',
          'initialize',
          [
            principalCV(simnet.deployer.address),
            principalCV(collateralTokenAddress)
          ],
          deployer.address
        )
      ]);

      currentBlock = simnet.blockHeight;
      const createResult = simnet.mineBlock([
        tx.callPublicFn(
          'contract',
          'create-market',
          [
            uintCV(1000000),
            uintCV(currentBlock + 10),
            uintCV(currentBlock + 100),
            stringAsciiCV('Will the price go up?'),
            stringAsciiCV('ipfs-hash')
          ],
          deployer.address
        )
      ]);

      const resultStr = createResult[0].result as string;
      marketId = parseInt(resultStr.match(/u(\d+)/)?.[1] || '1');

      // Advance blocks to pass end time
      for (let i = 0; i < 110; i++) {
        simnet.mineBlock([]);
      }
    });

    it('should resolve market as YES won', async () => {
      const result = simnet.mineBlock([
        tx.callPublicFn(
          'contract',
          'resolve-market',
          [
            uintCV(marketId),
            boolCV(true)
          ],
          deployer.address
        )
      ]);

      expect(result[0].result).toBe('(ok true)');
    });
  });
});
