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
});








