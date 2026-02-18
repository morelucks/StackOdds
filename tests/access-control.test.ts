import { describe, it, expect, beforeEach } from 'vitest';
import { tx } from '@stacks/clarinet-sdk';
import { uintCV, principalCV, boolCV } from '@stacks/transactions';

// @ts-ignore
declare const simnet: any;

describe('Access Control Tests', () => {
  let deployer: any;
  let user1: any;
  let user2: any;

  beforeEach(() => {
    deployer = simnet.getAccounts().get('deployer')!;
    user1 = simnet.getAccounts().get('wallet_1')!;
    user2 = simnet.getAccounts().get('wallet_2')!;
    
    const collateralTokenAddress = `${deployer}.token`;
    simnet.mineBlock([
      tx.callPublicFn('contract', 'initialize', [principalCV(simnet.deployer), principalCV(collateralTokenAddress)], deployer)
    ]);
  });

  describe('Admin Role', () => {
    it('should grant admin role', () => {
      const result = simnet.mineBlock([
        tx.callPublicFn('contract', 'set-admin-role', [principalCV(user1), boolCV(true)], deployer)
      ]);
      
      expect(result[0].result).toEqual({ type: 'ok', value: { type: 'true' } });
    });

    it('should revoke admin role', () => {
      simnet.mineBlock([
        tx.callPublicFn('contract', 'set-admin-role', [principalCV(user1), boolCV(true)], deployer)
      ]);
      
      const result = simnet.mineBlock([
        tx.callPublicFn('contract', 'set-admin-role', [principalCV(user1), boolCV(false)], deployer)
      ]);
      
      expect(result[0].result).toEqual({ type: 'ok', value: { type: 'true' } });
    });

    it('should fail to set admin role if not owner', () => {
      const result = simnet.mineBlock([
        tx.callPublicFn('contract', 'set-admin-role', [principalCV(user2), boolCV(true)], user1)
      ]);
      
      expect(result[0].result).toEqual({ type: 'err', value: { type: 'uint', value: 2001n } });
    });
  });

  describe('Moderator Role', () => {
    it('should grant moderator role', () => {
      const result = simnet.mineBlock([
        tx.callPublicFn('contract', 'set-moderator-role', [principalCV(user1), boolCV(true)], deployer)
      ]);
      
      expect(result[0].result).toEqual({ type: 'ok', value: { type: 'true' } });
    });

    it('should revoke moderator role', () => {
      simnet.mineBlock([
        tx.callPublicFn('contract', 'set-moderator-role', [principalCV(user1), boolCV(true)], deployer)
      ]);
      
      const result = simnet.mineBlock([
        tx.callPublicFn('contract', 'set-moderator-role', [principalCV(user1), boolCV(false)], deployer)
      ]);
      
      expect(result[0].result).toEqual({ type: 'ok', value: { type: 'true' } });
    });

    it('should fail to set moderator role if not owner', () => {
      const result = simnet.mineBlock([
        tx.callPublicFn('contract', 'set-moderator-role', [principalCV(user2), boolCV(true)], user1)
      ]);
      
      expect(result[0].result).toEqual({ type: 'err', value: { type: 'uint', value: 2001n } });
    });
  });

  describe('Authorization Check', () => {
    it('should check authorization for admin', () => {
      simnet.mineBlock([
        tx.callPublicFn('contract', 'set-admin-role', [principalCV(user1), boolCV(true)], deployer)
      ]);
      
      const result = [simnet.callReadOnlyFn('contract', 'is-authorized', [principalCV(user1)], deployer)];
      
      expect((result[0].result as any).type).toBe('ok');
    });

    it('should check authorization for moderator', () => {
      simnet.mineBlock([
        tx.callPublicFn('contract', 'set-moderator-role', [principalCV(user1), boolCV(true)], deployer)
      ]);
      
      const result = [simnet.callReadOnlyFn('contract', 'is-authorized', [principalCV(user1)], deployer)];
      
      expect((result[0].result as any).type).toBe('ok');
    });
  });
});
