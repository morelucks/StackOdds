import { describe, it, expect, beforeEach } from 'vitest';
import { tx } from '@stacks/clarinet-sdk';
import { uintCV, stringAsciiCV, principalCV, boolCV } from '@stacks/transactions';

// @ts-ignore
declare const simnet: any;

describe('Market Resolution Tests', () => {
  let deployer: any;
  let user1: any;
  let marketId: number;

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

    const currentBlock = simnet.blockHeight;
    const createResult = simnet.mineBlock([
      tx.callPublicFn('contract', 'create-market', [
        uintCV(1000000), 
        uintCV(currentBlock + 10), 
        uintCV(currentBlock + 20), 
        stringAsciiCV('Test Market'), 
        stringAsciiCV('ipfs-hash')
      ], deployer)
    ]);
    
    marketId = Number((createResult[0].result as any).value.value);
  });

  it('should fail to resolve before end time', () => {
    const result = simnet.mineBlock([
      tx.callPublicFn('contract', 'resolve-market', [uintCV(marketId), boolCV(true)], deployer)
    ]);
    
    expect(result[0].result).toEqual({ type: 'err', value: { type: 'uint', value: 2010n } });
  });

  it('should resolve market after end time', () => {
    // Mine blocks to pass end time
    for (let i = 0; i < 25; i++) {
      simnet.mineBlock([]);
    }
    
    const result = simnet.mineBlock([
      tx.callPublicFn('contract', 'resolve-market', [uintCV(marketId), boolCV(true)], deployer)
    ]);
    
    expect(result[0].result).toEqual({ type: 'ok', value: { type: 'true' } });
  });

  it('should fail to resolve twice', () => {
    for (let i = 0; i < 25; i++) {
      simnet.mineBlock([]);
    }
    
    simnet.mineBlock([
      tx.callPublicFn('contract', 'resolve-market', [uintCV(marketId), boolCV(true)], deployer)
    ]);
    
    const result = simnet.mineBlock([
      tx.callPublicFn('contract', 'resolve-market', [uintCV(marketId), boolCV(false)], deployer)
    ]);
    
    expect(result[0].result).toEqual({ type: 'err', value: { type: 'uint', value: 2003n } });
  });

  it('should fail to resolve if not owner', () => {
    for (let i = 0; i < 25; i++) {
      simnet.mineBlock([]);
    }
    
    const result = simnet.mineBlock([
      tx.callPublicFn('contract', 'resolve-market', [uintCV(marketId), boolCV(true)], user1)
    ]);
    
    expect(result[0].result).toEqual({ type: 'err', value: { type: 'uint', value: 2001n } });
  });
});
