import { describe, it, expect, beforeEach } from 'vitest';
import { tx } from '@stacks/clarinet-sdk';
import { uintCV, stringAsciiCV, principalCV } from '@stacks/transactions';

// @ts-ignore
declare const simnet: any;

describe('Market Creation Tests', () => {
  let deployer: any;
  let user1: any;

  beforeEach(() => {
    deployer = simnet.getAccounts().get('deployer')!;
    user1 = simnet.getAccounts().get('wallet_1')!;
    
    simnet.mineBlock([
      tx.callPublicFn('token', 'initialize', [principalCV(`${deployer}.contract`)], deployer)
    ]);
    
    const collateralTokenAddress = `${deployer}.token`;
    simnet.mineBlock([
      tx.callPublicFn('contract', 'initialize', [principalCV(simnet.deployer), principalCV(collateralTokenAddress)], deployer)
    ]);
  });

  it('should create a market successfully', () => {
    const currentBlock = simnet.blockHeight;
    const result = simnet.mineBlock([
      tx.callPublicFn('contract', 'create-market', [
        uintCV(1000000), 
        uintCV(currentBlock + 10), 
        uintCV(currentBlock + 100), 
        stringAsciiCV('Will BTC reach $100k?'), 
        stringAsciiCV('ipfs-hash-123')
      ], deployer)
    ]);
    
    expect(result[0].result.type).toBe('ok');
  });

  it('should increment market count after creation', () => {
    const currentBlock = simnet.blockHeight;
    simnet.mineBlock([
      tx.callPublicFn('contract', 'create-market', [
        uintCV(1000000), 
        uintCV(currentBlock + 10), 
        uintCV(currentBlock + 100), 
        stringAsciiCV('Test'), 
        stringAsciiCV('ipfs')
      ], deployer)
    ]);
    
    const count = [simnet.callReadOnlyFn('contract', 'get-market-count', [], deployer)];
    expect((count[0].result as any).value.value).toBe(1n);
  });

  it('should fail with zero liquidity', () => {
    const currentBlock = simnet.blockHeight;
    const result = simnet.mineBlock([
      tx.callPublicFn('contract', 'create-market', [
        uintCV(0), 
        uintCV(currentBlock + 10), 
        uintCV(currentBlock + 100), 
        stringAsciiCV('Test'), 
        stringAsciiCV('ipfs')
      ], deployer)
    ]);
    
    expect(result[0].result).toEqual({ type: 'err', value: { type: 'uint', value: 2002n } });
  });

  it('should fail if end-time <= start-time', () => {
    const currentBlock = simnet.blockHeight;
    const result = simnet.mineBlock([
      tx.callPublicFn('contract', 'create-market', [
        uintCV(1000000), 
        uintCV(currentBlock + 100), 
        uintCV(currentBlock + 10), 
        stringAsciiCV('Test'), 
        stringAsciiCV('ipfs')
      ], deployer)
    ]);
    
    expect(result[0].result).toEqual({ type: 'err', value: { type: 'uint', value: 2008n } });
  });

  it('should fail if not owner', () => {
    const currentBlock = simnet.blockHeight;
    const result = simnet.mineBlock([
      tx.callPublicFn('contract', 'create-market', [
        uintCV(1000000), 
        uintCV(currentBlock + 10), 
        uintCV(currentBlock + 100), 
        stringAsciiCV('Test'), 
        stringAsciiCV('ipfs')
      ], user1)
    ]);
    
    expect(result[0].result).toEqual({ type: 'err', value: { type: 'uint', value: 2001n } });
  });
});
