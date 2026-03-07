import { describe, it, expect, beforeEach } from 'vitest';
import { tx } from '@stacks/clarinet-sdk';
import { uintCV, stringAsciiCV, principalCV } from '@stacks/transactions';

// @ts-ignore
declare const simnet: any;

describe('Market Trading Tests', () => {
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
        uintCV(currentBlock + 100), 
        stringAsciiCV('Test Market'), 
        stringAsciiCV('ipfs-hash')
      ], deployer)
    ]);
    
    marketId = Number((createResult[0].result as any).value.value);
  });

  it('should fail to buy YES on non-existent market', () => {
    const result = simnet.mineBlock([
      tx.callPublicFn('contract', 'buy-yes', [uintCV(99999), uintCV(1000000)], user1)
    ]);
    
    expect(result[0].result).toEqual({ type: 'err', value: { type: 'uint', value: 2005n } });
  });

  it('should fail to buy NO on non-existent market', () => {
    const result = simnet.mineBlock([
      tx.callPublicFn('contract', 'buy-no', [uintCV(99999), uintCV(1000000)], user1)
    ]);
    
    expect(result[0].result).toEqual({ type: 'err', value: { type: 'uint', value: 2005n } });
  });

  it('should fail to buy with zero amount', () => {
    const result = simnet.mineBlock([
      tx.callPublicFn('contract', 'buy-yes', [uintCV(marketId), uintCV(0)], user1)
    ]);
    
    expect(result[0].result).toEqual({ type: 'err', value: { type: 'uint', value: 2008n } });
  });

  it('should get market data', () => {
    const result = [simnet.callReadOnlyFn('contract', 'get-market', [uintCV(marketId)], deployer)];
    
    expect((result[0].result as any).type).toBe('ok');
    expect((result[0].result as any).value.value).toBeDefined();
  });
});
