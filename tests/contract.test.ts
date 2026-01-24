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
    it('should initialize contract with owner, collateral, and outcome token', async () => {
      // Initialize token first
      simnet.mineBlock([
        tx.callPublicFn('token', 'initialize', [principalCV(contractAddress)], deployer.address)
      ]);

      // Initialize contract
      const result = simnet.mineBlock([
        tx.callPublicFn(
          'contract',
          'initialize',
          [
            principalCV(simnet.deployer.address),
            principalCV(simnet.deployer.address),
            principalCV(tokenAddress)
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
