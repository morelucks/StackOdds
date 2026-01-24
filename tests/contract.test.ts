import { describe, it, expect, beforeEach } from 'vitest';
import { tx } from '@stacks/clarinet-sdk';
import { uintCV, stringAsciiCV, principalCV } from '@stacks/transactions';

// @ts-ignore - simnet is provided by vitest-environment-clarinet
declare const simnet: any;

describe('Contract Tests', () => {
  let deployer: any;
  let contractAddress: string;
  let tokenAddress: string;

  beforeEach(() => {
    deployer = simnet.deployer;
    contractAddress = `${deployer.address}.contract`;
    tokenAddress = `${deployer.address}.token`;
  });

  describe('Initialization', () => {
    it('should initialize contract with owner and collateral token', async () => {
      // Initialize contract with contract principals (address.contract-name format)
      // Note: Outcome token functionality is now merged into the main contract
      // In simnet, we can use the deployer address as collateral for testing
      const collateralTokenAddress = `${deployer.address}.token`; // Using token as collateral for testing
      
      const result = simnet.mineBlock([
        tx.callPublicFn(
          'contract',
          'initialize',
          [
            principalCV(simnet.deployer.address), // owner (can be address principal)
            principalCV(collateralTokenAddress)      // collateral token (MUST be contract principal)
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
  });
});
