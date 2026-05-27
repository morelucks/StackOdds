import { describe, it, expect, beforeEach } from 'vitest';
import { uintCV, principalCV, stringAsciiCV } from '@stacks/transactions';
import {
  getAccounts,
  TOKEN_ERRORS,
  ok,
  err,
  okTrue,
  okUint,
  initializeTokenPair,
  mintTokens,
  type TestAccounts,
} from './utils';

// @ts-ignore - simnet is provided by vitest-environment-clarinet
declare const simnet: any;

describe('Token Contract', () => {
  let accounts: TestAccounts;

  beforeEach(() => {
    accounts = getAccounts(simnet);
  });

  // ─── Initialization ────────────────────────────────────────────────────────

  describe('initialize', () => {
    it('sets the contract owner', () => {
      const { result } = simnet.callPublicFn(
        'token',
        'initialize',
        [principalCV(accounts.deployer)],
        accounts.deployer,
      );
      expect(result).toEqual(okTrue());

      const ownerResult = simnet.callReadOnlyFn('token', 'get-contract-owner', [], accounts.deployer);
      expect(ownerResult.result).toEqual(ok({ type: 'address', value: accounts.deployer }));
    });

    it('rejects initialization from a non-deployer principal', () => {
      const { result } = simnet.callPublicFn(
        'token',
        'initialize',
        [principalCV(accounts.user1)],
        accounts.user1,
      );
      expect(result).toEqual(err(TOKEN_ERRORS.UNAUTHORIZED));
    });
  });

  // ─── Minting ───────────────────────────────────────────────────────────────

  describe('mint', () => {
    beforeEach(() => {
      simnet.callPublicFn('token', 'initialize', [principalCV(accounts.deployer)], accounts.deployer);
      initializeTokenPair(simnet, accounts.deployer, {
        marketId: 1,
        yesTokenId: 101,
        noTokenId: 102,
        yesName: 'Market 1 YES',
        noName: 'Market 1 NO',
        yesSymbol: 'M1Y',
        noSymbol: 'M1N',
      });
    });

    it('mints tokens to a recipient', () => {
      const { result } = simnet.callPublicFn(
        'token',
        'mint',
        [uintCV(101), principalCV(accounts.user1), uintCV(1_000_000)],
        accounts.deployer,
      );
      expect(result).toEqual(okTrue());

      const balance = simnet.callReadOnlyFn(
        'token',
        'get-balance',
        [uintCV(101), principalCV(accounts.user1)],
        accounts.deployer,
      );
      expect(balance.result).toEqual(okUint(1_000_000n));
    });

    it('rejects minting from a non-owner', () => {
      const { result } = simnet.callPublicFn(
        'token',
        'mint',
        [uintCV(101), principalCV(accounts.user1), uintCV(1_000_000)],
        accounts.user1,
      );
      expect(result).toEqual(err(TOKEN_ERRORS.UNAUTHORIZED));
    });
  });

  // ─── Transfers ─────────────────────────────────────────────────────────────

  describe('transfer', () => {
    beforeEach(() => {
      simnet.callPublicFn('token', 'initialize', [principalCV(accounts.deployer)], accounts.deployer);
      initializeTokenPair(simnet, accounts.deployer, {
        marketId: 1,
        yesTokenId: 101,
        noTokenId: 102,
      });
      mintTokens(simnet, accounts.deployer, 101, accounts.user1, 1_000_000n);
    });

    it('transfers tokens between users', () => {
      const { result } = simnet.callPublicFn(
        'token',
        'transfer',
        [uintCV(101), uintCV(400_000), principalCV(accounts.user1), principalCV(accounts.user2)],
        accounts.user1,
      );
      expect(result).toEqual(okTrue());

      const user1Balance = simnet.callReadOnlyFn(
        'token', 'get-balance', [uintCV(101), principalCV(accounts.user1)], accounts.deployer,
      );
      const user2Balance = simnet.callReadOnlyFn(
        'token', 'get-balance', [uintCV(101), principalCV(accounts.user2)], accounts.deployer,
      );

      expect(user1Balance.result).toEqual(okUint(600_000n));
      expect(user2Balance.result).toEqual(okUint(400_000n));
    });

    it('rejects transfer exceeding balance', () => {
      mintTokens(simnet, accounts.deployer, 101, accounts.user1, 100_000n);
      // user1 has 1_100_000 total; try to send 1_200_000
      const { result } = simnet.callPublicFn(
        'token',
        'transfer',
        [uintCV(101), uintCV(1_200_000), principalCV(accounts.user1), principalCV(accounts.user2)],
        accounts.user1,
      );
      expect(result).toEqual(err(TOKEN_ERRORS.INSUFFICIENT_BALANCE));
    });
  });

  // ─── Burning ───────────────────────────────────────────────────────────────

  describe('burn', () => {
    beforeEach(() => {
      simnet.callPublicFn('token', 'initialize', [principalCV(accounts.deployer)], accounts.deployer);
      initializeTokenPair(simnet, accounts.deployer, {
        marketId: 1,
        yesTokenId: 101,
        noTokenId: 102,
      });
      mintTokens(simnet, accounts.deployer, 101, accounts.user1, 1_000_000n);
    });

    it('allows owner to burn tokens', () => {
      const { result } = simnet.callPublicFn(
        'token',
        'burn',
        [uintCV(101), principalCV(accounts.user1), uintCV(400_000)],
        accounts.deployer,
      );
      expect(result).toEqual(okTrue());

      const balance = simnet.callReadOnlyFn(
        'token', 'get-balance', [uintCV(101), principalCV(accounts.user1)], accounts.deployer,
      );
      expect(balance.result).toEqual(okUint(600_000n));
    });

    it('rejects burn from a non-owner', () => {
      const { result } = simnet.callPublicFn(
        'token',
        'burn',
        [uintCV(101), principalCV(accounts.user1), uintCV(500_000)],
        accounts.user1,
      );
      expect(result).toEqual(err(TOKEN_ERRORS.UNAUTHORIZED));
    });
  });

  // ─── Token Metadata ────────────────────────────────────────────────────────

  describe('initialize-token', () => {
    beforeEach(() => {
      simnet.callPublicFn('token', 'initialize', [principalCV(accounts.deployer)], accounts.deployer);
    });

    it('rejects re-initialization of the same market token', () => {
      initializeTokenPair(simnet, accounts.deployer, {
        marketId: 1, yesTokenId: 101, noTokenId: 102,
      });

      const { result } = simnet.callPublicFn(
        'token',
        'initialize-token',
        [
          uintCV(1), uintCV(101), uintCV(102),
          stringAsciiCV('Y'), stringAsciiCV('N'),
          stringAsciiCV('Y'), stringAsciiCV('N'),
        ],
        accounts.deployer,
      );
      expect(result.type).toBe('err');
    });

    it('tracks metadata across multiple markets', () => {
      initializeTokenPair(simnet, accounts.deployer, {
        marketId: 1, yesTokenId: 101, noTokenId: 102,
        yesName: 'M1 YES', noName: 'M1 NO', yesSymbol: 'M1Y', noSymbol: 'M1N',
      });
      initializeTokenPair(simnet, accounts.deployer, {
        marketId: 2, yesTokenId: 201, noTokenId: 202,
        yesName: 'M2 YES', noName: 'M2 NO', yesSymbol: 'M2Y', noSymbol: 'M2N',
      });

      const m1Name = simnet.callReadOnlyFn('token', 'get-name', [uintCV(101)], accounts.deployer);
      const m2Name = simnet.callReadOnlyFn('token', 'get-name', [uintCV(201)], accounts.deployer);

      expect(m1Name.result.value.value).toContain('M1 YES');
      expect(m2Name.result.value.value).toContain('M2 YES');
    });
  });
});
