import { describe, it, expect, beforeEach } from 'vitest';
import { Clarinet } from '@stacks/clarinet-sdk';

describe('Token Contract Tests', () => {
  let deployer: any;
  let user1: any;
  let user2: any;

  beforeEach(() => {
    deployer = simnet.deployer;
    user1 = simnet.accounts.get('wallet_1')!;
    user2 = simnet.accounts.get('wallet_2')!;
  });

  it('should initialize token contract with owner', async () => {
    const { result } = simnet.callPublicFn(
      'token',
      'initialize',
      [principalCV(deployer.address)],
      deployer.address
    );
    expect(result).toBe('(ok true)');

    const ownerResult = simnet.callReadOnlyFn(
      'token',
      'get-contract-owner',
      [],
      deployer.address
    );
    expect(ownerResult.result).toBe(principalCV(deployer.address));
  });

  it('should mint tokens to recipient correctly', async () => {
    // First initialize
    simnet.callPublicFn('token', 'initialize', [principalCV(deployer.address)], deployer.address);

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
      deployer.address
    );

    const { result } = simnet.callPublicFn(
      'token',
      'mint',
      [uintCV(101), principalCV(user1.address), uintCV(1000000)],
      deployer.address
    );
    expect(result).toBe('(ok true)');

    const balanceResult = simnet.callReadOnlyFn(
      'token',
      'get-balance',
      [uintCV(101), principalCV(user1.address)],
      deployer.address
    );
    expect(balanceResult.result).toBe('(ok u1000000)');
  });

  it('should transfer tokens between users correctly', async () => {
    // Setup: Initialize and mint to user1
    simnet.callPublicFn('token', 'initialize', [principalCV(deployer.address)], deployer.address);
    simnet.callPublicFn('token', 'initialize-token', [uintCV(1), uintCV(101), uintCV(102), stringAsciiCV('Y'), stringAsciiCV('N'), stringAsciiCV('Y'), stringAsciiCV('N')], deployer.address);
    simnet.callPublicFn('token', 'mint', [uintCV(101), principalCV(user1.address), uintCV(1000000)], deployer.address);

    const { result } = simnet.callPublicFn(
      'token',
      'transfer',
      [uintCV(101), uintCV(400000), principalCV(user1.address), principalCV(user2.address)],
      user1.address
    );
    expect(result).toBe('(ok true)');

    const user1Balance = simnet.callReadOnlyFn('token', 'get-balance', [uintCV(101), principalCV(user1.address)], deployer.address);
    const user2Balance = simnet.callReadOnlyFn('token', 'get-balance', [uintCV(101), principalCV(user2.address)], deployer.address);

    expect(user1Balance.result).toBe('(ok u600000)');
    expect(user2Balance.result).toBe('(ok u400000)');
  });

  it('should fail to transfer more than balance', async () => {
    simnet.callPublicFn('token', 'initialize', [principalCV(deployer.address)], deployer.address);
    simnet.callPublicFn('token', 'initialize-token', [uintCV(1), uintCV(101), uintCV(102), stringAsciiCV('Y'), stringAsciiCV('N'), stringAsciiCV('Y'), stringAsciiCV('N')], deployer.address);
    simnet.callPublicFn('token', 'mint', [uintCV(101), principalCV(user1.address), uintCV(100000)], deployer.address);

    const { result } = simnet.callPublicFn(
      'token',
      'transfer',
      [uintCV(101), uintCV(150000), principalCV(user1.address), principalCV(user2.address)],
      user1.address
    );
    expect(result).toBe('(err u1004)'); // ERR_INSUFFICIENT_BALANCE
  });

  it('should only allow owner to mint tokens', async () => {
    simnet.callPublicFn('token', 'initialize', [principalCV(deployer.address)], deployer.address);

    const { result } = simnet.callPublicFn(
      'token',
      'mint',
      [uintCV(101), principalCV(user1.address), uintCV(1000000)],
      user1.address // Not owner
    );
    expect(result).toBe('(err u1001)'); // ERR_UNAUTHORIZED
  });

  it('should only allow owner to burn tokens', async () => {
    simnet.callPublicFn('token', 'initialize', [principalCV(deployer.address)], deployer.address);
    simnet.callPublicFn('token', 'initialize-token', [uintCV(1), uintCV(101), uintCV(102), stringAsciiCV('Y'), stringAsciiCV('N'), stringAsciiCV('Y'), stringAsciiCV('N')], deployer.address);
    simnet.callPublicFn('token', 'mint', [uintCV(101), principalCV(user1.address), uintCV(1000000)], deployer.address);

    const { result } = simnet.callPublicFn(
      'token',
      'burn',
      [uintCV(101), principalCV(user1.address), uintCV(500000)],
      user1.address // Not owner
    );
    expect(result).toBe('(err u1001)');
  });
});








