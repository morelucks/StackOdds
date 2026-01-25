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
});
