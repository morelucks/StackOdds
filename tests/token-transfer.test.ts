import { describe, it, expect, beforeEach } from 'vitest';
import { tx } from '@stacks/clarinet-sdk';
import { uintCV, principalCV } from '@stacks/transactions';

// @ts-ignore
declare const simnet: any;

describe('Token Transfer Tests', () => {
  let deployer: any;
  let user1: any;
  let user2: any;

  beforeEach(() => {
    deployer = simnet.getAccounts().get('deployer')!;
    user1 = simnet.getAccounts().get('wallet_1')!;
    user2 = simnet.getAccounts().get('wallet_2')!;
    
    simnet.mineBlock([
      tx.callPublicFn('token', 'initialize', [principalCV(`${deployer}.contract`)], deployer)
    ]);
  });

  it('should fail to transfer if not sender', () => {
    const result = simnet.mineBlock([
      tx.callPublicFn('contract', 'transfer', [
        uintCV(1), 
        uintCV(1000000), 
        principalCV(user1), 
        principalCV(user2)
      ], user2)
    ]);
    
    expect(result[0].result).toEqual({ type: 'err', value: { type: 'uint', value: 2001n } });
  });

  it('should fail to transfer with insufficient balance', () => {
    const result = simnet.mineBlock([
      tx.callPublicFn('contract', 'transfer', [
        uintCV(1), 
        uintCV(1000000), 
        principalCV(user1), 
        principalCV(user2)
      ], user1)
    ]);
    
    expect(result[0].result).toEqual({ type: 'err', value: { type: 'uint', value: 2011n } });
  });

  it('should get balance for user', () => {
    const result = [simnet.callReadOnlyFn('contract', 'get-balance', [uintCV(1), principalCV(user1)], deployer)];
    
    expect((result[0].result as any).type).toBe('ok');
    expect((result[0].result as any).value.value).toBe(0n);
  });

  it('should get total supply', () => {
    const result = [simnet.callReadOnlyFn('contract', 'get-total-supply', [uintCV(1)], deployer)];
    
    expect((result[0].result as any).type).toBe('ok');
  });

  it('should get token metadata', () => {
    const result = [simnet.callReadOnlyFn('contract', 'get-token-metadata', [uintCV(1)], deployer)];
    
    expect((result[0].result as any).type).toBe('ok');
  });
});
