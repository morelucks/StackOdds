import { describe, it, expect, beforeEach } from 'vitest';
import { tx } from '@stacks/clarinet-sdk';

import { uintCV, principalCV, stringAsciiCV } from '@stacks/transactions';

// @ts-ignore - simnet is provided by vitest-environment-clarinet
declare const simnet: any;

describe('Token Contract Tests', () => {
  let deployer: any;
  let user1: any;
  let user2: any;

  beforeEach(() => {
    const accounts = simnet.getAccounts();
    deployer = accounts.get('deployer')!;
    user1 = accounts.get('wallet_1')!;
    user2 = accounts.get('wallet_2')!;
  });





  it('should initialize token contract with owner', async () => {
    const { result } = simnet.callPublicFn(
      'token',
      'initialize',
      [principalCV(deployer)],
      deployer
    );
    expect(result).toEqual({ type: 'ok', value: { type: 'true' } });

    const ownerResult = simnet.callReadOnlyFn(
      'token',
      'get-contract-owner',
      [],
      deployer
    );
    expect(ownerResult.result).toEqual({ type: 'ok', value: { type: 'address', value: deployer } });

  });

  it('should mint tokens to recipient correctly', async () => {
    // First initialize
    simnet.callPublicFn('token', 'initialize', [principalCV(deployer)], deployer);

    // Initialize a token for market 1
    simnet.callPublicFn(
      'token',
      'initialize-token',
      [
        uintCV(1), // market-id
        uintCV(101), // yes-token-id
        uintCV(102), // no-token-id
        stringAsciiCV('Market 1 YES'),
        stringAsciiCV('Market 1 NO'),
        stringAsciiCV('M1Y'),
        stringAsciiCV('M1N')
      ],
      deployer
    );

    const { result } = simnet.callPublicFn(
      'token',
      'mint',
      [uintCV(101), principalCV(user1), uintCV(1000000)],
      deployer
    );
    expect(result).toEqual({ type: 'ok', value: { type: 'true' } });

    const balanceResult = simnet.callReadOnlyFn(
      'token',
      'get-balance',
      [uintCV(101), principalCV(user1)],
      deployer
    );
    expect(balanceResult.result).toEqual({ type: 'ok', value: { type: 'uint', value: 1000000n } });

  });

  it('should transfer tokens between users correctly', async () => {
    // Setup: Initialize and mint to user1
    simnet.callPublicFn('token', 'initialize', [principalCV(deployer)], deployer);
    simnet.callPublicFn('token', 'initialize-token', [uintCV(1), uintCV(101), uintCV(102), stringAsciiCV('Y'), stringAsciiCV('N'), stringAsciiCV('Y'), stringAsciiCV('N')], deployer);
    simnet.callPublicFn('token', 'mint', [uintCV(101), principalCV(user1), uintCV(1000000)], deployer);

    const { result } = simnet.callPublicFn(
      'token',
      'transfer',
      [uintCV(101), uintCV(400000), principalCV(user1), principalCV(user2)],
      user1
    );
    expect(result).toEqual({ type: 'ok', value: { type: 'true' } });

    const user1Balance = simnet.callReadOnlyFn('token', 'get-balance', [uintCV(101), principalCV(user1)], deployer);
    const user2Balance = simnet.callReadOnlyFn('token', 'get-balance', [uintCV(101), principalCV(user2)], deployer);

    expect(user1Balance.result).toEqual({ type: 'ok', value: { type: 'uint', value: 600000n } });
    expect(user2Balance.result).toEqual({ type: 'ok', value: { type: 'uint', value: 400000n } });

  });

  it('should fail to transfer more than balance', async () => {
    simnet.callPublicFn('token', 'initialize', [principalCV(deployer)], deployer);
    simnet.callPublicFn('token', 'initialize-token', [uintCV(1), uintCV(101), uintCV(102), stringAsciiCV('Y'), stringAsciiCV('N'), stringAsciiCV('Y'), stringAsciiCV('N')], deployer);
    simnet.callPublicFn('token', 'mint', [uintCV(101), principalCV(user1), uintCV(100000)], deployer);

    const { result } = simnet.callPublicFn(
      'token',
      'transfer',
      [uintCV(101), uintCV(150000), principalCV(user1), principalCV(user2)],
      user1
    );
    expect(result).toEqual({ type: 'err', value: { type: 'uint', value: 1004n } }); // ERR_INSUFFICIENT_BALANCE

  });

  it('should only allow owner to mint tokens', async () => {
    simnet.callPublicFn('token', 'initialize', [principalCV(deployer)], deployer);

    const { result } = simnet.callPublicFn(
      'token',
      'mint',
      [uintCV(101), principalCV(user1), uintCV(1000000)],
      user1 // Not owner
    );
    expect(result).toEqual({ type: 'err', value: { type: 'uint', value: 1001n } }); // ERR_UNAUTHORIZED

  });

  it('should only allow owner to burn tokens', async () => {
    simnet.callPublicFn('token', 'initialize', [principalCV(deployer)], deployer);
    simnet.callPublicFn('token', 'initialize-token', [uintCV(1), uintCV(101), uintCV(102), stringAsciiCV('Y'), stringAsciiCV('N'), stringAsciiCV('Y'), stringAsciiCV('N')], deployer);
    simnet.callPublicFn('token', 'mint', [uintCV(101), principalCV(user1), uintCV(1000000)], deployer);

    const { result } = simnet.callPublicFn(
      'token',
      'burn',
      [uintCV(101), principalCV(user1), uintCV(500000)],
      user1 // Not owner
    );
    expect(result).toEqual({ type: 'err', value: { type: 'uint', value: 1001n } });
  });

  it('should successfully burn tokens by owner', async () => {
    simnet.callPublicFn('token', 'initialize', [principalCV(deployer)], deployer);
    simnet.callPublicFn('token', 'initialize-token', [uintCV(1), uintCV(101), uintCV(102), stringAsciiCV('Y'), stringAsciiCV('N'), stringAsciiCV('Y'), stringAsciiCV('N')], deployer);
    simnet.callPublicFn('token', 'mint', [uintCV(101), principalCV(user1), uintCV(1000000)], deployer);

    const { result } = simnet.callPublicFn(
      'token',
      'burn',
      [uintCV(101), principalCV(user1), uintCV(400000)],
      deployer
    );
    expect(result).toEqual({ type: 'ok', value: { type: 'true' } });

    const balanceResult = simnet.callReadOnlyFn('token', 'get-balance', [uintCV(101), principalCV(user1)], deployer);
    expect(balanceResult.result).toEqual({ type: 'ok', value: { type: 'uint', value: 600000n } });

  });

  it('should fail to initialize token with non-owner principal', async () => {
    const { result } = simnet.callPublicFn(
      'token',
      'initialize',
      [principalCV(user1)],
      user1
    );
    // Deployment principal is the only one who can initialize
    expect(result).toEqual({ type: 'err', value: { type: 'uint', value: 1001n } });

  });

  it('should fail to initialize the same token twice', async () => {
    simnet.callPublicFn('token', 'initialize', [principalCV(deployer)], deployer);
    simnet.callPublicFn('token', 'initialize-token', [uintCV(1), uintCV(101), uintCV(102), stringAsciiCV('Y'), stringAsciiCV('N'), stringAsciiCV('Y'), stringAsciiCV('N')], deployer);

    const { result } = simnet.callPublicFn(
      'token',
      'initialize-token',
      [uintCV(1), uintCV(101), uintCV(102), stringAsciiCV('Y'), stringAsciiCV('N'), stringAsciiCV('Y'), stringAsciiCV('N')],
      deployer
    );
    // Contract logic should prevent re-initialization of the same market
    expect(result.type).toBe('err');

  });

  it('should properly track metadata across multiple markets', async () => {
    simnet.callPublicFn('token', 'initialize', [principalCV(deployer)], deployer);

    // Market 1
    simnet.callPublicFn('token', 'initialize-token', [uintCV(1), uintCV(101), uintCV(102), stringAsciiCV('M1 YES'), stringAsciiCV('M1 NO'), stringAsciiCV('M1Y'), stringAsciiCV('M1N')], deployer);
    // Market 2
    simnet.callPublicFn('token', 'initialize-token', [uintCV(2), uintCV(201), uintCV(202), stringAsciiCV('M2 YES'), stringAsciiCV('M2 NO'), stringAsciiCV('M2Y'), stringAsciiCV('M2N')], deployer);

    const m1Name = simnet.callReadOnlyFn('token', 'get-name', [uintCV(101)], deployer);
    const m2Name = simnet.callReadOnlyFn('token', 'get-name', [uintCV(201)], deployer);

    expect(m1Name.result.value.value).toContain('M1 YES');
    expect(m2Name.result.value.value).toContain('M2 YES');

  });
});








